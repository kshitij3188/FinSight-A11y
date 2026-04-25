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

// Mock fallbacks used when bunq API not configured
const MOCK = {
  balance: '€1,247.50',
  balanceLabel: 'One thousand two hundred forty seven euros fifty cents',
  iban: 'NL12 BUNQ 0123 4567 89',
  bic: 'BUNQNL2A',
  incomeThisMonth: '+€2,400 income this month',
  transactions: [
    { counterpart: 'Albert Heijn', amount: -23.40, currency: 'EUR', cat: 'groceries', icon: '🛒', created: 'Today, 14:23' },
    { counterpart: 'Netflix',      amount: -12.99, currency: 'EUR', cat: 'entertainment', icon: '🎬', created: 'Yesterday' },
    { counterpart: 'Thuisbezorgd', amount: -28.50, currency: 'EUR', cat: 'food', icon: '🍕', created: 'Yesterday' },
    { counterpart: 'NS Reizen',    amount: -18.60, currency: 'EUR', cat: 'transport', icon: '🚆', created: 'Mon' },
    { counterpart: 'Employer BV',  amount: 2400.00, currency: 'EUR', cat: 'income', icon: '💼', created: 'Mon' },
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
          counterpart: tx.counterpart,
          amount: tx.amount,
          currency: tx.currency,
          created: new Date(tx.created).toLocaleDateString('en-NL', { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
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
        ${txns.map(tx => `
          <div class="transaction-item" role="listitem" tabindex="0" aria-label="${tx.counterpart}, ${fmt(tx.amount, tx.currency)}">
            <div class="txn-icon ${tx.cat}">${tx.icon}</div>
            <div class="txn-details">
              <div class="txn-name">${tx.counterpart}</div>
              <div class="txn-date">${tx.created}</div>
            </div>
            <div class="txn-amount ${tx.amount < 0 ? 'negative' : 'positive'}">${fmt(tx.amount, tx.currency)}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderPay() {
  return `
    <div class="section-header">Send Money</div>

    <div class="card">
      <div class="section-header" style="font-size:13px;color:var(--text-secondary);margin-top:0">Recent contacts</div>
      <div data-element-id="recent-contacts" class="recent-contacts" role="list" aria-label="Recent contacts">
        ${[
          ['Sarah', '#FF6B9D'],
          ['Tom', '#4F46E5'],
          ['Mum', '#10B981'],
          ['Gym', '#F59E0B'],
        ].map(([name, color]) => `
          <div class="contact-chip" role="listitem" tabindex="0" aria-label="Pay ${name}">
            <div class="contact-avatar" style="background:${color}">${name[0]}</div>
            <div class="contact-name">${name}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="card pay-form">
      <div data-element-id="field-recipient" class="form-group">
        <label for="input-recipient">Recipient name or IBAN</label>
        <input type="text" id="input-recipient" placeholder="e.g. Sarah or NL12 BUNQ..." aria-label="Recipient name or IBAN">
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
      <button data-element-id="btn-pay-confirm" class="btn-primary" aria-label="Confirm and send payment">
        Send Payment
      </button>
      <button data-element-id="btn-pay-cancel" class="btn-secondary" onclick="navigateTo('home')" aria-label="Cancel and go back">
        Cancel
      </button>
    </div>`;
}

function renderRequest() {
  return `
    <div class="section-header">Request Money</div>
    <div class="card pay-form">
      <div data-element-id="field-req-from" class="form-group">
        <label for="input-req-from">From (name or IBAN)</label>
        <input type="text" id="input-req-from" placeholder="e.g. John or NL12 BUNQ..." aria-label="Request from name or IBAN">
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
      <button data-element-id="btn-req-confirm" class="btn-primary" aria-label="Send payment request">
        Send Request
      </button>
      <button data-element-id="btn-req-cancel" class="btn-secondary" onclick="navigateTo('home')" aria-label="Cancel and go back">
        Cancel
      </button>
    </div>`;
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
          <div data-element-id="btn-freeze-card" class="toggle-label">Freeze Card</div>
          <div class="toggle-desc">Temporarily disable all payments</div>
        </div>
        <div class="toggle off" role="switch" aria-checked="false" aria-label="Freeze card" tabindex="0" onclick="toggleSwitch(this)"></div>
      </div>
      <div class="toggle-row">
        <div>
          <div data-element-id="toggle-online-payments" class="toggle-label">Online Payments</div>
          <div class="toggle-desc">Allow payments on websites and apps</div>
        </div>
        <div class="toggle" role="switch" aria-checked="true" aria-label="Online payments" tabindex="0" onclick="toggleSwitch(this)"></div>
      </div>
      <div class="toggle-row">
        <div>
          <div data-element-id="toggle-contactless" class="toggle-label">Contactless</div>
          <div class="toggle-desc">Tap to pay at terminals</div>
        </div>
        <div class="toggle" role="switch" aria-checked="true" aria-label="Contactless payments" tabindex="0" onclick="toggleSwitch(this)"></div>
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
      <div class="savings-pot-goal">Goal: €1,000</div>
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
  clearHighlights();
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

  // Proactive guide for form pages when voice mode is on
  if (voiceMode && ['pay', 'savings'].includes(pageId)) {
    setTimeout(() => {
      widgetPanel.classList.add('open');
      sendMessage('Guide me through this page');
    }, 500);
  }
}

// ── Highlight System (Lighthouse) ────────────────────────────

function highlightElements(ids, narration, steps) {
  clearHighlights();
  if (!ids || ids.length === 0) return;

  // Announce for screen readers (M2)
  const firstEl = document.querySelector(`[data-element-id="${ids[0]}"]`);
  if (firstEl) {
    announce(`Highlighted: ${firstEl.getAttribute('aria-label') || ids[0]}`);
  }

  if (ids.length === 1) {
    _lighthouseHighlight(ids[0], narration || '');
  } else {
    const narrations = (steps && steps.length) ? steps : ids.map(() => narration || '');
    _applyHighlightsSequential(ids.map((id, i) => ({ id, narration: narrations[i] || '' })));
  }
}

async function _applyHighlightsSequential(highlights) {
  for (let i = 0; i < highlights.length; i++) {
    if (i > 0) await _sleep(1800);
    _lighthouseHighlight(highlights[i].id, highlights[i].narration);
  }
}

function _lighthouseHighlight(id, narration) {
  const el = document.querySelector(`[data-element-id="${id}"]`);
  if (!el) return;

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('lh-target');
  document.getElementById('lh-overlay').classList.add('active');
  _moveMascot(el);

  if (narration) {
    _showNarration(narration);
    speak(narration);
  }

  // Arrow label — fixed M5: removed double scrollTop
  setTimeout(() => {
    const rect = el.getBoundingClientRect();
    const frame = document.querySelector('.phone-frame');
    const frameRect = frame.getBoundingClientRect();
    const arrow = document.createElement('div');
    arrow.className = 'ai-arrow';
    arrow.textContent = '← Here';
    arrow.style.top = `${rect.top - frameRect.top - 32}px`;
    arrow.style.left = `${rect.right - frameRect.left + 8}px`;
    arrow.id = 'ai-arrow-label';
    frame.appendChild(arrow);
  }, 300);

  el.addEventListener('click', () => clearHighlights(), { once: true });
  setTimeout(clearHighlights, 8000);
}

function clearHighlights() {
  document.querySelectorAll('.lh-target, .ai-highlight').forEach(el => {
    el.classList.remove('lh-target', 'ai-highlight');
  });
  document.getElementById('lh-overlay').classList.remove('active');
  _hideMascot();
  _hideNarration();
  const arrow = document.getElementById('ai-arrow-label');
  if (arrow) arrow.remove();
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
  const toast = document.getElementById('narration-toast');
  if (toast) { toast.textContent = text; toast.classList.add('visible'); }
}

function _hideNarration() {
  const toast = document.getElementById('narration-toast');
  if (toast) toast.classList.remove('visible');
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

widgetToggle.addEventListener('click', () => {
  const open = widgetPanel.classList.toggle('open');
  widgetToggle.setAttribute('aria-expanded', open);
  if (open) chatInput.focus();
});

// Keyboard open
widgetToggle.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') widgetToggle.click();
});

// Quick prompts — fill input so user can edit placeholders before sending
document.querySelectorAll('.quick-prompt').forEach(btn => {
  btn.addEventListener('click', () => {
    widgetPanel.classList.add('open');
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

    // Navigate if needed
    if (data.navigate_to && data.navigate_to !== currentPage) {
      navigateTo(data.navigate_to);
    }

    // Highlight elements (after navigation renders new DOM)
    setTimeout(() => {
      highlightElements(data.highlight_elements || [], data.response, data.steps || []);
    }, 300);

    // Execute AI-driven UI actions (fill fields, click buttons)
    if (data.actions?.length) {
      setTimeout(() => executeActions(data.actions), 500);
    }

    // Always speak response; stop mic first to prevent feedback loop
    if (data.speak !== false) {
      const ttsText = data.response + (data.steps?.length ? '. ' + data.steps.join('. ') : '');
      if (isListening) {
        isListening = false;
        try { recognition.stop(); } catch (_) {}
        _setMicUI(false);
        // Chrome bug: recognition.stop() + speak() same tick → TTS silently dropped
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

// ── Text-to-Speech ────────────────────────────────────────────

function speak(text, onFinished) {
  if (!('speechSynthesis' in window)) { if (onFinished) onFinished(); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, ''));
  utterance.rate  = currentMode === 'blind' ? 0.9 : 0.92;
  utterance.pitch = 1.0;
  utterance.lang  = currentLang === 'nl' ? 'nl-NL' : 'en-GB';
  const voices    = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Daniel')
  );
  if (preferred) utterance.voice = preferred;
  utterance.onend = () => {
    if (onFinished) onFinished();
    // Auto-restart mic after TTS ends — fully interactive loop
    if (voiceMode && !isListening) {
      isListening = true;
      recognition.lang = currentLang === 'nl' ? 'nl-NL' : 'en-US';
      _setMicUI(true);
      try { recognition.start(); } catch (_) {}
    }
  };
  window.speechSynthesis.speak(utterance);
}

// ── Voice Input ───────────────────────────────────────────────

let recognition = null;

(function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    micBtn.style.opacity = '0.4';
    micBtn.title = 'Voice input not supported in this browser';
    return;
  }

  recognition = new SR();
  recognition.continuous     = true;
  recognition.interimResults = true;

  let silenceTimer    = null;
  let finalTranscript = '';

  recognition.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        finalTranscript += e.results[i][0].transcript + ' ';
      } else {
        interim += e.results[i][0].transcript;
      }
    }
    // Show live text while speaking
    chatInput.value = finalTranscript + interim;

    // Send after 1.5s of silence
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      const text = finalTranscript.trim();
      finalTranscript = '';
      chatInput.value = '';
      if (text) sendMessage(text);
    }, 1500);
  };

  recognition.onend = () => {
    // If voice mode still on, Chrome killed it — restart silently
    if (voiceMode && isListening) {
      try { recognition.start(); } catch (_) {}
    } else {
      isListening = false;
      _setMicUI(false);
    }
  };

  recognition.onerror = e => {
    if (e.error === 'aborted') return;  // intentional stop — ignore
    isListening = false;
    _setMicUI(false);
    if (e.error !== 'no-speech') addMessage('Voice error: ' + e.error, 'bot');
  };
})();

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

function startVoiceMode() {
  if (!recognition) { addMessage('Speech recognition not supported in this browser.', 'bot'); return; }
  window.speechSynthesis.cancel();
  voiceMode   = true;
  isListening = true;
  recognition.lang = currentLang === 'nl' ? 'nl-NL' : 'en-US';
  _setMicUI(true);
  widgetPanel.classList.add('open');
  chatInput.value = '';
  try { recognition.start(); } catch (e) {
    voiceMode = false; isListening = false; _setMicUI(false);
  }
}

function stopVoiceMode() {
  voiceMode   = false;
  isListening = false;
  if (recognition) try { recognition.stop(); } catch (_) {}
  _setMicUI(false);
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
  ['default', 'blind', 'low_vision', 'dyslexic'].forEach(m => document.body.classList.remove(`mode-${m}`));
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
  if (recognition) recognition.lang = lang === 'nl' ? 'nl-NL' : 'en-US';
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active);
  });
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
  widgetPanel.classList.add('open');
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

  navigateTo('home');
  loadBunqData();
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
