---
name: FinSight-A11y Project Context
description: Core architecture, tech stack, and known bugs found during workflow audit of FinSight-A11y
type: project
---

FinSight-A11y is a hackathon project: a bunq banking app accessibility layer with voice assistant, receipt vision, and UI highlighting for low-vision users.

**Stack:**
- FastAPI backend (app.py), served on port 8000
- Vanilla JS SPA frontend (frontend/app.js, index.html, style.css, login.html)
- Claude claude-sonnet-4-6 via Anthropic SDK for guide (tool-use loop) and vision (receipt OCR)
- ChromaDB + BAAI/bge-base-en-v1.5 for RAG (rag/pipeline.py, rag/ingest.py)
- bunq Sandbox API via hackathon_toolkit-main/bunq_client.py
- Session auth via itsdangerous URLSafeSerializer (cookie "session")
- Mock users in mock_users.json (10 accounts, password "Demo1234")

**Key facts:**
- chroma_db/ EXISTS at project root (already ingested)
- .env EXISTS and has ANTHROPIC_API_KEY set
- Frontend is served at /static (StaticFiles mount), index at /
- The BunqClient stores per-user context files as bunq_context_{last8chars}.json in CWD

**Known bugs found in audit (2026-04-25):**
See bug report in conversation. Critical: CONTEXT_FILE race condition, empty tool_results crash,
object URL revoked before use. High: image size check uses base64 string length not decoded bytes,
fetch() override double-reads response body. Medium: missing aria-live for highlights, focus not managed after navigation, toggleSwitch announce() missing.

**Why:** Hackathon context — prioritize working demo over perfect architecture.
**How to apply:** When suggesting fixes, keep them minimal and demo-safe. Don't refactor large chunks.
