"""Multi-client store with JSON persistence for the Apex Mortgage Agent dashboard."""
import json
import os
import uuid
from datetime import datetime

CLIENTS_DIR = "memory/client_profiles"
os.makedirs(CLIENTS_DIR, exist_ok=True)

_clients: dict[str, dict] = {}
_analyses: dict[str, dict] = {}

_DOC_TYPES: dict[str, str] = {
    "idd": "Initial Disclosure Document (IDD)",
    "privacy_notice": "Privacy Notice / Terms of Business",
    "esis": "ESIS / Key Facts Illustration (KFI)",
    "aip": "Agreement in Principle (AIP)",
    "suitability_letter": "Suitability Letter (MCOB 4.8)",
}

CASE_STAGES = ["research", "dip", "full_application", "offer", "completion"]
CASE_STAGE_LABELS = {
    "research": "Research / Fact Find",
    "dip": "Decision in Principle",
    "full_application": "Full Application",
    "offer": "Mortgage Offer",
    "completion": "Completion",
}


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
        "case_stage": "research",
        "case_stage_updated_at": now,
        "case_notes": [],
        "gdpr_consent": data.pop("gdpr_consent", False),
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


def _credit_report_path(client_id: str) -> str:
    return os.path.join(CLIENTS_DIR, f"{client_id}_credit_report.json")


def save_credit_report(client_id: str, data: dict) -> None:
    with open(_credit_report_path(client_id), "w") as f:
        json.dump(data, f, indent=2)


def get_credit_report(client_id: str) -> dict | None:
    path = _credit_report_path(client_id)
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None


def _payslip_path(client_id: str) -> str:
    return os.path.join(CLIENTS_DIR, f"{client_id}_payslip.json")


def save_payslip_analysis(client_id: str, data: dict) -> None:
    with open(_payslip_path(client_id), "w") as f:
        json.dump(data, f, indent=2)


def get_payslip_analysis(client_id: str) -> dict | None:
    path = _payslip_path(client_id)
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None


def _doc_path(client_id: str, doc_type: str) -> str:
    return os.path.join(CLIENTS_DIR, f"{client_id}_doc_{doc_type}.html")


def save_document(client_id: str, doc_type: str, html: str) -> None:
    with open(_doc_path(client_id, doc_type), "w", encoding="utf-8") as f:
        f.write(html)


def list_documents(client_id: str) -> list[dict]:
    docs = []
    for doc_type, doc_name in _DOC_TYPES.items():
        path = _doc_path(client_id, doc_type)
        if os.path.exists(path):
            docs.append({
                "doc_type": doc_type,
                "doc_name": doc_name,
                "generated_at": datetime.utcfromtimestamp(os.path.getmtime(path)).isoformat(),
            })
    return docs


def get_document(client_id: str, doc_type: str) -> str | None:
    path = _doc_path(client_id, doc_type)
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return f.read()
    return None


def set_case_stage(client_id: str, stage: str, note: str = "") -> dict:
    if stage not in CASE_STAGES:
        raise ValueError(f"Invalid stage '{stage}'. Must be one of: {', '.join(CASE_STAGES)}")
    now = datetime.utcnow().isoformat()
    client = get_client(client_id)
    if client is None:
        raise KeyError(f"Client {client_id} not found")
    client["case_stage"] = stage
    client["case_stage_updated_at"] = now
    if note:
        if "case_notes" not in client or not isinstance(client["case_notes"], list):
            client["case_notes"] = []
        client["case_notes"].append({
            "timestamp": now,
            "stage": stage,
            "note": note,
        })
    client["updated_at"] = now
    _clients[client_id] = client
    with open(_client_path(client_id), "w") as f:
        json.dump(client, f, indent=2)
    return client


def add_case_note(client_id: str, note: str, stage: str = "") -> dict:
    now = datetime.utcnow().isoformat()
    client = get_client(client_id)
    if client is None:
        raise KeyError(f"Client {client_id} not found")
    if "case_notes" not in client or not isinstance(client["case_notes"], list):
        client["case_notes"] = []
    client["case_notes"].append({
        "timestamp": now,
        "stage": stage or client.get("case_stage", "research"),
        "note": note,
    })
    client["updated_at"] = now
    _clients[client_id] = client
    with open(_client_path(client_id), "w") as f:
        json.dump(client, f, indent=2)
    return client


def get_audit_log(client_id: str) -> list[dict]:
    from memory.audit_log import get_log
    return get_log(client_id)


# Legacy compatibility for orchestrator
def save_profile(session_id: str, data: dict) -> dict:
    try:
        update_client(session_id, data)
    except KeyError:
        pass
    return {"saved": True, "session_id": session_id}


def get_profile(session_id: str) -> dict | None:
    return get_client(session_id)
