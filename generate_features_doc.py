"""
Generate bunq Guide — features & workflow overview (no code, no demo).
Run: python generate_features_doc.py
Output: bunq_guide_features.pdf
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.platypus.flowables import Flowable

W, H = A4

GREEN  = HexColor("#00CFB4")
NAVY   = HexColor("#1C1F3B")
BLUE   = HexColor("#2B5EE8")
GREY   = HexColor("#F3F4F6")
DGREY  = HexColor("#6B7280")
BORDER = HexColor("#D1D5DB")
LGREEN = HexColor("#E6FAF7")

def S(name, **kw): return ParagraphStyle(name, **kw)

TITLE  = S("T",  fontName="Helvetica-Bold",    fontSize=26, leading=32, textColor=NAVY, spaceAfter=4)
SUB    = S("ST", fontName="Helvetica",          fontSize=12, leading=17, textColor=GREEN, spaceAfter=4)
META   = S("MT", fontName="Helvetica",          fontSize=9,  leading=13, textColor=DGREY, spaceAfter=12)
H1     = S("H1", fontName="Helvetica-Bold",     fontSize=13, leading=18, textColor=NAVY, spaceBefore=14, spaceAfter=5)
H2     = S("H2", fontName="Helvetica-Bold",     fontSize=10, leading=14, textColor=BLUE, spaceBefore=8,  spaceAfter=3)
BODY   = S("B",  fontName="Helvetica",          fontSize=9.5, leading=14, textColor=NAVY, spaceAfter=3)
BULL   = S("BL", fontName="Helvetica",          fontSize=9.5, leading=14, textColor=NAVY, leftIndent=14, spaceAfter=2)
CAP    = S("C",  fontName="Helvetica-Oblique",  fontSize=8,  leading=11, textColor=DGREY, alignment=TA_CENTER, spaceAfter=8)
LABEL  = S("LB", fontName="Helvetica-Bold",     fontSize=8.5, leading=12, textColor=GREEN)

def sp(n=5):  return Spacer(1, n)
def hr():     return HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceBefore=2, spaceAfter=8)
def b(t):     return Paragraph(f"• &nbsp; {t}", BULL)
def p(t):     return Paragraph(t, BODY)
def h1(t):    return Paragraph(t, H1)
def h2(t):    return Paragraph(t, H2)

def feature_table(rows):
    """Two-column table: feature name | description"""
    t = Table(rows, colWidths=[4.2*cm, 11.1*cm], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0),  NAVY),
        ("TEXTCOLOR",     (0,0), (-1,0),  white),
        ("FONTNAME",      (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTNAME",      (0,1), (0,-1),  "Helvetica-Bold"),
        ("FONTNAME",      (1,1), (1,-1),  "Helvetica"),
        ("FONTSIZE",      (0,0), (-1,-1), 8.5),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("RIGHTPADDING",  (0,0), (-1,-1), 8),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [white, GREY]),
        ("GRID",          (0,0), (-1,-1), 0.4, BORDER),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
        ("TEXTCOLOR",     (0,1), (0,-1),  NAVY),
    ]))
    return t


class FlowChart(Flowable):
    """Hand-drawn ASCII-style flowchart using reportlab drawing primitives."""

    def __init__(self, width=None):
        super().__init__()
        self._w = width or (W - 4.4*cm)
        self._h = 420

    def wrap(self, aw, ah):
        return self._w, self._h

    def draw(self):
        c = self.canv
        w = self._w

        def box(x, y, bw, bh, label, sublabel=None, color=NAVY, text_color=white, radius=8):
            c.setFillColor(color)
            c.setStrokeColor(HexColor("#CCCCCC"))
            c.setLineWidth(0.5)
            c.roundRect(x, y, bw, bh, radius, fill=1, stroke=1)
            c.setFillColor(text_color)
            c.setFont("Helvetica-Bold", 9)
            ty = y + bh/2 + (6 if sublabel else 3)
            c.drawCentredString(x + bw/2, ty, label)
            if sublabel:
                c.setFont("Helvetica", 7.5)
                c.setFillColor(HexColor("#A0AEC0") if color == NAVY else DGREY)
                c.drawCentredString(x + bw/2, y + bh/2 - 8, sublabel)

        def arrow(x1, y1, x2, y2, label=None):
            c.setStrokeColor(DGREY)
            c.setLineWidth(1.2)
            c.line(x1, y1, x2, y2)
            c.setFillColor(DGREY)
            p = c.beginPath()
            p.moveTo(x2, y2)
            p.lineTo(x2 - 4, y2 + 7)
            p.lineTo(x2 + 4, y2 + 7)
            p.close()
            c.drawPath(p, fill=1, stroke=0)
            if label:
                c.setFillColor(DGREY)
                c.setFont("Helvetica-Oblique", 7.5)
                c.drawCentredString((x1+x2)/2 + 14, (y1+y2)/2, label)

        def harrow(x1, y1, x2, label=None):
            """Horizontal arrow"""
            c.setStrokeColor(DGREY)
            c.setLineWidth(1.2)
            c.line(x1, y1, x2, y1)
            c.setFillColor(DGREY)
            p = c.beginPath()
            p.moveTo(x2, y1)
            p.lineTo(x2 - 7, y1 + 4)
            p.lineTo(x2 - 7, y1 - 4)
            p.close()
            c.drawPath(p, fill=1, stroke=0)
            if label:
                c.setFillColor(DGREY)
                c.setFont("Helvetica-Oblique", 7.5)
                c.drawCentredString((x1+x2)/2, y1 + 6, label)

        bw  = 150   # box width
        bh  = 38    # box height
        cx  = w / 2 # center x

        # ── Row 1: User inputs ────────────────────────────────
        y1 = self._h - 50
        # Voice box
        box(cx - 190, y1, 120, bh, "Voice Input", "Web Speech API", GREEN, NAVY)
        # Text box
        box(cx - 55,  y1, 110, bh, "Text Input",  "Chat widget", GREEN, NAVY)
        # Image box
        box(cx + 70,  y1, 120, bh, "Image / Receipt", "Camera or upload", GREEN, NAVY)

        # ── Arrow down ────────────────────────────────────────
        y2 = y1 - 22
        arrow(cx, y1, cx, y2 + 2)

        # ── Row 2: Frontend ──────────────────────────────────
        y2 = y1 - 60
        box(cx - bw/2, y2, bw, bh, "Frontend SPA", "Mock bunq app + AI widget", BLUE, white)
        arrow(cx, y2, cx, y2 - 22 + 2, "POST /guide or /vision")

        # ── Row 3: Backend ───────────────────────────────────
        y3 = y2 - 60
        box(cx - bw/2, y3, bw, bh, "FastAPI Backend", "handlers/guide.py", NAVY, white)
        arrow(cx, y3, cx, y3 - 22 + 2)

        # ── Row 4: Claude ────────────────────────────────────
        y4 = y3 - 60
        box(cx - bw/2, y4, bw, bh, "Claude claude-sonnet-4-6", "Tool use loop + prompt cache", HexColor("#6B21A8"), white)

        # ── Row 5: Tools ─────────────────────────────────────
        y5 = y4 - 70
        tool_w = 90
        gap = 14
        total_w = 5 * tool_w + 4 * gap
        tx = cx - total_w/2

        tools = [
            ("search_docs",     "RAG / ChromaDB"),
            ("get_balance",     "bunq API"),
            ("get_transactions","bunq API"),
            ("get_contacts",    "bunq API"),
            ("split_bill",      "bunq API"),
        ]
        for i, (name, src) in enumerate(tools):
            bx = tx + i * (tool_w + gap)
            box(bx, y5, tool_w, 34, name, src, GREY, NAVY, radius=6)
            # Arrow from Claude to each tool
            c.setStrokeColor(HexColor("#C084FC"))
            c.setLineWidth(0.8)
            tool_cx = bx + tool_w/2
            c.line(cx, y4, tool_cx, y5 + 34)

        # ── Row 6: Response back up ──────────────────────────
        y6 = y5 - 50
        box(cx - bw/2, y6, bw, bh, "JSON Response", "response · highlight_elements · steps", HexColor("#065F46"), white)
        arrow(cx, y5, cx, y6 + bh + 2)

        # ── Row 7: Frontend actions ──────────────────────────
        y7 = y6 - 70
        act_w = 100
        acts = ["Navigate page", "Highlight element", "Speak via TTS", "Show steps"]
        total_aw = len(acts) * act_w + (len(acts)-1) * 10
        ax = cx - total_aw/2
        for i, act in enumerate(acts):
            abx = ax + i * (act_w + 10)
            box(abx, y7, act_w, 30, act, None, GREEN, NAVY, radius=6)
            c.setStrokeColor(HexColor("#6EE7B7"))
            c.setLineWidth(0.8)
            c.line(cx, y6, abx + act_w/2, y7 + 30)

        # Caption
        c.setFillColor(DGREY)
        c.setFont("Helvetica-Oblique", 8)
        c.drawCentredString(w/2, y7 - 14, "Figure 1 — Guide system workflow")


def build():
    out = "/Users/vysakh/Documents/local/bunq_files/bunq_guide_features.pdf"
    doc = SimpleDocTemplate(
        out, pagesize=A4,
        leftMargin=2.2*cm, rightMargin=2.2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title="Guide — Feature Overview",
    )

    s = []

    # Title block
    s += [
        Paragraph("Guide", TITLE),
        Paragraph("Screen-Aware AI Accessibility Assistant for bunq", SUB),
        Paragraph("bunq Hackathon 7.0  ·  April 24–25, 2026  ·  Feature Overview", META),
        HRFlowable(width="100%", thickness=2, color=GREEN, spaceAfter=16),
    ]

    # Intro
    s += [
        p("Guide is a multimodal AI widget embedded in the bunq banking app. "
          "Users ask anything — by voice, text, or by scanning a receipt — and the AI "
          "highlights exactly where to go on screen and speaks the answer aloud. "
          "Built for accessibility: elderly users, visually impaired, first-time banking users."),
        sp(10),
    ]

    # Flowchart
    s += [
        h1("System Workflow"),
        FlowChart(),
        sp(10),
    ]

    # Features table
    s += [
        h1("Features Built"),
        sp(4),
        feature_table([
            ["Feature",               "What it does"],
            ["RAG Pipeline",
             "697 bunq documents (help articles + legal) chunked, embedded, and stored in ChromaDB. "
             "Semantic search returns the most relevant documentation chunks for any user query."],
            ["Tool Use + Caching",
             "Claude chooses which tools to call per query — never fetches more than needed. "
             "System prompt is cached (Anthropic ephemeral cache) reducing token cost by ~90% across the session."],
            ["search_docs",
             "Searches the RAG knowledge base. Triggered for how-to questions, policy queries, fee information, "
             "and feature explanations."],
            ["get_account_balance",
             "Fetches live balance and IBAN from bunq API. Triggered when user asks about their money or account details."],
            ["get_transactions",
             "Fetches recent payments from bunq API. Triggered for spending queries or transaction history."],
            ["get_contacts",
             "Scans the last 200 payment counterparties to build a contact list. Used before every split bill "
             "to look up recipients by name — no manual IBAN entry needed."],
            ["split_bill",
             "Sends RequestInquiry to multiple people via bunq API. Works with IBAN, email, or phone. "
             "Supports partial splits when only some contacts are found."],
            ["Receipt Scanner",
             "User uploads or photographs a receipt. Image is resized to 1024px and compressed to JPEG 75% "
             "before sending. Claude Vision extracts merchant, amount, date, category, and line items."],
            ["Screen Highlights",
             "Every UI element has a unique ID. When Claude responds, the frontend adds a pulsing green glow "
             "to the target element and auto-scrolls it into view. Clears after 8 seconds."],
            ["Voice Input",
             "Browser-native Web Speech API captures microphone input and converts to text — no backend or "
             "external service needed. Works in Chrome and Safari."],
            ["Voice Output (TTS)",
             "Every AI response is spoken aloud via the browser SpeechSynthesis API. Natural rate and pitch. "
             "Can be interrupted if user asks a new question."],
            ["Missing Contact Flow",
             "If a recipient is not found in contacts: user is shown two options — enter their email/phone "
             "directly, or skip them. Chat input pre-fills with their name to reduce typing."],
            ["Live bunq Data",
             "On load, app fetches real balance, IBAN, and transactions from bunq API via the Python SDK. "
             "If API key is not configured, falls back to realistic mock data silently."],
        ]),
        sp(12),
        HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=6),
        Paragraph("bunq Hackathon 7.0  ·  April 24–25, 2026  ·  Amsterdam",
                  S("FT", fontName="Helvetica", fontSize=8, textColor=DGREY, alignment=TA_CENTER)),
    ]

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(DGREY)
        canvas.drawString(2.2*cm, 1.2*cm, "Guide — bunq AI Accessibility Assistant")
        canvas.drawRightString(W - 2.2*cm, 1.2*cm, f"Page {doc.page}")
        canvas.restoreState()

    doc.build(s, onFirstPage=footer, onLaterPages=footer)
    print(f"PDF written → {out}")


if __name__ == "__main__":
    build()
