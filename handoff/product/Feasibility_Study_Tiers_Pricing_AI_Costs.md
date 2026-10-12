# Feasibility Study — Tiers, Features, AI Cost & Pricing
Date 2026-10-10. Companion files: `AH_SaaS_Unit_Economics_Model.xlsx` (editable model; change `Assumptions!B2` to switch Low/Base/High cost case), research_tms_competitors.md, research_ai_dispatcher.md, audit reports.
Evidence labels: [V] verified this session · [3P] third-party/vendor-blog figure, re-check before quoting · [E] my estimate to be measured in a pilot.

## 1. Answer in one paragraph
Your instinct was right: **the first-draft prices lose money as soon as the AI Dispatcher is on.** In the Base cost case the v1 add-on ($79 + $0.40/action beyond 200) goes negative at 10, 25 and 100 trucks (-48%, -62%, -58% margin) and is deeply negative in the High case. The platform subscription alone is healthy (~65–86% gross margin). **The AI cost is dominated by phone minutes (~86% of AI cost), not LLM tokens (~9%).** Token prices are small ($0.02–$0.82 per booked load depending on model); what can sink margin is how long the AI stays on the phone and which voice stack it uses. A usage-based price per booked load with hard caps (v2/v3 below) fixes it: Base-case margin 59–77% on AI, but the High case still breaks at 25–100 trucks unless the caps/credits in §6 are built in.

## 2. Reality check on your assumption (ANH data) [V]
- Your assumption: 4 loads/truck/week with every load AI-booked.
- ANH actual [V, queried 2026-10-10]: the trucks table holds 129 records, but only **23 distinct trucks and 22 drivers** were assigned loads in the last 30 days (33 trucks / 27 drivers in 90 days). Truck status: 30 Active, 69 Out of Service, 26 In Maintenance, 4 parked. Last 30 days: 295 loads; last 90 days: 946 loads created (851 with revenue, avg $2,349, median $2,200).
- Loads per running truck per week by month (loads created ÷ distinct trucks ÷ 4.33): Mar 2.2, Apr 2.7, May 2.7, Jun 2.8, Jul 2.9, Aug 2.9, Sep 2.9 → **~2.8/week**. (Jan shows 3,516 loads on 95 trucks, almost certainly the Alvys bulk import - ignore. Oct is a partial month.) The fleet has shrunk from ~51 trucks in Feb to ~23 now.
- So ANH is effectively a **~23-truck carrier at ~2.8 loads/truck/week** (≈295 loads/month), which is close to the "25-truck" scenario. Your 4/week assumption is ~40% above ANH's real throughput - fine as a stress case. (An earlier draft of this report said "~30 trucks, 2.2/week"; that used the Active count instead of trucks actually moving loads, and was wrong.)
- At ANH's real volume (~295 loads/month) with 100% AI booking, Base AI cost ≈ 295 × $1.68 ≈ **$500/month** (Low ≈ $165, High ≈ $1,650).
- Data-hygiene note for migration: import only active/recent trucks, drivers and loads into the SaaS tenant; 100+ truck records are stale.
- Also stress: 100% of loads AI-booked. Repeat-broker loads are usually booked directly. Plan for 30–70% adoption.
- Value anchor: at ~$2,300 per load, a human dispatcher fee of 5–10% would be ~$115–$230 per load (common range, [unverified]). A $4–6 AI fee is ~2–5% of that, so there is room to price on value, but competitors price AI aggressively (Numeo published $99/mo up to 10 trucks [3P]).

## 3. Cost model — what one AI-booked load costs
Per booked load (Base case): ~9 voice minutes (≈3 calls) at ~$0.16/min all-in + ~120k input/17k output LLM tokens + ~5 SMS + ~10 emails + maps.

| Component | Low | Base | High | Source |
|---|---|---|---|---|
| Voice minutes per load | 5 | 9 | 18 | [E] |
| Voice $/min all-in (Vapi $0.05 + STT + LLM + TTS + Twilio ~$0.014) | $0.10 | $0.16 | $0.25 | Vapi $0.05/min [3P]; all-in range $0.07–$0.31 [3P] |
| LLM tokens in/out per load | 60k/8k | 120k/17k | 250k/40k | [E] |
| LLM blended price per 1M in/out | $0.10/$0.50 (Haiku 5.5) | $0.64/$4.00 (80% Gemini Flash + 20% Sonnet 5.5) | $2/$10 (all Sonnet 5.5) | Claude prices [V]; Gemini Flash $0.30/$2.50 [3P] |
| SMS per load × cost | 3 × $0.0109 | 5 × $0.0109 | 10 × $0.0109 | Twilio $0.0079 + ~$0.003 carrier fee [3P] |
| Emails per load × cost | 6 | 10 | 20 (× $0.0009) | Resend overage [3P] |
| **AI cost per booked load** | **$0.56** | **$1.68** | **$5.59** | model |
| of which voice | $0.50 | $1.44 | $4.50 | |
| of which LLM tokens | $0.02 | $0.14 | $0.78 | |

LLM cost per booked load by model at the Base token volume (120k in/17k out) [V prices]: Haiku 5.5 ≈ $0.02 · Gemini 2.5 Flash ≈ $0.08 · Sonnet 5.5 ≈ $0.41 · Opus 5.5 ≈ $0.82 · Fable 5.1 ≈ $2.05. → Use small/fast models for routine steps (parsing, matching, email drafting, notifications), reserve larger models for negotiation reasoning; never put the top model on every step.

Voice sensitivity (cost per load = minutes × $/min): 5 min → $0.50/$0.80/$1.25; 9 min → $0.90/$1.44/$2.25; 18 min → $1.80/$2.88/$4.50 (at $0.10/$0.16/$0.25 per min).

## 4. The four carriers (4 loads/truck/week, 100% AI-booked) — monthly
| | 2 trucks | 10 trucks | 25 trucks | 100 trucks |
|---|---|---|---|---|
| Loads/month | 35 | 173 | 433 | 1,732 |
| AI variable cost — Low | $19 | $97 | $242 | $967 |
| AI variable cost — **Base** | **$58** | **$291** | **$727** | **$2,907** |
| AI variable cost — High | $194 | $968 | $2,419 | $9,677 |
| Other variable (DVIR AI, push, storage) Base | $1 | $5 | $13 | $50 |
| Infra share Base [placeholder] | $3 | $6 | $12 | $40 |
| Support/success allocation Base [placeholder] | $8 | $30 | $80 | $400 |
| Recruiting variable (leads × $1.20) Base | $12 | $48 | $120 | $420 |

Prices: **v1** (first draft) Starter $39 ≤3 trucks +$9; Fleet $14/truck (min $149); Enterprise $10.50/truck (min $1,500); AI add-on $79 incl. 200 loads then $0.40; Recruiting $99.
**v2** (proposed) Starter $79 flat ≤5 trucks (+$12/extra); Fleet $19/truck (min $199); Enterprise $14/truck (min $1,500 + onboarding fee); AI add-on $49 base + $6/booked load (first 200), $4.50 (201–1,000), $3.50 (>1,000); Recruiting $149 + $2.50 per engaged lead.

Gross margin (after variable, allocated infra/support and payment fees):

| Case / price book | 2 trucks | 10 trucks | 25 trucks | 100 trucks |
|---|---|---|---|---|
| Platform only, v1 Base | 66% | 70% | 68% | 65% |
| Platform + AI, **v1 Base** | 38% | **-48%** | **-62%** | **-58%** |
| Platform + AI, v1 High | -92% | -370% | -409% | -392% |
| Platform only, v2 Base | 82% | 77% | 75% | 65% |
| Platform + AI, **v2 Base** | 77% | 72% | 68% | 59% |
| Platform + AI + Recruiting, v2 Base | 81% | 73% | 68% | 59% |
| Platform + AI, v2 Low | 91% | 89% | 88% | 85% |
| Platform + AI, **v2 High** | 30% | 14% | 1.5% | **-23%** |

Monthly gross profit, v2 Base, platform + AI: $257 / $923 / $1,872 / $5,291 (2 / 10 / 25 / 100 trucks); with Recruiting: $415 / $1,118 / $2,141 / $5,870.
Break-even AI price per booked load for 60% margin: $1.40 (Low) / $4.20 (Base) / $14.00 (High).

Not in these margins: engineering, Lovable/Supabase plan costs beyond allocation, sales/marketing/CAC, legal/compliance, churn, free trials, bad debt, taxes, one-time onboarding, load board subscriptions (customer-paid). Treat as gross margin only. A healthy SaaS usually wants ≥70–75% blended gross margin after all variable costs — v2 Base meets it at small/mid sizes and is borderline at 100 trucks.

## 5. What would break the economics (and the controls to build)
1. **Long calls** (holds, IVR menus, negotiation loops). Control: hard per-call and per-load voice-minute caps (e.g., 12 min), hand-off to human at cap, hold-detection hang-up.
2. **Expensive stack on every step.** Control: model routing (small model default; escalate only on low confidence), prompt caching, shortlist loads with rules/SQL first — only LLM-score the top N.
3. **Unbounded loops** (re-pursuing the same dead load). Control: pursuit budget per load ($ cap), max contacts per broker, dedupe, cooldowns.
4. **Spam/abuse and cost attack** via open endpoints (audit found ~125 unauthenticated functions). Control: auth on every AI/voice/SMS function, per-tenant rate limits, kill switch.
5. **Heavy tenants on flat prices.** Control: usage metering per tenant with prepaid credits or a monthly usage cap + overage at cost-plus; Enterprise may bring their own Vapi/LLM keys (pay provider directly, platform fee only).
6. **Free tier/trial farming.** Control: AI features need a card on file; trial credits capped (e.g., 10 AI-booked loads).

## 6. Recommended pricing mechanics (v3, to validate)
- Per-truck **platform** price with unlimited users (market pain point is per-seat pricing [3P]).
- AI Dispatcher: **base fee + price per booked load** (not per "action" — customers understand a booked load), with each booked load including a voice-minute and token allowance (e.g., 10 min + 150k tokens). Overage voice billed at ~cost +40%. Volume tiers as v2 but with a **floor ≥ $4/load**, since the High case costs $5.59.
- Charge only for **booked** loads (aligns price with value; failed pursuits still cost us → include a monthly pursuit allowance and hard pursuit caps).
- Prepaid credit wallet for voice/SMS/AI overage; auto-top-up; hard stop when empty.
- Recruiting: base + per engaged lead; background checks/MVR/PSP at cost +15%; SMS/voice minutes metered.
- Optional **BYO keys** (Enterprise): customer's own Vapi/Twilio/LLM accounts → near-zero variable cost to us, higher platform fee.
- Price anchors [3P]: Tailwind $99/$149/$199 per user, Numeo $99/$499/$1,999 per month by fleet size, Rose Rocket ~$2,080, Revenova ~$2,500, TruckLogics $40–$250 — verify before using in marketing.

## 7. Tier-by-tier feature detail
Legend for ANH status today (from audit): ✅ works · 🔧 exists but buggy/partial · ❌ missing · 🅰 ANH-specific (exclude). Effort S (days) / M (1–3 wks) / L (1–2 months) / XL (2+ months).

### Starter — owner-operators & 1–5 trucks
| Feature | Detail | ANH today | Effort |
|---|---|---|---|
| Loads | Create/edit, multi-stop, status workflow, notes, documents | ✅ (status machine DB-enforced) | — |
| Broker/customer book | Contacts, notes, credit/payment history | 🔧 (broker_id empty) | S |
| Rate confirmation | Generate PDF, e-sign, email to broker; or upload+AI parse | ❌ | M |
| Invoicing | Numbered invoice PDF, email to broker, AR status, payment marking | ❌ (email of uploaded docs only) | M |
| Load P&L | Revenue vs fuel/driver/other per load | 🔧 | S–M |
| Driver app (PWA) | Assigned loads, status updates, BOL/POD scan+upload, messages | 🔧 (BOL/POD timestamp bug, push broken) | M |
| DVIR | Pre/post-trip with photos | 🔧 (pre-trip only) | S–M |
| Expiry tracking | CDL, medical, insurance, registration with email/SMS reminders | 🔧 (browser-only alerts) | S–M |
| Fuel | Card import (EFS etc.), cost per truck/load | ✅/🔧 (re-import duplicates) | S |
| IFTA | Quarterly mileage/fuel by state, report | ❌ | L |
| Load board links | Deep links/search shortcuts to board(s) | ❌ | S |
| Notifications | In-app + push + email | 🔧 | M |
| Basic reports | Revenue, loads, deadhead | 🔧 | S |
| Limits | 1–5 trucks, unlimited users, email support, no AI dispatcher (trial credits only) | | |

### Fleet — 6–50 trucks
Everything in Starter plus:
| Feature | Detail | ANH today | Effort |
|---|---|---|---|
| Dispatch board | Drag/assign, driver suggestions with HOS, deadhead, current-load drop-off | 🔧 (suggestions weak) | M |
| ELD map & tracking | Live positions, ETA, geofence arrival/departure, vendor abstraction (Motive/Samsara/Optima) | 🔧 (device ids empty, geofence never worked) | L |
| Tracking links | Customer/broker shareable live status page | ❌ | M |
| Broker auto-updates | Scheduled status emails, BOL/POD notices | 🔧 (broker_id bug) | S–M |
| Settlements | Driver pay with locked statements, deductions/advances ledger, per-diem, PDFs | 🔧 (double-pay risk, calc copies) | L |
| Factoring | Submission packets, reconciliation, reserve/escrow, fee tiers | 🔧 | M |
| Accounting | QuickBooks sync, AR aging, collections outreach | 🔧 (QB disconnected since May) | M–L |
| Maintenance | Tickets, shop assignment, parts, repair decision wizard | 🔧 (priority triage, fake camera feed) | M |
| Multi-carrier (MC/DOT) | Several carrier entities under one account | ✅/🔧 (3 carriers) | M |
| Roles & permissions | Dispatcher/accounting/shop/driver + custom | 🔧 (open policies) | M |
| Analytics | Truck/driver/lane profitability, management dashboards | 🔧 (P&L math wrong) | M |
| Chat | Internal chat dispatcher↔driver↔shop | ✅ (low use) | S |

### Enterprise — 50+ trucks (quote/volume)
Everything in Fleet plus: multi-entity consolidation, EDI/API & webhooks, advanced geofence & detention automation, lane/customer analytics, ACH payroll/1099 and two-way accounting sync, SSO/SAML, audit logs, white-label, custom roles/approvals, SLA & dedicated onboarding, BYO provider keys for AI/voice/SMS, data export/warehouse. Status today: audit logs ✅/🔧, others ❌ · Effort L–XL.

### Dispatch Company mode — dispatchers working for owner-operators/carriers they don't own
| Feature | Detail | ANH today | Effort |
|---|---|---|---|
| Multi-carrier workspace | One dispatcher team managing many external carriers with strict data separation | ❌ (needs multi-tenancy) | L |
| Carrier onboarding packet | W-9, authority, insurance COI, dispatch agreement e-sign, ACH details | 🔧 (e-sign exists) | M |
| Commission engine | % of linehaul per carrier, flat fee, minimums; auto-deduct on settlement | ❌ | M |
| Per-carrier statements | Settlement & commission statements per carrier | 🔧 | M |
| Carrier/owner-operator portal | View loads, docs, statements; accept/reject loads | 🔧 (driver app base) | M |
| Broker-facing identity | Dispatch company vs carrier name on rate-cons/invoices | ❌ | S–M |
| Priced | $199 base + ~$8 per managed truck (hypothesis) | | |

### Add-on — AI Dispatcher
| Feature | Detail | Effort |
|---|---|---|
| Load search | Official board APIs only (123Loadboard first; DAT/Truckstop via partner access, per-tenant credentials); email-offer parsing | L |
| Matching | Equipment, location, HOS, deadhead, rate/mile floor, driver preferences | M |
| Broker outreach | Email drafts + AI voice call with disclosure; all-party-consent recording notice | L |
| Driver accept/reject | Push + in-app card with load summary; live decision while AI is on the call | M |
| Guardrails | Never commits without driver accept, rate floor/counter limits, human hand-off, kill switch, quiet hours | M |
| Booking → load | Rate-con email intake, AI parse with confidence + human review, auto-create load, driver dispatch | L |
| Document loop | BOL upload → broker notified; POD upload → broker notified; invoice or factoring packet; QuickBooks | M |
| Metering | Per-tenant minutes/tokens/pursuits, credits, caps, cost dashboard | M |
| Compliance | Twilio SHAKEN/STIR & 10DLC, TCPA review for AI voice, recording consent by state, counsel sign-off | M |
Status today: ❌ (building blocks exist: Vapi/GHL/Twilio, queue design, document parsing, DVIR AI) · total L–XL.

### Add-on — Driver Recruiting (strongest existing asset)
| Feature | Detail | ANH today | Effort |
|---|---|---|---|
| Public application | Branded multi-step form, screening rules, consent, doc upload | ✅/🔧 (anon insert hole, consent trigger check) | S–M |
| Lead intake | Meta/GHL/webhooks, source tracking, CAPI pixel | 🔧 (inbound replies dropped) | M |
| Automated SMS cadence | Sequences, quiet hours, STOP, caps | 🔧 (STOP not honored; 113 dead jobs) | M |
| AI voice calls | Scripted calls, outcomes, transcripts/recordings, callbacks | 🔧 (webhook dead since 9/30) | M |
| Screening & stages | Disqualify rules, hand-offs, owner assignment | 🔧 (stages = DB enum) | M–L (configurable stages) |
| Documents & e-sign | CDL/medical collection, onboarding agreements | 🔧 (templates hard-code RL DESUE; no audit trail) | M |
| Compliance | DQ file, MVR/PSP/Clearinghouse tracking, FCRA adverse action | ❌/🔧 (manual tracking) | L |
| Travel/arrival | Itineraries and reminders | ✅/🔧 | S |
| Reporting | Funnel by source, cost per hire (needs ad spend import) | 🔧 | M |
| Multi-tenant | Per-tenant numbers, templates, consent text, hiring states, branding | ❌ (singleton config) | L |

### Add-on — Safety & Compliance
DQ file, drug/alcohol random pool, MVR/Clearinghouse, incidents/accidents, scores/CSA, insurance policies, server-side expiry alerts, audit packets. ANH: tables mostly empty/unused, alerts browser-only → effort L.

### Add-on — Community & Rewards (later)
Cross-company community chat/forum for participants, driver contests/bonus programs, leaderboards/streaks, recognition. ANH: bonuses/streaks tables empty, bonus programs inactive, chat barely used → rebuild with product design; effort L. Moderation, privacy and cross-tenant visibility rules must be decided before building.

### Modern Driver App (cross-tier)
Native-feel PWA or native wrapper, reliable push, background GPS, offline mode, signature capture, load accept/reject, doc scanner with auto-crop/OCR, DVIR, messaging, pay statements, bonuses/contests, multi-language. Today: 🔧 (push broken, 6/48 tokens). Effort L.

## 8. Feasibility verdict by tier
- **Starter/Fleet**: financially healthy (65–86% platform margin [model]); main risk is feature credibility (rate-con, invoice PDF, IFTA, tracking links, load board links) and trust (security fixes).
- **AI Dispatcher**: feasible only as **usage-priced** with caps. Unit cost $0.56–$5.59 per booked load; at ≥$4.50/load with a $4 floor, margins hold in Base, and caps + credits bound the High case. Legal/ToS risk (AI voice rules, board terms) must be cleared; competitors (FleetWorks, TruckSmarter, Numeo) already fund-raised in this space [3P] — speed and integration with documents/invoicing/factoring is the differentiator.
- **Recruiting**: feasible and a natural paid add-on; compliance defects (STOP, inbound loss, anon insert) must be fixed first.
- **Dispatch Co**: feasible after multi-tenancy; strong differentiation because competitors price per seat.
- **Enterprise/EDI/white-label**: later; sell only after tenant isolation, SOC-2-style controls and support process exist.

## 9. What I need from you / next steps
1. Confirm the load-per-truck and AI-adoption assumptions to use for planning (ANH real ≈2.2/week).
2. Choose the AI-dispatcher launch scope (recommend: search + matching + email outreach + rate-con parse first; voice calls second behind human approval).
3. Approve a **pilot** to measure real voice minutes/tokens per booked load on ANH's own loads in staging (replaces estimates [E]).
4. Verify vendor prices on their own pages (Vapi, Twilio, Gemini, Supabase, Stripe) — I only had third-party summaries for most.
5. Decide fresh multi-tenant build vs retrofit (recommended: fresh, ANH imported as tenant #1).
