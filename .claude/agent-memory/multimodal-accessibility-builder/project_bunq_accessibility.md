---
name: bunq-accessibility project inventory
description: Full feature and architecture inventory of the sibling bunq-accessibility repo — used to inform FinSight-A11y integration decisions
type: project
---

bunq-accessibility is a companion hackathon project (bunq Hackathon 7.0, 2026-04-24) at /home/poojamangal/projects/bunq-accessibility. It is a CLI-first multimodal AI banking agent for accessibility that shares the same domain as FinSight-A11y.

**Why:** Understanding its patterns prevents duplicate work and surfaces high-value features to port into FinSight-A11y.

**How to apply:** When the user asks to add a feature to FinSight-A11y, check first whether bunq-accessibility has a working reference implementation. Prefer adapting that code over writing from scratch.

## Architecture (bunq-accessibility)
- FastAPI backend (api.py) — POST /chat, POST /inject-document, POST /reset, GET /
- BankingAgent (agent.py) — multi-turn Claude tool-use loop, claude-sonnet-4-6
- 9 tools in tools.py: list_accounts, get_balance, get_transactions, make_payment, get_product_info, get_flow_steps, search_policy, extract_document, highlight_ui
- highlight_channel.py — in-process event bus; agent emits HighlightEvent, listeners collect and return highlights synchronously in /chat response (no WebSocket)
- retrieval.py — BM25Index over T&C PDF + markdown help docs (rank-bm25); FAISS backend reserved for later
- vision.py — Claude vision extraction of financial documents → structured JSON (vendor, amount_eur, due_date, reference, iban, doc_kind, summary)
- bunq_mock.py — in-memory mock banking API; same signatures as real bunq SDK
- catalog_store.py — structured product/flow knowledge (catalog.json: easy_mortgage, change_address, send_money_abroad) with ordered steps + ui_element ids

## Frontend (bunq-accessibility static/)
- Vanilla JS class BunqAccessApp in app.js
- Lighthouse overlay system: lh-overlay (dark backdrop) + .lh-target (gold pulse outline + glow) + animated mascot that moves next to the highlighted element
- Narration toast: fixed bottom pill showing step narration text with ARIA role="status" aria-live="polite"
- Sequential highlight playback: _applyHighlightsSequential() with 1800ms gap between steps
- Web Speech API: SpeechRecognition (one-shot, not continuous) + SpeechSynthesis; language switches with user lang setting
- TTS speech rate: 0.9 in blind mode, 1.0 otherwise; strips markdown before speaking
- Accessibility mode classes on body: mode-blind, mode-low_vision, mode-dyslexic
- OpenDyslexic font via CDN loaded for dyslexic mode
- ARIA: role="log" aria-live="polite" on chat messages; role="group" with aria-label on mode/lang selectors; aria-pressed on toggle buttons; aria-label on all form inputs; role="status" on narration toast
- Typing indicator: animated three-dot CSS (blink keyframes), removed on response

## Accessibility modes (agent-side)
- default, blind, low_vision, dyslexic — system prompt suffixes in agent.py
- blind: no visual cues, confirm every action, more verbose, state anchoring after tool calls
- low_vision: terse, lean heavily on highlight_ui
- dyslexic: plain short sentences, one idea per sentence, repeat numbers

## Key differences vs FinSight-A11y
- bunq-accessibility: full multi-turn conversation history, accessibility mode switching, Lighthouse highlight pipeline, document vision, BM25 policy retrieval, animated mascot, narration toast, dyslexic font support
- FinSight-A11y: has RAG (ChromaDB), real bunq API integration, auth/login system, split-bill tool, per-page element registry, phone-frame UI
