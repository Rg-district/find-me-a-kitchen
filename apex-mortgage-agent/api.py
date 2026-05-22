"""Apex Mortgage Agent — FastAPI entry point."""
import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from orchestrator import Orchestrator

app = FastAPI(title="Apex Mortgage Agent", version="1.0.0")
orchestrator = Orchestrator()


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    session_id: str
    messages: list[Message]


class ChatResponse(BaseModel):
    session_id: str
    message: str
    stage: str | None = None


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="No messages provided")
    try:
        text, stage = await orchestrator.process(
            req.session_id,
            [{"role": m.role, "content": m.content} for m in req.messages],
        )
        return ChatResponse(session_id=req.session_id, message=text, stage=stage)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    from memory.client_store import get_profile
    from memory.audit_log import get_log
    return {
        "session_id": session_id,
        "profile": get_profile(session_id),
        "audit_events": len(get_log(session_id)),
    }


@app.get("/health")
async def health():
    return {"status": "ok", "service": "apex-mortgage-agent"}


if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return FileResponse("static/index.html")
