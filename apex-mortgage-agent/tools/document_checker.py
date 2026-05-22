"""UK mortgage document requirements by client profile."""


def generate_checklist(
    employment_type: str,
    mortgage_type: str,
    is_first_time_buyer: bool = False,
    is_new_build: bool = False,
    has_partner: bool = False,
) -> dict:
    docs = {}

    # ─── Identity & Address (everyone) ────────────────────────────
    docs["Identity & Address"] = [
        "Valid passport OR full UK driving licence (photo ID)",
        "Proof of address dated within 3 months (utility bill, bank statement, or council tax bill)",
    ]
    if has_partner:
        docs["Identity & Address"].append("Same ID documents for second applicant")

    # ─── Income Evidence ───────────────────────────────────────────
    if employment_type == "employed":
        docs["Income Evidence"] = [
            "Last 3 months' payslips (most recent)",
            "Last 3 months' bank statements (salary account)",
            "Latest P60 (end of tax year certificate from employer)",
            "Employment contract or offer letter (if < 6 months in role)",
        ]
        if has_partner:
            docs["Income Evidence"].append("Same income documents for second applicant")

    elif employment_type == "self_employed":
        docs["Income Evidence"] = [
            "Last 2–3 years' SA302 tax calculations (from HMRC online account or accountant)",
            "Last 2–3 years' tax year overviews (from HMRC — confirms SA302 figures)",
            "Last 2–3 years' full accounts (prepared by accountant — limited company directors)",
            "Last 6 months' business bank statements",
            "Last 3 months' personal bank statements",
            "Accountant's certificate (some lenders require this)",
        ]
        docs["Notes"] = [
            "Most lenders use the lower of last 2 years' income or the 2-year average",
            "Trading for less than 2 years significantly restricts lender choice",
        ]

    elif employment_type == "contractor":
        docs["Income Evidence"] = [
            "Current contract (signed, showing day/hourly rate and end date)",
            "Evidence of contract history (last 12–24 months — previous contracts)",
            "Last 3 months' bank statements (contract income)",
            "Last 2 years' SA302 and tax year overviews (if Ltd company director)",
            "Umbrella company payslips (if applicable, last 3 months)",
        ]
        docs["Notes"] = [
            "Income typically calculated as: day rate × 5 days × 46 weeks",
            "Gap between contracts of more than 6 weeks may be questioned",
        ]

    elif employment_type == "retired":
        docs["Income Evidence"] = [
            "State pension award letter",
            "Private/occupational pension statements (most recent annual statement)",
            "Investment/drawdown statements (if income from investments)",
            "Last 3 months' bank statements",
        ]

    # ─── Bank Statements (everyone) ────────────────────────────────
    if "bank statements" not in str(docs.get("Income Evidence", [])).lower():
        docs.setdefault("Bank Statements", []).append(
            "Last 3 months' personal bank statements (salary/income account)"
        )

    # ─── Property Documents ────────────────────────────────────────
    if mortgage_type == "purchase":
        docs["Property Documents"] = [
            "Accepted offer / memorandum of sale from estate agent",
            "Solicitor / conveyancer details (name, firm, address)",
        ]
        if is_new_build:
            docs["Property Documents"] += [
                "Developer's build completion date (exchange required before expiry)",
                "New build warranty details (NHBC Buildmark, Premier Guarantee, etc.)",
                "Help to Buy equity loan agreement (if applicable)",
            ]
        if is_first_time_buyer:
            docs["Property Documents"].append(
                "Confirmation of no previous property ownership (lender declaration form)"
            )

    elif mortgage_type == "remortgage":
        docs["Property Documents"] = [
            "Current mortgage statement (most recent annual statement)",
            "Property title deeds / Land Registry entry (solicitor will obtain)",
            "Buildings insurance schedule",
        ]

    elif mortgage_type == "btl":
        docs["Property Documents"] = [
            "Tenancy agreement (AST) or projected rental valuation from letting agent",
            "Evidence of existing portfolio (if applicable — mortgage statements)",
            "Buildings insurance schedule",
        ]

    # ─── Additional for BTL ────────────────────────────────────────
    if mortgage_type == "btl":
        docs["BTL Specific"] = [
            "Rental income evidence: existing AST or RICS surveyor rental assessment",
            "Evidence of 'top slicing' income (if rental yield is borderline)",
            "Portfolio schedule (if 4+ mortgaged properties — HMO licence if applicable)",
        ]

    # ─── Credit & Finance ──────────────────────────────────────────
    docs["Credit & Existing Commitments"] = [
        "Details of any existing loans, credit cards, HP agreements",
        "Divorce/separation court order (if applicable — affects maintenance commitments)",
        "Gift letter from family (if deposit includes gifted funds — from solicitor template)",
    ]

    docs["Disclaimer"] = [
        "Document requirements vary by lender. Your mortgage adviser will confirm the exact list once a lender is selected.",
        "Keep originals safe — most lenders require certified copies or digital upload via their portal.",
    ]

    return docs
