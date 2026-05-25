"""FCA MCOB 11 / PRA SS13/16 affordability stress test."""
from __future__ import annotations

# Grade-based indicative rates (adverse premium scale)
_INDICATIVE_RATES: dict[str, float] = {
    "A": 4.5,
    "B": 5.0,
    "C": 5.75,
    "D": 6.5,
    "E": 7.5,
    "F": 8.5,
}

_STRESS_ADD_ON = 3.0   # PRA SS13/16 minimum stressed add-on (percentage points)
_MIN_STRESS_RATE = 7.0  # FCA floor — stress test must never drop below this
_PTI_COMFORTABLE = 28.0
_PTI_THRESHOLD = 35.0


def _monthly_payment(principal: float, annual_rate_pct: float, term_months: int) -> float:
    if annual_rate_pct <= 0 or term_months <= 0:
        return principal / term_months if term_months > 0 else 0
    r = annual_rate_pct / 100 / 12
    return principal * r * (1 + r) ** term_months / ((1 + r) ** term_months - 1)


def _max_loan(income: float, annual_rate_pct: float, term_months: int, pti: float) -> float:
    max_pmt = income * pti / 100
    if annual_rate_pct <= 0 or term_months <= 0:
        return max_pmt * term_months
    r = annual_rate_pct / 100 / 12
    return max_pmt * ((1 + r) ** term_months - 1) / (r * (1 + r) ** term_months)


def run_stress_test(
    loan_amount: float,
    declared_income: float,
    grade: str = "F",
    verified_income: float = 0.0,
    net_disposable: float = 0.0,
    term_years: int = 25,
    indicative_rate: float | None = None,
) -> dict:
    """
    Run FCA MCOB 11 affordability stress test.

    Returns structured result including payments at product rate and stressed rate,
    affordability ratios, pass/fail verdicts, and consultant recommendations.
    """
    term_months = term_years * 12

    if indicative_rate is None:
        indicative_rate = _INDICATIVE_RATES.get(grade.upper(), 6.5)

    stress_rate = max(indicative_rate + _STRESS_ADD_ON, _MIN_STRESS_RATE)

    payment_at_rate = _monthly_payment(loan_amount, indicative_rate, term_months)
    payment_at_stress = _monthly_payment(loan_amount, stress_rate, term_months)

    income_used = verified_income if verified_income > 0 else declared_income
    income_type = "verified" if verified_income > 0 else "declared"

    ratio_at_rate = (payment_at_rate / income_used * 100) if income_used > 0 else 999.0
    ratio_at_stress = (payment_at_stress / income_used * 100) if income_used > 0 else 999.0

    base = net_disposable if net_disposable > 0 else income_used
    disposable_after_rate = base - payment_at_rate
    disposable_after_stress = base - payment_at_stress

    # Verdict at product rate
    if ratio_at_rate <= _PTI_COMFORTABLE:
        rate_verdict = "comfortable"
        rate_colour = "green"
    elif ratio_at_rate <= _PTI_THRESHOLD:
        rate_verdict = "marginal"
        rate_colour = "amber"
    else:
        rate_verdict = "stretched"
        rate_colour = "red"

    # Verdict at stress rate (the regulatory test)
    if ratio_at_stress <= _PTI_COMFORTABLE:
        stress_verdict = "pass_comfortable"
        stress_label = "Pass — Comfortable"
        stress_colour = "green"
    elif ratio_at_stress <= _PTI_THRESHOLD:
        stress_verdict = "pass_marginal"
        stress_label = "Pass — Marginal"
        stress_colour = "amber"
    elif ratio_at_stress <= 45:
        stress_verdict = "fail_likely"
        stress_label = "Likely Fail"
        stress_colour = "orange"
    else:
        stress_verdict = "fail"
        stress_label = "Fail"
        stress_colour = "red"

    max_affordable_rate = _max_loan(income_used, indicative_rate, term_months, _PTI_THRESHOLD)
    max_affordable_stress = _max_loan(income_used, stress_rate, term_months, _PTI_THRESHOLD)

    total_interest_rate = (payment_at_rate * term_months) - loan_amount
    total_interest_stress = (payment_at_stress * term_months) - loan_amount

    recommendations = []
    if stress_verdict in ("fail_likely", "fail"):
        gap = loan_amount - max_affordable_stress
        if gap > 0:
            recommendations.append(
                f"Reduce loan amount by £{gap:,.0f} to pass the stress test "
                f"(maximum affordable at stressed rate: £{max_affordable_stress:,.0f})"
            )
        recommendations.append(
            f"Consider extending term beyond {term_years} years — this reduces monthly "
            "payments but increases total interest cost"
        )
    if disposable_after_stress < 300:
        recommendations.append(
            "Less than £300/month disposable after stressed payment — "
            "underwriter will scrutinise living costs closely"
        )
    if ratio_at_stress > _PTI_COMFORTABLE and income_type == "declared":
        recommendations.append(
            "Run test again after uploading bank statement — verified income may "
            "be higher than declared and improve the affordability position"
        )

    return {
        "loan_amount": loan_amount,
        "term_years": term_years,
        "term_months": term_months,
        "indicative_rate": indicative_rate,
        "stress_rate": stress_rate,
        "stress_add_on": _STRESS_ADD_ON,
        "income_used": income_used,
        "income_type": income_type,
        "payment_at_rate": round(payment_at_rate, 2),
        "payment_at_stress": round(payment_at_stress, 2),
        "payment_increase": round(payment_at_stress - payment_at_rate, 2),
        "ratio_at_rate": round(ratio_at_rate, 1),
        "ratio_at_stress": round(ratio_at_stress, 1),
        "disposable_after_rate": round(disposable_after_rate, 2),
        "disposable_after_stress": round(disposable_after_stress, 2),
        "rate_verdict": rate_verdict,
        "rate_verdict_colour": rate_colour,
        "stress_verdict": stress_verdict,
        "stress_verdict_label": stress_label,
        "stress_verdict_colour": stress_colour,
        "max_affordable_at_rate": round(max_affordable_rate, 0),
        "max_affordable_at_stress": round(max_affordable_stress, 0),
        "total_interest_at_rate": round(total_interest_rate, 0),
        "total_interest_at_stress": round(total_interest_stress, 0),
        "recommendations": recommendations,
        "regulatory_note": (
            f"Stress tested at {stress_rate:.2f}% per FCA MCOB 11.6 and PRA SS13/16 "
            f"(product rate {indicative_rate:.2f}% + {_STRESS_ADD_ON:.0f}pp stress add-on, "
            f"floor {_MIN_STRESS_RATE:.0f}%)"
        ),
    }
