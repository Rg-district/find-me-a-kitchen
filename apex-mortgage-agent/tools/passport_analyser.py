"""UK mortgage broker — passport document analyser using Claude multimodal."""
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


PASSPORT_PROMPT = """You are a UK mortgage broker reviewing a passport document for AML/KYC identity verification purposes.

Extract ALL information visible and return ONLY a JSON object with this exact structure. Do not include any text outside the JSON.

{
  "document_type": "<passport | driving_licence | national_id_card | biometric_residence_permit | unknown>",
  "issuing_country": "<country name, e.g. United Kingdom>",
  "issuing_country_code": "<ISO 3166-1 alpha-3 code, e.g. GBR>",
  "surname": "<surname / family name as on document>",
  "given_names": "<given names / forenames as on document>",
  "full_name": "<full name as displayed>",
  "date_of_birth": "<YYYY-MM-DD or null>",
  "nationality": "<nationality as printed, e.g. British Citizen>",
  "gender": "<M | F | X | null>",
  "document_number": "<passport/document number or null>",
  "issue_date": "<YYYY-MM-DD or null>",
  "expiry_date": "<YYYY-MM-DD or null>",
  "place_of_birth": "<as printed or null>",
  "mrz_line_1": "<first MRZ line verbatim or null>",
  "mrz_line_2": "<second MRZ line verbatim or null>",
  "is_expired": <true | false — based on expiry_date vs today (2026-06-29)>,
  "expires_within_6_months": <true | false — expiry before 2026-12-29>,
  "verification_flags": [
    "<list any concerns: damage, tampering signs, poor image quality, expiry, name mismatch risk>"
  ],
  "aml_notes": "<1-2 sentences: document validity assessment, any AML/KYC concerns, suitability for mortgage ID verification>"
}

EXTRACTION RULES:
- Extract exactly what is printed — do not correct or infer
- If the document is a driving licence or national ID card, still extract all available fields
- MRZ lines are the machine-readable zone at the bottom of the bio-data page — extract verbatim
- is_expired and expires_within_6_months must be computed against today's date: 2026-06-29
- Use null for any field you cannot determine — never guess
- verification_flags should be empty array [] if no concerns"""


def analyse_passport(
    file_bytes: bytes,
    file_type: str,
    client_id: str,
) -> dict:
    """Analyse a passport or ID document using Claude multimodal."""
    ai_client = _get_client()

    encoded = base64.standard_b64encode(file_bytes).decode("utf-8")
    media_type_map = {
        "application/pdf": "application/pdf",
        "image/jpeg": "image/jpeg",
        "image/jpg": "image/jpeg",
        "image/png": "image/png",
        "image/webp": "image/webp",
    }
    media_type = media_type_map.get(file_type.lower(), "image/jpeg")

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

    response = ai_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": PASSPORT_PROMPT, "cache_control": {"type": "ephemeral"}},
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


def _fallback(raw_text: str) -> dict:
    return {
        "document_type": "unknown",
        "issuing_country": None,
        "issuing_country_code": None,
        "surname": None,
        "given_names": None,
        "full_name": None,
        "date_of_birth": None,
        "nationality": None,
        "gender": None,
        "document_number": None,
        "issue_date": None,
        "expiry_date": None,
        "place_of_birth": None,
        "mrz_line_1": None,
        "mrz_line_2": None,
        "is_expired": None,
        "expires_within_6_months": None,
        "verification_flags": ["Could not parse AI response — manual review required"],
        "aml_notes": "Analysis failed — document should be reviewed manually.",
        "_raw": raw_text[:500],
    }
