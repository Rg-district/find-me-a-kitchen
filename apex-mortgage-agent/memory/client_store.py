"""Multi-client store with JSON persistence for the Apex Mortgage Agent dashboard."""
import json
import os
import uuid
from datetime import datetime

CLIENTS_DIR = "memory/client_profiles"
os.makedirs(CLIENTS_DIR, exist_ok=True)

_clients: dict[str, dict] = {}
_analyses: dict[str, dict] = {}


def _client_path(client_id: str) -> str:
    return os.path.join(CLIENTS_DIR, f"{client_id}.json")


def _analysis_path(client_id: str) -> str:
    return os.path.join(CLIENTS_DIR, f"{client_id}_analysis.json")


def _load_all_clients() -> None:
    """Load all client JSON files from disk into cache."""
    for fname in os.listdir(CLIENTS_DIR):
        if fname.endswith(".json") and not fname.endswith("_analysis.json"):
            client_id = fname[:-5]
            if client_id not in _clients:
                with open(os.path.join(CLIENTS_DIR, fname)) as f:
                    _clients[client_id] = json.load(f)


def create_client(data: dict) -> str:
    client_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    client = {
        "client_id": client_id,
        "created_at": now,
        "updated_at": now,
        "grade": None,
        "score": None,
        "status": "active",
        **data,
    }
    _clients[client_id] = client
    with open(_client_path(client_id), "w") as f:
        json.dump(client, f, indent=2)
    return client_id


def get_client(client_id: str) -> dict | None:
    if client_id in _clients:
        return _clients[client_id]
    path = _client_path(client_id)
    if os.path.exists(path):
        with open(path) as f:
            _clients[client_id] = json.load(f)
        return _clients[client_id]
    return None


def list_clients() -> list[dict]:
    _load_all_clients()
    return sorted(_clients.values(), key=lambda c: c.get("created_at", ""), reverse=True)


def update_client(client_id: str, data: dict) -> dict:
    client = get_client(client_id)
    if client is None:
        raise KeyError(f"Client {client_id} not found")
    client.update(data)
    client["updated_at"] = datetime.utcnow().isoformat()
    _clients[client_id] = client
    with open(_client_path(client_id), "w") as f:
        json.dump(client, f, indent=2)
    return client


def save_analysis(client_id: str, analysis_data: dict) -> None:
    _analyses[client_id] = analysis_data
    with open(_analysis_path(client_id), "w") as f:
        json.dump(analysis_data, f, indent=2)


def get_analysis(client_id: str) -> dict | None:
    if client_id in _analyses:
        return _analyses[client_id]
    path = _analysis_path(client_id)
    if os.path.exists(path):
        with open(path) as f:
            _analyses[client_id] = json.load(f)
        return _analyses[client_id]
    return None


# Legacy compatibility for orchestrator
def save_profile(session_id: str, data: dict) -> dict:
    try:
        update_client(session_id, data)
    except KeyError:
        pass
    return {"saved": True, "session_id": session_id}


def get_profile(session_id: str) -> dict | None:
    return get_client(session_id)
