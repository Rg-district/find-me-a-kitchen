"""
Live lender API integration layer.

Scaffolded for Twenty7Tec T360 (primary) and Mortgage Brain (secondary).
Neither adapter activates without valid API credentials — the system falls
back automatically to the indicative estimates in adverse_lender_matcher.py.

To enable:
  1. Obtain a vendor API agreement from your chosen sourcing platform.
     This requires FCA authorisation (or AR status) — see README for detail.
  2. Add your credentials to .env (or Render environment variables):
       For Twenty7Tec T360:
         TWENTY7TEC_API_KEY=your_key_here
         TWENTY7TEC_CLIENT_ID=your_client_id   (if using OAuth)
         TWENTY7TEC_BASE_URL=https://api.t360.twenty7tec.com/v1
       For Mortgage Brain:
         MORTGAGE_BRAIN_API_KEY=your_key_here
         MORTGAGE_BRAIN_BASE_URL=https://api.mortgagebrain.com/v2
  3. Restart the server — the Lenders tab will then show live figures
     from the sourcing platform with a "LIVE" badge.
"""
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

_TWENTY7TEC_API_KEY = os.getenv("TWENTY7TEC_API_KEY", "").strip()
_TWENTY7TEC_CLIENT_ID = os.getenv("TWENTY7TEC_CLIENT_ID", "").strip()
_TWENTY7TEC_BASE_URL = os.getenv("TWENTY7TEC_BASE_URL", "https://api.t360.twenty7tec.com/v1").rstrip("/")

_MORTGAGE_BRAIN_API_KEY = os.getenv("MORTGAGE_BRAIN_API_KEY", "").strip()
_MORTGAGE_BRAIN_BASE_URL = os.getenv("MORTGAGE_BRAIN_BASE_URL", "https://api.mortgagebrain.com/v2").rstrip("/")


def is_live_api_configured() -> bool:
    """True if at least one live sourcing-platform API key is present."""
    return bool(_TWENTY7TEC_API_KEY or _MORTGAGE_BRAIN_API_KEY)


def get_provider_name() -> Optional[str]:
    """Human-readable name of the active provider, or None if not configured."""
    if _TWENTY7TEC_API_KEY:
        return "Twenty7Tec T360"
    if _MORTGAGE_BRAIN_API_KEY:
        return "Mortgage Brain"
    return None


def get_live_affordability(
    lender_name: str,
    annual_income: float,
    partner_income: float,
    employment_type: str,
    monthly_debts: float,
    loan_amount: float,
    property_value: float,
    adverse_history: dict,
) -> Optional[dict]:
    """
    Request a live affordability/max-loan figure for a specific lender from
    the configured sourcing-platform API.

    Returns None when:
    - No live API is configured (caller should use indicative estimate)
    - The lender is not on the platform's panel
    - The request fails for any reason (network, auth, 4xx/5xx)

    Return shape (when successful):
    {
        "max_loan_estimate": float,
        "monthly_payment_estimate": float,
        "indicative_rate": float,
        "income_multiple_used": float | None,
        "capped_by": str,
        "source": "twenty7tec_live" | "mortgage_brain_live",
        "note": str,
    }
    """
    if _TWENTY7TEC_API_KEY:
        return _call_twenty7tec(
            lender_name, annual_income, partner_income, employment_type,
            monthly_debts, loan_amount, property_value, adverse_history,
        )
    if _MORTGAGE_BRAIN_API_KEY:
        return _call_mortgage_brain(
            lender_name, annual_income, partner_income, employment_type,
            monthly_debts, loan_amount, property_value, adverse_history,
        )
    return None


# ── Provider adapters ─────────────────────────────────────────────────────────

def _call_twenty7tec(
    lender_name, annual_income, partner_income, employment_type,
    monthly_debts, loan_amount, property_value, adverse_history,
) -> Optional[dict]:
    """
    Twenty7Tec T360 affordability API.
    Full spec available from Twenty7Tec after vendor onboarding.
    Auth: Bearer token (API key or short-lived OAuth token from client_id/secret).
    """
    try:
        import requests as req
    except ImportError:
        logger.error("requests library not available")
        return None

    ltv = round((loan_amount / property_value) * 100, 1) if property_value else 75.0

    headers = {
        "Authorization": f"Bearer {_TWENTY7TEC_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Client-Id": _TWENTY7TEC_CLIENT_ID,
    }

    applicants = [{
        "grossAnnualIncome": annual_income,
        "employmentStatus": _map_employment_t360(employment_type),
        "monthlyCommitments": monthly_debts,
    }]
    if partner_income > 0:
        applicants.append({
            "grossAnnualIncome": partner_income,
            "employmentStatus": "EMPLOYED",
            "monthlyCommitments": 0,
        })

    payload = {
        "lenderName": lender_name,
        "applicants": applicants,
        "loanAmount": loan_amount,
        "propertyValue": property_value,
        "ltv": ltv,
        "adverseProfile": {
            "hasCCJ": bool(adverse_history.get("ccj")),
            "hasDefault": bool(adverse_history.get("default")),
            "hasBankruptcy": bool(adverse_history.get("bankruptcy")),
            "monthsSinceMostRecent": int(adverse_history.get("months_since_most_recent") or 0),
        },
    }

    try:
        resp = req.post(
            f"{_TWENTY7TEC_BASE_URL}/affordability/calculate",
            json=payload,
            headers=headers,
            timeout=12,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        logger.warning("Twenty7Tec API error for %s: %s", lender_name, exc)
        return None

    max_loan = data.get("maxLoanAmount") or data.get("maxLoan")
    if max_loan is None:
        return None

    return {
        "max_loan_estimate": float(max_loan),
        "monthly_payment_estimate": float(data.get("monthlyPayment") or data.get("monthlyRepayment") or 0),
        "indicative_rate": float(data.get("initialRate") or data.get("rate") or 0),
        "income_multiple_used": data.get("incomeMultiple"),
        "capped_by": data.get("cappedBy") or data.get("limitingFactor") or "lender calculator",
        "source": "twenty7tec_live",
        "note": "Live figure from Twenty7Tec T360. Verify with lender DIP before presenting to client.",
    }


def _call_mortgage_brain(
    lender_name, annual_income, partner_income, employment_type,
    monthly_debts, loan_amount, property_value, adverse_history,
) -> Optional[dict]:
    """
    Mortgage Brain affordability API.
    Full spec available from Mortgage Brain after vendor onboarding.
    Auth: X-Api-Key header.
    """
    try:
        import requests as req
    except ImportError:
        logger.error("requests library not available")
        return None

    headers = {
        "X-Api-Key": _MORTGAGE_BRAIN_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    payload = {
        "lender": lender_name,
        "grossAnnualIncome": annual_income,
        "partnerAnnualIncome": partner_income,
        "employmentStatus": _map_employment_mb(employment_type),
        "loanAmount": loan_amount,
        "propertyValue": property_value,
        "monthlyDebts": monthly_debts,
        "adverseHistory": {
            "ccj": bool(adverse_history.get("ccj")),
            "default": bool(adverse_history.get("default")),
            "bankruptcy": bool(adverse_history.get("bankruptcy")),
        },
    }

    try:
        resp = req.post(
            f"{_MORTGAGE_BRAIN_BASE_URL}/affordability/calculate",
            json=payload,
            headers=headers,
            timeout=12,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        logger.warning("Mortgage Brain API error for %s: %s", lender_name, exc)
        return None

    max_loan = data.get("maxLoan") or data.get("maxLoanAmount")
    if max_loan is None:
        return None

    return {
        "max_loan_estimate": float(max_loan),
        "monthly_payment_estimate": float(data.get("monthlyRepayment") or data.get("monthlyPayment") or 0),
        "indicative_rate": float(data.get("rate") or data.get("initialRate") or 0),
        "income_multiple_used": data.get("multiple") or data.get("incomeMultiple"),
        "capped_by": data.get("limitingFactor") or data.get("cappedBy") or "lender calculator",
        "source": "mortgage_brain_live",
        "note": "Live figure from Mortgage Brain. Verify with lender DIP before presenting to client.",
    }


def _map_employment_t360(et: str) -> str:
    return {
        "employed": "EMPLOYED",
        "self_employed": "SELF_EMPLOYED",
        "contractor": "CONTRACTOR",
        "retired": "RETIRED",
        "benefits": "STATE_BENEFITS",
    }.get(et, "EMPLOYED")


def _map_employment_mb(et: str) -> str:
    return {
        "employed": "Employed",
        "self_employed": "SelfEmployed",
        "contractor": "Contractor",
        "retired": "Retired",
        "benefits": "Benefits",
    }.get(et, "Employed")
