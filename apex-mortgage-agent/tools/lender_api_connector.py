"""
Mock UK mortgage product data.
In production, replace with live API calls to Trigold, Twenty7Tec, or Acre.
Products reflect realistic May 2026 indicative market rates.
"""
from dataclasses import dataclass


@dataclass
class MortgageProduct:
    lender: str
    product_name: str
    product_type: str        # fixed_2yr, fixed_5yr, fixed_10yr, tracker, offset
    initial_rate: float      # % p.a.
    revert_rate: float       # SVR % p.a.
    arrangement_fee: int     # £
    max_ltv: int             # %
    min_loan: int            # £
    max_loan: int            # £
    early_repayment_charge: str
    incentives: list[str]
    eligible_for: list[str]  # purchase, remortgage, btl, ftb
    notes: str


PRODUCTS: list[MortgageProduct] = [
    # ─── 60% LTV ───────────────────────────────────────────────────
    MortgageProduct("Nationwide", "2-Year Fixed Premier", "fixed_2yr", 4.19, 7.99, 999, 60, 25_000, 1_500_000,
                    "2% yr1, 1% yr2", ["Free valuation", "£500 cashback"], ["purchase", "remortgage", "ftb"],
                    "Best rate tier — requires 40% deposit or equity"),
    MortgageProduct("Halifax", "5-Year Fixed Reward", "fixed_5yr", 4.29, 7.49, 995, 60, 25_000, 1_000_000,
                    "5%, 4%, 3%, 2%, 1%", ["Free standard valuation"], ["purchase", "remortgage", "ftb"],
                    "Rate guaranteed for 5 years"),
    MortgageProduct("HSBC", "10-Year Fixed", "fixed_10yr", 4.49, 6.99, 0, 60, 25_000, 2_000_000,
                    "Sliding 5% to 1%", ["No arrangement fee"], ["purchase", "remortgage"],
                    "No-fee option — ideal for long-term certainty"),
    MortgageProduct("Barclays", "2-Year Tracker", "tracker", 4.09, 7.24, 999, 60, 25_000, 1_000_000,
                    "None", ["Free valuation"], ["purchase", "remortgage"],
                    "BOE Base Rate + 0.84% — can overpay/port without charge"),

    # ─── 75% LTV ───────────────────────────────────────────────────
    MortgageProduct("NatWest", "2-Year Fixed", "fixed_2yr", 4.44, 7.74, 995, 75, 25_000, 1_000_000,
                    "2% yr1, 1% yr2", ["Free basic valuation"], ["purchase", "remortgage", "ftb"],
                    "Strong high-street option"),
    MortgageProduct("Santander", "5-Year Fixed", "fixed_5yr", 4.54, 7.50, 999, 75, 25_000, 750_000,
                    "5%, 4%, 3%, 2%, 1%", ["Free valuation", "Free legal for remortgage"], ["purchase", "remortgage"],
                    "Good remortgage package"),
    MortgageProduct("Lloyds Bank", "5-Year Fixed", "fixed_5yr", 4.59, 7.49, 0, 75, 25_000, 1_000_000,
                    "5%, 4%, 3%, 2%, 1%", ["No arrangement fee"], ["purchase", "remortgage", "ftb"],
                    "No-fee option with solid rate"),
    MortgageProduct("Virgin Money", "2-Year Tracker", "tracker", 4.39, 7.99, 995, 75, 25_000, 600_000,
                    "None", ["Free valuation"], ["purchase", "remortgage"],
                    "BOE Base Rate + 1.14%"),

    # ─── 85% LTV ───────────────────────────────────────────────────
    MortgageProduct("Halifax", "2-Year Fixed", "fixed_2yr", 4.99, 7.49, 995, 85, 25_000, 500_000,
                    "2% yr1, 1% yr2", ["Free valuation"], ["purchase", "remortgage", "ftb"],
                    "Available up to 85% LTV — good FTB option"),
    MortgageProduct("Nationwide", "5-Year Fixed FTB", "fixed_5yr", 5.09, 7.99, 0, 85, 25_000, 500_000,
                    "5%, 4%, 3%, 2%, 1%", ["Free valuation", "No arrangement fee"], ["purchase", "ftb"],
                    "First-time buyer focus; no arrangement fee"),
    MortgageProduct("Platform", "2-Year Fixed", "fixed_2yr", 5.19, 7.99, 999, 85, 25_000, 750_000,
                    "2% yr1, 1% yr2", ["Free valuation"], ["purchase", "remortgage"],
                    "Flexible underwriting for complex incomes"),

    # ─── 90% LTV ───────────────────────────────────────────────────
    MortgageProduct("Barclays", "2-Year Fixed 90%", "fixed_2yr", 5.39, 7.24, 999, 90, 25_000, 500_000,
                    "2% yr1, 1% yr2", ["Free valuation"], ["purchase", "ftb"],
                    "90% LTV FTB-friendly"),
    MortgageProduct("NatWest", "5-Year Fixed 90%", "fixed_5yr", 5.49, 7.74, 0, 90, 25_000, 500_000,
                    "5%, 4%, 3%, 2%, 1%", ["No arrangement fee"], ["purchase", "ftb"],
                    "Good 5-year certainty at 90% LTV"),
    MortgageProduct("Skipton BS", "Track Record Mortgage", "fixed_5yr", 5.89, 7.50, 995, 100, 25_000, 600_000,
                    "5%, 4%, 3%, 2%, 1%", [], ["purchase", "ftb"],
                    "100% LTV — renters with 12-month track record, no deposit required"),

    # ─── Buy to Let ────────────────────────────────────────────────
    MortgageProduct("BM Solutions", "2-Year Fixed BTL", "fixed_2yr", 5.29, 8.24, 1_995, 75, 25_000, 3_000_000,
                    "2% yr1, 1% yr2", ["Free valuation"], ["btl"],
                    "Rental income must cover 125% of monthly payment at 5.5% stress rate"),
    MortgageProduct("The Mortgage Works", "5-Year Fixed BTL", "fixed_5yr", 5.19, 7.99, 1_499, 75, 25_000, 2_000_000,
                    "5%, 4%, 3%, 2%, 1%", [], ["btl"],
                    "Nationwide subsidiary — strong BTL specialist"),
    MortgageProduct("Paragon Bank", "5-Year Fixed BTL HMO", "fixed_5yr", 5.49, 8.50, 1_995, 75, 50_000, 2_000_000,
                    "5%, 4%, 3%, 2%, 1%", [], ["btl"],
                    "HMO and limited company BTL accepted"),

    # ─── Offset ────────────────────────────────────────────────────
    MortgageProduct("First Direct", "2-Year Offset Tracker", "offset", 4.29, 6.99, 999, 75, 50_000, 3_000_000,
                    "None", ["Free valuation"], ["purchase", "remortgage"],
                    "Link savings/current account — pay interest on net balance"),
    MortgageProduct("Barclays", "5-Year Offset Fixed", "offset", 4.69, 7.24, 999, 75, 50_000, 1_500_000,
                    "5%, 4%, 3%, 2%, 1%", [], ["purchase", "remortgage"],
                    "Family offset — link family members' savings"),
]


def search_products(
    loan_amount: float,
    property_value: float,
    mortgage_type: str = "purchase",
    product_preference: str = "any",
    is_first_time_buyer: bool = False,
    credit_score_range: str = "good",
    term_years: int = 25,
    max_results: int = 5,
) -> list[dict]:
    from tools.affordability_calculator import calculate_monthly_payment, calculate_true_cost

    ltv = round((loan_amount / property_value) * 100, 1)

    # Credit-impaired: restrict to specialist lenders / lower LTV
    if credit_score_range in ("poor", "very_poor"):
        eligible = [p for p in PRODUCTS if p.max_ltv <= 75]
    else:
        eligible = list(PRODUCTS)

    # Filter by LTV
    eligible = [p for p in eligible if p.max_ltv >= ltv]

    # Filter by mortgage type
    if mortgage_type == "btl":
        eligible = [p for p in eligible if "btl" in p.eligible_for]
    elif is_first_time_buyer:
        eligible = [p for p in eligible if "ftb" in p.eligible_for or "purchase" in p.eligible_for]
    else:
        eligible = [p for p in eligible if mortgage_type in p.eligible_for or "purchase" in p.eligible_for]

    # Filter by product preference
    if product_preference != "any":
        pref_matches = [p for p in eligible if p.product_type == product_preference]
        eligible = pref_matches if pref_matches else eligible

    # Sort by total cost of ownership (monthly + fee amortised over product period)
    def sort_key(p):
        period = 2 if "2yr" in p.product_type else (5 if "5yr" in p.product_type else (10 if "10yr" in p.product_type else 2))
        tc = calculate_true_cost(p.initial_rate, p.arrangement_fee, loan_amount, term_years, period)
        return tc["total_cost_of_ownership"]

    eligible.sort(key=sort_key)
    top = eligible[:max_results]

    results = []
    for p in top:
        period = 2 if "2yr" in p.product_type else (5 if "5yr" in p.product_type else (10 if "10yr" in p.product_type else 2))
        tc = calculate_true_cost(p.initial_rate, p.arrangement_fee, loan_amount, term_years, period)
        results.append({
            "lender": p.lender,
            "product_name": p.product_name,
            "product_type": p.product_type,
            "initial_rate_percent": p.initial_rate,
            "revert_rate_percent": p.revert_rate,
            "arrangement_fee_gbp": p.arrangement_fee,
            "max_ltv_percent": p.max_ltv,
            "early_repayment_charges": p.early_repayment_charge,
            "incentives": p.incentives,
            "monthly_payment_gbp": tc["monthly_payment"],
            "total_cost_initial_period_gbp": tc["total_cost_of_ownership"],
            "product_period_years": period,
            "notes": p.notes,
        })

    return results
