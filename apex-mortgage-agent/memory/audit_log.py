"""
FCA-required audit log.
Logs every significant client interaction with timestamp.
Retention: 5 years post-completion (MCOB requirement).
"""
import json
import os
from datetime import datetime

LOGS_DIR = "memory/audit_logs"
os.makedirs(LOGS_DIR, exist_ok=True)


def log_event(session_id: str, event_type: str, data: dict | None = None) -> dict:
    entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "session_id": session_id,
        "event_type": event_type,
        "data": data or {},
    }
    path = os.path.join(LOGS_DIR, f"{session_id}.jsonl")
    with open(path, "a") as f:
        f.write(json.dumps(entry) + "\n")
    return {"logged": True, "event_type": event_type, "timestamp": entry["timestamp"]}


def get_log(session_id: str) -> list[dict]:
    path = os.path.join(LOGS_DIR, f"{session_id}.jsonl")
    if not os.path.exists(path):
        return []
    with open(path) as f:
        return [json.loads(line) for line in f if line.strip()]
