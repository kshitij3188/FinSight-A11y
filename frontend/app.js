/* ============================================================
   bunq Guide — Frontend SPA
   Pages: home | pay | accounts | cards | savings
   Features: page routing, AI widget, highlight system, voice I/O
   ============================================================ */

const API_BASE = '';  // same origin as FastAPI

// ── Live bunq Data State ──────────────────────────────────────
const bunqState = {
  loaded: false,
  mock: true,
  accounts: [],
  transactions: [],
  primaryAccount: null,
  userName: null,
};

// Known test users — used for IBAN lookup on mock transactions
const KNOWN_USERS = {
  'Ayako Mercati':    { iban: 'NL69BUNQ2106218508', email: 'test+9a1a9a4a-c715-4f2c-ba30-22e32fac9ae7@bunq.com' },
  'Corrin Hunt':      { iban: 'NL08BUNQ2106236581', email: 'test+5c456063-82f5-44ed-ab7e-f27b1d1c05eb@bunq.com' },
  'Lydia York':       { iban: 'NL32BUNQ2106231105', email: 'test+561fd0f1-f300-4cd1-9581-9d9f9873e8aa@bunq.com' },
  'Anne Hunt':        { iban: 'NL06BUNQ2106235550', email: 'test+04c80ed6-b442-4973-973b-11829af9dea3@bunq.com' },
  'Ewoud Preece':     { iban: 'NL67BUNQ2106230184', email: 'test+36755822-e924-43c6-afa7-f4b3d8d5b4d0@bunq.com' },
  'Frederieke Doyle': { iban: 'NL04BUNQ2106237138', email: 'test+747ab57d-38ab-42a8-970f-af3d87ea2c7c@bunq.com' },
  'Nancee Taylor':    { iban: 'NL14BUNQ2106230168', email: 'test+4267ed32-596d-4f3a-910e-622711da0999@bunq.com' },
  'Angela Finnegan':  { iban: 'NL87BUNQ2106241852', email: 'test+62e42ac3-0b0d-42ca-a678-42e06e2f704a@bunq.com' },
  'Derick Taylor':    { iban: 'NL63BUNQ2106240538', email: 'test+759ee924-487a-47c6-9c78-7c305ef018e5@bunq.com' },
  'Petros Darcy':     { iban: 'NL36BUNQ2106228414', email: 'test+78e8111a-2083-4885-bf8d-7b9220a97733@bunq.com' },
};

function _matchKnownUser(counterpart) {
  if (!counterpart) return null;
  const q = counterpart.trim().toLowerCase();
  for (const [fullName, data] of Object.entries(KNOWN_USERS)) {
    const fn = fullName.toLowerCase();
    const [first, last] = fn.split(' ');
    if (fn === q) return { fullName, ...data };
    if (first === q) return { fullName, ...data };
    if (last === q) return { fullName, ...data };
    if (`${first[0]}. ${last}` === q) return { fullName, ...data };
    if (`${first} ${last[0]}.` === q) return { fullName, ...data };
    if (q.startsWith(first[0] + '.') && q.endsWith(last)) return { fullName, ...data };
    if (fn.includes(q) || q.includes(first)) return { fullName, ...data };
  }
  return null;
}

function resolveIban(counterpart) {
  return _matchKnownUser(counterpart)?.iban ?? null;
}

function resolveFullName(counterpart) {
  return _matchKnownUser(counterpart)?.fullName ?? counterpart;
}

// Mock fallbacks used when bunq API not configured
const MOCK = {
  balance: '€245.09',
  balanceLabel: 'Two hundred forty five euros nine cents',
  iban: 'NL32BUNQ2106231105',
  bic: 'BUNQNL2A',
  incomeThisMonth: '+€500 income this month',
  transactions: [
    { counterpart: 'Corrin Hunt',      iban: 'NL08BUNQ2106236581', amount: -50.00,  currency: 'EUR', description: 'Dinner split',    cat: 'food',          icon: '🍕', created: 'Today, 19:00',    createdDisplay: 'Today, 19:00' },
    { counterpart: 'Ewoud Preece',     iban: 'NL67BUNQ2106230184', amount: -120.00, currency: 'EUR', description: 'Rent share',      cat: 'payment',       icon: '💳', created: 'Yesterday, 10:00', createdDisplay: 'Yesterday, 10:00' },
    { counterpart: 'Ayako Mercati',    iban: 'NL69BUNQ2106218508', amount: 75.00,   currency: 'EUR', description: 'Concert tickets', cat: 'income',        icon: '💼', created: 'Mon, 14:00',      createdDisplay: 'Mon, 14:00' },
    { counterpart: 'Anne Hunt',        iban: 'NL06BUNQ2106235550', amount: -30.00,  currency: 'EUR', description: 'Coffee + lunch',  cat: 'food',          icon: '☕', created: 'Sun, 12:30',      createdDisplay: 'Sun, 12:30' },
    { counterpart: 'Petros Darcy',     iban: 'NL36BUNQ2106228414', amount: 200.00,  currency: 'EUR', description: 'Freelance work',  cat: 'income',        icon: '💼', created: 'Sat, 09:00',      createdDisplay: 'Sat, 09:00' },
    { counterpart: 'Nancee Taylor',    iban: 'NL14BUNQ2106230168', amount: -18.50,  currency: 'EUR', description: 'Book club',       cat: 'entertainment', icon: '🎬', created: 'Fri, 20:00',      createdDisplay: 'Fri, 20:00' },
    { counterpart: 'Angela Finnegan',  iban: 'NL87BUNQ2106241852', amount: -45.00,  currency: 'EUR', description: 'Groceries run',   cat: 'groceries',     icon: '🛒', created: 'Thu, 16:00',      createdDisplay: 'Thu, 16:00' },
    { counterpart: 'Frederieke Doyle', iban: 'NL04BUNQ2106237138', amount: 60.00,   currency: 'EUR', description: 'Gym fees',        cat: 'payment',       icon: '💳', created: 'Wed, 11:00',      createdDisplay: 'Wed, 11:00' },
  ],
};

async function loadBunqData() {
  try {
    const res = await fetch(`${API_BASE}/api/accounts`);
    const data = await res.json();

    if (!data.mock && data.accounts.length > 0) {
      bunqState.accounts = data.accounts;
      bunqState.primaryAccount = data.accounts[0];
      bunqState.mock = false;

      // Fetch transactions for primary account
      const txRes = await fetch(`${API_BASE}/api/transactions?account_id=${data.accounts[0].id}&count=10`);
      const txData = await txRes.json();
      if (!txData.mock) {
        bunqState.transactions = txData.transactions.map(tx => ({
          counterpart: resolveFullName(tx.counterpart),
          iban: tx.iban || resolveIban(tx.counterpart),
          amount: tx.amount,
          currency: tx.currency,
          description: tx.description || '',
          id: tx.id,
          created: tx.created,
          createdDisplay: new Date(tx.created).toLocaleDateString('en-NL', { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
          ...categorize(tx),
        }));
      }
      bunqState.loaded = true;
      navigateTo(currentPage);  // re-render with real data
    }
  } catch (e) {
    console.log('bunq API unavailable, using mock data');
  }
}

function categorize(tx) {
  const name = (tx.counterpart || '').toLowerCase();
  if (tx.amount > 0) return { cat: 'income', icon: '💼' };
  if (/albert|lidl|jumbo|aldi|grocery/i.test(name)) return { cat: 'groceries', icon: '🛒' };
  if (/netflix|spotify|disney|hbo|prime/i.test(name)) return { cat: 'entertainment', icon: '🎬' };
  if (/ns |ov-|trein|bus|metro/i.test(name)) return { cat: 'transport', icon: '🚆' };
  if (/restaurant|cafe|thuisbezorgd|uber eats|food/i.test(name)) return { cat: 'food', icon: '🍕' };
  return { cat: 'payment', icon: '💳' };
}

function fmt(amount, currency = 'EUR') {
  const abs = Math.abs(amount).toFixed(2);
  return `${amount < 0 ? '−' : '+'}€${abs}`;
}

// ── Page Definitions ──────────────────────────────────────────

const PAGES = {
  home: {
    title: 'Home',
    render: renderHome,
  },
  pay: {
    title: 'Pay',
    render: renderPay,
  },
  request: {
    title: 'Request',
    render: renderRequest,
  },
  accounts: {
    title: 'Accounts',
    render: renderAccounts,
  },
  cards: {
    title: 'Cards',
    render: renderCards,
  },
  savings: {
    title: 'Savings',
    render: renderSavings,
  },
};

let currentPage = 'home';
let currentMode = 'default';
let currentLang = 'en';
let voiceMode   = false;   // user has voice mode ON (persists, gates TTS)
let isListening = false;   // mic is currently open (transient)
let ttsEnabled  = true;    // speech output on/off toggle

// ── Page Renderers ────────────────────────────────────────────

function generateChartData(currentBalance, transactions) {
  const points = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    points.push({ date: new Date(d), balance: 0 });
  }

  if (transactions && transactions.length) {
    // Build balance by working backwards from current balance
    let running = currentBalance;
    const sorted = [...transactions].sort((a, b) => new Date(b.created) - new Date(a.created));
    for (let idx = 6; idx >= 0; idx--) {
      const dayStart = new Date(points[idx].date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      // Subtract transactions that happened after this day to get balance at start of day
      sorted.forEach(tx => {
        const txDate = new Date(tx.created);
        if (txDate >= dayEnd) running -= (tx.amount || 0);
      });
      points[idx].balance = running;
    }
  } else {
    // Deterministic mock relative to current balance
    const rel = [0.65, 0.68, 0.72, 1.60, 1.55, 1.45, 1.0];
    rel.forEach((r, i) => { points[i].balance = Math.round(currentBalance * r * 100) / 100; });
  }
  return points;
}

function renderBalanceChart(currentBalance, transactions) {
  const data = generateChartData(currentBalance, transactions);
  const W = 320, H = 100, padT = 10, padB = 24, padX = 8;
  const innerW = W - padX * 2, innerH = H - padT - padB;
  const balances = data.map(d => d.balance);
  const minB = Math.min(...balances), maxB = Math.max(...balances);
  const range = maxB - minB || 1;
  const pts = data.map((d, i) => ({
    x: padX + (i / 6) * innerW,
    y: padT + (1 - (d.balance - minB) / range) * innerH,
    date: d.date,
  }));
  const pathD = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx = (pt.x - prev.x) / 3;
    return `${acc} C ${(prev.x + cpx).toFixed(1)} ${prev.y.toFixed(1)} ${(pt.x - cpx).toFixed(1)} ${pt.y.toFixed(1)} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, '');
  const areaD = `${pathD} L ${pts[6].x.toFixed(1)} ${H - padB} L ${pts[0].x.toFixed(1)} ${H - padB} Z`;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const labels = pts.map(pt =>
    `<text x="${pt.x.toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="8" fill="#48484A">${days[pt.date.getDay()]}</text>`
  ).join('');
  return `
    <div class="balance-chart-card">
      <div class="chart-header">
        <span class="chart-title">7-day balance</span>
        <span class="chart-current">€${currentBalance.toFixed(2)}</span>
      </div>
      <svg viewBox="0 0 ${W} ${H}" class="balance-chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0A84FF" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#0A84FF" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${areaD}" fill="url(#cg)"/>
        <path d="${pathD}" fill="none" stroke="#0A84FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        ${labels}
        <circle cx="${pts[6].x.toFixed(1)}" cy="${pts[6].y.toFixed(1)}" r="3.5" fill="#0A84FF"/>
      </svg>
    </div>`;
}

function renderHome() {
  const acc = bunqState.primaryAccount;
  const balance = acc ? `€${acc.balance.toFixed(2)}` : MOCK.balance;
  const iban = acc ? acc.iban : MOCK.iban;
  const txns = bunqState.transactions.length ? bunqState.transactions : MOCK.transactions;

  return `
    ${bunqState.userName ? `<div class="account-holder-name">${bunqState.userName}</div>` : ''}
    <div data-element-id="balance-card" class="balance-card" role="region" aria-label="Account balance">
      <div class="balance-label">Total Balance ${bunqState.mock ? '' : '<span style="font-size:10px;opacity:0.6">● live</span>'}</div>
      <div class="balance-amount">${balance}</div>
      <div class="balance-change">${MOCK.incomeThisMonth}</div>
      <div class="balance-iban">${iban || ''}</div>
    </div>

    <div class="quick-actions" role="group" aria-label="Quick actions">
      <button data-element-id="btn-send-money" class="action-btn send" onclick="navigateTo('pay')" aria-label="Send money">
        <span class="action-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5,12 12,5 19,12"/></svg>
        </span>
        <span>Send</span>
      </button>
      <button data-element-id="btn-request" class="action-btn receive" onclick="navigateTo('request')" aria-label="Request money">
        <span class="action-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19,12 12,19 5,12"/></svg>
        </span>
        <span>Request</span>
      </button>
      <button data-element-id="btn-topup" class="action-btn add" onclick="navigateTo('savings')" aria-label="Add to savings">
        <span class="action-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </span>
        <span>Add</span>
      </button>
    </div>

    ${renderBalanceChart(bunqState.primaryAccount?.balance ?? 1247.50, bunqState.transactions)}

    <div class="txn-scroll-container">
      <div class="section-header" style="margin-top:4px">Recent transactions</div>
      <div data-element-id="recent-transactions" role="list" aria-label="Recent transactions">
        ${txns.map((tx, i) => `
          <div class="transaction-item" role="listitem" tabindex="0" aria-label="${tx.counterpart}${tx.iban ? ', IBAN ' + tx.iban : ''}, ${fmt(tx.amount, tx.currency)}" onclick="openTxnDetail(${i})">
            <div class="txn-icon ${tx.cat}">${tx.icon}</div>
            <div class="txn-details">
              <div class="txn-name">${tx.counterpart}</div>
              ${tx.iban ? `<div class="txn-iban">${tx.iban}</div>` : ''}
              <div class="txn-date">${tx.createdDisplay || tx.created}</div>
            </div>
            <div class="txn-amount ${tx.amount < 0 ? 'negative' : 'positive'}">${fmt(tx.amount, tx.currency)}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

const _CONTACT_COLORS = ['#FF6B9D', '#4F46E5', '#10B981', '#F59E0B', '#0A84FF', '#BF5AF2', '#FF6B00'];

function _recentContacts() {
  const seen = new Set();
  const contacts = [];
  for (const tx of bunqState.transactions) {
    const name = tx.counterpart;
    if (!name || seen.has(name)) continue;
    seen.add(name);
    contacts.push({ name, iban: tx.iban || null });
    if (contacts.length === 5) break;
  }
  if (contacts.length === 0) {
    return [
      { name: 'Sarah',    iban: null },
      { name: 'Tom',      iban: null },
      { name: 'Mum',      iban: null },
      { name: 'Gym',      iban: null },
    ];
  }
  return contacts;
}

function renderPay() {
  const contacts = _recentContacts();
  return `
    <div class="section-header">Send Money</div>

    <div class="card">
      <div class="section-header" style="font-size:13px;color:var(--text-secondary);margin-top:0">Recent contacts</div>
      <div data-element-id="recent-contacts" class="recent-contacts" role="list" aria-label="Recent contacts">
        ${contacts.map(({ name, iban }, i) => {
          const safeName = name.replace(/'/g, "\\'");
          const safeIban = (iban || '').replace(/'/g, "\\'");
          const ibanDisplay = iban ? `<div class="contact-iban">${iban}</div>` : '';
          return `
          <div class="contact-chip" role="listitem" tabindex="0" aria-label="Pay ${name}${iban ? ', IBAN ' + iban : ''}" onclick="prefillRecipient('${safeName}', '${safeIban}')">
            <div class="contact-avatar" style="background:${_CONTACT_COLORS[i % _CONTACT_COLORS.length]}">${name[0].toUpperCase()}</div>
            <div class="contact-info">
              <div class="contact-name">${name}</div>
              ${ibanDisplay}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="card pay-form">
      <div data-element-id="field-recipient" class="form-group">
        <label for="input-recipient">Recipient name</label>
        <input type="text" id="input-recipient" placeholder="e.g. Sarah Johnson" aria-label="Recipient full name">
      </div>
      <div data-element-id="field-iban" class="form-group">
        <label for="input-iban">IBAN</label>
        <input type="text" id="input-iban" placeholder="e.g. NL12 BUNQ 0123 4567 89" aria-label="Recipient IBAN" style="font-family:'SF Mono',monospace;letter-spacing:0.5px">
      </div>
      <div data-element-id="field-amount" class="form-group">
        <label for="input-amount">Amount</label>
        <div class="amount-input-wrap">
          <span class="amount-currency" aria-hidden="true">€</span>
          <input type="number" id="input-amount" placeholder="0.00" aria-label="Amount in euros" min="0.01" step="0.01">
        </div>
      </div>
      <div data-element-id="field-description" class="form-group">
        <label for="input-desc">Description <span style="color:var(--text-muted)">(optional)</span></label>
        <input type="text" id="input-desc" placeholder="What's it for?" aria-label="Payment description">
      </div>
      <button data-element-id="btn-pay-confirm" class="btn-primary" aria-label="Confirm and send payment" onclick="submitPayment()">
        Send Payment
      </button>
      <button data-element-id="btn-pay-cancel" class="btn-secondary" onclick="navigateTo('home')" aria-label="Cancel and go back">
        Cancel
      </button>
    </div>`;
}

window.prefillRecipient = function prefillRecipient(name, iban) {
  const nameInput = document.getElementById('input-recipient');
  const ibanInput = document.getElementById('input-iban');
  if (nameInput) nameInput.value = name;
  if (ibanInput) ibanInput.value = iban || '';
  const highlightIds = iban ? ['field-recipient', 'field-iban'] : ['field-recipient'];
  const steps = iban
    ? [`Recipient set to ${name}`, `IBAN set to ${iban} — tap Amount next`]
    : [`Recipient set to ${name} — enter their IBAN or tap Amount`];
  highlightElements(highlightIds, null, steps);
};

function renderRequest() {
  return `
    <div class="section-header">Request Money</div>
    <div class="card pay-form">
      <div data-element-id="field-req-from" class="form-group">
        <label for="input-req-from">From <span style="color:var(--text-muted)">(optional)</span></label>
        <input type="text" id="input-req-from" placeholder="Name, IBAN, email, or phone…" aria-label="Request from person (optional)">
        <div class="field-hint">Leave blank to generate a shareable payment link</div>
      </div>
      <div data-element-id="field-req-amount" class="form-group">
        <label for="input-req-amount">Amount</label>
        <div class="amount-input-wrap">
          <span class="amount-currency" aria-hidden="true">€</span>
          <input type="number" id="input-req-amount" placeholder="0.00" aria-label="Amount to request in euros" min="0.01" step="0.01">
        </div>
      </div>
      <div data-element-id="field-req-desc" class="form-group">
        <label for="input-req-desc">Description <span style="color:var(--text-muted)">(optional)</span></label>
        <input type="text" id="input-req-desc" placeholder="What's it for?" aria-label="Request description">
      </div>
      <button data-element-id="btn-req-confirm" class="btn-primary" onclick="submitRequest()" aria-label="Send payment request or generate link">
        Send Request
      </button>
      <button data-element-id="btn-req-cancel" class="btn-secondary" onclick="navigateTo('home')" aria-label="Cancel and go back">
        Cancel
      </button>
    </div>`;
}

async function submitRequest() {
  const fromVal = document.getElementById('input-req-from')?.value?.trim();
  const amount  = parseFloat(document.getElementById('input-req-amount')?.value);
  const desc    = document.getElementById('input-req-desc')?.value?.trim() || 'Payment request via bunq';

  if (!amount || amount <= 0) { alert('Please enter a valid amount.'); return; }

  const btn = document.querySelector('[data-element-id="btn-req-confirm"]');
  if (btn) { btn.disabled = true; btn.textContent = fromVal ? 'Sending…' : 'Generating link…'; }

  try {
    if (fromVal) {
      // — person-to-person request via split_bill
      const resp = await fetch('/request-person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_name: fromVal, amount, description: desc }),
      });
      if (!resp.ok) { const e = await resp.json(); throw new Error(e.detail || 'Request failed'); }
      const data = await resp.json();

      triggerConfetti();
      const msg = `Payment request of €${parseFloat(data.amount).toFixed(2)} sent to ${data.recipient}! They'll get a notification. 🎉`;
      speak(msg); addMessage(msg, 'bot'); openWidget();
      setTimeout(() => navigateTo('home'), 1800);

    } else {
      // — shareable bunq.me link
      const resp = await fetch('/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description: desc }),
      });
      if (!resp.ok) { const e = await resp.json(); throw new Error(e.detail || 'Link creation failed'); }
      const data = await resp.json();

      _showPaymentLink(data.url, amount, desc);
      const msg = `Payment link for €${parseFloat(amount).toFixed(2)} created! Share it with anyone. 🔗`;
      speak(msg); addMessage(msg, 'bot'); openWidget();
    }

  } catch (e) {
    alert(`Failed: ${e.message}`);
    if (btn) { btn.disabled = false; btn.textContent = 'Send Request'; }
  }
}

function _showPaymentLink(url, amount, desc) {
  const content = document.getElementById('page-content');
  if (!content) return;
  content.innerHTML = `
    <div class="section-header">Payment Link Created</div>
    <div class="card pay-form" style="gap:16px">
      <div style="text-align:center;padding:12px 0">
        <div style="font-size:36px;margin-bottom:8px">🔗</div>
        <div style="font-size:15px;font-weight:600;color:var(--text-primary)">€${parseFloat(amount).toFixed(2)} — ${desc}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Anyone with this link can pay you</div>
      </div>
      <div class="payment-link-box" id="payment-link-url" role="textbox" aria-label="Payment link URL" aria-readonly="true">${url}</div>
      <button class="btn-primary" id="btn-copy-link" onclick="copyPaymentLink('${url}')" aria-label="Copy payment link">
        Copy Link
      </button>
      <button class="btn-secondary" onclick="navigateTo('home')" aria-label="Go back to home">
        Done
      </button>
    </div>`;
}

function copyPaymentLink(url) {
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('btn-copy-link');
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy Link'; }, 2000); }
  }).catch(() => {
    const box = document.getElementById('payment-link-url');
    if (box) { const sel = window.getSelection(); const range = document.createRange(); range.selectNodeContents(box); sel.removeAllRanges(); sel.addRange(range); }
  });
}

function renderAccounts() {
  const acc = bunqState.primaryAccount;
  const balance = acc ? `€${acc.balance.toFixed(2)}` : MOCK.balance;
  const iban = acc ? acc.iban : MOCK.iban;
  const accName = acc ? acc.name : 'Main Account';

  const extraAccounts = bunqState.accounts.slice(1).map((a, i) => `
    <div class="account-card" role="region" aria-label="${a.name}">
      <div class="account-card-header">
        <div><div class="account-card-name">${a.name}</div><div class="account-card-type">Account</div></div>
        <div style="font-size:20px">🏦</div>
      </div>
      <div class="account-card-balance">€${a.balance.toFixed(2)}</div>
      <div class="iban-row"><span class="iban-label">IBAN</span><span class="iban-value">${a.iban || ''}</span></div>
    </div>`).join('');

  return `
    <div class="section-header">My Accounts ${bunqState.mock ? '' : '<span style="font-size:11px;color:var(--bunq-green-dark)">● live</span>'}</div>

    <div data-element-id="account-main-card" class="account-card" role="region" aria-label="Main current account">
      <div class="account-card-header">
        <div>
          <div class="account-card-name">${accName}</div>
          <div class="account-card-type">Current Account</div>
        </div>
        <div style="font-size:20px">💳</div>
      </div>
      <div class="account-card-balance">${balance}</div>
      <div data-element-id="account-iban" class="iban-row" aria-label="IBAN number">
        <span class="iban-label">IBAN</span>
        <span class="iban-value" id="iban-text">${iban || '—'}</span>
        <button data-element-id="btn-copy-iban" class="copy-btn" onclick="copyIban()" aria-label="Copy IBAN to clipboard">Copy</button>
      </div>
      <div data-element-id="account-bic" class="iban-row" aria-label="BIC code">
        <span class="iban-label">BIC</span>
        <span class="iban-value">${MOCK.bic}</span>
      </div>
    </div>

    ${extraAccounts}

    <div data-element-id="account-savings-card" class="account-card" onclick="navigateTo('savings')" role="region" aria-label="Savings account">
      <div class="account-card-header">
        <div>
          <div class="account-card-name">Savings</div>
          <div class="account-card-type">Savings Account • 2.46% interest</div>
        </div>
        <div style="font-size:20px">🎯</div>
      </div>
      <div class="account-card-balance" aria-label="Balance 500 euros">€500.00</div>
    </div>

    <button data-element-id="btn-new-account" class="btn-secondary" style="margin-top:8px" aria-label="Open a new bank account">
      + Open New Account
    </button>`;
}

function renderCards() {
  return `
    <div class="section-header">My Cards</div>

    <div data-element-id="card-display" class="card-visual" role="img" aria-label="bunq debit card ending in 8901">
      <div class="card-logo">bunq</div>
      <div class="card-chip" aria-hidden="true"></div>
      <div class="card-number" aria-label="Card number ending in 8901">•••• •••• •••• 8901</div>
      <div class="card-name">Alex Johnson</div>
      <div class="card-expiry">Expires 04/29</div>
      <div class="mastercard-logo" aria-label="Mastercard">⬤⬤</div>
    </div>

    <div class="card">
      <div class="toggle-row">
        <div>
          <div class="toggle-label">Freeze Card</div>
          <div class="toggle-desc">Temporarily disable all payments</div>
        </div>
        <div data-element-id="btn-freeze-card" class="toggle off" role="switch" aria-checked="false" aria-label="Freeze card" tabindex="0" onclick="toggleSwitch(this)"></div>
      </div>
      <div class="toggle-row">
        <div>
          <div class="toggle-label">Online Payments</div>
          <div class="toggle-desc">Allow payments on websites and apps</div>
        </div>
        <div data-element-id="toggle-online-payments" class="toggle" role="switch" aria-checked="true" aria-label="Online payments" tabindex="0" onclick="toggleSwitch(this)"></div>
      </div>
      <div class="toggle-row">
        <div>
          <div class="toggle-label">Contactless</div>
          <div class="toggle-desc">Tap to pay at terminals</div>
        </div>
        <div data-element-id="toggle-contactless" class="toggle" role="switch" aria-checked="true" aria-label="Contactless payments" tabindex="0" onclick="toggleSwitch(this)"></div>
      </div>
    </div>

    <div class="card" style="display:flex;gap:10px">
      <button data-element-id="btn-view-pin" class="btn-secondary" style="flex:1" aria-label="View your PIN">View PIN</button>
      <button data-element-id="btn-card-limits" class="btn-secondary" style="flex:1" aria-label="Set card spending limits">Card Limits</button>
    </div>

    <button data-element-id="btn-order-card" class="btn-primary" aria-label="Order a physical card">Order Physical Card</button>`;
}

function renderSavings() {
  return `
    <div class="section-header">Savings</div>

    <div data-element-id="savings-pot" class="savings-pot" role="region" aria-label="Savings pot">
      <div class="savings-pot-name">Holiday Fund 🌴</div>
      <div class="savings-pot-amount" aria-label="Saved 500 euros">€500.00</div>
      <div data-element-id="savings-goal-amount" class="savings-pot-goal">Goal: €1,000</div>
      <div data-element-id="savings-progress-bar" class="savings-progress-bar" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" aria-label="50% of goal reached">
        <div class="savings-progress-fill" style="width:50%"></div>
      </div>
      <div class="savings-progress-pct">50% reached</div>
    </div>

    <div class="card" style="display:flex;gap:10px;margin-bottom:16px">
      <button data-element-id="btn-add-savings" class="btn-primary" style="flex:1" aria-label="Add money to savings">Add Money</button>
      <button data-element-id="btn-set-goal" class="btn-secondary" style="flex:1" aria-label="Change savings goal">Change Goal</button>
    </div>

    <div class="card">
      <div class="section-header" style="margin:0 0 12px;font-size:14px">massInterest</div>
      <div class="interest-card">
        <div class="interest-label">Current rate (EUR)</div>
        <div data-element-id="massinterest-rate" class="interest-rate" aria-label="2.46 percent interest rate">2.46%</div>
      </div>
      <div class="interest-card" style="border:none">
        <div class="interest-label">Earned this month</div>
        <div class="interest-rate" style="font-size:16px" aria-label="1 euro 3 cents">€1.03</div>
      </div>
    </div>

    <button data-element-id="btn-auto-save" class="btn-secondary" style="margin-top:4px" aria-label="Set up automatic saving rules">
      ⚡ Auto-Save Settings
    </button>`;
}

// ── Routing ───────────────────────────────────────────────────

function navigateTo(pageId) {
  if (!PAGES[pageId]) return;

  _clearHighlightVisuals();
  currentPage = pageId;

  document.querySelectorAll('.nav-pill').forEach(btn => {
    const active = btn.dataset.page === pageId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active);
  });

  const pageContent = document.getElementById('page-content');
  pageContent.innerHTML = PAGES[pageId].render();
  document.title = `bunq — ${PAGES[pageId].title}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  announce(`Navigated to ${PAGES[pageId].title}`);

  // Move focus to main content so screen readers land on new page (M1)
  pageContent.setAttribute('tabindex', '-1');
  pageContent.focus({ preventScroll: true });

  // Proactive guide for form pages when voice mode is on — skip if orchestrator is mid-sequence
  if (voiceMode && ['pay', 'savings'].includes(pageId) && !Orchestrator.active) {
    setTimeout(() => {
      openWidget();
      sendMessage('Guide me through this page');
    }, 500);
  }
}

// ── Highlight Orchestrator ────────────────────────────────────
// Manages sequential highlight steps. User advances by tapping
// the highlighted element or the mini bar pill. Any other tap cancels.
// Navigates to the correct page when the next step lives elsewhere.

const ELEMENT_PAGE = {
  'balance-card': 'home', 'btn-send-money': 'home', 'btn-request': 'home',
  'btn-topup': 'home', 'recent-transactions': 'home',
  'field-recipient': 'pay', 'field-iban': 'pay', 'field-amount': 'pay', 'field-description': 'pay',
  'btn-pay-confirm': 'pay', 'btn-pay-cancel': 'pay', 'recent-contacts': 'pay',
  'account-main-card': 'accounts', 'account-iban': 'accounts', 'account-bic': 'accounts',
  'btn-copy-iban': 'accounts', 'btn-new-account': 'accounts', 'account-savings-card': 'accounts',
  'card-display': 'cards', 'btn-freeze-card': 'cards', 'btn-view-pin': 'cards',
  'btn-card-limits': 'cards', 'toggle-online-payments': 'cards', 'toggle-contactless': 'cards',
  'btn-order-card': 'cards',
  'savings-pot': 'savings', 'savings-progress-bar': 'savings', 'savings-goal-amount': 'savings',
  'btn-add-savings': 'savings', 'btn-auto-save': 'savings', 'massinterest-rate': 'savings',
  'btn-set-goal': 'savings',
  'field-req-from': 'request', 'field-req-amount': 'request', 'field-req-desc': 'request',
  'btn-req-confirm': 'request', 'btn-req-cancel': 'request',
};

const Orchestrator = {
  steps: [],
  index: 0,
  active: false,
  _currentEl: null,

  start(ids, narrations) {
    this.reset();
    this.steps = ids.map((id, i) => ({ id, narration: narrations[i] || '' }));
    this.active = true;
    this._run();
  },

  advance() {
    if (!this.active) return;
    this._currentEl = null;
    _clearHighlightVisuals();
    this.index++;
    this._run();
  },

  reset() {
    this.active = false;
    this.steps = [];
    this.index = 0;
    this._currentEl = null;
  },

  _run() {
    if (!this.active || this.index >= this.steps.length) {
      this.reset();
      _clearHighlightVisuals();
      restoreWidget();
      return;
    }

    const step = this.steps[this.index];
    const total = this.steps.length;
    const label = total > 1 ? `${step.narration} (${this.index + 1}/${total})` : step.narration;

    let el = document.querySelector(`[data-element-id="${step.id}"]`);
    if (!el) {
      const targetPage = ELEMENT_PAGE[step.id];
      if (targetPage && targetPage !== currentPage) {
        navigateTo(targetPage);
        el = document.querySelector(`[data-element-id="${step.id}"]`);
      }
    }
    if (!el) { this.index++; this._run(); return; }

    document.getElementById('widget-mini-text').textContent = label || step.id;
    this._currentEl = el;
    this._highlight(el, step);
  },

  _highlight(el, step) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('lh-target');
    document.getElementById('lh-overlay').classList.add('active');
    _moveMascot(el);
    if (step.narration) speak(step.narration);

    setTimeout(() => {
      const existing = document.getElementById('ai-arrow-label');
      if (existing) existing.remove();
      const frame = document.querySelector('.phone-frame');
      if (!frame) return;
      const rect = el.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      const arrow = document.createElement('div');
      arrow.className = 'ai-arrow';
      arrow.textContent = '← Here';
      arrow.style.top = `${rect.top - frameRect.top - 32}px`;
      arrow.style.left = `${rect.right - frameRect.left + 8}px`;
      arrow.id = 'ai-arrow-label';
      frame.appendChild(arrow);
    }, 300);

    el.addEventListener('click', () => this.advance(), { once: true });
  },
};

function highlightElements(ids, narration, steps) {
  if (!ids || ids.length === 0) { clearHighlights(); return; }
  const narrations = (steps && steps.length) ? steps : ids.map(() => narration || '');
  minimizeWidget(narrations[0] || ids[0]);
  Orchestrator.start(ids, narrations);
}

function _clearHighlightVisuals() {
  document.querySelectorAll('.lh-target, .ai-highlight').forEach(el => {
    el.classList.remove('lh-target', 'ai-highlight');
  });
  document.getElementById('lh-overlay').classList.remove('active');
  _hideMascot();
  _hideNarration();
  const arrow = document.getElementById('ai-arrow-label');
  if (arrow) arrow.remove();
}

function clearHighlights() {
  Orchestrator.reset();
  _clearHighlightVisuals();
  restoreWidget();
}

function _moveMascot(targetEl) {
  const mascot = document.getElementById('mascot');
  const rect = targetEl.getBoundingClientRect();
  const x = Math.min(rect.right + 12, window.innerWidth - 64);
  const y = Math.max(8, Math.min(rect.top + rect.height / 2 - 22, window.innerHeight - 56));
  mascot.style.transform = `translate(${x}px, ${y}px)`;
  mascot.classList.add('visible');
}

function _hideMascot() {
  const mascot = document.getElementById('mascot');
  if (mascot) mascot.classList.remove('visible');
}

function _showNarration(text) {
  // disabled
  // const toast = document.getElementById('narration-toast');
  // if (toast) { toast.textContent = text; toast.classList.add('visible'); }
}

function _hideNarration() {
  // disabled
  // const toast = document.getElementById('narration-toast');
  // if (toast) toast.classList.remove('visible');
}

function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Accessibility Helpers ─────────────────────────────────────

function announce(msg) {
  const el = document.getElementById('sr-announce') || (() => {
    const div = document.createElement('div');
    div.id = 'sr-announce';
    div.setAttribute('aria-live', 'assertive');
    div.setAttribute('aria-atomic', 'true');
    div.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden';
    document.body.appendChild(div);
    return div;
  })();
  el.textContent = '';
  setTimeout(() => { el.textContent = msg; }, 50);
}

// ── Widget Logic ──────────────────────────────────────────────

const widgetToggle = document.getElementById('widget-toggle');
const widgetPanel = document.getElementById('widget-panel');
const messagesEl = document.getElementById('widget-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');

let pendingAttachment = null; // staged receipt: { objectUrl, base64, mediaType }

const conversationHistory = []; // [{role:'user'|'assistant', content:string}]
const HISTORY_MAX = 5;

function getHistoryPayload() {
  const exchanges = conversationHistory.length / 2;
  if (exchanges <= HISTORY_MAX) return conversationHistory.slice();

  const keepEntries = HISTORY_MAX * 2;
  const older  = conversationHistory.slice(0, conversationHistory.length - keepEntries);
  const recent = conversationHistory.slice(conversationHistory.length - keepEntries);

  const summary = older
    .filter((_, i) => i % 2 === 0)
    .map((entry, i) => `Q: ${entry.content} A: ${older[i * 2 + 1]?.content || ''}`)
    .join(' | ');

  return [
    { role: 'user',      content: `[Earlier conversation summary: ${summary}]` },
    { role: 'assistant', content: 'Understood, I have that context.' },
    ...recent,
  ];
}

const aiWidget = document.getElementById('ai-widget');
let _widgetWasOpen = false;
let _lastClickedEl = null;
document.addEventListener('click', e => {
  _lastClickedEl = e.target;
  if (Orchestrator.active) {
    const miniBar = document.getElementById('widget-mini-bar');
    const onCurrentEl = Orchestrator._currentEl &&
      (Orchestrator._currentEl === e.target || Orchestrator._currentEl.contains(e.target));
    const onMiniBar = miniBar && (miniBar === e.target || miniBar.contains(e.target));
    if (!onCurrentEl && !onMiniBar) {
      Orchestrator.reset();
      _clearHighlightVisuals();
      restoreWidget();
    }
  }
}, { capture: true });

function openWidget() {
  widgetPanel.classList.add('open');
  widgetToggle.classList.add('hidden');
  aiWidget.classList.add('widget-open');
  widgetToggle.setAttribute('aria-expanded', true);
  chatInput.focus();
}

function closeWidget() {
  widgetPanel.classList.remove('open');
  widgetToggle.classList.remove('hidden');
  aiWidget.classList.remove('widget-open');
  widgetToggle.setAttribute('aria-expanded', false);
}

function minimizeWidget(shortText) {
  _widgetWasOpen = widgetPanel.classList.contains('open');
  widgetPanel.classList.remove('open');
  widgetToggle.classList.add('hidden');
  widgetToggle.style.display = 'none';
  aiWidget.classList.remove('widget-open');
  aiWidget.classList.add('widget-minimized');
  document.getElementById('widget-mini-text').textContent = shortText;
}

function restoreWidget() {
  if (!aiWidget.classList.contains('widget-minimized')) return;
  aiWidget.classList.remove('widget-minimized');
  widgetToggle.style.display = '';
  if (_widgetWasOpen) {
    widgetPanel.classList.add('open');
    aiWidget.classList.add('widget-open');
    widgetToggle.classList.add('hidden');
  } else {
    widgetToggle.classList.remove('hidden');
  }
}

widgetToggle.addEventListener('click', openWidget);
widgetToggle.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openWidget(); });
document.getElementById('widget-close-btn').addEventListener('click', closeWidget);
document.getElementById('widget-mini-bar').addEventListener('click', () => {
  if (Orchestrator.active) Orchestrator.advance(); else restoreWidget();
});
document.getElementById('widget-mini-bar').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    if (Orchestrator.active) Orchestrator.advance(); else restoreWidget();
  }
});

// Quick prompts — fill input so user can edit placeholders before sending
document.querySelectorAll('.quick-prompt').forEach(btn => {
  btn.addEventListener('click', () => {
    openWidget();
    chatInput.value = btn.dataset.q;
    chatInput.focus();
    chatInput.setSelectionRange(chatInput.value.length, chatInput.value.length);
  });
});

// Send on enter
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (chatInput.value.trim() || pendingAttachment)) {
    _handleSend();
  }
});

sendBtn.addEventListener('click', () => {
  if (chatInput.value.trim() || pendingAttachment) {
    _handleSend();
  }
});

function _handleSend() {
  if (pendingAttachment) {
    sendAttachment();
  } else {
    const text = chatInput.value.trim();
    if (text) { sendMessage(text); chatInput.value = ''; }
  }
}

// ── Message Rendering ─────────────────────────────────────────

function addMessage(text, role, steps) {
  const msg = document.createElement('div');
  msg.className = `msg ${role}`;
  msg.textContent = text;

  if (steps && steps.length > 0) {
    const stepsEl = document.createElement('div');
    stepsEl.className = 'msg-steps';
    steps.forEach((step, i) => {
      const stepEl = document.createElement('div');
      stepEl.className = 'msg-step';
      stepEl.innerHTML = `<span class="step-num" aria-hidden="true">${i + 1}</span><span>${step}</span>`;
      stepsEl.appendChild(stepEl);
    });
    msg.appendChild(stepsEl);
  }

  messagesEl.appendChild(msg);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return msg;
}

function showTyping() {
  const msg = addMessage('Bunqy is thinking…', 'typing');
  return msg;
}

// ── Page State Capture ────────────────────────────────────────

function capturePageState() {
  const state = {};
  document.querySelectorAll('[data-element-id]').forEach(el => {
    const id = el.dataset.elementId;
    const input = el.querySelector('input, textarea, select');
    if (input && input.value.trim()) state[id] = input.value.trim();
    if (el.getAttribute('role') === 'switch') {
      state[id] = el.getAttribute('aria-checked') === 'true' ? 'on' : 'off';
    }
  });
  return state;
}

// ── AI-Driven UI Actions ──────────────────────────────────────

async function executeActions(actions) {
  const overlay = document.getElementById('lh-overlay');
  for (const action of actions) {
    const el = document.querySelector(`[data-element-id="${action.element_id}"]`);
    if (!el) continue;

    el.classList.add('lh-target');
    overlay.classList.add('active');
    _moveMascot(el);

    await _sleep(600);

    if (action.type === 'click') {
      // If orchestrator is guiding user to this element, skip auto-click — let user tap it
      if (el.classList.contains('lh-target')) { el.classList.remove('lh-target'); continue; }
      el.click();
    } else if (action.type === 'fill') {
      const input = el.querySelector('input, textarea') || (el.matches('input, textarea') ? el : null);
      if (input) {
        input.value = action.value || '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      }
    } else if (action.type === 'focus') {
      el.setAttribute('tabindex', '-1');
      el.focus();
    }

    await _sleep(700);
    el.classList.remove('lh-target');
  }
  overlay.classList.remove('active');
  _hideMascot();
}

// ── API Call ──────────────────────────────────────────────────

async function sendMessage(query) {
  if (!query.trim()) return;

  // Hide suggestions after first message
  const quickPromptsEl = document.getElementById('quick-prompts');
  if (quickPromptsEl) quickPromptsEl.hidden = true;

  addMessage(query, 'user');
  const typingEl = showTyping();

  try {
    const res = await fetch(`${API_BASE}/guide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, page_id: currentPage, page_state: capturePageState(), history: getHistoryPayload() }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Server error');
    }

    const data = await res.json();
    typingEl.remove();

    addMessage(data.response, 'bot', data.steps);

    conversationHistory.push({ role: 'user',      content: query });
    conversationHistory.push({ role: 'assistant', content: data.response });

    // Missing contacts — show options for each unfound person
    if (data.not_found_contacts?.length) {
      showMissingContactOptions(data.not_found_contacts, data.response);
    }

    // Navigate only when there are no highlight steps — orchestrator handles navigation internally
    // when highlight_elements is non-empty, to avoid ping-pong page flips.
    if (data.navigate_to && data.navigate_to !== currentPage && !data.highlight_elements?.length) {
      navigateTo(data.navigate_to);
    }

    // Highlight elements — orchestrator navigates to correct page per step
    setTimeout(() => {
      highlightElements(data.highlight_elements || [], data.response, data.steps || []);
    }, 100);

    // Execute AI-driven UI actions (fill fields, click buttons)
    if (data.actions?.length) {
      setTimeout(() => executeActions(data.actions), 500);
    }

    // Always speak response; stop mic first to prevent feedback loop
    if (data.speak !== false) {
      const ttsText = data.response + (data.steps?.length ? '. ' + data.steps.join('. ') : '');
      if (isListening) {
        stopVoiceCapture();
        setTimeout(() => speak(ttsText), 250);
      } else {
        speak(ttsText);
      }
    }

  } catch (err) {
    typingEl.remove();
    addMessage(`Sorry, something went wrong: ${err.message}`, 'bot');
  }
}

// ── Text-to-Speech (ElevenLabs) ───────────────────────────────

let _currentAudio = null;
let _ttsCtx = null;  // shared AudioContext — stays unlocked after first user gesture

// Unlock AudioContext on first interaction so async TTS playback isn't blocked
document.addEventListener('click', () => {
  if (!_ttsCtx) _ttsCtx = new AudioContext();
  if (_ttsCtx.state === 'suspended') _ttsCtx.resume();
}, { passive: true });

async function _getAudioCtx() {
  if (!_ttsCtx) _ttsCtx = new AudioContext();
  if (_ttsCtx.state === 'suspended') await _ttsCtx.resume();
  return _ttsCtx;
}

async function speak(text, onFinished) {
  if (!ttsEnabled) { if (onFinished) onFinished(); return; }
  if (_currentAudio) { _currentAudio.stop(); _currentAudio = null; }
  try {
    const resp = await fetch('/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.replace(/[#*`]/g, '') }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      console.error('TTS error:', resp.status, err);
      throw new Error('TTS failed');
    }
    const arrayBuffer = await resp.arrayBuffer();
    const ctx = _audioCtx || await _getAudioCtx();  // prefer mic ctx (already unlocked)
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    const source = ctx.createBufferSource();
    source.buffer = decoded;
    source.connect(ctx.destination);
    _currentAudio = source;
    source.onended = () => {
      _currentAudio = null;
      if (onFinished) onFinished();
      if (voiceMode && !isListening) _restartMic();
    };
    source.start();
  } catch (e) {
    console.error('speak() failed:', e);
    if (onFinished) onFinished();
    if (voiceMode && !isListening) _restartMic();
  }
}

// ── Voice Input (Groq Whisper via MediaRecorder) ──────────────

let _micStream   = null;
let _mediaRec    = null;
let _audioChunks = [];
let _audioCtx    = null;
let _analyser    = null;
let _silTimer    = null;
let _monitoring  = false;

function _setMicUI(on) {
  if (on) {
    micBtn.classList.add('recording');
    micBtn.setAttribute('aria-label', 'Listening — tap to stop');
    document.querySelector('.voice-indicator').classList.add('active');
  } else {
    micBtn.classList.remove('recording');
    micBtn.setAttribute('aria-label', 'Toggle voice input');
    document.querySelector('.voice-indicator').classList.remove('active');
  }
}

function _monitorSilence() {
  _monitoring = true;
  const buf = new Uint8Array(_analyser.fftSize);
  function check() {
    if (!_monitoring || !isListening) return;
    _analyser.getByteTimeDomainData(buf);
    const rms = Math.sqrt(buf.reduce((s, v) => s + (v - 128) ** 2, 0) / buf.length);
    if (rms < 4) {
      if (!_silTimer) {
        _silTimer = setTimeout(() => {
          if (isListening) stopVoiceCapture();
        }, 1500);
      }
    } else {
      clearTimeout(_silTimer);
      _silTimer = null;
    }
    requestAnimationFrame(check);
  }
  check();
}

async function _sendAudio() {
  const blob = new Blob(_audioChunks, { type: 'audio/webm' });
  _audioChunks = [];
  if (blob.size < 1000) {
    if (voiceMode) _restartMic();
    return;
  }
  chatInput.value = '…';
  try {
    const fd = new FormData();
    fd.append('audio', blob, 'audio.webm');
    const resp = await fetch('/stt', { method: 'POST', body: fd });
    const { text } = await resp.json();
    chatInput.value = '';
    if (text && text.trim()) sendMessage(text.trim());
    else if (voiceMode) _restartMic();
  } catch (e) {
    chatInput.value = '';
    if (voiceMode) _restartMic();
  }
}

function _startRecording() {
  _audioChunks = [];
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus' : 'audio/webm';
  _mediaRec = new MediaRecorder(_micStream, { mimeType });
  _mediaRec.ondataavailable = e => { if (e.data.size) _audioChunks.push(e.data); };
  _mediaRec.onstop = _sendAudio;
  _mediaRec.start();
  _monitorSilence();
}

function _restartMic() {
  if (!voiceMode || !_micStream) return;
  isListening = true;
  _setMicUI(true);
  _startRecording();
}

function stopVoiceCapture() {
  _monitoring = false;
  clearTimeout(_silTimer);
  _silTimer = null;
  isListening = false;
  _setMicUI(false);
  if (_mediaRec && _mediaRec.state !== 'inactive') {
    _mediaRec.stop();
  }
}

async function startVoiceMode() {
  if (_micStream) {
    voiceMode = true;
    openWidget();
    _restartMic();
    return;
  }
  try {
    _micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    _audioCtx  = new AudioContext();
    _analyser  = _audioCtx.createAnalyser();
    _analyser.fftSize = 256;
    _audioCtx.createMediaStreamSource(_micStream).connect(_analyser);
    voiceMode   = true;
    isListening = true;
    _setMicUI(true);
    openWidget();
    chatInput.value = '';
    _startRecording();
  } catch (e) {
    addMessage('Microphone access denied. Please allow mic permission.', 'bot');
  }
}

function stopVoiceMode() {
  voiceMode = false;
  stopVoiceCapture();
}

micBtn.addEventListener('click', () => {
  voiceMode ? stopVoiceMode() : startVoiceMode();
});

// ── UI Helpers ────────────────────────────────────────────────

function copyIban() {
  const iban = document.getElementById('iban-text')?.textContent;
  if (iban) {
    navigator.clipboard.writeText(iban.replace(/\s/g, ''));
    announce('IBAN copied to clipboard');
    const btn = document.querySelector('[data-element-id="btn-copy-iban"]');
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 2000); }
  }
}

function toggleSwitch(el) {
  const isOn = !el.classList.contains('off');
  el.classList.toggle('off', isOn);
  el.setAttribute('aria-checked', !isOn);
  announce(`${el.getAttribute('aria-label')} turned ${!isOn ? 'on' : 'off'}`);
}

// ── Accessibility mode + language ─────────────────────────────

function setMode(mode) {
  currentMode = mode;
  ['default', 'blind', 'low_vision', 'dyslexic', 'colorblind'].forEach(m => document.body.classList.remove(`mode-${m}`));
  if (mode !== 'default') document.body.classList.add(`mode-${mode}`);
  document.querySelectorAll('.mode-btn').forEach(btn => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active);
  });
  announce(`Accessibility mode: ${mode.replace('_', ' ')}`);
}

function setLang(lang) {
  currentLang = lang;
  // lang stored in currentLang; Groq STT uses server-side language detection
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active);
  });
}

document.getElementById('btn-speech-on').addEventListener('click', () => {
  ttsEnabled = true;
  document.getElementById('btn-speech-on').classList.add('active');
  document.getElementById('btn-speech-on').setAttribute('aria-pressed', true);
  document.getElementById('btn-speech-off').classList.remove('active');
  document.getElementById('btn-speech-off').setAttribute('aria-pressed', false);
});
document.getElementById('btn-speech-off').addEventListener('click', () => {
  ttsEnabled = false;
  if (_currentAudio) { try { _currentAudio.stop(); } catch(_){} _currentAudio = null; }
  document.getElementById('btn-speech-off').classList.add('active');
  document.getElementById('btn-speech-off').setAttribute('aria-pressed', true);
  document.getElementById('btn-speech-on').classList.remove('active');
  document.getElementById('btn-speech-on').setAttribute('aria-pressed', false);
});

// ── Payment submission ────────────────────────────────────────

async function submitPayment() {
  const name      = document.getElementById('input-recipient')?.value?.trim();
  const iban      = document.getElementById('input-iban')?.value?.trim();
  const recipient = iban || name;
  const amount    = parseFloat(document.getElementById('input-amount')?.value);
  const desc      = document.getElementById('input-desc')?.value?.trim() || 'Payment via bunq Guide';

  if (!name && !iban) { alert('Please enter a recipient name or IBAN.'); return; }
  if (!amount || amount <= 0) { alert('Please enter a valid amount.'); return; }

  const btn = document.querySelector('[data-element-id="btn-pay-confirm"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

  try {
    const resp = await fetch('/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient, amount, description: desc }),
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.detail || 'Payment failed');
    }

    const data = await resp.json();

    // Success — confetti + navigate home + refresh live data
    triggerConfetti();
    const msg = `Payment of €${parseFloat(data.amount).toFixed(2)} sent to ${data.recipient}! 🎉`;
    speak(msg);
    addMessage(msg, 'bot');
    openWidget();

    setTimeout(async () => {
      await loadBunqData();   // refreshes accounts + transactions, re-renders current page
      navigateTo('home');
    }, 1800);

  } catch (e) {
    alert(`Payment failed: ${e.message}`);
    if (btn) { btn.disabled = false; btn.textContent = 'Send Payment'; }
  }
}

// ── Confetti easter egg ───────────────────────────────────────

function triggerConfetti() {
  const colors = ['#0A84FF', '#30D158', '#FFD60A', '#FF6B00', '#FF453A', '#BF5AF2', '#ffffff'];
  const container = document.querySelector('.phone-frame') || document.body;
  const rect = container.getBoundingClientRect();

  for (let i = 0; i < 80; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${5 + Math.random() * 6}px;
      height: ${8 + Math.random() * 6}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation-delay: ${Math.random() * 0.6}s;
      animation-duration: ${1.2 + Math.random() * 1}s;
      transform: rotate(${Math.random() * 360}deg);
    `;
    container.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ── Transaction detail sheet ──────────────────────────────────

function openTxnDetail(index) {
  const txns = bunqState.transactions.length ? bunqState.transactions : MOCK.transactions;
  const tx = txns[index];
  if (!tx) return;

  const isIncoming = tx.amount >= 0;
  const fullDate = tx.created
    ? new Date(tx.created).toLocaleString('en-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : (tx.createdDisplay || '—');

  const rows = [
    ['Counterpart',  tx.counterpart || '—'],
    ['IBAN',         tx.iban        || '—'],
    ['Amount',       `${isIncoming ? '+' : ''}${fmt(tx.amount, tx.currency)}`],
    ['Direction',    isIncoming ? 'Incoming' : 'Outgoing'],
    ['Description',  tx.description || '—'],
    ['Category',     tx.cat         || '—'],
    ['Date',         fullDate],
    ['Payment ID',   tx.id          || '—'],
  ];

  document.getElementById('txn-sheet-content').innerHTML = `
    <div class="txn-detail-header">
      <div class="txn-detail-icon ${tx.cat}">${tx.icon || '💳'}</div>
      <div class="txn-detail-amount ${isIncoming ? 'positive' : 'negative'}">${isIncoming ? '+' : ''}${fmt(tx.amount, tx.currency)}</div>
      <div class="txn-detail-name">${tx.counterpart}</div>
    </div>
    <div class="txn-detail-rows">
      ${rows.map(([label, value]) => `
        <div class="txn-detail-row">
          <div class="txn-detail-label">${label}</div>
          <div class="txn-detail-value ${label === 'IBAN' ? 'mono' : ''}">${value}</div>
        </div>`).join('')}
    </div>
    ${tx.iban ? `
    <button class="btn-primary" style="margin-top:16px" onclick="prefillRecipient('${tx.counterpart.replace(/'/g, "\\'")}', '${tx.iban}'); closeTxnDetail(); navigateTo('pay');">
      Send Money to ${tx.counterpart.split(' ')[0]}
    </button>` : ''}
    <button class="btn-secondary" style="margin-top:8px" onclick="closeTxnDetail()">Close</button>
  `;

  document.getElementById('txn-sheet-backdrop').classList.add('visible');
  document.getElementById('txn-sheet').classList.add('visible');
}

function closeTxnDetail() {
  document.getElementById('txn-sheet-backdrop').classList.remove('visible');
  document.getElementById('txn-sheet').classList.remove('visible');
}

// ── Push notification banner ──────────────────────────────────

const PUSH_NOTIFICATIONS = {
  salary: {
    icon: '💰',
    iconClass: 'salary',
    title: 'Salary Day! 🎉',
    message: "Your salary is hitting your account today — you've earned it!",
    confetti: true,
    duration: 7000,
  },
  rent: {
    icon: '🏠',
    iconClass: 'rent',
    title: 'Rent Due Today',
    message: "Heads up — it's the 25th and your rent is due. Make sure your balance is covered!",
    confetti: false,
    duration: 8000,
  },
};

const _notifQueue = [];
let _notifActive = false;
let _notifTimer = null;

function checkDateNotifications() {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const params = new URLSearchParams(window.location.search);
  const isPayday = params.has('testPayday') || (day === 25 && month === 4);
  const isRentDay = params.has('testRent') || day === 25;

  if (isPayday) _notifQueue.push('salary');
  if (isRentDay) _notifQueue.push('rent');
  if (_notifQueue.length) setTimeout(_showNextNotif, 1400);
}

function _showNextNotif() {
  if (!_notifQueue.length) { _notifActive = false; return; }
  _notifActive = true;
  const type = _notifQueue.shift();
  const notif = PUSH_NOTIFICATIONS[type];
  if (!notif) { _showNextNotif(); return; }

  const banner = document.getElementById('push-banner');
  if (!banner) return;

  const iconEl = document.getElementById('push-banner-icon');
  iconEl.textContent = notif.icon;
  iconEl.className = `push-banner-icon ${notif.iconClass}`;
  document.getElementById('push-banner-title').textContent = notif.title;
  document.getElementById('push-banner-msg').textContent = notif.message;

  const oldBar = banner.querySelector('.push-banner-progress');
  if (oldBar) oldBar.remove();
  const bar = document.createElement('div');
  bar.className = `push-banner-progress ${notif.iconClass}`;
  bar.style.animationDuration = `${notif.duration}ms`;
  banner.appendChild(bar);

  banner.classList.add('visible');
  if (notif.confetti) triggerConfetti();

  clearTimeout(_notifTimer);
  _notifTimer = setTimeout(dismissBanner, notif.duration);
}

function dismissBanner() {
  clearTimeout(_notifTimer);
  const banner = document.getElementById('push-banner');
  if (banner) banner.classList.remove('visible');
  setTimeout(() => {
    if (_notifQueue.length) _showNextNotif();
    else _notifActive = false;
  }, 500);
}

async function registerPushFilter() {
  try {
    await fetch('/notifications/register', { method: 'POST' });
  } catch (e) {
    console.warn('Push filter registration failed:', e);
  }
}

// ── Nav click handlers ────────────────────────────────────────

document.querySelectorAll('.nav-pill').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.page));
});

// ── Receipt / Camera ──────────────────────────────────────────

const receiptInput = document.getElementById('receipt-input');
const attachBtnEl  = document.getElementById('attach-btn');
const attachPreviewEl = document.getElementById('attachment-preview');
const attachThumbEl   = document.getElementById('attachment-thumb');
const attachRemoveEl  = document.getElementById('attachment-remove');

function clearAttachment() {
  if (pendingAttachment) URL.revokeObjectURL(pendingAttachment.objectUrl);
  pendingAttachment = null;
  attachPreviewEl.hidden = true;
  attachBtnEl.classList.remove('has-file');
  chatInput.placeholder = 'Ask me anything...';
}

function renderReceiptCard(data) {
  const card = document.createElement('div');
  card.className = 'msg bot';
  const confClass = data.confidence === 'low' ? 'receipt-confidence-low' : '';
  const rows = [
    ['Merchant',  data.merchant],
    ['Amount',    `${data.currency} ${data.amount?.toFixed(2)}`],
    ['Category',  data.category],
    ['Date',      data.date || '—'],
    ['Payment',   data.payment_method],
  ];
  if (data.items?.length) rows.push(['Items', data.items.join(', ')]);

  const tableRows = rows.map(([k, v]) =>
    `<tr><td class="receipt-tbl-key">${k}</td><td class="receipt-tbl-val">${v}</td></tr>`
  ).join('');

  card.innerHTML = `
    <div class="receipt-card ${confClass}">
      <table class="receipt-table">${tableRows}</table>
    </div>
    <div style="font-size:12px;color:var(--text-muted);margin-top:6px">${data.summary}</div>`;
  return card;
}

attachBtnEl.addEventListener('click', () => {
  openWidget();
  receiptInput.click();
});

attachRemoveEl.addEventListener('click', clearAttachment);

receiptInput.addEventListener('change', async () => {
  const file = receiptInput.files[0];
  if (!file) return;
  receiptInput.value = '';

  try {
    const base64 = await fileToBase64(file);
    const mediaType = file.type || 'image/jpeg';
    const objectUrl = URL.createObjectURL(file);

    pendingAttachment = { objectUrl, base64, mediaType };
    attachThumbEl.src = objectUrl;
    attachPreviewEl.hidden = false;
    attachBtnEl.classList.add('has-file');
    chatInput.placeholder = 'Add context or press send…';
    chatInput.focus();
  } catch (err) {
    addMessage(`Could not load image: ${err.message}`, 'bot');
  }
});

async function sendAttachment() {
  const contextText = chatInput.value.trim();
  const { objectUrl, base64, mediaType } = pendingAttachment;

  addMessage(contextText || 'I uploaded a receipt.', 'user');
  chatInput.value = '';
  clearAttachment();

  const typingEl = showTyping();

  try {
    // Step 1: vision — extract receipt data
    const vRes = await fetch(`${API_BASE}/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: base64, media_type: mediaType }),
    });
    if (!vRes.ok) { const e = await vRes.json(); throw new Error(e.detail || 'Vision error'); }
    const data = await vRes.json();
    typingEl.remove();
    URL.revokeObjectURL(objectUrl);

    // Step 2: always render receipt card for user verification
    const card = renderReceiptCard(data);
    messagesEl.appendChild(card);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Step 3: inject receipt into history
    const receiptContext = `Receipt from ${data.merchant}: ${data.currency} ${data.amount?.toFixed(2)}, category: ${data.category}, date: ${data.date || 'unknown'}, items: ${data.items?.join(', ') || 'none'}, payment: ${data.payment_method}.`;
    conversationHistory.push({ role: 'user',      content: contextText || 'I uploaded a receipt.' });
    conversationHistory.push({ role: 'assistant', content: receiptContext });

    // Step 4: if user gave context, call guide with receipt in history so it acts on intent
    if (contextText) {
      const typingEl2 = showTyping();
      const gRes = await fetch(`${API_BASE}/guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: contextText,
          page_id: currentPage,
          page_state: capturePageState(),
          history: getHistoryPayload(),
        }),
      });
      typingEl2.remove();
      if (gRes.ok) {
        const gData = await gRes.json();
        addMessage(gData.response, 'bot', gData.steps);
        conversationHistory.push({ role: 'user',      content: contextText });
        conversationHistory.push({ role: 'assistant', content: gData.response });
        if (gData.navigate_to && gData.navigate_to !== currentPage) navigateTo(gData.navigate_to);
        if (gData.actions?.length) setTimeout(() => executeActions(gData.actions), 400);
        if (gData.speak !== false) speak(gData.response);
      }
    } else {
      speak(`Receipt from ${data.merchant}. Total ${data.currency} ${data.amount?.toFixed(2)}.`);
    }

  } catch (err) {
    typingEl.remove();
    addMessage(`Could not analyse receipt: ${err.message}`, 'bot');
    URL.revokeObjectURL(objectUrl);
  }
}

const MAX_FILE_MB  = 5;      // reject before reading
const MAX_PX       = 1024;   // resize longest side to this
const JPEG_QUALITY = 0.75;   // 75% quality — fine for receipts

// ── Missing Contact Options ───────────────────────────────────

function showMissingContactOptions(names) {
  names.forEach(name => {
    const card = document.createElement('div');
    card.className = 'msg bot';
    card.innerHTML = `
      <div style="margin-bottom:6px">
        <strong>${name}</strong> is not in your bunq contacts.
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="quick-prompt" style="text-align:left;border-radius:8px;padding:8px 12px"
          onclick="promptContactInfo('${name}')">
          Enter ${name}'s email or phone number
        </button>
        <button class="quick-prompt receipt-prompt" style="text-align:left;border-radius:8px;padding:8px 12px"
          onclick="skipContact('${name}')">
          Skip ${name} for now
        </button>
      </div>`;
    messagesEl.appendChild(card);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
  speak(`${names.join(' and ')} ${names.length > 1 ? 'were' : 'was'} not found in your contacts. Please provide their contact details.`);
}

function promptContactInfo(name) {
  chatInput.value = `${name}'s email is `;
  chatInput.focus();
  // Position cursor at end
  const len = chatInput.value.length;
  chatInput.setSelectionRange(len, len);
}

function skipContact(name) {
  sendMessage(`Skip ${name}, proceed without them`);
}

function fileToBase64(file) {
  // Hard reject oversized files immediately
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return Promise.reject(new Error(`Image too large (max ${MAX_FILE_MB} MB). Please use a smaller photo.`));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        // Resize down if needed — keep aspect ratio
        let { width, height } = img;
        if (width > MAX_PX || height > MAX_PX) {
          if (width >= height) { height = Math.round(height * MAX_PX / width);  width = MAX_PX; }
          else                  { width  = Math.round(width  * MAX_PX / height); height = MAX_PX; }
        }

        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        // Always output JPEG for consistent compression
        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        resolve(dataUrl.split(',')[1]);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Ripple click effect ───────────────────────────────────────

document.addEventListener('pointerdown', e => {
  const target = e.target.closest('button, .nav-pill, .action-btn, .contact-chip');
  if (!target) return;
  const r = document.createElement('span');
  r.className = 'ripple';
  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
  target.style.position = target.style.position || 'relative';
  target.style.overflow = 'hidden';
  target.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
});

// ── Init ──────────────────────────────────────────────────────

async function init() {
  // Load logged-in user info
  try {
    const res = await fetch('/api/me');
    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }
    const user = await res.json();
    bunqState.userName = user.name;
    const avatar = document.querySelector('.nav-avatar');
    if (avatar) {
      avatar.textContent = user.name.charAt(0);
      avatar.title = user.name;
    }
  } catch (e) {
    window.location.href = '/login';
    return;
  }

  // Wire accessibility mode + language buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  // Profile dropdown
  const profileBtn   = document.getElementById('nav-profile-btn');
  const profileDrop  = document.getElementById('profile-dropdown');
  const a11yBtn      = document.getElementById('nav-a11y-btn');
  const a11yDrop     = document.getElementById('a11y-dropdown');

  function toggleDropdown(btn, drop, other, otherBtn) {
    const open = !drop.hidden;
    drop.hidden = open;
    btn.setAttribute('aria-expanded', !open);
    if (!open) { other.hidden = true; otherBtn.setAttribute('aria-expanded', false); }
  }

  profileBtn.addEventListener('click', e => {
    e.stopPropagation();
    toggleDropdown(profileBtn, profileDrop, a11yDrop, a11yBtn);
  });
  a11yBtn.addEventListener('click', e => {
    e.stopPropagation();
    toggleDropdown(a11yBtn, a11yDrop, profileDrop, profileBtn);
  });

  // Close on outside click
  document.addEventListener('click', () => {
    profileDrop.hidden = true;
    a11yDrop.hidden = true;
    profileBtn.setAttribute('aria-expanded', false);
    a11yBtn.setAttribute('aria-expanded', false);
  });

  const bannerClose = document.getElementById('push-banner-close');
  if (bannerClose) bannerClose.addEventListener('click', dismissBanner);

  navigateTo('home');
  loadBunqData();
  registerPushFilter();
  checkDateNotifications();
}

// Redirect to login on any 401 — return never-resolving promise so caller never runs (H2)
const _origFetch = window.fetch;
window.fetch = async (...args) => {
  const res = await _origFetch(...args);
  if (res.status === 401) {
    window.location.href = '/login';
    return new Promise(() => {});
  }
  return res;
};

init();
