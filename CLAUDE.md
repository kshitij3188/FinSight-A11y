# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

bunq hackathon project: multimodal AI accessibility assistant for the bunq banking app. Voice + vision + RAG. Built for low-vision users.

## Running the App

```bash
# One-time setup (first run downloads ~430MB embedding model, takes 3-5 min)
pip install -r requirements.txt
python rag/ingest.py

# Start server
uvicorn app:app --reload
```

App runs at `http://localhost:8000`. Requires `.env` with `ANTHROPIC_API_KEY` set (copy `.env.example`).

## Environment Variables

| Var | Required | Default |
|-----|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | — |
| `BUNQ_API_KEY` | No | sandbox auto-created |
| `BUNQ_ENVIRONMENT` | No | `SANDBOX` |
| `SECRET_KEY` | No | hardcoded dev default |

## Architecture

```
app.py                   FastAPI entrypoint — auth, routing, PAGE_ELEMENTS registry
handlers/
  guide.py               Anthropic tool-use loop → GuideResponse (highlight, steps, UI actions)
  vision.py              Receipt OCR via claude-sonnet-4-6 vision → VisionResponse
  bunq_api.py            bunq REST wrapper — accounts, transactions, contacts, split_bill
rag/
  ingest.py              One-time indexer: chunks all *.md → ChromaDB (BAAI/bge-base-en-v1.5)
  pipeline.py            retrieve(query, k) — BGE embedding → cosine similarity search
frontend/                Single-page HTML/JS/CSS — voice, camera, tab navigation
bunq_help/               68 markdown docs (plans, payments, cards, savings, security, features)
banking_domain/          5 markdown docs (SEPA, IBAN, PSD2, AML/KYC, bunq overview)
hackathon_toolkit/       bunq API tutorial scripts + BunqClient wrapper
```

## Key Design Decisions

**Auth**: Cookie-based session via `itsdangerous`. Mock users loaded from `mock_users.json` at startup — each user carries their own `api_key` used for live bunq calls.

**Guide handler tool-use loop**: Max 8 iterations. `format_response` is a pseudo-tool — when Claude calls it the loop exits immediately and returns structured `GuideResponse`. If Claude hits `end_turn` without calling it, a forced second call with `tool_choice` extracts the response.

**PAGE_ELEMENTS registry** (`app.py:45`): Maps page → element IDs with descriptions. Injected into every Guide prompt so Claude can reference real UI element IDs for highlight/action responses.

**Per-user bunq clients** (`bunq_api.py`): Cached in `_clients` dict keyed by `api_key`. Each gets its own context file (`bunq_context_<last8>.json`) to avoid session collisions.

**RAG**: ChromaDB persistent collection `bunq_docs`. Embedding model loaded once via `@lru_cache`. Ingest walks all `*.md` recursively (400-word chunks, 40-word overlap).

**Vision**: Direct base64 image → Claude vision. No tool use — single call, JSON-only response, fallback on parse error.

## Adding a New Page

1. Add entry to `PAGE_ELEMENTS` in `app.py`
2. Add page HTML tab in `frontend/index.html`
3. Add `navigate_to` enum value in `handlers/guide.py:GuideResponse`

## bunq Sandbox

Get test money: payment from `sugardaddy@bunq.com` (up to EUR 500). See `hackathon_toolkit/03_make_payment.py`.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current
