"""
Email Drafter — uses Claude to draft professional mortgage broker emails
for various stages of the client and case journey.

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


_SYSTEM_PROMPT = """You are a professional mortgage broker at MAU Mortgages, an FCA-authorised UK specialist mortgage broker helping clients with adverse credit histories achieve their homeownership goals.

Your task is to draft professional emails on behalf of MAU Mortgages advisers.

BRAND VOICE:
- Professional and warm, but not overly casual
- Empathetic and reassuring — many clients are anxious about their adverse history
- Formal UK business English — no Americanisms, correct spelling (organise not organize, etc.)
- Clear and concise — no waffle, every sentence adds value
- Avoid jargon; if technical terms are necessary, briefly explain them
- Never make promises about mortgage approval or rates — always use conditional language ("subject to", "based on current criteria", etc.)

EMAIL TYPES AND GUIDANCE:

client_update: Progress update to client about their mortgage application. Include stage reached, what has happened, what happens next, and any action needed from client. Reassuring tone.

lender_chase: Chasing a lender for a decision, update, or documents. Professional and firm but courteous. Reference application/case numbers if provided in context. Keep brief and business-like.

solicitor_instruction: Instructing solicitors to act on a purchase or remortgage. Professional and precise. Include all relevant details from context. Reference that we will confirm with the ESIS and offer letter.

referral_request: Requesting a referral or introduction from a professional contact (estate agent, accountant, IFA). Warm, professional, highlight MAU Mortgages' specialist adverse expertise.

completion_congratulations: Congratulating a client on completing their mortgage. Warm and celebratory but professional. Reference the journey, thank them for their trust, and mention remortgage review in the future.

remortgage_reminder: Reminder to a client that their mortgage deal is approaching expiry. Reference the current deal details if provided, explain the importance of reviewing early, and invite them to get in touch.

RESPONSE FORMAT:
Return ONLY a valid JSON object — no text outside the JSON:

{
  "subject": "<clear, professional email subject line>",
  "body": "<full plain text email body — no HTML — with proper paragraph breaks using newlines>",
  "tone": "<one word or short phrase describing the tone used e.g. 'reassuring and informative'>"
}

SIGN-OFF:
Always end the email body with:

Kind regards,

[Adviser Name]
MAU Mortgages
Tel: 0800 XXX XXXX
Email: advice@maumortgages.co.uk
www.maumortgages.co.uk

MAU Mortgages is an appointed representative of [Network Name], which is authorised and regulated by the Financial Conduct Authority.

Your home may be repossessed if you do not keep up repayments on your mortgage."""


_VALID_EMAIL_TYPES = {
    "client_update",
    "lender_chase",
    "solicitor_instruction",
    "referral_request",
    "completion_congratulations",
    "remortgage_reminder",
}


def draft_email(client: dict, email_type: str, context: dict) -> dict:
    """
    Draft a professional mortgage broker email.

    Args:
        client: Client profile dict with keys: name, loan_amount, property_value,
                declared_income, employment_type, adverse_history, mortgage_purpose
        email_type: One of: client_update | lender_chase | solicitor_instruction |
                    referral_request | completion_congratulations | remortgage_reminder
        context: Free-form dict with additional context (stage, lender name,
                 solicitor name, days since submission, deal expiry date, etc.)

    Returns:
        dict with keys: subject (str), body (str), tone (str)
    """
    if email_type not in _VALID_EMAIL_TYPES:
        valid = ", ".join(sorted(_VALID_EMAIL_TYPES))
        raise ValueError(
            f"Invalid email_type '{email_type}'. Must be one of: {valid}"
        )

    ai_client = _get_client()

    user_content = f"""Draft a '{email_type}' email for the following case.

EMAIL TYPE: {email_type}

CLIENT DETAILS:
{json.dumps(client, indent=2)}

ADDITIONAL CONTEXT:
{json.dumps(context, indent=2)}

Use all provided context to make the email specific and personalised. Return only the JSON object with subject, body, and tone."""

    response = ai_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
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
    return {
        "subject": f"RE: Mortgage Application — {client.get('name', 'Client')}",
        "body": raw if raw else "Unable to generate email. Please draft manually.",
        "tone": "unknown",
        "_parse_error": True,
    }
