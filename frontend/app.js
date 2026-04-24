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

// ── Page Renderers ────────────────────────────────────────────

function renderHome() {
  const acc = bunqState.primaryAccount;
  const balance = acc ? `€${acc.balance.toFixed(2)}` : MOCK.balance;
  const iban = acc ? acc.iban : MOCK.iban;
  const txns = bunqState.transactions.length ? bunqState.transactions : MOCK.transactions;

  return `
    <div data-element-id="balance-card" class="balance-card" role="region" aria-label="Account balance">
      <div class="balance-label">Total Balance ${bunqState.mock ? '' : '<span style="font-size:10px;opacity:0.6">● live</span>'}</div>
      <div class="balance-amount">${balance}</div>
      <div class="balance-change">${MOCK.incomeThisMonth}</div>
      <div class="balance-iban">${iban || ''}</div>
    </div>

    <div class="quick-actions" role="group" aria-label="Quick actions">
      <button data-element-id="btn-send-money" class="action-btn" onclick="navigateTo('pay')" aria-label="Send money">
        <span class="action-icon" aria-hidden="true">↑</span>
        <span>Send</span>
      </button>
      <button data-element-id="btn-request" class="action-btn" aria-label="Request money">
        <span class="action-icon" aria-hidden="true">↓</span>
        <span>Request</span>
      </button>
      <button data-element-id="btn-topup" class="action-btn" aria-label="Top up account">
        <span class="action-icon" aria-hidden="true">＋</span>
        <span>Top Up</span>
      </button>
      <button data-element-id="btn-savings" class="action-btn" onclick="navigateTo('savings')" aria-label="View savings">
        <span class="action-icon" aria-hidden="true">🎯</span>
        <span>Savings</span>
      </button>
    </div>

    <div class="section-header">
      Recent Transactions
      <a href="#" aria-label="See all transactions">See all</a>
    </div>

    <div data-element-id="transaction-list" class="transaction-list" role="list" aria-label="Recent transactions">
      ${txns.slice(0, 8).map((tx, i) => `
      <div data-element-id="txn-${i+1}" class="transaction-item" role="listitem">
        <div class="txn-icon ${tx.cat}" aria-hidden="true">${tx.icon}</div>
        <div class="txn-details">
          <div class="txn-name">${tx.counterpart}</div>
          <div class="txn-category">${tx.cat.charAt(0).toUpperCase()+tx.cat.slice(1)} • ${tx.created}</div>
        </div>
        <div class="txn-amount ${tx.amount >= 0 ? 'positive' : 'negative'}">${fmt(tx.amount)}</div>
      </div>`).join('')}
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

  // Update nav
  document.querySelectorAll('.nav-pill').forEach(btn => {
    const active = btn.dataset.page === pageId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active);
  });

  // Render page
  document.getElementById('page-content').innerHTML = PAGES[pageId].render();
  document.title = `bunq — ${PAGES[pageId].title}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Announce page change for screen readers
  announce(`Navigated to ${PAGES[pageId].title}`);
}

// ── Highlight System ──────────────────────────────────────────

function highlightElements(ids) {
  clearHighlights();
  if (!ids || ids.length === 0) return;

  ids.forEach((id, idx) => {
    const el = document.querySelector(`[data-element-id="${id}"]`);
    if (!el) return;
    el.classList.add('ai-highlight');

    // Scroll first element into view
    if (idx === 0) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Add floating label positioned within the phone frame
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        const frame = document.querySelector('.phone-frame');
        const screen = document.querySelector('.phone-screen');
        const frameRect = frame.getBoundingClientRect();
        const scrollTop = screen ? screen.scrollTop : 0;
        const arrow = document.createElement('div');
        arrow.className = 'ai-arrow';
        arrow.textContent = '← Here';
        arrow.style.top = `${rect.top - frameRect.top + scrollTop - 32}px`;
        arrow.style.left = `${rect.right - frameRect.left + 8}px`;
        arrow.id = 'ai-arrow-label';
        frame.appendChild(arrow);
      }, 300);
    }
  });

  // Auto-clear after 8 seconds
  setTimeout(clearHighlights, 8000);
}

function clearHighlights() {
  document.querySelectorAll('.ai-highlight').forEach(el => el.classList.remove('ai-highlight'));
  const arrow = document.getElementById('ai-arrow-label');
  if (arrow) arrow.remove();
}

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

widgetToggle.addEventListener('click', () => {
  const open = widgetPanel.classList.toggle('open');
  widgetToggle.setAttribute('aria-expanded', open);
  if (open) chatInput.focus();
});

// Keyboard open
widgetToggle.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') widgetToggle.click();
});

// Quick prompts
document.querySelectorAll('.quick-prompt').forEach(btn => {
  btn.addEventListener('click', () => {
    const q = btn.dataset.q;
    widgetPanel.classList.add('open');
    sendMessage(q);
  });
});

// Send on enter
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    sendMessage(chatInput.value.trim());
    chatInput.value = '';
  }
});

sendBtn.addEventListener('click', () => {
  if (chatInput.value.trim()) {
    sendMessage(chatInput.value.trim());
    chatInput.value = '';
  }
});

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
  const msg = addMessage('Guide is thinking…', 'typing');
  return msg;
}

// ── API Call ──────────────────────────────────────────────────

async function sendMessage(query) {
  if (!query.trim()) return;

  addMessage(query, 'user');
  const typingEl = showTyping();

  try {
    const res = await fetch(`${API_BASE}/guide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, page_id: currentPage }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Server error');
    }

    const data = await res.json();
    typingEl.remove();

    addMessage(data.response, 'bot', data.steps);

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
      highlightElements(data.highlight_elements || []);
    }, 300);

    // Speak response
    if (data.speak !== false) {
      speak(data.response + (data.steps?.length ? '. ' + data.steps.join('. ') : ''));
    }

  } catch (err) {
    typingEl.remove();
    addMessage(`Sorry, something went wrong: ${err.message}`, 'bot');
  }
}

// ── Text-to-Speech ────────────────────────────────────────────

let currentUtterance = null;

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.pitch = 1.0;
  utterance.lang = 'en-GB';
  // Prefer a natural voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Daniel'));
  if (preferred) utterance.voice = preferred;
  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

// Load voices when available (Chrome loads them async)
window.speechSynthesis.onvoiceschanged = () => {};

// ── Voice Input ───────────────────────────────────────────────

let recognition = null;
let isRecording = false;
let accumulatedTranscript = '';

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'en-US';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (res.isFinal) {
        accumulatedTranscript += res[0].transcript;
      } else {
        interim += res[0].transcript;
      }
    }
    // Mirror live text into input for user feedback — don't send yet
    chatInput.value = (accumulatedTranscript + interim).trim();
  };

  recognition.onerror = e => {
    // Log but don't touch UI state — stopRecording owns that
    console.warn('SpeechRecognition error:', e.error);
  };

  recognition.onend = () => {
    // Chrome auto-terminates even continuous recognition after ~60s.
    // If user is still holding, restart silently.
    if (isRecording) {
      try { recognition.start(); } catch (err) { /* already starting */ }
    }
  };

  const startRecording = () => {
    if (isRecording) return;
    window.speechSynthesis.cancel();
    accumulatedTranscript = '';
    chatInput.value = '';
    isRecording = true;
    micBtn.classList.add('recording');
    micBtn.setAttribute('aria-label', 'Recording — release to send');
    widgetPanel.classList.add('open');
    try {
      recognition.start();
    } catch (e) {
      isRecording = false;
      micBtn.classList.remove('recording');
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    isRecording = false;
    micBtn.classList.remove('recording');
    micBtn.setAttribute('aria-label', 'Voice input — press and hold to speak');
    try { recognition.stop(); } catch (e) {}

    const text = (accumulatedTranscript || chatInput.value).trim();
    accumulatedTranscript = '';
    if (text) {
      chatInput.value = '';
      sendMessage(text);
    }
  };

  // Tap to toggle — first click starts, second click stops + sends
  micBtn.addEventListener('click', () => {
    if (isRecording) stopRecording();
    else startRecording();
  });
} else {
  micBtn.style.opacity = '0.4';
  micBtn.title = 'Voice input not supported in this browser';
}

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
}

// ── Nav click handlers ────────────────────────────────────────

document.querySelectorAll('.nav-pill').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.page));
});

// ── Receipt / Camera ──────────────────────────────────────────

const receiptInput = document.getElementById('receipt-input');
const scanBtn      = document.getElementById('scan-receipt-btn');

scanBtn.addEventListener('click', () => {
  widgetPanel.classList.add('open');
  receiptInput.click();
});

receiptInput.addEventListener('change', async () => {
  const file = receiptInput.files[0];
  if (!file) return;
  receiptInput.value = '';   // reset so same file can be re-selected

  const objectUrl = URL.createObjectURL(file);

  // Show thumbnail + uploading state in chat
  const preview = document.createElement('div');
  preview.className = 'msg bot uploading';
  preview.innerHTML = `
    <img src="${objectUrl}" class="receipt-thumb" alt="Receipt preview">
    Analysing receipt...`;
  messagesEl.appendChild(preview);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  try {
    // Read file as base64
    const base64 = await fileToBase64(file);
    const mediaType = file.type || 'image/jpeg';

    const res = await fetch(`${API_BASE}/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: base64, media_type: mediaType }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Vision error');
    }

    const data = await res.json();
    preview.remove();
    URL.revokeObjectURL(objectUrl);

    // Build receipt card
    const card = document.createElement('div');
    card.className = 'msg bot';

    const confClass = data.confidence === 'low' ? 'receipt-confidence-low' : '';
    const itemsHtml = data.items?.length
      ? `<div class="receipt-items">${data.items.join('<br>')}</div>`
      : '';
    const dateHtml  = data.date ? ` · ${data.date}` : '';

    card.innerHTML = `
      <img src="${URL.createObjectURL(file)}" class="receipt-thumb" alt="Receipt">
      <div class="receipt-card ${confClass}">
        <div class="receipt-card-header">
          <div class="receipt-merchant">${data.merchant}</div>
          <div class="receipt-amount">${data.currency} ${data.amount?.toFixed(2)}</div>
        </div>
        <div class="receipt-meta">${data.payment_method}${dateHtml}</div>
        <div class="receipt-category">${data.category}</div>
        ${itemsHtml}
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${data.summary}</div>`;

    messagesEl.appendChild(card);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    speak(`Receipt from ${data.merchant}. Total ${data.currency} ${data.amount?.toFixed(2)}. Category: ${data.category}.`);

  } catch (err) {
    preview.textContent = `Could not analyse receipt: ${err.message}`;
    preview.classList.remove('uploading');
  }
});

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
    // Show user initial + name in nav avatar
    const avatar = document.querySelector('.nav-avatar');
    if (avatar) {
      avatar.textContent = user.name.charAt(0);
      avatar.title = user.name;
    }
    // Add logout link
    const nav = document.querySelector('.top-nav');
    if (nav) {
      const logoutBtn = document.createElement('a');
      logoutBtn.href = '/auth/logout';
      logoutBtn.style.cssText = 'font-size:12px;color:#6b7280;text-decoration:none;padding:4px 8px;border-radius:8px;border:1px solid #e5e7eb';
      logoutBtn.textContent = 'Sign out';
      nav.appendChild(logoutBtn);
    }
  } catch (e) {
    window.location.href = '/login';
    return;
  }

  navigateTo('home');
  loadBunqData();
}

// Redirect to login on any 401
const _origFetch = window.fetch;
window.fetch = async (...args) => {
  const res = await _origFetch(...args);
  if (res.status === 401) {
    window.location.href = '/login';
  }
  return res;
};

init();
