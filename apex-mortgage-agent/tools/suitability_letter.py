"""
Suitability Letter Generator — drafts FCA MCOB 4.8 compliant UK mortgage
suitability letters as HTML using Claude.

Called synchronously inside the Apex Mortgage back-office tool chain.
"""
import json
import os
from datetime import date
from typing import Optional

import anthropic

_client: Optional[anthropic.Anthropic] = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    return _client


_SYSTEM_PROMPT = """You are a specialist UK mortgage compliance officer and senior adviser at MAU Mortgages, an FCA-authorised mortgage broker specialising in adverse-credit cases.

Your task is to draft FCA MCOB 4.8 compliant mortgage suitability letters in clean, valid HTML.

LETTER REQUIREMENTS:
1. Full HTML document with <html>, <head>, <body> tags and inline CSS for professional presentation
2. Header: MAU Mortgages letterhead, today's date, client name and address placeholder
3. Reference line and subject line clearly identifying the mortgage application
4. Opening: confirm the advice given and the meeting/assessment basis
5. Client circumstances section: summarise the client's situation, employment, income, purpose of mortgage, adverse history (sensitively worded)
6. Product recommended section: include a styled HTML table showing all key product details (lender, product name, initial rate, revert rate, LTV, term, monthly payment estimate, total cost, ERC period, proc fee)
7. Why recommended: specific suitability reasoning linked to client's individual circumstances, grade, and adverse profile — why this lender/product fits their needs
8. Risks section: clearly explain rate change risk, ERC risk, impact of adverse history on future remortgage options, and any other relevant risks
9. Alternatives considered: note at least 2 alternative approaches considered and why they were not recommended
10. Regulatory disclosures: FSCS protection statement, complaints procedure reference, FCA authorisation statement, fee disclosure
11. Professional sign-off: adviser name, MAU Mortgages, FCA reference placeholder
12. Footer: registered address placeholder, regulatory footer

STYLE REQUIREMENTS:
- Professional, warm but formal UK broker letter tone
- Sensitive but honest about adverse credit history — use neutral language ("credit impairment", "adverse entries", "historical credit difficulties")
- Plain English throughout — avoid jargon without explanation
- All figures in GBP with £ symbol and thousands separators
- Dates in UK format (DD Month YYYY)
- Return ONLY the complete HTML string — no markdown, no preamble, no JSON wrapper

MCOB COMPLIANCE NOTES:
- Must state this is personalised advice
- Must explain why product is suitable for THIS client's specific needs and circumstances
- Must clearly state key risks including rate changes and negative equity risk if high LTV
- Must reference that client should read the ESIS (European Standardised Information Sheet)
- Must include statement about right to complain"""


def generate_suitability_letter(client: dict, analysis: dict, product_details: dict) -> str:
    """
    Generate an FCA MCOB 4.8 compliant mortgage suitability letter as HTML.

    Args:
        client: Client profile dict with keys: name, loan_amount, property_value,
                declared_income, employment_type, adverse_history, mortgage_purpose
        analysis: Grading engine output with keys: grade, score, summary
        product_details: Product info with keys: lender_name, product_name, initial_rate,
                         revert_rate, term_years, ltv, proc_fee (may be empty dict)

    Returns:
        Complete HTML string for the suitability letter.
    """
    ai_client = _get_client()

    today = date.today().strftime("%d %B %Y")

    # Build the user content describing what to generate
    client_section = json.dumps(client, indent=2)
    analysis_section = json.dumps(analysis, indent=2)
    product_section = json.dumps(product_details, indent=2)

    user_content = f"""Please draft a complete FCA MCOB 4.8 compliant mortgage suitability letter in HTML for the following case.

TODAY'S DATE: {today}

CLIENT DETAILS:
{client_section}

AFFORDABILITY / GRADING ANALYSIS:
{analysis_section}

RECOMMENDED PRODUCT DETAILS:
{product_section}

If product_details is empty or missing values, use clear placeholder text such as [PRODUCT NAME], [INITIAL RATE]%, etc. so the adviser can complete these.

Draft the full suitability letter now as a complete HTML document. Return only the HTML — no other text."""

    response = ai_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
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

    html = response.content[0].text.strip()

    # Strip markdown code fences if model accidentally wraps output
    if html.startswith("```"):
        lines = html.splitlines()
        # Remove opening fence
        lines = lines[1:] if lines[0].startswith("```") else lines
        # Remove closing fence
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        html = "\n".join(lines).strip()

    return html
