# bunq RAG Source Library — Index

Built for bunq hackathon multimodal AI RAG chatbot.
Total: 68 markdown files across 2 domains.

---

## bunq Help Center (`bunq_help/`)

### Plans (`plans/`)
| File | Content |
|------|---------|
| `plans_overview.md` | All plans comparison, pricing, geographic availability, trial |
| `free_plan.md` | bunq Free plan features |
| `core_plan.md` | bunq Core plan (€3.99/mo personal) |
| `pro_plan.md` | bunq Pro plan (€9.99/mo personal) |
| `elite_plan.md` | bunq Elite plan (€18.99/mo personal) |

### Payments (`payments/`)
| File | Content |
|------|---------|
| `bank_accounts.md` | All account types: standard, joint, international, foreign currency |
| `bank_account_management.md` | Creating, customizing, managing, closing accounts |
| `add_money.md` | All top-up methods: iDEAL, card, SEPA, cash, Bancontact |
| `bic_swift_iban.md` | BIC/SWIFT codes by country, IBAN formats, SWIFT payments, payment arrival times |
| `international_transfers.md` | FX payments in 40+ currencies |
| `foreign_currency_account.md` | Foreign Currency Account overview, features, BIC |
| `foreign_currency_fees.md` | All FX fees: network, SWIFT, card, weekend markup |
| `bunqme_bunqto.md` | Payment links: bunq.me (receive) vs bunq.to (send) |
| `chargebacks.md` | Chargeback process + SEPA Direct Debit refunds |
| `scheduled_payments.md` | Scheduled payments + Auto Accept feature |
| `split_payment.md` | Splitting payments with multiple recipients |
| `apple_pay.md` | Apple Pay setup, devices, troubleshooting |
| `google_pay.md` | Google Pay setup, requirements, troubleshooting |
| `ideal_payment.md` | iDEAL payments (transitioning to Wero) |
| `wero_ideal.md` | iDEAL → Wero transition timeline (ends 2027) |

### Cards (`cards/`)
| File | Content |
|------|---------|
| `card_types.md` | Maestro, Mastercard Debit, Credit, Metal Credit card differences |
| `daily_limits.md` | Card, ATM, contactless, top-up, cash limits + how to change |
| `digital_cards.md` | Digital/virtual cards: limits by plan, rotating CVC, Apple/Google Pay |
| `credit_card_faq.md` | Credit card FAQ: deposits, offline payments, pricing |

### Savings (`savings/`)
| File | Content |
|------|---------|
| `savings_account.md` | Creating savings accounts, withdrawal limits |
| `massinterest.md` | MassInterest: how it works, payout, calculation, tax |
| `massinterest_rates.md` | All MassInterest rates (personal + business, EUR + 8 currencies) |
| `term_deposits.md` | Term deposits: rates, limits, early withdrawal penalties |
| `foreign_currency_savings.md` | FX savings in 8 currencies, rates, volatility guide |
| `joint_savings_account.md` | Creating joint savings, interest split, Auto Round Up |
| `savings_withdrawals.md` | Free withdrawal limits, what counts, extra withdrawal fees |

### Security (`security/`)
| File | Content |
|------|---------|
| `phishing_guide.md` | Phishing, spoofing, scam recognition + protective measures |
| `account_security.md` | Remote access detection, IBAN verification, security alerts |
| `bunq_safety.md` | Banking license, DGS deposit protection, Safety Mode, account closure, fair use |
| `login_issues.md` | Login troubleshooting, lockout policy |

### Business (`business/`)
| File | Content |
|------|---------|
| `opening_business_account.md` | Eligibility, structures, prohibited activities, required docs, process |
| `business_access_levels.md` | Full Access, Make Payments, View-Only — setup and management |
| `company_cards.md` | Employee company cards, limits, setup, receipt management |
| `personal_with_business.md` | Why personal account required for business |
| `business_faq.md` | Business account FAQ: pricing, features, eligibility |
| `bookkeeping_integrations.md` | Software integrations, AutoExport, bank statement export, Zapier |

### Features (`features/`)
| File | Content |
|------|---------|
| `app_v5.md` | bunq V5 redesign (April 2026): new tab structure |
| `home_tab.md` | Home Tab: Net Wealth, payments, account management |
| `bunq_web.md` | bunq Web (web.bunq.com): features, login |
| `finn_ai.md` | Finn AI assistant: capabilities, limitations, access |
| `net_wealth.md` | Net Wealth feature: what it includes, progress tracking |
| `easy_budgeting.md` | Easy Budgeting: setup, AutoSelect, joint budgets |
| `money_insights.md` | Money Insights: spending analytics, spending limits, AutoVAT |
| `organize_income.md` | Organize Your Income / Payment Sorter (Pro/Elite only) |
| `auto_round_up.md` | Auto Round Up: spare change to savings/stocks/crypto (Pro/Elite) |
| `crypto.md` | Crypto via Kraken: buy/sell/swap, fees, Safety Shield |
| `stocks.md` | Stocks via Ginmon: fees, features, tax, eligibility |
| `tap_to_pay.md` | Business Tap to Pay: setup, countries, fees, restrictions |
| `joint_account.md` | Joint Account: creation, co-owners, limitations |
| `child_accounts.md` | Child Accounts: creation, age-based features, co-parenting |
| `esim.md` | eSIM: 190+ countries, Elite 8GB free data |
| `travel_insurance.md` | Elite Travel Insurance: activation, filing claims, Qover |
| `bunq_points.md` | bunq Points (phasing out — being replaced by Wheel of Fortune) |
| `rewards_cashback.md` | Wheel of Fortune, cashback (ended Dec 2025), referrals, partner offers |
| `sustainability.md` | Tree planting: Veritree partnership, 30M+ trees, mangroves |
| `google_pay.md` | Google Pay setup and troubleshooting |
| `apple_pay.md` | (also in payments/) |
| `support.md` | Support channels: in-app, email, SOS hotline |
| `e_money_account.md` | E-money account (discontinued in V5): limits, upgrade path |

### Signup (`signup/`)
| File | Content |
|------|---------|
| `account_opening.md` | 5-minute personal signup, business signup, student discount |

---

## Banking Domain (`banking_domain/`)

| File | Content |
|------|---------|
| `bunq_overview.md` | bunq company: history, financials, market position, AI (Finn), US expansion |
| `sepa.md` | SEPA: payment schemes (SCT, Instant, Direct Debit), member countries, ISO 20022 |
| `iban.md` | IBAN: structure, format by country, MOD-97 validation, 89-country coverage |
| `psd2_open_banking.md` | PSD2: open banking mandate, AISP/PISP, SCA, regulatory framework |
| `aml_kyc.md` | AML/KYC: compliance requirements, PEP, UBO, EDD, regulatory landscape |

---

## Key Topics for RAG Retrieval

**Plans & Pricing:** plans_overview, free_plan, core_plan, pro_plan, elite_plan
**Saving Money:** massinterest, term_deposits, foreign_currency_savings, savings_account
**Payments:** bic_swift_iban, add_money, bunqme_bunqto, international_transfers
**Cards:** card_types, digital_cards, credit_card_faq, daily_limits
**Security:** phishing_guide, bunq_safety, account_security
**Business:** opening_business_account, business_access_levels, bookkeeping_integrations
**Investments:** stocks, crypto, auto_round_up
**Travel:** esim, travel_insurance, foreign_currency_account
**Budgeting:** easy_budgeting, money_insights, organize_income, net_wealth
**Compliance:** aml_kyc, psd2_open_banking, sepa
