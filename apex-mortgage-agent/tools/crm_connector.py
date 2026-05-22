"""
CRM connector — stub for Salesforce, HubSpot, Acre, or Smartr365 integration.
Currently writes to local JSON store; replace with CRM API calls in production.
"""
import json
import os
from datetime import datetime


CRM_DIR = "memory/client_profiles"
os.makedirs(CRM_DIR, exist_ok=True)


def upsert_contact(session_id: str, data: dict) -> dict:
    path = os.path.join(CRM_DIR, f"{session_id}.json")
    existing = {}
    if os.path.exists(path):
        with open(path) as f:
            existing = json.load(f)
    existing.update(data)
    existing["last_updated"] = datetime.utcnow().isoformat()
    with open(path, "w") as f:
        json.dump(existing, f, indent=2)
    return {"status": "saved", "session_id": session_id, "fields_updated": list(data.keys())}


def get_contact(session_id: str) -> dict | None:
    path = os.path.join(CRM_DIR, f"{session_id}.json")
    if not os.path.exists(path):
        return None
    with open(path) as f:
        return json.load(f)


def update_stage(session_id: str, stage: str, notes: str = "") -> dict:
    return upsert_contact(session_id, {
        "pipeline_stage": stage,
        "stage_notes": notes,
        "stage_updated_at": datetime.utcnow().isoformat(),
    })


def flag_for_adviser(session_id: str, reason: str, urgency: str, summary: str) -> dict:
    return upsert_contact(session_id, {
        "adviser_handoff_requested": True,
        "handoff_reason": reason,
        "handoff_urgency": urgency,
        "handoff_summary": summary,
        "handoff_requested_at": datetime.utcnow().isoformat(),
    })
