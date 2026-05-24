"""MAU — Mortgages Are Us — FastAPI entry point (consultant dashboard rebuild)."""
import hashlib
import os
from typing import Optional

from fastapi import FastAPI, HTTPException, Request, Response, UploadFile, File, Form
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.middleware.base import BaseHTTPMiddleware
from dotenv import load_dotenv

load_dotenv()

# ── Auth ───────────────────────────────────────────────────────────────────────

_DASHBOARD_PASSWORD = os.environ.get("DASHBOARD_PASSWORD", "1234567")
_SESSION_SECRET = os.environ.get("SESSION_SECRET", "mau-secret-xK9p2q")
_COOKIE_NAME = "mau_auth"
_AUTH_TOKEN = hashlib.sha256(f"{_DASHBOARD_PASSWORD}:{_SESSION_SECRET}".encode()).hexdigest()

# Paths that are always public (no auth required)
_PUBLIC_PREFIXES = ("/login", "/logout", "/health", "/static/")


class _AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if any(path == p or path.startswith(p) for p in _PUBLIC_PREFIXES):
            return await call_next(request)

        token = request.cookies.get(_COOKIE_NAME)
        if token == _AUTH_TOKEN:
            return await call_next(request)

        # API calls get 401; browser navigation gets redirect to /login
        if path.startswith("/api/"):
            return JSONResponse({"detail": "Unauthorised"}, status_code=401)
        return RedirectResponse(url="/login", status_code=302)

from memory.client_store import (
    create_client,
    get_client,
    list_clients,
    update_client,
    save_analysis,
    get_analysis,
    save_document,
    list_documents,
    get_document,
)
from tools.bank_statement_analyser import analyse_statement
from tools.grading_engine import grade_client
from tools.adverse_lender_matcher import match_lenders
from tools.report_generator import generate_report
from tools.document_generator import (
    generate_document as gen_document,
    extract_reference_text,
    DOC_TYPES as DOCUMENT_TYPES,
)
from orchestrator import Orchestrator

app = FastAPI(title="MAU — Mortgages Are Us — Consultant Dashboard", version="2.0.0")
app.add_middleware(_AuthMiddleware)
orchestrator = Orchestrator()


# ── Login / logout ────────────────────────────────────────────────────────────

@app.get("/login")
async def login_page():
    return FileResponse("static/login.html")


@app.post("/login")
async def login_submit(request: Request):
    form = await request.form()
    password = form.get("password", "")
    if password == _DASHBOARD_PASSWORD:
        response = RedirectResponse(url="/", status_code=302)
        response.set_cookie(
            _COOKIE_NAME,
            _AUTH_TOKEN,
            httponly=True,
            samesite="lax",
            max_age=7 * 24 * 3600,
        )
        return response
    return RedirectResponse(url="/login?error=1", status_code=302)


@app.get("/logout")
async def logout():
    response = RedirectResponse(url="/login", status_code=302)
    response.delete_cookie(_COOKIE_NAME)
    return response


# ── Pydantic models ───────────────────────────────────────────────────────────

class AdverseHistory(BaseModel):
    ccj: bool = False
    default: bool = False
    iva: bool = False
    bankruptcy: bool = False
    dmp: bool = False
    payday_loans: bool = False
    months_since_most_recent: Optional[int] = None


class CreateClientRequest(BaseModel):
    name: str
    date_of_birth: Optional[str] = None          # ISO date: YYYY-MM-DD
    phone: Optional[str] = None
    email: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    postcode: Optional[str] = None
    mortgage_purpose: str  # purchase | remortgage | btl
    loan_amount: float
    property_value: float
    declared_income: float  # monthly in £
    employment_type: str    # employed | self_employed | contractor | retired
    adverse_history: AdverseHistory = AdverseHistory()


class UpdateClientRequest(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    postcode: Optional[str] = None
    mortgage_purpose: Optional[str] = None
    loan_amount: Optional[float] = None
    property_value: Optional[float] = None
    declared_income: Optional[float] = None
    employment_type: Optional[str] = None
    adverse_history: Optional[AdverseHistory] = None


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    session_id: str
    messages: list[ChatMessage]
    client_id: Optional[str] = None


class ChatResponse(BaseModel):
    session_id: str
    message: str
    stage: Optional[str] = None


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "apex-mortgage-agent", "version": "2.0.0"}


# ── Client endpoints ──────────────────────────────────────────────────────────

@app.get("/api/clients")
async def list_all_clients():
    """Return all clients with basic profile data."""
    clients = list_clients()
    return {"clients": clients, "total": len(clients)}


@app.post("/api/clients", status_code=201)
async def create_new_client(req: CreateClientRequest):
    """Create a new client record."""
    data = {
        "name": req.name,
        "date_of_birth": req.date_of_birth,
        "phone": req.phone,
        "email": req.email,
        "address_line1": req.address_line1,
        "address_line2": req.address_line2,
        "city": req.city,
        "postcode": req.postcode,
        "mortgage_purpose": req.mortgage_purpose,
        "loan_amount": req.loan_amount,
        "property_value": req.property_value,
        "declared_income": req.declared_income,
        "employment_type": req.employment_type,
        "adverse_history": req.adverse_history.model_dump(),
    }
    client_id = create_client(data)
    client = get_client(client_id)
    return {"client_id": client_id, "client": client}


@app.get("/api/clients/{client_id}")
async def get_client_detail(client_id: str):
    """Return full client detail including analysis results and grade."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    analysis = get_analysis(client_id)
    return {
        "client": client,
        "analysis": analysis,
        "has_analysis": analysis is not None,
    }


@app.patch("/api/clients/{client_id}")
async def update_client_detail(client_id: str, req: UpdateClientRequest):
    """Update client fields."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    updates = req.model_dump(exclude_none=True)
    if "adverse_history" in updates and isinstance(updates["adverse_history"], dict):
        pass  # already a dict via model_dump

    updated = update_client(client_id, updates)
    return {"client": updated}


@app.post("/api/clients/{client_id}/upload-statement")
async def upload_statement(client_id: str, file: UploadFile = File(...)):
    """
    Upload a bank statement PDF or image. Triggers AI analysis and grading.
    Returns the full analysis result including grade.
    """
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Validate file type
    allowed_types = {
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
    }
    content_type = file.content_type or "application/octet-stream"
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}. Please upload a PDF or image.",
        )

    # Read file bytes
    try:
        file_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read file: {exc}")

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    declared_income = float(client.get("declared_income", 0))

    # Run analysis (synchronous call — bank statement analyser uses sync client)
    try:
        analysis = analyse_statement(
            file_bytes=file_bytes,
            file_type=content_type,
            declared_monthly_income=declared_income,
            client_id=client_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")

    # Grade the client
    try:
        grade_result = grade_client(analysis)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Grading failed: {exc}")

    # Combine and persist
    combined = {
        "analysis": analysis,
        "grade_result": grade_result,
        "statement_filename": file.filename,
    }
    save_analysis(client_id, combined)

    # Update client record with grade
    update_client(client_id, {
        "grade": grade_result["grade"],
        "score": grade_result["score"],
        "grade_label": grade_result.get("grade_label"),
    })

    return {
        "success": True,
        "client_id": client_id,
        "grade": grade_result["grade"],
        "score": grade_result["score"],
        "grade_label": grade_result.get("grade_label"),
        "summary": grade_result.get("summary"),
        "analysis": analysis,
        "grade_result": grade_result,
    }


@app.post("/api/clients/{client_id}/generate-report")
async def generate_client_report(client_id: str):
    """Generate and return an HTML report for the client."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    stored = get_analysis(client_id)
    if not stored:
        raise HTTPException(
            status_code=400,
            detail="No bank statement analysis found. Please upload and analyse a statement first.",
        )

    analysis = stored.get("analysis", {})
    grade_result = stored.get("grade_result", {})

    # Get lender matches
    adverse = client.get("adverse_history", {})
    ltv = 0.0
    if client.get("loan_amount") and client.get("property_value"):
        try:
            ltv = (float(client["loan_amount"]) / float(client["property_value"])) * 100
        except (TypeError, ZeroDivisionError):
            ltv = 75.0

    matched_lenders = match_lenders(
        grade=grade_result.get("grade", "F"),
        ccjs=bool(adverse.get("ccj")),
        defaults=bool(adverse.get("default")),
        bankruptcy=bool(adverse.get("bankruptcy")),
        months_since_adverse=int(adverse.get("months_since_most_recent") or 0),
        ltv=ltv,
        employment_type=client.get("employment_type", "employed"),
    )

    try:
        html = generate_report(
            client=client,
            analysis=analysis,
            grade_result=grade_result,
            matched_lenders=matched_lenders,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {exc}")

    return HTMLResponse(content=html, media_type="text/html")


@app.get("/api/clients/{client_id}/match-lenders")
async def get_matched_lenders(client_id: str):
    """Return matched lenders for a client based on their grade and adverse history."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    grade = client.get("grade", "F")
    adverse = client.get("adverse_history", {})

    ltv = 75.0
    if client.get("loan_amount") and client.get("property_value"):
        try:
            ltv = (float(client["loan_amount"]) / float(client["property_value"])) * 100
        except (TypeError, ZeroDivisionError):
            pass

    matched = match_lenders(
        grade=grade,
        ccjs=bool(adverse.get("ccj")),
        defaults=bool(adverse.get("default")),
        bankruptcy=bool(adverse.get("bankruptcy")),
        months_since_adverse=int(adverse.get("months_since_most_recent") or 0),
        ltv=ltv,
        employment_type=client.get("employment_type", "employed"),
    )

    return {"client_id": client_id, "grade": grade, "lenders": matched, "count": len(matched)}


# ── AI Assistant ──────────────────────────────────────────────────────────────

@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """AI assistant endpoint for consultant queries."""
    if not req.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    try:
        # If a client_id is provided, inject client context into the session
        session_id = req.session_id
        if req.client_id:
            session_id = f"{req.client_id}_{req.session_id}"

        text, stage = await orchestrator.process(
            session_id,
            [{"role": m.role, "content": m.content} for m in req.messages],
            client_id=req.client_id,
        )
        return ChatResponse(session_id=req.session_id, message=text, stage=stage)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Document generation ───────────────────────────────────────────────────────

_ALLOWED_REF_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "text/plain",
}


@app.post("/api/clients/{client_id}/documents/generate")
async def generate_client_document(
    client_id: str,
    doc_type: str = Form(...),
    reference_file: Optional[UploadFile] = File(None),
):
    """Generate a UK mortgage document (IDD, Privacy Notice, ESIS/KFI, AIP)."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if doc_type not in DOCUMENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown doc_type '{doc_type}'. Must be one of: {', '.join(DOCUMENT_TYPES)}",
        )

    # Extract reference text from optional uploaded template
    reference_text = None
    if reference_file and reference_file.filename:
        ct = reference_file.content_type or "application/octet-stream"
        if ct in _ALLOWED_REF_TYPES:
            try:
                ref_bytes = await reference_file.read()
                if ref_bytes:
                    reference_text = extract_reference_text(ref_bytes, ct)
            except Exception:
                pass  # Non-fatal — proceed without reference

    stored = get_analysis(client_id)
    analysis = stored.get("analysis") if stored else None

    try:
        html = gen_document(
            doc_type=doc_type,
            client=client,
            analysis=analysis,
            reference_text=reference_text,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Document generation failed: {exc}")

    save_document(client_id, doc_type, html)
    return HTMLResponse(content=html, media_type="text/html")


@app.get("/api/clients/{client_id}/documents")
async def list_client_documents(client_id: str):
    """List all generated documents for a client."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    docs = list_documents(client_id)
    return {"client_id": client_id, "documents": docs}


@app.get("/api/clients/{client_id}/documents/{doc_type}")
async def get_client_document(client_id: str, doc_type: str):
    """Retrieve a previously generated document as HTML."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    html = get_document(client_id, doc_type)
    if not html:
        raise HTTPException(status_code=404, detail="Document not found. Generate it first.")
    return HTMLResponse(content=html, media_type="text/html")


# ── Static files ──────────────────────────────────────────────────────────────

if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return FileResponse("static/index.html")
