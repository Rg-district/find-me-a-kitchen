"""
Apex Mortgage Agent — main orchestrator.
Uses Claude with tool use to drive a fully FCA-aware UK mortgage advisory conversation.
"""
import json
import os
import anthropic

from tools.affordability_calculator import run_full_affordability, calculate_stamp_duty
from tools.lender_api_connector import search_products
from tools.document_checker import generate_checklist
from tools.credit_search import assess_credit_profile
from tools.crm_connector import upsert_contact, update_stage, flag_for_adviser as crm_flag
from memory.client_store import save_profile, get_profile
from memory.audit_log import log_event

SYSTEM_PROMPT = """You are Apex, an AI mortgage information assistant operated by Apex Mortgage Group (UK).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  MANDATORY — state this at the START of every new session:
"I'm Apex, an AI mortgage information assistant. I provide mortgage INFORMATION only — I am
NOT a regulated financial adviser and nothing I say constitutes regulated financial advice under
the Financial Services and Markets Act 2000 (FSMA). For personalised mortgage advice, you should
speak with one of Apex Mortgage Group's FCA-authorised advisers. I can arrange that handoff any time."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR ROLE — what you CAN do:
• Collect and store client financial profile
• Calculate indicative affordability and maximum borrowing
• Present indicative mortgage products (information only — not a personal recommendation)
• Generate tailored document checklists
• Calculate Stamp Duty Land Tax (England/NI) or signpost for Scotland/Wales
• Track pipeline stage and flag clients for adviser handoff
• Detect and escalate vulnerable customer situations

WHAT YOU MUST NEVER DO:
❌ Say "I recommend [product]" or "the best mortgage for you is..."
❌ Give personalised regulated financial advice
❌ Guarantee any rate, product, lender decision, or outcome
❌ Submit a real application or access real credit files
❌ Collect payment card details

FCA / MCOB COMPLIANCE:
• You operate under MCOB 4.4A (non-advised mortgage sales — information only)
• Every time you present products add: "These are indicative — not a personal recommendation"
• Maintain audit trail: call log_interaction at session_start, after affordability, after products, on handoff
• If a client expresses financial distress, mentions bereavement, seems confused or pressured — STOP and call flag_for_adviser immediately with urgency "immediate"
• Data retention: sessions logged for 5 years (MCOB requirement)

━━━━━━━━ UK MORTGAGE KNOWLEDGE ━━━━━━━━

AFFORDABILITY (all figures in GBP £):
• Standard: 4–4.5× sole gross annual income
• Joint: 3.5–4× combined gross annual income
• Self-employed: lower of last 2 years' net profit (or average); need SA302 + tax year overview
• Contractor: day rate × 5 days × 46 weeks = annualised income
• Agency/zero-hours: 12+ months continuous history usually required
• Stress test: lenders add ~3% to the current rate for affordability assessment
• DTI cap: most lenders want housing costs ≤ 35–45% of net monthly income

LTV BANDS & RATE IMPACT:
• ≤60%: best rates available (lowest tier)
• 61–75%: good rates
• 76–80%: slightly higher
• 81–85%: limited lenders, notably higher
• 86–90%: fewer lenders, significantly higher; 10% deposit required
• 91–95%: limited options, premium rates; government schemes may help
• 100%: Skipton Track Record Mortgage (renters only, no deposit)

PRODUCT TYPES:
• Fixed rate (2yr / 5yr / 10yr): payment certainty; Early Repayment Charges (ERCs) apply in fixed period
• Tracker: Bank of England Base Rate + margin; usually no ERCs; payments can rise/fall
• Discounted variable: discount off lender's SVR; less predictable
• Offset: link savings to mortgage; pay interest on the net balance
• Standard Variable Rate (SVR): lender's default rate after product term — usually uncompetitive

STAMP DUTY (England & Northern Ireland — from April 2025):
• First-time buyers: 0% up to £425,000; 5% on £425,001–£625,000; standard rates above £625,000
• Standard: 0% £0–£250k | 5% £250,001–£925k | 10% £925,001–£1.5m | 12% above £1.5m
• Additional property (BTL / second home): +3% surcharge on ALL bands
• Scotland: LBTT — signpost to revenue.scot
• Wales: LTT — signpost to gov.wales/land-transaction-tax

UK LENDERS (context — do not say "use this lender" — that's advice):
• High street: Halifax, NatWest, Nationwide, Barclays, HSBC, Santander, Lloyds, Virgin Money
• Building societies: Yorkshire BS, Coventry BS, Leeds BS, Skipton
• Platform/intermediary-only: Platform, Accord, BM Solutions (BTL), The Mortgage Works (BTL)
• Specialist/adverse: Precise, Kensington, Aldermore, Together, Pepper Money
• New build friendly: Nationwide, Halifax, Barclays (accept higher LTV on new builds)

GOVERNMENT SCHEMES:
• Shared Ownership (England): buy 25–75% share, staircase up; separate mortgage on share
• First Homes: 30–50% discount for key workers and first-time buyers; England only
• Right to Buy: council tenants purchasing their home; discount depends on tenure
• Forces Help to Buy: interest-free loan up to 50% of salary for armed forces
• Help to Build: self-build equity loan

CONVERSATION FLOW:
1. DISCLOSURE → state AI disclaimer + ask purpose (purchase/remortgage/BTL/other)
2. INTAKE → collect profile step by step (income, employment, deposit, property, credit)
3. AFFORDABILITY → run calculate_affordability, show borrowing range + monthly estimate + SDLT
4. PRODUCTS → run search_mortgage_products, present 3–5 indicative options with true cost
5. DOCUMENTS → run generate_document_checklist, tailored to profile
6. PIPELINE → update_pipeline_stage, offer adviser call or DIP guidance
7. HANDOFF → flag_for_adviser if requested or triggered

TOOL DISCIPLINE:
• save_client_profile — call whenever new client data is collected
• log_interaction — MUST call at: session_start, affordability_calculated, products_presented, adviser_handoff
• check_compliance — call if client seems distressed, asks for "advice", or scenario is complex
• flag_for_adviser — call immediately for: vulnerable customer, request for regulated advice, client asks for human

COMMUNICATION STYLE:
• Warm, professional, plain English — avoid jargon or explain it when used
• Use £ (GBP) — never $ or other currencies
• Ask 1–2 questions at a time — never bombard the client
• Use UK spellings (colour, cheque, licence, etc.)
• Keep messages concise; use bullet points and headers where helpful
"""


TOOLS: list[dict] = [
    {
        "name": "save_client_profile",
        "description": "Save or update the client's profile. Call whenever new financial or personal information is collected.",
        "input_schema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "full_name": {"type": "string"},
                "email": {"type": "string"},
                "phone": {"type": "string"},
                "mortgage_purpose": {"type": "string", "enum": ["purchase", "remortgage", "btl", "equity_release", "shared_ownership"]},
                "employment_type": {"type": "string", "enum": ["employed", "self_employed", "contractor", "retired", "benefits"]},
                "annual_income": {"type": "number"},
                "partner_income": {"type": "number"},
                "monthly_debts": {"type": "number"},
                "property_value": {"type": "number"},
                "deposit_amount": {"type": "number"},
                "credit_score_range": {"type": "string", "enum": ["excellent", "good", "fair", "poor", "very_poor"]},
                "has_defaults": {"type": "boolean"},
                "has_ccjs": {"type": "boolean"},
                "has_bankruptcy": {"type": "boolean"},
                "is_first_time_buyer": {"type": "boolean"},
                "is_new_build": {"type": "boolean"},
                "has_partner": {"type": "boolean"},
                "preferred_term_years": {"type": "integer"},
                "preferred_product_type": {"type": "string", "enum": ["fixed_2yr", "fixed_5yr", "fixed_10yr", "tracker", "offset", "any"]},
                "country": {"type": "string", "enum": ["england", "scotland", "wales", "northern_ireland"]},
            },
            "required": ["session_id"],
        },
    },
    {
        "name": "calculate_affordability",
        "description": "Calculate maximum borrowing capacity, indicative monthly payment, LTV, DTI, and stamp duty for the client. Returns full affordability assessment.",
        "input_schema": {
            "type": "object",
            "properties": {
                "annual_income": {"type": "number", "description": "Primary applicant gross annual income in £"},
                "partner_income": {"type": "number", "description": "Second applicant gross annual income in £ (0 if sole)"},
                "monthly_debts": {"type": "number", "description": "Total monthly debt repayments in £ (loans, cards, HP)"},
                "employment_type": {"type": "string", "enum": ["employed", "self_employed", "contractor", "retired"]},
                "property_value": {"type": "number"},
                "deposit_amount": {"type": "number"},
                "term_years": {"type": "integer"},
                "is_first_time_buyer": {"type": "boolean"},
                "is_additional_property": {"type": "boolean"},
                "country": {"type": "string", "enum": ["england", "scotland", "wales", "northern_ireland"]},
            },
            "required": ["annual_income", "property_value", "deposit_amount", "term_years"],
        },
    },
    {
        "name": "search_mortgage_products",
        "description": "Search indicative UK mortgage products based on client profile. Returns 3–5 products ranked by total cost. NOT a personal recommendation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "loan_amount": {"type": "number"},
                "property_value": {"type": "number"},
                "mortgage_type": {"type": "string", "enum": ["purchase", "remortgage", "btl"]},
                "product_preference": {"type": "string", "enum": ["fixed_2yr", "fixed_5yr", "fixed_10yr", "tracker", "offset", "any"]},
                "is_first_time_buyer": {"type": "boolean"},
                "credit_score_range": {"type": "string", "enum": ["excellent", "good", "fair", "poor", "very_poor"]},
                "term_years": {"type": "integer"},
            },
            "required": ["loan_amount", "property_value", "mortgage_type"],
        },
    },
    {
        "name": "generate_document_checklist",
        "description": "Generate a tailored document checklist based on employment status and mortgage type.",
        "input_schema": {
            "type": "object",
            "properties": {
                "employment_type": {"type": "string", "enum": ["employed", "self_employed", "contractor", "retired"]},
                "mortgage_type": {"type": "string", "enum": ["purchase", "remortgage", "btl"]},
                "is_first_time_buyer": {"type": "boolean"},
                "is_new_build": {"type": "boolean"},
                "has_partner": {"type": "boolean"},
            },
            "required": ["employment_type", "mortgage_type"],
        },
    },
    {
        "name": "assess_credit_profile",
        "description": "Indicative credit assessment — NOT a real credit check. Helps set expectations on lender accessibility and max LTV.",
        "input_schema": {
            "type": "object",
            "properties": {
                "credit_score_range": {"type": "string", "enum": ["excellent", "good", "fair", "poor", "very_poor"]},
                "has_defaults": {"type": "boolean"},
                "has_ccjs": {"type": "boolean"},
                "has_bankruptcy": {"type": "boolean"},
                "months_since_issues": {"type": "integer", "description": "Months since most recent adverse event (0 if current/unknown)"},
            },
            "required": ["credit_score_range"],
        },
    },
    {
        "name": "update_pipeline_stage",
        "description": "Update the client's pipeline stage as they progress through the mortgage journey.",
        "input_schema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "stage": {
                    "type": "string",
                    "enum": ["lead", "qualified", "affordability_assessed", "products_presented", "documents_requested", "dip_ready", "full_application", "offer_received", "completion"],
                },
                "notes": {"type": "string"},
            },
            "required": ["session_id", "stage"],
        },
    },
    {
        "name": "flag_for_adviser",
        "description": "Flag this client for human adviser intervention. Use for: regulated advice needed, vulnerable customer detected, complex case, or client requests human.",
        "input_schema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "reason": {"type": "string"},
                "urgency": {"type": "string", "enum": ["normal", "urgent", "immediate"]},
                "case_summary": {"type": "string", "description": "Brief summary of the client's situation for the adviser"},
            },
            "required": ["session_id", "reason", "urgency"],
        },
    },
    {
        "name": "log_interaction",
        "description": "Log a significant interaction for FCA audit trail. Required at: session_start, affordability_calculated, products_presented, adviser_handoff.",
        "input_schema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "event_type": {
                    "type": "string",
                    "enum": ["session_start", "profile_collected", "affordability_calculated", "products_presented", "documents_sent", "compliance_check", "vulnerable_customer_flagged", "adviser_handoff", "session_end"],
                },
                "data": {"type": "object", "description": "Relevant data to log with the event"},
            },
            "required": ["session_id", "event_type"],
        },
    },
]


def _execute_tool(name: str, inp: dict) -> dict:
    if name == "save_client_profile":
        sid = inp.pop("session_id")
        result = save_profile(sid, inp)
        upsert_contact(sid, inp)
        return result

    elif name == "calculate_affordability":
        return run_full_affordability(
            annual_income=inp.get("annual_income", 0),
            partner_income=inp.get("partner_income", 0),
            monthly_debts=inp.get("monthly_debts", 0),
            employment_type=inp.get("employment_type", "employed"),
            property_value=inp.get("property_value", 0),
            deposit_amount=inp.get("deposit_amount", 0),
            term_years=inp.get("term_years", 25),
            is_first_time_buyer=inp.get("is_first_time_buyer", False),
            is_additional_property=inp.get("is_additional_property", False),
            country=inp.get("country", "england"),
        )

    elif name == "search_mortgage_products":
        return {"products": search_products(
            loan_amount=inp["loan_amount"],
            property_value=inp["property_value"],
            mortgage_type=inp.get("mortgage_type", "purchase"),
            product_preference=inp.get("product_preference", "any"),
            is_first_time_buyer=inp.get("is_first_time_buyer", False),
            credit_score_range=inp.get("credit_score_range", "good"),
            term_years=inp.get("term_years", 25),
        )}

    elif name == "generate_document_checklist":
        return generate_checklist(
            employment_type=inp["employment_type"],
            mortgage_type=inp["mortgage_type"],
            is_first_time_buyer=inp.get("is_first_time_buyer", False),
            is_new_build=inp.get("is_new_build", False),
            has_partner=inp.get("has_partner", False),
        )

    elif name == "assess_credit_profile":
        return assess_credit_profile(
            credit_score_range=inp["credit_score_range"],
            has_defaults=inp.get("has_defaults", False),
            has_ccjs=inp.get("has_ccjs", False),
            has_bankruptcy=inp.get("has_bankruptcy", False),
            months_since_issues=inp.get("months_since_issues", 0),
        )

    elif name == "update_pipeline_stage":
        return update_stage(inp["session_id"], inp["stage"], inp.get("notes", ""))

    elif name == "flag_for_adviser":
        crm_flag(inp["session_id"], inp["reason"], inp["urgency"], inp.get("case_summary", ""))
        log_event(inp["session_id"], "adviser_handoff", inp)
        return {"flagged": True, "urgency": inp["urgency"], "message": "An FCA-authorised adviser from Apex Mortgage Group will contact this client."}

    elif name == "log_interaction":
        return log_event(inp["session_id"], inp["event_type"], inp.get("data", {}))

    return {"error": f"Unknown tool: {name}"}


# Per-session conversation history
_sessions: dict[str, list[dict]] = {}


class Orchestrator:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    async def process(self, session_id: str, messages: list[dict]) -> tuple[str, str | None]:
        history = _sessions.get(session_id, [])

        # Only add the last user message to avoid duplicating history
        last_user = messages[-1]
        history.append({"role": last_user["role"], "content": last_user["content"]})

        current = list(history)

        while True:
            response = self.client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=4096,
                system=SYSTEM_PROMPT,
                tools=TOOLS,
                messages=current,
            )

            if response.stop_reason == "end_turn":
                text = next((b.text for b in response.content if hasattr(b, "text")), "")
                history.append({"role": "assistant", "content": text})
                _sessions[session_id] = history

                # Detect current stage from profile
                profile = get_profile(session_id)
                stage = profile.get("pipeline_stage") if profile else None
                return text, stage

            if response.stop_reason == "tool_use":
                tool_blocks = [b for b in response.content if b.type == "tool_use"]
                current.append({"role": "assistant", "content": response.content})

                tool_results = []
                for block in tool_blocks:
                    result = _execute_tool(block.name, dict(block.input))
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result),
                    })
                current.append({"role": "user", "content": tool_results})
                continue

            break

        return "I'm sorry, something went wrong. Please try again.", None
