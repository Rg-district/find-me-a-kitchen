"""
Decline Analyser — uses Claude to analyse a lender decline decision and
suggest actionable next steps for the broker and client.

Called synchronously inside the Apex Mortgage back-office tool chain.
"""
import json
import os
import re
from typing import Optional

import anthropic

_client: Optional[anthropic.Anthropic] = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    return _client


_SYSTEM_PROMPT = """You are a senior UK specialist mortgage broker with deep knowledge of the adverse-credit lending market. You have 20 years of experience placing difficult cases with UK specialist and adverse lenders.

Your task is to analyse a lender decline decision and provide a structured, actionable assessment.

UK SPECIALIST / ADVERSE LENDER KNOWLEDGE BASE:
- Precise Mortgages: accepts CCJs up to £2,500 (satisfied), defaults up to 3 years old (satisfied), max LTV 85%, no payday loans in last 24 months
- Kensington Mortgages: flexible on income types, accepts 1 satisfied CCJ, defaults registered 2+ years ago, max LTV 85%
- Aldermore Bank: up to 3 defaults (none in last 2 years), no CCJs in last 3 years, max LTV 75%, good for complex income
- Together Money: bridging and specialist, accepts heavier adverse, CCJs/defaults must be satisfied, max LTV 70%
- Pepper Money: tiered products (Pepper 6/12/24/48), accepts defaults and CCJs at different tiers, max LTV 75-85% depending on tier
- Norton Home Loans: heavy adverse, up to 4 defaults, unsatisfied CCJs considered, max LTV 65-70%
- MBS Lending: very heavy adverse, IVA/bankruptcy discharge from 1 year, max LTV 60-65%
- Bluestone Mortgages: adverse-friendly, tiered pricing, max LTV 80%, good for missed payments
- Vida Homeloans: accepts complex income, recent adverse considered, max LTV 80%, good for self-employed

DECLINE REASONS AND TYPICAL CAUSES:
- "Credit score" / "Credit profile": usually reflects recent adverse, too many hard searches, or undisclosed items
- "Affordability" / "Income": income too low, stress test failure, too many commitments
- "LTV": property value vs loan amount outside lender criteria
- "Property type" / "Valuation": unusual property, new build, ex-local authority, short lease
- "Employment type": self-employed without 2 years accounts, zero-hours, agency, probation
- "Payday loans": most lenders require 12-24 months clean; heavy adverse lenders may require 24-36 months
- "Recent CCJ/Default": unsatisfied or too recent for lender's criteria
- "IVA/Bankruptcy": discharge date not far enough back

RESPONSE FORMAT:
You must return ONLY a valid JSON object with this exact structure — no text outside the JSON:

{
  "likely_reason": "<concise 1-2 sentence explanation of the most probable actual reason for decline>",
  "technical_explanation": "<detailed technical explanation referencing specific lender criteria and how this case fell outside them>",
  "alternative_lenders": [
    {
      "lender": "<lender name>",
      "reason": "<why this lender may accept this case>",
      "confidence_pct": <integer 0-100>,
      "max_ltv": <integer representing max LTV percentage e.g. 75>
    }
  ],
  "remediation_steps": ["<actionable step 1>", "<actionable step 2>", ...],
  "estimated_wait_months": <integer — months before reapplication advised, 0 if can apply now>,
  "consultant_note": "<internal note for the broker: key considerations, gotchas, and strategy recommendation>",
  "can_reapply_immediately": <true|false>
}

Provide 3-5 alternative lenders ordered by confidence. Remediation steps should be specific and actionable (e.g. "Satisfy outstanding CCJ with [creditor] and obtain satisfaction letter" not just "improve credit")."""


def analyse_decline(client: dict, decline_reason: str, declined_lender: str) -> dict:
    """
    Analyse a lender decline and suggest next steps.

    Args:
        client: Client profile dict with keys: name, loan_amount, property_value,
                declared_income, employment_type, adverse_history, mortgage_purpose
        decline_reason: The reason given by the lender for declining the application
        declined_lender: Name of the lender that declined

    Returns:
        dict with keys: likely_reason, technical_explanation, alternative_lenders,
        remediation_steps, estimated_wait_months, consultant_note, can_reapply_immediately
    """
    ai_client = _get_client()

    user_content = f"""Analyse this mortgage application decline and provide structured next steps.

DECLINED LENDER: {declined_lender}
DECLINE REASON GIVEN: {decline_reason}

CLIENT PROFILE:
{json.dumps(client, indent=2)}

Analyse why this was likely declined (the stated reason may be vague — infer the real technical reason), identify the best alternative lenders, and provide specific remediation steps.

Return only the JSON object."""

    response = ai_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=[
            {
                "type": "text",
                "text": _SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": user_content,
            }
        ],
    )

    raw = response.content[0].text.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Attempt to extract JSON object if model added surrounding text
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

    # Fallback structure if parsing fails completely
    return {
        "likely_reason": f"Unable to parse analysis. Decline from {declined_lender}: {decline_reason}",
        "technical_explanation": raw[:500] if raw else "No response received.",
        "alternative_lenders": [],
        "remediation_steps": ["Review decline manually with senior adviser"],
        "estimated_wait_months": 0,
        "consultant_note": f"Automated analysis failed to parse. Raw output: {raw[:300]}",
        "can_reapply_immediately": False,
        "_parse_error": True,
    }
