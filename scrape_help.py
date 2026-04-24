#!/usr/bin/env python3
"""
Scrape all articles from help.bunq.com into structured markdown files.
Discovers URLs via sitemap, extracts full HTML content, organizes by topic.
Deletes empty/error files. Always overwrites.

Run: python3 scrape_help.py
Requires: pip install requests beautifulsoup4 html2text
"""

import os
import re
import time
import requests
from bs4 import BeautifulSoup
import html2text
import xml.etree.ElementTree as ET
from urllib.parse import unquote

SITEMAP_URL  = "https://help.bunq.com/sitemap.xml"
OUTPUT_DIR   = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bunq_help_full")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

# First match wins — order matters
CATEGORY_RULES = [
    ("changelog",     ["bunq-update-", "bunq-update-"]),
    ("announcements", [
        "bunq-wins", "bunq-is-expanding", "introducing-v5", "v4-bunq", "sdk-deprecation",
        "placing-stock-trades-is-temporarily", "apple-pay-is-now-available",
        "update-to-accepted", "bye-maestro", "changes-to-our-wise",
        "update-on-banking-services", "update-on-foreign-currencies",
        "update-regarding", "brexit-update", "we-stand-for-peace",
        "the-bunq-app-now-in-ukrainian", "resolved-why-was",
        "why-was-my-payday-late", "ideal-payments-were-temporarily",
        "unauthorised-paypal-payment",
    ]),
    ("promotions", [
        "earn-cashback", "get-up-to", "get-60-cashback", "get-50-cashback",
        "get-free-isic", "get-100-when", "get-voucher", "win-your-payments",
        "win-a-metal", "win-rewards", "win-your-groceries", "new-boombastic",
        "cashback-is-ending", "cashback-with", "cashback-albert",
        "referral", "invite-my-friends", "jortt-referral",
        "earn-a-lifetime", "earn-interest-with-amplifier",
        "free-for-students", "enjoy-30-days", "eea-residents-can-earn",
        "bunq-deals", "bunq-pack", "bunq-merch", "airline-miles",
        "lets-empower-women", "deutschrap-plus",
    ]),
    ("security", [
        "anti-fraud", "fraud-recovery", "phishing", "scam", "spoof",
        "money-mule", "bitvavo", "odido-data-breach", "security-bulletin",
        "security-measures", "illegal-and-repeated", "your-security",
        "keeping-your-account-secure", "how-wed-handle-a-data-breach",
        "iban-discrimination", "watch-out-for-fake",
    ]),
    ("crypto",   ["crypto", "staking", "rate-guarantee", "do-i-have-to-pay-taxes-on-crypto"]),
    ("stocks",   ["stocks", "stock", "trading-fee", "ginmon", "mifid", "ftt", "financial-transaction-tax", "proxy-voting", "vorabpauschale", "start-investing", "share-trades", "who-can-use-bunq-stocks", "how-do-i-verify-my-german-stocks", "how-do-i-export-an-annual-overview-for-my-easy-investments", "decide-how-your-money-is-invested"]),
    ("savings",  ["massinterest", "savings-account", "savings-tab", "term-deposit", "autosave", "multi-currency-savings", "joint-savings", "how-we-prioritize-your-savings", "withdraw-money-from-my-savings", "foreign-currency-savings", "lock-in-a"]),
    ("business", [
        "business-account", "business-verification", "business-accounts",
        "bookkeeping", "zapier", "autoexport", "auto-export",
        "tap-to-pay", "woocommerce", "director-account",
        "employee-access", "trade-names", "holding-company",
        "my-company-is-inactive", "accept-access-level", "access-levels",
        "four-eye-approval", "who-can-open-a-bunq-business",
        "open-a-business-account", "kontowechsel", "bank-switch",
        "switch-service", "payment-file", "batch", "invoice",
        "autoescuela", "kvk-registration",
    ]),
    ("cards", [
        "card", "apple-pay", "google-pay", "fitbit", "contactless",
        "pin", "chargeback", "mastercard", "maestro",
        "credit-card", "virtual-card", "rotating-cvc", "3ds",
        "tip-protection", "localized-card", "metal-credit",
        "moneysend", "mastercard-click", "card-secondary",
        "daily-card", "daily-payment-limit", "atm-fee", "atm-withdrawal",
        "card-top-up", "personalize-my-bunq-card",
        "easily-rent-a-car", "use-virtual-credit", "custom-designs",
    ]),
    ("payments", [
        "payment", "transfer", "sepa", "ideal", "wero", "swift",
        "bancontact", "sofort", "foreign-currency", "fx-payment",
        "bunqme", "bunq.me", "bunqto", "bunq.to",
        "scheduled", "direct-debit", "split", "bizum",
        "payday", "instant-payment", "recall-instant",
        "iban-name-check", "send-funds-to-the-wrong",
        "foreign-iban", "local-currency-account",
        "receive-payments", "make-a-payment",
        "one-time-fx", "payment-sorter", "payment-correction",
        "how-do-i-find-my-iban", "what-kind-of-iban",
        "bic", "swift-code", "sort-code",
        "cash-deposit", "barzahlen", "paysafecash",
        "add-money", "top-up", "add-my-card", "add-external-bank",
        "going-dutch",
    ]),
    ("features", [
        "finn", "esim", "travel-insurance", "easy-budgeting",
        "budgeting-screen", "net-wealth", "money-insight",
        "home-tab", "bunq-web", "merchant-overview",
        "automatic-payment-categorization", "loyalty-card",
        "debit-reminder", "organize-your-home", "your-profile",
        "bunq-easy-mortgage", "passive-income",
        "auto-round-up", "autovat", "autosave",
        "easy-savings-plan", "bunq-payday",
        "foreign-currency-account", "well-show-you-how",
        "use-the-bunq-app-in-a-language", "dark-mode",
        "side-swipe", "filter-tool", "address-book",
        "biometric-login", "siri-shortcuts", "voice",
        "payment-investigation", "attachment-search",
        "export-statement-of-a-single",
        "types-of-bank-accounts", "bank-account-management",
        "create-and-manage-my-bank-accounts",
        "shared-access", "joint-account",
        "child-account", "open-an-account-for-my-child",
        "pocket-money", "savings-for-my-child",
        "whos-eligible-for-travel", "what-does-the-travel-insurance-cover",
        "auto-accept", "debit-reminders",
        "read-together-topics", "bunq-developer",
    ]),
    ("support",  ["contact-support", "contact-bunq", "contact-sos", "how-to-make-a-formal-complaint", "how-do-i-contact", "support-chat", "instant-support", "kind-of-support", "report-it", "i-think-i-found-a-bug", "issue-with", "troubleshoot", "fix-an-error", "failed-online-payment", "failed-card-payment", "failed-contactless"]),
    ("country",  [
        "netherlands", "germany", "france", "spain", "italy", "ireland",
        "dutch-iban", "german-iban", "french-iban", "spanish-iban", "irish-iban",
        "dutch-ibans", "german-ibans", "french-ibans", "spanish-ibans", "irish-ibans",
        "belgi", "austri", "portugu",
        "ukrainian", "russian", "schufa", "p-konto",
        "vorabpauschale", "steuererkl", "gewerbeanmeldung",
        "btw-number", "extrait-kbis", "modelo-036",
        "escritura", "registro-mercantil", "acta-de-identificacion",
        "garnishment-on-my-dutch", "garnishment-on-my-german", "garnishment-on-my-french",
        "dutch-tax-return", "having-an-account-in-the-netherlands",
        "comment-trouver", "avoir-un-compte", "utiliser-bunq-en-france",
        "kann-ich-bei-bunq", "welche-dokumente", "was-sind-die",
        "wie-kann-ich", "perch-ho", "quando-arriva", "iban-franais",
        "deutsche-ibans", "iban-espaol", "cmo-resuelvo",
        "ich-wurde-betrogen", "wie-man-betrug", "phishing-betrug",
        "geolokalisierung", "was-ist-ein-p-konto",
        "refugee", "expat", "tax-resident",
    ]),
    ("tips",     ["bunq-tips", "pro-tips-for-bunq", "pro-tips-for-small-business"]),
    ("account",  [
        "account", "login", "signup", "sign-up", "verification",
        "identity", "document", "tin", "tax-identification",
        "nationality", "residence", "student", "negative-balance",
        "garnishment", "bankrupt", "restricted", "reopen",
        "personal-information", "legal-name", "lost-a-loved",
        "notification", "device", "log-out", "log-in",
        "security-code", "reset", "biometric",
        "income-information", "source-of-funds",
        "why-do-we-monitor", "why-do-we-request",
        "why-was-my-account", "why-is-my-account",
        "how-do-i-close", "how-do-i-reopen",
        "true-name", "change-my-personal-information",
    ]),
]


def get_category(slug: str) -> str:
    slug_lower = slug.lower()
    for category, keywords in CATEGORY_RULES:
        if any(k in slug_lower for k in keywords):
            return category
    return "general"


def slug_to_filename(slug: str) -> str:
    decoded = unquote(slug)
    safe = re.sub(r"[^\w\-]", "_", decoded)
    safe = re.sub(r"_+", "_", safe).strip("_")
    return safe[:200] + ".md"


def fetch_article_urls() -> list[str]:
    resp = requests.get(SITEMAP_URL, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [
        loc.text.strip()
        for loc in root.findall(".//sm:loc", ns)
        if "/articles/" in (loc.text or "")
    ]


def extract_article(raw: bytes, url: str) -> tuple[str, list[str], str]:
    """Returns (title, topics, markdown_body)."""
    html = raw.decode("utf-8", errors="replace")
    soup = BeautifulSoup(html, "html.parser")

    # Title
    title_tag = soup.find("h1") or soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else url.split("/")[-1]

    # Topic tags
    topics = []
    for a in soup.find_all("a", href=True):
        if "/topics/" in a["href"]:
            t = a.get_text(strip=True)
            if t and t not in topics:
                topics.append(t)

    # Strip noise
    for tag in soup.find_all(["nav", "header", "footer", "script", "style", "noscript", "iframe"]):
        tag.decompose()
    for tag in soup.find_all(class_=lambda c: c and any(
        k in " ".join(c if isinstance(c, list) else [c]).lower()
        for k in ["cookie", "banner", "overlay", "modal", "popup", "consent", "sidebar", "related", "breadcrumb"]
    )):
        tag.decompose()

    h = html2text.HTML2Text()
    h.ignore_links = False
    h.ignore_images = True
    h.body_width = 0
    h.unicode_snob = True
    h.protect_links = True
    h.wrap_links = False

    # Try progressively broader containers until we get real content
    candidates = [
        soup.find("article"),
        soup.find("main"),
        soup.find(attrs={"role": "main"}),
        soup.find(class_=lambda c: c and any(
            k in " ".join(c if isinstance(c, list) else [c]).lower()
            for k in ["article", "content", "body", "post", "interblocks"]
        )),
        soup.find("body"),
        soup,
    ]

    md = ""
    for candidate in candidates:
        if candidate is None:
            continue
        text = h.handle(str(candidate)).strip()
        text = re.sub(r"\n{3,}", "\n\n", text)
        if len(text) > len(md):
            md = text
        if len(md) >= 80:
            break

    return title, topics, md


def process_article(url: str) -> tuple[str, str]:
    """Returns (markdown_content, status)."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30, allow_redirects=True)
        resp.raise_for_status()

        title, topics, body = extract_article(resp.content, url)

        if len(body.strip()) < 30:
            return "", "empty"

        topic_line = f"**Topics:** {', '.join(topics)}\n" if topics else ""
        header = f"# {title}\n\n**Source:** {url}\n{topic_line}\n---\n\n"

        return header + body, "ok"

    except requests.exceptions.HTTPError as e:
        return "", f"error-{e.response.status_code}"
    except Exception as e:
        return "", f"error-{type(e).__name__}"


def main():
    print("Fetching sitemap ...")
    article_urls = fetch_article_urls()
    total = len(article_urls)
    print(f"Found {total} articles\n")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    counts: dict[str, int] = {}
    errors: list[str] = []

    for i, url in enumerate(article_urls, 1):
        slug     = unquote(url.rstrip("/").split("/")[-1])
        category = get_category(slug)
        cat_dir  = os.path.join(OUTPUT_DIR, category)
        os.makedirs(cat_dir, exist_ok=True)
        filepath = os.path.join(cat_dir, slug_to_filename(slug))

        label = slug[:65]
        print(f"[{i:03d}/{total}] {label:<65} ", end="", flush=True)

        content, status = process_article(url)
        counts[status] = counts.get(status, 0) + 1

        if status in ("error", "empty"):
            if os.path.exists(filepath):
                os.remove(filepath)
            print("FAILED" if status == "error" else "EMPTY")
            if status == "error":
                errors.append(url)
        else:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            size_kb = len(content.encode()) / 1024
            print(f"OK ({size_kb:.1f} KB) [{category}]")

        time.sleep(1.0)

    print(f"\n{'='*60}")
    print(f"Total: {total}")
    for s, n in sorted(counts.items()):
        print(f"  {s:<20}: {n}")
    if errors:
        print(f"\nFailed ({len(errors)}):")
        for u in errors:
            print(f"  - {u}")
    print(f"\nFiles: {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
