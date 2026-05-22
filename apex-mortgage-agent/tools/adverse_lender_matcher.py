"""
Adverse Lender Matcher — matches UK bad-credit mortgage clients to appropriate
specialist lenders based on their grade and adverse credit profile.

Lender data reflects typical criteria as of 2024/2025 — always verify current
criteria with each lender's BDM or product guide before submission.
"""
from __future__ import annotations

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


def match_lenders(
    grade: str,
    ccjs: bool,
    defaults: bool,
    bankruptcy: bool,
    months_since_adverse: int,
    ltv: float,
    employment_type: str,
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

        matched.append({
            **lender,
            "suitability_score": suitability,
            "match_reasons": match_reasons,
            "ltv_headroom": lender["max_ltv"] - ltv,
        })

    # Sort by suitability score descending, then by tier (prefer less adverse-heavy first for better grades)
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
