import os
import json
import anthropic

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

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

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start, end = raw.find("{"), raw.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(raw[start:end])
        return {
            "merchant": "Unknown",
            "amount": 0,
            "currency": "EUR",
            "date": None,
            "category": "other",
            "items": [],
            "payment_method": "unknown",
            "confidence": "low",
            "summary": raw,
        }
