"""
Bank Statement Analyser — uses Claude's multimodal API to extract structured
financial intelligence from uploaded PDF/image bank statements.

This is the core analytical engine of the Apex Mortgage back-office dashboard.
Called synchronously since it runs inside a tool execution context.
"""
import base64
import json
import os
import re
from datetime import datetime

import anthropic

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    return _client


ANALYSIS_PROMPT = """You are a senior mortgage underwriter at a UK specialist lender reviewing a bank statement for a mortgage application. Your job is to extract every piece of financially relevant information that a lender or broker would need.

The client has declared a monthly income of £{declared_monthly_income:.2f}.

Analyse this bank statement thoroughly and return a JSON object with EXACTLY the following structure. Do not include any text outside the JSON object.

{{
  "statement_period": {{
    "from_date": "YYYY-MM-DD or null",
    "to_date": "YYYY-MM-DD or null",
    "months_covered": <number>
  }},
  "account_details": {{
    "account_type": "current | savings | other",
    "bank_name": "<bank name or Unknown>",
    "currency": "GBP"
  }},
  "income_analysis": {{
    "credits_identified": [
      {{
        "description": "<transaction description>",
        "category": "salary | benefits | pension | rental | freelance | transfer | other",
        "amounts": [<list of amounts seen across statement period>],
        "average_monthly": <number>,
        "frequency": "monthly | weekly | fortnightly | irregular | one_off",
        "consistency_score": <0-100, 100 = perfectly consistent>
      }}
    ],
    "total_average_monthly_income": <number>,
    "income_coefficient_of_variation": <percentage 0-100, lower = more consistent>,
    "declared_income_discrepancy_pct": <percentage difference vs declared, positive = understated by client, negative = overstated>,
    "income_notes": "<any observations about income patterns>"
  }},
  "expenditure_analysis": {{
    "fixed_commitments": [
      {{
        "description": "<e.g. mortgage/rent, car finance, loan repayment>",
        "monthly_amount": <number>,
        "category": "mortgage_rent | car_finance | personal_loan | credit_card | insurance | subscription | other"
      }}
    ],
    "variable_spending": {{
      "groceries_monthly_avg": <number>,
      "utilities_monthly_avg": <number>,
      "transport_monthly_avg": <number>,
      "dining_entertainment_monthly_avg": <number>,
      "online_shopping_monthly_avg": <number>,
      "other_monthly_avg": <number>
    }},
    "total_fixed_monthly": <number>,
    "total_variable_monthly_avg": <number>,
    "total_monthly_outgoings_avg": <number>
  }},
  "red_flags": {{
    "gambling": {{
      "detected": <true|false>,
      "merchants": ["<list of gambling merchant names seen>"],
      "total_amount_per_month_avg": <number>,
      "percentage_of_income": <number>,
      "severity": "none | low | medium | high | critical"
    }},
    "payday_loans": {{
      "detected": <true|false>,
      "lenders_identified": ["<list of payday lender names>"],
      "most_recent_date": "YYYY-MM-DD or null",
      "months_ago": <number or null>,
      "severity": "none | historical | recent | current"
    }},
    "returned_direct_debits": {{
      "count": <number>,
      "dates": ["<list of dates>"],
      "descriptions": ["<list of DD descriptions that bounced>"],
      "severity": "none | low | medium | high"
    }},
    "overdraft_usage": {{
      "has_overdraft_facility": <true|false>,
      "times_in_overdraft": <number>,
      "maximum_overdraft_depth": <number>,
      "average_days_in_overdraft_per_month": <number>,
      "severity": "none | occasional | frequent | always_overdrawn"
    }},
    "large_unexplained_cash_withdrawals": {{
      "detected": <true|false>,
      "instances": [
        {{
          "date": "YYYY-MM-DD",
          "amount": <number>,
          "description": "<transaction description>"
        }}
      ],
      "total_amount": <number>
    }},
    "irregular_large_credits": {{
      "detected": <true|false>,
      "instances": [
        {{
          "date": "YYYY-MM-DD",
          "amount": <number>,
          "description": "<transaction description>",
          "likely_explanation": "<salary advance | gift | loan | sale of asset | unknown>"
        }}
      ]
    }},
    "missed_payments": {{
      "detected": <true|false>,
      "descriptions": ["<descriptions of missed/failed payments>"]
    }}
  }},
  "balance_trend": {{
    "opening_balance": <number or null>,
    "closing_balance": <number or null>,
    "trend": "improving | stable | declining | volatile",
    "average_balance": <number or null>,
    "minimum_balance": <number or null>,
    "maximum_balance": <number or null>,
    "trend_notes": "<brief narrative>"
  }},
  "affordability_indicators": {{
    "net_disposable_income_monthly": <total income minus total outgoings>,
    "debt_to_income_ratio": <fixed commitments as % of income>,
    "savings_behaviour": "regular_saver | occasional_saver | no_savings | drawing_down",
    "financial_stability_assessment": "strong | adequate | marginal | poor | very_poor"
  }},
  "underwriter_notes": "<concise professional summary of 3-5 sentences covering the key points a mortgage underwriter needs to know, including overall impression and any concerns>"
}}

Be precise with amounts — extract actual figures from the statement. If you cannot determine a value, use null. Flag every gambling transaction you can identify, including betting shops, online casinos, poker, spread betting, and exchange platforms (Betfair, etc). Flag all payday lenders (Wonga, QuickQuid, Sunny, SafetyNet Credit, Drafty, Peachy, Ferratum, Cashfloat, etc). A returned DD is when a direct debit is shown as returned/unpaid/failed."""


def analyse_statement(
    file_bytes: bytes,
    file_type: str,
    declared_monthly_income: float,
    client_id: str,
) -> dict:
    """
    Analyse a bank statement PDF or image using Claude's multimodal API.

    Args:
        file_bytes: Raw bytes of the uploaded file.
        file_type: MIME type, e.g. 'application/pdf', 'image/jpeg', 'image/png'.
        declared_monthly_income: Client's self-declared monthly income in £.
        client_id: Client identifier for logging purposes.

    Returns:
        Structured analysis dict with income, expenditure, red flags, and grade inputs.
    """
    client = _get_client()

    # Encode file as base64
    encoded = base64.standard_b64encode(file_bytes).decode("utf-8")

    # Map common MIME types to Claude's accepted media types
    media_type_map = {
        "application/pdf": "application/pdf",
        "image/jpeg": "image/jpeg",
        "image/jpg": "image/jpeg",
        "image/png": "image/png",
        "image/gif": "image/gif",
        "image/webp": "image/webp",
    }

    media_type = media_type_map.get(file_type.lower(), "application/pdf")
    prompt = ANALYSIS_PROMPT.format(declared_monthly_income=declared_monthly_income)

    # Determine document type for content block
    if media_type == "application/pdf":
        document_block = {
            "type": "document",
            "source": {
                "type": "base64",
                "media_type": "application/pdf",
                "data": encoded,
            },
        }
    else:
        document_block = {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": media_type,
                "data": encoded,
            },
        }

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": [
                    # Static analysis instructions first — cached across calls.
                    # The document block follows and varies per call (not cached).
                    {
                        "type": "text",
                        "text": prompt,
                        "cache_control": {"type": "ephemeral"},
                    },
                    document_block,
                ],
            }
        ],
    )

    raw_text = response.content[0].text if response.content else ""

    # Extract JSON from response
    try:
        # Try direct parse first
        analysis = json.loads(raw_text)
    except json.JSONDecodeError:
        # Try to extract JSON block from markdown code fences
        json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_text, re.DOTALL)
        if json_match:
            try:
                analysis = json.loads(json_match.group(1))
            except json.JSONDecodeError:
                analysis = _build_fallback_analysis(declared_monthly_income, raw_text)
        else:
            # Try to find any JSON object in the response
            json_match2 = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if json_match2:
                try:
                    analysis = json.loads(json_match2.group(0))
                except json.JSONDecodeError:
                    analysis = _build_fallback_analysis(declared_monthly_income, raw_text)
            else:
                analysis = _build_fallback_analysis(declared_monthly_income, raw_text)

    # Attach metadata
    analysis["_meta"] = {
        "client_id": client_id,
        "analysed_at": datetime.utcnow().isoformat(),
        "declared_monthly_income": declared_monthly_income,
        "file_type": file_type,
        "model": "claude-sonnet-4-6",
        "raw_response_length": len(raw_text),
    }

    return analysis


def _build_fallback_analysis(declared_monthly_income: float, raw_text: str) -> dict:
    """Return a safe fallback structure when JSON parsing fails."""
    return {
        "statement_period": {"from_date": None, "to_date": None, "months_covered": 1},
        "account_details": {"account_type": "current", "bank_name": "Unknown", "currency": "GBP"},
        "income_analysis": {
            "credits_identified": [],
            "total_average_monthly_income": 0,
            "income_coefficient_of_variation": 0,
            "declared_income_discrepancy_pct": 0,
            "income_notes": "Analysis could not be fully parsed. Please review raw output.",
        },
        "expenditure_analysis": {
            "fixed_commitments": [],
            "variable_spending": {
                "groceries_monthly_avg": 0,
                "utilities_monthly_avg": 0,
                "transport_monthly_avg": 0,
                "dining_entertainment_monthly_avg": 0,
                "online_shopping_monthly_avg": 0,
                "other_monthly_avg": 0,
            },
            "total_fixed_monthly": 0,
            "total_variable_monthly_avg": 0,
            "total_monthly_outgoings_avg": 0,
        },
        "red_flags": {
            "gambling": {"detected": False, "merchants": [], "total_amount_per_month_avg": 0, "percentage_of_income": 0, "severity": "none"},
            "payday_loans": {"detected": False, "lenders_identified": [], "most_recent_date": None, "months_ago": None, "severity": "none"},
            "returned_direct_debits": {"count": 0, "dates": [], "descriptions": [], "severity": "none"},
            "overdraft_usage": {"has_overdraft_facility": False, "times_in_overdraft": 0, "maximum_overdraft_depth": 0, "average_days_in_overdraft_per_month": 0, "severity": "none"},
            "large_unexplained_cash_withdrawals": {"detected": False, "instances": [], "total_amount": 0},
            "irregular_large_credits": {"detected": False, "instances": []},
            "missed_payments": {"detected": False, "descriptions": []},
        },
        "balance_trend": {"opening_balance": None, "closing_balance": None, "trend": "stable", "average_balance": None, "minimum_balance": None, "maximum_balance": None, "trend_notes": "Unable to determine trend."},
        "affordability_indicators": {
            "net_disposable_income_monthly": declared_monthly_income,
            "debt_to_income_ratio": 0,
            "savings_behaviour": "no_savings",
            "financial_stability_assessment": "poor",
        },
        "underwriter_notes": f"Automated analysis could not be fully parsed. Raw output available for manual review. Length: {len(raw_text)} chars.",
        "_parse_error": True,
        "_raw_text": raw_text[:2000],
    }
