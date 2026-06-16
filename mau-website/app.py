"""MAU Website — Customer-facing demo for Mortgages Are Us."""
import json
import os
import uuid
from datetime import datetime

import anthropic
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI(title="Mortgages Are Us")
templates = Jinja2Templates(directory="templates")
templates.env.cache = None  # disable LRU cache — avoids unhashable globals key on Python 3.14
app.mount("/static", StaticFiles(directory="static"), name="static")


def _ctx(request: Request, **kwargs) -> dict:
    return {"request": request, "now": datetime.utcnow, **kwargs}

# ── Config ─────────────────────────────────────────────────────────────────────
MAU_AGENT_URL = os.getenv("MAU_AGENT_URL", "https://apex-mortgage-agent.onrender.com")
WEBSITE_API_KEY = os.getenv("WEBSITE_API_KEY", "")
_ANT_KEY = os.getenv("ANTHROPIC_API_KEY", "")
_client = anthropic.Anthropic(api_key=_ANT_KEY) if _ANT_KEY else None

LEADS_FILE = "data/leads.json"
os.makedirs("data", exist_ok=True)


def _load_leads() -> dict:
    if os.path.exists(LEADS_FILE):
        with open(LEADS_FILE) as f:
            return json.load(f)
    return {}


def _save_leads(leads: dict) -> None:
    with open(LEADS_FILE, "w") as f:
        json.dump(leads, f, indent=2)


# ── Pages ──────────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", _ctx(request))

@app.get("/adverse-credit", response_class=HTMLResponse)
async def adverse_credit(request: Request):
    return templates.TemplateResponse("adverse-credit.html", _ctx(request))

@app.get("/get-started", response_class=HTMLResponse)
async def get_started(request: Request):
    return templates.TemplateResponse("get-started.html", _ctx(request))

@app.get("/chat", response_class=HTMLResponse)
async def chat_page(request: Request):
    return templates.TemplateResponse("chat.html", _ctx(request))

@app.get("/track", response_class=HTMLResponse)
async def track_page(request: Request):
    return templates.TemplateResponse("track.html", _ctx(request))

@app.get("/health")
async def health():
    return {"status": "ok"}


# ── API: Lead submission ────────────────────────────────────────────────────────

@app.post("/api/enquiry")
async def submit_enquiry(request: Request):
    data = await request.json()
    if not data.get("name") or not data.get("email"):
        raise HTTPException(status_code=422, detail="Name and email are required")

    ref_id = str(uuid.uuid4())
    ref_short = ref_id[:8].upper()

    lead = {
        "id": ref_id,
        "ref": ref_short,
        "created_at": datetime.utcnow().isoformat(),
        "stage": "research",
        "stage_label": "Research — Initial Review",
        **data,
    }

    leads = _load_leads()
    leads[ref_short] = lead
    _save_leads(leads)

    # Forward to MAU broker agent (non-blocking — ignore failures)
    if WEBSITE_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=6.0) as hx:
                await hx.post(
                    f"{MAU_AGENT_URL}/api/public/lead",
                    json=data,
                    headers={"X-Website-Key": WEBSITE_API_KEY},
                )
        except Exception:
            pass

    return {"success": True, "reference": ref_short, "name": data.get("name", "").split()[0]}


# ── API: Case tracker ──────────────────────────────────────────────────────────

@app.get("/api/track/{reference}")
async def track_case(reference: str):
    ref = reference.strip().upper()
    leads = _load_leads()

    if ref in leads:
        lead = leads[ref]
        return {
            "found": True,
            "name": lead.get("name", ""),
            "stage": lead.get("stage", "research"),
            "stage_label": lead.get("stage_label", "Research — Initial Review"),
            "created_at": lead.get("created_at", ""),
            "purpose": lead.get("purpose", ""),
        }

    # Attempt lookup on MAU agent
    if WEBSITE_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=5.0) as hx:
                resp = await hx.get(
                    f"{MAU_AGENT_URL}/api/public/track/{reference}",
                    headers={"X-Website-Key": WEBSITE_API_KEY},
                )
                if resp.status_code == 200:
                    return resp.json()
        except Exception:
            pass

    return {"found": False}


# ── API: Customer chat (streaming SSE) ────────────────────────────────────────

_CHAT_SYSTEM = """You are the MAU Adviser — a friendly, knowledgeable UK mortgage specialist for Mortgages Are Us, a specialist adverse credit broker based in Essex.

Your purpose is to help website visitors understand their mortgage options, especially those with credit challenges. Be warm, empathetic and reassuring — many people feel embarrassed about their credit history and need to feel safe asking questions.

Key facts:
- You specialise in adverse credit: CCJs, defaults, IVAs, bankruptcy, missed payments, debt management plans
- Specialist lender access: Precise Mortgages, Kensington, Aldermore, Together Money, Pepper Money, Norton Home Loans, MBS Lending, Bluestone, Vida Homeloans
- FCA regulated — always trustworthy and compliant
- Services: residential mortgages, remortgages, buy-to-let, commercial finance, bridging finance
- Based in Essex, serving clients across the UK
- Phone: 0203 411 1009 | Email: info@mortgagesareus.co.uk

Rules:
- Never give specific rate quotes (rates change constantly)
- Always use UK English and UK mortgage terminology (e.g. "deposit" not "down payment")
- Keep answers concise — this is a chat, not a report
- When someone is ready to proceed, direct them to the Free Assessment form or to call
- Do not ask for sensitive financial data in chat — direct to the secure form
- Be positive and solution-focused: most adverse credit situations CAN be resolved"""


@app.post("/api/chat")
async def chat_api(request: Request):
    if not _client:
        return JSONResponse(
            {"error": "Chat is not available right now. Please call 0203 411 1009."},
            status_code=503,
        )

    data = await request.json()
    messages = data.get("messages", [])
    if not messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    async def stream():
        try:
            with _client.messages.stream(
                model="claude-haiku-4-5-20251001",
                max_tokens=500,
                system=_CHAT_SYSTEM,
                messages=messages[-20:],
            ) as s:
                for text in s.text_stream:
                    yield f"data: {json.dumps({'text': text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': 'Something went wrong. Please try again.'})}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
