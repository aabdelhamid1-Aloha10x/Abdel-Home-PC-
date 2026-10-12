# TMS Product Shape & Usage-Based Pricing — v2
Date 2026-10-10. Supersedes the Starter/Fleet/Enterprise tier sections of earlier drafts. AI Dispatcher is **parked** (post-launch add-on; see research_ai_dispatcher.md when we return to it). Sales/investor-lead module is **out of the product**.
Labels: [V] verified in ANH's live data/this session · [U] stated by Abdel · [3P] third-party, re-check · [E] my estimate to validate.

## 1. What ANH's teams actually use today [V, last 30 days]
| Team | Real activity |
|---|---|
| Dispatch (9 dispatchers + 4 leaders) | 1,934 logged actions on loads — the dominant workload; 295 loads, 830 load documents, 362 driver notifications |
| Accounting (1 user, heavy) | 261 factoring submissions, 99 driver pay statements, 447 fuel transactions, 197 escrow entries |
| Shop / online maintenance | 100 maintenance tickets, 194 DVIR reports |
| Recruiting | 82 new leads |
| Driver app | ~12–22 active drivers; DVIR, documents, notifications |
| Barely/not used | Internal chat (1 message), compliance documents (0), load override requests (0), bonuses/streaks/tolls (0 rows) |
Fleet reality: ~23 trucks / ~22 drivers moving loads (129 truck records, most stale). Note: January showed 3,516 loads on 95 trucks — consistent with your Alvys-era ~3,000 loads/month; I earlier assumed that spike was only a data import, which may be wrong. Either way, ANH has run at both ~3,000 loads/month and ~300 loads/month, so the pricing must work across a 10× range.

## 2. What the "average company" does in the system
Daily workflow, in order, and which module serves it:
1. **Get a load** (rate-con arrives by email/phone) → create/scan it → Core Operations (rate-con scan/parse is the #1 time saver)
2. **Assign driver/truck** → dispatch board, driver suggestions → Core
3. **Dispatch & track** → driver app, status updates, tracking link to broker/customer, ETA, geofence arrival → Core + Tracking
4. **Collect paperwork** → BOL/POD photo scan, docs per load, auto-notify broker → Core
5. **Invoice / factor** → invoice PDF to broker, or factoring packet (email/portal/API), reserves & escrow → Back Office
6. **Pay drivers / owner-operators** → settlements, deductions/advances, fuel → Back Office
7. **Keep trucks legal & running** → DVIR, maintenance tickets, parts, expirations → Shop & Maintenance / Safety & Compliance
8. **Hire & onboard** → lead funnel, screening, documents, e-sign → Recruiting
9. **Know the numbers** → load/truck/driver/lane profitability, custom reports → Analytics

### Company archetypes → who uses what
| Archetype | People | Needs | Device |
|---|---|---|---|
| Owner-operator (1–3 trucks) | 1 (is dispatcher, accountant, driver) | Scan rate-con → load; BOL/POD photo; invoice/factor in 2 taps; fuel & expenses; IFTA; simple P&L | **Phone only** |
| Small fleet (4–25) | owner + 1–2 dispatchers + part-time bookkeeper | Dispatch board, driver app, invoicing/factoring, settlements, DVIR, expirations | Phone + laptop |
| Mid fleet (25–100) | dispatch team, accounting, safety, shop/maintenance, HR/recruiting | All of the above + maintenance workflow, compliance, recruiting, analytics, permissions per department, tracking | Laptop-first |
| Large / enterprise (100+) | departments + managers | Multi-entity (several MC/DOT), approvals, audit trail, integrations/API/EDI, custom analytics, SSO | Laptop + API |
| Dispatch company | dispatchers working for owner-operators/small carriers they don't own | Multi-carrier workspace, per-carrier docs/statements, commission engine, carrier portal, carrier onboarding packet | Laptop + carriers on phone |
→ This is **one product with modules**, not three versions. Companies turn on the modules their teams use; owner-operators see a radically simplified phone UI of the same data.

## 3. Product packaging: modules, not tiers
| Module | Covers | Included in base load fee? | ANH status |
|---|---|---|---|
| **Core Operations** | Loads, multi-stop, dispatch board, broker/customer book, rate-con scan/parse, driver app (status, BOL/POD scan), documents, broker auto-updates, notifications | Yes | ✅/🔧 (broker_id bug, push, BOL/POD timestamps) |
| **Back Office** | Invoice PDF + email, AR aging, factoring packets & reconciliation, escrow/reserves, driver/owner-operator settlements (locked), fuel import, expenses, QuickBooks | Yes | 🔧 (settlement lock, factoring math, invoice PDF missing) |
| **Analytics & Reports** | Dashboards by load/truck/driver/lane/customer, **user-built reports & saved views**, export, scheduled email reports | Yes (differentiator) | 🔧 (math errors) |
| **Automations** | Rule builder: triggers (load status, doc uploaded, expiry, invoice age) → actions (email/SMS/push/task/webhook) | Yes, with run credits | 🔧 (most cron jobs off) |
| **Tracking & ELD** | Live map, ETA, geofences, tracking links, ELD vendor connectors | Per active truck (pass-through + margin) | 🔧 |
| **Shop & Maintenance** | Tickets, work orders, parts, technician portal, remote maintenance team workflow | Own meter | 🔧 |
| **Safety & Compliance** | DVIR, expirations, DQ file, drug/alcohol pool, incidents, scores | Own meter (DVIR/expirations basic in core) | 🔧 |
| **Recruiting & Onboarding** | Application form, SMS cadence, AI screening calls, docs, e-sign, travel | Own meter | 🔧 (STOP/inbound/Vapi defects) |
| **Dispatch-Company mode** | Multi-carrier workspace, commissions, carrier portal | Same load fee; carriers = sub-accounts | ❌ |
| **Community & Rewards** (later) | Cross-company chat, contests, bonuses | later | ❌ |
| **AI Dispatcher** (later) | parked | later add-on | ❌ |
**Out of product:** Sales/investor leads, deals, calendar booking, chatbot, funnel analytics (ANH-internal CRM; move to its own separate app). Open question: investor *statements/truck-owner payouts* may be useful for owner-operator leasing — decide separately.

## 4. Monetization on a moving metric
### Candidate meters
| Meter | How it works | Pros | Cons |
|---|---|---|---|
| **Per delivered load** (graduated) | Pay for loads delivered/invoiced in the month | Matches how Alvys-type vendors quote [U]; scales with value; tiny cost for an owner-operator; no truck-count gaming | Revenue dips in slow months; need clear "load" definition (count a multi-stop load once; exclude cancelled/TONU) |
| Per active truck | A truck with ≥1 load that month | Simple, predictable; tracks per-truck costs (DVIR/ELD/support) | Penalises low-utilisation trucks; rewards short-haul/high-turn fleets (underpriced) |
| Hybrid | small per-truck + per-load | Covers per-truck costs; smoother | Two numbers to explain |
| Credits wallet | prepaid credits consumed by usage | Great for metered extras (SMS, doc parsing, automation runs, recruiting leads) | Confusing as the *only* meter |
**Recommendation:** one headline meter = **delivered load** (graduated, with a small monthly minimum), plus a **credits wallet** for metered extras, plus module meters for department-heavy modules. Offer an optional **committed-volume discount** (customers estimate monthly loads, like Alvys did, in exchange for ~10–15% off and predictable revenue) — but billed on actuals with true-up, not a fixed estimate.

### Illustrative comparison (editable in `AH_TMS_Usage_Pricing_Model.xlsx`)
Model 1 ladder: $1.00 per load for loads 1–100, $0.75 for 101–500, $0.55 for 501–2,000, $0.40 above; $19 monthly minimum. Model 2: $14 per active truck. Model 3: $5 per active truck + $0.45 per load. Cost assumptions: ~$0.08 variable per load and ~$1 per active truck [E]; support and infra are placeholders.

| Archetype (loads/mo) | M1 price (eff. $/load) | M2 price | M3 price | "Alvys-style $0.50/load" |
|---|---|---|---|---|
| Owner-operator, 1 truck (17) | $19 (min) | $19 | $19 | $9 |
| 5 trucks (87) | $87 ($1.00) | $70 | $64 | $43 |
| 10 trucks (173) | $155 ($0.89) | $140 | $128 | $87 |
| **ANH today, ~23 trucks (295)** | **$246 ($0.83)** | $322 | $248 | $148 |
| 25 trucks at 4/wk (433) | $350 ($0.81) | $350 | $320 | $216 |
| 100 trucks at 4/wk (1,732) | $1,078 ($0.62) | $1,400 | $1,279 | $866 |
| **ANH Alvys era, ~95 trucks (3,000)** | **$1,625 ($0.54)** | $1,330 | $1,825 | **$1,500 (actual)** |
Gross margin (after variable cost, placeholder support/infra, payment fees): M1 62% / 67% / 68% / 43% / 54% / 35% / 50% in the order above. **Read this carefully:** variable cost is only ~$0.08 per load, so margin is driven almost entirely by how much support/success time each account needs (my placeholder: $75/mo at 23 trucks, $400/mo at 95–100). Self-serve onboarding and good in-product help are therefore the margin strategy — not the price per load.
Take-aways:
- At Alvys's real data point (3,000 loads/month ≈ $1,500) Model 1 lands at ~$1,625 — within ~8% while offering real analytics, automations and open integrations. You can match or undercut at high volume, and still make ~50% gross margin if support stays light.
- Owner-operators pay ~$19–$25/month — far below the sales-led TMS price point, which is the wedge.
- Per-truck pricing (M2) is worst at ANH-like low utilisation and best-for-us at heavy truck counts; the per-load meter is the fairer story.

### Other pricing rules to decide
- **Setup/migration:** Alvys charged setup + sales-led migration [U]. Proposal: **no setup fee**; self-serve import wizards (CSV/Alvys/McLeod/QuickBooks export); optional paid "white-glove migration" ($ one-time) for larger fleets.
- **Free start:** first 10 delivered loads/month free, or 30-day trial, card on file.
- **Metered extras on credits:** SMS beyond a bundle, doc parsing beyond a bundle, ELD/tracking pings, automation runs beyond a bundle, recruiting engaged leads. Show a live usage meter and a price calculator on the website.
- **Module meters (hypotheses):** Shop & Maintenance per work order or per active truck; Safety & Compliance per active driver; Recruiting per engaged lead + checks at cost +15%; Tracking per active truck (ELD vendor pass-through + margin).
- **Guardrails:** hard caps, alerts at 80% of plan/credits, graceful degradation (never lock drivers out mid-load).

## 5. How we beat the TMSs you've used [U]
| Pain you had (Alvys-type) | Our answer | Build status |
|---|---|---|
| Tables/forms only, little real workflow | Phone-first flows: scan rate-con → load, 1-tap dispatch, 2-tap invoice/factor | ❌ → needs build |
| Fixed-template reports, no analytics | User-built dashboards/reports, saved views, scheduled exports, per-truck/lane/customer P&L | 🔧 fix math + build report builder |
| No automations | Rule builder + library of ready automations (broker updates, doc-missing reminders, expiry alerts, invoice follow-ups, settlement drafts) | 🔧 revive cron jobs + build rule UI |
| Couldn't integrate with your factoring company (e.g., Treadstone) because vendor only supports approved partners | **Connector-free integration**: configurable factoring packet builder (email/portal-upload/CSV/PDF bundle), plus API connectors where they exist — you already send 261 submissions/month this way | ✅/🔧 generalise per factor |
| Sales call, demo, setup fee, estimated-load contracts | Self-serve signup, transparent calculator, metered billing on actuals, no setup fee | ❌ |
| Driver app basic | Modern PWA: reliable push, offline, scanner, DVIR, pay statements, load history | 🔧 |
| Little control over data | Full export/API; your own analytics | ❌ |

## 6. Owner-operator "run everything from the phone" — required capabilities
Scan/forward rate-con → auto-create load · accept/dispatch to self · navigation/status · BOL/POD photo → auto-send to broker · invoice PDF and send · submit to factoring (packet) · fuel & expense capture (receipt photo) · settlement/pay view · IFTA mileage/fuel by state · cash/P&L view · expiry reminders · simple compliance docs vault. Most of these are **missing or weak today** (rate-con generation/scan, invoice PDF, IFTA, expense capture). They are the core of the small-carrier product.

## 7. Revised roadmap (TMS-only)
- **Phase 0 (now):** backups, credential rotation, freeze rules, staging copy (see Master Plan).
- **Phase 1:** security hotfixes + recruiting compliance fixes (STOP, inbound replies, Vapi webhook) via staging.
- **Phase 2 (department fixes on staging):** Dispatch/Core → Driver app → Back Office → Shop/Maintenance → Recruiting → Safety/Compliance.
- **Phase 3 (new product foundation):** multi-tenant core, per-tenant settings/integrations/branding, **usage metering** (delivered-load meter, credits, module meters), Stripe metered billing, self-serve signup/onboarding & import wizards.
- **Phase 4 (small-carrier wedge):** rate-con scan, invoice PDF, expense/receipt capture, IFTA, tracking links, phone-first UI, factoring packet builder.
- **Phase 5:** report/dashboard builder + automation rule builder + department permissions; Shop/Compliance/Recruiting modules productised.
- **Phase 6:** Dispatch-company mode, Enterprise features (multi-entity, API/EDI, SSO, audit), Community & Rewards.
- **Later:** AI Dispatcher add-on once we have customers and training data.
- Sales/investor module split into its own internal app (decide timing; it sits in ANH's live DB today and widens the attack surface).

## 8. Decisions needed
1. Headline meter: **delivered load** (recommended), active truck, or hybrid? What exactly is a "load" (multi-stop = 1; cancelled/TONU excluded)?
2. Setup fee: none (recommended) vs optional paid migration?
3. Free start: 10 free loads/month vs 30-day trial?
4. Confirm module list; confirm Community & Rewards and AI Dispatcher are later.
5. Sales/investor module: remove from the product — and should investor statements/truck-owner payouts stay as a feature?
6. Target first customers (owner-operators/small fleets vs mid fleets vs dispatch companies) to order Phase 4.
7. Validate Alvys's real pricing: your $1,500 for ~3,000 loads is the one hard data point; get 1–2 more (McLeod/Tailwind/etc.) before publishing prices.
