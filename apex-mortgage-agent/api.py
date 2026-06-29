"""MAU — Mortgages Are Us — FastAPI entry point (consultant dashboard rebuild)."""
import hashlib
import os
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Request, Response, UploadFile, File, Form
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from starlette.middleware.base import BaseHTTPMiddleware
from dotenv import load_dotenv

load_dotenv()

# ── Auth ───────────────────────────────────────────────────────────────────────

_DASHBOARD_PASSWORD = os.environ.get("DASHBOARD_PASSWORD", "1234567")
_SESSION_SECRET = os.environ.get("SESSION_SECRET", "mau-secret-xK9p2q")
_COOKIE_NAME = "mau_auth"
_AUTH_TOKEN = hashlib.sha256(f"{_DASHBOARD_PASSWORD}:{_SESSION_SECRET}".encode()).hexdigest()

# Website integration key (for public lead/track endpoints)
_WEBSITE_KEY = os.environ.get("WEBSITE_API_KEY", "")

# Paths that are always public (no auth required)
_PUBLIC_PREFIXES = ("/login", "/logout", "/health", "/static/", "/api/public/", "/demo")


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

import base64

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
    set_case_stage,
    add_case_note,
    get_audit_log,
    save_credit_report,
    get_credit_report,
    save_payslip_analysis,
    get_payslip_analysis,
    save_passport_data,
    get_passport_data,
    CASE_STAGES,
    CASE_STAGE_LABELS,
    CLIENTS_DIR,
)
from memory.audit_log import log_event
from tools.bank_statement_analyser import analyse_statement
from tools.grading_engine import grade_client
from tools.adverse_lender_matcher import match_lenders
from tools.report_generator import generate_report
from tools.discrepancy_engine import compute_discrepancy
from tools.stress_test import run_stress_test
from tools.credit_report_analyser import analyse_credit_report, cross_validate as credit_cross_validate
from tools.payslip_analyser import analyse_payslip
from tools.passport_analyser import analyse_passport, cross_check_passport
from tools.live_lender_api import is_live_api_configured, get_provider_name, get_live_affordability
from tools.cross_validation_engine import cross_validate_documents
from tools.document_generator import (
    generate_document as gen_document,
    extract_reference_text,
    DOC_TYPES as DOCUMENT_TYPES,
)
from tools.suitability_letter import generate_suitability_letter
from tools.decline_analyser import analyse_decline
from tools.email_drafter import draft_email
from tools.case_summary import summarise_case
from tools.criteria_engine import search_criteria
from orchestrator import Orchestrator

app = FastAPI(title="MAU — Mortgages Are Us — Consultant Dashboard", version="2.0.0")

# Demo website Jinja2 templates (served publicly under /demo/*)
_demo_tpl = Jinja2Templates(directory="templates/demo") if os.path.exists("templates/demo") else None
app.add_middleware(_AuthMiddleware)
orchestrator = Orchestrator()


def _check_auth(request: Request) -> None:
    """Raise 401 if the request is not authenticated (middleware also enforces this)."""
    token = request.cookies.get(_COOKIE_NAME)
    if token != _AUTH_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorised")


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
    gdpr_consent: bool = False


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
        "gdpr_consent": req.gdpr_consent,
    }
    client_id = create_client(data)
    client = get_client(client_id)
    log_event(client_id, "client_created", {
        "name": req.name,
        "gdpr_consent": req.gdpr_consent,
        "mortgage_purpose": req.mortgage_purpose,
    })
    return {"client_id": client_id, "client": client}


@app.get("/api/clients/{client_id}")
async def get_client_detail(client_id: str):
    """Return full client detail including analysis results and grade."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    analysis = get_analysis(client_id)
    payslip = get_payslip_analysis(client_id)
    return {
        "client": client,
        "analysis": analysis,
        "has_analysis": analysis is not None,
        "payslip": payslip,
        "has_payslip": payslip is not None,
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


@app.post("/api/clients/{client_id}/upload-payslip")
async def upload_payslip(client_id: str, file: UploadFile = File(...)):
    """
    Upload a payslip PDF or image. Triggers AI analysis of gross/net pay
    and itemised deductions (tax, National Insurance, pension, etc.).
    """
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

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

    try:
        file_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read file: {exc}")

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    declared_income = float(client.get("declared_income", 0))

    try:
        payslip_analysis = analyse_payslip(
            file_bytes=file_bytes,
            file_type=content_type,
            declared_monthly_income=declared_income,
            client_id=client_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")

    combined = {
        "analysis": payslip_analysis,
        "payslip_filename": file.filename,
        "uploaded_at": payslip_analysis["_meta"]["analysed_at"],
    }
    save_payslip_analysis(client_id, combined)

    update_client(client_id, {"payslip_uploaded": True})
    log_event(client_id, "payslip_uploaded", {"filename": file.filename})

    return {
        "success": True,
        "client_id": client_id,
        "analysis": payslip_analysis,
    }


@app.get("/api/clients/{client_id}/payslip")
async def get_client_payslip(client_id: str):
    """Return the stored payslip analysis for a client."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    data = get_payslip_analysis(client_id)
    if not data:
        raise HTTPException(status_code=404, detail="No payslip uploaded yet")
    return {"client_id": client_id, **data}


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

    verified_monthly_income = float((analysis.get("income_analysis") or {}).get("total_average_monthly_income", 0) or 0)
    monthly_income = verified_monthly_income if verified_monthly_income > 0 else float(client.get("declared_income", 0) or 0)
    monthly_debts = float((analysis.get("expenditure_analysis") or {}).get("total_fixed_monthly", 0) or 0)

    matched_lenders = match_lenders(
        grade=grade_result.get("grade", "F"),
        ccjs=bool(adverse.get("ccj")),
        defaults=bool(adverse.get("default")),
        bankruptcy=bool(adverse.get("bankruptcy")),
        months_since_adverse=int(adverse.get("months_since_most_recent") or 0),
        ltv=ltv,
        employment_type=client.get("employment_type", "employed"),
        annual_income=monthly_income * 12,
        monthly_debts=monthly_debts,
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


@app.get("/api/lender-api-status")
async def lender_api_status():
    """Return whether a live sourcing-platform API is configured."""
    return {
        "live_api_configured": is_live_api_configured(),
        "provider": get_provider_name(),
        "note": (
            "Live affordability data active." if is_live_api_configured()
            else "Using indicative estimates. Add TWENTY7TEC_API_KEY or MORTGAGE_BRAIN_API_KEY to enable live data."
        ),
    }


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

    stored = get_analysis(client_id)
    analysis = stored.get("analysis", {}) if stored else {}
    verified_monthly_income = float((analysis.get("income_analysis") or {}).get("total_average_monthly_income", 0) or 0)
    monthly_income = verified_monthly_income if verified_monthly_income > 0 else float(client.get("declared_income", 0) or 0)
    monthly_debts = float((analysis.get("expenditure_analysis") or {}).get("total_fixed_monthly", 0) or 0)

    matched = match_lenders(
        grade=grade,
        ccjs=bool(adverse.get("ccj")),
        defaults=bool(adverse.get("default")),
        bankruptcy=bool(adverse.get("bankruptcy")),
        months_since_adverse=int(adverse.get("months_since_most_recent") or 0),
        ltv=ltv,
        employment_type=client.get("employment_type", "employed"),
        annual_income=monthly_income * 12,
        monthly_debts=monthly_debts,
    )

    # Enrich with live API data when a sourcing-platform key is configured.
    if is_live_api_configured():
        for lender in matched:
            live = get_live_affordability(
                lender_name=lender["name"],
                annual_income=monthly_income * 12,
                partner_income=0.0,
                employment_type=client.get("employment_type", "employed"),
                monthly_debts=monthly_debts,
                loan_amount=float(client.get("loan_amount", 0) or 0),
                property_value=float(client.get("property_value", 0) or 0),
                adverse_history=adverse,
            )
            if live:
                lender["affordability_estimate"] = live

    return {
        "client_id": client_id,
        "grade": grade,
        "lenders": matched,
        "count": len(matched),
        "live_api_active": is_live_api_configured(),
        "live_api_provider": get_provider_name(),
    }


# ── Case progress ─────────────────────────────────────────────────────────────

class CaseStageRequest(BaseModel):
    stage: str
    note: Optional[str] = None


class CaseNoteRequest(BaseModel):
    note: str


@app.post("/api/clients/{client_id}/case-stage")
async def update_case_stage(client_id: str, req: CaseStageRequest):
    """Advance or change the case stage with an optional note."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    if req.stage not in CASE_STAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid stage. Must be one of: {', '.join(CASE_STAGES)}",
        )
    updated = set_case_stage(client_id, req.stage, req.note or "")
    log_event(client_id, "case_stage_changed", {"stage": req.stage, "note": req.note or ""})
    return {"client": updated, "stage": req.stage, "stage_label": CASE_STAGE_LABELS[req.stage]}


@app.post("/api/clients/{client_id}/case-notes")
async def create_case_note(client_id: str, req: CaseNoteRequest):
    """Add a free-text case note."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    updated = add_case_note(client_id, req.note)
    log_event(client_id, "case_note_added", {"note": req.note[:200]})
    return {"client": updated}


@app.get("/api/clients/{client_id}/audit-log")
async def get_client_audit_log(client_id: str):
    """Return the full audit trail for a client."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    entries = get_audit_log(client_id)
    return {"client_id": client_id, "entries": entries, "count": len(entries)}


# ── Discrepancy report ────────────────────────────────────────────────────────

@app.get("/api/clients/{client_id}/discrepancy")
async def get_discrepancy_report(client_id: str):
    """Return cross-validation discrepancy report for declared vs verified income."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    stored = get_analysis(client_id)
    if not stored or not stored.get("analysis"):
        raise HTTPException(
            status_code=400,
            detail="No bank statement analysis found. Upload a statement first.",
        )
    report = compute_discrepancy(client, stored["analysis"])
    return {"client_id": client_id, "discrepancy": report}


# ── Stress test ───────────────────────────────────────────────────────────────

class StressTestRequest(BaseModel):
    term_years: int = 25
    indicative_rate: Optional[float] = None


@app.post("/api/clients/{client_id}/stress-test")
async def run_client_stress_test(client_id: str, req: StressTestRequest):
    """Run FCA MCOB 11 affordability stress test for a client."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    stored = get_analysis(client_id)
    analysis = stored.get("analysis") if stored else None

    verified_income = 0.0
    net_disposable = 0.0
    if analysis:
        verified_income = float(
            (analysis.get("income_analysis") or {}).get("total_average_monthly_income", 0) or 0
        )
        net_disposable = float(
            (analysis.get("affordability_indicators") or {}).get("net_disposable_income_monthly", 0) or 0
        )

    result = run_stress_test(
        loan_amount=float(client.get("loan_amount", 0) or 0),
        declared_income=float(client.get("declared_income", 0) or 0),
        grade=client.get("grade", "F") or "F",
        verified_income=verified_income,
        net_disposable=net_disposable,
        term_years=req.term_years,
        indicative_rate=req.indicative_rate,
    )
    log_event(client_id, "stress_test_run", {
        "verdict": result["stress_verdict"],
        "ratio_at_stress": result["ratio_at_stress"],
    })
    return {"client_id": client_id, "stress_test": result}


# ── Credit report ─────────────────────────────────────────────────────────────

_ALLOWED_CREDIT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}


@app.post("/api/clients/{client_id}/upload-credit-report")
async def upload_credit_report(client_id: str, file: UploadFile = File(...)):
    """Upload a credit bureau report (Equifax, Experian, TransUnion) for AI analysis."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    ct = file.content_type or "application/octet-stream"
    if ct not in _ALLOWED_CREDIT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ct}. Upload a PDF or image.",
        )

    try:
        file_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read file: {exc}")

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        credit_data = analyse_credit_report(
            file_bytes=file_bytes,
            file_type=ct,
            client_id=client_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Credit report analysis failed: {exc}")

    stored_analysis = get_analysis(client_id)
    bank_analysis = stored_analysis.get("analysis") if stored_analysis else None

    validation = credit_cross_validate(client, credit_data)

    payload = {
        "credit_data": credit_data,
        "validation": validation,
        "filename": file.filename,
        "uploaded_at": credit_data["_meta"]["analysed_at"],
    }
    save_credit_report(client_id, payload)

    log_event(client_id, "credit_report_uploaded", {
        "bureau": credit_data.get("bureau"),
        "critical_discrepancies": validation["critical_count"],
        "filename": file.filename,
    })

    update_client(client_id, {"credit_report_uploaded": True})

    return {
        "success": True,
        "client_id": client_id,
        "bureau": credit_data.get("bureau"),
        "credit_data": credit_data,
        "validation": validation,
    }


@app.get("/api/clients/{client_id}/credit-report")
async def get_client_credit_report(client_id: str):
    """Return the stored credit report analysis for a client."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    data = get_credit_report(client_id)
    if not data:
        raise HTTPException(status_code=404, detail="No credit report uploaded yet")
    return {"client_id": client_id, **data}


# ── Passport / ID document ────────────────────────────────────────────────────

_ALLOWED_ID_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}


@app.post("/api/clients/{client_id}/upload-passport")
async def upload_passport(client_id: str, file: UploadFile = File(...)):
    """Upload a passport or photo ID for AML/KYC identity verification."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    ct = file.content_type or "application/octet-stream"
    if ct not in _ALLOWED_ID_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ct}. Upload a PDF or image.",
        )

    try:
        file_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read file: {exc}")

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        passport_data = analyse_passport(
            file_bytes=file_bytes,
            file_type=ct,
            client_id=client_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Passport analysis failed: {exc}")

    payslip_stored = get_payslip_analysis(client_id)
    credit_stored = get_credit_report(client_id)
    cross_check = cross_check_passport(
        passport_data=passport_data,
        client=client,
        payslip_data=payslip_stored,
        credit_data=credit_stored,
    )

    payload = {
        "passport_data": passport_data,
        "cross_check": cross_check,
        "filename": file.filename,
        "uploaded_at": passport_data["_meta"]["analysed_at"],
    }
    save_passport_data(client_id, payload)

    log_event(client_id, "passport_uploaded", {
        "document_type": passport_data.get("document_type"),
        "issuing_country": passport_data.get("issuing_country"),
        "is_expired": passport_data.get("is_expired"),
        "filename": file.filename,
        "cross_check_overall": cross_check["overall"],
    })
    update_client(client_id, {"passport_uploaded": True})

    return {
        "success": True,
        "client_id": client_id,
        "passport_data": passport_data,
        "cross_check": cross_check,
    }


@app.get("/api/clients/{client_id}/passport")
async def get_client_passport(client_id: str):
    """Return the stored passport analysis for a client."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    data = get_passport_data(client_id)
    if not data:
        raise HTTPException(status_code=404, detail="No passport uploaded yet")
    return {"client_id": client_id, **data}


# ── Cross-document validation ────────────────────────────────────────────────

@app.get("/api/clients/{client_id}/cross-check")
async def get_cross_check(client_id: str):
    """Cross-validate payslip, bank statement, and credit report for discrepancies."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    stored_analysis = get_analysis(client_id)
    bank_analysis = stored_analysis.get("analysis") if stored_analysis else None

    stored_payslip = get_payslip_analysis(client_id)
    payslip_analysis = stored_payslip.get("analysis") if stored_payslip else None

    stored_credit = get_credit_report(client_id)
    credit_data = stored_credit.get("credit_data") if stored_credit else None
    credit_validation = stored_credit.get("validation") if stored_credit else None

    if not bank_analysis and not payslip_analysis and not credit_data:
        raise HTTPException(
            status_code=400,
            detail="No documents uploaded yet. Upload a bank statement, payslip, or credit report first.",
        )

    report = cross_validate_documents(client, bank_analysis, payslip_analysis, credit_data, credit_validation)
    return {"client_id": client_id, "cross_check": report}


# ── AI Assistant ──────────────────────────────────────────────────────────────

@app.post("/api/chat-with-document")
async def chat_with_document(
    session_id: str = Form(...),
    message: str = Form(""),
    client_id: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    """AI chat with an optional attached document (PDF or image)."""
    _allowed = {"application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp", "text/plain"}

    content: str | list = message or "Please analyse the attached document."

    if file and file.filename:
        ct = file.content_type or "application/octet-stream"
        if ct not in _allowed:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ct}")
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Empty file")

        encoded = base64.standard_b64encode(file_bytes).decode()
        msg_text = message or "Please analyse this document and tell me what's relevant to this mortgage case."

        if ct == "text/plain":
            text_body = file_bytes.decode("utf-8", errors="replace")[:8000]
            content = [{"type": "text", "text": f"[ATTACHED: {file.filename}]\n\n{text_body}\n\n{message}".strip()}]
        elif ct == "application/pdf":
            content = [
                {"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": encoded}},
                {"type": "text", "text": msg_text},
            ]
        else:
            content = [
                {"type": "image", "source": {"type": "base64", "media_type": ct, "data": encoded}},
                {"type": "text", "text": msg_text},
            ]

    eff_session = f"{client_id}_{session_id}" if client_id else session_id

    try:
        text, stage = await orchestrator.process(
            eff_session,
            [{"role": "user", "content": content}],
            client_id=client_id,
        )
        return ChatResponse(session_id=session_id, message=text, stage=stage)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


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


# ── Pipeline ──────────────────────────────────────────────────────────────────

class PipelineDatesRequest(BaseModel):
    lender_name: Optional[str] = None
    aip_expiry: Optional[str] = None
    offer_date: Optional[str] = None
    offer_expiry: Optional[str] = None
    exchange_date: Optional[str] = None
    completion_date: Optional[str] = None
    product_end_date: Optional[str] = None
    erc_end_date: Optional[str] = None


@app.get("/api/pipeline")
async def get_pipeline():
    """Pipeline overview — all clients with stage, dates, proc fees."""
    from datetime import datetime
    clients = list_clients()
    today = datetime.utcnow()

    active_cases = sum(1 for c in clients if c.get("status") == "active" or c.get("case_stage") != "completion")
    pipeline_value = sum(
        (c.get("proc_fee_expected") or 0)
        for c in clients
        if c.get("proc_fee_status") in (None, "pending", "confirmed")
    )

    # Build SLA data from lenders with both offer + DIP data
    sla_map: dict = {}
    for c in clients:
        lender = c.get("lender_name")
        if not lender:
            continue
        dip_date = c.get("aip_expiry")  # proxy
        offer_date = c.get("offer_date")
        completion_date = c.get("completion_date")
        if offer_date and dip_date:
            try:
                diff = (datetime.fromisoformat(offer_date) - datetime.fromisoformat(dip_date)).days
                if diff > 0:
                    if lender not in sla_map:
                        sla_map[lender] = []
                    sla_map[lender].append(diff)
            except Exception:
                pass

    sla_data = []
    for lender, days_list in sla_map.items():
        sla_data.append({
            "lender": lender,
            "case_count": len(days_list),
            "avg_days": round(sum(days_list) / len(days_list)),
            "best_days": min(days_list),
            "worst_days": max(days_list),
        })

    return {
        "clients": clients,
        "sla_data": sorted(sla_data, key=lambda x: x["avg_days"]),
        "total_clients": len(clients),
        "active_cases": active_cases,
        "pipeline_proc_value": pipeline_value,
    }


@app.patch("/api/clients/{client_id}/pipeline-dates")
async def update_pipeline_dates(client_id: str, req: PipelineDatesRequest):
    """Update pipeline dates (offer expiry, completion, etc.) for a client."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    update_data = {k: v for k, v in req.dict().items() if v is not None}
    updated = update_client(client_id, update_data)
    log_event(client_id, "pipeline_dates_updated", update_data)
    return {"client_id": client_id, "client": updated}


# ── Revenue & Proc Fees ───────────────────────────────────────────────────────

class ProcFeeRequest(BaseModel):
    proc_fee_expected: Optional[float] = None
    proc_fee_actual: Optional[float] = None
    proc_fee_status: Optional[str] = None  # pending | confirmed | paid | clawback
    lender_name: Optional[str] = None
    referral_source: Optional[str] = None


@app.patch("/api/clients/{client_id}/proc-fee")
async def update_proc_fee(client_id: str, req: ProcFeeRequest):
    """Update proc fee status and amounts for a client."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    update_data = {k: v for k, v in req.dict().items() if v is not None}
    updated = update_client(client_id, update_data)
    log_event(client_id, "proc_fee_updated", update_data)
    return {"client_id": client_id, "client": updated}


@app.get("/api/revenue-dashboard")
async def revenue_dashboard(monthly_target: float = 0):
    """Aggregated revenue metrics across all clients."""
    from datetime import datetime
    clients = list_clients()
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0)

    pipeline_value = 0.0
    mtd_actual = 0.0
    paid_ytd = 0.0
    clawback_risk_total = 0.0
    proc_fees = []
    clawback_risk = []
    funnel: dict = {s: 0 for s in ["research", "dip", "full_application", "offer", "completion"]}
    referral_map: dict = {}

    for c in clients:
        stage = c.get("case_stage", "research")
        funnel[stage] = funnel.get(stage, 0) + 1

        ref = c.get("referral_source") or "Direct"
        referral_map[ref] = referral_map.get(ref, 0) + 1

        fee_exp = c.get("proc_fee_expected") or 0
        fee_act = c.get("proc_fee_actual") or 0
        fee_status = c.get("proc_fee_status") or "pending"

        if fee_status in ("pending", "confirmed"):
            pipeline_value += fee_exp

        if fee_status == "paid":
            paid_ytd += fee_act
            # Check MTD
            paid_at = c.get("updated_at", "")
            try:
                if datetime.fromisoformat(paid_at) >= month_start:
                    mtd_actual += fee_act
            except Exception:
                pass

        # Clawback: completion within 24 months = at risk
        completion = c.get("completion_date")
        if completion and fee_status == "paid" and fee_act > 0:
            try:
                comp_dt = datetime.fromisoformat(completion)
                months_ago = (now - comp_dt).days / 30.44
                if months_ago < 24:
                    months_remaining = max(0, round(24 - months_ago))
                    clawback_risk_total += fee_act
                    clawback_risk.append({
                        **{k: c.get(k) for k in ("client_id", "name", "lender_name", "completion_date")},
                        "proc_fee_actual": fee_act,
                        "clawback_months_remaining": months_remaining,
                    })
            except Exception:
                pass

        proc_fees.append({
            **{k: c.get(k) for k in ("client_id", "name", "lender_name", "case_stage", "proc_fee_expected", "proc_fee_actual", "proc_fee_status")},
            "clawback_risk": c.get("completion_date") is not None and fee_status == "paid",
        })

    referral_sources = [{"source": k, "count": v} for k, v in referral_map.items()]

    return {
        "pipeline_value": pipeline_value,
        "mtd_actual": mtd_actual,
        "paid_ytd": paid_ytd,
        "clawback_risk_total": clawback_risk_total,
        "monthly_target": monthly_target,
        "proc_fees": sorted(proc_fees, key=lambda x: x.get("proc_fee_expected") or 0, reverse=True),
        "clawback_risk": clawback_risk,
        "funnel": funnel,
        "referral_sources": referral_sources,
    }


# ── AI Tools ──────────────────────────────────────────────────────────────────

class SuitabilityLetterRequest(BaseModel):
    product_details: dict = {}


class DeclineAnalysisRequest(BaseModel):
    decline_reason: str
    declined_lender: str = "Unknown"


class DraftEmailRequest(BaseModel):
    email_type: str
    context: dict = {}


class CriteriaSearchRequest(BaseModel):
    query: str
    client_id: Optional[str] = None


class MarketCommentaryRequest(BaseModel):
    topic: str = "UK mortgage market update"


class ObjectionRequest(BaseModel):
    objection: str


@app.post("/api/clients/{client_id}/suitability-letter")
async def suitability_letter(client_id: str, req: SuitabilityLetterRequest):
    """Generate an FCA MCOB 4.8-compliant suitability letter using AI."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    stored = get_analysis(client_id)
    analysis = stored.get("analysis") if stored else {}
    try:
        html = generate_suitability_letter(client, analysis or {}, req.product_details)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Generation failed: {exc}")
    save_document(client_id, "suitability_letter", html)
    log_event(client_id, "document_generated", {"doc_type": "suitability_letter"})
    return {"client_id": client_id, "html": html}


@app.post("/api/clients/{client_id}/decline-analysis")
async def decline_analysis(client_id: str, req: DeclineAnalysisRequest):
    """Analyse a lender decline reason and suggest alternatives."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    try:
        result = analyse_decline(client, req.decline_reason, req.declined_lender)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")
    log_event(client_id, "decline_analysed", {"lender": req.declined_lender})
    return {"client_id": client_id, "analysis": result}


@app.post("/api/clients/{client_id}/draft-email")
async def draft_client_email(client_id: str, req: DraftEmailRequest):
    """Draft a professional email using AI."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    try:
        email = draft_email(client, req.email_type, req.context)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Draft failed: {exc}")
    log_event(client_id, "email_drafted", {"type": req.email_type})
    return {"client_id": client_id, "email": email}


@app.post("/api/clients/{client_id}/case-summary")
async def case_summary(client_id: str):
    """Generate an AI case handover summary."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    stored = get_analysis(client_id)
    analysis = stored.get("analysis") if stored else None
    credit_data_raw = get_credit_report(client_id)
    credit_data = credit_data_raw.get("credit_data") if credit_data_raw else None
    try:
        summary = summarise_case(client, analysis, credit_data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Summary failed: {exc}")
    log_event(client_id, "case_summary_generated", {})
    return {"client_id": client_id, "summary": summary}


@app.post("/api/criteria-search")
async def criteria_search(req: CriteriaSearchRequest):
    """AI-powered lender criteria search."""
    client = get_client(req.client_id) if req.client_id else None
    try:
        result = search_criteria(req.query, client)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Search failed: {exc}")
    return result


@app.post("/api/market-commentary")
async def market_commentary(req: MarketCommentaryRequest):
    """Generate UK mortgage market commentary using AI."""
    import anthropic as _anthropic
    _ac = _anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    from datetime import date
    today_str = date.today().strftime("%d %B %Y")
    try:
        resp = _ac.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=800,
            system=[{"type": "text", "text": (
                "You are a UK mortgage market analyst writing professional broker commentary. "
                "Write in a clear, confident tone suitable for sharing with clients or on social media. "
                "Focus on factual observations about the UK mortgage market, Bank of England base rate context, "
                "adverse credit market, and practical advice for borrowers. No disclaimers or caveats beyond "
                "a brief 'this is general information' note at the end. 3-4 paragraphs maximum."
            ), "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": f"Date: {today_str}\n\nTopic: {req.topic}\n\nWrite the commentary now."}],
        )
        commentary = resp.content[0].text
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Generation failed: {exc}")
    return {"commentary": commentary, "topic": req.topic}


@app.post("/api/objection-handler")
async def objection_handler(req: ObjectionRequest):
    """Generate a professional broker response to a common client objection."""
    import anthropic as _anthropic
    _ac = _anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    try:
        resp = _ac.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=400,
            system=[{"type": "text", "text": (
                "You are a senior UK mortgage broker. Write a concise, confident, and professional response "
                "to a client objection. The response should be 3-5 sentences — persuasive but not pushy, "
                "focused on real value a mortgage broker provides. No bullet points — flowing prose."
            ), "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": f"Client said: \"{req.objection}\"\n\nWrite the broker's response:"}],
        )
        response_text = resp.content[0].text
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Generation failed: {exc}")
    return {"response": response_text, "objection": req.objection}


# ── Compliance ────────────────────────────────────────────────────────────────

@app.get("/api/clients/{client_id}/consumer-duty")
async def get_consumer_duty(client_id: str):
    """Get saved Consumer Duty assessment for a client."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client.get("consumer_duty") or {}


@app.post("/api/clients/{client_id}/consumer-duty")
async def save_consumer_duty(client_id: str, request: Request):
    """Save Consumer Duty outcome assessment."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    body = await request.json()
    update_client(client_id, {"consumer_duty": body})
    log_event(client_id, "consumer_duty_recorded", {"outcomes": list(body.keys())})
    return {"saved": True}


@app.post("/api/clients/{client_id}/vulnerable-customer")
async def save_vulnerable_customer(client_id: str, request: Request):
    """Save vulnerability assessment for a client."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    body = await request.json()
    is_vuln = body.get("vulnerable_customer", False)
    update_client(client_id, {
        "vulnerable_customer": is_vuln,
        "vulnerability_data": body.get("vulnerability_data", {}),
    })
    log_event(client_id, "vulnerability_assessed", {"vulnerable": is_vuln})
    return {"saved": True, "vulnerable_customer": is_vuln}


@app.get("/api/clients/{client_id}/file-review")
async def file_review(client_id: str):
    """Auto-check file completeness against FCA MCOB requirements."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    stored = get_analysis(client_id)
    analysis = stored.get("analysis") if stored else None
    docs = list_documents(client_id)
    doc_types = {d["doc_type"] for d in docs}
    audit = get_audit_log(client_id)
    audit_events = {e["event_type"] for e in audit}
    credit = get_credit_report(client_id)

    checks = {
        "gdpr_consent": bool(client.get("gdpr_consent")),
        "idd_generated": "idd" in doc_types,
        "privacy_notice": "privacy_notice" in doc_types,
        "consumer_duty": bool(client.get("consumer_duty")),
        "vulnerable_assessed": "vulnerability_data" in client or "vulnerable_customer" in client,
        "fact_find": all(client.get(f) for f in ("declared_income", "loan_amount", "property_value", "employment_type")),
        "income_verified": analysis is not None,
        "bank_statement": analysis is not None,
        "credit_report": credit is not None,
        "stress_test": "stress_test_run" in audit_events,
        "grade_assigned": bool(client.get("grade")),
        "esis_provided": "esis" in doc_types,
        "suitability_letter": "suitability_letter" in doc_types,
        "risks_explained": bool(client.get("consumer_duty")),
        "alternatives_considered": "suitability_letter" in doc_types,
        "aip_obtained": bool(client.get("aip_expiry") or client.get("case_stage") in ("dip", "full_application", "offer", "completion")),
    }
    return checks


@app.get("/api/clients/{client_id}/tcf-log")
async def get_tcf_log(client_id: str):
    """Get TCF log for a client."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client.get("tcf_log") or {}


@app.post("/api/clients/{client_id}/tcf-log")
async def save_tcf_log(client_id: str, request: Request):
    """Save TCF log for a client."""
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    body = await request.json()
    update_client(client_id, {"tcf_log": body})
    log_event(client_id, "tcf_log_saved", {})
    return {"saved": True}


# ── Dashboard ─────────────────────────────────────────────────────────────────

@app.get("/api/dashboard")
async def get_dashboard(request: Request):
    _check_auth(request)
    clients = list_clients()
    now = datetime.utcnow()
    today = now.date()

    active_clients = [c for c in clients if c.get('status') != 'archived']

    # Stage counts
    stage_counts = {'research': 0, 'dip': 0, 'full_application': 0, 'offer': 0, 'completion': 0}
    for c in active_clients:
        stage = c.get('case_stage', 'research')
        if stage in stage_counts:
            stage_counts[stage] += 1

    # Pipeline value (sum of proc_fee for non-completed cases)
    pipeline_value = sum(
        float(c.get('proc_fee') or 0)
        for c in active_clients
        if c.get('case_stage') not in ['completion']
    )

    # Urgent actions
    urgent = []

    for c in active_clients:
        cid = c['client_id']
        cname = c.get('name', 'Unknown')

        # AIP expiry within 14 days
        for field, label in [('aip_expiry', 'AIP'), ('offer_expiry', 'Mortgage Offer')]:
            val = c.get(field)
            if val:
                try:
                    exp_date = datetime.fromisoformat(val[:10]).date()
                    days_left = (exp_date - today).days
                    if 0 <= days_left <= 14:
                        urgent.append({
                            'type': field,
                            'client_id': cid,
                            'client_name': cname,
                            'days': days_left,
                            'message': f"{label} expires in {days_left} day{'s' if days_left != 1 else ''}",
                            'severity': 'high' if days_left <= 3 else 'medium'
                        })
                    elif days_left < 0:
                        urgent.append({
                            'type': field,
                            'client_id': cid,
                            'client_name': cname,
                            'days': days_left,
                            'message': f"{label} expired {abs(days_left)} days ago",
                            'severity': 'high'
                        })
                except Exception:
                    pass

        # Missing IDD (required for all active cases)
        idd_path = os.path.join(CLIENTS_DIR, f"{cid}_doc_idd.html")
        if not os.path.exists(idd_path):
            urgent.append({
                'type': 'missing_doc',
                'client_id': cid,
                'client_name': cname,
                'message': 'IDD not yet issued',
                'severity': 'high'
            })

        # Missing suitability letter for cases at full_application or beyond
        stage = c.get('case_stage', 'research')
        if stage in ['full_application', 'offer', 'completion']:
            suit_path = os.path.join(CLIENTS_DIR, f"{cid}_doc_suitability_letter.html")
            if not os.path.exists(suit_path):
                urgent.append({
                    'type': 'missing_suitability',
                    'client_id': cid,
                    'client_name': cname,
                    'message': f'Suitability letter missing ({stage.replace("_", " ").title()})',
                    'severity': 'high'
                })

        # Stale cases (no update for 7+ days, not completed)
        if stage != 'completion':
            updated = c.get('updated_at', '')
            if updated:
                try:
                    upd_date = datetime.fromisoformat(updated[:10]).date()
                    days_stale = (today - upd_date).days
                    if days_stale >= 7:
                        urgent.append({
                            'type': 'stale',
                            'client_id': cid,
                            'client_name': cname,
                            'days': days_stale,
                            'message': f'No activity for {days_stale} days',
                            'severity': 'high' if days_stale >= 14 else 'medium'
                        })
                except Exception:
                    pass

    # Sort urgent: high first, then by client name
    urgent.sort(key=lambda x: (0 if x['severity'] == 'high' else 1, x['client_name']))

    # Upcoming dates (next 30 days)
    upcoming = []
    for c in clients:
        cid = c['client_id']
        cname = c.get('name', 'Unknown')
        for field, label in [
            ('completion_date', 'Completion'),
            ('exchange_date', 'Exchange'),
            ('aip_expiry', 'AIP Expiry'),
            ('offer_expiry', 'Offer Expiry'),
            ('erc_end_date', 'ERC End'),
        ]:
            val = c.get(field)
            if val:
                try:
                    d = datetime.fromisoformat(val[:10]).date()
                    days = (d - today).days
                    if 0 <= days <= 30:
                        upcoming.append({
                            'client_id': cid,
                            'client_name': cname,
                            'date': val[:10],
                            'label': label,
                            'days': days
                        })
                except Exception:
                    pass
    upcoming.sort(key=lambda x: x['days'])

    # Remortgage radar (ERC ends within 12 months)
    remortgage = []
    for c in clients:
        for field in ['erc_end_date', 'deal_end_date']:
            val = c.get(field)
            if val:
                try:
                    end_date = datetime.fromisoformat(val[:10]).date()
                    days_to_end = (end_date - today).days
                    if 0 < days_to_end <= 365:
                        remortgage.append({
                            'client_id': c['client_id'],
                            'client_name': c.get('name', 'Unknown'),
                            'end_date': val[:10],
                            'days_to_end': days_to_end,
                            'months_to_end': round(days_to_end / 30.5, 1),
                            'last_updated': c.get('updated_at', '')[:10],
                        })
                        break
                except Exception:
                    pass
    remortgage.sort(key=lambda x: x['days_to_end'])

    # Recent activity (latest 8 entries across all clients)
    activity = []
    for c in clients:
        notes = c.get('case_notes', [])
        if notes:
            latest = max(notes, key=lambda n: n.get('timestamp', ''))
            activity.append({
                'client_id': c['client_id'],
                'client_name': c.get('name', 'Unknown'),
                'timestamp': latest.get('timestamp', c.get('updated_at', '')),
                'type': 'note',
                'description': latest.get('note', '')[:80]
            })
        else:
            updated = c.get('updated_at', '')
            if updated:
                activity.append({
                    'client_id': c['client_id'],
                    'client_name': c.get('name', 'Unknown'),
                    'timestamp': updated,
                    'type': 'update',
                    'description': f"Stage: {c.get('case_stage', 'research').replace('_', ' ').title()}"
                })
    activity.sort(key=lambda x: x['timestamp'], reverse=True)

    # Grade distribution
    grade_dist = {}
    for c in clients:
        g = c.get('grade') or 'Ungraded'
        grade_dist[g] = grade_dist.get(g, 0) + 1

    return {
        'kpis': {
            'total_clients': len(clients),
            'active_cases': len(active_clients),
            'stage_counts': stage_counts,
            'pipeline_value': pipeline_value,
            'urgent_count': len([u for u in urgent if u['severity'] == 'high']),
        },
        'urgent_actions': urgent[:12],
        'upcoming_dates': upcoming[:10],
        'remortgage_radar': remortgage[:8],
        'recent_activity': activity[:8],
        'grade_distribution': grade_dist,
    }


# ── Demo website pages (public, no auth) ──────────────────────────────────────

def _demo(request: Request, template: str):
    if not _demo_tpl:
        raise HTTPException(status_code=404, detail="Demo templates not found")
    return _demo_tpl.TemplateResponse(template, {"request": request})

@app.get("/demo", response_class=HTMLResponse)
async def demo_home(request: Request): return _demo(request, "index.html")

@app.get("/demo/adverse-credit", response_class=HTMLResponse)
async def demo_adverse(request: Request): return _demo(request, "adverse-credit.html")

@app.get("/demo/get-started", response_class=HTMLResponse)
async def demo_getstarted(request: Request): return _demo(request, "get-started.html")

@app.get("/demo/chat", response_class=HTMLResponse)
async def demo_chat_page(request: Request): return _demo(request, "chat.html")

@app.get("/demo/track", response_class=HTMLResponse)
async def demo_track_page(request: Request): return _demo(request, "track.html")


# ── Public website integration endpoints ──────────────────────────────────────
# These are open to the customer website (authenticated via X-Website-Key header).
# The /api/public/ prefix is in _PUBLIC_PREFIXES so the session middleware skips them.

def _check_website_key(request: Request) -> None:
    if _WEBSITE_KEY and request.headers.get("X-Website-Key") != _WEBSITE_KEY:
        raise HTTPException(status_code=403, detail="Invalid website key")


@app.post("/api/public/lead")
async def public_create_lead(request: Request):
    _check_website_key(request)
    data = await request.json()
    if not data.get("name") or not data.get("email"):
        raise HTTPException(status_code=422, detail="Name and email required")
    adverse = [k for k in ["has_ccjs", "has_defaults", "has_iva", "has_missed_payments", "has_dmp"] if data.get(k)]
    client_data = {
        "name": data.get("name", ""),
        "email": data.get("email", ""),
        "phone": data.get("phone", ""),
        "purpose": data.get("purpose", "purchase"),
        "purchase_price": data.get("property_value"),
        "deposit": data.get("deposit"),
        "loan_amount": (data.get("property_value") or 0) - (data.get("deposit") or 0) or None,
        "adverse_credit_types": ", ".join(adverse) if adverse else "",
        "source": "website",
        "gdpr_consent": True,
        "case_notes": [{"timestamp": datetime.utcnow().isoformat(), "stage": "research", "note": f"Web enquiry. Situation: {data.get('situation', '')}"}] if data.get("situation") else [],
    }
    client_id = create_client(client_data)
    return {"success": True, "client_id": client_id}


@app.get("/api/public/track/{client_id}")
async def public_track_case(client_id: str, request: Request):
    _check_website_key(request)
    client = get_client(client_id)
    if not client:
        return {"found": False}
    stage_labels = {
        "research": "Research — Initial Review",
        "dip": "Decision in Principle",
        "full_application": "Full Application",
        "offer": "Mortgage Offer",
        "completion": "Completion",
    }
    stage = client.get("case_stage", "research")
    return {
        "found": True,
        "name": client.get("name", ""),
        "stage": stage,
        "stage_label": stage_labels.get(stage, stage),
        "updated_at": client.get("updated_at", ""),
    }


_WEBSITE_CHAT_SYSTEM = """You are the MAU Adviser — a friendly, knowledgeable UK mortgage specialist for Mortgages Are Us, a specialist adverse credit broker.

Help website visitors understand their mortgage options, especially those with credit challenges. Be warm, empathetic and reassuring.

Key facts:
- Specialise in adverse credit: CCJs, defaults, IVAs, bankruptcy, missed payments, debt management plans
- Specialist lender access: Precise Mortgages, Kensington, Aldermore, Together Money, Pepper Money, Norton Home Loans, MBS Lending, Bluestone, Vida Homeloans
- FCA regulated
- Phone: 0203 411 1009 | Email: info@mortgagesareus.co.uk

Rules:
- Never give specific rate quotes
- Use UK English throughout
- Keep answers concise — this is a chat
- When someone wants to proceed, direct them to the Free Assessment form or to call
- Be positive: most adverse credit situations CAN be resolved"""


@app.post("/api/public/chat")
async def public_chat(request: Request):
    import anthropic as _ant_module
    _ant_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not _ant_key:
        return JSONResponse({"error": "Chat unavailable — please call 0203 411 1009"}, status_code=503)

    data = await request.json()
    messages = data.get("messages", [])
    if not messages:
        raise HTTPException(status_code=400, detail="No messages")

    _ant = _ant_module.Anthropic(api_key=_ant_key)

    async def stream():
        import json as _json
        try:
            with _ant.messages.stream(
                model="claude-haiku-4-5-20251001",
                max_tokens=500,
                system=_WEBSITE_CHAT_SYSTEM,
                messages=messages[-20:],
            ) as s:
                for text in s.text_stream:
                    yield f"data: {_json.dumps({'text': text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception:
            yield f"data: {_json.dumps({'error': 'Something went wrong. Please try again.'})}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Static files ──────────────────────────────────────────────────────────────

if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return FileResponse("static/index.html")
