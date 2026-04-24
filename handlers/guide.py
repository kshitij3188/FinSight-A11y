import json
import os
import anthropic
from rag.pipeline import retrieve

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

SYSTEM_PROMPT = """\
You are Guide — an AI accessibility assistant embedded in the bunq banking app.
Help users find features, answer policy questions, and take banking actions.

Rules:
- Simple, clear language. Short sentences. No jargon.
- Only highlight elements that exist in the UI elements list.
- Return ONLY valid JSON — no markdown fences, no text outside JSON.
- Steps: max 4 items. Imperative verbs.
- navigate_to: one of home/pay/accounts/cards/savings or null.
- If no UI action needed, set highlight_elements to [].
- SCOPE: Only answer questions about banking, payments, accounts, cards, savings, budgeting, bunq features, and financial topics. If the question is unrelated to banking or finance, set response to "I can only help with banking and bunq-related questions." and set highlight_elements to [], steps to [], navigate_to to null.

For split bill / contacts flow:
- ALWAYS call get_contacts first to look up names before calling split_bill.
- If some names not found in contacts: include them in not_found_contacts list.
- Offer user two options for missing contacts: provide email/phone OR skip them.
- If user provides contact info in follow-up, call split_bill with that info directly.
- Divide total amount equally unless user specifies otherwise.

Response format:
{
  "response": "one or two plain-English sentences",
  "highlight_elements": ["element-id"],
  "steps": ["Step 1", "Step 2"],
  "navigate_to": null,
  "speak": true,
  "not_found_contacts": [],
  "action": null
}

action field: null | "split_completed" | "awaiting_contact_info"
not_found_contacts: list of names Claude could not find in bunq contacts.
"""

TOOLS = [
    {
        "name": "search_docs",
        "description": "Search bunq help documentation for policies, fees, how-to guides, and feature information.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"}
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_account_balance",
        "description": "Get the user's live account balance, IBAN, and account details from bunq.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_transactions",
        "description": "Get the user's recent transactions from bunq.",
        "input_schema": {
            "type": "object",
            "properties": {
                "count": {"type": "integer", "description": "Number of transactions", "default": 5}
            },
        },
    },
    {
        "name": "get_contacts",
        "description": (
            "Look up user's contacts from bunq payment history by name. "
            "Always call this before split_bill to resolve names to IBAN/email. "
            "Returns found contacts and names that were not found."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "search_names": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of names to search for",
                }
            },
            "required": ["search_names"],
        },
    },
    {
        "name": "split_bill",
        "description": (
            "Send payment requests (RequestInquiry) to multiple people to split a bill. "
            "Each recipient must have at least one of: iban, email, or phone."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "recipients": {
                    "type": "array",
                    "description": "List of recipients with contact info and amount each owes",
                    "items": {
                        "type": "object",
                        "properties": {
                            "display_name": {"type": "string"},
                            "iban":  {"type": "string"},
                            "email": {"type": "string"},
                            "phone": {"type": "string"},
                            "amount": {"type": "number", "description": "Amount this person owes"},
                        },
                        "required": ["display_name", "amount"],
                    },
                },
                "description": {"type": "string", "description": "What the bill is for"},
                "currency":    {"type": "string", "default": "EUR"},
            },
            "required": ["recipients", "description"],
        },
    },
]


def _execute_tool(name: str, inputs: dict, api_key: str | None = None) -> str:
    try:
        if name == "search_docs":
            chunks = retrieve(inputs["query"], k=5)
            return json.dumps({"chunks": chunks})

        if not api_key:
            return json.dumps({"error": "not logged in"})

        from handlers.bunq_api import get_accounts, get_transactions, get_contacts, split_bill

        accounts = get_accounts(api_key)
        account_id = accounts[0]["id"] if accounts else None

        if name == "get_account_balance":
            return json.dumps(accounts[0] if accounts else {"error": "no accounts"})

        if name == "get_transactions":
            if not account_id:
                return json.dumps({"error": "no account"})
            txns = get_transactions(api_key, account_id, inputs.get("count", 5))
            return json.dumps({"transactions": txns})

        if name == "get_contacts":
            if not account_id:
                return json.dumps({"found": [], "not_found": inputs.get("search_names", [])})
            result = get_contacts(api_key, account_id, inputs.get("search_names"))
            return json.dumps(result)

        if name == "split_bill":
            if not account_id:
                return json.dumps({"error": "no account"})
            result = split_bill(
                api_key=api_key,
                account_id=account_id,
                recipients=inputs["recipients"],
                description=inputs["description"],
                currency=inputs.get("currency", "EUR"),
            )
            return json.dumps(result)

    except Exception as e:
        return json.dumps({"error": str(e)})

    return json.dumps({"error": f"unknown tool: {name}"})


def guide(query: str, page_id: str, page_elements: dict, api_key: str | None = None) -> dict:
    elements_str = "\n".join(f"  {k}: {v}" for k, v in page_elements.items())

    user_message = (
        f"Current page: {page_id}\n\n"
        f"Available UI elements:\n{elements_str}\n\n"
        f"User question: {query}"
    )

    messages = [{"role": "user", "content": user_message}]

    # Tool-use loop — max 6 iterations (3 tool calls max)
    for _ in range(6):
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=[{
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},   # prompt caching
            }],
            tools=TOOLS,
            messages=messages,
        )

        if response.stop_reason == "end_turn":
            # Extract final text response
            raw = next(
                (b.text for b in response.content if hasattr(b, "text")), ""
            ).strip()
            break

        if response.stop_reason == "tool_use":
            # Execute all requested tools
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = _execute_tool(block.name, block.input, api_key)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user",      "content": tool_results})
            continue

        break  # unexpected stop reason

    # Parse JSON response
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, UnboundLocalError):
        start = raw.find("{") if 'raw' in dir() else -1
        end   = raw.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(raw[start:end])
            except Exception:
                pass
        return {
            "response": raw if 'raw' in dir() else "Something went wrong.",
            "highlight_elements": [],
            "steps": [],
            "navigate_to": None,
            "speak": True,
            "not_found_contacts": [],
            "action": None,
        }
