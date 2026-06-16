"""
Apex Mortgage Agent — Consultant-facing orchestrator.
This agent assists a UK mortgage consultant (not the end customer) who specialises
in adverse credit / bad-credit mortgage cases.
"""
import json
import os
from typing import Optional

import anthropic

from memory.client_store import get_client, get_analysis
from tools.grading_engine import grade_client, GRADE_METADATA
from tools.adverse_lender_matcher import match_lenders, LENDER_DATABASE

SYSTEM_PROMPT = """You are MAU Adviser, an expert back-office assistant for Mortgages Are Us — a UK mortgage consultancy specialising in adverse credit and bad-credit mortgage cases.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT: THE USER IS THE CONSULTANT — NOT THE CLIENT
You are talking directly to an experienced UK mortgage consultant/broker.
Use technical, professional language. They know the industry. Do not over-explain basics.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR ROLE:
• Assist the consultant in reviewing bank statement analysis results
• Explain red flags and what they mean to specific lenders
• Advise on lender strategy — which lenders to approach and in what order
• Interpret grading scores and what each component means for the application
• Advise on adverse credit markers: CCJs, defaults, IVAs, bankruptcies, DMPs, payday loans
• Identify application readiness and outstanding requirements
• Help structure the case narrative for underwriter packs
• Answer questions about MCOB compliance considerations (information only)
• Advise on credit rehabilitation strategies for clients who need to wait

UK ADVERSE CREDIT EXPERTISE:
• CCJs (County Court Judgements): Date registered, amount, satisfied/unsatisfied, time since — critical factors
• Defaults: Similar to CCJs — date, amount, satisfied status, time since
• IVA (Individual Voluntary Arrangement): Must be fully discharged for most lenders; some consider active IVAs
• Bankruptcy: Discharge date is key — most lenders need 3-6 years post-discharge; Norton and Bluestone from Day 1
• DMP (Debt Management Plan): Conduct matters — 12+ months clean DMP conduct usually required
• Payday loans: Most adverse lenders require 12-24 months clean from last payday loan
• Missed/returned payments: Pattern matters more than isolated instances

LENDER LANDSCAPE (UK Adverse Specialists):
• Grade C (Adverse Light): Precise Mortgages, Kensington Mortgages
• Grade D (Adverse): Aldermore, Together Money, Pepper Money, Vida Homeloans
• Grade E (Heavy Adverse): Norton Home Loans, Bluestone Mortgages, MBS Lending
• Key BTL adverse lenders: Precise, Keystone, Paragon (for portfolio landlords)
• Self-employed adverse: Aldermore, Kensington, Vida — strongest on SE criteria

LENDER-SPECIFIC QUIRKS (useful intelligence):
• Precise: Satisfied CCJs ≤ £2,500 on standard criteria; BDM pre-submission call recommended for complex cases
• Kensington: More flexible on unsatisfied adverse than most; strong on IVAs post-discharge
• Aldermore: Best for complex self-employed — will consider 1-year accounts; check current product guide for adverse tiers
• Together Money: Will look at unusual properties AND heavy adverse — good for dual-complexity cases
• Pepper: Good tiered pricing — rate reflects adverse severity which helps on mid-range adverse
• Norton: The primary day-1 bankruptcy lender — know the discharge date precisely
• Bluestone: Australian-backed, aggressive criteria — good to have in the panel
• MBS: Manual underwriting on everything — suitable for truly complex or declined cases

MCOB COMPLIANCE CONTEXT:
• This tool is for internal consultant use — not direct client communication
• The consultant is FCA-authorised and understands regulated advice boundaries
• Document all basis for lender recommendations in the case file
• Treat gambling, payday loans, and undisclosed adverse as material facts for disclosure

TONE:
• Professional, direct, efficient
• Technical mortgage language is appropriate
• Use bullet points for complex comparisons
• Flag critical issues clearly (e.g., potential misrepresentation, compliance concerns)
• All monetary values in GBP (£)
• UK spellings throughout

TOOLS AVAILABLE:
Use get_client_summary to pull client data before answering client-specific questions.
Use explain_red_flag to provide detailed lender impact analysis for specific flags.
Use lender_strategy to generate a structured lender approach plan.
Use check_application_readiness to produce a readiness checklist.
Use generate_document when the consultant asks you to create, draft, or generate a document (IDD, Privacy Notice, ESIS/KFI, or AIP). Always call get_client_summary first if you haven't already, then call generate_document with the correct doc_type and client_id. Tell the consultant the document has been generated and to view it in the Documents tab."""

TOOLS: list[dict] = [
    {
        "name": "get_client_summary",
        "description": "Retrieve the full profile, bank statement analysis, and grade for a specific client. Use this before answering any client-specific question.",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {
                    "type": "string",
                    "description": "The client's UUID",
                },
            },
            "required": ["client_id"],
        },
    },
    {
        "name": "explain_red_flag",
        "description": "Provide a detailed explanation of how a specific red flag affects lender appetite and what the consultant should do about it.",
        "input_schema": {
            "type": "object",
            "properties": {
                "flag_type": {
                    "type": "string",
                    "enum": ["gambling", "payday_loans", "returned_dds", "overdraft", "income_discrepancy", "ccj", "default", "iva", "bankruptcy", "dmp"],
                    "description": "The type of red flag to explain",
                },
                "context": {
                    "type": "string",
                    "description": "Specific context: amounts, dates, frequency, lenders involved",
                },
                "client_grade": {
                    "type": "string",
                    "enum": ["A", "B", "C", "D", "E", "F"],
                    "description": "The client's current grade",
                },
            },
            "required": ["flag_type"],
        },
    },
    {
        "name": "lender_strategy",
        "description": "Generate a structured lender approach strategy for a client, including primary recommendation, fallback options, and BDM engagement advice.",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {
                    "type": "string",
                    "description": "Client ID to pull profile from store",
                },
                "grade": {
                    "type": "string",
                    "enum": ["A", "B", "C", "D", "E", "F"],
                    "description": "Client grade (if client_id not provided)",
                },
                "ccjs": {"type": "boolean"},
                "defaults": {"type": "boolean"},
                "bankruptcy": {"type": "boolean"},
                "iva": {"type": "boolean"},
                "months_since_adverse": {"type": "integer"},
                "ltv": {"type": "number"},
                "employment_type": {"type": "string"},
                "loan_amount": {"type": "number"},
                "notes": {"type": "string", "description": "Any additional case context"},
            },
        },
    },
    {
        "name": "generate_document",
        "description": "Generate a professional, FCA-compliant UK mortgage document pre-filled with the client's data. Use when the consultant asks to create, draft, or prepare an IDD, Privacy Notice, ESIS/KFI, or Agreement in Principle.",
        "input_schema": {
            "type": "object",
            "properties": {
                "doc_type": {
                    "type": "string",
                    "enum": ["idd", "privacy_notice", "esis", "aip"],
                    "description": "idd = Initial Disclosure Document | privacy_notice = Privacy Notice / Terms of Business | esis = ESIS / Key Facts Illustration | aip = Agreement in Principle",
                },
                "client_id": {
                    "type": "string",
                    "description": "The client's UUID — required to pre-fill all client data",
                },
            },
            "required": ["doc_type", "client_id"],
        },
    },
    {
        "name": "check_application_readiness",
        "description": "Assess whether a client's application is ready to submit. Returns a structured checklist of outstanding items.",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {
                    "type": "string",
                    "description": "Client ID",
                },
            },
            "required": ["client_id"],
        },
        # Cache all tools up to and including this last one
        "cache_control": {"type": "ephemeral"},
    },
]


def _execute_tool(name: str, inp: dict) -> dict:
    """Execute a consultant assistant tool."""

    if name == "get_client_summary":
        client_id = inp["client_id"]
        client = get_client(client_id)
        if not client:
            return {"error": f"Client {client_id} not found"}

        stored = get_analysis(client_id)
        analysis = stored.get("analysis") if stored else None
        grade_result = stored.get("grade_result") if stored else None

        return {
            "client": client,
            "analysis_available": analysis is not None,
            "analysis_summary": {
                "avg_monthly_income": analysis.get("income_analysis", {}).get("total_average_monthly_income") if analysis else None,
                "income_cv": analysis.get("income_analysis", {}).get("income_coefficient_of_variation") if analysis else None,
                "gambling_detected": analysis.get("red_flags", {}).get("gambling", {}).get("detected") if analysis else None,
                "payday_loans_detected": analysis.get("red_flags", {}).get("payday_loans", {}).get("detected") if analysis else None,
                "returned_dds": analysis.get("red_flags", {}).get("returned_direct_debits", {}).get("count") if analysis else None,
                "overdraft_severity": analysis.get("red_flags", {}).get("overdraft_usage", {}).get("severity") if analysis else None,
                "balance_trend": analysis.get("balance_trend", {}).get("trend") if analysis else None,
                "underwriter_notes": analysis.get("underwriter_notes") if analysis else None,
            },
            "grade_result": grade_result,
        }

    elif name == "explain_red_flag":
        flag_type = inp["flag_type"]
        context = inp.get("context", "")
        grade = inp.get("client_grade", "D")

        explanations = {
            "gambling": {
                "impact": "Gambling is viewed by lenders as a discretionary spend that indicates poor financial management and impulse control. It creates concerns about future payment priority — will the client pay their mortgage or place bets?",
                "lender_positions": {
                    "Mainstream (Halifax, NatWest etc)": "Typically decline any visible gambling activity. No exceptions.",
                    "Near-prime (Platform, Accord)": "Will decline or heavily scrutinise regular gambling spend.",
                    "Specialist (Precise, Kensington)": "Case-by-case. Historical and minimal amounts may be acceptable with explanation. Current/significant gambling: decline.",
                    "Adverse (Aldermore, Pepper, Together)": "More flexible but still a concern. Amount as % of income is the key metric. < 1% income may be acceptable.",
                    "Heavy adverse (Norton, MBS)": "Will consider but will request client explanation letter. Gambling must not be ongoing at point of application.",
                },
                "advice": "Obtain a written explanation from the client. They should demonstrate gambling has ceased and accounts are now clean. 3-6 months' clean statements may be required before submission. Consider whether client needs to wait.",
                "mcob_note": "Gambling is a material fact that must be disclosed. Do not present a case without flagging this to the lender."
            },
            "payday_loans": {
                "impact": "Payday loans signal financial distress and inability to manage to next payday. This is one of the most serious adverse markers — it suggests the client cannot manage their finances without high-cost credit.",
                "lender_positions": {
                    "Mainstream lenders": "Automatic decline in most cases.",
                    "Near-prime": "Typically decline even for historical payday loans within 24 months.",
                    "Precise Mortgages": "Historical only (> 12 months) — case by case.",
                    "Kensington": "Historical considered (> 12 months) with explanation.",
                    "Aldermore/Pepper/Together": "More flexible but most require 12 months clean minimum.",
                    "Norton/Bluestone/MBS": "Most flexible — will consider recent history with explanation.",
                },
                "advice": "Establish the exact date of the most recent payday loan. If within 12 months, advise client to wait before applying. If historical, prepare a full explanation letter. Check credit report to confirm all payday lenders are listed.",
                "mcob_note": "All payday loan history must be disclosed in full to the lender."
            },
            "returned_dds": {
                "impact": "Returned (bounced) direct debits demonstrate a failure to maintain adequate funds for committed payments. This is a primary indicator of cash flow stress and payment management issues.",
                "lender_positions": {
                    "1 returned DD": "Manageable with explanation if isolated incident. Most adverse lenders will consider.",
                    "2 returned DDs": "Requires explanation and supporting context. Specialist lenders only.",
                    "3+ returned DDs": "Significant concern — heavy adverse lenders only, and not guaranteed.",
                },
                "advice": "Obtain a satisfactory explanation for each returned DD. Bank error? Timing issue? If preventable, note if the situation has since been resolved. Request a clean period of 3-6 months before submission if possible.",
                "mcob_note": "Returned DDs within the statement period are likely to be visible to underwriters — do not omit them from the case narrative."
            },
            "overdraft": {
                "impact": "Regular overdraft use — especially end-of-month patterns — suggests the client is living beyond their means and cannot comfortably service existing commitments, let alone a mortgage.",
                "lender_positions": {
                    "Occasional use": "Usually acceptable with adverse lenders if the client is clearly within an agreed facility.",
                    "Frequent/monthly": "Concern — will require explanation of cash flow. Some adverse lenders will decline.",
                    "Always overdrawn": "Very serious. Most lenders will decline. Client needs to demonstrate improved financial management.",
                },
                "advice": "Establish whether the overdraft is authorised and within the agreed limit. If the client has improved their position, more recent clean statements will strengthen the case. For always-overdrawn situations, advise client to wait for 3+ clean months.",
                "mcob_note": None
            },
            "income_discrepancy": {
                "impact": "Where verified income (from statements) differs significantly from declared income, this raises concerns about misrepresentation — which has serious legal and compliance implications.",
                "lender_positions": {
                    "Overstated income (actual < declared)": "CRITICAL — this is potential mortgage fraud. If actual income is more than 15-20% below declared, this must be addressed before submission. Some lenders have mandatory reporting requirements.",
                    "Understated income (actual > declared)": "Generally acceptable — client being conservative. Verify source of additional credits.",
                },
                "advice": "If income is overstated: discuss with client immediately. Amend the declared income figure. If there are genuine additional income sources not visible on statements (e.g., cash income, benefits paid separately), ensure these are evidenced properly. Do not submit with a known material discrepancy.",
                "mcob_note": "MCOB 4.4A and the FCA's responsible lending requirements mean this must be investigated. Potential POCA implications if income misrepresentation is suspected."
            },
            "ccj": {
                "impact": "A CCJ is a court order confirming a debt was not paid. Lenders treat this as a significant adverse marker. Key factors: date registered, original amount, whether satisfied (paid off), and time since.",
                "lender_positions": {
                    "Mainstream": "Will decline all CCJs in most cases. Some allow satisfied CCJs > 3 years old at low LTV.",
                    "Precise": "Satisfied CCJs ≤ £2,500 on standard; larger on bespoke criteria. Time since matters.",
                    "Kensington": "Unsatisfied CCJs considered — one of few lenders to do so.",
                    "Aldermore/Pepper": "Multiple CCJs considered — case by case.",
                    "Norton/Bluestone/MBS": "No hard limits on number or amount — always consider.",
                },
                "advice": "Obtain full CCJ details: date registered, court, original amount, date satisfied (if applicable). Get copy of satisfaction letter. Confirm on credit report. Prepare case narrative explaining circumstances.",
                "mcob_note": None
            },
            "default": {
                "impact": "A default is registered when a creditor marks an account as unpaid after a defined missed payment period. Similar impact to CCJs but slightly less severe in lender scoring.",
                "lender_positions": {
                    "Mainstream": "Most decline all defaults registered within the last 3-6 years.",
                    "Specialist adverse lenders": "All will consider — criteria vary by amount, date, and satisfied status.",
                },
                "advice": "Confirm exact date(s) of default registration, original creditor, amount, and whether satisfied. Time since registration is the critical factor for most lenders.",
                "mcob_note": None
            },
            "iva": {
                "impact": "An IVA (Individual Voluntary Arrangement) is a formal insolvency process — it stays on the credit file for 6 years from start date. Mainstream lenders will not consider active IVAs. Post-discharge options exist.",
                "lender_positions": {
                    "Mainstream": "Decline — will not consider active or recently discharged IVA.",
                    "Kensington": "Post-discharge IVA considered — strong option.",
                    "Together, Pepper, Aldermore": "Post-discharge considered.",
                    "Norton/MBS": "Most flexible — will consider shorter post-discharge periods.",
                },
                "advice": "Obtain Certificate of Completion of IVA. Confirm exact discharge date. Any breach of IVA terms? Prepare a full explanation of what led to the IVA and how the client's financial position has improved.",
                "mcob_note": None
            },
            "bankruptcy": {
                "impact": "Bankruptcy is the most severe adverse marker. It remains on the credit file for 6 years from order date. The discharge date (typically 12 months from order) is the key starting point for lenders.",
                "lender_positions": {
                    "Mainstream": "Will not consider. Full stop.",
                    "Most specialist lenders": "Require 3-6 years post-discharge.",
                    "Kensington, Aldermore, Pepper": "Typically 3+ years post-discharge.",
                    "Norton Home Loans": "Day 1 from discharge — primary lender for this situation.",
                    "Bluestone": "Also day 1 from discharge.",
                    "MBS": "Very flexible — will consider.",
                },
                "advice": "Obtain Certificate of Discharge — confirm exact date. Confirm no current insolvency proceedings. Check for any assets included in bankruptcy estate. Client must have a satisfactory explanation of circumstances.",
                "mcob_note": None
            },
            "dmp": {
                "impact": "A DMP (Debt Management Plan) — an informal arrangement to repay debts via a third party (e.g., StepChange). Less severe than IVA but still adverse. Lenders look at conduct during the DMP period.",
                "lender_positions": {
                    "Mainstream": "Generally decline if DMP active.",
                    "Specialist lenders": "Most require the DMP to have been running for 12+ months with good conduct.",
                    "Together, Pepper, Norton": "Most flexible — active DMPs may be considered.",
                },
                "advice": "Obtain a conduct statement from the DMP provider. How long has the plan been running? Are payments up to date? What is the outstanding balance? Is the client in a position to exit the DMP on completion of the mortgage?",
                "mcob_note": None
            },
        }

        flag_info = explanations.get(flag_type, {"impact": "No detailed information available for this flag type.", "lender_positions": {}, "advice": ""})

        return {
            "flag_type": flag_type,
            "context_provided": context,
            "client_grade": grade,
            "impact_summary": flag_info.get("impact"),
            "lender_positions": flag_info.get("lender_positions", {}),
            "consultant_advice": flag_info.get("advice"),
            "mcob_note": flag_info.get("mcob_note"),
        }

    elif name == "lender_strategy":
        # If client_id provided, pull from store
        client_id = inp.get("client_id")
        annual_income = 0.0
        monthly_debts = 0.0
        if client_id:
            client = get_client(client_id)
            if client:
                adverse = client.get("adverse_history", {})
                grade = client.get("grade") or inp.get("grade", "D")
                ccjs = bool(adverse.get("ccj"))
                defaults = bool(adverse.get("default"))
                bankruptcy = bool(adverse.get("bankruptcy"))
                months_since = int(adverse.get("months_since_most_recent") or 0)
                employment_type = client.get("employment_type", "employed")
                loan_amount = float(client.get("loan_amount", 0))
                ltv = 75.0
                if client.get("loan_amount") and client.get("property_value"):
                    try:
                        ltv = (float(client["loan_amount"]) / float(client["property_value"])) * 100
                    except (TypeError, ZeroDivisionError):
                        pass

                stored = get_analysis(client_id)
                analysis = stored.get("analysis", {}) if stored else {}
                verified_monthly_income = float((analysis.get("income_analysis") or {}).get("total_average_monthly_income", 0) or 0)
                monthly_income = verified_monthly_income if verified_monthly_income > 0 else float(client.get("declared_income", 0) or 0)
                annual_income = monthly_income * 12
                monthly_debts = float((analysis.get("expenditure_analysis") or {}).get("total_fixed_monthly", 0) or 0)
            else:
                return {"error": f"Client {client_id} not found"}
        else:
            grade = inp.get("grade", "D")
            ccjs = inp.get("ccjs", False)
            defaults = inp.get("defaults", False)
            bankruptcy = inp.get("bankruptcy", False)
            months_since = int(inp.get("months_since_adverse", 0))
            ltv = float(inp.get("ltv", 75.0))
            employment_type = inp.get("employment_type", "employed")
            loan_amount = float(inp.get("loan_amount", 0))

        matched = match_lenders(
            grade=grade,
            ccjs=ccjs,
            defaults=defaults,
            bankruptcy=bankruptcy,
            months_since_adverse=months_since,
            ltv=ltv,
            employment_type=employment_type,
            annual_income=annual_income,
            monthly_debts=monthly_debts,
        )

        grade_info = GRADE_METADATA.get(grade, {})

        primary = matched[0] if matched else None
        fallbacks = matched[1:3] if len(matched) > 1 else []

        return {
            "grade": grade,
            "grade_description": grade_info.get("description"),
            "primary_recommendation": {
                "lender": primary["name"] if primary else "None identified",
                "suitability_score": primary.get("suitability_score") if primary else 0,
                "max_ltv": primary.get("max_ltv") if primary else None,
                "match_reasons": primary.get("match_reasons", []) if primary else [],
                "contact": primary.get("contact") if primary else None,
                "notes": primary.get("notes") if primary else None,
                "affordability_estimate": primary.get("affordability_estimate") if primary else None,
            } if primary else None,
            "fallback_lenders": [
                {
                    "lender": l["name"],
                    "suitability_score": l.get("suitability_score"),
                    "max_ltv": l.get("max_ltv"),
                    "contact": l.get("contact"),
                    "affordability_estimate": l.get("affordability_estimate"),
                }
                for l in fallbacks
            ],
            "all_matched_count": len(matched),
            "strategy_notes": f"Grade {grade} case with LTV {ltv:.1f}%. {len(matched)} lenders matched. Recommend pre-submission BDM call for Grade D/E cases.",
            "bdm_recommendation": grade in ("C", "D", "E"),
        }

    elif name == "generate_document":
        from tools.document_generator import generate_document as gen_doc, DOC_TYPES
        from memory.client_store import save_document, get_analysis as _get_analysis

        doc_type = inp.get("doc_type", "")
        client_id = inp.get("client_id", "")

        if doc_type not in DOC_TYPES:
            return {"error": f"Invalid doc_type '{doc_type}'. Must be one of: {', '.join(DOC_TYPES)}"}

        client = get_client(client_id)
        if not client:
            return {"error": f"Client {client_id} not found"}

        stored = _get_analysis(client_id)
        analysis = stored.get("analysis") if stored else None

        try:
            html = gen_doc(doc_type=doc_type, client=client, analysis=analysis)
            save_document(client_id, doc_type, html)
            return {
                "success": True,
                "doc_type": doc_type,
                "doc_name": DOC_TYPES[doc_type],
                "client_name": client.get("name"),
                "message": (
                    f"{DOC_TYPES[doc_type]} generated successfully for {client.get('name', 'the client')}. "
                    f"Switch to the **Documents** tab to view, download, or print it."
                ),
            }
        except Exception as exc:
            return {"error": f"Document generation failed: {exc}"}

    elif name == "check_application_readiness":
        client_id = inp["client_id"]
        client = get_client(client_id)
        if not client:
            return {"error": f"Client {client_id} not found"}

        stored = get_analysis(client_id)
        analysis = stored.get("analysis") if stored else None
        grade_result = stored.get("grade_result") if stored else None

        checklist = []
        blockers = []

        # Analysis complete?
        if not analysis:
            blockers.append("Bank statement analysis not yet completed — upload statements first")
        else:
            checklist.append({"item": "Bank statement analysis", "status": "complete"})

        # Grade?
        if not grade_result:
            blockers.append("Client grading not completed")
        else:
            grade = grade_result.get("grade", "F")
            checklist.append({"item": f"Client grade: {grade} ({grade_result.get('grade_label', '')})", "status": "complete"})
            if grade == "F":
                blockers.append("Grade F — application not viable. Client requires credit rehabilitation.")

        # Adverse history
        adverse = client.get("adverse_history", {})
        if adverse.get("bankruptcy") and not adverse.get("months_since_most_recent"):
            blockers.append("Bankruptcy noted but discharge date not confirmed — obtain Certificate of Discharge")

        if adverse.get("ccj"):
            checklist.append({"item": "CCJ details — obtain full registry extract + satisfaction letter", "status": "outstanding"})

        if adverse.get("iva"):
            checklist.append({"item": "IVA — obtain Certificate of Completion", "status": "outstanding"})

        if adverse.get("dmp"):
            checklist.append({"item": "DMP — obtain conduct statement from provider", "status": "outstanding"})

        # Red flags from analysis
        if analysis:
            rf = analysis.get("red_flags", {})
            if rf.get("gambling", {}).get("detected"):
                blockers.append("Gambling detected — client explanation letter required before submission")

            payday = rf.get("payday_loans", {})
            if payday.get("detected") and payday.get("severity") not in ("historical", "none"):
                blockers.append("Recent payday loan activity — advise client to wait 12+ months clean before submission")

            rdd_count = rf.get("returned_direct_debits", {}).get("count", 0)
            if rdd_count >= 3:
                blockers.append(f"{rdd_count} returned DDs — prepare explanation letter and check for clean period")

        # Standard docs
        checklist.append({"item": "3 months most recent bank statements", "status": "outstanding"})
        checklist.append({"item": "Proof of identity (passport/driving licence)", "status": "outstanding"})
        checklist.append({"item": "Proof of address (utility bill/council tax < 3 months)", "status": "outstanding"})
        checklist.append({"item": "Proof of deposit (3 months statements showing accumulation)", "status": "outstanding"})

        emp_type = client.get("employment_type", "employed")
        if emp_type in ("self_employed", "contractor"):
            checklist.append({"item": "SA302 + Tax Year Overview (last 2 years)", "status": "outstanding"})
            checklist.append({"item": "Accountant's certificate (if required by lender)", "status": "outstanding"})
        else:
            checklist.append({"item": "Last 3 months payslips", "status": "outstanding"})
            checklist.append({"item": "Latest P60", "status": "outstanding"})

        ready = len(blockers) == 0

        return {
            "client_id": client_id,
            "client_name": client.get("name"),
            "ready_to_submit": ready,
            "blockers": blockers,
            "checklist": checklist,
            "recommendation": "Ready for DIP submission — proceed with chosen lender." if ready else f"Not ready — {len(blockers)} blocker(s) must be resolved first.",
        }

    return {"error": f"Unknown tool: {name}"}


# Per-session conversation history
_sessions: dict[str, list[dict]] = {}


class Orchestrator:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    async def process(
        self,
        session_id: str,
        messages: list[dict],
        client_id: Optional[str] = None,
    ) -> tuple[str, str | None]:
        history = _sessions.get(session_id, [])

        # Optionally inject client context on first message of session
        last_user = messages[-1]
        content = last_user["content"]

        # If this is the start of a session and a client_id is provided, inject summary
        if not history and client_id:
            client = get_client(client_id)
            if client:
                stored = get_analysis(client_id)
                grade_result = stored.get("grade_result") if stored else None
                grade_str = f"Grade {grade_result['grade']} (score {grade_result['score']}/100)" if grade_result else "Not yet graded"
                context_prefix = (
                    f"[CONTEXT — Client: {client.get('name', 'Unknown')} | {grade_str} | "
                    f"Purpose: {client.get('mortgage_purpose', 'N/A')} | "
                    f"Income declared: £{client.get('declared_income', 0):,.0f}/mo]\n\n"
                )
                if isinstance(content, list):
                    # Prepend context as a text block before the multimodal content
                    content = [{"type": "text", "text": context_prefix}] + content
                else:
                    content = context_prefix + content

        history.append({"role": "user", "content": content})
        current = list(history)

        while True:
            response = self.client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=4096,
                system=[
                    {
                        "type": "text",
                        "text": SYSTEM_PROMPT,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                tools=TOOLS,
                messages=current,
            )

            if response.stop_reason == "end_turn":
                text = next((b.text for b in response.content if hasattr(b, "text")), "")
                history.append({"role": "assistant", "content": text})
                _sessions[session_id] = history
                return text, None

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
