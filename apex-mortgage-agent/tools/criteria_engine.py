"""
Criteria Engine — comprehensive UK adverse/specialist mortgage lender criteria
database with Claude-powered natural-language search and pure-Python client
matching logic.

Lender criteria reflect typical 2024/2025 UK market values sourced from product
guides and BDM communications. ALWAYS verify current criteria with the lender's
BDM or latest product guide before submission — criteria change frequently.
"""
from __future__ import annotations

import json
import os

import anthropic

# ── Lender criteria database ─────────────────────────────────────────────────
# Keyed by internal lender slug. Display names are in the "display_name" field.

LENDER_CRITERIA: dict[str, dict] = {
    "precise_mortgages": {
        "display_name": "Precise Mortgages",
        "tier": "adverse_light",
        "website": "precisemortgages.co.uk",
        "max_ltv_residential": 85,
        "max_ltv_btl": 80,
        "min_loan": 25000,
        "max_loan": 1000000,
        "min_income": 15000,
        "employment_types": ["employed", "self_employed", "contractor"],
        "ccj_policy": {
            "max_count": 3,
            "max_single_amount": 2500,
            "max_total": 5000,
            "min_months_old": 12,
            "satisfied_required": True,
        },
        "default_policy": {
            "max_count": 3,
            "max_single_amount": 2500,
            "min_months_old": 12,
            "satisfied_required": False,
        },
        "iva_policy": {"accepted": False, "min_months_discharged": 0},
        "bankruptcy_policy": {"accepted": False, "min_years_discharged": 0},
        "dmp_policy": {"accepted": True, "must_be_satisfied": False, "min_months_since": 12},
        "payday_loan_policy": {"accepted": True, "min_months_clean": 12},
        "missed_payments_12m": 1,
        "repossession_policy": {"accepted": False, "min_years_ago": 0},
        "proc_fee_purchase_pct": 0.35,
        "proc_fee_remortgage_pct": 0.35,
        "typical_initial_rate_adverse": 6.49,
        "btl_icr_basic_rate": 125.0,
        "btl_icr_higher_rate": 145.0,
        "min_applicant_age": 21,
        "max_applicant_age_at_end": 75,
        "key_strengths": [
            "Satisfied CCJs up to £2,500 considered with only 12 months seasoning",
            "Strong self-employed proposition — 1 year's accounts accepted",
            "Excellent BDM support and fast DIP turnaround",
        ],
        "key_weaknesses": [
            "No IVA or bankruptcy — routes out heavy adverse cases",
            "CCJ satisfaction required — unsatisfied markers are a blocker",
            "Payday loans must be historic (12+ months) and conduct must be clean",
        ],
        "notes": (
            "Popular first-port-of-call adverse lender. Tiered rate pricing means "
            "cleaner adverse profiles attract better rates. BDM team widely praised "
            "across the broker community."
        ),
    },

    "kensington_mortgages": {
        "display_name": "Kensington Mortgages",
        "tier": "adverse_light",
        "website": "kensingtonmortgages.co.uk",
        "max_ltv_residential": 90,
        "max_ltv_btl": 75,
        "min_loan": 50000,
        "max_loan": 1500000,
        "min_income": 15000,
        "employment_types": ["employed", "self_employed", "contractor", "retired"],
        "ccj_policy": {
            "max_count": 4,
            "max_single_amount": 5000,
            "max_total": 10000,
            "min_months_old": 12,
            "satisfied_required": False,
        },
        "default_policy": {
            "max_count": 4,
            "max_single_amount": 5000,
            "min_months_old": 12,
            "satisfied_required": False,
        },
        "iva_policy": {"accepted": True, "min_months_discharged": 12},
        "bankruptcy_policy": {"accepted": False, "min_years_discharged": 0},
        "dmp_policy": {"accepted": True, "must_be_satisfied": False, "min_months_since": 12},
        "payday_loan_policy": {"accepted": True, "min_months_clean": 12},
        "missed_payments_12m": 2,
        "repossession_policy": {"accepted": False, "min_years_ago": 0},
        "proc_fee_purchase_pct": 0.40,
        "proc_fee_remortgage_pct": 0.40,
        "typical_initial_rate_adverse": 6.74,
        "btl_icr_basic_rate": 125.0,
        "btl_icr_higher_rate": 145.0,
        "min_applicant_age": 18,
        "max_applicant_age_at_end": 75,
        "key_strengths": [
            "Unsatisfied CCJs accepted — one of very few lenders to allow this",
            "IVA accepted from 12 months after discharge",
            "Highest residential LTV at 90% in adverse market",
        ],
        "key_weaknesses": [
            "No bankruptcy accepted at any point",
            "Minimum loan £50,000 excludes smaller purchases",
            "Payday loans still require 12-month clean period",
        ],
        "notes": (
            "One of the most flexible adverse lenders for unsatisfied CCJs and IVA "
            "cases. Complex income types (multiple jobs, irregular earnings) handled "
            "sympathetically. 90% LTV is market-leading for adverse credit clients."
        ),
    },

    "aldermore": {
        "display_name": "Aldermore",
        "tier": "adverse",
        "website": "aldermore.co.uk",
        "max_ltv_residential": 75,
        "max_ltv_btl": 75,
        "min_loan": 25000,
        "max_loan": 750000,
        "min_income": 0,
        "employment_types": ["employed", "self_employed", "contractor", "retired", "benefits"],
        "ccj_policy": {
            "max_count": 0,  # 0 = no hard cap — case by case
            "max_single_amount": 0,
            "max_total": 0,
            "min_months_old": 0,
            "satisfied_required": False,
        },
        "default_policy": {
            "max_count": 0,
            "max_single_amount": 0,
            "min_months_old": 0,
            "satisfied_required": False,
        },
        "iva_policy": {"accepted": True, "min_months_discharged": 0},
        "bankruptcy_policy": {"accepted": False, "min_years_discharged": 0},
        "dmp_policy": {"accepted": True, "must_be_satisfied": False, "min_months_since": 0},
        "payday_loan_policy": {"accepted": False, "min_months_clean": 0},
        "missed_payments_12m": 3,
        "repossession_policy": {"accepted": False, "min_years_ago": 0},
        "proc_fee_purchase_pct": 0.35,
        "proc_fee_remortgage_pct": 0.35,
        "typical_initial_rate_adverse": 7.09,
        "btl_icr_basic_rate": 125.0,
        "btl_icr_higher_rate": 145.0,
        "min_applicant_age": 18,
        "max_applicant_age_at_end": 80,
        "key_strengths": [
            "Best-in-class self-employed proposition — 1 year's accounts accepted across most products",
            "No hard caps on CCJ count or amount — genuinely case-by-case underwriting",
            "Portfolio landlord friendly with no limit on background portfolio size",
        ],
        "key_weaknesses": [
            "No bankruptcy accepted",
            "Payday loans are a hard decline — no exceptions",
            "Max LTV 75% restricts equity-light cases",
        ],
        "notes": (
            "Aldermore's strength is complex income and moderate adverse. Particularly "
            "popular for self-employed clients with CCJs/defaults who have 1 year's "
            "trading accounts. Manual underwriting on complex cases."
        ),
    },

    "together_money": {
        "display_name": "Together Money",
        "tier": "heavy_adverse",
        "website": "togethermoney.com",
        "max_ltv_residential": 75,
        "max_ltv_btl": 75,
        "min_loan": 10000,
        "max_loan": 5000000,
        "min_income": 0,
        "employment_types": ["employed", "self_employed", "contractor", "retired", "benefits"],
        "ccj_policy": {
            "max_count": 0,
            "max_single_amount": 0,
            "max_total": 0,
            "min_months_old": 0,
            "satisfied_required": False,
        },
        "default_policy": {
            "max_count": 0,
            "max_single_amount": 0,
            "min_months_old": 0,
            "satisfied_required": False,
        },
        "iva_policy": {"accepted": True, "min_months_discharged": 0},
        "bankruptcy_policy": {"accepted": True, "min_years_discharged": 1},
        "dmp_policy": {"accepted": True, "must_be_satisfied": False, "min_months_since": 0},
        "payday_loan_policy": {"accepted": True, "min_months_clean": 0},
        "missed_payments_12m": 6,
        "repossession_policy": {"accepted": True, "min_years_ago": 1},
        "proc_fee_purchase_pct": 0.50,
        "proc_fee_remortgage_pct": 0.50,
        "typical_initial_rate_adverse": 9.49,
        "btl_icr_basic_rate": 125.0,
        "btl_icr_higher_rate": 145.0,
        "min_applicant_age": 18,
        "max_applicant_age_at_end": 85,
        "key_strengths": [
            "No minimum clean period — accepts very recent adverse credit including active CCJs",
            "Bankruptcy accepted from 1 year after discharge",
            "Unusual property types accepted — flats above commercial, non-standard construction",
        ],
        "key_weaknesses": [
            "Rates reflect the risk — among the highest in the specialist market",
            "Bridging-adjacent pricing on heavily adverse residential cases",
            "Second charge heavy focus means first-charge residential rates less competitive",
        ],
        "notes": (
            "Together is the go-to lender for heavy adverse and non-standard property "
            "combinations. Also strong for bridging finance alongside mortgage. Payday "
            "loans, repossessions, and active IVAs all considered. Rates are premium."
        ),
    },

    "pepper_money": {
        "display_name": "Pepper Money",
        "tier": "adverse",
        "website": "peppermoney.co.uk",
        "max_ltv_residential": 75,
        "max_ltv_btl": 75,
        "min_loan": 25000,
        "max_loan": 1000000,
        "min_income": 10000,
        "employment_types": ["employed", "self_employed", "contractor", "retired"],
        "ccj_policy": {
            "max_count": 0,
            "max_single_amount": 0,
            "max_total": 0,
            "min_months_old": 0,
            "satisfied_required": False,
        },
        "default_policy": {
            "max_count": 0,
            "max_single_amount": 0,
            "min_months_old": 0,
            "satisfied_required": False,
        },
        "iva_policy": {"accepted": True, "min_months_discharged": 0},
        "bankruptcy_policy": {"accepted": False, "min_years_discharged": 0},
        "dmp_policy": {"accepted": True, "must_be_satisfied": False, "min_months_since": 0},
        "payday_loan_policy": {"accepted": True, "min_months_clean": 6},
        "missed_payments_12m": 4,
        "repossession_policy": {"accepted": False, "min_years_ago": 0},
        "proc_fee_purchase_pct": 0.40,
        "proc_fee_remortgage_pct": 0.40,
        "typical_initial_rate_adverse": 7.74,
        "btl_icr_basic_rate": 125.0,
        "btl_icr_higher_rate": 145.0,
        "min_applicant_age": 21,
        "max_applicant_age_at_end": 75,
        "key_strengths": [
            "Tiered pricing model rewards cleaner adverse history within adverse tier",
            "Multiple CCJs and defaults considered with no hard count cap",
            "Interest-only available up to 75% LTV for adverse cases",
        ],
        "key_weaknesses": [
            "No bankruptcy at any stage — hard exclusion",
            "No repossession history accepted",
            "75% LTV cap applies across all adverse tiers",
        ],
        "notes": (
            "Pepper Money's tiered rate structure (Pepper 1-6) allows brokers to price "
            "clients accurately based on adverse severity. IVA and active DMP cases "
            "accepted. Strong for recent adverse where other lenders require seasoning."
        ),
    },

    "norton_home_loans": {
        "display_name": "Norton Home Loans",
        "tier": "heavy_adverse",
        "website": "nortonfinancial.co.uk",
        "max_ltv_residential": 70,
        "max_ltv_btl": 65,
        "min_loan": 20000,
        "max_loan": 500000,
        "min_income": 10000,
        "employment_types": ["employed", "self_employed", "contractor", "retired", "benefits"],
        "ccj_policy": {
            "max_count": 0,
            "max_single_amount": 0,
            "max_total": 0,
            "min_months_old": 0,
            "satisfied_required": False,
        },
        "default_policy": {
            "max_count": 0,
            "max_single_amount": 0,
            "min_months_old": 0,
            "satisfied_required": False,
        },
        "iva_policy": {"accepted": True, "min_months_discharged": 0},
        "bankruptcy_policy": {"accepted": True, "min_years_discharged": 0},
        "dmp_policy": {"accepted": True, "must_be_satisfied": False, "min_months_since": 0},
        "payday_loan_policy": {"accepted": True, "min_months_clean": 0},
        "missed_payments_12m": 6,
        "repossession_policy": {"accepted": True, "min_years_ago": 0},
        "proc_fee_purchase_pct": 0.50,
        "proc_fee_remortgage_pct": 0.50,
        "typical_initial_rate_adverse": 10.24,
        "btl_icr_basic_rate": 125.0,
        "btl_icr_higher_rate": 145.0,
        "min_applicant_age": 18,
        "max_applicant_age_at_end": 75,
        "key_strengths": [
            "Discharged bankruptcy accepted from Day 1 of discharge — market-leading",
            "Repossession history accepted with no minimum seasoning period",
            "All adverse types accepted including active IVA and current DMP",
        ],
        "key_weaknesses": [
            "Max LTV 70% residential, 65% BTL — requires meaningful equity",
            "Rates are among the highest in the market at 10%+",
            "Smaller maximum loan (£500k) excludes higher-value properties",
        ],
        "notes": (
            "Norton specialises in the most severe adverse cases. Day-1 discharged "
            "bankruptcy acceptance is extremely rare in the UK market. Cases are "
            "manually underwritten. Broker relationship is key for complex submissions."
        ),
    },

    "mbs_lending": {
        "display_name": "MBS Lending",
        "tier": "heavy_adverse",
        "website": "mbslending.co.uk",
        "max_ltv_residential": 65,
        "max_ltv_btl": 60,
        "min_loan": 15000,
        "max_loan": 400000,
        "min_income": 0,
        "employment_types": ["employed", "self_employed", "contractor", "retired", "benefits"],
        "ccj_policy": {
            "max_count": 0,
            "max_single_amount": 0,
            "max_total": 0,
            "min_months_old": 0,
            "satisfied_required": False,
        },
        "default_policy": {
            "max_count": 0,
            "max_single_amount": 0,
            "min_months_old": 0,
            "satisfied_required": False,
        },
        "iva_policy": {"accepted": True, "min_months_discharged": 0},
        "bankruptcy_policy": {"accepted": True, "min_years_discharged": 0},
        "dmp_policy": {"accepted": True, "must_be_satisfied": False, "min_months_since": 0},
        "payday_loan_policy": {"accepted": True, "min_months_clean": 0},
        "missed_payments_12m": 12,
        "repossession_policy": {"accepted": True, "min_years_ago": 0},
        "proc_fee_purchase_pct": 0.55,
        "proc_fee_remortgage_pct": 0.55,
        "typical_initial_rate_adverse": 11.49,
        "btl_icr_basic_rate": 125.0,
        "btl_icr_higher_rate": 145.0,
        "min_applicant_age": 18,
        "max_applicant_age_at_end": 80,
        "key_strengths": [
            "Accepts the very heaviest adverse — niche lender of last resort for declined cases",
            "All cases manually underwritten by experienced team in Bradford",
            "No minimum income requirement — benefit income accepted",
        ],
        "key_weaknesses": [
            "Max LTV 65% residential requires substantial equity",
            "Maximum loan £400k limits applicability to higher-value properties",
            "Rates are highest in the market — refinance path must be in plan",
        ],
        "notes": (
            "MBS Lending is the market's true last resort for the most severe adverse "
            "cases. Manual underwriting on every case means experienced BDM contact "
            "is essential. Primarily used as a stepping-stone with a clear 2-3 year "
            "refinance strategy."
        ),
    },

    "bluestone_mortgages": {
        "display_name": "Bluestone Mortgages",
        "tier": "heavy_adverse",
        "website": "bluestonemortgages.co.uk",
        "max_ltv_residential": 70,
        "max_ltv_btl": 70,
        "min_loan": 25000,
        "max_loan": 750000,
        "min_income": 15000,
        "employment_types": ["employed", "self_employed", "contractor", "retired"],
        "ccj_policy": {
            "max_count": 0,
            "max_single_amount": 0,
            "max_total": 0,
            "min_months_old": 0,
            "satisfied_required": False,
        },
        "default_policy": {
            "max_count": 0,
            "max_single_amount": 0,
            "min_months_old": 0,
            "satisfied_required": False,
        },
        "iva_policy": {"accepted": True, "min_months_discharged": 0},
        "bankruptcy_policy": {"accepted": True, "min_years_discharged": 0},
        "dmp_policy": {"accepted": True, "must_be_satisfied": False, "min_months_since": 0},
        "payday_loan_policy": {"accepted": True, "min_months_clean": 0},
        "missed_payments_12m": 6,
        "repossession_policy": {"accepted": True, "min_years_ago": 1},
        "proc_fee_purchase_pct": 0.50,
        "proc_fee_remortgage_pct": 0.50,
        "typical_initial_rate_adverse": 9.74,
        "btl_icr_basic_rate": 125.0,
        "btl_icr_higher_rate": 145.0,
        "min_applicant_age": 18,
        "max_applicant_age_at_end": 80,
        "key_strengths": [
            "Unlimited CCJs and defaults by count — genuinely open adverse criteria",
            "Bankruptcy from Day 1 of discharge with 70% LTV",
            "Payday loans accepted with no mandatory clean period",
        ],
        "key_weaknesses": [
            "Minimum income £15k restricts lowest-income cases unlike MBS or Together",
            "Repossession requires at least 1 year seasoning unlike Norton",
            "Benefits income not generally accepted",
        ],
        "notes": (
            "Australian-backed specialist with broad UK adverse appetite. Comparable to "
            "Norton for bankruptcy but slightly more income-conscious. Good for high "
            "adverse-count cases where other lenders cap at 3-4 CCJs."
        ),
    },

    "vida_homeloans": {
        "display_name": "Vida Homeloans",
        "tier": "adverse",
        "website": "vidahomeloans.co.uk",
        "max_ltv_residential": 80,
        "max_ltv_btl": 75,
        "min_loan": 25000,
        "max_loan": 1000000,
        "min_income": 15000,
        "employment_types": ["employed", "self_employed", "contractor", "retired"],
        "ccj_policy": {
            "max_count": 0,
            "max_single_amount": 0,
            "max_total": 0,
            "min_months_old": 12,
            "satisfied_required": False,
        },
        "default_policy": {
            "max_count": 0,
            "max_single_amount": 0,
            "min_months_old": 12,
            "satisfied_required": False,
        },
        "iva_policy": {"accepted": True, "min_months_discharged": 12},
        "bankruptcy_policy": {"accepted": False, "min_years_discharged": 0},
        "dmp_policy": {"accepted": True, "must_be_satisfied": False, "min_months_since": 6},
        "payday_loan_policy": {"accepted": True, "min_months_clean": 12},
        "missed_payments_12m": 3,
        "repossession_policy": {"accepted": False, "min_years_ago": 0},
        "proc_fee_purchase_pct": 0.40,
        "proc_fee_remortgage_pct": 0.40,
        "typical_initial_rate_adverse": 7.29,
        "btl_icr_basic_rate": 125.0,
        "btl_icr_higher_rate": 145.0,
        "min_applicant_age": 21,
        "max_applicant_age_at_end": 75,
        "key_strengths": [
            "Strong complex income capability — multiple income streams, variable pay, bonus",
            "Up to 80% LTV on residential adverse — above average for the adverse tier",
            "Contractor and IT day-rate income handled well",
        ],
        "key_weaknesses": [
            "No bankruptcy — positioned above the heavy adverse tier",
            "No repossession history accepted",
            "12-month seasoning on CCJs/defaults limits very recent adverse",
        ],
        "notes": (
            "Vida's sweet spot is moderate adverse combined with complex income. "
            "Particularly popular for contractors and self-employed clients with some "
            "credit history. 80% LTV is competitive for this segment."
        ),
    },

    "landbay": {
        "display_name": "Landbay",
        "tier": "btl_specialist",
        "website": "landbay.co.uk",
        "max_ltv_residential": 0,
        "max_ltv_btl": 75,
        "min_loan": 50000,
        "max_loan": 3000000,
        "min_income": 0,
        "employment_types": ["employed", "self_employed", "contractor", "retired"],
        "ccj_policy": {
            "max_count": 1,
            "max_single_amount": 500,
            "max_total": 500,
            "min_months_old": 36,
            "satisfied_required": True,
        },
        "default_policy": {
            "max_count": 1,
            "max_single_amount": 500,
            "min_months_old": 36,
            "satisfied_required": True,
        },
        "iva_policy": {"accepted": False, "min_months_discharged": 0},
        "bankruptcy_policy": {"accepted": False, "min_years_discharged": 0},
        "dmp_policy": {"accepted": False, "must_be_satisfied": False, "min_months_since": 0},
        "payday_loan_policy": {"accepted": False, "min_months_clean": 0},
        "missed_payments_12m": 0,
        "repossession_policy": {"accepted": False, "min_years_ago": 0},
        "proc_fee_purchase_pct": 0.35,
        "proc_fee_remortgage_pct": 0.35,
        "typical_initial_rate_adverse": 5.49,
        "btl_icr_basic_rate": 125.0,
        "btl_icr_higher_rate": 145.0,
        "min_applicant_age": 21,
        "max_applicant_age_at_end": 85,
        "key_strengths": [
            "Specialist BTL-only lender with competitive rates for cleaner profiles",
            "Portfolio landlords and SPV lending accepted",
            "HMO and multi-unit freehold blocks considered",
        ],
        "key_weaknesses": [
            "BTL only — no residential mortgage product",
            "Very restrictive adverse criteria — near-prime profiles only",
            "No IVA, bankruptcy, DMP or payday loan history accepted",
        ],
        "notes": (
            "Landbay is a tech-forward BTL specialist targeting near-prime landlords. "
            "Criteria is tighter than other BTL specialists but rates are competitive. "
            "Not suitable for clients with meaningful adverse credit history."
        ),
    },

    "paragon_mortgages": {
        "display_name": "Paragon Mortgages",
        "tier": "btl_specialist",
        "website": "paragonbank.co.uk",
        "max_ltv_residential": 0,
        "max_ltv_btl": 80,
        "min_loan": 50000,
        "max_loan": 10000000,
        "min_income": 0,
        "employment_types": ["employed", "self_employed", "contractor", "retired"],
        "ccj_policy": {
            "max_count": 1,
            "max_single_amount": 1000,
            "max_total": 1000,
            "min_months_old": 36,
            "satisfied_required": True,
        },
        "default_policy": {
            "max_count": 1,
            "max_single_amount": 1000,
            "min_months_old": 36,
            "satisfied_required": True,
        },
        "iva_policy": {"accepted": False, "min_months_discharged": 0},
        "bankruptcy_policy": {"accepted": False, "min_years_discharged": 0},
        "dmp_policy": {"accepted": False, "must_be_satisfied": False, "min_months_since": 0},
        "payday_loan_policy": {"accepted": False, "min_months_clean": 0},
        "missed_payments_12m": 0,
        "repossession_policy": {"accepted": False, "min_years_ago": 0},
        "proc_fee_purchase_pct": 0.35,
        "proc_fee_remortgage_pct": 0.35,
        "typical_initial_rate_adverse": 5.69,
        "btl_icr_basic_rate": 125.0,
        "btl_icr_higher_rate": 145.0,
        "min_applicant_age": 21,
        "max_applicant_age_at_end": 85,
        "key_strengths": [
            "Market leader for portfolio landlords and complex BTL structures",
            "SPV lending, limited company, HMO, MUFBs all considered",
            "80% LTV BTL is above market average for specialist BTL lenders",
        ],
        "key_weaknesses": [
            "BTL only — no residential mortgage product",
            "Very restrictive adverse criteria — clear credit profile required",
            "Lengthy complex case processing times",
        ],
        "notes": (
            "Paragon is the UK's largest specialist BTL lender by portfolio size. "
            "Ideal for experienced landlords with clean credit building complex BTL "
            "portfolios. Not suitable for adverse credit clients. 80% LTV is a standout."
        ),
    },

    "foundation_home_loans": {
        "display_name": "Foundation Home Loans",
        "tier": "adverse_light",
        "website": "foundationhomeloans.co.uk",
        "max_ltv_residential": 85,
        "max_ltv_btl": 80,
        "min_loan": 25000,
        "max_loan": 1000000,
        "min_income": 15000,
        "employment_types": ["employed", "self_employed", "contractor", "retired"],
        "ccj_policy": {
            "max_count": 2,
            "max_single_amount": 2000,
            "max_total": 4000,
            "min_months_old": 24,
            "satisfied_required": True,
        },
        "default_policy": {
            "max_count": 2,
            "max_single_amount": 2000,
            "min_months_old": 24,
            "satisfied_required": True,
        },
        "iva_policy": {"accepted": False, "min_months_discharged": 0},
        "bankruptcy_policy": {"accepted": False, "min_years_discharged": 0},
        "dmp_policy": {"accepted": True, "must_be_satisfied": True, "min_months_since": 24},
        "payday_loan_policy": {"accepted": False, "min_months_clean": 0},
        "missed_payments_12m": 0,
        "repossession_policy": {"accepted": False, "min_years_ago": 0},
        "proc_fee_purchase_pct": 0.35,
        "proc_fee_remortgage_pct": 0.35,
        "typical_initial_rate_adverse": 6.24,
        "btl_icr_basic_rate": 125.0,
        "btl_icr_higher_rate": 145.0,
        "min_applicant_age": 21,
        "max_applicant_age_at_end": 75,
        "key_strengths": [
            "Strong residential and BTL proposition on a single platform",
            "Good for light adverse with otherwise strong income and equity profiles",
            "Competitive rates for near-prime adverse cases",
        ],
        "key_weaknesses": [
            "No payday loans accepted — hard exclusion",
            "No IVA, bankruptcy or active DMP",
            "24-month seasoning on CCJs and defaults is longer than some peers",
        ],
        "notes": (
            "Foundation is positioned for the lighter end of adverse — clients who "
            "have had minor credit issues but now have clean conduct. Works well as a "
            "step-up lender for clients moving from heavier adverse providers."
        ),
    },

    "kent_reliance": {
        "display_name": "Kent Reliance",
        "tier": "adverse",
        "website": "kentreliance.co.uk",
        "max_ltv_residential": 80,
        "max_ltv_btl": 80,
        "min_loan": 25000,
        "max_loan": 1500000,
        "min_income": 15000,
        "employment_types": ["employed", "self_employed", "contractor", "retired"],
        "ccj_policy": {
            "max_count": 3,
            "max_single_amount": 3000,
            "max_total": 8000,
            "min_months_old": 0,
            "satisfied_required": False,
        },
        "default_policy": {
            "max_count": 3,
            "max_single_amount": 3000,
            "min_months_old": 0,
            "satisfied_required": False,
        },
        "iva_policy": {"accepted": True, "min_months_discharged": 0},
        "bankruptcy_policy": {"accepted": False, "min_years_discharged": 0},
        "dmp_policy": {"accepted": True, "must_be_satisfied": False, "min_months_since": 0},
        "payday_loan_policy": {"accepted": True, "min_months_clean": 6},
        "missed_payments_12m": 3,
        "repossession_policy": {"accepted": False, "min_years_ago": 0},
        "proc_fee_purchase_pct": 0.40,
        "proc_fee_remortgage_pct": 0.40,
        "typical_initial_rate_adverse": 7.49,
        "btl_icr_basic_rate": 125.0,
        "btl_icr_higher_rate": 145.0,
        "min_applicant_age": 21,
        "max_applicant_age_at_end": 85,
        "key_strengths": [
            "Strong residential and BTL adverse offering from a single lender",
            "IVA accepted with no minimum discharge period — very open",
            "80% LTV on both residential and BTL adverse",
        ],
        "key_weaknesses": [
            "No bankruptcy accepted",
            "No repossession history accepted",
            "Part of OneSavings Bank — same credit team means declined cases unlikely to pass to sister brands",
        ],
        "notes": (
            "Kent Reliance (part of OSB Group) offers broad adverse criteria including "
            "active IVAs. Popular for residential adverse cases at 80% LTV. Strong "
            "BTL proposition for landlords with some adverse. Manual underwriting "
            "available for complex cases."
        ),
    },

    "gatehouse_bank": {
        "display_name": "Gatehouse Bank",
        "tier": "adverse_light",
        "website": "gatehousebank.com",
        "max_ltv_residential": 80,
        "max_ltv_btl": 75,
        "min_loan": 30000,
        "max_loan": 1500000,
        "min_income": 20000,
        "employment_types": ["employed", "self_employed", "contractor", "retired"],
        "ccj_policy": {
            "max_count": 1,
            "max_single_amount": 1000,
            "max_total": 1000,
            "min_months_old": 24,
            "satisfied_required": True,
        },
        "default_policy": {
            "max_count": 1,
            "max_single_amount": 1000,
            "min_months_old": 24,
            "satisfied_required": True,
        },
        "iva_policy": {"accepted": False, "min_months_discharged": 0},
        "bankruptcy_policy": {"accepted": False, "min_years_discharged": 0},
        "dmp_policy": {"accepted": False, "must_be_satisfied": False, "min_months_since": 0},
        "payday_loan_policy": {"accepted": False, "min_months_clean": 0},
        "missed_payments_12m": 0,
        "repossession_policy": {"accepted": False, "min_years_ago": 0},
        "proc_fee_purchase_pct": 0.35,
        "proc_fee_remortgage_pct": 0.35,
        "typical_initial_rate_adverse": 5.99,
        "btl_icr_basic_rate": 125.0,
        "btl_icr_higher_rate": 145.0,
        "min_applicant_age": 21,
        "max_applicant_age_at_end": 75,
        "key_strengths": [
            "Sharia-compliant Home Purchase Plan — unique offering for Islamic finance clients",
            "Expat mortgages and overseas-income clients considered",
            "Competitive rates for near-prime cases despite specialist positioning",
        ],
        "key_weaknesses": [
            "Restrictive adverse criteria — near-prime profiles only",
            "Higher minimum income (£20k) than most specialist lenders",
            "Limited to very minor historic adverse — not suited to meaningful credit issues",
        ],
        "notes": (
            "Gatehouse Bank is unique in the UK market for its FCA-regulated Sharia-"
            "compliant Home Purchase Plans. Suitable for Muslim clients requiring "
            "interest-free finance and for expats. Credit criteria is near-prime; "
            "not appropriate for most adverse cases."
        ),
    },
}


# ── Claude-powered criteria search ──────────────────────────────────────────

_anthropic_client: anthropic.Anthropic | None = None


def _get_anthropic_client() -> anthropic.Anthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    return _anthropic_client


def _build_lender_matrix_text() -> str:
    """Render LENDER_CRITERIA as a readable text block for prompt injection."""
    lines = ["UK ADVERSE/SPECIALIST MORTGAGE LENDER CRITERIA MATRIX (2024/2025)\n"]
    lines.append("=" * 70)
    for slug, lc in LENDER_CRITERIA.items():
        lines.append(f"\n## {lc['display_name']} (slug: {slug})")
        lines.append(f"Tier: {lc['tier']} | Website: {lc['website']}")
        lines.append(
            f"LTV: residential {lc['max_ltv_residential']}% | BTL {lc['max_ltv_btl']}%"
        )
        lines.append(f"Loans: £{lc['min_loan']:,} – £{lc['max_loan']:,}")
        lines.append(f"Min income: £{lc['min_income']:,}/yr")
        lines.append(f"Employment: {', '.join(lc['employment_types'])}")
        ccj = lc["ccj_policy"]
        lines.append(
            f"CCJ policy: max count={ccj['max_count'] or 'no cap'} | "
            f"max single=£{ccj['max_single_amount'] or 'no cap'} | "
            f"min age={ccj['min_months_old']}m | "
            f"satisfied={'required' if ccj['satisfied_required'] else 'not required'}"
        )
        dflt = lc["default_policy"]
        lines.append(
            f"Default policy: max count={dflt['max_count'] or 'no cap'} | "
            f"max single=£{dflt['max_single_amount'] or 'no cap'} | "
            f"min age={dflt['min_months_old']}m | "
            f"satisfied={'required' if dflt['satisfied_required'] else 'not required'}"
        )
        iva = lc["iva_policy"]
        lines.append(
            f"IVA: {'accepted' if iva['accepted'] else 'NOT accepted'}"
            + (f" — {iva['min_months_discharged']}m discharged min" if iva["accepted"] else "")
        )
        bk = lc["bankruptcy_policy"]
        lines.append(
            f"Bankruptcy: {'accepted' if bk['accepted'] else 'NOT accepted'}"
            + (f" — {bk['min_years_discharged']}yr discharged min" if bk["accepted"] else "")
        )
        dmp = lc["dmp_policy"]
        lines.append(
            f"DMP: {'accepted' if dmp['accepted'] else 'NOT accepted'}"
            + (
                f" | must be satisfied: {dmp['must_be_satisfied']} | "
                f"{dmp['min_months_since']}m since min"
                if dmp["accepted"]
                else ""
            )
        )
        pdl = lc["payday_loan_policy"]
        lines.append(
            f"Payday loans: {'accepted' if pdl['accepted'] else 'NOT accepted'}"
            + (f" — {pdl['min_months_clean']}m clean min" if pdl["accepted"] else "")
        )
        lines.append(f"Missed payments (12m): max {lc['missed_payments_12m']}")
        repo = lc["repossession_policy"]
        lines.append(
            f"Repossession: {'accepted' if repo['accepted'] else 'NOT accepted'}"
            + (f" — {repo['min_years_ago']}yr ago min" if repo["accepted"] else "")
        )
        lines.append(
            f"Proc fee: purchase {lc['proc_fee_purchase_pct']}% | "
            f"remortgage {lc['proc_fee_remortgage_pct']}%"
        )
        lines.append(f"Typical adverse rate: {lc['typical_initial_rate_adverse']}%")
        lines.append(f"BTL ICR: basic rate {lc['btl_icr_basic_rate']}% | higher rate {lc['btl_icr_higher_rate']}%")
        lines.append(f"Age: min {lc['min_applicant_age']} | max at end {lc['max_applicant_age_at_end']}")
        lines.append("Strengths: " + " | ".join(lc["key_strengths"]))
        lines.append("Weaknesses: " + " | ".join(lc["key_weaknesses"]))
        lines.append(f"Notes: {lc['notes']}")
    return "\n".join(lines)


# Pre-build once at import time so the cached block stays stable
_LENDER_MATRIX_TEXT = _build_lender_matrix_text()

_SYSTEM_PROMPT = (
    "You are an expert UK specialist and adverse mortgage broker with deep knowledge "
    "of lender criteria, product guides, and placement strategy. You answer questions "
    "about which lenders can help specific client profiles, explain criteria differences, "
    "and provide practical placement guidance. You must always include a reminder that "
    "criteria should be verified with the lender BDM or current product guide before "
    "submission as they change frequently."
)

_RESPONSE_SCHEMA = """\
Return ONLY a JSON object with this exact structure — no markdown, no preamble:
{
  "answer": "<clear narrative answer to the query>",
  "matching_lenders": [
    {
      "lender": "<display_name>",
      "reason": "<why this lender fits>",
      "fit_score_pct": <integer 0-100>
    }
  ],
  "caveats": ["<caveat 1>", "<caveat 2>"],
  "always_verify": "<reminder to verify criteria before submission>"
}
"""


def search_criteria(query: str, client: dict | None = None) -> dict:
    """
    Use Claude to answer a natural-language question about UK adverse lender criteria.

    The static lender matrix is injected as the first user-message block with
    prompt caching enabled so repeated calls share the cached prefix and avoid
    re-processing the large criteria document on every request.

    Args:
        query:  Natural-language question from the broker, e.g.
                "Which lenders accept a discharged bankruptcy from 18 months ago
                at 70% LTV on a residential purchase?"
        client: Optional dict of client data (same shape as match_client_to_lenders)
                to provide additional context to the model.

    Returns:
        {
          "answer": str,
          "matching_lenders": [{"lender": str, "reason": str, "fit_score_pct": int}],
          "caveats": [str],
          "always_verify": str,
        }
    """
    ac = _get_anthropic_client()

    # Build the user turn — static lender matrix as first block (cached),
    # then the dynamic query and optional client context.
    user_content: list[dict] = [
        {
            "type": "text",
            "text": _LENDER_MATRIX_TEXT,
            "cache_control": {"type": "ephemeral"},
        },
        {
            "type": "text",
            "text": _RESPONSE_SCHEMA,
        },
    ]

    query_parts = [f"BROKER QUERY:\n{query}"]
    if client:
        query_parts.append(f"\nCLIENT PROFILE (for context):\n{json.dumps(client, indent=2)}")
    user_content.append({"type": "text", "text": "\n".join(query_parts)})

    response = ac.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    raw_text = response.content[0].text.strip()

    # Strip markdown code fences if present
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[-1]
        if raw_text.endswith("```"):
            raw_text = raw_text[: raw_text.rfind("```")]

    try:
        result = json.loads(raw_text)
    except json.JSONDecodeError:
        result = {
            "answer": raw_text,
            "matching_lenders": [],
            "caveats": ["Response could not be parsed as JSON — see answer field for raw output."],
            "always_verify": (
                "Always verify criteria with the lender BDM or current product guide "
                "before submission."
            ),
        }

    return result


# ── Pure-Python client matcher ───────────────────────────────────────────────

def match_client_to_lenders(client: dict) -> list[dict]:
    """
    Match a client's profile to eligible lenders using pure Python rules.

    Args:
        client: dict with any of the following keys:
            adverse_history: dict — {
                ccj:                  bool   (has CCJs)
                ccj_count:            int
                ccj_largest_amount:   int    (largest single CCJ in £)
                ccj_total_amount:     int    (total CCJ value in £)
                ccj_satisfied:        bool   (all satisfied)
                default:              bool   (has defaults)
                default_count:        int
                default_largest:      int
                iva:                  bool
                iva_months_discharged: int   (0 = active/not discharged)
                bankruptcy:           bool
                bankruptcy_years_discharged: int  (0 = active)
                dmp:                  bool
                dmp_satisfied:        bool
                dmp_months_since:     int    (0 = active)
                payday_loans:         bool
                payday_months_clean:  int
                repossession:         bool
                repossession_years_ago: int
                months_since_most_recent: int  (months since any adverse event)
                missed_payments_12m:  int
            }
            loan_amount:        int    (e.g. 200000)
            property_value:     int    (e.g. 250000) — LTV auto-calculated
            declared_income:    float  (monthly income — multiplied × 12 internally)
            employment_type:    str    — "employed" | "self_employed" | "contractor" |
                                         "retired" | "benefits"
            purchase_type:      str    — "residential" | "btl" (default "residential")

    Returns:
        List of dicts sorted by fit_score descending:
        [
          {
            "lender":          str,   internal slug
            "display_name":    str,
            "fit_score":       int,   0-100
            "fit_reasons":     [str],
            "blockers":        [str],
            "indicative_rate": float, % initial rate
            "proc_fee_pct":    float,
          },
          ...
        ]
        Lenders with one or more blockers are included but sorted to the bottom.
    """
    adverse = client.get("adverse_history", {})
    loan_amount = int(client.get("loan_amount", 0))
    property_value = int(client.get("property_value", 1))
    annual_income = float(client.get("declared_income", 0)) * 12
    employment_type = client.get("employment_type", "employed")
    purchase_type = client.get("purchase_type", "residential")

    ltv = round((loan_amount / property_value) * 100, 1) if property_value > 0 else 100.0

    # Adverse flags
    has_ccj = bool(adverse.get("ccj", False))
    ccj_count = int(adverse.get("ccj_count", 0))
    ccj_largest = int(adverse.get("ccj_largest_amount", 0))
    ccj_total = int(adverse.get("ccj_total_amount", 0))
    ccj_satisfied = bool(adverse.get("ccj_satisfied", False))

    has_default = bool(adverse.get("default", False))
    default_count = int(adverse.get("default_count", 0))
    default_largest = int(adverse.get("default_largest", 0))

    has_iva = bool(adverse.get("iva", False))
    iva_months_discharged = int(adverse.get("iva_months_discharged", 0))

    has_bankruptcy = bool(adverse.get("bankruptcy", False))
    bankruptcy_years_discharged = int(adverse.get("bankruptcy_years_discharged", 0))

    has_dmp = bool(adverse.get("dmp", False))
    dmp_satisfied = bool(adverse.get("dmp_satisfied", False))
    dmp_months_since = int(adverse.get("dmp_months_since", 0))

    has_payday = bool(adverse.get("payday_loans", False))
    payday_months_clean = int(adverse.get("payday_months_clean", 0))

    has_repossession = bool(adverse.get("repossession", False))
    repossession_years_ago = int(adverse.get("repossession_years_ago", 0))

    missed_payments_12m = int(adverse.get("missed_payments_12m", 0))

    results: list[dict] = []

    for slug, lc in LENDER_CRITERIA.items():
        blockers: list[str] = []
        fit_reasons: list[str] = []
        score = 100  # start at 100, deduct for issues

        # ── BTL-only lenders ──────────────────────────────────────────────────
        if lc["tier"] == "btl_specialist" and purchase_type != "btl":
            blockers.append(f"{lc['display_name']} is a BTL-only lender — not available for residential")
        if purchase_type == "btl" and lc["max_ltv_btl"] == 0:
            blockers.append(f"{lc['display_name']} does not offer BTL mortgages")

        # ── LTV check ─────────────────────────────────────────────────────────
        if purchase_type == "btl":
            max_ltv = lc["max_ltv_btl"]
        else:
            max_ltv = lc["max_ltv_residential"]

        if max_ltv == 0:
            pass  # already handled above
        elif ltv > max_ltv:
            blockers.append(
                f"LTV {ltv:.1f}% exceeds {lc['display_name']} maximum of {max_ltv}%"
            )
        else:
            ltv_headroom = max_ltv - ltv
            if ltv_headroom >= 10:
                fit_reasons.append(f"Good LTV headroom — {ltv:.1f}% vs max {max_ltv}%")
                score += 5
            elif ltv_headroom >= 5:
                fit_reasons.append(f"Acceptable LTV — {ltv:.1f}% vs max {max_ltv}%")
            else:
                fit_reasons.append(f"Tight LTV — {ltv:.1f}% vs max {max_ltv}% (only {ltv_headroom:.1f}% headroom)")
                score -= 10

        # ── Loan amount ───────────────────────────────────────────────────────
        if loan_amount < lc["min_loan"]:
            blockers.append(
                f"Loan £{loan_amount:,} below {lc['display_name']} minimum of £{lc['min_loan']:,}"
            )
        elif loan_amount > lc["max_loan"]:
            blockers.append(
                f"Loan £{loan_amount:,} exceeds {lc['display_name']} maximum of £{lc['max_loan']:,}"
            )
        else:
            fit_reasons.append(f"Loan amount £{loan_amount:,} within range")

        # ── Income ────────────────────────────────────────────────────────────
        if lc["min_income"] > 0 and annual_income < lc["min_income"]:
            blockers.append(
                f"Annual income £{annual_income:,.0f} below {lc['display_name']} minimum of £{lc['min_income']:,}"
            )
        elif annual_income > 0:
            fit_reasons.append(f"Income £{annual_income:,.0f}/yr meets minimum requirement")

        # ── Employment type ───────────────────────────────────────────────────
        if employment_type not in lc["employment_types"]:
            blockers.append(
                f"{lc['display_name']} does not accept {employment_type} employment type"
            )
        else:
            if employment_type in ("self_employed", "contractor"):
                fit_reasons.append("Self-employed/contractor income accepted")

        # ── Bankruptcy ────────────────────────────────────────────────────────
        if has_bankruptcy:
            bk_policy = lc["bankruptcy_policy"]
            if not bk_policy["accepted"]:
                blockers.append(f"{lc['display_name']} does not accept any bankruptcy history")
            elif bankruptcy_years_discharged < bk_policy["min_years_discharged"]:
                blockers.append(
                    f"Bankruptcy only {bankruptcy_years_discharged} year(s) discharged — "
                    f"{lc['display_name']} requires {bk_policy['min_years_discharged']} year(s)"
                )
            else:
                fit_reasons.append(
                    f"Bankruptcy accepted — {bankruptcy_years_discharged}yr discharged meets "
                    f"{bk_policy['min_years_discharged']}yr minimum"
                )
                score += 10  # bonus for accepting bankruptcy

        # ── IVA ───────────────────────────────────────────────────────────────
        if has_iva:
            iva_policy = lc["iva_policy"]
            if not iva_policy["accepted"]:
                blockers.append(f"{lc['display_name']} does not accept IVA history")
            elif iva_months_discharged < iva_policy["min_months_discharged"]:
                blockers.append(
                    f"IVA only {iva_months_discharged} month(s) discharged — "
                    f"{lc['display_name']} requires {iva_policy['min_months_discharged']} month(s)"
                )
            else:
                fit_reasons.append(f"IVA accepted — discharge period met")

        # ── DMP ───────────────────────────────────────────────────────────────
        if has_dmp:
            dmp_policy = lc["dmp_policy"]
            if not dmp_policy["accepted"]:
                blockers.append(f"{lc['display_name']} does not accept DMP history")
            elif dmp_policy["must_be_satisfied"] and not dmp_satisfied:
                blockers.append(
                    f"{lc['display_name']} requires DMP to be satisfied/completed"
                )
            elif dmp_months_since < dmp_policy["min_months_since"]:
                blockers.append(
                    f"DMP only {dmp_months_since} month(s) ago — "
                    f"{lc['display_name']} requires {dmp_policy['min_months_since']} month(s)"
                )
            else:
                fit_reasons.append("DMP accepted — conduct requirements met")

        # ── Payday loans ──────────────────────────────────────────────────────
        if has_payday:
            pdl_policy = lc["payday_loan_policy"]
            if not pdl_policy["accepted"]:
                blockers.append(f"{lc['display_name']} does not accept payday loan history — hard decline")
            elif payday_months_clean < pdl_policy["min_months_clean"]:
                blockers.append(
                    f"Only {payday_months_clean} months clean from payday loans — "
                    f"{lc['display_name']} requires {pdl_policy['min_months_clean']} months"
                )
            else:
                fit_reasons.append(
                    f"Payday loans accepted — {payday_months_clean}m clean exceeds "
                    f"{pdl_policy['min_months_clean']}m requirement"
                )
                score -= 5  # small penalty — payday history always marginal

        # ── Repossession ──────────────────────────────────────────────────────
        if has_repossession:
            repo_policy = lc["repossession_policy"]
            if not repo_policy["accepted"]:
                blockers.append(f"{lc['display_name']} does not accept repossession history")
            elif repossession_years_ago < repo_policy["min_years_ago"]:
                blockers.append(
                    f"Repossession only {repossession_years_ago} year(s) ago — "
                    f"{lc['display_name']} requires {repo_policy['min_years_ago']} year(s)"
                )
            else:
                fit_reasons.append(f"Repossession accepted — {repossession_years_ago}yr ago meets minimum")

        # ── CCJs ──────────────────────────────────────────────────────────────
        if has_ccj:
            ccj_policy = lc["ccj_policy"]
            if ccj_policy["max_count"] > 0 and ccj_count > ccj_policy["max_count"]:
                blockers.append(
                    f"{ccj_count} CCJ(s) exceeds {lc['display_name']} maximum of {ccj_policy['max_count']}"
                )
            elif ccj_policy["max_single_amount"] > 0 and ccj_largest > ccj_policy["max_single_amount"]:
                blockers.append(
                    f"Largest CCJ £{ccj_largest:,} exceeds {lc['display_name']} cap of £{ccj_policy['max_single_amount']:,}"
                )
            elif ccj_policy["max_total"] > 0 and ccj_total > ccj_policy["max_total"]:
                blockers.append(
                    f"Total CCJ value £{ccj_total:,} exceeds {lc['display_name']} total cap of £{ccj_policy['max_total']:,}"
                )
            elif ccj_policy["satisfied_required"] and not ccj_satisfied:
                blockers.append(
                    f"{lc['display_name']} requires all CCJs to be satisfied — unsatisfied CCJ present"
                )
            else:
                if ccj_policy["min_months_old"] > 0:
                    months_since = adverse.get("months_since_most_recent", 0)
                    if months_since < ccj_policy["min_months_old"]:
                        blockers.append(
                            f"CCJ only {months_since} month(s) old — "
                            f"{lc['display_name']} requires {ccj_policy['min_months_old']} months"
                        )
                    else:
                        fit_reasons.append(
                            f"CCJ(s) accepted — {months_since}m old meets {ccj_policy['min_months_old']}m requirement"
                        )
                        score -= 5
                else:
                    fit_reasons.append("CCJ(s) accepted — no minimum age requirement")
                    score -= 5

        # ── Defaults ──────────────────────────────────────────────────────────
        if has_default:
            dflt_policy = lc["default_policy"]
            if dflt_policy["max_count"] > 0 and default_count > dflt_policy["max_count"]:
                blockers.append(
                    f"{default_count} default(s) exceeds {lc['display_name']} maximum of {dflt_policy['max_count']}"
                )
            elif dflt_policy["max_single_amount"] > 0 and default_largest > dflt_policy["max_single_amount"]:
                blockers.append(
                    f"Largest default £{default_largest:,} exceeds {lc['display_name']} cap of £{dflt_policy['max_single_amount']:,}"
                )
            else:
                if dflt_policy["min_months_old"] > 0:
                    months_since = adverse.get("months_since_most_recent", 0)
                    if months_since < dflt_policy["min_months_old"]:
                        blockers.append(
                            f"Default only {months_since} month(s) old — "
                            f"{lc['display_name']} requires {dflt_policy['min_months_old']} months"
                        )
                    else:
                        fit_reasons.append(
                            f"Default(s) accepted — {months_since}m old meets {dflt_policy['min_months_old']}m requirement"
                        )
                        score -= 5
                else:
                    fit_reasons.append("Default(s) accepted — no minimum age requirement")
                    score -= 5

        # ── Missed payments ───────────────────────────────────────────────────
        if missed_payments_12m > lc["missed_payments_12m"]:
            blockers.append(
                f"{missed_payments_12m} missed payment(s) in 12m exceeds "
                f"{lc['display_name']} maximum of {lc['missed_payments_12m']}"
            )
        elif missed_payments_12m > 0:
            fit_reasons.append(
                f"{missed_payments_12m} missed payment(s) within {lc['display_name']} tolerance"
            )
            score -= missed_payments_12m * 3

        # ── No adverse — bonus ────────────────────────────────────────────────
        no_adverse = not any([
            has_ccj, has_default, has_iva, has_bankruptcy,
            has_dmp, has_payday, has_repossession, missed_payments_12m > 0,
        ])
        if no_adverse and not blockers:
            fit_reasons.append("Clean credit profile — no adverse markers")
            score += 10

        # ── Tier alignment score adjustment ──────────────────────────────────
        tier_order = {
            "adverse_light": 1,
            "adverse": 2,
            "heavy_adverse": 3,
            "btl_specialist": 1,
        }
        client_tier = _infer_client_tier(
            has_bankruptcy, has_iva, has_dmp, has_repossession,
            ccj_count, default_count, missed_payments_12m,
        )
        lender_tier_val = tier_order.get(lc["tier"], 2)
        client_tier_val = tier_order.get(client_tier, 2)

        if lender_tier_val == client_tier_val:
            score += 8  # good tier match
        elif lender_tier_val > client_tier_val:
            # Lender more specialised than needed — client may pay higher rates unnecessarily
            score -= (lender_tier_val - client_tier_val) * 8
        # lender_tier_val < client_tier_val means already blocked by specific checks above

        score = max(0, min(100, score))

        # ── Proc fee ──────────────────────────────────────────────────────────
        if purchase_type == "btl":
            proc_fee = lc["proc_fee_remortgage_pct"]
        else:
            proc_fee = lc["proc_fee_purchase_pct"]

        results.append({
            "lender": slug,
            "display_name": lc["display_name"],
            "fit_score": score,
            "fit_reasons": fit_reasons,
            "blockers": blockers,
            "indicative_rate": lc["typical_initial_rate_adverse"],
            "proc_fee_pct": proc_fee,
        })

    # Sort: eligible lenders (no blockers) by score desc first, then blocked by score desc
    eligible = sorted(
        [r for r in results if not r["blockers"]],
        key=lambda x: -x["fit_score"],
    )
    blocked = sorted(
        [r for r in results if r["blockers"]],
        key=lambda x: -x["fit_score"],
    )

    return eligible + blocked


def _infer_client_tier(
    has_bankruptcy: bool,
    has_iva: bool,
    has_dmp: bool,
    has_repossession: bool,
    ccj_count: int,
    default_count: int,
    missed_payments_12m: int,
) -> str:
    """Infer the appropriate adverse tier for a client profile."""
    if has_bankruptcy or has_repossession:
        return "heavy_adverse"
    if has_iva or has_dmp or ccj_count >= 3 or default_count >= 3:
        return "adverse"
    if ccj_count >= 1 or default_count >= 1 or missed_payments_12m >= 1:
        return "adverse_light"
    return "adverse_light"
