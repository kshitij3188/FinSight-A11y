import base64
import json
import os
import re
from typing import Literal

import anthropic
from pydantic import BaseModel

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))


class DocumentResponse(BaseModel):
    vendor: str | None = None
    amount: float | None = None
    currency: str = "EUR"
    due_date: str | None = None
    date: str | None = None
    reference: str | None = None
    iban: str | None = None
    doc_kind: Literal["bill", "receipt", "bank_letter", "tax_notice", "other"] = "other"
    category: str = "other"
    items: list[str] = []
    payment_method: Literal["cash", "card", "unknown"] = "unknown"
    confidence: Literal["high", "medium", "low"] = "low"
    summary: str = ""
    raw_text: str | None = None


DOCUMENT_PROMPT = """\
You are reading a financial document — it may be a receipt, bill, invoice, bank letter, or tax notice.

Return ONLY a JSON object — no markdown fences, no explanation — with these keys:
- vendor: company/sender name (string or null)
- amount: total amount as a number e.g. 87.43 (no symbol), or null if absent
- currency: currency code, default "EUR"
- due_date: payment due date "YYYY-MM-DD" (bills/invoices), or null
- date: document/transaction date "YYYY-MM-DD", or null
- reference: invoice or payment reference number (string or null)
- iban: vendor's IBAN if shown (string or null)
- doc_kind: one of "bill", "receipt", "bank_letter", "tax_notice", "other"
- category: one of groceries, food, transport, entertainment, shopping, health, travel, utilities, other
- items: up to 6 line items as "name €price" strings (receipts only), or []
- payment_method: "cash", "card", or "unknown"
- confidence: "high" if clearly readable, "medium" if partial, "low" if unclear
- summary: one plain-English sentence suitable for a voice assistant to read aloud
- raw_text: verbatim quote of the most important 1-3 lines (max 200 chars), or null

Rules:
- amount is a number (not a string), null if not present
- due_date is when payment is owed; date is when the document was issued
- Receipts: fill items, payment_method, date; due_date usually null
- Bills/invoices: fill due_date, reference, iban if visible; items usually []
- Strict JSON: null not "null", numbers not strings for amount
"""


def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


_FALLBACK = DocumentResponse(summary="Could not read this document.", confidence="low")


def analyse_receipt(image_base64: str, media_type: str = "image/jpeg") -> dict:
    """Analyse a base64-encoded image. Used by the /vision endpoint."""
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": media_type, "data": image_base64},
                },
                {"type": "text", "text": DOCUMENT_PROMPT},
            ],
        }],
    )
    raw = "".join(b.text for b in message.content if getattr(b, "type", None) == "text")
    try:
        return DocumentResponse(**_parse_json(raw)).model_dump()
    except Exception:
        return _FALLBACK.model_dump()


def extract_document(image_bytes: bytes, media_type: str = "image/jpeg") -> dict:
    """Analyse raw image bytes. Used by the /upload-document endpoint."""
    image_b64 = base64.standard_b64encode(image_bytes).decode("ascii")
    return analyse_receipt(image_b64, media_type)
