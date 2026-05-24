"""UK mortgage document generator — produces FCA-compliant HTML documents via Claude."""
import base64
import os
from datetime import date
from typing import Optional

import anthropic

_ai_client: Optional[anthropic.Anthropic] = None


def _ai() -> anthropic.Anthropic:
    global _ai_client
    if _ai_client is None:
        _ai_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    return _ai_client


DOC_TYPES: dict[str, str] = {
    "idd": "Initial Disclosure Document (IDD)",
    "privacy_notice": "Privacy Notice / Terms of Business",
    "esis": "ESIS / Key Facts Illustration (KFI)",
    "aip": "Agreement in Principle (AIP)",
}


def generate_document(
    doc_type: str,
    client: dict,
    analysis: Optional[dict] = None,
    reference_text: Optional[str] = None,
) -> str:
    """Generate a UK mortgage document as a complete HTML string."""
    if doc_type not in DOC_TYPES:
        raise ValueError(f"Unknown doc_type '{doc_type}'. Must be one of: {', '.join(DOC_TYPES)}")

    today = date.today().strftime("%d %B %Y")
    doc_name = DOC_TYPES[doc_type]

    client_block = _format_client(client)
    analysis_block = _format_analysis(client, analysis) if analysis and doc_type in ("esis", "aip") else ""
    reference_block = (
        f"\n\nREFERENCE TEMPLATE PROVIDED BY CONSULTANT:\n"
        f"Please follow the structure, formatting, and tone of the reference document below as closely as possible, "
        f"but replace all content with the correct details for this client and firm.\n\n"
        f"{reference_text[:4000]}"
    ) if reference_text else ""

    prompt = f"""You are an expert UK mortgage broker document specialist.

Generate a professional, FCA-compliant {doc_name} as a complete, self-contained HTML document.

TODAY'S DATE: {today}
FIRM NAME: Apex Mortgage Solutions
FCA REFERENCE NUMBER: [FCA NUMBER — consultant to insert]
FIRM ADDRESS: [FIRM ADDRESS — consultant to insert]
FIRM TELEPHONE: [FIRM TELEPHONE — consultant to insert]
FIRM EMAIL: [FIRM EMAIL — consultant to insert]

CLIENT DETAILS:
{client_block}
{analysis_block}
{reference_block}

DOCUMENT REQUIREMENTS:
- Return ONLY the complete HTML document (starting with <!DOCTYPE html>)
- Professional, clean, print-ready CSS (white background, clear headings, section dividers)
- Pre-filled with all available client data from above
- Fields the consultant must complete manually go in [SQUARE BRACKETS]
- UK English spelling throughout
- All currency in GBP (£)
- Signature blocks and date lines at the bottom
- FCA-compliant content appropriate for a regulated UK mortgage intermediary
{_specific_requirements(doc_type)}"""

    message = _ai().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def extract_reference_text(file_bytes: bytes, content_type: str) -> str:
    """Extract text from a reference document (PDF, image, or plain text) using Claude."""
    if content_type in ("text/plain", "text/html"):
        return file_bytes.decode("utf-8", errors="replace")[:6000]

    b64 = base64.standard_b64encode(file_bytes).decode()

    if content_type == "application/pdf":
        content = [
            {"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": b64}},
            {"type": "text", "text": "Extract and transcribe all the text from this document, preserving its structure, headings, and sections as faithfully as possible."},
        ]
    else:
        content = [
            {"type": "image", "source": {"type": "base64", "media_type": content_type, "data": b64}},
            {"type": "text", "text": "Extract and transcribe all the text from this document image, preserving its structure, headings, and sections."},
        ]

    message = _ai().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": content}],
    )
    return message.content[0].text


# ── Private helpers ────────────────────────────────────────────────────────────

def _format_client(client: dict) -> str:
    adverse = client.get("adverse_history", {})
    adverse_items = []
    for k, label in {"ccj": "CCJ", "default": "Default", "iva": "IVA",
                     "bankruptcy": "Bankruptcy", "dmp": "DMP", "payday_loans": "Payday Loans"}.items():
        if adverse.get(k):
            adverse_items.append(label)
    adverse_str = ", ".join(adverse_items) if adverse_items else "None declared"
    if adverse.get("months_since_most_recent") is not None:
        adverse_str += f" (most recent: {adverse['months_since_most_recent']} months ago)"

    addr_parts = [client.get(f) for f in ("address_line1", "address_line2", "city", "postcode") if client.get(f)]

    loan = client.get("loan_amount")
    prop = client.get("property_value")
    ltv = f"{(float(loan) / float(prop) * 100):.1f}%" if loan and prop else "N/A"

    return (
        f"Name: {client.get('name', 'N/A')}\n"
        f"Date of Birth: {client.get('date_of_birth', '[DATE OF BIRTH]')}\n"
        f"Address: {', '.join(addr_parts) if addr_parts else '[CLIENT ADDRESS]'}\n"
        f"Phone: {client.get('phone', '[PHONE]')}\n"
        f"Email: {client.get('email', '[EMAIL]')}\n"
        f"Mortgage Purpose: {(client.get('mortgage_purpose') or 'N/A').replace('_', ' ').title()}\n"
        f"Employment Type: {(client.get('employment_type') or 'N/A').replace('_', ' ').title()}\n"
        f"Declared Monthly Income: £{float(client.get('declared_income') or 0):,.0f}\n"
        f"Loan Amount Requested: £{float(loan or 0):,.0f}\n"
        f"Property Value: £{float(prop or 0):,.0f}\n"
        f"LTV: {ltv}\n"
        f"Adverse Credit History: {adverse_str}"
    )


def _format_analysis(client: dict, analysis: dict) -> str:
    if not analysis:
        return ""
    grade = client.get("grade", "N/A")
    score = client.get("score", "N/A")
    label = client.get("grade_label", "")
    avg_income = (analysis.get("income_analysis") or {}).get("total_average_monthly_income", 0)
    return (
        f"\nASSESSMENT RESULTS:\n"
        f"Grade: {grade} — {label} (Score: {score}/100)\n"
        f"Verified Average Monthly Income: £{float(avg_income):,.0f}"
    )


def _specific_requirements(doc_type: str) -> str:
    reqs = {
        "idd": """
IDD-SPECIFIC CONTENT (FCA MCOB/COBS):
- Section 1: About our firm — firm name, FCA registration number, address, website
- Section 2: Scope of service — clearly state whole of market or restricted panel (use [WHOLE OF MARKET / RESTRICTED PANEL])
- Section 3: Fees and charges — broker fee amount (use [BROKER FEE AMOUNT] or state fee-free), when it is payable, and what it covers
- Section 4: Commission disclosure (Consumer Duty) — explain that commission is received from lenders and how the firm handles conflicts of interest
- Section 5: Your rights — right to receive advice, what regulated advice means, cancellation rights
- Section 6: How to complain — internal complaints contact + Financial Ombudsman Service (FOS): 0800 023 4567, www.financial-ombudsman.org.uk
- Section 7: Financial Services Compensation Scheme (FSCS) — coverage up to £85,000
- Section 8: Data protection summary — UK GDPR, ICO registration [ICO NUMBER]
- Client acknowledgement section — printed name, signature, and date lines
""",
        "privacy_notice": """
PRIVACY NOTICE / TERMS OF BUSINESS CONTENT:
- Section 1: Who we are — Data Controller identity, FCA number, ICO registration [ICO NUMBER]
- Section 2: What personal data we collect — name, DOB, address, financial history (inc. adverse credit), employment, property details, special category financial vulnerability data
- Section 3: Legal basis for processing — UK GDPR Art 6(1)(b) contract performance, Art 6(1)(c) legal obligation (FCA/AML), Art 6(1)(a) consent for special category data
- Section 4: Who we share data with — mortgage lenders, credit reference agencies (Experian, Equifax, TransUnion), solicitors, insurers, HMRC, fraud prevention databases (CIFAS)
- Section 5: How long we keep your data — FCA minimum 5 years from end of relationship; state actual retention period [RETENTION PERIOD]
- Section 6: Your rights under UK GDPR — right of access, rectification, erasure, restriction, portability, objection, rights regarding automated decisions
- Section 7: Complaints to the ICO — ico.org.uk, 0303 123 1113
- Section 8: Terms of business — scope of advice, adviser responsibilities, client responsibilities (full disclosure), fees, cancellation rights (14-day cooling-off period for distance contracts)
- Section 9: Conflicts of interest — brief policy summary
- Client signature block — confirm receipt, understanding, and consent
""",
        "esis": """
ESIS / KFI-SPECIFIC CONTENT (UK MCOB / EU Mortgage Credit Directive):
- Section 1: Lender and intermediary details — [LENDER NAME to be confirmed], Apex Mortgage Solutions as intermediary, FCA numbers
- Section 2: Main loan features — loan amount, loan term (use 25 years unless otherwise specified), repayment type (Capital Repayment), purpose, property address [if known]
- Section 3: Interest rate — [INDICATIVE RATE]% fixed for [TERM] years, then reverts to lender SVR of [SVR]%; note this is indicative based on the client's grade
- Section 4: APRC — [INDICATIVE APRC]% (note: actual APRC confirmed by lender on full offer)
- Section 5: Frequency and number of payments — 300 monthly payments (25-year term)
- Section 6: Monthly instalment — calculate using the loan amount and an indicative rate appropriate for the client's adverse grade (e.g., 5.5%–7.0% range); show the formula used; clearly label as indicative
- Section 7: Illustrative repayment table — show years 1, 5, 10, 15, 20, 25 with approximate outstanding balance at each point
- Section 8: Additional obligations — buildings insurance is mandatory; life assurance recommended; note any lender conditions
- Section 9: Early repayment — typical ERC: [X]% for [N] years, then no charge; 10% annual overpayment allowed ERC-free
- Section 10: Flexible features — overpayment, underpayment, payment holidays [subject to lender criteria]
- Section 11: Portability — [confirm with lender]
- Section 12: Complaints — firm procedure + FOS details
- Important disclaimer at bottom: "This illustration is indicative only. Final figures will be confirmed in the binding ESIS/mortgage offer issued by [LENDER NAME] upon full application and approval."
""",
        "aip": """
AIP-SPECIFIC CONTENT:
- Document header: "AGREEMENT IN PRINCIPLE — CONDITIONAL MORTGAGE DECISION" with a clear visual decision box
- Issued by: Apex Mortgage Solutions (on behalf of [LENDER — to be confirmed after product selection])
- Section 1: Applicant details — full name, date of birth, address (all from client data)
- Section 2: Property details — property type [to be confirmed], estimated value (from client data), postcode [if known]
- Section 3: Mortgage details:
  * Loan amount: £[AMOUNT from client data]
  * LTV: [calculated from client data]%
  * Repayment type: Capital Repayment
  * Term: 25 years (indicative)
  * Purpose: [Purchase / Remortgage / Buy to Let — from client data]
- Section 4: Decision — prominent "CONDITIONAL AGREEMENT IN PRINCIPLE" box in green/teal styling, showing the loan amount
- Section 5: Conditions — bullet list:
  * Subject to full credit search with satisfactory outcome
  * Subject to satisfactory property valuation
  * Subject to full income verification and affordability assessment
  * Subject to satisfactory identity and address verification (AML/KYC)
  * Subject to acceptable 3 months' bank statement evidence
  * [If adverse history present]: Subject to full review and acceptance of declared adverse credit history
  * Subject to lender's standard terms, conditions, and current product availability
- Section 6: Adverse credit note (only if client has adverse) — clearly state that this AIP has been prepared with full knowledge of the declared adverse history
- Section 7: Validity — "This Agreement in Principle is valid for 90 days from the date of issue: [DATE]"
- Section 8: Important disclaimer — "This is NOT a mortgage offer or guarantee of lending. It is a conditional indication only, subject to full application and underwriting. The lender reserves the right to decline a full application even where an AIP has been issued."
- Signature blocks: Consultant (name, FCA number, date) and Client acknowledgement (printed name, signature, date)
""",
    }
    return reqs.get(doc_type, "")
