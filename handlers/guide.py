import json
import os
from typing import Literal

import anthropic
from pydantic import BaseModel

from rag.pipeline import retrieve

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))


class UIAction(BaseModel):
    type: Literal["click", "fill", "focus"]
    element_id: str
    value: str | None = None


class GuideResponse(BaseModel):
    response: str
    highlight_elements: list[str] = []
    steps: list[str] = []
    navigate_to: Literal["home", "pay", "request", "accounts", "cards", "savings"] | None = None
    speak: bool = True
    not_found_contacts: list[str] = []
    action: Literal["split_completed", "awaiting_contact_info"] | None = None
    actions: list[UIAction] = []


SYSTEM_PROMPT = """\
You are Guide — a warm, proactive AI accessibility assistant built into the bunq banking app.
Your users often have visual impairments. Help them complete banking tasks end-to-end, not just answer questions.

PERSONALITY
- Friendly and encouraging, like a knowledgeable friend — not a help-desk bot.
- Never copy-paste documentation verbatim. Speak in plain, natural sentences.
- Acknowledge what the user has already done: "Great, you've entered Sara! Now let's set the amount."
- If the user is stuck, offer to do the next step for them.

HIGHLIGHT vs ACTIONS — choose one mode per task:

MODE A — GUIDED (user does the steps themselves, you walk them through):
  Use `highlight_elements` with ALL elements for the complete task, in order.
  The UI will highlight each element sequentially as the user taps through them.
  Do NOT put those elements in `actions` — let the user click/fill them.
  Example: user asks "how do I pay?" → highlight_elements: ["btn-send-money", "field-recipient", "field-amount", "btn-pay-confirm"]
  The guide auto-navigates to the right page for each element automatically.

MODE B — AUTOMATED (you do it for the user):
  Use `actions` with fill/click entries to auto-perform the task.
  Do NOT put those elements in `highlight_elements` (they're being handled automatically).
  Use `highlight_elements` only for elements the user still needs to act on after your actions.
  Confirm with the user before executing irreversible actions (payment submission).

Use MODE A when user asks "how do I…" or "show me…" (wants to learn / be guided).
Use MODE B when user gives a direct command with all info: "send €10 to Sara".

ACTIONS (for MODE B):
- type "click"  → taps a button or element
- type "fill"   → types a value into a form field (include `value`)
- type "focus"  → moves keyboard focus to an element
Only reference element_ids from the Available UI elements list.

PAGE STATE
If "Current field values" is shown, the user has already filled those fields.
Acknowledge their progress and suggest the next logical step.

SCOPE
Only answer banking/finance/bunq topics. For off-topic questions:
"I can only help with banking and bunq-related topics."

FORMAT
- Always call format_response as your final tool call.
- steps: max 4 items, imperative verbs, short sentences.
- navigate_to: set to the FIRST page the user needs to visit (orchestrator handles subsequent pages).
- For split bill: call get_contacts first to resolve names, then split_bill.
- Divide bill equally unless user specifies otherwise.
- If contacts not found: include in not_found_contacts and offer email/phone fallback.
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
    {
        "name": "create_payment_link",
        "description": "Create a bunq.me payment link that anyone can use to pay the user. Returns a shareable URL.",
        "input_schema": {
            "type": "object",
            "properties": {
                "amount":      {"type": "number",  "description": "Amount to request in the specified currency"},
                "description": {"type": "string",  "description": "What the payment is for"},
                "currency":    {"type": "string",  "default": "EUR"},
            },
            "required": ["amount", "description"],
        },
    },
    {
        "name": "format_response",
        "description": "Always call this tool to deliver your final answer to the user. Call information-gathering tools first, then call this once to format the response.",
        "input_schema": {
            "type": "object",
            "properties": {
                "response": {
                    "type": "string",
                    "description": "1-2 plain English sentences answering the user's question",
                },
                "highlight_elements": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "UI element IDs to highlight on screen",
                },
                "steps": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Step-by-step instructions, max 4 items, imperative verbs",
                },
                "navigate_to": {
                    "type": "string",
                    "enum": ["home", "pay", "request", "accounts", "cards", "savings"],
                    "description": "Page to navigate to, or omit if no navigation needed",
                },
                "speak": {
                    "type": "boolean",
                    "description": "Whether to read the response aloud",
                },
                "not_found_contacts": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Names that could not be found in bunq contacts",
                },
                "action": {
                    "type": "string",
                    "enum": ["split_completed", "awaiting_contact_info"],
                    "description": "Action status for split bill flow",
                },
                "actions": {
                    "type": "array",
                    "description": "UI actions to perform on behalf of the user: click a button, fill a field, or focus an element. Executed sequentially with visual highlights.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "type":       {"type": "string", "enum": ["click", "fill", "focus"]},
                            "element_id": {"type": "string", "description": "data-element-id of the target element"},
                            "value":      {"type": "string", "description": "Text or number to fill (for fill type only)"},
                        },
                        "required": ["type", "element_id"],
                    },
                },
            },
            "required": ["response"],
        },
    },
]

_FALLBACK = GuideResponse(response="Something went wrong. Please try again.")


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

        if name == "create_payment_link":
            if not account_id:
                return json.dumps({"error": "no account"})
            from handlers.bunq_api import create_payment_link
            result = create_payment_link(
                api_key=api_key,
                account_id=account_id,
                amount=inputs["amount"],
                description=inputs["description"],
                currency=inputs.get("currency", "EUR"),
            )
            return json.dumps(result)

    except Exception as e:
        return json.dumps({"error": str(e)})

    return json.dumps({"error": f"unknown tool: {name}"})


def guide(query: str, page_id: str, page_elements: dict, api_key: str | None = None, page_state: dict | None = None, history: list[dict] | None = None) -> dict:
    elements_str = "\n".join(f"  {k}: {v}" for k, v in page_elements.items())

    state_str = ""
    if page_state:
        filled = {k: v for k, v in page_state.items() if v}
        if filled:
            state_str = "\n\nCurrent field values:\n" + "\n".join(f"  {k}: {v}" for k, v in filled.items())

    user_message = (
        f"Current page: {page_id}\n\n"
        f"Available UI elements:\n{elements_str}"
        f"{state_str}\n\n"
        f"User question: {query}"
    )

    messages = list(history) if history else []
    messages.append({"role": "user", "content": user_message})

    # Tool-use loop — max 8 iterations
    for _ in range(8):
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=[{
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }],
            tools=TOOLS,
            messages=messages,
        )

        if response.stop_reason == "tool_use":
            tool_results = []
            for block in response.content:
                if block.type != "tool_use":
                    continue

                # format_response is the final structured answer — return immediately
                if block.name == "format_response":
                    try:
                        return GuideResponse(**block.input).model_dump()
                    except Exception:
                        return _FALLBACK.model_dump()

                result = _execute_tool(block.name, block.input, api_key)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result,
                })

            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})
            continue

        # end_turn without format_response — force structured output
        if response.stop_reason == "end_turn":
            messages.append({"role": "assistant", "content": response.content})
            forced = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=512,
                system=[{
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }],
                tools=TOOLS,
                tool_choice={"type": "tool", "name": "format_response"},
                messages=messages + [{"role": "user", "content": "Now call format_response with your answer."}],
            )
            for block in forced.content:
                if block.type == "tool_use" and block.name == "format_response":
                    try:
                        return GuideResponse(**block.input).model_dump()
                    except Exception:
                        return _FALLBACK.model_dump()
            break

        break  # unexpected stop reason

    return _FALLBACK.model_dump()
