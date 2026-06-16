"""
Adverse Lender Matcher — matches UK bad-credit mortgage clients to appropriate
specialist lenders based on their grade and adverse credit profile.

Lender data reflects typical criteria as of 2024/2025 — always verify current
criteria with each lender's BDM or product guide before submission.

income_multiples/indicative_rate drive an indicative max-loan-per-lender
estimate (see estimate_affordability()). These are NOT live lender calculator
results — there is no API access to lenders' actual affordability engines —
they are approximations from typical published criteria, for broker triage
only. Always confirm with the lender's own calculator/BDM before submission.
"""
from __future__ import annotations

from tools.affordability_calculator import calculate_monthly_payment

# ── Lender database ──────────────────────────────────────────────────────────
# Each entry reflects publicly known criteria from lender product guides / BDM
# communications. Criteria should be verified before submission.

LENDER_DATABASE = [
    {
        "name": "Precise Mortgages",
        "tier": "C",
        "logo_initial": "PM",
        "colour": "#1a4e8a",
        "max_ltv": 85,
        "min_grade": "C",
        "max_loan": 1000000,
        "indicative_rate": 6.49,
        "income_multiples": {"employed": 4.75, "self_employed": 4.5},
        "criteria": {
            "ccjs": True,
            "defaults": True,
            "bankruptcy": False,
            "iva": False,
            "dmp": True,
            "payday_loans": True,  # considered if satisfied and historic
            "max_ccj_amount": 2500,
            "ccj_satisfied_required": True,
            "months_since_adverse_min": 12,
            "self_employed": True,
            "employed": True,
        },
        "headline_criteria": [
            "CCJs considered if satisfied and ≤ £2,500",
            "Defaults considered — satisfied preferred",
            "Max LTV 85% (75% with recent adverse)",
            "DMP accepted — 12 months clean conduct required",
            "Payday loans: historic only (> 12 months)",
            "Self-employed with 1 year's accounts considered",
        ],
        "website": "https://www.precisemortgages.co.uk",
        "contact": "0800 116 4385",
        "notes": "Strong BDM support. Popular choice for C-grade cases with satisfied adverse.",
    },
    {
        "name": "Kensington Mortgages",
        "tier": "C",
        "logo_initial": "KM",
        "colour": "#8b1a1a",
        "max_ltv": 90,
        "min_grade": "C",
        "max_loan": 1500000,
        "indicative_rate": 6.74,
        "income_multiples": {"employed": 4.75, "self_employed": 4.5},
        "criteria": {
            "ccjs": True,
            "defaults": True,
            "bankruptcy": False,
            "iva": True,
            "dmp": True,
            "payday_loans": True,
            "max_ccj_amount": 5000,
            "ccj_satisfied_required": False,
            "months_since_adverse_min": 12,
            "self_employed": True,
            "employed": True,
        },
        "headline_criteria": [
            "Flexible adverse criteria — unsatisfied CCJs considered",
            "Up to 90% LTV in some cases",
            "IVA accepted if discharged",
            "DMP: must have been running 12+ months",
            "Complex income considered (multiple jobs, variable pay)",
            "Payday loans considered case by case",
        ],
        "website": "https://www.kensingtonmortgages.co.uk",
        "contact": "0800 111 020",
        "notes": "One of the most flexible adverse lenders. Strong for IVA cases.",
    },
    {
        "name": "Aldermore Bank",
        "tier": "D",
        "logo_initial": "AL",
        "colour": "#e87722",
        "max_ltv": 75,
        "min_grade": "D",
        "max_loan": 750000,
        "indicative_rate": 7.09,
        "income_multiples": {"employed": 4.5, "self_employed": 4.5},
        "criteria": {
            "ccjs": True,
            "defaults": True,
            "bankruptcy": False,
            "iva": True,
            "dmp": True,
            "payday_loans": False,
            "max_ccj_amount": 0,  # No hard cap — case by case
            "ccj_satisfied_required": False,
            "months_since_adverse_min": 0,
            "self_employed": True,  # Very self-employed friendly
            "employed": True,
        },
        "headline_criteria": [
            "Very self-employed friendly — 1 year's accounts accepted",
            "Adverse credit considered case by case",
            "Multiple CCJs/defaults considered",
            "Max LTV 75% for adverse cases",
            "Portfolio landlords considered",
            "Complex income structures welcomed",
        ],
        "website": "https://www.aldermore.co.uk",
        "contact": "0333 202 1850",
        "notes": "Particularly strong for self-employed and complex income clients with adverse.",
    },
    {
        "name": "Together Money",
        "tier": "D",
        "logo_initial": "TM",
        "colour": "#00a651",
        "max_ltv": 75,
        "min_grade": "D",
        "max_loan": 5000000,
        "indicative_rate": 9.49,
        "income_multiples": {"employed": 4.0, "self_employed": 3.75},
        "criteria": {
            "ccjs": True,
            "defaults": True,
            "bankruptcy": True,
            "iva": True,
            "dmp": True,
            "payday_loans": True,
            "max_ccj_amount": 0,
            "ccj_satisfied_required": False,
            "months_since_adverse_min": 0,
            "self_employed": True,
            "employed": True,
        },
        "headline_criteria": [
            "Heavy adverse accepted — no minimum clean period",
            "Bankruptcy considered (discharged)",
            "Bridging loans available alongside mortgages",
            "Second charges available",
            "No minimum income requirement on some products",
            "Unusual properties and construction types considered",
        ],
        "website": "https://www.togethermoney.com",
        "contact": "0333 230 3313",
        "notes": "Go-to lender for heavy adverse and complex property types. Rates reflect risk.",
    },
    {
        "name": "Pepper Money",
        "tier": "D",
        "logo_initial": "PP",
        "colour": "#e60000",
        "max_ltv": 75,
        "min_grade": "D",
        "max_loan": 1000000,
        "indicative_rate": 7.74,
        "income_multiples": {"employed": 4.25, "self_employed": 4.0},
        "criteria": {
            "ccjs": True,
            "defaults": True,
            "bankruptcy": False,
            "iva": True,
            "dmp": True,
            "payday_loans": True,
            "max_ccj_amount": 0,
            "ccj_satisfied_required": False,
            "months_since_adverse_min": 0,
            "self_employed": True,
            "employed": True,
        },
        "headline_criteria": [
            "Wide adverse criteria — no minimum clean period",
            "Multiple CCJs and defaults considered",
            "IVA accepted",
            "Payday loans considered — case by case",
            "Interest-only available up to 75% LTV",
            "Up to 6 applicants on a case",
        ],
        "website": "https://www.peppermoney.co.uk",
        "contact": "0800 028 1943",
        "notes": "Strong for D-grade adverse. Competitive tiered pricing based on adverse severity.",
    },
    {
        "name": "Norton Home Loans",
        "tier": "E",
        "logo_initial": "NH",
        "colour": "#4a235a",
        "max_ltv": 70,
        "min_grade": "E",
        "max_loan": 500000,
        "indicative_rate": 10.24,
        "income_multiples": {"employed": 4.0, "self_employed": 3.75},
        "criteria": {
            "ccjs": True,
            "defaults": True,
            "bankruptcy": True,
            "iva": True,
            "dmp": True,
            "payday_loans": True,
            "max_ccj_amount": 0,
            "ccj_satisfied_required": False,
            "months_since_adverse_min": 0,
            "self_employed": True,
            "employed": True,
        },
        "headline_criteria": [
            "Discharged bankruptcy accepted from Day 1",
            "Satisfied and unsatisfied CCJs considered",
            "No minimum clean period required",
            "Max LTV 70%",
            "Adverse-specialist — purpose built for E-grade cases",
            "IVAs and DMPs accepted",
        ],
        "website": "https://www.nortonfinancial.co.uk",
        "contact": "0800 694 0601",
        "notes": "Key lender for post-bankruptcy cases. Day-1 discharged bankruptcy is rare criteria.",
    },
    {
        "name": "Bluestone Mortgages",
        "tier": "E",
        "logo_initial": "BL",
        "colour": "#005b8e",
        "max_ltv": 70,
        "min_grade": "E",
        "max_loan": 750000,
        "indicative_rate": 9.74,
        "income_multiples": {"employed": 4.0, "self_employed": 3.75},
        "criteria": {
            "ccjs": True,
            "defaults": True,
            "bankruptcy": True,
            "iva": True,
            "dmp": True,
            "payday_loans": True,
            "max_ccj_amount": 0,
            "ccj_satisfied_required": False,
            "months_since_adverse_min": 0,
            "self_employed": True,
            "employed": True,
        },
        "headline_criteria": [
            "Adverse credit specialists — all adverse considered",
            "Bankruptcy accepted — day 1 from discharge",
            "Unlimited CCJs and defaults by number",
            "Payday loans accepted",
            "Max LTV 70% for heavy adverse",
            "Self-employed and complex income welcomed",
        ],
        "website": "https://www.bluestone.com.au/uk",
        "contact": "020 3595 0670",
        "notes": "Australian-backed adverse specialist. Very open criteria for heavy adverse cases.",
    },
    {
        "name": "MBS Lending",
        "tier": "E",
        "logo_initial": "MB",
        "colour": "#1c3c6e",
        "max_ltv": 65,
        "min_grade": "E",
        "max_loan": 400000,
        "indicative_rate": 11.49,
        "income_multiples": {"employed": 3.75, "self_employed": 3.5},
        "criteria": {
            "ccjs": True,
            "defaults": True,
            "bankruptcy": True,
            "iva": True,
            "dmp": True,
            "payday_loans": True,
            "max_ccj_amount": 0,
            "ccj_satisfied_required": False,
            "months_since_adverse_min": 0,
            "self_employed": True,
            "employed": True,
        },
        "headline_criteria": [
            "Severe adverse accepted — very flexible criteria",
            "Bankruptcy from day 1 of discharge",
            "Max LTV 65% for heaviest adverse",
            "All CCJ and default history considered",
            "Niche lender — ideal for declined cases elsewhere",
            "Manual underwriting on all cases",
        ],
        "website": "https://www.mbslending.co.uk",
        "contact": "01274 730 700",
        "notes": "Last-resort specialist for very heavy adverse. All cases manually underwritten.",
    },
    {
        "name": "Vida Homeloans",
        "tier": "D",
        "logo_initial": "VH",
        "colour": "#6e1a8a",
        "max_ltv": 80,
        "min_grade": "D",
        "max_loan": 1000000,
        "indicative_rate": 7.29,
        "income_multiples": {"employed": 4.5, "self_employed": 4.25},
        "criteria": {
            "ccjs": True,
            "defaults": True,
            "bankruptcy": False,
            "iva": True,
            "dmp": True,
            "payday_loans": True,
            "max_ccj_amount": 0,
            "ccj_satisfied_required": False,
            "months_since_adverse_min": 0,
            "self_employed": True,
            "employed": True,
        },
        "headline_criteria": [
            "Complex income and adverse specialists",
            "Multiple income sources considered",
            "IVA/DMP accepted",
            "Up to 80% LTV",
            "Contractor, self-employed and PAYE",
            "CCJs and defaults — no hard cap on number",
        ],
        "website": "https://www.vidahomeloans.co.uk",
        "contact": "03301 074 951",
        "notes": "Strong for complex income combined with light-to-moderate adverse.",
    },
]


def estimate_affordability(
    lender: dict,
    annual_income: float,
    partner_income: float,
    employment_type: str,
    monthly_debts: float,
) -> dict:
    """
    Indicative maximum loan amount this lender might offer, from an income
    multiple capped by a stressed-affordability ceiling (committed monthly
    outgoings kept within a typical specialist-lender tolerance).

    This is NOT a live lender calculator result — we have no API access to
    any lender's actual affordability engine — it is an estimate from the
    lender's typical published income multiple, for broker triage only.
    Always confirm the real figure with the lender's own calculator or BDM
    before presenting it to a client or submitting a case.
    """
    total_income = annual_income + partner_income
    if total_income <= 0:
        return {
            "max_loan_estimate": None,
            "monthly_payment_estimate": None,
            "note": "No income data available for this client yet.",
        }

    is_joint = partner_income > 0
    multiples = lender.get("income_multiples", {"employed": 4.0, "self_employed": 4.0})
    multiple = multiples.get("self_employed" if employment_type in ("self_employed", "contractor") else "employed", 4.0)
    if is_joint:
        multiple *= 0.9  # joint applications typically get a slightly reduced multiple
    multiple_cap = total_income * multiple

    indicative_rate = lender.get("indicative_rate", 7.5)
    stress_rate = indicative_rate + 2.0
    net_monthly_income = (total_income * 0.78) / 12  # approx after tax/NI
    affordability_dti_cap = 0.45  # typical max share of net income committed to debt + mortgage
    max_monthly_for_mortgage = max(0.0, net_monthly_income * affordability_dti_cap - monthly_debts)

    term_years = 25
    stress_monthly_rate = stress_rate / 100 / 12
    n = term_years * 12
    if stress_monthly_rate == 0 or max_monthly_for_mortgage == 0:
        stress_cap = max_monthly_for_mortgage * n
    else:
        stress_cap = max_monthly_for_mortgage * ((1 + stress_monthly_rate) ** n - 1) / (
            stress_monthly_rate * (1 + stress_monthly_rate) ** n
        )

    max_loan_estimate = min(multiple_cap, stress_cap)
    lender_max_loan = lender.get("max_loan")
    capped_by_lender_max = bool(lender_max_loan and max_loan_estimate > lender_max_loan)
    if lender_max_loan:
        max_loan_estimate = min(max_loan_estimate, lender_max_loan)
    max_loan_estimate = max(0.0, round(max_loan_estimate, -2))  # round to nearest £100

    monthly_payment_estimate = calculate_monthly_payment(max_loan_estimate, indicative_rate, term_years) if max_loan_estimate else 0.0

    capped_by = "lender maximum loan size" if capped_by_lender_max else (
        "affordability stress test" if stress_cap < multiple_cap else f"income multiple ({multiple:.2f}x)"
    )

    return {
        "max_loan_estimate": max_loan_estimate,
        "monthly_payment_estimate": monthly_payment_estimate,
        "indicative_rate": indicative_rate,
        "income_multiple_used": round(multiple, 2),
        "capped_by": capped_by,
        "note": "Indicative estimate only — not a live lender calculator result. Confirm with the lender's BDM or full affordability calculator before submission.",
    }


def match_lenders(
    grade: str,
    ccjs: bool,
    defaults: bool,
    bankruptcy: bool,
    months_since_adverse: int,
    ltv: float,
    employment_type: str,
    annual_income: float = 0.0,
    partner_income: float = 0.0,
    monthly_debts: float = 0.0,
) -> list[dict]:
    """
    Match a client to appropriate lenders based on their credit profile.

    Args:
        grade: Client grade (A-F) from grading engine.
        ccjs: Whether client has CCJs.
        defaults: Whether client has defaults.
        bankruptcy: Whether client has a bankruptcy.
        months_since_adverse: Months since most recent adverse event.
        ltv: Loan-to-value ratio as a percentage (e.g. 75.0 for 75%).
        employment_type: 'employed', 'self_employed', 'contractor', etc.
        annual_income: Client's annual income — when > 0, each matched lender
            gets an indicative max_loan_estimate (see estimate_affordability)
            and results are sorted by that estimate instead of suitability.
        partner_income: Joint applicant's annual income, if any.
        monthly_debts: Existing monthly debt commitments, deducted from the
            affordability ceiling used in the estimate.

    Returns:
        List of matched lender dicts with match_reason and suitability_score.
    """
    grade_order = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4, "F": 5}
    client_grade_level = grade_order.get(grade, 5)

    matched = []

    for lender in LENDER_DATABASE:
        lender_grade_level = grade_order.get(lender["min_grade"], 5)

        # Lender must serve clients at this grade or worse
        if lender_grade_level > client_grade_level + 1:
            continue  # Lender only serves better profiles

        criteria = lender["criteria"]

        # Check LTV
        if ltv > lender["max_ltv"]:
            continue

        # Check employment type
        is_self_employed = employment_type in ("self_employed", "contractor")
        if is_self_employed and not criteria.get("self_employed", False):
            continue

        # Check specific adverse criteria
        if bankruptcy and not criteria.get("bankruptcy", False):
            continue

        if ccjs and not criteria.get("ccjs", False):
            continue

        if defaults and not criteria.get("defaults", False):
            continue

        # Check minimum clean period
        min_months = criteria.get("months_since_adverse_min", 0)
        if min_months > 0 and months_since_adverse < min_months:
            continue

        # Calculate suitability score (0-100)
        suitability = _calculate_suitability(
            lender=lender,
            grade=grade,
            grade_level=client_grade_level,
            ccjs=ccjs,
            defaults=defaults,
            bankruptcy=bankruptcy,
            months_since_adverse=months_since_adverse,
            ltv=ltv,
            is_self_employed=is_self_employed,
        )

        match_reasons = _build_match_reasons(lender, grade, ccjs, defaults, bankruptcy, ltv, employment_type)

        affordability = estimate_affordability(
            lender=lender,
            annual_income=annual_income,
            partner_income=partner_income,
            employment_type=employment_type,
            monthly_debts=monthly_debts,
        )

        matched.append({
            **lender,
            "suitability_score": suitability,
            "match_reasons": match_reasons,
            "ltv_headroom": lender["max_ltv"] - ltv,
            "affordability_estimate": affordability,
        })

    if annual_income > 0:
        # Sort by estimated max loan descending — mirrors how brokers actually
        # want to compare a panel (highest borrowing first), falling back to
        # suitability score for lenders with no estimate.
        matched.sort(key=lambda x: (
            -(x["affordability_estimate"]["max_loan_estimate"] or 0),
            -x["suitability_score"],
        ))
    else:
        # No income data yet — sort by suitability score descending, then by
        # tier (prefer less adverse-heavy first for better grades)
        matched.sort(key=lambda x: (-x["suitability_score"], grade_order.get(x["tier"], 5)))

    return matched


def _calculate_suitability(
    lender: dict,
    grade: str,
    grade_level: int,
    ccjs: bool,
    defaults: bool,
    bankruptcy: bool,
    months_since_adverse: int,
    ltv: float,
    is_self_employed: bool,
) -> int:
    """Calculate a suitability score for a lender-client match."""
    score = 100

    # Penalise for grade mismatch (using a lender that's more specialised than needed)
    lender_grade_level = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4, "F": 5}.get(lender["tier"], 5)
    grade_gap = lender_grade_level - grade_level
    if grade_gap > 0:
        score -= grade_gap * 10  # Lender more specialised than needed

    # LTV comfort — prefer lenders with more headroom
    ltv_headroom = lender["max_ltv"] - ltv
    if ltv_headroom < 5:
        score -= 20
    elif ltv_headroom < 10:
        score -= 10

    # Self-employed bonus
    if is_self_employed:
        score += 5

    # Adverse specific bonuses
    if bankruptcy and lender["criteria"].get("bankruptcy", False):
        score += 10

    return max(0, min(100, score))


def _build_match_reasons(
    lender: dict,
    grade: str,
    ccjs: bool,
    defaults: bool,
    bankruptcy: bool,
    ltv: float,
    employment_type: str,
) -> list[str]:
    """Build human-readable match reasons for display."""
    reasons = []
    criteria = lender["criteria"]

    if lender["tier"] == grade:
        reasons.append(f"Primary tier match for Grade {grade} clients")

    if ccjs and criteria.get("ccjs"):
        reasons.append("CCJs accepted")

    if defaults and criteria.get("defaults"):
        reasons.append("Defaults accepted")

    if bankruptcy and criteria.get("bankruptcy"):
        reasons.append("Bankruptcy accepted from discharge")

    if employment_type in ("self_employed", "contractor") and criteria.get("self_employed"):
        reasons.append("Self-employed/contractor friendly")

    if ltv <= lender["max_ltv"] - 10:
        reasons.append(f"Good LTV headroom ({lender['max_ltv'] - ltv:.0f}% below max)")

    if not reasons:
        reasons.append("Meets standard adverse criteria")

    return reasons


def get_lender_by_name(name: str) -> dict | None:
    """Retrieve a specific lender's full profile by name."""
    name_lower = name.lower()
    for lender in LENDER_DATABASE:
        if name_lower in lender["name"].lower():
            return lender
    return None
