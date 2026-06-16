"""
Cross-document validation engine — compares declared income, bank statement
evidence, payslip evidence, and credit report adverse-credit signals to
surface discrepancies a consultant needs to resolve before submission.
"""
from __future__ import annotations

import re


def _pct_delta(base: float, other: float) -> float:
    """Percentage difference of `other` relative to `base`."""
    if base == 0:
        return 0.0
    return (other - base) / base * 100


def _severity_for_pct(abs_pct: float) -> tuple[str, str]:
    if abs_pct <= 5:
        return "none", "Consistent"
    if abs_pct <= 15:
        return "minor", "Minor Variance"
    if abs_pct <= 25:
        return "moderate", "Moderate Variance"
    return "critical", "Critical Variance"


_SEVERITY_RANK = {"none": 0, "minor": 1, "low": 1, "medium": 2, "moderate": 2, "high": 3, "critical": 4}


def _tokens(s: str | None) -> set[str]:
    return set(re.findall(r"[a-z]+", (s or "").lower())) - {
        "ltd", "limited", "plc", "the", "and", "of", "co", "company", "uk",
    }


def _names_overlap(a: str | None, b: str | None) -> bool | None:
    ta, tb = _tokens(a), _tokens(b)
    if not ta or not tb:
        return None
    return bool(ta & tb)


def _amount_close(a: float | None, b: float | None, abs_tol: float = 15.0, pct_tol: float = 0.15) -> bool:
    if a is None or b is None:
        return False
    if a == 0 and b == 0:
        return True
    tol = max(abs_tol, pct_tol * max(abs(a), abs(b)))
    return abs(a - b) <= tol


def _fmt_gbp(v: float | None) -> str:
    if v is None:
        return "N/A"
    return f"£{v:,.0f}"


def cross_validate_documents(
    client: dict,
    bank_analysis: dict | None,
    payslip_analysis: dict | None,
    credit_data: dict | None,
    credit_validation: dict | None,
) -> dict:
    """
    Build a unified discrepancy report across the three uploaded documents
    (bank statement, payslip, credit report) and the client's declared
    information — income, identity, employment, debt commitments, and
    adverse-credit history — for a single consultant-facing cross-check.
    """
    declared = float(client.get("declared_income", 0) or 0)
    adverse = client.get("adverse_history", {}) or {}

    bank_income = None
    if bank_analysis:
        bank_income = float((bank_analysis.get("income_analysis") or {}).get("total_average_monthly_income", 0) or 0)

    payslip_income = None
    if payslip_analysis:
        payslip_income = float((payslip_analysis.get("net_pay") or {}).get("monthly_net_equivalent", 0) or 0)

    # ── Income comparison (declared vs bank statement vs payslip) ───────────
    income_sources = [("declared", declared)]
    if bank_income is not None:
        income_sources.append(("bank_statement", bank_income))
    if payslip_income is not None:
        income_sources.append(("payslip", payslip_income))

    pairs = []
    for i in range(len(income_sources)):
        for j in range(i + 1, len(income_sources)):
            label_a, val_a = income_sources[i]
            label_b, val_b = income_sources[j]
            pct = _pct_delta(val_a, val_b)
            severity, severity_label = _severity_for_pct(abs(pct))
            pairs.append({
                "pair": f"{label_a}_vs_{label_b}",
                "value_a": val_a,
                "value_b": val_b,
                "delta_gbp": val_b - val_a,
                "delta_pct": pct,
                "severity": severity,
                "severity_label": severity_label,
            })

    overall_income_severity = "none"
    for p in pairs:
        if _SEVERITY_RANK[p["severity"]] > _SEVERITY_RANK[overall_income_severity]:
            overall_income_severity = p["severity"]

    # ── Identity consistency (name & address across documents) ──────────────
    client_name = client.get("name")
    payslip_employee_name = (payslip_analysis or {}).get("employer", {}).get("employee_name") if payslip_analysis else None
    credit_name = (credit_data or {}).get("personal_details", {}).get("name_on_report") if credit_data else None

    name_pairs = {
        "client_vs_payslip": _names_overlap(client_name, payslip_employee_name),
        "client_vs_credit_report": _names_overlap(client_name, credit_name),
        "payslip_vs_credit_report": _names_overlap(payslip_employee_name, credit_name),
    }
    name_mismatch = any(v is False for v in name_pairs.values())

    client_address_parts = [
        client.get("address_line1"), client.get("address_line2"),
        client.get("city"), client.get("postcode"),
    ]
    client_address = ", ".join(p for p in client_address_parts if p) or None

    credit_current_address = None
    if credit_data:
        for a in (credit_data.get("personal_details", {}) or {}).get("addresses", []) or []:
            if a.get("current"):
                credit_current_address = a.get("address")
                break
        if not credit_current_address:
            addrs = (credit_data.get("personal_details", {}) or {}).get("addresses", []) or []
            if addrs:
                credit_current_address = addrs[0].get("address")

    address_match = None
    if client_address and credit_current_address:
        client_postcode = (client.get("postcode") or "").lower().replace(" ", "")
        if client_postcode:
            address_match = client_postcode in credit_current_address.lower().replace(" ", "")
        else:
            address_match = _names_overlap(client_address, credit_current_address)

    personal_details_consistency = {
        "client_record_name": client_name,
        "payslip_employee_name": payslip_employee_name,
        "credit_report_name": credit_name,
        "name_matches": name_pairs,
        "name_mismatch_detected": name_mismatch,
        "client_record_address": client_address,
        "credit_report_current_address": credit_current_address,
        "address_matched": address_match,
    }

    # ── Employer / employment consistency ────────────────────────────────────
    employer_name = None
    if payslip_analysis:
        employer_name = (payslip_analysis.get("employer") or {}).get("name")

    salary_credit_descriptions = []
    if bank_analysis:
        for c in (bank_analysis.get("income_analysis") or {}).get("credits_identified", []) or []:
            if (c.get("category") or "").lower() == "salary":
                salary_credit_descriptions.append(c.get("description", ""))

    employer_match = None
    if employer_name and salary_credit_descriptions:
        tokens = _tokens(employer_name)
        employer_match = any(bool(tokens & _tokens(desc)) for desc in salary_credit_descriptions)

    declared_employment_type = client.get("employment_type")
    employment_type_note = None
    if payslip_analysis and declared_employment_type == "self_employed":
        employment_type_note = (
            "Client declared self-employed, but a PAYE payslip has been uploaded — confirm whether this is a "
            "secondary employment or whether employment status should be corrected before submission."
        )
    elif declared_employment_type == "employed" and payslip_analysis:
        deductions = payslip_analysis.get("deductions", {}) or {}
        if not (deductions.get("income_tax") or deductions.get("national_insurance")):
            employment_type_note = (
                "Payslip shows no PAYE income tax or National Insurance deducted — verify this is a genuine "
                "employed payslip and not a director's/dividend payment mislabelled as salary."
            )

    employer_consistency = {
        "payslip_employer_name": employer_name,
        "salary_credit_descriptions": salary_credit_descriptions,
        "matched": employer_match,
        "declared_employment_type": declared_employment_type,
        "employment_type_note": employment_type_note,
    }

    # ── Debt & commitment reconciliation (bank statement vs credit report) ──
    debt_commitment_reconciliation = None
    if bank_analysis and credit_data:
        debt_categories = {"personal_loan", "car_finance", "credit_card"}
        bank_debts = [
            c for c in (bank_analysis.get("expenditure_analysis", {}) or {}).get("fixed_commitments", []) or []
            if (c.get("category") or "").lower() in debt_categories
        ]
        credit_debts = [
            a for a in (credit_data.get("accounts") or [])
            if (a.get("status") or "").lower() in ("open", "defaulted")
            and (a.get("monthly_payment") or 0) > 0
        ]

        matched = []
        matched_bank_idx = set()
        matched_credit_idx = set()

        # Score every bank-debt/credit-account pair, then assign greedily by
        # descending score so a strong name match always wins over a weaker
        # amount-only coincidence, regardless of list order.
        candidates = []
        for bi, bd in enumerate(bank_debts):
            for ci, cd in enumerate(credit_debts):
                name_overlap = bool(_names_overlap(bd.get("description"), cd.get("creditor")))
                amt_close = _amount_close(bd.get("monthly_amount"), cd.get("monthly_payment"))
                if not (name_overlap or amt_close):
                    continue
                score = (2 if name_overlap else 0) + (1 if amt_close else 0)
                candidates.append((score, bi, ci))
        candidates.sort(key=lambda c: c[0], reverse=True)

        for score, bi, ci in candidates:
            if bi in matched_bank_idx or ci in matched_credit_idx:
                continue
            matched_bank_idx.add(bi)
            matched_credit_idx.add(ci)
            bd, cd = bank_debts[bi], credit_debts[ci]
            matched.append({
                "bank_description": bd.get("description"),
                "bank_monthly_amount": bd.get("monthly_amount"),
                "credit_creditor": cd.get("creditor"),
                "credit_monthly_payment": cd.get("monthly_payment"),
                "credit_status": cd.get("status"),
                "confidence": "high" if score >= 2 else "tentative",
            })

        bank_only = [bd for bi, bd in enumerate(bank_debts) if bi not in matched_bank_idx]
        credit_only = [cd for ci, cd in enumerate(credit_debts) if ci not in matched_credit_idx]

        debt_commitment_reconciliation = {
            "matched": matched,
            "bank_only": bank_only,
            "credit_only": credit_only,
        }

    # ── Adverse credit signal matrix (declared vs bank vs credit report) ────
    bank_red_flags = (bank_analysis.get("red_flags") or {}) if bank_analysis else {}
    pub_records = (credit_data.get("adverse_public_records") or {}) if credit_data else {}
    credit_accounts = (credit_data.get("accounts") or []) if credit_data else []

    payday_accounts = [a for a in credit_accounts if a.get("is_payday_lender")]
    ccjs_found = pub_records.get("ccjs", []) or []
    defaults_found = pub_records.get("defaults", []) or []
    iva_found = bool((pub_records.get("iva") or {}).get("present"))
    bk_found = bool((pub_records.get("bankruptcy") or {}).get("present"))
    dmp_found = bool((pub_records.get("dmp") or {}).get("present"))
    in_arrears_accounts = [a for a in credit_accounts if a.get("is_in_arrears")]

    def _row(key, label, declared_val, bank_val, credit_val, evidence_detail):
        evidences = [v for v in (bank_val, credit_val) if v is not None]
        any_evidence = any(evidences)
        if declared_val is True and any_evidence:
            status, severity = "confirmed", "none"
        elif declared_val is True and evidences and not any_evidence:
            status, severity = "not_on_report", "low"
        elif declared_val in (False, None) and any_evidence:
            status, severity = "undisclosed", "critical"
        else:
            status, severity = "clean", "none"
        return {
            "key": key,
            "label": label,
            "declared": declared_val,
            "bank_evidence": bank_val,
            "credit_evidence": credit_val,
            "status": status,
            "severity": severity,
            "detail": evidence_detail,
        }

    adverse_signal_matrix = []

    payday_bank_evidence = bool((bank_red_flags.get("payday_loans") or {}).get("detected")) if bank_analysis else None
    payday_credit_evidence = bool(payday_accounts) if credit_data else None
    payday_lenders = list({a.get("creditor", "?") for a in payday_accounts}) if payday_accounts else []
    payday_lenders += (bank_red_flags.get("payday_loans") or {}).get("lenders_identified", []) or []
    adverse_signal_matrix.append(_row(
        "payday_loans", "Payday Loan History", bool(adverse.get("payday_loans")),
        payday_bank_evidence, payday_credit_evidence,
        f"Lenders seen: {', '.join(sorted(set(payday_lenders)))}" if payday_lenders else None,
    ))

    adverse_signal_matrix.append(_row(
        "ccj", "County Court Judgment (CCJ)", bool(adverse.get("ccj")),
        None, bool(ccjs_found) if credit_data else None,
        f"{len(ccjs_found)} CCJ(s) on report" if ccjs_found else None,
    ))

    adverse_signal_matrix.append(_row(
        "default", "Default", bool(adverse.get("default")),
        None, bool(defaults_found) if credit_data else None,
        f"{len(defaults_found)} default(s) on report" if defaults_found else None,
    ))

    adverse_signal_matrix.append(_row(
        "iva", "IVA", bool(adverse.get("iva")),
        None, iva_found if credit_data else None, None,
    ))

    adverse_signal_matrix.append(_row(
        "bankruptcy", "Bankruptcy", bool(adverse.get("bankruptcy")),
        None, bk_found if credit_data else None, None,
    ))

    adverse_signal_matrix.append(_row(
        "dmp", "Debt Management Plan", bool(adverse.get("dmp")),
        None, dmp_found if credit_data else None, None,
    ))

    # Arrears / missed payments — no declared field, just bank vs credit report
    missed = (bank_red_flags.get("missed_payments") or {}).get("detected") if bank_analysis else None
    returned_dd_count = (bank_red_flags.get("returned_direct_debits") or {}).get("count", 0) if bank_analysis else None
    arrears_bank_evidence = None
    if bank_analysis:
        arrears_bank_evidence = bool(missed) or bool(returned_dd_count and returned_dd_count > 0)
    arrears_credit_evidence = bool(in_arrears_accounts) if credit_data else None
    if arrears_bank_evidence and arrears_credit_evidence:
        arrears_status, arrears_severity = "confirmed", "none"
    elif arrears_bank_evidence and not arrears_credit_evidence:
        arrears_status, arrears_severity = "bank_only", "medium"
    elif arrears_credit_evidence and not arrears_bank_evidence:
        arrears_status, arrears_severity = "credit_only", "low"
    else:
        arrears_status, arrears_severity = "clean", "none"
    adverse_signal_matrix.append({
        "key": "arrears",
        "label": "Arrears / Missed Payments",
        "declared": None,
        "bank_evidence": arrears_bank_evidence,
        "credit_evidence": arrears_credit_evidence,
        "status": arrears_status,
        "severity": arrears_severity,
        "detail": (
            f"{len(in_arrears_accounts)} account(s) in arrears on report" if in_arrears_accounts else None
        ),
    })

    cross_critical = sum(1 for r in adverse_signal_matrix if r["severity"] == "critical")
    cross_high = sum(1 for r in adverse_signal_matrix if r["severity"] == "high")

    # ── Affordability cross-check (bank DTI adjusted for uncaptured credit commitments) ──
    affordability_cross_check = None
    if bank_analysis and credit_data:
        aff = bank_analysis.get("affordability_indicators", {}) or {}
        bank_net_disposable = float(aff.get("net_disposable_income_monthly", 0) or 0)
        bank_dti = float(aff.get("debt_to_income_ratio", 0) or 0)
        bank_fixed_monthly = float((bank_analysis.get("expenditure_analysis", {}) or {}).get("total_fixed_monthly", 0) or 0)

        uncaptured_monthly = sum(
            cd.get("monthly_payment", 0) or 0
            for cd in (debt_commitment_reconciliation or {}).get("credit_only", [])
        )
        income_for_dti = bank_income if bank_income else declared
        adjusted_fixed = bank_fixed_monthly + uncaptured_monthly
        adjusted_dti = (adjusted_fixed / income_for_dti * 100) if income_for_dti else None
        adjusted_disposable = bank_net_disposable - uncaptured_monthly

        affordability_cross_check = {
            "bank_net_disposable_income": bank_net_disposable,
            "bank_debt_to_income_ratio": bank_dti,
            "uncaptured_monthly_commitments": uncaptured_monthly,
            "adjusted_debt_to_income_ratio": adjusted_dti,
            "adjusted_net_disposable_income": adjusted_disposable,
            "note": (
                f"Credit report shows {_fmt_gbp(uncaptured_monthly)}/month in commitments not visible on the "
                "supplied bank statement — may be paid from a different account, or the commitment started "
                "after the statement period. True affordability may be tighter than the bank statement alone suggests."
                if uncaptured_monthly > 0 else
                "All credit report commitments with a monthly payment are reflected in the bank statement's fixed outgoings."
            ),
        }

    # ── Overall document coverage / risk rating ──────────────────────────────
    docs_available = {
        "bank_statement": bank_analysis is not None,
        "payslip": payslip_analysis is not None,
        "credit_report": credit_data is not None,
    }
    missing = [k.replace("_", " ") for k, v in docs_available.items() if not v]

    credit_critical = (credit_validation or {}).get("critical_count", 0) or 0

    if overall_income_severity == "critical" or credit_critical > 0 or cross_critical > 0 or name_mismatch:
        overall_risk = "critical"
    elif overall_income_severity == "moderate" or cross_high > 0 or address_match is False:
        overall_risk = "high"
    elif overall_income_severity == "minor" or any(r["severity"] in ("low", "medium") for r in adverse_signal_matrix):
        overall_risk = "medium"
    else:
        overall_risk = "low"

    # ── Consultant actions ────────────────────────────────────────────────────
    label_map = {"declared": "Declared Income", "bank_statement": "Bank Statement", "payslip": "Payslip"}
    actions = []
    for p in pairs:
        if p["severity"] in ("moderate", "critical"):
            a, b = p["pair"].split("_vs_")
            actions.append(
                f"Reconcile {label_map.get(a, a)} vs {label_map.get(b, b)} income variance of "
                f"{p['delta_pct']:.1f}% before submission — request supporting evidence."
            )
    if employer_match is False:
        actions.append(
            f"Payslip employer ({employer_name}) was not found in the bank statement's salary credit "
            "descriptions — confirm salary is paid into the supplied account."
        )
    if employment_type_note:
        actions.append(employment_type_note)
    if name_mismatch:
        actions.append(
            "Name does not consistently match across documents — verify identity documents and check for "
            "aliases, maiden names, or a data-entry error before proceeding."
        )
    if address_match is False:
        actions.append(
            "Client's current address does not match the address held on the credit report — confirm this "
            "is a recent house move and request proof of address."
        )
    if debt_commitment_reconciliation:
        for bd in debt_commitment_reconciliation["bank_only"]:
            actions.append(
                f"Bank statement shows a debt repayment ('{bd.get('description')}', "
                f"{_fmt_gbp(bd.get('monthly_amount'))}/month) with no matching account on the credit report — "
                "confirm this is genuine and check it isn't an undisclosed informal/family loan."
            )
        for cd in debt_commitment_reconciliation["credit_only"]:
            actions.append(
                f"Credit report shows an active {cd.get('account_type', 'account')} with {cd.get('creditor', 'unknown creditor')} "
                f"({_fmt_gbp(cd.get('monthly_payment'))}/month) not visible on the supplied bank statement — "
                "confirm it is being paid and from which account."
            )
    for r in adverse_signal_matrix:
        if r["status"] == "undisclosed":
            actions.append(
                f"Undisclosed {r['label']} found via cross-check ({r['detail'] or 'see credit/bank evidence'}) — "
                "discuss with client and update the file immediately."
            )
        elif r["status"] == "bank_only" and r["key"] == "arrears":
            actions.append(
                "Bank statement shows returned payments or missed payments not yet reflected as arrears on the "
                "credit report — confirm the position is now current."
            )
    if affordability_cross_check and affordability_cross_check["uncaptured_monthly_commitments"] > 0:
        actions.append(
            f"Add {_fmt_gbp(affordability_cross_check['uncaptured_monthly_commitments'])}/month of credit report "
            "commitments not seen on the bank statement to the affordability assessment."
        )
    if missing:
        actions.append(f"Upload missing document(s) for a complete picture: {', '.join(missing)}")

    # ── Executive summary narrative ──────────────────────────────────────────
    summary_sentences = []
    client_name_str = client_name or "The client"
    if pairs:
        worst_pair = max(pairs, key=lambda p: abs(p["delta_pct"]))
        if worst_pair["severity"] in ("moderate", "critical"):
            a, b = worst_pair["pair"].split("_vs_")
            summary_sentences.append(
                f"{client_name_str} declared a monthly income of {_fmt_gbp(declared)}, but "
                f"{label_map.get(b, b).lower()} evidence shows {_fmt_gbp(worst_pair['value_b'])} "
                f"({worst_pair['delta_pct']:+.1f}%) — a {worst_pair['severity']} variance that should be "
                "resolved before submission."
            )
        else:
            summary_sentences.append(
                f"{client_name_str}'s declared income of {_fmt_gbp(declared)} is broadly consistent with "
                "the available verified income sources."
            )
    if employer_match is True:
        summary_sentences.append(f"Employer name '{employer_name}' is consistent across the payslip and bank statement.")
    elif employer_match is False:
        summary_sentences.append(f"Employer name '{employer_name}' could not be matched to the bank statement's salary credits.")
    if name_mismatch:
        summary_sentences.append("Personal name does not match consistently across the uploaded documents.")
    if debt_commitment_reconciliation:
        if debt_commitment_reconciliation["bank_only"]:
            summary_sentences.append(
                f"{len(debt_commitment_reconciliation['bank_only'])} bank statement debt repayment(s) could not be matched to the credit report."
            )
        if debt_commitment_reconciliation["credit_only"]:
            summary_sentences.append(
                f"{len(debt_commitment_reconciliation['credit_only'])} active credit report commitment(s) are not visible on the bank statement."
            )
    undisclosed_rows = [r for r in adverse_signal_matrix if r["status"] == "undisclosed"]
    if undisclosed_rows:
        summary_sentences.append(
            "Undisclosed adverse credit signal(s) found: " + ", ".join(r["label"] for r in undisclosed_rows) + "."
        )
    if missing:
        summary_sentences.append(f"Still missing for a complete picture: {', '.join(missing)}.")
    summary_sentences.append(f"Overall cross-check risk rating: {overall_risk.upper()}.")
    executive_summary = " ".join(summary_sentences)

    return {
        "executive_summary": executive_summary,
        "income_comparison": {
            "sources": dict(income_sources),
            "pairs": pairs,
            "overall_severity": overall_income_severity,
        },
        "personal_details_consistency": personal_details_consistency,
        "employer_consistency": employer_consistency,
        "debt_commitment_reconciliation": debt_commitment_reconciliation,
        "adverse_signal_matrix": adverse_signal_matrix,
        "adverse_credit_cross_check": [
            {
                "type": r["key"],
                "label": r["label"],
                "detail": r["detail"] or "",
                "severity": r["severity"],
            }
            for r in adverse_signal_matrix if r["status"] in ("undisclosed", "bank_only", "credit_only", "not_on_report")
        ],
        "affordability_cross_check": affordability_cross_check,
        "documents_available": docs_available,
        "missing_documents": missing,
        "overall_risk_rating": overall_risk,
        "consultant_actions": actions,
    }
