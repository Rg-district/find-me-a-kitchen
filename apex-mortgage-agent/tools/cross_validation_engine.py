"""
Cross-document validation engine — compares declared income, bank statement
evidence, payslip evidence, and credit report adverse-credit signals to
surface discrepancies a consultant needs to resolve before submission.
"""
from __future__ import annotations


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
    income, focused on income consistency and adverse-credit consistency.
    """
    declared = float(client.get("declared_income", 0) or 0)

    bank_income = None
    if bank_analysis:
        bank_income = float((bank_analysis.get("income_analysis") or {}).get("total_average_monthly_income", 0) or 0)

    payslip_income = None
    if payslip_analysis:
        payslip_income = float((payslip_analysis.get("net_pay") or {}).get("monthly_net_equivalent", 0) or 0)

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

    # ── Employer / salary description consistency (best-effort text match) ──
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
        tokens = [t.lower() for t in employer_name.split() if len(t) > 2]
        employer_match = any(
            any(tok in desc.lower() for tok in tokens)
            for desc in salary_credit_descriptions
        )

    # ── Adverse credit cross-check between bank statement and credit report ─
    cross_notes = []
    if bank_analysis and credit_data:
        bank_payday = (bank_analysis.get("red_flags") or {}).get("payday_loans", {}) or {}
        credit_payday_accounts = [a for a in (credit_data.get("accounts") or []) if a.get("is_payday_lender")]
        if bank_payday.get("detected") and not credit_payday_accounts:
            cross_notes.append({
                "type": "payday_not_on_credit_report",
                "label": "Payday Activity on Bank Statement Not Reflected on Credit Report",
                "detail": "Bank statement shows payday lender transactions, but no payday loan account appears on the credit report. May be settled/removed, or with a lender not reporting to this bureau — confirm with client.",
                "severity": "medium",
            })
        if credit_payday_accounts and not bank_payday.get("detected"):
            cross_notes.append({
                "type": "payday_on_credit_report_only",
                "label": "Payday Loan on Credit Report Not Seen on Bank Statement",
                "detail": "Credit report shows payday loan account(s) not visible on the supplied bank statement — the statement period may predate the loan, or repayments may run from a different account.",
                "severity": "low",
            })

        bank_dd = (bank_analysis.get("red_flags") or {}).get("returned_direct_debits", {}) or {}
        in_arrears = [a for a in (credit_data.get("accounts") or []) if a.get("is_in_arrears")]
        if (bank_dd.get("count") or 0) > 0 and not in_arrears:
            cross_notes.append({
                "type": "returned_dd_not_in_arrears",
                "label": "Returned Direct Debits Not Reflected as Arrears on Credit Report",
                "detail": "Bank statement shows returned/failed direct debits, but no accounts show as in arrears on the credit report — may not yet have been reported. Confirm the position is now current.",
                "severity": "medium",
            })

    docs_available = {
        "bank_statement": bank_analysis is not None,
        "payslip": payslip_analysis is not None,
        "credit_report": credit_data is not None,
    }
    missing = [k.replace("_", " ") for k, v in docs_available.items() if not v]

    credit_critical = (credit_validation or {}).get("critical_count", 0) or 0
    cross_critical = sum(1 for n in cross_notes if n["severity"] == "critical")
    cross_high = sum(1 for n in cross_notes if n["severity"] == "high")

    if overall_income_severity == "critical" or credit_critical > 0 or cross_critical > 0:
        overall_risk = "critical"
    elif overall_income_severity == "moderate" or cross_high > 0:
        overall_risk = "high"
    elif overall_income_severity == "minor" or cross_notes:
        overall_risk = "medium"
    else:
        overall_risk = "low"

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
    for n in cross_notes:
        if n["severity"] in ("medium", "high", "critical"):
            actions.append(n["detail"])
    if missing:
        actions.append(f"Upload missing document(s) for a complete picture: {', '.join(missing)}")

    return {
        "income_comparison": {
            "sources": dict(income_sources),
            "pairs": pairs,
            "overall_severity": overall_income_severity,
        },
        "employer_consistency": {
            "payslip_employer_name": employer_name,
            "salary_credit_descriptions": salary_credit_descriptions,
            "matched": employer_match,
        },
        "adverse_credit_cross_check": cross_notes,
        "documents_available": docs_available,
        "missing_documents": missing,
        "overall_risk_rating": overall_risk,
        "consultant_actions": actions,
    }
