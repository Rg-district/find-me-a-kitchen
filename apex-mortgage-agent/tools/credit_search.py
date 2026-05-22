"""
Credit profile assessment module.
In production, integrates with Experian, Equifax, or TransUnion via their APIs.
Currently provides indicative assessment based on declared information.
"""


def assess_credit_profile(
    credit_score_range: str,
    has_defaults: bool = False,
    has_ccjs: bool = False,
    has_bankruptcy: bool = False,
    months_since_issues: int = 0,
) -> dict:
    """
    Indicative credit assessment — not a real credit check.
    A real soft search requires FCA authorisation and customer consent.
    """
    issues = []
    lender_tiers = []
    max_ltv = 95

    if has_bankruptcy:
        issues.append("Bankruptcy on record — most mainstream lenders decline; discharged >6 years may qualify with specialist lenders")
        lender_tiers = ["specialist"]
        max_ltv = 65
    elif has_ccjs:
        if months_since_issues < 36:
            issues.append("CCJ within 3 years — restricted to specialist/adverse lenders")
            lender_tiers = ["specialist"]
            max_ltv = 75
        else:
            issues.append("CCJ over 3 years ago — some specialist and building society lenders may consider")
            lender_tiers = ["specialist", "building_society"]
            max_ltv = 80
    elif has_defaults:
        if months_since_issues < 24:
            issues.append("Defaults within 2 years — specialist adverse credit lenders only")
            lender_tiers = ["specialist"]
            max_ltv = 75
        else:
            issues.append("Defaults over 2 years ago — some building societies and platform lenders may consider")
            lender_tiers = ["specialist", "building_society", "platform"]
            max_ltv = 85
    else:
        score_map = {
            "excellent": (["high_street", "building_society", "platform", "specialist"], 95, []),
            "good":      (["high_street", "building_society", "platform"], 90, []),
            "fair":      (["building_society", "platform", "specialist"], 85, ["Some high-street lenders may decline at fair score"]),
            "poor":      (["specialist", "platform"], 75, ["Limited to specialist/adverse lenders; higher rates apply"]),
            "very_poor": (["specialist"], 65, ["Very restricted options; significant rate premium; deposit of 35%+ likely required"]),
        }
        tiers, max_ltv, score_issues = score_map.get(credit_score_range, (["specialist"], 65, []))
        lender_tiers = tiers
        issues.extend(score_issues)

    lender_examples = {
        "high_street": ["Halifax", "NatWest", "Nationwide", "Barclays", "HSBC", "Santander"],
        "building_society": ["Nationwide", "Yorkshire BS", "Coventry BS", "Leeds BS"],
        "platform": ["Platform", "Accord", "Virgin Money", "Skipton"],
        "specialist": ["Precise Mortgages", "Kensington", "Aldermore", "Together Money", "Pepper Money"],
    }

    accessible_lenders = []
    for tier in lender_tiers:
        accessible_lenders.extend(lender_examples.get(tier, []))

    return {
        "declared_credit_range": credit_score_range,
        "has_adverse_history": has_defaults or has_ccjs or has_bankruptcy,
        "indicative_max_ltv": max_ltv,
        "accessible_lender_tiers": lender_tiers,
        "example_accessible_lenders": accessible_lenders[:8],
        "issues_flagged": issues,
        "soft_search_note": "This is NOT a real credit check. No footprint has been left on your credit file. A real soft search can be performed by an FCA-authorised adviser with your consent.",
        "recommended_action": (
            "Speak with a specialist mortgage adviser" if "specialist" in lender_tiers and len(lender_tiers) == 1
            else "Standard mortgage application likely viable — adviser to confirm"
        ),
    }
