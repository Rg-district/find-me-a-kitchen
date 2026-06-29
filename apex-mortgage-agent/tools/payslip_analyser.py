"""
Payslip Analyser — uses Claude's multimodal API to extract gross/net salary
and itemised deductions (tax, National Insurance, pension, etc.) from an
uploaded payslip.
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


ANALYSIS_PROMPT = """You are a senior mortgage underwriter at a UK specialist lender reviewing a payslip for a mortgage application. Your job is to extract the client's gross salary, net salary, and every itemised deduction.

The client has declared a monthly income of £{declared_monthly_income:.2f}.

Analyse this payslip thoroughly and return a JSON object with EXACTLY the following structure. Do not include any text outside the JSON object.

{{
  "payslip_period": {{
    "pay_date": "YYYY-MM-DD or null",
    "period_start": "YYYY-MM-DD or null",
    "period_end": "YYYY-MM-DD or null",
    "frequency": "monthly | weekly | fortnightly | four_weekly | unknown"
  }},
  "employer": {{
    "name": "<employer name or Unknown>",
    "employee_name": "<employee name or Unknown>",
    "employee_number": "<employee/payroll number or null>",
    "tax_code": "<tax code or null>"
  }},
  "earnings": {{
    "gross_pay_this_period": <number>,
    "gross_pay_ytd": <number or null>,
    "basic_salary": <number or null>,
    "overtime": <number or null>,
    "bonus": <number or null>,
    "commission": <number or null>,
    "other_earnings": [
      {{"description": "<e.g. car allowance, shift premium>", "amount": <number>}}
    ],
    "annualised_gross_salary": <gross_pay_this_period converted to an annual figure based on frequency>
  }},
  "deductions": {{
    "income_tax": <number, PAYE tax deducted this period>,
    "national_insurance": <number>,
    "pension_employee": <number, employee pension contribution this period>,
    "pension_employer": <number or null, employer pension contribution if shown>,
    "student_loan": <number or null>,
    "other_deductions": [
      {{"description": "<e.g. salary sacrifice, union fees, court order>", "amount": <number>}}
    ],
    "total_deductions": <number, sum of all deductions this period>
  }},
  "net_pay": {{
    "net_pay_this_period": <number>,
    "net_pay_ytd": <number or null>,
    "annualised_net_salary": <net_pay_this_period converted to an annual figure based on frequency>,
    "monthly_net_equivalent": <net pay normalised to a monthly figure regardless of pay frequency>
  }},
  "declared_income_comparison": {{
    "declared_monthly_income": {declared_monthly_income:.2f},
    "payslip_monthly_net_equivalent": <same as monthly_net_equivalent above>,
    "discrepancy_pct": <percentage difference vs declared, positive = understated by client, negative = overstated>,
    "notes": "<brief observation on the comparison>"
  }},
  "red_flags": {{
    "irregular_or_inconsistent_pay": <true|false>,
    "recent_salary_change": <true|false, e.g. YTD figures imply a mid-year change>,
    "notes": "<observations: unusually high/low deductions, missing pension contributions, salary sacrifice schemes, zero-hours/variable-hours indicators, or null if nothing notable>"
  }},
  "underwriter_notes": "<concise professional summary of 2-4 sentences covering gross vs net, deduction makeup, and any concerns relevant to mortgage affordability>"
}}

Be precise with amounts — extract actual figures shown on the payslip. If a value is not present, use null. When converting between pay frequencies, use weekly x 52 / 12, fortnightly x 26 / 12, four-weekly x 13 / 12, and monthly as-is for monthly-equivalent figures."""


def analyse_payslip(
    file_bytes: bytes,
    file_type: str,
    declared_monthly_income: float,
    client_id: str,
) -> dict:
    """
    Analyse a payslip PDF or image using Claude's multimodal API.

    Args:
        file_bytes: Raw bytes of the uploaded file.
        file_type: MIME type, e.g. 'application/pdf', 'image/jpeg', 'image/png'.
        declared_monthly_income: Client's self-declared monthly income in £.
        client_id: Client identifier for logging purposes.

    Returns:
        Structured analysis dict with gross/net pay and itemised deductions.
    """
    client = _get_client()

    encoded = base64.standard_b64encode(file_bytes).decode("utf-8")

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
        max_tokens=8192,
        messages=[
            {
                "role": "user",
                "content": [
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

    try:
        analysis = json.loads(raw_text)
    except json.JSONDecodeError:
        json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_text, re.DOTALL)
        if json_match:
            try:
                analysis = json.loads(json_match.group(1))
            except json.JSONDecodeError:
                analysis = _build_fallback_analysis(declared_monthly_income, raw_text)
        else:
            json_match2 = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if json_match2:
                try:
                    analysis = json.loads(json_match2.group(0))
                except json.JSONDecodeError:
                    analysis = _build_fallback_analysis(declared_monthly_income, raw_text)
            else:
                analysis = _build_fallback_analysis(declared_monthly_income, raw_text)

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
        "payslip_period": {"pay_date": None, "period_start": None, "period_end": None, "frequency": "unknown"},
        "employer": {"name": "Unknown", "employee_name": "Unknown", "employee_number": None, "tax_code": None},
        "earnings": {
            "gross_pay_this_period": 0,
            "gross_pay_ytd": None,
            "basic_salary": None,
            "overtime": None,
            "bonus": None,
            "commission": None,
            "other_earnings": [],
            "annualised_gross_salary": 0,
        },
        "deductions": {
            "income_tax": 0,
            "national_insurance": 0,
            "pension_employee": 0,
            "pension_employer": None,
            "student_loan": None,
            "other_deductions": [],
            "total_deductions": 0,
        },
        "net_pay": {
            "net_pay_this_period": 0,
            "net_pay_ytd": None,
            "annualised_net_salary": 0,
            "monthly_net_equivalent": 0,
        },
        "declared_income_comparison": {
            "declared_monthly_income": declared_monthly_income,
            "payslip_monthly_net_equivalent": 0,
            "discrepancy_pct": 0,
            "notes": "Analysis could not be fully parsed. Please review raw output.",
        },
        "red_flags": {
            "irregular_or_inconsistent_pay": False,
            "recent_salary_change": False,
            "notes": None,
        },
        "underwriter_notes": f"Automated analysis could not be fully parsed. Raw output available for manual review. Length: {len(raw_text)} chars.",
        "_parse_error": True,
        "_raw_text": raw_text[:2000],
    }
