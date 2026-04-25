import json
import os
from typing import Literal

import anthropic
from langsmith import traceable
from langsmith.wrappers import wrap_anthropic
from pydantic import BaseModel

client = wrap_anthropic(anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", "")))


class VisionResponse(BaseModel):
    merchant: str = "Unknown"
    amount: float = 0.0
    currency: str = "EUR"
    date: str | None = None
    category: Literal["groceries", "food", "transport", "entertainment", "shopping", "health", "travel", "utilities", "other"] = "other"
    items: list[str] = []
    payment_method: Literal["cash", "card", "unknown"] = "unknown"
    confidence: Literal["high", "medium", "low"] = "low"
    summary: str = ""


VISION_PROMPT = """\
You are analysing a receipt or invoice image for a banking app.

Extract all available information and return ONLY valid JSON — no markdown, no explanation.

{
  "merchant": "store or restaurant name",
  "amount": 23.40,
  "currency": "EUR",
  "date": "YYYY-MM-DD or null if not visible",
  "category": "one of: groceries, food, transport, entertainment, shopping, health, travel, utilities, other",
  "items": ["item name €price", "..."],
  "payment_method": "cash/card/unknown",
  "confidence": "high/medium/low",
  "summary": "one plain-English sentence describing the purchase"
}

Rules:
- amount is a number (no currency symbol)
- currency default EUR if not shown
- items: max 6 lines, skip if illegible
- If image is not a receipt, set confidence to "low" and explain in summary
"""

_FALLBACK = VisionResponse(summary="Could not parse receipt.")


@traceable(run_type="chain", name="analyse_receipt", metadata={"model": "claude-sonnet-4-6", "task": "receipt_ocr", "component": "vision"})
def analyse_receipt(image_base64: str, media_type: str = "image/jpeg") -> dict:
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": image_base64,
                    },
                },
                {
                    "type": "text",
                    "text": VISION_PROMPT,
                },
            ],
        }],
    )

    raw = message.content[0].text.strip()

    # Strip markdown fences if Claude wrapped the JSON
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1] if len(parts) > 1 else raw
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        return VisionResponse(**json.loads(raw)).model_dump()
    except Exception:
        return _FALLBACK.model_dump()
