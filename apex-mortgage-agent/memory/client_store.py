"""In-memory + JSON-backed client profile store."""
import json
import os
from datetime import datetime

PROFILES_DIR = "memory/client_profiles"
os.makedirs(PROFILES_DIR, exist_ok=True)

_cache: dict[str, dict] = {}


def save_profile(session_id: str, data: dict) -> dict:
    _cache.setdefault(session_id, {}).update(data)
    _cache[session_id]["last_updated"] = datetime.utcnow().isoformat()
    path = os.path.join(PROFILES_DIR, f"{session_id}.json")
    with open(path, "w") as f:
        json.dump(_cache[session_id], f, indent=2)
    return {"saved": True, "session_id": session_id}


def get_profile(session_id: str) -> dict | None:
    if session_id in _cache:
        return _cache[session_id]
    path = os.path.join(PROFILES_DIR, f"{session_id}.json")
    if os.path.exists(path):
        with open(path) as f:
            _cache[session_id] = json.load(f)
        return _cache[session_id]
    return None
