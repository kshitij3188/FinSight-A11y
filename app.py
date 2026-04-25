import json
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Form, UploadFile, File
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from itsdangerous import URLSafeSerializer, BadSignature
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="bunq Guide API")

# ── Auth helpers ──────────────────────────────────────────────

SECRET_KEY = os.environ.get("SECRET_KEY", "bunq-demo-secret-change-in-prod")
_signer = URLSafeSerializer(SECRET_KEY, salt="session")

# Load mock users once at startup
_USERS_FILE = Path(__file__).parent / "mock_users.json"
_USERS: list[dict] = json.loads(_USERS_FILE.read_text())
_USERS_BY_EMAIL = {u["email"]: u for u in _USERS}


def _set_session(response, user_id: int):
    token = _signer.dumps({"user_id": user_id})
    response.set_cookie("session", token, httponly=True, samesite="lax")


def _get_session_user(request: Request) -> dict | None:
    token = request.cookies.get("session")
    if not token:
        return None
    try:
        data = _signer.loads(token)
        return next((u for u in _USERS if u["id"] == data["user_id"]), None)
    except BadSignature:
        return None


# ── Page element registry ─────────────────────────────────────

PAGE_ELEMENTS: dict[str, dict[str, str]] = {
    "home": {
        "balance-card": "Main balance display showing total account balance",
        "btn-send-money": "Send Money button — tap to send money to someone",
        "btn-request": "Request Money button — tap to request payment from someone",
        "btn-topup": "Top Up button — tap to add money to your account",
        "recent-transactions": "Recent transactions list showing last payments",
        "nav-pay": "Pay tab in navigation bar",
        "nav-accounts": "Accounts tab in navigation bar",
        "nav-cards": "Cards tab in navigation bar",
        "nav-savings": "Savings tab in navigation bar",
    },
    "pay": {
        "field-recipient": "Recipient field — enter name or IBAN of person to pay",
        "field-amount": "Amount field — enter how much money to send (in euros)",
        "field-description": "Description field — optional note for this payment",
        "btn-pay-confirm": "Confirm Payment button — tap to send the payment",
        "btn-pay-cancel": "Cancel button — tap to go back without paying",
        "recent-contacts": "Recent contacts list — tap a name to fill recipient automatically",
    },
    "accounts": {
        "account-main-card": "Main current account card showing balance",
        "account-iban": "IBAN number display — your bank account number for receiving payments",
        "account-bic": "BIC/SWIFT code display — needed for international transfers",
        "btn-copy-iban": "Copy IBAN button — tap to copy your IBAN to clipboard",
        "btn-new-account": "Open New Account button — tap to create an additional account",
        "account-savings-card": "Savings account card",
    },
    "cards": {
        "card-display": "Your virtual bunq card showing card number and expiry",
        "btn-freeze-card": "Freeze Card button — temporarily disables your card",
        "btn-view-pin": "View PIN button — shows your card PIN securely",
        "btn-card-limits": "Card Limits button — set daily spending and ATM limits",
        "toggle-online-payments": "Toggle for enabling or disabling online payments",
        "toggle-contactless": "Toggle for enabling or disabling contactless payments",
        "btn-order-card": "Order Physical Card button",
    },
    "savings": {
        "savings-pot": "Main savings pot showing progress toward your goal",
        "savings-progress-bar": "Progress bar showing how close you are to your savings goal",
        "savings-goal-amount": "Savings goal amount display",
        "btn-add-savings": "Add Money to Savings button",
        "btn-auto-save": "Auto-Save Settings button — set up automatic saving rules",
        "massinterest-rate": "Interest rate display showing current bunq massinterest rate",
        "btn-set-goal": "Set New Goal button",
    },
}


# ── Request models ────────────────────────────────────────────

class GuideRequest(BaseModel):
    query: str
    page_id: str = "home"
    page_state: dict = {}
    history: list[dict] = []


class VisionRequest(BaseModel):
    image_base64: str
    media_type: str = "image/jpeg"


# ── Auth routes ───────────────────────────────────────────────

@app.get("/login", response_class=HTMLResponse)
def login_page():
    return FileResponse(str(Path(__file__).parent / "frontend" / "login.html"))


@app.post("/auth/login")
async def auth_login(request: Request, email: str = Form(...), password: str = Form(...)):
    user = _USERS_BY_EMAIL.get(email.lower().strip())
    if not user or user["password"] != password:
        return HTMLResponse(
            content=_login_error("Invalid email or password."),
            status_code=401,
        )
    response = RedirectResponse(url="/", status_code=302)
    _set_session(response, user["id"])
    return response


@app.get("/auth/logout")
def auth_logout():
    response = RedirectResponse(url="/login", status_code=302)
    response.delete_cookie("session")
    return response


def _login_error(msg: str) -> str:
    login_html = Path(__file__).parent / "frontend" / "login.html"
    html = login_html.read_text()
    error_block = f'<div class="login-error">{msg}</div>'
    return html.replace("<!--ERROR_PLACEHOLDER-->", error_block)


# ── API routes ────────────────────────────────────────────────

@app.post("/guide")
async def guide_endpoint(req: GuideRequest, request: Request):
    user = _get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not logged in")

    if req.page_id not in PAGE_ELEMENTS:
        raise HTTPException(status_code=400, detail=f"Unknown page: {req.page_id}")

    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")

    try:
        from handlers.guide import guide
        result = guide(req.query, req.page_id, PAGE_ELEMENTS[req.page_id], api_key=user["api_key"], page_state=req.page_state, history=req.history)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


MAX_IMAGE_BYTES = 2 * 1024 * 1024

@app.post("/vision")
async def vision_endpoint(req: VisionRequest, request: Request):
    user = _get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not logged in")

    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")

    if len(req.image_base64) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image too large. Max 2 MB after encoding.")

    try:
        from handlers.vision import analyse_receipt
        return analyse_receipt(req.image_base64, req.media_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stt")
async def stt_endpoint(request: Request, audio: UploadFile = File(...)):
    user = _get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not logged in")
    if not os.environ.get("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set")
    try:
        from handlers.stt import transcribe
        data = await audio.read()
        text = transcribe(data, audio.filename or "audio.webm")
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class TTSRequest(BaseModel):
    text: str


@app.post("/tts")
async def tts_endpoint(req: TTSRequest, request: Request):
    user = _get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not logged in")
    try:
        from handlers.tts import synthesize
        audio = await synthesize(req.text)
        return Response(content=audio, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    chroma_ready = (Path(__file__).parent / "chroma_db").exists()
    return {"status": "ok", "chroma_ready": chroma_ready}


@app.get("/api/me")
def api_me(request: Request):
    user = _get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not logged in")
    return {"id": user["id"], "name": user["name"], "email": user["email"]}


@app.get("/api/accounts")
def api_accounts(request: Request):
    user = _get_session_user(request)
    if not user:
        return {"accounts": [], "mock": True}
    try:
        from handlers.bunq_api import get_accounts
        return {"accounts": get_accounts(user["api_key"]), "mock": False}
    except Exception as e:
        return {"accounts": [], "mock": True, "error": str(e)}


@app.get("/api/transactions")
def api_transactions(request: Request, account_id: int = 0, count: int = 10):
    user = _get_session_user(request)
    if not user or account_id == 0:
        return {"transactions": [], "mock": True}
    try:
        from handlers.bunq_api import get_transactions
        return {"transactions": get_transactions(user["api_key"], account_id, count), "mock": False}
    except Exception as e:
        return {"transactions": [], "mock": True, "error": str(e)}


# ── Frontend ──────────────────────────────────────────────────

frontend_dir = Path(__file__).parent / "frontend"
if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

    @app.get("/")
    def root(request: Request):
        user = _get_session_user(request)
        if not user:
            return RedirectResponse(url="/login", status_code=302)
        return FileResponse(str(frontend_dir / "index.html"))
