"""Product rate cache with 24-hour TTL. In production, refreshes from live APIs."""
import json
import os
from datetime import datetime, timedelta

CACHE_DIR = "memory/product_cache"
os.makedirs(CACHE_DIR, exist_ok=True)
CACHE_TTL_HOURS = 24


def get_cached(key: str) -> dict | None:
    path = os.path.join(CACHE_DIR, f"{key}.json")
    if not os.path.exists(path):
        return None
    with open(path) as f:
        entry = json.load(f)
    cached_at = datetime.fromisoformat(entry["cached_at"])
    if datetime.utcnow() - cached_at > timedelta(hours=CACHE_TTL_HOURS):
        os.remove(path)
        return None
    return entry["data"]


def set_cached(key: str, data: dict) -> None:
    path = os.path.join(CACHE_DIR, f"{key}.json")
    with open(path, "w") as f:
        json.dump({"cached_at": datetime.utcnow().isoformat(), "data": data}, f)
