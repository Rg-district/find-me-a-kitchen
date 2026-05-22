"""
Client Grading Engine — scores and grades mortgage applicants based on
bank statement analysis data.

Grade scale:
  A  85-100  Prime — mainstream lenders
  B  70-84   Near Prime — building societies + platform lenders
  C  55-69   Adverse Light — specialist lenders (Precise, Kensington)
  D  40-54   Adverse — Aldermore, Together, Pepper
  E  25-39   Heavy Adverse — niche lenders only, high rates
  F  0-24    Decline — application not viable at this time
"""
from __future__ import annotations


# ── Scoring weights (must sum to 1.0) ──────────────────────────────────────
WEIGHTS = {
    "income_consistency": 0.25,
    "income_vs_declaration": 0.25,
    "gambling": 0.20,
    "payday_loans": 0.10,
    "returned_dds": 0.10,
    "overdraft_usage": 0.10,
}

# ── Grade boundaries ────────────────────────────────────────────────────────
GRADE_BOUNDARIES = [
    (85, "A"),
    (70, "B"),
    (55, "C"),
    (40, "D"),
    (25, "E"),
    (0,  "F"),
]

GRADE_METADATA = {
    "A": {
        "label": "Prime",
        "description": "Excellent credit profile. Eligible for mainstream high-street lenders.",
        "lender_recommendation_tier": "Mainstream — Halifax, NatWest, Nationwide, Barclays, HSBC, Santander",
        "colour": "green",
    },
    "B": {
        "label": "Near Prime",
        "description": "Good profile with minor adverse. Building societies and platform lenders accessible.",
        "lender_recommendation_tier": "Near Prime — Yorkshire BS, Coventry BS, Platform, Accord",
        "colour": "blue",
    },
    "C": {
        "label": "Adverse Light",
        "description": "Light adverse credit. Specialist lenders will consider this case.",
        "lender_recommendation_tier": "Specialist — Precise Mortgages, Kensington Mortgages",
        "colour": "amber",
    },
    "D": {
        "label": "Adverse",
        "description": "Significant adverse markers present. Limited to specialist adverse lenders.",
        "lender_recommendation_tier": "Adverse — Aldermore, Together Money, Pepper Money",
        "colour": "orange",
    },
    "E": {
        "label": "Heavy Adverse",
        "description": "Heavy adverse history. Very limited lender options at premium rates.",
        "lender_recommendation_tier": "Heavy Adverse — Norton Home Loans, MBS Lending, Bluestone",
        "colour": "red",
    },
    "F": {
        "label": "Decline",
        "description": "Application not viable at this time. Advise credit rehabilitation before reapplying.",
        "lender_recommendation_tier": "N/A — application not viable",
        "colour": "dark_red",
    },
}


# ── Individual scoring functions ────────────────────────────────────────────

def _score_income_consistency(analysis: dict) -> tuple[float, str]:
    """Score based on income coefficient of variation (CV). Lower CV = more consistent."""
    cv = analysis.get("income_analysis", {}).get("income_coefficient_of_variation", 50)

    if cv < 5:
        return 100, f"Income highly consistent (CV {cv:.1f}% < 5%)"
    elif cv < 15:
        return 80, f"Income mostly consistent (CV {cv:.1f}% < 15%)"
    elif cv < 30:
        return 55, f"Income moderately variable (CV {cv:.1f}% < 30%)"
    else:
        return 25, f"Income highly variable or irregular (CV {cv:.1f}% ≥ 30%)"


def _score_income_vs_declaration(analysis: dict) -> tuple[float, str]:
    """Score based on difference between actual income and declared income."""
    discrepancy = analysis.get("income_analysis", {}).get("declared_income_discrepancy_pct", 0)
    # Positive discrepancy = actual higher than declared (understated — fine)
    # Negative discrepancy = actual lower than declared (overstated — problematic)

    abs_diff = abs(discrepancy)

    if discrepancy < 0:
        # Client has overstated income
        if abs_diff <= 5:
            return 100, f"Income within 5% of declared (slight overstatement of {abs_diff:.1f}%)"
        elif abs_diff <= 15:
            return 80, f"Income within 15% of declared (overstatement of {abs_diff:.1f}%)"
        elif abs_diff <= 25:
            return 55, f"Income within 25% of declared (overstatement of {abs_diff:.1f}%) — note for underwriter"
        else:
            return 0, f"Income significantly overstated by {abs_diff:.1f}% — CRITICAL: potential misrepresentation"
    else:
        # Client understated or matched income (acceptable)
        if abs_diff <= 5:
            return 100, f"Income matches declared within 5% ({discrepancy:.1f}%)"
        elif abs_diff <= 15:
            return 80, f"Income within 15% of declared ({discrepancy:.1f}%)"
        elif abs_diff <= 25:
            return 55, f"Income within 25% of declared ({discrepancy:.1f}%)"
        else:
            return 20, f"Large discrepancy vs declared ({discrepancy:.1f}%) — verify source of additional income"


def _score_gambling(analysis: dict) -> tuple[float, str]:
    """Score based on gambling activity as percentage of income."""
    gambling = analysis.get("red_flags", {}).get("gambling", {})
    detected = gambling.get("detected", False)

    if not detected:
        return 100, "No gambling activity detected"

    pct = gambling.get("percentage_of_income", 0)
    merchants = gambling.get("merchants", [])
    merchant_str = ", ".join(merchants[:5]) if merchants else "unknown merchants"

    if pct == 0 or pct < 1:
        return 70, f"Minimal gambling detected (< 1% of income) — {merchant_str}"
    elif pct < 5:
        return 35, f"Gambling activity {pct:.1f}% of income — {merchant_str}"
    else:
        return 0, f"Significant gambling {pct:.1f}% of income — CRITICAL red flag — {merchant_str}"


def _score_payday_loans(analysis: dict) -> tuple[float, str]:
    """Score based on presence and recency of payday loan activity."""
    payday = analysis.get("red_flags", {}).get("payday_loans", {})
    detected = payday.get("detected", False)

    if not detected:
        return 100, "No payday loan activity detected"

    severity = payday.get("severity", "recent")
    months_ago = payday.get("months_ago")
    lenders = payday.get("lenders_identified", [])
    lender_str = ", ".join(lenders[:3]) if lenders else "unknown lenders"

    if severity == "historical" or (months_ago is not None and months_ago > 12):
        return 50, f"Historical payday loan activity (> 12 months ago) — {lender_str}"
    else:
        months_str = f"{months_ago} months ago" if months_ago else "recently"
        return 0, f"Recent payday loan activity ({months_str}) — CRITICAL: most specialist lenders require 12-24 month clean history — {lender_str}"


def _score_returned_dds(analysis: dict) -> tuple[float, str]:
    """Score based on number of returned direct debits."""
    rdd = analysis.get("red_flags", {}).get("returned_direct_debits", {})
    count = rdd.get("count", 0)

    if count == 0:
        return 100, "No returned direct debits"
    elif count == 1:
        return 65, f"1 returned direct debit — {', '.join(rdd.get('descriptions', ['unknown'])[:2])}"
    elif count == 2:
        return 35, f"2 returned direct debits — indicates cash flow stress"
    else:
        return 0, f"{count} returned direct debits — CRITICAL: significant payment management issues"


def _score_overdraft_usage(analysis: dict) -> tuple[float, str]:
    """Score based on frequency and depth of overdraft usage."""
    od = analysis.get("red_flags", {}).get("overdraft_usage", {})
    severity = od.get("severity", "none")
    depth = od.get("maximum_overdraft_depth", 0)
    times = od.get("times_in_overdraft", 0)

    if severity == "none" or times == 0:
        return 100, "No overdraft usage detected"
    elif severity == "occasional":
        return 65, f"Occasional overdraft use ({times} times, max depth £{depth:.0f})"
    elif severity == "frequent":
        return 25, f"Frequent overdraft use ({times} times, max depth £{depth:.0f}) — cash flow concern"
    else:  # always_overdrawn
        return 0, f"Consistently overdrawn — CRITICAL: chronic cash flow deficit (max depth £{depth:.0f})"


# ── Main grading function ────────────────────────────────────────────────────

def grade_client(analysis: dict) -> dict:
    """
    Grade a client based on their bank statement analysis.

    Args:
        analysis: Structured analysis dict from bank_statement_analyser.analyse_statement()

    Returns:
        dict with score, grade, breakdown, summary, and lender recommendation tier.
    """
    # Calculate individual scores
    income_consistency_score, income_consistency_note = _score_income_consistency(analysis)
    income_declaration_score, income_declaration_note = _score_income_vs_declaration(analysis)
    gambling_score, gambling_note = _score_gambling(analysis)
    payday_score, payday_note = _score_payday_loans(analysis)
    returned_dd_score, returned_dd_note = _score_returned_dds(analysis)
    overdraft_score, overdraft_note = _score_overdraft_usage(analysis)

    # Weighted composite score
    weighted_score = (
        income_consistency_score * WEIGHTS["income_consistency"]
        + income_declaration_score * WEIGHTS["income_vs_declaration"]
        + gambling_score * WEIGHTS["gambling"]
        + payday_score * WEIGHTS["payday_loans"]
        + returned_dd_score * WEIGHTS["returned_dds"]
        + overdraft_score * WEIGHTS["overdraft_usage"]
    )

    final_score = round(weighted_score)

    # Determine grade
    grade = "F"
    for threshold, letter in GRADE_BOUNDARIES:
        if final_score >= threshold:
            grade = letter
            break

    grade_info = GRADE_METADATA[grade]

    # Build breakdown
    breakdown = {
        "income_consistency": {
            "raw_score": income_consistency_score,
            "weighted_score": round(income_consistency_score * WEIGHTS["income_consistency"], 1),
            "weight_pct": int(WEIGHTS["income_consistency"] * 100),
            "note": income_consistency_note,
        },
        "income_vs_declaration": {
            "raw_score": income_declaration_score,
            "weighted_score": round(income_declaration_score * WEIGHTS["income_vs_declaration"], 1),
            "weight_pct": int(WEIGHTS["income_vs_declaration"] * 100),
            "note": income_declaration_note,
        },
        "gambling": {
            "raw_score": gambling_score,
            "weighted_score": round(gambling_score * WEIGHTS["gambling"], 1),
            "weight_pct": int(WEIGHTS["gambling"] * 100),
            "note": gambling_note,
        },
        "payday_loans": {
            "raw_score": payday_score,
            "weighted_score": round(payday_score * WEIGHTS["payday_loans"], 1),
            "weight_pct": int(WEIGHTS["payday_loans"] * 100),
            "note": payday_note,
        },
        "returned_dds": {
            "raw_score": returned_dd_score,
            "weighted_score": round(returned_dd_score * WEIGHTS["returned_dds"], 1),
            "weight_pct": int(WEIGHTS["returned_dds"] * 100),
            "note": returned_dd_note,
        },
        "overdraft_usage": {
            "raw_score": overdraft_score,
            "weighted_score": round(overdraft_score * WEIGHTS["overdraft_usage"], 1),
            "weight_pct": int(WEIGHTS["overdraft_usage"] * 100),
            "note": overdraft_note,
        },
    }

    # Identify critical flags (score of 0 in any category)
    critical_flags = [
        key for key, data in breakdown.items() if data["raw_score"] == 0
    ]

    # Build narrative summary
    summary_parts = [
        f"Grade {grade} ({grade_info['label']}) — composite score {final_score}/100.",
        grade_info["description"],
    ]

    if critical_flags:
        flag_names = {
            "income_consistency": "income instability",
            "income_vs_declaration": "income misrepresentation",
            "gambling": "gambling activity",
            "payday_loans": "payday loan history",
            "returned_dds": "returned direct debits",
            "overdraft_usage": "chronic overdraft use",
        }
        critical_labels = [flag_names.get(f, f) for f in critical_flags]
        summary_parts.append(f"Critical concerns: {', '.join(critical_labels)}.")

    # Add income note
    income_info = analysis.get("income_analysis", {})
    avg_income = income_info.get("total_average_monthly_income", 0)
    declared = analysis.get("_meta", {}).get("declared_monthly_income", 0)
    if avg_income > 0:
        summary_parts.append(
            f"Average verified monthly income: £{avg_income:,.0f} vs declared £{declared:,.0f}."
        )

    summary = " ".join(summary_parts)

    return {
        "score": final_score,
        "grade": grade,
        "grade_label": grade_info["label"],
        "grade_description": grade_info["description"],
        "grade_colour": grade_info["colour"],
        "breakdown": breakdown,
        "critical_flags": critical_flags,
        "summary": summary,
        "lender_recommendation_tier": grade_info["lender_recommendation_tier"],
        "weights_applied": WEIGHTS,
    }
