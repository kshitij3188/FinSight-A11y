"""
Generate bunq Guide — clean technical summary PDF.
Run: python generate_doc.py
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)

W, H = A4

# Colours
GREEN  = HexColor("#00CFB4")
NAVY   = HexColor("#1C1F3B")
GREY   = HexColor("#F3F4F6")
DGREY  = HexColor("#6B7280")
BORDER = HexColor("#D1D5DB")
CODEBG = HexColor("#F8F9FA")

def style(name, **kw):
    return ParagraphStyle(name, **kw)

H1   = style("H1",   fontName="Helvetica-Bold", fontSize=14, leading=18,
             textColor=NAVY, spaceBefore=16, spaceAfter=4)
H2   = style("H2",   fontName="Helvetica-Bold", fontSize=11, leading=15,
             textColor=NAVY, spaceBefore=10, spaceAfter=3)
BODY = style("BODY", fontName="Helvetica",      fontSize=9.5, leading=14,
             textColor=NAVY, spaceAfter=4)
BULL = style("BULL", fontName="Helvetica",      fontSize=9.5, leading=14,
             textColor=NAVY, leftIndent=12, spaceAfter=2)
CODE = style("CODE", fontName="Courier",        fontSize=8.5, leading=13,
             textColor=HexColor("#1F2937"), backColor=CODEBG,
             leftIndent=10, rightIndent=10, spaceBefore=4, spaceAfter=6,
             borderPadding=(6, 8, 6, 8), borderColor=BORDER,
             borderWidth=0.5, borderRadius=4)
CAP  = style("CAP",  fontName="Helvetica-Oblique", fontSize=8, leading=11,
             textColor=DGREY, alignment=TA_CENTER, spaceAfter=6)
SMLL = style("SMLL", fontName="Helvetica", fontSize=8.5, leading=12,
             textColor=DGREY)

def sp(n=4):  return Spacer(1, n)
def hr():     return HRFlowable(width="100%", thickness=0.5, color=BORDER,
                                spaceBefore=2, spaceAfter=6)
def b(t):     return Paragraph(f"• {t}", BULL)
def h1(t):    return Paragraph(t, H1)
def h2(t):    return Paragraph(t, H2)
def p(t):     return Paragraph(t, BODY)
def code(t):  return Paragraph(t.replace("\n", "<br/>").replace(" ", "&nbsp;"), CODE)
def cap(t):   return Paragraph(t, CAP)

def tbl(data, widths=None, head_bg=NAVY):
    t = Table(data, colWidths=widths, repeatRows=1)
    n = len(data)
    ts = TableStyle([
        ("BACKGROUND",    (0,0), (-1,0),  head_bg),
        ("TEXTCOLOR",     (0,0), (-1,0),  white),
        ("FONTNAME",      (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,-1), 8.5),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 7),
        ("RIGHTPADDING",  (0,0), (-1,-1), 7),
        ("FONTNAME",      (0,1), (-1,-1), "Helvetica"),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [white, GREY]),
        ("GRID",          (0,0), (-1,-1), 0.4, BORDER),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
    ])
    t.setStyle(ts)
    return t


def build():
    out = "/Users/vysakh/Documents/local/bunq_files/bunq_guide_summary.pdf"
    doc = SimpleDocTemplate(
        out, pagesize=A4,
        leftMargin=2.2*cm, rightMargin=2.2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title="Guide — bunq AI Accessibility Assistant",
    )

    s = []  # story

    # ── Title block ───────────────────────────────────────────
    s += [
        Paragraph("Guide", style("T", fontName="Helvetica-Bold", fontSize=28,
                  leading=34, textColor=NAVY, spaceAfter=2)),
        Paragraph("Screen-Aware AI Accessibility Assistant for bunq",
                  style("ST", fontName="Helvetica", fontSize=13, leading=18,
                        textColor=GREEN, spaceAfter=6)),
        Paragraph("bunq Hackathon 7.0  ·  April 24–25, 2026  ·  Amsterdam",
                  style("MT", fontName="Helvetica", fontSize=9, leading=13,
                        textColor=DGREY, spaceAfter=10)),
        HRFlowable(width="100%", thickness=2, color=GREEN, spaceAfter=14),
    ]

    # ── 1. Overview ───────────────────────────────────────────
    s += [
        h1("1. What is Guide?"),
        p("Guide is a floating AI widget embedded in the bunq banking app. "
          "Users ask a question by voice or text. The AI reads the current screen, "
          "calls the right tools, then highlights the exact UI element the user needs "
          "and speaks step-by-step instructions aloud."),
        p("<b>Target users:</b> elderly users, visually impaired users, first-time banking app users."),
        sp(4),
        h2("Core interaction"),
        tbl([
            ["Step", "What happens"],
            ["1", "User asks: \"How do I send money?\" — via voice or text input"],
            ["2", "AI identifies current page and available UI elements"],
            ["3", "Claude calls the right tools (RAG docs or live bunq API)"],
            ["4", "Frontend highlights the target button with a pulsing green glow"],
            ["5", "AI speaks the answer aloud and shows numbered steps in widget"],
        ], widths=[1.5*cm, 13.8*cm]),
        sp(6),
    ]

    # ── 2. Architecture ───────────────────────────────────────
    s += [
        h1("2. System Architecture"),
        code(
            "User (voice / text)\n"
            "       |\n"
            "       v\n"
            "Frontend  —  mock bunq SPA + floating AI widget\n"
            "       |  POST /guide { query, page_id }\n"
            "       v\n"
            "FastAPI backend  (handlers/guide.py)\n"
            "       |\n"
            "       v\n"
            "Claude claude-sonnet-4-6  [Tool Use mode]\n"
            "  Call 1: picks which tools to call\n"
            "  Call 2: synthesises final JSON response\n"
            "       |\n"
            "   ----+--------------------+------------------+\n"
            "   |                        |                  |\n"
            "   v                        v                  v\n"
            "search_docs()       get_account_balance()  get_transactions()\n"
            "RAG / ChromaDB      bunq Python SDK        bunq Python SDK\n"
            "       |\n"
            "       v\n"
            "Frontend: navigate + highlight element + speak via TTS"
        ),
        sp(6),
    ]

    # ── 3. RAG Pipeline ───────────────────────────────────────
    s += [
        h1("3. RAG Pipeline"),
        h2("Document corpus"),
        tbl([
            ["Source",           "Files", "Size",   "Content"],
            ["bunq Help Center", "619",   "3.1 MB", "Features, payments, cards, crypto, savings, security, legal"],
            ["bunq Legal Docs",  "78",    "1.8 MB", "T&Cs, compliance, privacy, regulatory reports"],
            ["Total",            "697",   "4.9 MB", "Complete bunq knowledge base"],
        ], widths=[4*cm, 1.4*cm, 1.6*cm, 8.3*cm]),
        sp(6),
        h2("Ingestion (run once locally)"),
        tbl([
            ["Stage",    "Detail"],
            ["Chunk",    "~400 words per chunk, 40-word overlap"],
            ["Embed",    "sentence-transformers / all-MiniLM-L6-v2"],
            ["Store",    "ChromaDB PersistentClient at ./chroma_db/  (cosine similarity)"],
            ["Retrieve", "retrieve(query, k=5) — returns top-k matching chunks"],
        ], widths=[2.2*cm, 13.1*cm]),
        sp(6),
        h2("Public interface (only function other modules call)"),
        code(
            "from rag.pipeline import retrieve\n"
            "\n"
            "chunks = retrieve(\"international transfer fees\", k=5)\n"
            "# returns: list[str] — top 5 text chunks from bunq docs\n"
            "\n"
            "# Optional category filter\n"
            "chunks = retrieve(\"fraud\", k=3, category_filter=\"security\")"
        ),
        sp(6),
    ]

    # ── 4. Tool Use ───────────────────────────────────────────
    s += [
        h1("4. Tool Use — Claude decides what to fetch"),
        p("Instead of injecting all possible context every call, Claude receives three tools "
          "and chooses only what it needs. This avoids wasted tokens and enables "
          "natural multi-source reasoning."),
        sp(4),
        tbl([
            ["Tool",                   "Called when...",                                  "Source"],
            ["search_docs(query)",     "User asks how-to, policy, fees, features",        "RAG / ChromaDB"],
            ["get_account_balance()",  "User asks about balance, IBAN, account details",  "bunq API"],
            ["get_transactions(n)",    "User asks about recent payments or spending",      "bunq API"],
        ], widths=[4.5*cm, 7.8*cm, 3*cm]),
        sp(6),
        h2("Two-call loop per message"),
        code(
            "Call 1  (~800 tokens, system prompt CACHED)\n"
            "  Claude sees: query + page context + tool definitions\n"
            "  Claude returns: tool_use -> which tool + inputs\n"
            "\n"
            "  [tool runs locally — zero LLM cost]\n"
            "  RAG retrieve()  OR  bunq API call\n"
            "\n"
            "Call 2  (~300-600 tokens)\n"
            "  Claude sees: tool result\n"
            "  Claude returns: JSON { response, highlight_elements, steps, navigate_to }"
        ),
        sp(6),
    ]

    # ── 5. Prompt Caching ─────────────────────────────────────
    s += [
        h1("5. Prompt Caching"),
        p("The system prompt and tool definitions are identical every request. "
          "Anthropic's ephemeral cache stores them for a 5-minute TTL — "
          "subsequent calls within the window cost ~10% of normal input token price."),
        code(
            "system=[\n"
            "    {\n"
            "        \"type\": \"text\",\n"
            "        \"text\": SYSTEM_PROMPT,\n"
            "        \"cache_control\": {\"type\": \"ephemeral\"}\n"
            "    }\n"
            "]"
        ),
        sp(4),
        h2("Token efficiency"),
        tbl([
            ["Approach",                     "Tokens / msg",  "Smart?"],
            ["Always inject all context",    "~3,000",        "No  — wasteful regardless of query"],
            ["Tool use, no cache",           "~1,100–1,800",  "Yes — only fetches what's needed"],
            ["Tool use + prompt caching",    "~200–400 eff.", "Best — cached prompt + targeted data"],
        ], widths=[6.5*cm, 2.8*cm, 6*cm]),
        sp(6),
    ]

    # ── 6. Demo Scenarios ─────────────────────────────────────
    s += [
        h1("6. Demo Scenarios"),
        tbl([
            ["Query",                                        "Tool called",           "Outcome"],
            ["\"How do I send money to my daughter?\"",      "search_docs()",         "Highlights Send button → navigates to Pay page → speaks 4-step guide"],
            ["\"What is my balance?\"",                      "get_account_balance()", "Highlights balance card → speaks live amount from bunq API"],
            ["\"Any fees for international transfers?\"",    "search_docs()",         "No highlight — speaks fee info from bunq pricing docs"],
            ["\"Show my last 3 payments\"",                  "get_transactions(3)",   "Highlights transaction list → lists 3 payments with amounts"],
        ], widths=[5.5*cm, 3.8*cm, 6*cm]),
        sp(6),
    ]

    # ── 7. Tech Stack ─────────────────────────────────────────
    s += [
        h1("7. Technology Stack"),
        tbl([
            ["Component",    "Technology"],
            ["LLM",          "Claude claude-sonnet-4-6 (Anthropic) — tool use + prompt caching"],
            ["Embeddings",   "sentence-transformers / all-MiniLM-L6-v2"],
            ["Vector DB",    "ChromaDB — local, in-process, no server required"],
            ["Backend",      "FastAPI + uvicorn (Python 3.12)"],
            ["Frontend",     "Vanilla HTML / CSS / JavaScript — single page app"],
            ["Voice input",  "Web Speech API (browser native — no backend needed)"],
            ["Voice output", "SpeechSynthesis API (browser native TTS)"],
            ["Banking data", "bunq Python SDK — live accounts, IBAN, transactions"],
        ], widths=[3*cm, 12.3*cm]),
        sp(6),
    ]

    # ── 8. Accessibility ──────────────────────────────────────
    s += [
        h1("8. Accessibility"),
        tbl([
            ["Feature",               "Implementation"],
            ["ARIA live regions",     "aria-live='polite' — screen readers announce AI responses"],
            ["Semantic labels",       "aria-label on every interactive element"],
            ["Keyboard navigation",   "All elements reachable via Tab, activated via Enter/Space"],
            ["Voice-first",           "Microphone in + TTS out — works without reading or typing"],
            ["Reduced motion",        "@media (prefers-reduced-motion) disables all animations"],
            ["High contrast glow",    "3px green outline + pulsing shadow on highlighted elements"],
        ], widths=[4*cm, 11.3*cm]),
        sp(6),
    ]

    # ── 9. File Structure ─────────────────────────────────────
    s += [
        h1("9. File Structure"),
        code(
            "bunq_files/\n"
            "  app.py                FastAPI server + /guide, /api/accounts, /api/transactions\n"
            "  requirements.txt\n"
            "  .env                  ANTHROPIC_API_KEY + BUNQ_API_KEY\n"
            "  run.sh                Start server\n"
            "\n"
            "  rag/                  << RAG pipeline owner\n"
            "    ingest.py           Run once: chunk + embed + store 697 docs\n"
            "    pipeline.py         retrieve(query, k) — public interface\n"
            "\n"
            "  handlers/\n"
            "    guide.py            Claude tool-use loop + JSON response parsing\n"
            "    bunq_api.py         bunq SDK wrapper (accounts, transactions)\n"
            "\n"
            "  frontend/\n"
            "    index.html          Mock bunq SPA shell\n"
            "    style.css           Design + highlight animations\n"
            "    app.js              Routing, voice, API calls, highlight system\n"
            "\n"
            "  chroma_db/            Built by ingest.py (gitignored)\n"
            "  bunq_help_full/       619 help article markdown files\n"
            "  bunq_legal/           78 legal document markdown files"
        ),
        sp(6),
    ]

    # ── 10. Quick Start ───────────────────────────────────────
    s += [
        h1("10. Quick Start"),
        code(
            "pip install -r requirements.txt\n"
            "\n"
            "# Add API keys to .env\n"
            "cp .env.example .env\n"
            "\n"
            "# Build RAG index once (~5 min)\n"
            "python rag/ingest.py\n"
            "\n"
            "# Start server\n"
            "bash run.sh\n"
            "\n"
            "# Open browser\n"
            "open http://localhost:8000"
        ),
        sp(12),
        HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=6),
        Paragraph("bunq Hackathon 7.0  ·  April 24–25, 2026  ·  Amsterdam",
                  style("FT", fontName="Helvetica", fontSize=8,
                        textColor=DGREY, alignment=TA_CENTER)),
    ]

    def page_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(DGREY)
        canvas.drawString(2.2*cm, 1.2*cm, "Guide — bunq AI Accessibility Assistant")
        canvas.drawRightString(W - 2.2*cm, 1.2*cm, f"Page {doc.page}")
        canvas.restoreState()

    doc.build(s, onFirstPage=page_footer, onLaterPages=page_footer)
    print(f"PDF written → {out}")


if __name__ == "__main__":
    build()
