"""
Case Summary Generator — uses Claude to produce comprehensive case handover
summaries for mortgage broker case management.

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


_SYSTEM_PROMPT = """You are a senior mortgage case manager at MAU Mortgages, an FCA-authorised UK specialist mortgage broker specialising in adverse credit cases.

Your task is to produce concise, accurate, and actionable case handover summaries for mortgage applications. These summaries are used internally by advisers and case handlers.

SUMMARY REQUIREMENTS:
1. Executive summary: 2-4 sentences covering the key facts — who, what, why, and current status
2. Key risks: identify the main risks to case success, their severity, and how they can be mitigated
3. Action items: specific, actionable next steps for the case handler (not vague advice)
4. Lender recommendation: the most suitable lender category or specific lender(s) based on the credit profile
5. Next steps: ordered list of immediate next steps to progress the case
6. Case health: overall RAG (Red/Amber/Green) status and clear reason

CASE HEALTH CRITERIA:
- green: Strong case, minor issues only, clear lender route identified, documents in order
- amber: Some concerns requiring resolution, likely placeable but needs work, or information gaps
- red: Significant obstacles, no clear immediate lender route, client action required before progressing

UK ADVERSE MORTGAGE LENDER TIERS (for lender recommendations):
- Grade A (85-100): Mainstream — Halifax, NatWest, Nationwide, Barclays, HSBC
- Grade B (70-84): Near Prime — Yorkshire BS, Coventry BS, Platform, Accord
- Grade C (55-69): Specialist — Precise Mortgages, Kensington Mortgages
- Grade D (40-54): Adverse — Aldermore, Together Money, Pepper Money
- Grade E (25-39): Heavy Adverse — Norton, MBS Lending, Bluestone, Vida
- Grade F (0-24): Not currently viable — remediation required

RISK SEVERITY LEVELS:
- high: Could cause decline or significant delay if not addressed
- medium: Should be addressed but case can progress
- low: Worth noting but unlikely to affect outcome

RESPONSE FORMAT:
Return ONLY a valid JSON object — no text outside the JSON:

{
  "executive_summary": "<2-4 sentences covering client, loan purpose, key financials, adverse profile, and current position>",
  "key_risks": [
    {
      "risk": "<clear description of the risk>",
      "severity": "high | medium | low",
      "mitigation": "<specific action to mitigate this risk>"
    }
  ],
  "action_items": ["<specific action 1>", "<specific action 2>", ...],
  "lender_recommendation": "<specific lender(s) or tier recommendation with brief rationale>",
  "next_steps": ["<immediate next step 1>", "<next step 2>", ...],
  "case_health": "green | amber | red",
  "case_health_reason": "<1-2 sentences explaining the RAG status>"
}

IMPORTANT:
- If analysis or credit_data is null/missing, work with what is available and note the gaps
- Be specific — use names, figures, and dates from the data provided
- Action items and next steps should be different: action_items are for the broker, next_steps are the ordered case progression steps
- Do not include placeholder text — if data is missing, note it as an information gap"""


def summarise_case(
    client: dict,
    analysis: Optional[dict],
    credit_data: Optional[dict],
) -> dict:
    """
    Create a comprehensive case handover summary.

    Args:
        client: Client profile dict with keys: name, loan_amount, property_value,
                declared_income, employment_type, adverse_history, mortgage_purpose
        analysis: Grading engine output with keys: grade, score, summary
                  (may be None if grading not yet run)
        credit_data: Structured credit report data from credit_report_analyser
                     (may be None if not yet received)

    Returns:
        dict with keys: executive_summary, key_risks, action_items,
        lender_recommendation, next_steps, case_health, case_health_reason
    """
    ai_client = _get_client()

    # Build the data payload, clearly flagging what is missing
    analysis_block = json.dumps(analysis, indent=2) if analysis is not None else "NOT YET AVAILABLE"
    credit_block = json.dumps(credit_data, indent=2) if credit_data is not None else "NOT YET AVAILABLE"

    user_content = f"""Please produce a case handover summary for the following mortgage application.

CLIENT PROFILE:
{json.dumps(client, indent=2)}

GRADING / AFFORDABILITY ANALYSIS:
{analysis_block}

CREDIT REPORT DATA:
{credit_block}

Base your summary on all available data. Where data is marked NOT YET AVAILABLE, note the information gap as a risk or action item as appropriate.

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

    # Fallback if parsing fails
    client_name = client.get("name", "Unknown Client")
    return {
        "executive_summary": f"Case summary for {client_name} could not be automatically generated. Please review manually.",
        "key_risks": [
            {
                "risk": "Automated summary generation failed",
                "severity": "medium",
                "mitigation": "Review case data manually and produce summary",
            }
        ],
        "action_items": ["Review raw data and produce manual case summary"],
        "lender_recommendation": "Unable to determine — manual review required",
        "next_steps": ["Complete manual case review", "Identify lender route", "Prepare case submission"],
        "case_health": "amber",
        "case_health_reason": "Automated summary failed to parse. Manual review required before assigning case health.",
        "_parse_error": True,
        "_raw_text": raw[:500] if raw else "",
    }
