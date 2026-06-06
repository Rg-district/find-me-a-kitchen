"""UK credit report analyser — extracts structured credit data and cross-validates vs declared info."""
import base64
import json
import os
import re
from datetime import datetime
from typing import Optional

import anthropic

_client: Optional[anthropic.Anthropic] = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    return _client


CREDIT_REPORT_PROMPT = """You are a senior UK mortgage underwriter reviewing a credit report from a UK credit bureau (Experian, Equifax, or TransUnion/Callcredit).

Extract ALL information visible and return ONLY a JSON object with this exact structure. Do not include any text outside the JSON.

{
  "bureau": "<Experian | Equifax | TransUnion | Unknown>",
  "report_date": "<YYYY-MM-DD or null>",
  "credit_score": <number or null>,
  "credit_score_scale": "<e.g. 0-999 or null>",

  "personal_details": {
    "name_on_report": "<full name>",
    "date_of_birth": "<YYYY-MM-DD or null>",
    "addresses": [
      {
        "address": "<full address>",
        "from_date": "<YYYY-MM or null>",
        "to_date": "<YYYY-MM or current or null>",
        "current": <true|false>
      }
    ],
    "financial_associations": ["<list of linked names — people financially linked>"],
    "aliases": ["<other names on report>"]
  },

  "summary": {
    "total_accounts": <number>,
    "open_accounts": <number>,
    "closed_accounts": <number>,
    "defaulted_accounts": <number>,
    "total_outstanding_balance": <number or null>,
    "total_credit_limit": <number or null>,
    "overall_utilisation_pct": <number or null>,
    "oldest_account_years": <number or null>,
    "total_missed_payments": <number>,
    "defaults_count": <number>,
    "ccjs_count": <number>
  },

  "accounts": [
    {
      "creditor": "<lender / creditor name>",
      "account_type": "<mortgage | personal_loan | credit_card | overdraft | hire_purchase | catalogue | store_card | payday_loan | student_loan | utility | mobile | other>",
      "account_number_masked": "<e.g. xxxx1234 or null>",
      "opened_date": "<YYYY-MM or null>",
      "closed_date": "<YYYY-MM or null>",
      "status": "<open | closed | defaulted | settled | satisfied | transferred | dormant>",
      "balance": <number or null>,
      "credit_limit": <number or null>,
      "monthly_payment": <number or null>,
      "payment_history_months_recorded": <number>,
      "missed_payments_count": <number>,
      "is_payday_lender": <true|false>,
      "is_in_arrears": <true|false>,
      "notes": "<any notable info or null>"
    }
  ],

  "adverse_public_records": {
    "defaults": [
      {
        "creditor": "<name>",
        "account_type": "<type>",
        "amount": <number or null>,
        "date_registered": "<YYYY-MM-DD or null>",
        "date_satisfied": "<YYYY-MM-DD or null>",
        "satisfied": <true|false>
      }
    ],
    "ccjs": [
      {
        "court": "<court name or null>",
        "claimant": "<creditor name or null>",
        "amount": <number or null>,
        "date_registered": "<YYYY-MM-DD or null>",
        "date_satisfied": "<YYYY-MM-DD or null>",
        "satisfied": <true|false>
      }
    ],
    "iva": {
      "present": <true|false>,
      "start_date": "<YYYY-MM-DD or null>",
      "completion_date": "<YYYY-MM-DD or null>",
      "status": "<active | completed | null>"
    },
    "bankruptcy": {
      "present": <true|false>,
      "order_date": "<YYYY-MM-DD or null>",
      "discharge_date": "<YYYY-MM-DD or null>"
    },
    "dmp": {
      "present": <true|false>,
      "provider": "<provider name or null>"
    }
  },

  "credit_searches": [
    {
      "date": "<YYYY-MM-DD or null>",
      "company": "<searching company>",
      "type": "<hard | soft | unknown>",
      "purpose": "<mortgage | credit_card | loan | insurance | identity | telecoms | unknown>"
    }
  ],

  "underwriter_summary": "<3-5 sentences: overall credit profile assessment, key concerns, notable positives, and overall suitability impression for a UK adverse mortgage lender>"
}

IMPORTANT EXTRACTION RULES:
- Flag ALL payday lenders by name (QuickQuid, Wonga, SafetyNet Credit, Drafty, Sunny, Peachy, Cashfloat, Ferratum, Moneyboat, Wageday Advance, QuidMarket, Lending Stream, 247Moneybox, etc.) with is_payday_lender: true
- List EVERY account visible, both open and closed
- Record EVERY default, CCJ, and public record
- Include ALL addresses shown in address history
- List ALL credit searches visible
- Use null for any value you cannot determine — never guess"""


def analyse_credit_report(
    file_bytes: bytes,
    file_type: str,
    client_id: str,
) -> dict:
    """Analyse a credit bureau report PDF or image using Claude multimodal."""
    client = _get_client()

    encoded = base64.standard_b64encode(file_bytes).decode("utf-8")
    media_type_map = {
        "application/pdf": "application/pdf",
        "image/jpeg": "image/jpeg",
        "image/jpg": "image/jpeg",
        "image/png": "image/png",
        "image/webp": "image/webp",
    }
    media_type = media_type_map.get(file_type.lower(), "application/pdf")

    if media_type == "application/pdf":
        doc_block = {
            "type": "document",
            "source": {"type": "base64", "media_type": "application/pdf", "data": encoded},
        }
    else:
        doc_block = {
            "type": "image",
            "source": {"type": "base64", "media_type": media_type, "data": encoded},
        }

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": [
                    # Static instructions cached; variable document block follows
                    {"type": "text", "text": CREDIT_REPORT_PROMPT, "cache_control": {"type": "ephemeral"}},
                    doc_block,
                ],
            }
        ],
    )

    raw = response.content[0].text if response.content else ""

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if m:
            try:
                data = json.loads(m.group(0))
            except json.JSONDecodeError:
                data = _fallback(raw)
        else:
            data = _fallback(raw)

    data["_meta"] = {
        "client_id": client_id,
        "analysed_at": datetime.utcnow().isoformat(),
        "file_type": file_type,
        "model": "claude-sonnet-4-6",
    }
    return data


def cross_validate(client: dict, credit_data: dict) -> dict:
    """
    Cross-validate credit report data against what the client declared.
    Returns discrepancies, confirmations, and action items.
    """
    discrepancies = []
    confirmations = []
    flags = []

    adverse = client.get("adverse_history", {}) or {}
    pub = credit_data.get("adverse_public_records", {}) or {}
    accounts = credit_data.get("accounts", []) or []

    # ── CCJs ──────────────────────────────────────────────────────────────────
    ccjs_found = pub.get("ccjs", []) or []
    declared_ccj = bool(adverse.get("ccj"))
    if ccjs_found and not declared_ccj:
        ccj_details = "; ".join(
            f"£{c.get('amount', '?'):,} ({c.get('date_registered', '?')})" for c in ccjs_found[:3]
        )
        discrepancies.append({
            "type": "undisclosed_ccj",
            "label": f"Undisclosed CCJ{'s' if len(ccjs_found) > 1 else ''} — {len(ccjs_found)} Found",
            "detail": f"Credit report shows {len(ccjs_found)} CCJ(s) the client did not declare: {ccj_details}.",
            "severity": "critical",
        })
    elif declared_ccj and ccjs_found:
        confirmations.append(f"CCJ declared and confirmed on report ({len(ccjs_found)} entry/entries)")
    elif declared_ccj and not ccjs_found:
        flags.append({
            "type": "ccj_not_on_report",
            "label": "Declared CCJ Not Found on Report",
            "detail": "Client declared a CCJ but none appear on this report. May be on a different file or pre-date the report range — confirm with client.",
            "severity": "medium",
        })

    # ── Defaults ──────────────────────────────────────────────────────────────
    defaults_found = pub.get("defaults", []) or []
    declared_default = bool(adverse.get("default"))
    if defaults_found and not declared_default:
        creditors = ", ".join(d.get("creditor", "?") for d in defaults_found[:4])
        discrepancies.append({
            "type": "undisclosed_default",
            "label": f"Undisclosed Default{'s' if len(defaults_found) > 1 else ''} — {len(defaults_found)} Found",
            "detail": f"Defaults registered with: {creditors}. These were not declared by the client.",
            "severity": "critical",
        })
    elif declared_default and defaults_found:
        confirmations.append(f"Default(s) declared and confirmed ({len(defaults_found)} on report)")
    elif declared_default and not defaults_found:
        flags.append({
            "type": "default_not_on_report",
            "label": "Declared Default Not Found on Report",
            "detail": "Client declared default(s) but none appear on this report — may be satisfied/removed or on a different bureau.",
            "severity": "low",
        })

    # ── IVA ───────────────────────────────────────────────────────────────────
    iva = pub.get("iva", {}) or {}
    iva_found = bool(iva.get("present"))
    declared_iva = bool(adverse.get("iva"))
    if iva_found and not declared_iva:
        discrepancies.append({
            "type": "undisclosed_iva",
            "label": "Undisclosed IVA",
            "detail": f"An IVA appears on the credit report (status: {iva.get('status', 'unknown')}) that the client did not declare. This is a critical omission.",
            "severity": "critical",
        })
    elif declared_iva and iva_found:
        confirmations.append(f"IVA declared and confirmed on report (status: {iva.get('status', 'unknown')})")

    # ── Bankruptcy ────────────────────────────────────────────────────────────
    bk = pub.get("bankruptcy", {}) or {}
    bk_found = bool(bk.get("present"))
    declared_bk = bool(adverse.get("bankruptcy"))
    if bk_found and not declared_bk:
        discrepancies.append({
            "type": "undisclosed_bankruptcy",
            "label": "Undisclosed Bankruptcy",
            "detail": f"Bankruptcy found on report (order: {bk.get('order_date', '?')}, discharge: {bk.get('discharge_date', 'unknown')}). Not declared by client — critical omission with legal implications.",
            "severity": "critical",
        })
    elif declared_bk and bk_found:
        confirmations.append(f"Bankruptcy confirmed on report (discharge: {bk.get('discharge_date', 'not visible')})")

    # ── Payday loans ──────────────────────────────────────────────────────────
    payday_accounts = [a for a in accounts if a.get("is_payday_lender")]
    declared_payday = bool(adverse.get("payday_loans"))
    if payday_accounts and not declared_payday:
        names = ", ".join({a.get("creditor", "?") for a in payday_accounts}.__iter__())
        discrepancies.append({
            "type": "undisclosed_payday",
            "label": f"Undisclosed Payday Loan History — {len(payday_accounts)} Account(s)",
            "detail": f"Payday lenders found on report: {names}. Client did not declare any payday loan history.",
            "severity": "critical",
        })
    elif declared_payday and payday_accounts:
        names = ", ".join({a.get("creditor", "?") for a in payday_accounts}.__iter__())
        confirmations.append(f"Payday loan history declared and confirmed ({names})")

    # ── Open credit commitments ───────────────────────────────────────────────
    open_with_balance = [
        a for a in accounts
        if a.get("status") == "open"
        and a.get("account_type") in ("credit_card", "personal_loan", "overdraft", "hire_purchase", "catalogue", "store_card")
        and (a.get("balance") or 0) > 100
    ]
    if open_with_balance:
        total = sum(a.get("balance", 0) or 0 for a in open_with_balance)
        flags.append({
            "type": "active_credit_commitments",
            "label": f"Active Credit Commitments — £{total:,.0f} Outstanding",
            "detail": f"{len(open_with_balance)} open account(s) with balances totalling £{total:,.0f}. Ensure all are captured in affordability calculations.",
            "severity": "medium",
        })

    # ── Multiple recent hard searches ─────────────────────────────────────────
    searches = credit_data.get("credit_searches", []) or []
    hard_searches = [s for s in searches if s.get("type") == "hard"]
    if len(hard_searches) >= 4:
        flags.append({
            "type": "multiple_hard_searches",
            "label": f"{len(hard_searches)} Hard Credit Searches",
            "detail": f"{len(hard_searches)} hard searches visible — may indicate multiple recent credit applications or declined applications elsewhere. Discuss with client.",
            "severity": "medium" if len(hard_searches) < 6 else "high",
        })

    # ── Financial associations ────────────────────────────────────────────────
    associations = (credit_data.get("personal_details", {}) or {}).get("financial_associations", []) or []
    if associations:
        flags.append({
            "type": "financial_associations",
            "label": f"Financial Association(s): {', '.join(associations[:3])}",
            "detail": "Linked person's adverse credit could affect joint applications or where a financially-associated person is on title.",
            "severity": "low",
        })

    # ── Accounts in arrears ───────────────────────────────────────────────────
    in_arrears = [a for a in accounts if a.get("is_in_arrears") and a.get("status") == "open"]
    if in_arrears:
        creditors = ", ".join(a.get("creditor", "?") for a in in_arrears[:3])
        discrepancies.append({
            "type": "accounts_in_arrears",
            "label": f"{len(in_arrears)} Account(s) Currently in Arrears",
            "detail": f"Active arrears with: {creditors}. Lenders will require these to be resolved or explained before completion.",
            "severity": "high",
        })

    # ── Consultant actions ────────────────────────────────────────────────────
    actions = []
    critical = [d for d in discrepancies if d["severity"] == "critical"]
    if critical:
        actions.append(f"URGENT: {len(critical)} undisclosed adverse item(s) found — discuss with client immediately and update their file before proceeding")
    if ccjs_found and not declared_ccj:
        actions.append("Obtain full CCJ registry extract and satisfaction letters for each undisclosed CCJ")
    if defaults_found and not declared_default:
        actions.append("Obtain default notices and settlement letters for each undisclosed default")
    if payday_accounts and not declared_payday:
        actions.append("Establish dates of most recent payday loan — most adverse lenders require 12–24 months clean")
    if open_with_balance:
        total = sum(a.get("balance", 0) or 0 for a in open_with_balance)
        actions.append(f"Include £{total:,.0f} outstanding credit balances in affordability and DTI calculations")
    if len(hard_searches) >= 4:
        actions.append("Ask client to explain recent hard searches — confirm no outstanding declined applications")
    if in_arrears:
        actions.append("Obtain explanation and resolution plan for accounts currently in arrears")
    if associations:
        actions.append(f"Review financial association(s) with {', '.join(associations[:2])} — confirm no joint liabilities affecting this case")

    return {
        "discrepancies": discrepancies,
        "confirmations": confirmations,
        "flags": flags,
        "consultant_actions": actions,
        "critical_count": len(critical),
        "payday_accounts": payday_accounts,
        "open_credit_accounts": open_with_balance,
        "in_arrears_accounts": in_arrears,
        "hard_searches_count": len(hard_searches),
        "financial_associations": associations,
    }


def _fallback(raw: str) -> dict:
    return {
        "bureau": "Unknown",
        "report_date": None,
        "credit_score": None,
        "credit_score_scale": None,
        "personal_details": {"name_on_report": "", "date_of_birth": None, "addresses": [], "financial_associations": [], "aliases": []},
        "summary": {"total_accounts": 0, "open_accounts": 0, "closed_accounts": 0, "defaulted_accounts": 0, "total_outstanding_balance": None, "total_credit_limit": None, "overall_utilisation_pct": None, "oldest_account_years": None, "total_missed_payments": 0, "defaults_count": 0, "ccjs_count": 0},
        "accounts": [],
        "adverse_public_records": {
            "defaults": [], "ccjs": [],
            "iva": {"present": False, "start_date": None, "completion_date": None, "status": None},
            "bankruptcy": {"present": False, "order_date": None, "discharge_date": None},
            "dmp": {"present": False, "provider": None},
        },
        "credit_searches": [],
        "underwriter_summary": f"Credit report could not be fully parsed. Raw output length: {len(raw)} chars. Please review manually.",
        "_parse_error": True,
        "_raw_text": raw[:2000],
    }
