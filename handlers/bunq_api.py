import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "hackathon_toolkit"))
import bunq_client as _bc_mod
from bunq_client import BunqClient

# Per-user client cache keyed by api_key
_clients: dict[str, BunqClient] = {}


def _get_client(api_key: str) -> BunqClient:
    if api_key in _clients:
        return _clients[api_key]

    sandbox = os.environ.get("BUNQ_ENVIRONMENT", "SANDBOX").upper() != "PRODUCTION"

    # Give each user their own context file so sessions don't collide
    original_ctx = _bc_mod.CONTEXT_FILE
    _bc_mod.CONTEXT_FILE = f"bunq_context_{api_key[-8:]}.json"
    try:
        client = BunqClient(api_key=api_key, sandbox=sandbox)
        client.authenticate()
    finally:
        _bc_mod.CONTEXT_FILE = original_ctx

    _clients[api_key] = client
    return client


def get_accounts(api_key: str) -> list[dict]:
    client = _get_client(api_key)
    items = client.get(f"user/{client.user_id}/monetary-account")
    result = []
    for item in items:
        acc_type = next(iter(item))
        acc = item[acc_type]
        if acc.get("status") != "ACTIVE":
            continue
        aliases = acc.get("alias", [])
        iban = next((a["value"] for a in aliases if a.get("type") == "IBAN"), None)
        balance = acc.get("balance", {})
        result.append({
            "id": acc["id"],
            "name": acc.get("description") or "Account",
            "balance": float(balance.get("value", 0)),
            "currency": balance.get("currency", "EUR"),
            "iban": iban,
        })
    return result


def get_contacts(api_key: str, account_id: int, search_names: list[str] | None = None) -> dict:
    client = _get_client(api_key)
    items = client.get(
        f"user/{client.user_id}/monetary-account/{account_id}/payment",
        params={"count": "200"},
    )

    seen: dict[str, dict] = {}
    for item in items:
        try:
            p = item.get("Payment", {})
            ca = p.get("counterparty_alias", {})
            lma = ca.get("label_monetary_account", {})
            name = (lma.get("display_name") or ca.get("display_name") or "").strip()
            if not name:
                continue
            key = name.lower()
            if key not in seen:
                aliases = lma.get("alias", [])
                seen[key] = {
                    "display_name": name,
                    "iban":  next((a["value"] for a in aliases if a.get("type") == "IBAN"),         None),
                    "email": next((a["value"] for a in aliases if a.get("type") == "EMAIL"),        None),
                    "phone": next((a["value"] for a in aliases if a.get("type") == "PHONE_NUMBER"), None),
                }
        except Exception:
            continue

    if not search_names:
        return {"found": list(seen.values()), "not_found": []}

    found, not_found = [], []
    for target in search_names:
        key = target.lower().strip()
        match = seen.get(key) or next(
            (c for k, c in seen.items() if key in k or k in target.lower()), None
        )
        if match:
            found.append(match)
        else:
            not_found.append(target)

    return {"found": found, "not_found": not_found}


def split_bill(
    api_key: str,
    account_id: int,
    recipients: list[dict],
    description: str,
    currency: str = "EUR",
) -> dict:
    client = _get_client(api_key)
    endpoint = f"user/{client.user_id}/monetary-account/{account_id}/request-inquiry"

    results = []
    errors  = []

    for r in recipients:
        try:
            if r.get("iban"):
                pointer = {"type": "IBAN",         "value": r["iban"],  "name": r.get("display_name", "")}
            elif r.get("email"):
                pointer = {"type": "EMAIL",        "value": r["email"], "name": r.get("display_name", "")}
            elif r.get("phone"):
                pointer = {"type": "PHONE_NUMBER", "value": r["phone"], "name": r.get("display_name", "")}
            else:
                errors.append({"name": r.get("display_name"), "error": "no contact info"})
                continue

            amount_str = f"{float(r['amount']):.2f}"
            resp = client.post(endpoint, {
                "amount_inquired":    {"value": amount_str, "currency": currency},
                "counterparty_alias": pointer,
                "description":        description,
                "allow_bunqme":       True,
            })
            request_id = resp[0]["Id"]["id"]
            results.append({
                "name":   r.get("display_name"),
                "amount": amount_str,
                "id":     request_id,
            })
        except Exception as e:
            errors.append({"name": r.get("display_name"), "error": str(e)})

    return {
        "sent":       results,
        "errors":     errors,
        "total_sent": len(results),
    }


def make_payment(
    api_key: str,
    account_id: int,
    recipient: str,
    amount: float,
    description: str = "Payment via bunq Guide",
    currency: str = "EUR",
) -> dict:
    client = _get_client(api_key)
    amount_str = f"{float(amount):.2f}"

    # Resolve recipient → pointer type
    r = recipient.strip()
    if "@" in r:
        pointer = {"type": "EMAIL", "value": r, "name": r}
    elif len(r) >= 15 and r[:2].isalpha() and r[2:4].isdigit():
        # Looks like an IBAN (e.g. NL21ABNA...)
        iban_clean = r.replace(" ", "").upper()
        pointer = {"type": "IBAN", "value": iban_clean, "name": "Recipient"}
    elif r.startswith("+") or (r.replace(" ", "").isdigit() and len(r) >= 8):
        pointer = {"type": "PHONE_NUMBER", "value": r, "name": r}
    else:
        # Try to resolve name via payment history
        contacts = get_contacts(api_key, account_id, search_names=[r])
        found = contacts.get("found", [])
        if not found:
            raise ValueError(f"Could not resolve '{r}' — provide an IBAN, email, or phone number.")
        c = found[0]
        if c.get("iban"):
            pointer = {"type": "IBAN",         "value": c["iban"],  "name": c["display_name"]}
        elif c.get("email"):
            pointer = {"type": "EMAIL",        "value": c["email"], "name": c["display_name"]}
        elif c.get("phone"):
            pointer = {"type": "PHONE_NUMBER", "value": c["phone"], "name": c["display_name"]}
        else:
            raise ValueError(f"No contact info found for '{r}'.")

    resp = client.post(
        f"user/{client.user_id}/monetary-account/{account_id}/payment",
        {
            "amount": {"value": amount_str, "currency": currency},
            "counterparty_alias": pointer,
            "description": description,
        },
    )
    payment_id = resp[0]["Id"]["id"]
    return {
        "payment_id": payment_id,
        "amount": amount_str,
        "currency": currency,
        "recipient": pointer.get("name") or recipient,
        "description": description,
    }


def create_payment_link(
    api_key: str,
    account_id: int,
    amount: float,
    description: str,
    currency: str = "EUR",
) -> dict:
    client = _get_client(api_key)
    amount_str = f"{float(amount):.2f}"
    resp = client.post(
        f"user/{client.user_id}/monetary-account/{account_id}/bunqme-tab",
        {
            "bunqme_tab_entry": {
                "amount_inquired": {"value": amount_str, "currency": currency},
                "description": description,
            }
        },
    )
    tab_id = resp[0]["Id"]["id"]
    tab_data = client.get(
        f"user/{client.user_id}/monetary-account/{account_id}/bunqme-tab/{tab_id}"
    )
    tab = tab_data[0]["BunqMeTab"]
    return {
        "tab_id": tab_id,
        "url": tab.get("bunqme_tab_share_url", ""),
        "amount": amount_str,
        "currency": currency,
        "description": description,
        "status": tab.get("status", ""),
    }


def get_received_requests(api_key: str, count: int = 20) -> list[dict]:
    client = _get_client(api_key)
    accounts = get_accounts(api_key)
    if not accounts:
        return []
    account_id = accounts[0]["id"]
    items = client.get(
        f"user/{client.user_id}/monetary-account/{account_id}/request-inquiry",
        params={"count": str(count)},
    )
    result = []
    for item in items:
        r = item.get("RequestInquiry", {})
        ca = r.get("counterparty_alias", {})
        lma = ca.get("label_monetary_account", {})
        requester = lma.get("display_name") or ca.get("display_name") or "Unknown"
        amount = r.get("amount_inquired", {})
        result.append({
            "id":          r.get("id"),
            "requester":   requester,
            "amount":      float(amount.get("value", 0)),
            "currency":    amount.get("currency", "EUR"),
            "description": r.get("description") or "",
            "status":      r.get("status", ""),
            "created":     r.get("created", ""),
        })
    return result


def register_push_filter(api_key: str) -> dict:
    client = _get_client(api_key)
    resp = client.post(
        f"user/{client.user_id}/notification-filter-push",
        {"notification_filters": [{"category": "MUTATION"}]},
    )
    return {"status": "registered", "filters": resp}


def get_transactions(api_key: str, account_id: int, count: int = 10) -> list[dict]:
    client = _get_client(api_key)
    items = client.get(
        f"user/{client.user_id}/monetary-account/{account_id}/payment",
        params={"count": str(count)},
    )

    result = []
    for item in items:
        p = item.get("Payment", {})
        ca = p.get("counterparty_alias", {})
        lma = ca.get("label_monetary_account", {})
        counterpart = (
            lma.get("display_name")
            or ca.get("display_name")
            or "Unknown"
        )
        aliases = lma.get("alias", [])
        iban = next((a["value"] for a in aliases if a.get("type") == "IBAN"), None)
        amount = p.get("amount", {})
        result.append({
            "id":          p.get("id"),
            "amount":      float(amount.get("value", 0)),
            "currency":    amount.get("currency", "EUR"),
            "counterpart": counterpart,
            "iban":        iban,
            "description": p.get("description") or "",
            "created":     p.get("created", ""),
        })
    return result