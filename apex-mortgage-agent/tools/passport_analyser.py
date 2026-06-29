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


PASSPORT_PROMPT = """You are a UK mortgage broker reviewing a passport or photo ID document for AML/KYC identity verification purposes.

Extract ALL information visible and return ONLY a JSON object with this exact structure. Do not include any text outside the JSON.

{
  "document_type": "<passport | driving_licence | national_id_card | biometric_residence_permit | unknown>",
  "issuing_country": "<country name, e.g. United Kingdom>",
  "issuing_country_code": "<ISO 3166-1 alpha-3 code, e.g. GBR>",
  "is_uk_document": <true | false — is issuing_country_code GBR?>,
  "surname": "<surname / family name EXACTLY as printed on document>",
  "given_names": "<given names / forenames EXACTLY as printed>",
  "full_name": "<full name as it appears on the document>",
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

  "document_quality": {
    "is_legible": <true | false — are ALL data fields clearly readable with no obscured, blurred, or cropped text?>,
    "legibility_score": <1-10 — 10 = perfect clarity, 1 = completely unreadable>,
    "legibility_issues": ["<list specific issues: blurring, glare, cropping, shadows, damage, etc. — empty array if none>"],
    "signature_present": <true | false — is the holder's handwritten signature visible on the document?>,
    "signature_legible": <true | false — if present, is the signature clearly identifiable as a signature (not just a line)?>,
    "photo_present": <true | false — is the holder's photo visible?>,
    "photo_quality": "<good | acceptable | poor | missing>",
    "security_features_visible": <true | false — are holograms, watermarks or security features visible?>,
    "signs_of_tampering": <true | false — any visual signs of alteration, laminate lifting, inconsistent fonts, etc.?>,
    "overall_quality": "<pass | conditional_pass | fail — pass = suitable for UK mortgage AML purposes>"
  },

  "verification_flags": [
    "<list ANY concerns: document damage, tampering, expiry, missing signature, poor legibility, non-UK document>"
  ],
  "aml_notes": "<2-3 sentences: document validity assessment, quality concerns, signature status, and overall suitability for UK mortgage AML/KYC identity verification>"
}

CRITICAL EXTRACTION RULES:
- Extract name fields EXACTLY as printed — preserve spacing, hyphens, apostrophes
- is_uk_document = true ONLY if the document was issued by the United Kingdom (GBR), Channel Islands, or Isle of Man
- signature_present: inspect the signature panel — return false if you cannot clearly see a handwritten signature; do not assume it is present
- legibility_score below 6 means the document should be resubmitted
- is_legible = false if ANY data field is unreadable (name, DOB, expiry, document number)
- signs_of_tampering: err on the side of caution — flag anything anomalous
- Use null for any field you genuinely cannot determine — never guess
- verification_flags must include every issue found — empty array only if there are ZERO concerns"""


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
        max_tokens=2048,
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


def cross_check_passport(
    passport_data: dict,
    client: dict,
    payslip_data: Optional[dict] = None,
    credit_data: Optional[dict] = None,
) -> dict:
    """
    Cross-check passport data against the client record, payslip, and credit report.
    Returns a structured result with pass/fail/warning status per check.
    """
    checks = []

    passport_name = (passport_data.get("full_name") or "").strip()
    passport_dob = (passport_data.get("date_of_birth") or "").strip()
    quality = passport_data.get("document_quality") or {}

    # ── 1. UK document check ─────────────────────────────────────────────────
    is_uk = passport_data.get("is_uk_document")
    country = passport_data.get("issuing_country") or "Unknown"
    checks.append({
        "check": "UK Document",
        "status": "pass" if is_uk else "fail",
        "detail": f"Issued by: {country}" if is_uk else f"Document issued by {country} — UK mortgage lenders require UK-issued photo ID (passport, driving licence, or BRP). Non-UK passports may not be accepted by all lenders.",
        "source": "document",
    })

    # ── 2. Legibility check ───────────────────────────────────────────────────
    is_legible = quality.get("is_legible")
    leg_score = quality.get("legibility_score")
    leg_issues = quality.get("legibility_issues") or []
    if is_legible is None:
        leg_status = "warning"
        leg_detail = "Legibility could not be assessed — manual review required."
    elif is_legible and (leg_score is None or leg_score >= 7):
        leg_status = "pass"
        leg_detail = f"Document is clearly legible (score {leg_score}/10)." if leg_score else "Document is clearly legible."
    elif is_legible and leg_score and leg_score >= 5:
        leg_status = "warning"
        leg_detail = f"Legibility score {leg_score}/10 — marginally acceptable. {'; '.join(leg_issues) if leg_issues else 'Recommend resubmission with better image quality.'}"
    else:
        leg_status = "fail"
        leg_detail = f"Document is not sufficiently legible (score {leg_score}/10). Issues: {'; '.join(leg_issues) if leg_issues else 'Blurred or unreadable data fields detected.'}. Please resubmit a clearer image."
    checks.append({"check": "Legibility", "status": leg_status, "detail": leg_detail, "source": "document"})

    # ── 3. Signature check ────────────────────────────────────────────────────
    sig_present = quality.get("signature_present")
    sig_legible = quality.get("signature_legible")
    if sig_present is True and sig_legible is not False:
        sig_status = "pass"
        sig_detail = "Holder's signature is present and legible."
    elif sig_present is True and sig_legible is False:
        sig_status = "warning"
        sig_detail = "Signature panel visible but signature is difficult to identify — check original document."
    elif sig_present is False:
        sig_status = "fail"
        sig_detail = "No holder signature detected. FCA AML guidance requires a signed document for mortgage identity verification. Please upload the bio-data page showing the signature panel, or obtain a separately signed document."
    else:
        sig_status = "warning"
        sig_detail = "Signature presence could not be confirmed — ensure the uploaded image shows the signature panel."
    checks.append({"check": "Signature Present", "status": sig_status, "detail": sig_detail, "source": "document"})

    # ── 4. Expiry check ───────────────────────────────────────────────────────
    is_expired = passport_data.get("is_expired")
    expires_soon = passport_data.get("expires_within_6_months")
    expiry_date = passport_data.get("expiry_date")
    if is_expired:
        checks.append({"check": "Expiry", "status": "fail", "detail": f"Document expired on {expiry_date}. Expired documents are not accepted for mortgage AML/KYC purposes.", "source": "document"})
    elif expires_soon:
        checks.append({"check": "Expiry", "status": "warning", "detail": f"Document expires on {expiry_date} (within 6 months). Some lenders may query ID that expires before the mortgage completes.", "source": "document"})
    else:
        checks.append({"check": "Expiry", "status": "pass", "detail": f"Document valid — expires {expiry_date}.", "source": "document"})

    # ── 5. Tampering check ────────────────────────────────────────────────────
    tampered = quality.get("signs_of_tampering")
    if tampered is True:
        checks.append({"check": "Document Integrity", "status": "fail", "detail": "Signs of possible tampering or alteration detected. Do NOT proceed — flag for senior compliance review and report to MLRO if appropriate.", "source": "document"})
    elif tampered is False:
        checks.append({"check": "Document Integrity", "status": "pass", "detail": "No signs of tampering or alteration detected.", "source": "document"})
    else:
        checks.append({"check": "Document Integrity", "status": "warning", "detail": "Could not assess document integrity — manual review recommended.", "source": "document"})

    # ── 6. Name vs client record ──────────────────────────────────────────────
    client_name = (client.get("name") or "").strip()
    if client_name and passport_name:
        match, confidence = _name_match(passport_name, client_name)
        if match == "exact":
            checks.append({"check": "Name — Client Record", "status": "pass", "detail": f"Name matches exactly: '{passport_name}' = '{client_name}'.", "source": "client_record"})
        elif match == "partial":
            checks.append({"check": "Name — Client Record", "status": "warning", "detail": f"Name partially matches (confidence {confidence}%): passport '{passport_name}' vs client record '{client_name}'. Confirm with client — could be nickname, middle name inclusion/omission, or hyphenation difference.", "source": "client_record"})
        else:
            checks.append({"check": "Name — Client Record", "status": "fail", "detail": f"Name mismatch: passport '{passport_name}' vs client record '{client_name}'. Could be an error in the client record, a married/maiden name difference, or a different person. Investigate before proceeding.", "source": "client_record"})
    elif passport_name:
        checks.append({"check": "Name — Client Record", "status": "warning", "detail": "Client record has no name on file — cannot cross-check. Update the client record.", "source": "client_record"})

    # ── 7. DOB vs client record ───────────────────────────────────────────────
    client_dob = (client.get("date_of_birth") or "").strip()
    if client_dob and passport_dob:
        if passport_dob == client_dob:
            checks.append({"check": "Date of Birth — Client Record", "status": "pass", "detail": f"Date of birth matches: {passport_dob}.", "source": "client_record"})
        else:
            checks.append({"check": "Date of Birth — Client Record", "status": "fail", "detail": f"DOB mismatch: passport shows {passport_dob}, client record shows {client_dob}. This must be resolved before submission — possible data entry error or wrong client record.", "source": "client_record"})
    elif passport_dob:
        checks.append({"check": "Date of Birth — Client Record", "status": "warning", "detail": "No date of birth in client record — cannot verify. Add client DOB to the fact find.", "source": "client_record"})

    # ── 8. Name vs payslip ───────────────────────────────────────────────────
    if payslip_data:
        ps_analysis = payslip_data.get("analysis") or payslip_data
        employer = ps_analysis.get("employer") or {}
        ps_name = (employer.get("employee_name") or "").strip()
        if ps_name and passport_name:
            match, confidence = _name_match(passport_name, ps_name)
            if match == "exact":
                checks.append({"check": "Name — Payslip", "status": "pass", "detail": f"Name matches payslip: '{passport_name}' = '{ps_name}'.", "source": "payslip"})
            elif match == "partial":
                checks.append({"check": "Name — Payslip", "status": "warning", "detail": f"Name partially matches payslip ({confidence}%): passport '{passport_name}' vs payslip '{ps_name}'.", "source": "payslip"})
            else:
                checks.append({"check": "Name — Payslip", "status": "fail", "detail": f"Name mismatch with payslip: passport '{passport_name}' vs payslip '{ps_name}'. Investigate — possible maiden/married name difference or wrong document.", "source": "payslip"})
        elif passport_name and not ps_name:
            checks.append({"check": "Name — Payslip", "status": "warning", "detail": "Employee name not found on payslip — cross-check not possible.", "source": "payslip"})

    # ── 9. Name vs credit report ──────────────────────────────────────────────
    if credit_data:
        cr = credit_data.get("credit_data") or credit_data
        cr_personal = cr.get("personal_details") or {}
        cr_name = (cr_personal.get("name_on_report") or cr_personal.get("name") or "").strip()
        cr_dob = (cr_personal.get("date_of_birth") or "").strip()

        if cr_name and passport_name:
            match, confidence = _name_match(passport_name, cr_name)
            if match == "exact":
                checks.append({"check": "Name — Credit Report", "status": "pass", "detail": f"Name matches credit report: '{passport_name}' = '{cr_name}'.", "source": "credit_report"})
            elif match == "partial":
                checks.append({"check": "Name — Credit Report", "status": "warning", "detail": f"Name partially matches credit report ({confidence}%): passport '{passport_name}' vs report '{cr_name}'.", "source": "credit_report"})
            else:
                checks.append({"check": "Name — Credit Report", "status": "fail", "detail": f"Name mismatch with credit report: passport '{passport_name}' vs report '{cr_name}'. May indicate name change or alias — check financial associations section.", "source": "credit_report"})
        elif passport_name and not cr_name:
            checks.append({"check": "Name — Credit Report", "status": "warning", "detail": "Name not found in credit report — cross-check not possible.", "source": "credit_report"})

        if cr_dob and passport_dob:
            if passport_dob == cr_dob:
                checks.append({"check": "Date of Birth — Credit Report", "status": "pass", "detail": f"Date of birth matches credit report: {passport_dob}.", "source": "credit_report"})
            else:
                checks.append({"check": "Date of Birth — Credit Report", "status": "fail", "detail": f"DOB mismatch with credit report: passport {passport_dob} vs report {cr_dob}. Investigate — possible data entry error or mixed credit files.", "source": "credit_report"})
        elif passport_dob and not cr_dob:
            checks.append({"check": "Date of Birth — Credit Report", "status": "warning", "detail": "DOB not found in credit report — cannot verify.", "source": "credit_report"})

    # ── Summary ───────────────────────────────────────────────────────────────
    fail_count = sum(1 for c in checks if c["status"] == "fail")
    warn_count = sum(1 for c in checks if c["status"] == "warning")
    pass_count = sum(1 for c in checks if c["status"] == "pass")

    if fail_count > 0:
        overall = "fail"
        overall_text = f"{fail_count} check(s) failed — document cannot be accepted without resolution."
    elif warn_count > 0:
        overall = "warning"
        overall_text = f"All critical checks passed with {warn_count} item(s) requiring attention."
    else:
        overall = "pass"
        overall_text = f"All {pass_count} checks passed — document is acceptable for UK mortgage AML/KYC purposes."

    return {
        "overall": overall,
        "overall_text": overall_text,
        "pass_count": pass_count,
        "warn_count": warn_count,
        "fail_count": fail_count,
        "checks": checks,
    }


def _name_match(name_a: str, name_b: str) -> tuple[str, int]:
    """
    Compare two name strings. Returns (match_level, confidence_pct).
    match_level: 'exact' | 'partial' | 'no_match'
    """
    def normalise(n: str) -> set[str]:
        n = n.upper()
        n = re.sub(r"[^A-Z\s]", " ", n)
        return set(n.split())

    a_words = normalise(name_a)
    b_words = normalise(name_b)

    if not a_words or not b_words:
        return ("no_match", 0)

    # Exact match ignoring case/punctuation
    if a_words == b_words:
        return ("exact", 100)

    # Subset match (one name is a subset of the other — common with middle names)
    overlap = a_words & b_words
    if not overlap:
        return ("no_match", 0)

    # Require surname to match (last word in each set heuristic is unreliable;
    # check that the largest word in each overlaps instead)
    longer = max(len(a_words), len(b_words))
    confidence = round(len(overlap) / longer * 100)

    # At least surname (longest word in passport name) must be in the overlap
    longest_a = max(a_words, key=len)
    if longest_a not in b_words:
        # Surname not found in other name — probably a mismatch
        return ("no_match", confidence)

    if confidence >= 75:
        return ("partial", confidence)
    return ("no_match", confidence)


def _fallback(raw_text: str) -> dict:
    return {
        "document_type": "unknown",
        "issuing_country": None,
        "issuing_country_code": None,
        "is_uk_document": None,
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
        "document_quality": {
            "is_legible": False,
            "legibility_score": None,
            "legibility_issues": ["Could not parse AI response — document may not be recognised"],
            "signature_present": None,
            "signature_legible": None,
            "photo_present": None,
            "photo_quality": "unknown",
            "security_features_visible": None,
            "signs_of_tampering": None,
            "overall_quality": "fail",
        },
        "verification_flags": ["Analysis failed — manual review required"],
        "aml_notes": "Analysis failed — document should be reviewed manually by a qualified MLCO.",
        "_raw": raw_text[:500],
    }
