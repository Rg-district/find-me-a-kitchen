"""UK mortgage affordability calculations."""
from dataclasses import dataclass


@dataclass
class AffordabilityResult:
    max_loan_conservative: float   # 4x income
    max_loan_standard: float       # 4.5x income
    max_loan_stretched: float      # 5x income (specialist lenders)
    loan_requested: float
    monthly_payment_estimate: float
    ltv_percent: float
    stress_tested_monthly: float   # payment at stress rate (+3%)
    dti_ratio: float
    is_affordable: bool
    notes: list[str]


def calculate_max_borrowing(
    annual_income: float,
    partner_income: float = 0.0,
    employment_type: str = "employed",
) -> dict:
    total_income = annual_income + partner_income
    is_joint = partner_income > 0

    # Contractor: annualise day rate
    if employment_type == "contractor":
        notes = ["Contractor income annualised at day rate × 46 weeks × 5 days"]
    else:
        notes = []

    if is_joint:
        conservative = total_income * 3.5
        standard = total_income * 4.0
        stretched = total_income * 4.5
    else:
        conservative = total_income * 4.0
        standard = total_income * 4.5
        stretched = total_income * 5.0

    if employment_type == "self_employed":
        notes.append("Self-employed: lenders typically use lower of last 2 years' net profit/SA302")
        standard *= 0.9

    return {
        "conservative": round(conservative, 2),
        "standard": round(standard, 2),
        "stretched": round(stretched, 2),
        "total_income": total_income,
        "is_joint": is_joint,
        "notes": notes,
    }


def calculate_monthly_payment(principal: float, annual_rate: float, term_years: int) -> float:
    monthly_rate = annual_rate / 100 / 12
    n = term_years * 12
    if monthly_rate == 0:
        return principal / n
    payment = principal * (monthly_rate * (1 + monthly_rate) ** n) / ((1 + monthly_rate) ** n - 1)
    return round(payment, 2)


def calculate_ltv(loan_amount: float, property_value: float) -> float:
    if property_value <= 0:
        return 0.0
    return round((loan_amount / property_value) * 100, 1)


def calculate_stamp_duty(
    property_price: float,
    is_first_time_buyer: bool = False,
    is_additional_property: bool = False,
    country: str = "england",
) -> dict:
    """Calculate SDLT (England/NI), LBTT (Scotland), or LTT (Wales)."""

    if country == "scotland":
        return {
            "amount": None,
            "breakdown": [],
            "note": "Scotland uses Land and Buildings Transaction Tax (LBTT). Please check Revenue Scotland for current rates: revenue.scot/land-buildings-transaction-tax",
            "country": "Scotland",
        }

    if country == "wales":
        return {
            "amount": None,
            "breakdown": [],
            "note": "Wales uses Land Transaction Tax (LTT). Please check the Welsh Revenue Authority for current rates: gov.wales/land-transaction-tax",
            "country": "Wales",
        }

    # England / Northern Ireland — SDLT from April 2025
    surcharge = 0.03 if is_additional_property else 0.0
    breakdown = []
    total = 0.0

    if is_first_time_buyer and not is_additional_property:
        # FTB relief: 0% up to £425k, 5% £425k-£625k, standard above £625k
        if property_price <= 425_000:
            breakdown.append({"band": "£0 – £425,000 (FTB relief)", "rate": "0%", "tax": 0.0})
        elif property_price <= 625_000:
            tax = (property_price - 425_000) * 0.05
            breakdown.append({"band": "£0 – £425,000 (FTB relief)", "rate": "0%", "tax": 0.0})
            breakdown.append({"band": "£425,001 – £625,000", "rate": "5%", "tax": round(tax, 2)})
            total = tax
        else:
            # FTB relief does not apply above £625k — standard rates
            is_first_time_buyer = False

    if not is_first_time_buyer or property_price > 625_000:
        bands = [
            (250_000, 0.0),
            (675_000, 0.05),
            (1_500_000, 0.10),
            (float("inf"), 0.12),
        ]
        total = 0.0
        breakdown = []
        prev = 0
        for limit, rate in bands:
            if property_price <= prev:
                break
            taxable = min(property_price, limit) - prev
            tax = taxable * (rate + surcharge)
            breakdown.append({
                "band": f"£{prev:,.0f} – {'£{:,.0f}'.format(limit) if limit != float('inf') else 'above'}",
                "rate": f"{(rate + surcharge) * 100:.0f}%",
                "tax": round(tax, 2),
            })
            total += tax
            prev = limit

    if is_additional_property and surcharge > 0:
        breakdown.append({"note": "+3% additional property surcharge included"})

    return {
        "amount": round(total, 2),
        "breakdown": breakdown,
        "country": "England/Northern Ireland",
        "is_first_time_buyer": is_first_time_buyer,
        "is_additional_property": is_additional_property,
    }


def calculate_true_cost(
    interest_rate: float,
    arrangement_fee: float,
    loan_amount: float,
    term_years: int,
    product_period_years: int,
) -> dict:
    """Calculate total cost of ownership over the initial product period."""
    monthly = calculate_monthly_payment(loan_amount, interest_rate, term_years)
    product_months = product_period_years * 12
    total_payments = monthly * product_months
    total_cost = total_payments + arrangement_fee
    return {
        "monthly_payment": monthly,
        "product_period_months": product_months,
        "total_payments_in_period": round(total_payments, 2),
        "arrangement_fee": arrangement_fee,
        "total_cost_of_ownership": round(total_cost, 2),
    }


def run_full_affordability(
    annual_income: float,
    partner_income: float,
    monthly_debts: float,
    employment_type: str,
    property_value: float,
    deposit_amount: float,
    term_years: int,
    is_first_time_buyer: bool,
    is_additional_property: bool = False,
    country: str = "england",
) -> dict:
    loan_amount = property_value - deposit_amount
    ltv = calculate_ltv(loan_amount, property_value)
    borrowing = calculate_max_borrowing(annual_income, partner_income, employment_type)

    # Indicative rate by LTV band
    if ltv <= 60:
        indicative_rate = 4.19
    elif ltv <= 75:
        indicative_rate = 4.44
    elif ltv <= 80:
        indicative_rate = 4.69
    elif ltv <= 85:
        indicative_rate = 4.99
    elif ltv <= 90:
        indicative_rate = 5.39
    else:
        indicative_rate = 5.89

    monthly = calculate_monthly_payment(loan_amount, indicative_rate, term_years)
    stress_monthly = calculate_monthly_payment(loan_amount, indicative_rate + 3.0, term_years)
    net_income_monthly = ((annual_income + partner_income) * 0.78) / 12  # approx after tax
    dti = round((monthly + monthly_debts) / net_income_monthly * 100, 1) if net_income_monthly else 0

    is_affordable = (
        loan_amount <= borrowing["standard"]
        and dti <= 45
        and ltv <= 95
    )

    notes = borrowing["notes"]
    if ltv > 90:
        notes.append("LTV above 90% — limited lender choice; government schemes may help")
    if dti > 40:
        notes.append(f"DTI of {dti}% is high — reducing debts before applying could improve options")
    if loan_amount > borrowing["stretched"]:
        notes.append("Loan requested exceeds most lender limits — joint application or larger deposit may be needed")

    stamp_duty = calculate_stamp_duty(property_value, is_first_time_buyer, is_additional_property, country)

    return {
        "loan_requested": round(loan_amount, 2),
        "property_value": property_value,
        "deposit": deposit_amount,
        "ltv_percent": ltv,
        "max_borrowing_conservative": borrowing["conservative"],
        "max_borrowing_standard": borrowing["standard"],
        "max_borrowing_stretched": borrowing["stretched"],
        "indicative_rate_percent": indicative_rate,
        "monthly_payment_estimate": monthly,
        "stress_tested_monthly": stress_monthly,
        "dti_percent": dti,
        "is_affordable": is_affordable,
        "stamp_duty": stamp_duty,
        "notes": notes,
        "disclaimer": "These are indicative estimates only. Actual lender decisions depend on full affordability assessment, credit profile, and individual circumstances.",
    }
