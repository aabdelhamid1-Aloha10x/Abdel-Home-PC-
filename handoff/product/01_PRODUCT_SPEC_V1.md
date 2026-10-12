# Fleet OS — Consolidated Product Spec V1 (2026-10-10)
Status: DRAFT for Abdel. Authority order: 00_PACKAGING_LOCKED.md (plans, prices, credits, gating) > this file > the five department blueprints (their Core/Pro/Autopilot language, per-load prices and per-bot caps are SUPERSEDED). Sources read: 00_PACKAGING_LOCKED, dispatch_driver, accounting, shop_compliance, recruiting_hr, command_platform, AI_Model_Comparison, Master_Plan. operator_console.md (written in parallel) is slotted in as module M10 and not read.
Legend: [V] = vendor-verified price in AI_Model_Comparison; [E] = estimate; [D] = my design decision (needs Abdel only if listed in section 7). Plan cells: ✓ included, L = included with fair-use limit, + = paid add-on, — = not available.

## 0. Product in one paragraph
Phone-first back office for owner-operators and small fleets. A rate-con photo/email becomes a load; the driver app moves it to delivered with scans; the money module invoices, factors, reconciles and settles; safety/compliance gates dispatch; AI bots do the typing, drafting and chasing and every AI action is metered in credits and governed by an Off / Suggest / Auto switch. Wedge = Solo and Core (1-3 trucks). Growth (up to 25) adds department roles, shared inbox, voice, recruiting, report builder, health board. Enterprise (26+) is sales-led.

---
## 1. Product map (modules, sub-modules, owner, plans, bots)
Owner dept = which blueprint owns the build and the data. Plan columns use the LOCKED packaging. All AI bots are on every plan except voice bots (Growth+); credit-metered; switch Off/Suggest/Auto.

| # | Module / sub-module | Owner dept | Solo | Core | Growth | Ent | AI bots inside |
|---|---|---|---|---|---|---|---|
| M0 | **Platform foundation** | Platform | | | | | |
| 0.1 | Orgs, auth, invites, 3 starter roles (Owner, Dispatcher, Driver) | Platform | ✓ (Owner+Driver only) | ✓ | ✓ | ✓ | — |
| 0.2 | Department roles (8), leader flag, teams, permission matrix, custom roles | Platform | — | — | ✓ | ✓ | — |
| 0.3 | Billing, credit wallet, top-ups, usage meter, plan compare, locked-feature dollar previews | Platform | ✓ | ✓ | ✓ | quoted | — |
| 0.4 | AI Gateway (jobs, tiers, cheap-first, escalate, fallback) + Bot Control Center (Off/Suggest/Auto, kill switch) | Platform | ✓ | ✓ | ✓ | ✓ | all bots route here |
| 0.5 | Outbound queue + consent/STOP ledger + quiet hours + Test/Live | Platform | ✓ | ✓ | ✓ | ✓ | STOP-intent classifier (Fast) |
| 0.6 | Webhook gateway, integrations hub (Connect / paste key / Included) | Platform | 2 integr. | 2 integr. | 8 | unlimited | Import Mapper |
| 0.7 | Health Board (jobs, tokens, queues) | Platform | banner only | banner only | ✓ | ✓ | Alert Explainer |
| 0.8 | Audit log (users + bots), data export | Platform | ✓ 90 d | ✓ 90 d | ✓ 1 yr | ✓ export, 3 yr | — |
| 0.9 | Multi-entity (several MC/DOT), approval chains, SSO, public API/webhooks | Platform | — | — | — | ✓ | — |
| M1 | **Dispatch & loads** | Dispatch | | | | | |
| 1.1 | Load intake: rate-con inbox (forward email/upload/photo), 4-step wizard, duplicate guard, load numbering | Dispatch | ✓ | ✓ | ✓ | ✓ | Rate-Con Reader |
| 1.2 | Load board, load detail, status workflow, docs, cancel/TONU, notes/tasks, saved views | Dispatch | ✓ | ✓ | ✓ | ✓ | Smart Search |
| 1.3 | Break-even check, broker standing, feasibility + override approvals | Dispatch | ✓ (warn only) | ✓ | ✓ | ✓ | "Why this truck" (Fast) |
| 1.4 | Live map, ETA engine, geofence, detention timer, tracking link | Dispatch | ✓ phone GPS | ✓ | ✓ + ELD | ✓ | Delay-Risk narrator |
| 1.5 | Broker updates (templates) + exception drafting | Dispatch | ✓ | ✓ | ✓ | ✓ | Outbound Writer |
| 1.6 | Control tower, Roll call, team scorecards | Dispatch | — | L (roll call) | ✓ | ✓ | Dispatch Planner (Smart) |
| 1.7 | Check calls: reminder (workflow) / AI text / AI voice | Dispatch | text | text | text + voice | ✓ | Check-call text, Voice agent (Growth+) |
| 1.8 | Broker & customer book (dedupe, FMCSA lookup, rate/pay history, DNU) | Dispatch | ✓ | ✓ | ✓ | ✓ | Merge suggester (V2) |
| M2 | **Fleet records** (trucks, trailers, drivers, carrier entity, assignments, ELD mapping, expiry dates) | Dispatch | 1 truck | ≤3 | ≤25 | 26+ | Import Mapper |
| M3 | **Driver app + Operator mode** | Dispatch | ✓ operator mode | ✓ | ✓ | ✓ | |
| 3.1 | Today/next-action, offers, scan, messages, pay, docs, breakdown, EN/ES | Dispatch | ✓ | ✓ | ✓ | ✓ | Document Reader, Driver Assistant |
| 3.2 | DVIR pre/post-trip, 10 photos, noon lock, grace | Dispatch | ✓ (no lock) | ✓ lock | ✓ | ✓ | DVIR Analyst |
| 3.3 | Operator mode `/m` (Today, Loads, Money, Truck, More) + Fleet-mode switch | Dispatch | ✓ | ✓ | ✓ | ✓ | |
| M4 | **Accounting / Money** | Accounting | | | | | |
| 4.1 | Ready-to-bill, invoice builder + package, send to broker/factor, send log | Accounting | ✓ | ✓ | ✓ | ✓ | Document Reader (POD check), Leak Finder |
| 4.2 | Factor packets, fee models, remittance import, reconciliation, reserves | Accounting | L | ✓ | ✓ | ✓ | Remittance Reader, Recon Matcher |
| 4.3 | AR aging, collections, NOA campaign, short-pay, detention billing | Accounting | ✓ | ✓ | ✓ | ✓ | Collections, Short-Pay, Detention Hunter (via Outbound Writer) |
| 4.4 | Settlements engine (one pay engine), locks, approval, publish, pay run, advances | Accounting | self-settle | ✓ | ✓ | ✓ approval chains | Settlement Auditor |
| 4.5 | Fuel import, receipt scan, expenses, fuel-to-load, Fuel Watch | Accounting | ✓ | ✓ | ✓ | ✓ | Receipt Scanner, Fuel explainer |
| 4.6 | IFTA, P&L (load/truck/lane/customer), cost profile | Accounting | ✓ | ✓ | ✓ | ✓ | — |
| 4.7 | QuickBooks sync, bank-feed categorize, vendors/W-9 vault, owner statements | Accounting | — | basic | ✓ | ✓ | Categorizer |
| M5 | **Shop / Maintenance / Road team** | Shop | | | | | |
| 5.1 | Breakdown report + desk, tickets/work orders, find shops, spend approval, receipts | Shop | report + ticket | ✓ | ✓ | ✓ | Breakdown Triage, Receipt Reader |
| 5.2 | PM schedules, truck health, DVIR review queue, defect→ticket, vendors | Shop | PM list | ✓ | ✓ | ✓ | DVIR Analyst, PM Predictor |
| 5.3 | Handoff, repair-or-tow, warranty recovery, AI shop calls | Shop | — | — (text only) | ✓ (calls Growth+) | ✓ | Handoff Writer, Repair-or-Tow, Warranty Drafter, Shop-Call Voice |
| 5.4 | Shop-floor / technician mode | Shop | — | — | + (V2) | + | — |
| M6 | **Safety & Compliance** | Safety | | | | | |
| 6.1 | Document vault + bulk AI sorter, expiry ladder (server-side), dispatch gate, readiness score | Safety | ✓ | ✓ | ✓ | ✓ | Document Sorter, Renewal Chaser |
| 6.2 | Permits/IRP/IFTA/UCR calendar, insurance + COI, incidents | Safety | ✓ calendar | ✓ | ✓ | ✓ | COI Reader, Incident Assistant |
| 6.3 | DQ files, drug & alcohol, Clearinghouse tracking, audit packet | Safety | — | L (DQ lite) | ✓ | ✓ | MVR Reader, Audit Memo |
| 6.4 | HOS/ELD read-only, roadside + CSA snapshot, driver safety score | Safety | — | — | ✓ | ✓ | — |
| M7 | **Recruiting & HR / onboarding** | Recruiting | — | + add-on | ✓ | ✓ | |
| 7.1 | Apply form, pipeline, Needs-me queue, candidate profile, funnel analytics | Recruiting | — | + | ✓ | ✓ | Funnel Analyst (via Ask) |
| 7.2 | Two-way SMS, 10DLC, AI text assistant, take-over | Recruiting | — | + | ✓ | ✓ | Driver/Candidate Text Assistant |
| 7.3 | AI voice screening, warm transfer, recordings | Recruiting | — | — | ✓ | ✓ | Voice agent (Growth+) |
| 7.4 | Checks (MVR/PSP/CH), approval gate, e-sign onboarding, Activate, orientation/travel | Recruiting | — | + | ✓ | ✓ | MVR Reader, Adverse-Action Drafter, Itinerary Parser |
| M8 | **Command & analytics** | Platform | | | | | |
| 8.1 | Cockpit, pipeline, fleet wall, Profit Lens, load P&L, trends, goals | Platform | ✓ lite | ✓ | ✓ | ✓ | — |
| 8.2 | Morning Brief (one brief, sections per module) | Platform | ✓ | ✓ | ✓ | ✓ | Brief Writer |
| 8.3 | Ask Your Company (one bot, department scopes) | Platform | ✓ | ✓ | ✓ | ✓ | Ask bot |
| 8.4 | Money-Found (shadow detectors, free) + plan previews | Accounting | ✓ | ✓ | ✓ | ✓ | — |
| 8.5 | Dashboards, report builder, scheduled reports, what-if/forecast/benchmarks | Platform | 1 dash | 3 | ✓ | ✓ custom analytics | Report Builder Assist |
| M9 | **Communications** | Platform | | | | | |
| 9.1 | Notification center + prefs, rate-con intake address, load/object threads, SMS | Platform | ✓ | ✓ | ✓ | ✓ | Driver Assistant |
| 9.2 | Shared inbox (assign, notes, rules, linked to load/broker) | Platform | — | — | ✓ | ✓ | Inbox Triage, Reply (Outbound Writer), Summarizer |
| M10 | **Operator Console** (internal support + owner app, bot monitoring) | Operator console doc | internal | internal | internal | internal | consumes bot_runs, credit_events, queue, health |

Out of product: sales/investor CRM (stays in ANH's own app). Owner statements kept as Core-level V2 generation from the ledger.

---
## 2. AI features re-mapped to the locked rules
### 2.1 Rules that replace Core/Pro/Autopilot everywhere
1. Every AI feature exists on every plan. The only plan gate is VOICE (calls) = Growth+ (Enterprise too). AI texting is on all plans.
2. The old per-bot monthly caps (e.g. "Ask 150/1,000") are deleted. The ONLY limit is the credit wallet (+ optional owner per-bot budget, + a daily runaway guard of 25% of plan credits [D]).
3. Autonomy per bot = Off / Suggest / Auto. Default for every new tenant = Suggest (Off for voice and anything that contacts third parties outside templates). Moving to Auto: owner-only, 2FA, guardrail form (max $, recipients, confidence floor, daily cap), then a 7-day Auto trial banner.
4. Hard ceilings regardless of plan or switch (carried from the five files): never auto-accept a tender; never auto-approve or pay settlements; never edit pay/deductions; never choose drug-test selections or write results; never hiring/adverse-action decisions (human sends FCRA letters); never auto-repair/tow purchase; money-or-legal wording in external messages = human; bank-detail change = second approval; STOP honoured across SMS+voice by deterministic code, not AI.
5. Out of credits: workflows keep running; Auto bots drop to Suggest, then Off when balance is 0; drivers never locked out. Every AI feature MUST ship a non-AI fallback ("degraded mode"): template drafts, manual entry form beside the PDF, rule-based list instead of AI wording, plain brief template.
6. Voice is gated by plan entitlement AND consent AND quiet hours AND balance; below Growth it shows the locked preview with dollars.
7. Customers see actions and credits, never tokens or vendors.

### 2.2 Master credit-price table (1 credit = $0.01 of our cost; ledger stores milli-credits so 0.05 credit is a valid price)
Conversion: credits = ceil(unit cost / $0.01 to the nearest 0.05). Headroom for retries (20-30%) is covered by the margins in the locked file, not added per action. Duplicates across files are collapsed to one price (section 2.3).

| Action (credit code) | Credits | Cost basis | Models / notes |
|---|---|---|---|
| **Documents** | | | |
| Doc read, 1 page (BOL, POD, lumper, scale, receipt, CDL/medical/ID, COI, fuel/shop receipt) `doc.read1` | 0.5 | $0.004-0.005 [V price, E tokens] | Balanced (Gemini 3.6 Flash); same file hash is never charged twice |
| Doc read, multi-page (rate con, invoice, shop invoice, MVR, itinerary) `doc.readN` | 1.1 | $0.0083 + ~12% escalation [V] | escalation to Sonnet 5.5 included |
| Rate-con read to draft load (incl. validation, broker match) `doc.ratecon` | 1.1 | $0.011 [V/E] | = doc.readN |
| Remittance report read (10 pages) `doc.remit` | 2.7 | $0.0263 [E] | Balanced + 10% Sonnet |
| Bulk doc sort/classify/match (vault) `doc.sort` | 0.5 | $0.005 [V] | one-time 700-page import at Batch -50% |
| Receipt/expense scan to ledger line `doc.receipt` | 0.5 | $0.0041 | = doc.read1 |
| MVR / PSP report read + policy recommendation `doc.mvr` | 1.2 | $0.0105-0.012 [E] | Safety owns; Recruiting calls it |
| Import mapper (CSV/XLSX/PDF) per file `import.map` | 1.0 | $0.006-0.0098 [E] | one price replaces 3 |
| **Messaging / language** | | | |
| Inbox / text triage per message `ai.triage` | 0.05 | $0.0002 [V] | Fast; 20 msgs = 1 credit |
| STOP-intent check | 0 | keyword rules first | only ambiguous text goes to Fast (0.05) |
| Smart search (NL to filter) `ai.search` | 0.1 | $0.0003-0.0008 [E] | Fast; one global bot |
| Thread summary `ai.summary` | 0.1 | $0.00105 | Fast |
| Delay-risk / alert explainer, Fast variant `ai.alert.fast` | 0.1 | $0.0008 | dispatch delay risk |
| Alert explainer, Balanced `ai.alert` | 0.35 | $0.0034 | margin drop, slow payer etc. |
| Outbound Writer, template-class draft (milestone exception, ack) `ai.write.std` | 0.3 | $0.0026 [V] | Balanced |
| Outbound Writer, smart draft (collections, dispute, ETA-impact, adverse-action cover, inbox reply, claim) `ai.write.smart` | 0.7 | $0.007 [V] | Sonnet 5.5; one price for 6 old bots |
| Driver / candidate text assistant, per inbound handled `ai.text` | 0.25 | $0.0023 [V+E] | triage + Balanced reply; template-only answers 0.05 |
| Check-call text with reply parse `ai.checkcall.text` | 0.3 | $0.0026 | |
| Renewal chaser, per case (AI part) `ai.renewal` | 0.3 | $0.003 | SMS segments billed separately |
| Driver app co-pilot turn `ai.copilot` | 0.1 | $0.001 | |
| **Reasoning / analytics** | | | |
| Ask Your Company (complex, cached) `ai.ask` | 4.0 | $0.04 [V Job 4] | ONE bot for 5 old "ask" bots; simple lookup (Haiku) `ai.ask.simple` 0.5 |
| Morning Brief, daily `ai.brief` | 1.5 | $0.012-0.055 blended [E] | one brief with module sections (replaces 3 briefs) |
| Weekly deep brief (cash + funnel + bots ledger) `ai.brief.week` | 5.0 | $0.05 | |
| Report-builder assist `ai.report` | 1.0 | $0.010 | |
| Dispatch Planner, per plan `ai.plan` | 7.0 | $0.07 [V Job 7] | Sonnet 5.5; Opus on hard plans = 14 |
| Repair-or-tow advisor `ai.repairtow` | 8.4 | $0.084 | |
| PM / failure predictor per truck-run `ai.pm` | 0.75 | $0.0075 | weekly |
| Handoff narrative (shift) `ai.handoff` | 0.75 | $0.0075 | |
| Settlement Auditor per statement `ai.settle` | 0.9 | $0.009 | suggest-only always |
| **Vision / ops** | | | |
| DVIR analyst: photo validity per DVIR `ai.dvir` | 0.25 | Fast $0.0012 vs Balanced $0.011 (conflict) | Fast first, Balanced only on flagged photos; blended 0.25 |
| DVIR defect triage + ticket draft `ai.defect` | 0.6 | $0.006 [V] | |
| Ticket photo triage `ai.photo` | 0.6 | $0.006 [V] | |
| Breakdown triage per case (6 turns) `ai.breakdown` | 1.7 | $0.017 [V] (dispatch said $0.038 incl. Places) | one bot |
| Find nearby shops (Places lookup) `shops.find` | 3.2 | $0.032 [E, verify] | workflow, not AI; cache by location 24 h |
| Incident assistant per incident `ai.incident` | 5.4 | $0.054 | |
| Audit packet memo `ai.auditmemo` | 2.0 | $0.02 | |
| Warranty / repeat-repair claim draft `ai.warranty` | 1.5 | $0.015 | |
| **Money recovery** | | | |
| Invoice leak check, AI step per flagged invoice `ai.leak` | 1.0 | $0.006-0.01 | workflow compares first; ~30% of invoices flagged, avg 0.3 |
| Detention claim `ai.detention` | 1.2 | $0.012 | |
| Short-pay dispute case `ai.shortpay` | 1.6 | $0.016 | |
| Reconciliation match per unmatched row `ai.recon` | 0.35 | $0.0034 | |
| Bank/QB categorize per txn `ai.categorize` | 0.05 | $0.0002 (Batch $0.0001) | |
| Fuel Watch explainer `ai.fuel` | 0.3 | $0.003 | |
| **Voice and telephony (Growth+)** | | | |
| Voice minute `voice.min` | 12 | $0.12/min all-in cascade [E from V $0.09-0.13] | per second billing; Gemini Live cost-saver $0.025 = 2.5 credits once proven; Bland $0.14 = 14 |
| Check call (3 min) | 36 | $0.36 | dispatch file |
| Shop call (3 min, ×3 per breakdown) | 36 each | $0.331 [E at $0.11/min] | conflict: unified to 12/min |
| Recruiting screening call (4 min + 0.5 summary) | 48.5 | $0.485 | |
| Voicemail-only attempt (30 s) | 6 | $0.06 | |
| SMS segment out / in `sms.out` / `sms.in` | 1.2 / 0.8 | $0.012 / $0.0075 all-in [E] | conflict range $0.008-0.012 across files; see 2.3 |
| Brief voice read-out (V2) | 3.6 | $0.036 [V] | |

Not metered (inside fair use / the ~$2 per truck non-AI budget): email, push, storage, maps for ETA, Money-Found detectors, all workflows. Recommendation [D]: workflow SMS has a pooled fair-use allowance (Solo 100, Core 300, Growth 1,500 segments/mo), beyond that 1.2 credits; AI conversation SMS always charges. Needs Abdel (Q3).

### 2.3 Duplicates and conflicts found in cost/units (resolution)
| Conflict | Where | Resolution |
|---|---|---|
| SMS segment: $0.0109 (dispatch), $0.011 out/$0.0075 in (shop), $0.008 (accounting), $0.012 (recruiting, command) | 5 files | one price 1.2 out / 0.8 in; re-measure with real provider after 10DLC |
| Voice per minute: $0.11 (shop, accounting), $0.12 (dispatch, recruiting), $0.14 Bland Start | 4 files | 12 credits/min; engine setting per tenant; blind test decides vendor |
| Doc reader unit cost $0.004 (dispatch) vs $0.0083 (accounting, recruiting $0.009) vs $0.005 (compliance) for the same bot | 5 files | one Document AI service; 1-page 0.5, multi-page 1.1; cache by file hash so a POD scanned once is read once |
| DVIR AI: $0.011 per DVIR Balanced (dispatch) vs $0.0012 Fast (shop) | 2 files | Fast for photo validity, Balanced only on flagged; 0.25 |
| Breakdown triage $0.038 (incl. Places) vs $0.017 | 2 files | Shop owns bot 1.7; Places 3.2 shown separately |
| "Ask" chat ×5, brief ×3, smart search ×3, triage ×2, import mapper ×3, broker/customer drafter ×5 | all | one bot each; the department view is a scope/section |
| Ticket/ETA-impact draft: Gemini Flash $0.0026 vs Sonnet $0.007 | dispatch vs shop/accounting | tone-critical or money = Sonnet (0.7), routine exception = Flash (0.3) |
| Check-call 3 min $0.36 vs text variant | dispatch | text on all plans, voice Growth+ |
| Autopilot-only bots (detention, short-pay, collections, planner, voice) were the upsell | accounting, dispatch | now all plans via credits; Money-Found previews remain as awareness, no longer an upgrade gate |

### 2.4 What the monthly included credits buy (example usage mixes, 1 credit = $0.01)
Sizing rule in the locked file: included = ~50% of a heavy user, so heavy = 600 / 2,000 / 8,000 credits. Mixes below are typical use, computed from the table above.

| Plan (credits) | Typical month | Line items (count × credits) | Used |
|---|---|---|---|
| **Solo 300** (1 truck, 30 loads) | rate-cons 30×1.1 = 33; BOL/POD/lumper 90×0.5 = 45; receipts 20×0.5 = 10; DVIR 22×0.25 = 5.5; delay alerts 20×0.1 = 2; broker drafts 10×0.5 = 5; searches 40×0.1 = 4; Ask 15×4 = 60; daily brief 30×1.5 = 45; leak checks 30×0.3 = 9; detention 4×1.2 + short-pay 2×1.6 + collections 8×0.7 = 13.6; 1 breakdown 4.9 | ~237 (79%) |
| **Core 1,000** (3 trucks, 100 loads) | rate-cons 110; docs 300×0.5 = 150; receipts 30; DVIR 16.5; delay 6; drafts 20; triage 300×0.05 = 15; search 10; Ask 40×4 = 160; brief 45; leak 30; detention/short-pay/collections 48.6; settlement audit 10.8; categorize 15; breakdowns 3×4.9 = 14.7; planner 10×7 = 70; check-call texts 15 | ~767 (77%) |
| **Growth 4,000, no voice** (25 trucks, 400 loads) | rate-cons 440; docs 600; receipts 100; DVIR 125; delay 30; drafts 100; triage 3,000×0.05 = 150; search 30; Ask 150×4 = 600; brief 45; leak 120; planner 100×7 = 700; money bots 180; settlement audit 90; categorize 50; breakdowns 122; PM + handoff 98; AI texts 800×0.25 = 200; renewals 112; DQ 24; recon 46 | ~3,960 (99%) |
| Growth voice add-on | 4,000 credits alone = 111 three-minute check calls, or 82 recruiting screening calls; a Growth fleet doing 100 check calls + 50 screenings = 6,000 credits more than the plan | buy top-ups: 5,000 = $110 |

Reading: Solo and Core fit comfortably (headroom for a bad month). Growth is exactly consumed by non-voice AI at ANH-like volume, so voice and recruiting calls are effectively top-up funded: 1,000 top-up credits ($25) = 27 check calls (our cost $10 = 60% margin). Biggest credit hogs: Ask (4 each), planner (7 each), voice. Gateway should show "top consumers" in Billing so owners can switch a bot to Suggest/Off.

---
## 3. MVP cut and roadmap
Principle: ship the owner-operator/small-fleet wedge (Solo, Core) end to end — photo of rate con to paid invoice — before anything department-shaped. Everything below "V2" is designed (blueprints exist) but not built.

### 3.1 Launch (Phase 1+2) must exist
| Area | In launch | Deliberately cut from launch |
|---|---|---|
| Platform | orgs/RLS, 3 roles, Stripe 3 plans + 3 top-ups + dunning, credit ledger + meter, AI gateway (jobs: doc, triage, draft, ask, brief), Bot Control (switches + kill switch), outbound queue (email, SMS, push) + consent ledger, audit log, webhook gateway (Stripe, SMS provider, inbound email), Off/Test/Live, feature flags, minimal operator console | Integrations hub UI (use fixed settings cards), health board (job heartbeat table only), custom roles, SSO |
| Dispatch | rate-con intake + reader, wizard, load board, load detail, status rules, docs, break-even + broker standing, simple feasibility (warn), phone-GPS map/ETA, tracking link, broker update templates, broker book, load-board deep links, truck/trailer/driver records | planner, tower/roll call (Core gets a simple roll-call list), geofence-based detention (use manual arrival + timer in V1.1), ELD adapters, check-call voice, broker merge AI |
| Driver app | PWA: login by SMS link, Today, accept/decline, scan (BOL/POD with AI read + retake), DVIR with photos (lock in Core), messages, pay stmt, docs, breakdown report, operator mode | store wrapper (decision Q6), EN/ES (V1.1), AI co-pilot, voice notes |
| Money | ready-to-bill, invoice builder + package, send to broker/factor (idempotent), AR aging + templated reminders, fuel import + receipt scan, expenses, load P&L + cost profile, one pay engine + statements (no payroll rails), IFTA v1 (odometer + fuel by state; GPS crossings later), Money-Found detectors, Collections/short-pay/detention drafts via Outbound Writer | remittance reconciliation + reserves (Growth, Phase 3), QuickBooks sync, owner statements, bank-feed categorizer, payroll hooks |
| Safety | vault + AI sorter, server-side expiry ladder, dispatch gate (warn-then-block), permits calendar, insurance policy list | DQ files, drug & alcohol, incidents assistant, audit packet, HOS |
| Shop | breakdown report, ticket, receipt reader, PM list, DVIR defect→ticket | breakdown desk with chat, AI triage (ship on Phase 3 — Fast text triage can come earlier at 0.1 effort), repair-or-tow, shop floor |
| Command | cockpit-lite (pulse, pipeline, profit/load/truck), Morning Brief (template + AI), Ask (5 tools), notifications | scorecards, goals, dashboards, report builder, what-if |
| Comms | notification center, rate-con intake address, SMS notifications with STOP | shared inbox, broadcast, Telegram bridge |
| Recruiting | none | everything (add-on) |
| Voice | none | all |

### 3.2 Phased roadmap with dependencies
| Phase | Weeks [E] | Scope | Depends on | Exit gate |
|---|---|---|---|---|
| P0 Prove | 0-2 | static HTML prototypes of 8 key screens; knowledge file; foundation SQL drafted; 100-rate-con gold set; decisions Q1-Q4 | Abdel answers | prototypes signed off by 3 real O/Os |
| P1 Foundation | 2-5 | M0 core: orgs, RLS, roles, plans/entitlements, Stripe, credit ledger, AI gateway v1, outbound queue + consent, webhook gateway, audit, console-min | P0 | RLS cross-tenant test suite green; ledger concurrency test green |
| P2 Solo/Core MVP | 5-12 | M1, M2, M3, M4 (launch scope), M6-lite, M5-lite, M8-lite; onboarding/import wizard | P1 (ledger, gateway, queue) | 5-10 private-beta O/Os run real loads rate-con→paid; Gold set ≥ 95% on money fields |
| P3 Growth ops | 12-22 | dept roles/teams, shared inbox, factoring recon + reserves + collections, settlement locks/approval, ELD adapter (1st vendor), geofence/ETA worker, planner, tower/roll call, Shop desk + PM + DVIR review, Safety DQ/incidents/permits, report builder/dashboards, health board, voice check-calls (telephony), QuickBooks | P2; worker service; telephony accounts | ANH imported as tenant #1 (Enterprise-flag for 3 MC/DOT); Growth plan GA |
| P4 Recruiting + voice | 22-30 | M7 (apply, pipeline, inbox, 10DLC, AI text, voice screening, checks, e-sign, onboarding) as Core add-on / Growth included; MVR/PSP/Clearinghouse vendors | P3 (consent ledger, voice engine, queue), legal review | STOP synthetic test green 14 days; counsel sign-off |
| P5 Enterprise | 30+ | multi-entity, approval chains, SSO, public API/webhooks, audit export, custom analytics, AI dispatcher / load-board API, EDI | P3-P4 | first sales-led customer |
Critical path: credit ledger + AI gateway + outbound queue → every bot. Telephony worker → all voice. Consent ledger → recruiting, check-calls, renewals, any SMS.

---
## 4. System architecture summary
### 4.1 Tenancy, roles, RLS
- Every business table has `org_id uuid not null` + `carrier_id` where per-entity. One Supabase Postgres (single project, not per-tenant DBs). Auth user ↔ `org_members(user_id, org_id, role, leader bool, team_id, flags jsonb, status)`. JWT custom claim `org_id` (+ active_org for staff of several orgs) set by an auth hook; RLS: `org_id = auth.jwt()->>'org_id'::uuid` plus a `has_perm(dept, level)` function reading the member row. Never trust client-sent org_id; insert triggers force it.
- Roles: Owner, Manager, Dispatcher, Accounting, Maintenance, Safety, Recruiter, Driver; Leader is a flag; Team is a group; Owner-Operator = Owner+Driver in one login. Solo/Core expose Owner/Dispatcher/Driver only (entitlement `dept_roles=false`). Sensitive flags (separate, default off except Owner): see profit/margins, see pay rates, see bank/SSN, export data, approve money, change bank details, set autonomy Auto, view audit. Data scope All/My team/Assigned (Growth).
- Sensitive PII (SSN, bank, W-9): envelope-encrypted by an edge/worker function (per-tenant data key in KMS), only ciphertext + last-4 in tables; masked before any LLM call; reveal requires permission + reason + re-auth + audit row.
- Storage: private buckets, path `{org_id}/{entity}/{id}/...`, signed URLs 120 s, storage RLS on the same prefix. Platform staff access only through the console (audited impersonation).

### 4.2 Plan, entitlements, feature flags
- `plans` (solo/core/growth/enterprise) → `plan_features(feature_key, value)`: `trucks_limit` (1/3/25/custom), `voice`, `recruiting` (add-on), `dept_roles`, `shared_inbox`, `report_builder`, `health_board`, `integrations_limit` (2/2/8/∞), `multi_entity`, `sso`, `api_webhooks`, `audit_export`, `support_tier`, `included_credits`.
- `org_entitlements` = plan defaults ⊕ Stripe add-on items (Recruiting) ⊕ manual overrides (console, with reason/expiry). One SQL function `has_feature(org, key)` and one TS hook `useEntitlement(key)`; edge functions and the worker call the same function. Enforcement server-side, UI only mirrors it.
- Truck limit: count active trucks; exceeding = upgrade prompt + 30-day grace, nothing blocked. Enterprise = plan `enterprise` with overrides (credits ≈ 4,000 + 160 × (trucks − 25); price per internal guardrail, never public).
- `feature_flags(key, scope: global|plan|org, enabled, rollout_pct)` for dark launches; per-org Off/Test/Live mode at three levels (tenant, department, connection), most restrictive wins.

### 4.3 Credit ledger (the metering core)
```
credit_grants(id, org_id, kind: included|topup|promo|adjust, amount_mc, remaining_mc, granted_at,
              expires_at /*included = period end; topup null*/, source_ref /*stripe invoice or payment id*/)
credit_events(id, org_id, idempotency_key, action_code, units, price_mc, status: reserved|committed|released|failed,
              allocations jsonb /*[{grant_id, mc}]*/, bot_run_id, ref_type, ref_id, created_at)   -- UNIQUE(org_id, idempotency_key)
org_credit_state(org_id, balance_mc, included_mc, topup_mc, month_spent_mc, bot_budgets jsonb)       -- materialised, updated in same txn
```
- 1 credit = 1,000 milli-credits (mc). All consumption through ONE SQL function `consume_credits(org, key, action, units, reserve bool)`: locks grants `FOR UPDATE`, consumes included (earliest expiry first) then top-ups (oldest first), inserts the event and updates org_credit_state in one transaction; duplicate key returns the original result (idempotent). Long jobs (voice) `reserve` an estimate, then `commit(actual)` / `release`.
- Idempotency key = `{job_type}:{subject_id}:{content_hash|attempt}` (e.g. `doc.readN:file_sha256`), so retries, webhook replays and double taps never double-charge.
- Included credits: granted on Stripe `invoice.paid` for the period, `expires_at` = period end; nightly job expires leftovers (writes an `expire` event for reporting). Top-ups: granted on `checkout.session.completed`, idempotent on payment_intent id, never expire. Refund/adjust = negative/positive `adjust` grants by console only.
- Budgets: (1) owner optional per-bot monthly credit budget; (2) daily runaway guard 25% of plan credits; (3) hard stop at balance 0 → gateway returns `CREDIT_EXHAUSTED` → caller uses the degraded path; alerts at 80%/100%/low-balance email; (4) platform anomaly alert in console (spend 3× 7-day mean).
- Calendar vs cycle: locked text says "month end"; implement as billing-period end (shown "resets on {date}") unless Abdel prefers calendar month.

### 4.4 Stripe, top-ups, dunning
- Products: Solo, Core, Growth (monthly recurring), Recruiting add-on (recurring item on Core), 3 top-up SKUs (one-time, Checkout `mode=payment`, metadata `org_id, credits`). Enterprise: invoiced manually / custom price, `plan=enterprise` set by console. Annual prepay later.
- Webhooks (all through the webhook gateway, signature-verified, idempotent on `event.id`): `checkout.session.completed` (top-up grant, subscription start), `invoice.paid` (period grant, clear dunning), `invoice.payment_failed` (dunning), `customer.subscription.updated|deleted` (plan, trucks_limit, add-ons). Plan change = entitlements flip immediately, prorated; downgrade past truck limit = 30-day grace.
- Dunning state machine `billing_state`: active → past_due (day 0: in-app banner + owner email; Stripe Smart Retries ~14 days; emails day 0/3/7/14) → restricted (day 7+: AI Off/Suggest only, no new period credits, top-ups still purchasable, drivers/loads/docs unaffected) → canceled (day 30: read-only + data export 60 days). A failed top-up never grants credits. Stripe Tax for US sales tax [E].

### 4.5 AI Gateway
- Callers request a JOB (`doc_extract, triage, draft_external, draft_internal, analytics_chat, report_spec, brief_write, vision_triage, dispatch_plan, voice_call, classify_simple`), never a model. `ai_jobs` table (versioned, DB-config): tier, primary model, escalation, fallback list, validators, token/effort caps, cache prefix, batch-eligible, data class (PII ok? US-only).
- Pipeline (one edge function for sync jobs, worker for batch/long): auth + tenant → entitlement (`voice`) → kill-switch/mode (Off/Test/Live) → credit check + reserve → PII mask → idempotency/result cache (file hash) → cheapest tier → validators (JSON schema, totals, number-must-exist-in-context, money/legal word filter, confidence) → escalate Fast→Balanced→Smart→human (expect 5-15% on documents [E]) → on 429/5xx/timeout cross-vendor fallback (Gemini ↔ OpenAI ↔ Anthropic, one US-hosted open-weight third) → commit credits → write `bot_runs` (inputs ref, model version, tokens, cost, latency, validator result, who approved).
- Rules from AI_Model_Comparison: no China-hosted APIs for tenant data; pinned dated model versions; 100-document gold set re-run before any model swap; Batch (-50%) for backfills and categorize; schema/tool prefix first for caching with tenant-isolated cache keys.
- Voice engine is an interface (`startCall, onEvent, hangup, cost`) with per-tenant engine setting (Vapi cascade default; Bland, ElevenLabs Agents, Gemini Live later). Heartbeat marks calls dialing >10 min as failed.

### 4.6 Outbound queue + consent ledger
- `outbound_messages(id, org_id, channel: email|sms|push|voice|api|packet, to, payload, source: workflow|bot|human, bot_run_id, mode, state: queued|held|approved|sending|sent|failed|test, scheduled_at, undo_until, dedupe_key unique, attempts, provider_ref, gate_log jsonb)`.
- Gate order, each logged: kill switch → tenant/department/connection mode (Off drops, Test diverts to "would have sent" + admin recipient, Live proceeds) → approval (Suggest = held for human) → consent (per channel, per number; SMS/voice) → global STOP/DNC → quiet hours in recipient local time (SMS/voice 08:00-20:00) → rate limit per provider → send with backoff → 30 s undo (manual sends) → result. Worker leases rows `FOR UPDATE SKIP LOCKED`; stuck lease heartbeat.
- `consent_ledger` append-only (subject, channel, action grant/revoke, exact text shown, form version, IP, device, timestamp). STOP in one transaction revokes SMS+voice, cancels all queued jobs, ends nurture, sends the carrier confirmation once; only the subject re-consenting lifts it. Nightly synthetic STOP test fails the health check if anything sends after it. 10DLC brand/campaign registration is a per-tenant onboarding step before SMS goes Live.

### 4.7 Webhook gateway and integrations
- One URL family `/hooks/{provider}/{connection_id}`; per-provider signature (HMAC/Ed25519/shared token) in one module; 5-minute replay window; idempotency key; return 200 in <1 s after inserting into `webhook_events` (raw payload kept 30 days), process async, dead-letter + Replay button. Persist-before-process is mandatory (ANH lost inbound SMS by dropping events with no id).
- Integrations hub: `connections(org_id, provider, style: oauth|key|included, mode Off/Test/Live, secret_ref, last_success, status)`; secrets in vault, masked after save; adapters `{auth, pull|subscribe, toCommon, fromCommon, test, health}` to a common format (Position, StopEvent, FuelTxn, Email, Text, AcctTxn, Document, InvoiceStatus, Remittance). Included services (Maps, SMS, voice, e-sign, email, AI, storage, diesel price) are metered, not configured.

### 4.8 Audit, observability hooks (for the Operator Console)
- `audit_log(org_id, actor_type user|bot|system|staff, actor_id, action, entity, before/after, reason, ip, ts)` append-only (no update/delete grants).
- Tables the console reads (read-only views + service-role edge function, never direct client access): `bot_runs`, `credit_events`, `org_credit_state`, `outbound_messages`, `webhook_events`, `job_heartbeats(job, last_run, expected_interval)`, `error_events`, `connections`, `billing_state`, `support_notes`. Metrics emitted per run: tokens, cost, latency, escalation, fallback, validator fail, acceptance (approved without edit). Console actions (all audited with reason): grant/adjust credits, set plan override/feature flag, global/department/tenant kill switch, impersonate read-only, replay webhook, release held queue items, flip tenant to Test. Alerts: queue age > 10 min, webhook failure > 3, job heartbeat > 2× interval, credit anomaly, dunning past 7 days, STOP test failure.

### 4.9 What Lovable (React + Supabase) builds well vs what needs a custom backend
| Piece | Lovable | Custom / coding agent | Why |
|---|---|---|---|
| All CRUD screens, tables, forms, dashboards, kanban, settings, billing UI, onboarding wizards, PWA shell | ✓ | | its strength; use design tokens + shared components from knowledge file |
| Tables, RLS policies, enums, views | ✓ if you paste reviewed SQL | write + review SQL by hand, with cross-tenant tests | RLS mistakes are the worst-case bug; do not let the agent improvise |
| Credit ledger SQL functions, entitlement functions | | ✓ | concurrency, idempotency, money-like correctness |
| Stripe checkout, portal, webhooks | basic via connector | ✓ webhook handlers + dunning | idempotency, replay |
| AI Gateway | simple sync jobs as edge function | ✓ (shared module + worker for batch, voice) | validators, fallback, cost logging |
| Outbound queue, schedulers, ETA/geofence engine, ELD polling, email-in parsing | | ✓ worker service (Node/TS on Fly/Railway/Cloud Run, same Postgres) | edge functions are short-lived, no leases/long polls; pg_cron only as heartbeat |
| Telephony (Twilio/10DLC, Vapi/voice webhooks), consent/STOP | | ✓ | legal-critical, must be deterministic and tested |
| PDF generation/merge (invoice packages, audit packets, sealed e-sign PDFs), encryption/KMS | | ✓ | heavy libs, secrets |
| Offline queue, camera capture, background GPS (driver app) | PWA basics | ✓ plugin work / native wrapper later | browser limits (Q6) |
| Operator console | ✓ separate Lovable project on the same Supabase via service-role edge functions | read APIs | keeps tenant app clean; staff role cannot exist in tenant project |
Recommendation: Lovable owns UI + simple data screens (~65% of screens); a coding agent owns ~12 backend units (ledger, gateway, queue worker, webhooks, telephony, ETA/geofence, PDF, crypto, tests). Two repos: `fleetos-app` (Lovable, GitHub-synced) and `fleetos-backend` (worker + shared SQL migrations + edge function sources).

---
## 5. Build plan designed to save Lovable credits
### 5.1 Principles
1. Decide on paper, build once: nothing reaches Lovable that is not already (a) a static prototype Abdel approved, (b) SQL already written, (c) a prompt with acceptance tests.
2. One project knowledge file + one prompt pack per module; each build message does a whole module slice (tables + screens + rules + tests) instead of chatting screen by screen. Fix loops cost more than the first build.
3. Backend-critical pieces never go through Lovable (section 4.9). Lovable only calls them (`supabase.rpc('consume_credits')`, edge function endpoints).
4. Build UI against seeded data/mocks first, wire the backend second: change UI cheaply, then bind.
5. Never prompt the live ANH Lovable project (Master Plan safety rules). Fleet OS is a fresh project + fresh Supabase.

### 5.2 Static HTML first (zero build cost, publish as private artifacts)
Prototype in plain HTML + inline JS, click-through only, using seed JSON, before any Lovable message: (1) rate-con inbox with PDF-left/fields-right + confidence chips; (2) driver Today + scan + DVIR; (3) operator mode 5 tabs; (4) Money home queue + invoice send; (5) credit meter + top-up + plan compare with dollar previews; (6) Bot Control Center (switch, guardrail form, kill switch); (7) Cockpit + Brief; (8) Roll call/tower; (9) shared inbox thread; (10) operator console tenant page. Existing ui_design/*.dc.html mockups are the starting point. Get 3 O/Os and 1 dispatcher to click them; freeze copy and layout; the frozen HTML is attached to the Lovable prompt as the visual spec (screenshots via file upload). Cost: hours, no credits.

### 5.3 Knowledge file (project knowledge, ≤ ~6-8k words, never re-explained)
Sections: product + plan matrix; naming conventions (snake_case tables, `org_id` everywhere); RLS pattern snippet + `has_perm()`/`has_feature()`; role/permission matrix; design tokens, shadcn component rules, mobile-first rules (16 px gutters, thumb-reach primary button); credit codes (copy of 2.2 as JSON) and the rule "never call an AI provider from the browser: call `ai_run(job, payload, idempotency_key)`"; Off/Test/Live and Off/Suggest/Auto conventions; status enums (load, invoice, statement, ticket); audit rule ("every mutation through a function that writes audit_log"); "NEVER" list (no scraping, no client-side secrets, no direct anon inserts, no hard-coded company data, no new tables without org_id); file layout; test commands.
### 5.4 Prompt pack per module (template)
`GOAL` (one paragraph) → `TABLES` (SQL pasted, already reviewed) → `SCREENS` (route list, attach prototype screenshots) → `RULES` (state machines, validations) → `CALLS` (RPCs/edge endpoints it may call, with signatures) → `SEED DATA` → `ACCEPTANCE` (10-15 numbered click tests) → `DO NOT` (files/tables not to touch). One message per module slice; second message only for fixes from the acceptance run; use plan mode only for the first message of Phases P1 and P3.

### 5.5 Test strategy
- DB: SQL test script run on a scratch DB: two tenants A/B, every table must deny cross-tenant select/insert/update/delete for every role; ledger tests: concurrent consume (100 parallel), duplicate key, expiry order, reserve/release; entitlement matrix test per plan.
- Backend: contract tests for gateway (validator fail → escalate → fallback), queue (STOP, quiet hours, Test diverts, dedupe), webhooks (bad signature, replay, out-of-order Stripe events).
- Gold sets: 100 rate cons + 100 BOL/POD photos; accuracy gate ≥ 95% on money/date fields before any bot goes Auto; 50 Ask questions; 30 STOP/opt-out phrases; re-run on any model swap.
- UI: Playwright smoke per module on a seeded tenant per plan (Solo, Core, Growth) incl. role-by-role click-through; mobile viewport for driver app; lock-state screens (out of credits, past_due, over truck limit).
- Ops: nightly synthetic STOP test, heartbeat checks, "Test mode week" for every new tenant/department; beta tenants run in Test for week 1.

### 5.6 Who builds what
| To Lovable | To coding agent (Claude Code / Codex) |
|---|---|
| All routes/screens/forms/tables/charts, PWA shell, seed data, empty/locked/out-of-credit states, plan compare + billing UI, console UI, simple edge functions (CRUD helpers) | SQL migrations + RLS + tests; credit ledger; entitlements; AI gateway + validators; queue worker; webhook gateway; Stripe handlers; telephony + consent; ETA/geofence; ELD adapters; email-in parser; PDF packager; encryption; e2e tests; CI |

### 5.7 Rough effort per module [E] (one builder prompting Lovable + one coding-agent operator; "msgs" = Lovable prompts incl. fixes; credits unknown, assume ~1 credit per simple msg and 3-5 per module-slice msg)
| Module | Lovable msgs [E] | Coding-agent days [E] | Calendar wks |
|---|---|---|---|
| P0 prototypes (static) + knowledge + gold set | 0 | 3 | 2 |
| M0 foundation (auth, RLS, plans, Stripe UI, credit UI, bot control, console-min) | 25-40 | 12-15 | 3 |
| M1 dispatch intake → load → status → docs | 20-30 | 6 | 3 |
| M2 fleet records + M3 driver app + operator mode | 25-35 | 8 | 3 |
| M4 money launch scope (invoice, AR, fuel, expenses, P&L, settlements, IFTA v1) | 30-45 | 10 | 4 |
| M5/M6/M8 lite | 15-25 | 4 | 2 |
| Phase 3 Growth ops (roles, inbox, recon, geofence/ETA, planner, shop desk, DQ, report builder, voice check-calls) | 80-120 | 30 | 10 |
| M7 recruiting + voice screening + e-sign | 40-60 | 20 | 8 |
| Enterprise features | 20-30 | 15 | 6 |
Total to Solo/Core beta ≈ 115-175 Lovable msgs + ~43 agent days over ~12 weeks [E, wide error bar]. Cost drivers to watch: re-prompting for visual polish (freeze with prototypes), RLS/ledger bugs (avoid by hand-written SQL), mobile camera issues.

---
## 6. Cross-department conflicts and gaps (with resolution)
| # | Conflict / gap | Found in | Resolution |
|---|---|---|---|
| 1 | Old tiers and per-load/per-feature caps everywhere | all five | superseded by locked packaging; section 2 replaces |
| 2 | Duplicate bots: Ask ×5, Brief ×3, Search ×3, Triage ×2, Import mapper ×3, Doc reader ×5, drafter ×5, DVIR ×2, Breakdown ×2, MVR ×2, voice ×4, text assistants ×4, alert explainer vs delay-risk | all | one bot/service each (2.3); owner dept listed in section 1; department UIs are scopes of it |
| 3 | Roles inconsistent: 8 built-in + leader (command) vs Maintenance Lead/Agent/Shop Manager/Technician (shop) vs Bookkeeper/Controller (accounting) vs Recruiter/HR (recruiting) vs "Operator mode" (dispatch) | command, shop, accounting, recruiting | 8 roles + Leader flag + permission flags (e.g. `approve_money`, `payroll`, `activation`, `hr`); Technician = add-on role with Shop-floor; Bookkeeper = Accounting, Controller = Accounting+Leader; Owner-operator = Owner+Driver. Solo/Core expose only Owner/Dispatcher/Driver |
| 4 | Shared inbox placed in Core (command) but packaging puts it in Growth; recruiting has its own two-way inbox | command vs locked, recruiting | one thread store; Growth gets the shared inbox UI; Recruiting inbox is a filtered view of it; Solo/Core get rate-con intake address + notification center + object threads |
| 5 | Integrations: command says 6/15/unlimited; locked says 1-2 for Solo/Core | command vs locked | 2 / 2 / 8 / unlimited; inbound forwarding address, phone GPS and all "Included" services do not count; define in Q7 |
| 6 | Multi-carrier entities: Core 1/Pro 3/Auto 10 (command, dispatch) vs Enterprise only (locked); ANH itself has 3 MC/DOT | command, dispatch | 1 entity up to Growth; Enterprise multi-entity; ANH tenant gets an Enterprise override (Q8) |
| 7 | Report builder: Pro (command) vs Growth (locked); dashboards 3/15/50; custom roles Pro | command | Growth+; dashboards 1/3/15/50 per plan [D]; custom roles Growth |
| 8 | Public API/webhooks Pro (command) vs Enterprise (locked); audit retention 90 d/1 yr/3 yr; Health Board | command | Enterprise for API; retention 90 d / 90 d / 1 yr / 3 yr; Health Board Growth, a red banner for everyone |
| 9 | Recruiting: "add-on" (spec §8) vs Pro/Autopilot (recruiting file) vs locked (Core add-on, Growth included, none on Solo); price of add-on and its credits unspecified | recruiting | follow locked; add-on price and bundled SMS/10DLC cost needed (Q9) |
| 10 | Roll call and Control tower in both dispatch and command; Money-Found "leak preview" in accounting and command | dispatch, command, accounting | single components; dispatch owns roll call/tower (command embeds), accounting owns Money-Found detectors (command renders) |
| 11 | DVIR owned by three docs: capture/lock (dispatch), review (shop), rollup (safety); DVIR redo lock vs noon lock | dispatch, shop, safety | dispatch owns capture + lock; shop owns review/defect actions; safety only displays rollup; one `dvir_reports` table; lock rule single source |
| 12 | Expiry dates stored on driver/truck records (dispatch/fleet) and in vault (safety) | dispatch, safety | vault is the source; one sync function writes expiry to entity (ANH had two triggers) |
| 13 | Detention: timer (dispatch, V2), billing (accounting, "Autopilot, Launch"), leak preview (command) | three | geofence/timer is P3; manual arrival + timer V1.1; billing bot works from timestamps whatever their source; shipping order matters |
| 14 | Settlement approval "never Auto" vs Autopilot bots, and ANH's weekly payroll Thursday 2 PM | accounting | hard ceiling in 2.1 (money movement is human); pay run records, does not move money (Q4) |
| 15 | Packaging says out of credits → bots drop to Suggest/Off, but Suggest itself needs AI | locked | degraded mode per feature (templates, manual entry); documented per bot in knowledge file |
| 16 | Workflow SMS/email cost: locked budget ~$2/truck non-AI, but Recruiting alone drives $6-72 SMS/mo and Growth Safety $9-33 | recruiting, safety, locked | pooled fair-use SMS + credits beyond; recruiting add-on priced to cover 10DLC $15/mo + SMS (Q3, Q9) |
| 17 | Price cliff $97 (3 trucks) → $249 (up to 25) hits 4-8 truck fleets; operator mode in blueprint assumes "1-5 trucks" | locked, dispatch | keep locked; watch in beta; candidate fix = Core up to 5 trucks (Q8) |
| 18 | Master Plan's AI Dispatcher (load-board search, negotiation, broker calls) is absent from the blueprints (only Planner + deep links); "Dispatch Co" mode dropped by packaging | Master Plan | out of V1; P5 behind official board APIs only; no scraping |
| 19 | GAPS no file owns: onboarding/import wizard for new tenants (Alvys/QuickBooks/CSV), help center + in-app support chat, terms/privacy/DPA, status page, tenant data export/delete (GDPR-like), admin of Stripe tax/invoices, mobile store listing, EN/ES copy management, analytics/product telemetry, email domain setup (SPF/DKIM) wizard | all | assigned to M0 (import wizard, export, domain wizard, help links) and M10 (support, status); legal pages need counsel; telemetry via PostHog-class [E] |
| 20 | Test/Live vocabulary (Off/Test/Live) vs autonomy (Off/Suggest/Auto) used inconsistently, kill switch scopes | all | two orthogonal axes: Mode at tenant/department/connection; Autonomy per bot; kill switch = flag read by gateway + queue |
| 21 | Operator console not covered by the five | n/a | M10, separate project, minimal in P1, full in P3 (section 4.8 hooks) |
| 22 | Phone GPS vs ELD: dispatch assumes both, safety HOS needs ELD, IFTA needs state miles | dispatch, safety, accounting | phone GPS at launch; one ELD adapter in P3 (Optima first since ANH uses it); IFTA v1 uses odometer + fuel by state |

---
## 7. Open questions for Abdel (deduped from all files, ranked by how much they block)
1. **Build capacity:** how many Lovable credits per month, how many people prompt, and is a coding agent (Claude Code/Codex) available for the backend units? Also confirm the order: Solo/Core wedge first, Growth second, Recruiting third. (Blocks the roadmap dates.)
2. **Backend hosting and accounts:** OK to run one small worker service (~$20-60/mo [E]) next to a Supabase Pro project, and who owns the Twilio / voice-vendor / Stripe / Google Maps accounts under the company name? (Blocks P1.)
3. **Texts and email metering:** are non-AI texts/emails free inside a fair-use allowance (my proposal 100/300/1,500 segments) or credit-metered? Does the unified SMS price of 1.2 credits work? (Blocks ledger design and margin math.)
4. **Money movement:** record-only in V1 (marked-paid with reference, ACH file export) or real payout rails; and keep owner/investor statements as a Core-level V2 feature (generate from ledger, drop investor CRM)? (Blocks Accounting scope.)
5. **Autonomy and legal defaults:** may Auto auto-create loads from known brokers (15-min undo), auto-send exception emails, place AI shop/check calls (AI disclosure + recording by default), hard-lock drivers at noon DVIR (safe-when-parked + dispatcher grace), hard-block expired CDL/medical/registration in dispatch (or warn 24 h first)? Counsel to review TCPA/10DLC/FCRA wording before Live.
6. **Driver app packaging:** PWA at launch (iOS push needs Add to Home Screen) or a store wrapper for reliable push and background location? And default visibility of broker rate to drivers (hide for company drivers, show for O/Os)?
7. **Tracking and ELD:** phone GPS first, then which ELD (Optima for ANH, Samsara, Motive); is ELD vendor cost passed through; and what counts toward the 2/2/8 "integrations" (my definition: only connected third-party accounts, not built-in services)?
8. **Plan edges:** accept the $97 → $249 cliff for 4-8 truck fleets (or Core up to 5 trucks), and ANH's 3 MC/DOT entities (Enterprise override for tenant #1 or allow 3 entities on Growth)?
9. **Recruiting add-on on Core:** price, and how many credits/SMS/10DLC fees it bundles (the old $99/mo + metered SMS idea, or flat); which launch vendors for MVR/PSP/Clearinghouse (do you already have accounts)?
10. **Voice vendor:** run the 20-call blind test (Vapi + ElevenLabs voice vs Bland vs ElevenLabs Agents) before locking; what did you like in the Bland demo (timbre, pacing, filler words)? Default stays Vapi cascade at 12 credits/min.
11. **Prices and caps I changed for you to approve:** daily runaway guard 25% of plan credits; credit expiry on billing-cycle end vs calendar month; whether a tiny overdraft is allowed for rate-con reading at zero balance (locked file says no); dashboard counts per plan.
12. **Measured numbers to replace [E] assumptions:** real average invoice, detention incidence/billing rate, and loads/trucks per month at ANH (accounting recovery math and credit mixes depend on them); permission to use ANH documents as the 100-doc gold set (anonymised).
