"""Income & expenditure cross-validation engine — FCA MCOB declared vs verified comparison."""
from __future__ import annotations


def compute_discrepancy(client: dict, analysis: dict) -> dict:
    """
    Cross-validate declared income against bank statement evidence and compute
    a structured discrepancy report for the consultant.
    """
    declared = float(client.get("declared_income", 0) or 0)

    income_analysis = analysis.get("income_analysis", {})
    verified = float(income_analysis.get("total_average_monthly_income", 0) or 0)

    delta = verified - declared
    delta_pct = ((verified - declared) / declared * 100) if declared > 0 else 0
    abs_pct = abs(delta_pct)

    if abs_pct <= 5:
        severity = "none"
        severity_label = "Matches Declaration"
        severity_colour = "green"
    elif abs_pct <= 15:
        severity = "minor"
        severity_label = "Minor Variance"
        severity_colour = "amber"
    elif abs_pct <= 25:
        severity = "moderate"
        severity_label = "Moderate Variance — Note for Underwriter"
        severity_colour = "orange"
    else:
        severity = "critical"
        severity_label = "Critical — Potential Misrepresentation"
        severity_colour = "red"

    if delta >= 0:
        direction = "understated"
        direction_note = (
            "Client declared LESS than bank statement shows. This is acceptable "
            "and may indicate bonuses, overtime, or conservatism in declaration."
        )
    else:
        direction = "overstated"
        direction_note = (
            "Client declared MORE than bank statement shows. This is a red flag "
            "that must be reconciled with documentary evidence before submission."
        )

    exp = analysis.get("expenditure_analysis", {})
    total_fixed = float(exp.get("total_fixed_monthly", 0) or 0)
    total_variable = float(exp.get("total_variable_monthly_avg", 0) or 0)
    total_outgoings = float(exp.get("total_monthly_outgoings_avg", 0) or 0)

    aff = analysis.get("affordability_indicators", {})
    net_disposable = float(aff.get("net_disposable_income_monthly", 0) or 0)
    dti = float(aff.get("debt_to_income_ratio", 0) or 0)

    credits = income_analysis.get("credits_identified", []) or []
    sources = [
        {
            "description": c.get("description", ""),
            "category": c.get("category", ""),
            "average_monthly": float(c.get("average_monthly", 0) or 0),
            "frequency": c.get("frequency", ""),
            "consistency_score": c.get("consistency_score", 0),
        }
        for c in credits
    ]

    commitment_list = [
        {
            "description": fc.get("description", ""),
            "category": fc.get("category", ""),
            "monthly_amount": float(fc.get("monthly_amount", 0) or 0),
        }
        for fc in (exp.get("fixed_commitments", []) or [])
    ]

    flags = []
    if direction == "overstated" and abs_pct > 15:
        flags.append({
            "type": "income_misrepresentation",
            "label": "Income Overstatement Risk",
            "detail": (
                f"Declared income exceeds verified income by £{abs(delta):,.0f}/month "
                f"({abs_pct:.1f}%). This must be reconciled with payslips, P60, or SA302 "
                "before submission."
            ),
            "severity": "critical" if abs_pct > 25 else "high",
        })

    if dti > 45:
        flags.append({
            "type": "high_dti",
            "label": "High Debt-to-Income Ratio",
            "detail": (
                f"Fixed commitments consume {dti:.1f}% of income. Most lenders prefer "
                "under 45%. This will significantly restrict product choice and may "
                "trigger manual underwriting."
            ),
            "severity": "critical" if dti > 60 else "high",
        })

    if net_disposable <= 0:
        flags.append({
            "type": "negative_disposable",
            "label": "Negative Disposable Income",
            "detail": (
                "Total verified outgoings exceed income on the bank statement. "
                "The client cannot service additional mortgage debt in the current position."
            ),
            "severity": "critical",
        })
    elif verified > 0 and (net_disposable / verified) < 0.10:
        flags.append({
            "type": "thin_disposable",
            "label": "Very Thin Disposable Income",
            "detail": (
                f"Net disposable income (£{net_disposable:,.0f}/month) is less than 10% of "
                "verified income. Very little buffer remains for mortgage payments."
            ),
            "severity": "high",
        })

    balance = analysis.get("balance_trend", {})
    if balance.get("trend") == "declining":
        flags.append({
            "type": "declining_balance",
            "label": "Declining Account Balance",
            "detail": (
                "Account balance has been declining over the statement period, "
                "suggesting the client may be spending beyond their means."
            ),
            "severity": "medium",
        })

    actions = []
    if direction == "overstated" and abs_pct > 5:
        actions.append("Obtain payslips, P60, or SA302 to reconcile declared vs verified income")
    if direction == "understated" and abs_pct > 15:
        actions.append(
            "Investigate unexplained credits — may be bonus, rental income, or inter-account transfers; "
            "verify source before lender submission"
        )
    if dti > 35:
        actions.append(
            f"Discuss debt consolidation to reduce the {dti:.0f}% DTI ratio; "
            "many adverse lenders cap at 40–45%"
        )
    if net_disposable < 500:
        actions.append(
            "Affordability is very marginal — explore extending term or reducing loan amount "
            "to create sufficient headroom"
        )
    if balance.get("trend") == "declining":
        actions.append(
            "Review declining balance trend with client — confirm no undisclosed debts "
            "and that position will stabilise post-completion"
        )

    return {
        "declared_monthly": declared,
        "verified_monthly": verified,
        "delta_gbp": delta,
        "delta_pct": delta_pct,
        "direction": direction,
        "direction_note": direction_note,
        "severity": severity,
        "severity_label": severity_label,
        "severity_colour": severity_colour,
        "total_fixed_outgoings": total_fixed,
        "total_variable_outgoings": total_variable,
        "total_outgoings": total_outgoings,
        "net_disposable_income": net_disposable,
        "debt_to_income_ratio": dti,
        "income_sources": sources,
        "fixed_commitments": commitment_list,
        "risk_flags": flags,
        "consultant_actions": actions,
    }
