# Shop / Maintenance / Road Team + Safety & Compliance — blueprint
Fleet OS (placeholder name). Two departments in one file because they share data: DVIR, expirations, truck holds, and the "can this truck/driver be dispatched" gate.
Reference fleet for all numbers: ANH-scale, 25 trucks, ~25 drivers, ~100 tickets/month, ~500 DVIRs/month, ~120 receipts/month [E from inventory: 1,018 tickets, 967 receipts, 1,696 DVIRs, 23 active drivers, 30 active trucks]. Caps below are per tenant for a 25-truck fleet and scale linearly per truck above 25 (floor: Core 5 trucks).
Model tiers (AI_Model_Comparison.md): **Fast** = Gemini 3.1 Flash-Lite ($0.25 in / $1.50 out per 1M) [V]; **Balanced** = Gemini 3.6 Flash ($0.75 / $3.75) [V]; **Smart** = Claude Sonnet 5.5 high effort ($2 / $10) [V]; **Voice** = Vapi cascade (Deepgram STT + Claude Haiku 5.5 + ElevenLabs Flash TTS) about $0.11/min [E, range $0.09-0.13 in the comparison]. Escalation: Balanced -> Sonnet 5.5; Fast -> Balanced. PII (SSN, DOB, bank, license number) is masked before any LLM call.

---
## PART A — SHOP / MAINTENANCE / ROAD TEAM

## 1. Who uses it and what a day looks like
- **Road team / online maintenance (24-hour desk, 2-4 people, the heavily used part of ANH):** drivers break down, the desk triages, finds and calls shops, approves spend, opens the ticket, tells Dispatch. Evening shift hands off to day shift.
- **Shop manager / in-house shop (optional module; only ANH-style fleets with a yard):** bay board, work orders, parts waiting, technician time. In ANH this was 66 of 1,018 tickets.
- **Safety / Dispatch / Owner:** safety reviews DVIR defects, dispatch gets "truck down / PM due / ETA impact" automatically, owner sees downtime cost and repair spend per truck.
- **Day:** 07:00 read the overnight handoff (what broke, what was opened and closed, what needs approval) -> clear the DVIR review queue (about 20 reports, 3-5 with defects) -> PM list: schedule the trucks coming due, Dispatch told automatically -> breakdowns arrive any time -> end of shift: close tickets, upload receipts (auto-read), handoff note writes itself.
- Roles: Owner, Maintenance Lead (approve spend, delete), Maintenance Agent (road team), Shop Manager, Technician (optional), Safety (DVIR), Dispatcher (read + holds), Accounting (costs/chargebacks).

## 2. Screen map (desktop = sidebar app; phone = driver app + manager phone view)
| Route | Screen | Purpose | Device |
|---|---|---|---|
| /maintenance | Overview "While you were away" | Overnight handoff, open tickets needing me, approvals, downtime cost today, opened-vs-closed 14-day chart, avg time to close | Desktop + phone |
| /maintenance/breakdowns | Breakdown Desk | Live emergency list (driver reports + AI triage chat), truck/ELD location, nearby shops, call log, one-click ticket | Desktop, phone read/reply |
| /maintenance/tickets | Tickets (list + right detail panel) | All tickets, kanban or table; filters (status, priority, truck, vendor, source, mode); saved views; New ticket | Desktop, phone list |
| /maintenance/tickets/:id | Work order | Summary, discussion, parts lines, costs, receipts, linked load, shop/vendor, timeline, resolution (required to close) | Both |
| /maintenance/dvir | DVIR Review | Date/queue (Needs review / Defects / All / Reviewed), photos, per-defect action, redo request | Desktop, phone |
| /maintenance/health | Truck health & PM | PM due by miles/days/engine hours, fleet service status, repeat-repair flags, Schedule service | Desktop |
| /maintenance/vendors | Vendors | Shops/parts vendors auto-built from tickets; preferred flag, spend, ratings, history | Desktop |
| /maintenance/decisions | Repair or tow decision (V2) | 4-step wizard (asset, location, quote, recommendation) with saved result | Desktop |
| /maintenance/analytics | Analytics | Cost per truck/mile, downtime days, repeat repairs, vendor compare, road-team response times (time to first response, shop found, resolved) | Desktop |
| /maintenance/import | Import | Tickets and fleet profiles from Excel/CSV with AI column mapping, dry-run preview, undo (never wipes by default) | Desktop |
| /maintenance/settings | Rules & bots | Ticket categories, PM templates, spend limits/approvals, home yard address, cost presets, autonomy switches, quiet hours, bot kill switch | Desktop |
| /maintenance/shop-floor (optional module, V2) | Bay board, parts waiting, tech mode | Work orders by bay, technician timer, voice notes, simple stock list | Desktop + tablet/phone |
| Driver app (Driver dept) | Report breakdown / DVIR | Photos, voice, location share, chat with desk | Phone |

## 3. Click-through flows

### Flow M1 — Driver breakdown to repaired truck (core money flow)
1. Driver taps **Report breakdown** in the app, adds up to 5 photos, voice note (any language) or text -> 2. System saves a draft ticket (source=driver, mode=roadside), stamps ELD/phone location and the truck's active load, opens a chat thread, raises an alert in Breakdown Desk with sound.
2. (Core) Agent sees alert, taps **Call driver** (click-to-call/SMS), reads photos, types category -> (Pro) AI triage bot runs: transcribes voice (translated), reads photos, returns summary, severity, "safe to drive?" flag, likely cause, fault-code decode, 3 follow-up questions; agent approves the questions/replies in one tap -> (Autopilot) bot sends the safety-scripted questions itself and escalates to a human on "unsafe/injury/fire/highway shoulder".
3. Agent (or bot) taps **Find shops** -> workflow queries Google Places with truck location, radius 10/25/50 mi, flags Preferred vendors from our vendor list -> results with distance, rating, open now.
4. **Pro:** agent taps Call (click-to-call) on a shop. **Autopilot:** bot places up to 3 parallel-ish shop calls (voice agent, disclosed as AI, recorded per state law) asking availability, ETA, quote; transcripts are summarised into a quote card (price, ETA, can-do) saved on the ticket.
5. Agent taps a quote card **Select shop** -> system sets vendor, repair_shop and mode=roadside (does NOT touch the shop-queue flag; ANH bug fixed), creates PO number, asks approval if amount > tenant spend limit (owner/lead approves in app).
6. System tells Dispatch: truck status "Down - roadside", linked load flagged Delayed, broker ETA-impact email drafted (Pro: human Send/Undo; Autopilot: auto-send within rules), driver gets shop address/ETA and Navigate link.
7. Shop finishes; agent taps **Upload receipt** (photo/PDF) -> AI reads vendor, date, total, line items; amount fills the ticket; mismatch with approved quote is flagged; vendor auto-added to Vendors (no manual Add).
8. Agent taps **Close ticket** -> required: resolution note (enforced), cost, linked truck; truck returns to Available, Dispatch notified, load delay cleared, driver deduction request (if flagged) sent to Accounting for approval. Saved: full timeline, transcripts, receipts, costs linked to truck and load.

### Flow M2 — DVIR review (1,696 reports in ANH; 964 reviews, 96 redo requests)
1. Driver submits DVIR (photos, defects) -> workflow validates photos (Pro AI: blur/wrong-component check), stores report, tags defects to a component list.
2. Defect analyst (Pro) adds "reported 3x in 30 days" history and a plain-language severity; Core uses the rules-only history count.
3. Reviewer opens **/maintenance/dvir** -> Needs Review list (amber banner count) -> expands a report, enlarges photos.
4. Per defect picks an action: Repair Now / Fix at Terminal / Not Urgent / Monitor / Already Scheduled / Other (+ reason). **Repair Now creates a ticket automatically** (source=dvir, linked photos, truck hold if "out-of-service" severity) and notifies Dispatch; "Not Urgent/Monitor" sets a recheck date.
5. Reviewer taps **Mark as Reviewed** (blocked until every defect has an action) -> saved with reviewer, time, notes (retention 3 months minimum; defect reports kept 12 months [I: 49 CFR 396.11, verify]).
6. Or taps **Request Redo** with reason -> driver gets push/SMS; attempt 1 deadline 30 min; attempt 2+ locks the driver app until redone (configurable per tenant, default as ANH) -> escalation to safety lead after attempt 3.

### Flow M3 — Preventive maintenance due -> scheduled -> dispatch routes around it
1. Nightly workflow reads odometer/engine hours from ELD (or manual), compares to PM templates (default PM-A every 25,000 mi or 120 days [E, editable]; annual DOT inspection; tire rotation).
2. Truck crosses "due in 2,000 mi / 14 days" -> appears in Truck health with Due soon; at overdue -> red + owner dashboard item.
3. Manager taps **Schedule service**, picks shop (internal bay or vendor), date -> system creates a work order (source=pm), reserves the truck window, writes "heads-up" into Dispatch roll call and Control tower.
4. Dispatcher's planner avoids assigning that truck to loads ending after the slot; if a booked load collides, Dispatch gets a conflict alert (no AI needed).
5. On close, odometer and due dates reset, cost lands on the truck.

### Flow M4 — Receipt upload and ticket costing (967 receipts in ANH)
1. User drops a photo/PDF on the ticket (or forwards the invoice to a ticket-specific email address).
2. Receipt reader (Balanced) extracts vendor, invoice no., date, total, tax, line items (parts/labor), VIN/unit if printed; schema check (sum of lines = total) else escalates to Sonnet.
3. Suggested amount appears with a confidence chip; user taps **Accept** (one click) -> amount, vendor, PO fields fill; if different from the approved quote by > 10% [E default], an amber "does not match quote" appears.
4. Cost row saved against truck + load + ticket; vendor spend totals update; Accounting sees it in the unpaid-bills queue.

### Flow M5 — Repair or tow decision (V2, Pro/Autopilot)
1. Agent opens a ticket -> **Repair or tow?** -> truck/trailer prefilled, breakdown address (autocomplete), drivable yes/no, in-house tow driver or external tow quote.
2. Uploads shop quote (PDF/photo) -> AI parses items with criticality, optional manual edit; system computes road total vs own-yard total from **tenant presets** (labor rate, diesel price, mpg, breakdown pay, hotel; editable in Settings; home yard address from company profile; ANH hard-codes removed).
3. Agent taps **Get recommendation** -> Smart model returns road / yard / hybrid with confidence, savings, downtime cost (avg daily profit per truck from real analytics, default $400 [ANH wizard default]), key factors, warnings; validator re-checks the arithmetic in code.
4. Result is saved on the ticket (ANH never saved it); agent can follow-up chat ("what if we tow to our yard?"); approve -> sets mode and sends decision to the manager.

### Flow M6 — Overnight handoff and approvals
1. At shift end (set time) workflow compiles: tickets opened/closed, breakdowns in progress, approvals waiting, trucks down, items Dispatch was told about.
2. Core: structured list. Pro/Autopilot: Balanced model writes a 6-line narrative and ranks "needs a human first".
3. Incoming agent taps **Acknowledge** per item -> logged; pending approvals go to the approver's phone with Approve/Reject + comment (reject notifies the requester; ANH's false "technician notified" toast fixed).

## 4. Feature table (Part A)
| Feature | What it does | WORKFLOW / AI BOT / HYBRID (+why) | In ANH today? | Tier | Priority |
|---|---|---|---|---|---|
| Ticket create (driver, DVIR, PM, manual) | One ticket model: source, mode (roadside / in-house shop / vendor), single priority enum, TKT-sequence numbers | WORKFLOW (forms, rules) | Y shop_road.md (1,018 tickets); bugs: assigned_to_shop flag, priority case | Core | Launch |
| Auto-link to active load + dispatch notify | Finds truck's active load, flags Delayed, alert + draft; link/unlink UI | WORKFLOW (lookup rules) | Partial (auto-link works, no unlink UI) | Core | Launch |
| Truck status side-effects | Down/Available/In shop, one status vocabulary | WORKFLOW | Partial (inconsistent Active/Available) | Core | Launch |
| Ticket discussion + notes | Typed notes, required resolution before close, @mention, files | WORKFLOW | Y (1,018 note rows; resolution not enforced) | Core | Launch |
| Receipt upload + parsing | Photo/PDF to amount, vendor, lines, match-to-quote | HYBRID (AI reads unstructured doc; math check by code) | Y (967 receipts) | Core (bundle) | Launch |
| Costs linked to truck/load | Every cost row keyed to truck + load | WORKFLOW | Partial (amount field only) | Core | Launch |
| Fault-code lookup | SPN/FMI/OBD decode table + plain explanation | WORKFLOW (lookup); AI explain only in triage | Partial (hovercard) | Core | Launch |
| Find nearby shops | Places search, preferred flag, distance, open now, directions | WORKFLOW (API call, no thinking) | Y (find-repair-shops) | Core | Launch |
| Click-to-call / SMS | Tel/SMS links + in-app call log (first contact stamp) | WORKFLOW | Y (RingCentral protocol only) | Core | Launch |
| Breakdown Desk with driver chat | Alerts, chat thread, photos/voice, human reply | WORKFLOW (chat); triage is the AI part | Y (944 fleet_alerts; chat) | Core | Launch |
| AI breakdown triage | Summary, severity, safe-to-drive, questions, replies | AI BOT (unstructured photo/voice, judgment) | Y (analyze-issue; AI triage bubbles) | Pro | Launch |
| Ticket photo triage | Photo -> category, cause, likely parts | AI BOT (vision) | Y (analyze-yard-inspection) | Pro | Launch |
| AI shop calls | Voice agent calls shops, extracts quote/ETA | AI BOT (Voice; live conversation) | Y but 1 call ever (maintenance_shop_calls 1) | Autopilot | V2 |
| Quote cards + select shop | Compare quotes, pick, PO number | WORKFLOW | Partial (quotations top 2) | Core (manual quote entry), Pro+ (auto) | Launch |
| Spend approval limits | Threshold per role; approve/reject with comment; notify | WORKFLOW (rules) | Partial (manager review, never used) | Core | Launch |
| Preventive maintenance schedules | Miles/days/engine-hour templates, due lists, auto-ticket | WORKFLOW (calc) | N | Core | Launch |
| Schedule service -> Dispatch | Slot reservation, roll-call heads-up, conflict alerts | WORKFLOW | N (decision doc only) | Core | Launch |
| PM / failure predictor | Weekly per-truck risk from repeat repairs, fault codes, DVIR trends | AI BOT (multi-signal judgment) | N | Autopilot | V2 |
| Repeat-repair detection | Same component twice in 90 days per truck/vendor | HYBRID (rules; AI only normalizes free-text component) | Partial (DVIR "reported Nx") | Core rule, Pro AI normalize | Launch |
| Warranty / repeat-repair recovery | Detects warranty-eligible re-repairs, drafts vendor claim | HYBRID (rules + AI draft) | N | Pro (draft), Autopilot (sends) | V2 |
| DVIR review queue | Needs review, defects, photos, action per defect, notes | WORKFLOW | Y (1,696 reports, 964 reviews) | Core | Launch |
| DVIR redo + app lock | Redo with deadline, escalate on 2nd, driver notified | WORKFLOW | Y (96 redo requests) | Core | Launch |
| DVIR defect -> ticket | Repair Now auto-creates ticket + notifies Dispatch | WORKFLOW | N (ANH creates nothing) | Core | Launch |
| DVIR AI analysis + photo check | Severity, history, photo validity | AI BOT (Fast) | Y (analyze-dvir 421 rows, validate-dvir-photos) | Pro | Launch |
| Vendors (auto-built) | Created on receipt/close; preferred flag, spend, ratings, history | WORKFLOW | Partial (0 rows; no Add button) | Core | Launch |
| Vendor scorecard | Cost, turnaround, repeat-fix rate per vendor | WORKFLOW (calc) | N | Pro | V2 |
| Repair or tow decision | Quote parse + recommendation + saved result | AI BOT (Smart reasoning over numbers) | Y (RepairDecisionWizard; unsaved) | Pro | V2 |
| Overnight handoff | Compiled summary, acknowledge per item | HYBRID (workflow list + AI narrative) | N (mockup only) | Core list, Pro narrative | Launch |
| Road-team response metrics | Time to first response, shop found, contact, resolved per member | WORKFLOW (timestamps) | Partial (funnel built but data wrong) | Core | Launch |
| Cost/downtime analytics | Cost per truck/mile, downtime days, spend by category/vendor | WORKFLOW | Partial (math errors) | Core | Launch |
| Ask-your-fleet chat (maintenance + safety) | Natural-language questions with drill-down | AI BOT (Smart, tool use) | N | Pro (limited), Autopilot | V2 |
| Historical import | Excel/CSV tickets and fleet profiles, AI column map, dry run, undo | HYBRID (AI maps columns; rules apply) | Y (default wipes tickets: fixed) | Core | Launch |
| Driver chargeback flag | "Driver deduction" on ticket -> pending request to Accounting | WORKFLOW | Partial (checkbox only) | Core | Launch |
| Shop floor module | Bay board, assign tech, work-order status, parts waiting | WORKFLOW | Partial (queue; Start/Bump/Defer dead) | Add-on module | V2 |
| Technician mode | Mobile: start/stop timer, photos, voice note, complete -> review | HYBRID (workflow + STT) | Partial (0 sessions ever) | Add-on module | V2 |
| Parts lines on work order | Free-text parts with qty, cost, status; scan receipt | WORKFLOW | Y (28 required parts) | Core | Launch |
| Parts catalog/inventory/PO | Full stock, orders, tracking | WORKFLOW | Partial (catalog 0, inventory 1, orders 1) | Shop-floor add-on | Later |
| Part identification from photo | Photo -> part name/number + search links (no invented prices) | AI BOT (vision) | Y (3 searches, invented prices) | Shop-floor add-on, Pro | Later |
| Cameras | Not built | — | Placeholder-mock | Dropped | — |

## 5. AI bots in this department
All bots: Off / Suggest / Auto switch per tenant and per bot; Off/Test/Live per department; kill switch; audit log row per run (inputs, output, model, tokens, cost, who approved); confidence below threshold escalates Fast->Balanced->Smart->human; quiet hours apply to outbound messages and calls.

**B1 Receipt & Invoice Reader** — Trigger: file added to ticket or emailed in. Steps: classify (receipt/invoice/quote) -> extract fields and lines -> code checks (sum, date, MC/VIN) -> match to quote/PO -> fill ticket. Reads: file, ticket, vendor list. Writes: amount, vendor, receipt row, price history. Approval: user taps Accept (Auto only when confidence >= 0.9 and amount <= limit). Autonomy default: Core Suggest, Pro Suggest, Autopilot Auto. Model: Balanced, Gemini 3.6 Flash. Run: 2k in, 0.6k out. **Cost/run $0.004** (2,000 x $0.75/M + 600 x $3.75/M = $0.0038) [V prices]. Saves ~2 min typing ($0.83 at $25/h [E]) and catches quote mismatches; 967 receipts = ~$800 of keying.

**B2 Breakdown Triage Bot** — Trigger: driver report or inbound chat on an open breakdown. Steps: transcribe/translate voice, read photos, ask up to 3 follow-ups, classify severity, safe-to-drive flag, draft summary and ticket fields, suggest the next action (call shop / tow / continue). Reads: report, photos, fault codes, truck history, ELD location. Writes: ticket draft, chat replies, severity. Approval: Pro = every outbound reply needs one tap; Autopilot = auto-reply from safety script, any "unsafe/injury/fire/highway" goes to a human immediately and calls the on-duty agent. Default: Core locked (manual form), Pro Suggest, Autopilot Auto. Model: Balanced Gemini 3.6 Flash, 10% escalate to Sonnet 5.5. Run: ~6 turns, 12k cumulative in, 1.5k out. **Cost/case $0.017** (0.9 x $0.0146 + 0.1 x $0.039) [V]. Saves ~8 min of agent typing and first-response delay (~$3.30 labor [E]); faster response cuts downtime (each truck-day down ~ $400 lost profit [ANH wizard default]; 4 hours saved ~ $67 [E]).

**B3 Ticket Photo Triage** — Trigger: photos added to a ticket/DVIR defect. Steps: vision read -> category/subcategory, likely cause, parts list, urgency. Writes: category, notes, suggested parts. Approval: Suggest (human confirms category). Default: Pro Suggest, Autopilot Auto. Model: Balanced. 4k in, 0.8k out. **$0.006/run** (comparison Job 6, Gemini 3.6 Flash) [V]. Saves ~1.5 min and normalizes categories for analytics.

**B4 Shop-Call Voice Agent** — Trigger: agent taps "Call shops for me" (Autopilot also auto-trigger when a breakdown is Open and no shop selected for 10 min). Steps: pick shops by distance/preferred/open -> call (AI disclosure, recording notice) -> ask: can you take it, when, price range, tow needed -> summarise to quote card. Reads: ticket summary, location, vendor list. Writes: call log, transcript, recording, quote card linked to ticket (ANH never linked). Approval: spending a dollar is never done by the bot; agent selects the shop. Default: Autopilot Suggest->Auto for calls, Select always human. Model: Voice (Vapi cascade; Gemini Live is the cost-saver). ~3 min per call, 3 calls per breakdown. **Cost/call $0.331** (3 min x $0.11 [E] + transcript extraction $0.0011 Fast). Saves ~12 min of phone work per breakdown ($5 [E]) vs $0.99 for 3 calls; real value is quotes in parallel, cutting 30-60 min of downtime.

**B5 Repair-or-Tow Advisor** — Trigger: agent opens the wizard. Steps: parse quote (Balanced), compute road vs yard totals in code, Smart model weighs time/lost profit/risk, validator re-checks sums, saves result. Approval: advisory only; human decides. Default: Pro Suggest, Autopilot Suggest. Model: Balanced (parse) + Sonnet 5.5 (decision) + 2 cached follow-ups. 6k/1k + 8k/2k + 2 x ~$0.02. **Cost/run $0.084** ($0.0083 + $0.036 + $0.040) [V]. Saves a bad call of $300-800 per wrong decision [E].

**B6 DVIR Analyst** — Trigger: each submitted DVIR (photo check) and each flagged defect (analysis). Steps: photo validity, component history, severity, recommended action. Writes: dvir_ai_analysis, "reported Nx before". Approval: reviewer still clicks every defect action. Default: Pro Suggest, Autopilot Auto-create tickets for "critical" defects. Model: Fast, Gemini 3.1 Flash-Lite. 9 photos ~2.3k in + 0.2k out for validation; 1.5k/0.3k per defect. **Blended cost $0.0012 per DVIR** (validation $0.001 + 20% with defect x $0.0008) [V]. Saves ~1 min per report on 500/month = ~8 hours/month [E].

**B7 Handoff Writer** — Trigger: shift end. Steps: compile data (workflow), write 6-line summary, rank. Model: Balanced. 6k in, 0.8k out, **$0.0075/run** [V]. Saves ~10 min of manual handoff per shift. Default: Pro Suggest (reviewer edits), Autopilot Auto-post.

**B8 ETA-Impact Draft** (shared with Dispatch broker-update bot) — Trigger: ticket linked to a load. Steps: compute ETA impact (workflow), write email to broker. Approval: Pro = Send/Undo by human; Autopilot = auto-send when impact < limit, else human. Model: Smart Sonnet 5.5 (tone matters), 1.5k in 400 out, **$0.007/draft** [V]. Saves ~4 min per ticket on a broker-facing load.

**B9 Warranty & Repeat-Repair Recovery** — Trigger: weekly scan + each ticket close. Steps: rules find same truck + component + vendor inside warranty window (default 90 days [E]) -> AI drafts claim with invoices attached. Approval: human sends (Pro); Autopilot sends under per-claim limit. Model: Smart. 3k in, 0.6k out + lookups, **$0.015/draft**. Saves: recovers re-repair cost; one recovered $400 re-repair pays years of the bot [E].

**B10 PM / Failure Predictor** — Trigger: weekly per truck. Steps: combine odometer, fault codes, DVIR defects, repair history -> risk score + proposed PM or inspection. Writes: Truck health flags and draft work orders. Approval: Suggest. Model: Balanced, 6k in/0.8k out, **$0.0075 per truck-run** (25 trucks x 4 = 100/month). Saves unplanned breakdowns; a roadside tow + 2 lost days ~ $1,000+ vs a planned $350 service [E].

**B11 Fleet Chat (maintenance/safety questions)** — Trigger: user question. Steps: tool-using read-only, tenant-scoped SQL, shows source rows. Model: Smart Sonnet 5.5, 5 rounds ~40k cumulative in (cached), 2k out; **$0.04/question** [V]. Escalation: Haiku 5.5 for simple lookups. Default: Pro Suggest/read-only (always read-only).

**B12 Smart Search** — plain-English search of tickets/documents. Fast, 2k in/0.2k out, **$0.0008** [V]. Default Core Auto (read-only).

**B13 Import Mapper** — Trigger: file dropped on Import. Balanced, 3k in/1k out, **$0.006/file**; dry run required, undo for 30 days.

## 6. Tier matrix — Part A (caps per month, 25-truck fleet)
| Feature / bot | Core | Pro | Autopilot |
|---|---|---|---|
| Tickets, work orders, PM, DVIR review, vendors, costs, handoff list, analytics | ✓ | ✓ | ✓ |
| B1 Receipt reader | limited 150 | limited 400 | 1,000 |
| B12 Smart search | limited 300 | 1,000 | 3,000 |
| B13 Import mapper | limited 5 | 20 | 50 |
| B2 Breakdown triage | — | 60 cases (Suggest) | 150 cases (Auto) |
| B3 Ticket photo triage | — | 200 | 600 |
| B6 DVIR analyst | — | 600 DVIRs | 1,500 |
| B5 Repair-or-tow advisor | — | 20 | 60 |
| B7 Handoff narrative | — (list only) | 31 | 62 |
| B8 ETA-impact drafts | template only | 100 (human sends) | 300 (auto-send) |
| B9 Warranty recovery | repeat-repair flag only | 10 drafts | 40 (auto-send) |
| B4 AI shop calls | — (click-to-call) | — (click-to-call) | 60 calls |
| B10 PM/failure predictor | rules-based due list | rules + flags | 300 truck-runs |
| B11 Fleet chat (shared w/ Part B) | — | 60 | 300 |
| Shop floor / technician mode module | add-on | add-on | add-on |
Upsell: Core screens show locked previews with dollars ("3 repeat repairs on Truck 118 in 60 days cost $2,140 - Pro drafts the warranty claim", "9 breakdowns this month waited 41 min on average for a shop - Autopilot calls 3 shops in parallel"), live usage meter ("112 / 150 receipts"), compare-plans drawer.

---
## PART B — SAFETY & COMPLIANCE

## 1. Who uses it and what a day looks like
- **Safety manager (1 at ANH: safety_leader):** owns documents, DQ files, expirations, drug/alcohol program, incidents, insurance, audits. **HR/Recruiting:** feeds new-hire DQ items. **Dispatch:** sees the "dispatch gate" (who can take a load today). **Owner:** one question: "could we pass an audit tomorrow?" **Driver:** uploads a renewed CDL/medical card by phone. **Accounting:** insurance premiums, IFTA/IRP/UCR payments.
- **Day:** 08:00 open Safety readiness (score, blocked drivers/trucks, items expiring in 14 days) -> clear AI-sorted uploads inbox -> approve auto-drafted renewal texts -> new hire DQ file check -> any incident or roadside inspection logged -> weekly: random drug/alcohol selection when due, audit packet on request.
- ANH reality used to size the problem: 7 of 23 active drivers have expired license or medical on file; 14 of 23 trucks with registration dates are expired; inspection/insurance/IFTA dates exist on 0 trucks; 123 compliance docs vs 1,136 asset files; drug pool, incidents, audits, scores all empty. The old screens stored data but never alerted.

## 2. Screen map
| Route | Screen | Purpose | Device |
|---|---|---|---|
| /safety | Readiness (home) | Audit-readiness score, Dispatch gate (blocked drivers/trucks), expiring in 7/14/30/60 days, open incidents, pending tests, DVIR defects open | Desktop + phone |
| /safety/inbox | Upload inbox | Bulk drop, AI-sorted results with confidence, matched entity, Accept / Reassign / Reject | Desktop + phone |
| /safety/vault | Document vault | Search across driver / truck / trailer / company; filters; document history with "Current" mark; viewer + download; e-sign; carrier filter | Desktop |
| /safety/drivers | DQ files list | One row per driver: file complete %, next expiry, gate status | Desktop |
| /safety/drivers/:id | Driver DQ file | Checklist (application, MVR initial/annual, road test cert, medical + National Registry verification, annual review, drug test, Clearinghouse), documents, history, retention date | Desktop + phone |
| /safety/vehicles | Vehicle files | Per truck/trailer: registration/IRP cab card, annual inspection, insurance, IFTA decal, permits, ELD, inspection history | Desktop |
| /safety/expirations | Expiration calendar | Real calendar + list, owner assignment, snooze with reason, channel log, escalation ladder | Desktop + phone |
| /safety/drug-alcohol | Drug & alcohol | Pool, random selections, tests (pre-employment, post-accident, reasonable suspicion, return-to-duty, follow-up), results, MRO, Clearinghouse tracking | Desktop (restricted role) |
| /safety/incidents | Incidents & claims | Report, photos, documents, claim fields, preventable, status, DataQs | Desktop + phone |
| /safety/insurance | Insurance | Policies, premiums, certificates, renewals, COI requests/sharing with brokers | Desktop |
| /safety/permits | Permits & registrations calendar | IRP, IFTA license/decal, UCR, MCS-150, Form 2290, state permits, authority; due dates and owner | Desktop |
| /safety/inspections | Inspections | DOT roadside log, annual inspections, DVIR rollup, violations, CSA-style snapshot | Desktop |
| /safety/hos | HOS / ELD | Clocks, violations, unassigned driving, trend by driver (read-only from ELD vendor) | Desktop + phone |
| /safety/scores | Scores | Readiness score breakdown, driver safety scores | Desktop |
| /safety/audit-packet | Audit packet | Pick scope, one-click export (ZIP/PDF index) | Desktop |
| /safety/settings | Rules | Required-document matrix per role/equipment, alert ladder and channels, gate rules, retention, bot switches | Desktop |

## 3. Click-through flows

### Flow S1 — Bulk upload and AI sort (ANH proved this: 84 cab cards sorted)
1. User drops 1-200 files (PDF/JPG/PNG/HEIC/WEBP) or forwards to a vault email address or driver texts a photo -> 2. System stores each file in the private bucket (tenant-scoped path), creates an inbox row (status Processing), shows progress.
2. Sorter (Balanced): page splitting, classify type (CDL, medical card, MVR, registration/IRP cab card, annual inspection, insurance certificate, IFTA, permit, drug test, W-9, other), extract name/number/VIN/plate/dates/issuer, match to entity against ALL drivers/trucks/trailers (full-database matching, not "first 20" as in ANH; exact VIN/plate/license before fuzzy; digit-boundary matching so "12" never matches "112").
3. Confidence >= 0.9 and exact key match -> auto-filed (Autopilot) or placed in "Ready to file" (Core/Pro) with a one-tap Accept all; below -> "Needs a look" with the file beside the extracted fields.
4. On filing: new document marked Current, old one Superseded; expiration date copied to the entity record (single trigger, ANH had two overlapping); expiry reminders re-arm; if the entity was blocked by this item the gate reopens and Dispatch is told.
5. Unmatched -> user picks entity + type (manual assign, any status of driver; ANH lowercase 'active' bug fixed), no orphaned files: everything is either filed or in inbox.
6. Saved: file, parsed fields + confidence, who accepted, timestamps, audit row.

### Flow S2 — Expiration alert chain and dispatch gate
1. Daily server job (not browser) evaluates every tracked date: CDL, medical card, MVR annual, annual review, registration/IRP, inspection, insurance, IFTA decal, permits, policies, drug-program dates.
2. Ladder (editable default): 60 / 30 / 14 / 7 / 0 days and weekly while overdue. Day 60/30 = email + push to owner-of-item (driver and safety manager); 14/7 = SMS to the driver and push to safety; 0 = blocks per gate rule and alerts Dispatch.
3. Driver gets a text with an upload link: "Your medical card expires Oct 31 - upload the new one" -> upload goes to Inbox (S1) -> auto-clears the alert on accept.
4. Autopilot: renewal chaser bot continues the SMS conversation (answers "where do I renew", reschedules, escalates to a human after 3 unanswered tries or any refusal); Pro: bot drafts messages, safety manager approves in batch; Core: template reminders only.
5. Gate: if driver CDL/medical expired -> driver is marked "Blocked" on the Dispatch roll call and cannot be assigned a load; truck with expired registration/insurance or out-of-service defect -> "Blocked for loads". Override needs safety/owner permission + reason + expiry date, logged.
6. Owner dashboard shows blocked count and dollars at risk ("Truck 118 blocked: ~$400/day profit [E]").

### Flow S3 — New driver DQ file (hire to cleared)
1. Recruiting marks a candidate Hired -> system creates the DQ checklist from the tenant matrix (application, initial MVR, road test certificate, medical certificate, National Registry verification, pre-employment drug test result, Clearinghouse full query consent and result, annual review date).
2. Safety uploads/receives each item; MVR PDF -> DQ assistant reads violations/accidents/endorsements and shows a **recommendation** APPROVE / REVIEW / REJECT from the tenant policy rules (code applies the policy; AI only extracts and summarises).
3. Adverse hiring action (FCRA pre-adverse/adverse notices) is a **human-only gated step** with templates; the bot cannot send it.
4. When all required items are filled and verified, status "Cleared to dispatch"; Dispatch and Recruiting are notified; annual MVR/review reminders scheduled at 12 months (49 CFR 391.25) and medical expiry at certificate date. Retention clock set to employment + 3 years (49 CFR 391.51) [V from Department_Feature_Spec].

### Flow S4 — Random drug/alcohol pool selection (V2)
1. Settings: consortium/TPA contact, annual rates (current FMCSA minimum: 50% drug, 10% alcohol [E, verify each year]), period (quarterly).
2. Safety taps **Run selection** -> workflow draws from the current pool with a seeded, logged random generator (seed, pool snapshot, result list saved; not AI) -> selected drivers get push + SMS and a deadline per rule ("report immediately").
3. Safety records collection time -> results come back from the lab/MRO: **result must be entered or imported (negative/positive/refused/cancelled); no "Mark complete = negative" shortcut** (ANH flaw). Positive/refusal -> auto-removes driver from safety-sensitive work (gate) and starts return-to-duty/SAP checklist; MRO name/verification stored.
4. Dashboard shows quarter progress vs required count and Clearinghouse annual-query due dates.

### Flow S5 — Incident / accident report with photos
1. Driver (post-accident wizard in app) or safety manager taps **Report incident** -> guided intake: type, time, location, injuries, tow, police report #, photos, other party/insurer.
2. Pro/Autopilot: assistant (voice or chat) fills the form from conversation, reads photos, flags missing items (witness, photos of all vehicle sides).
3. System creates incident, links truck/trailer/load/driver, starts post-accident testing clock (drug within 32 h, alcohol within 8 h [I: 49 CFR 382.303, verify]) when criteria are met, and notifies insurer/broker (drafted; human sends in Pro, auto under limit in Autopilot).
4. Safety adds investigation notes and documents, claim number/amount/status, preventable decision; closes with reason. Notes are editable (ANH could only Close).

### Flow S6 — Audit packet in one click
1. Safety taps **Build audit packet** -> chooses scope (all drivers or sample N, vehicles, date range, DOT audit/insurance audit/broker onboarding).
2. Workflow collects DQ files, vehicle files, drug/alcohol program records, insurance certificates, DVIR/annual inspection logs, HOS sample, open gaps; produces an index PDF + ZIP.
3. Gaps listed on top with fix links (missing item, expired item, retention problem); Pro/Autopilot add a one-page AI cover memo ("17 of 25 files complete; 4 expired; 2 missing annual review").
4. Link expires after 7 days [E default]; share log kept.

## 4. Feature table (Part B)
| Feature | What it does | WORKFLOW / AI BOT / HYBRID (+why) | In ANH today? | Tier | Priority |
|---|---|---|---|---|---|
| Document vault | Per driver/truck/trailer/company storage, categories, search, history with Current, viewer, download | WORKFLOW (storage + rules) | Y compliance.md (123 docs; 1,136 asset files; viewer works) | Core | Launch |
| AI bulk upload / sorter | Classify, extract dates, match entity, file | HYBRID (AI reads unstructured scan; code matches and files) | Y (parse-bulk-documents; 84 cab cards) | Core (bundle) | Launch |
| Single upload parse | One doc to AI parse | HYBRID | Broken (private bucket; btoa overflow) | Core | Launch (merged into Inbox) |
| Manual assign fallback | Pick entity/type for unmatched file | WORKFLOW | Y (29 manual) | Core | Launch |
| Expiration tracking (all items) | One date model for drivers, trucks, trailers, company | WORKFLOW | Partial (alerts ignore truck columns; KPI only insurance) | Core | Launch |
| Server-side alert ladder | Daily job, email/push/SMS at 60/30/14/7/0/overdue, owners, snooze, dedupe | WORKFLOW (deterministic, near-free) | N (browser-only widget) | Core (email/push + SMS bundle) | Launch |
| Dispatch gate | Expired CDL/medical/registration/insurance blocks assignment; override with reason | WORKFLOW | N | Core | Launch |
| Renewal chaser | Conversational SMS follow-up with driver until doc uploaded | AI BOT (live conversation; Fast) | N | Pro draft / Autopilot act | V2 |
| Driver qualification files | Checklist per driver, completeness %, retention | WORKFLOW | N (wizard data only: driver_drug_tests 23, driver_mvr_records 23) | Core | Launch |
| MVR reader + policy recommendation | Extract violations, rules decide APPROVE/REVIEW/REJECT | HYBRID (AI extract; policy by code) | Partial (parse-mvr-report) | Pro | V2 |
| Annual review + MVR reminders | 12-month cycle tasks | WORKFLOW | N | Core | Launch |
| Medical certificate + National Registry verification | Check fields and expiry, link doc | WORKFLOW (manual verify tick + date) | N | Core | Launch |
| Drug & alcohol program | Pool, random draw (seeded), tests, results, MRO, Clearinghouse reminders | WORKFLOW (random draw must be auditable) | Partial (tables empty; Schedule Test broken; auto-negative) | Core (record + reminders), Pro (random draw + deadlines) | V2 |
| Clearinghouse query tracking | Consent, annual query due, results (fee pass-through) | WORKFLOW (tracking only; no API in V1) | N | Pro | V2 |
| Incidents & claims | Report, photos, documents, claim fields, preventable, edit/close | WORKFLOW | Partial (form exists; 0 rows; no edit) | Core | Launch |
| Incident assistant | Guided intake, photo read, claim packet draft | AI BOT (unstructured, narrative) | N | Pro | V2 |
| Insurance policies | Types, carrier, premium + frequency (saved), certificate upload, covered units, renewals | WORKFLOW | Partial (3 rows; frequency dropped; no certificate) | Core | Launch |
| COI request/share | Send certificate to broker, track requests | WORKFLOW (template) | N | Core | V2 |
| COI reader | Read certificates for dates/limits | HYBRID | N | Core (bundle) | V2 |
| Permits / IRP / IFTA / UCR / MCS-150 / 2290 calendar | Per-tenant obligations with due dates, owner, proof upload | WORKFLOW (calendar templates; reminders) | N (docs only; ifta decal date unused) | Core | Launch |
| Registration/IRP per truck | Cab card doc + expiry per truck, state list | WORKFLOW | Partial (registration date on 23 of 129 trucks) | Core | Launch |
| Inspections log | Annual inspection per vehicle, DOT roadside log, violations | WORKFLOW | Partial (annual inspection doc type only) | Core (annual), Pro (roadside + CSA snapshot) | Launch / V2 |
| DVIR (safety view) | Rollup, defect trend, redo stats (review lives in Maintenance) | WORKFLOW | Y (see Part A) | Core | Launch |
| HOS / ELD | Clocks, violations, unassigned driving, driver trend (read-only from ELD vendor) | WORKFLOW (calc on vendor data) | N (ConnectELDDevice only for GPS) | Pro | V2 |
| Readiness / compliance score | Deterministic % of required items current per driver/truck/company | WORKFLOW (formula, versioned) | Placeholder (scores tab empty; never calculated) | Core | Launch |
| Driver safety score | Weighted from DVIR compliance, incidents, HOS violations, inspections | WORKFLOW | Dormant (driver_behavior_reports 0) | Pro | V2 |
| Audit packet | Export of all required records + gap list; AI memo | HYBRID (assembly by workflow; memo AI) | N | Core (export), Pro (memo) | V2 |
| Compliance questions chat | "Which drivers expire in 30 days / have no annual review" | AI BOT (Smart) | N | Pro limited / Autopilot | V2 |
| Carrier filter / multi-carrier | Per MC/DOT view | WORKFLOW | Partial (tables only) | Core (tier-gated) | Launch |
| Document e-sign | Sign policies/acknowledgements | WORKFLOW | Y (737 signed docs) | Core | Launch |
| Data import (history) | CSV/PDF import of expiries and test history | HYBRID | N (Alvys-only import broken) | Core | Launch |

## 5. AI bots in this department
Same rails as Part A (switches, audit log, kill switch, quiet hours, human gates for legal items).

**C1 Document Sorter** — Trigger: file in Inbox / email / text photo. Steps: split pages, classify, extract fields, match entity, set status and date. Reads: file, entity lists (full). Writes: document row, extracted fields, confidence, entity expiry. Approval: Core/Pro Suggest (Accept all), Autopilot Auto above 0.9 with exact key match. Model: Balanced Gemini 3.6 Flash (Job 1), escalate Sonnet 5.5 on mismatch. Run: 3k in/0.6k out per page-set, 15% escalation. **Cost/doc $0.005** ($0.0045 x ~1.15) [V prices]. Saves 1.5 min per document ($0.63 [E]); ANH's 123 filed docs vs 1,136 asset files shows why filing was skipped.

**C2 Renewal Chaser** — Trigger: alert hits 14 days (or driver replies). Steps: send template-based text -> read reply -> answer common questions -> collect upload -> confirm filed -> escalate on 3 silent tries/refusal. Approval: Pro drafts to a batch approval; Autopilot acts within quiet hours, STOP/consent honoured (legal gate). Model: Fast Gemini 3.1 Flash-Lite. Run: ~6k in, 0.75k out per case. **AI cost $0.003/case** + SMS 4 out + 3 in segments ~ $0.067 [E: $0.011 out / $0.0075 in]. Saves ~10 min chasing per renewal ($4 [E]) and the idle day when a driver is blocked (~$400 [E]).

**C3 DQ File Assistant** — Trigger: MVR/medical/test PDF added. Steps: extract; compare to tenant policy; list gaps; draft annual review summary. Approval: any APPROVE/REJECT decision is human; adverse action step never automated. Model: Balanced (extract) + Balanced summary. 5k in/1.5k out. **$0.012/run** ($0.0083 + $0.0035) [V]. Saves ~6 min per driver review.

**C4 Incident Assistant** — Trigger: incident created or driver voice report. Steps: intake dialogue, photo read, gap list, claim/insurer draft. Model: Balanced (intake/photos) + Sonnet 5.5 (claim packet). **$0.054/incident** (chat $0.015 + photos $0.012 + packet $0.027) [V]. Approval: human sends everything leaving the company in Pro; Autopilot auto-notifies only own insurer inside set limits. Saves ~25 min per incident and avoids missed 8/32-hour testing windows.

**C5 Audit Packet Memo** — Trigger: packet built. Model: Smart Sonnet 5.5, 4k in/1.2k out, **$0.02/packet**. Saves ~2 hours collecting records ($50 [E]).

**C6 Compliance Chat** — shares B11 (Smart, $0.04/question, read-only).

**C7 COI/Insurance Reader** — Balanced, 3k in/0.6k out, $0.005 (counted in C1 volume).

No AI picks drug-test selections, writes drug-test results, makes hiring or adverse-action decisions, or edits HOS data.

## 6. Tier matrix — Part B
| Feature / bot | Core | Pro | Autopilot |
|---|---|---|---|
| Vault, DQ files, expiry tracking, alert ladder (email/push), dispatch gate, permits calendar, insurance, incidents, readiness score, e-sign, import | ✓ | ✓ | ✓ |
| C1 Document sorter | limited 100 / mo (+ one-time 500-page setup import at Batch rate) | 400 | 1,500 |
| SMS reminders (workflow) | limited 200 segments | 800 | 3,000 |
| C2 Renewal chaser | — (templates) | 50 drafts, human approves | 200 conversations, acts |
| C3 DQ file assistant | — (manual) | 40 | 120 |
| C4 Incident assistant | — | 15 | 40 |
| C5 Audit memo | — (export only) | 4 | 12 |
| Random pool draw + Clearinghouse tracking | — (records only) | ✓ | ✓ |
| HOS/ELD read-only, roadside + CSA snapshot | — | ✓ (ELD connected) | ✓ |
| C6 Compliance chat | — | 60 (shared with B11) | 300 (shared) |
Upsell previews: "7 of your 23 drivers have an expired CDL or medical card - Autopilot chases them by text and can clear the gate in days"; "14 trucks show an expired registration"; "Pass-the-audit score 61% - Pro shows the 9 gaps".

---
## 7. Cost to run at each tier's MAX caps (both departments; reference 25 trucks; per month)
Unit-cost assumptions: [V] = token prices from AI_Model_Comparison.md (fetched 2026-10-10); [E] = estimate. SMS $0.011/outbound segment all-in [E] (carrier $0.0083 + carrier fee), inbound $0.0075 [E]; email $0.0004 [E]; storage $0.023/GB-month [E]; egress $0.09/GB [E]; Google Places Nearby $0.032/search [E, verify]; ELD ingestion $0.25/truck/month [E]; voice $0.11/min [E].
| AI feature | Cap/mo Core / Pro / Autopilot | Unit cost | Monthly at cap Core / Pro / Autopilot |
|---|---|---|---|
| B1 Receipt reader [V] | 150 / 400 / 1,000 | $0.004 | $0.60 / $1.60 / $4.00 |
| C1 Document sorter [V] | 100 / 400 / 1,500 | $0.005 | $0.50 / $2.00 / $7.50 |
| B12 Smart search [V] | 300 / 1,000 / 3,000 | $0.0008 | $0.24 / $0.80 / $2.40 |
| B13 Import mapper [V] | 5 / 20 / 50 | $0.006 | $0.03 / $0.12 / $0.30 |
| B2 Breakdown triage [V] | 0 / 60 / 150 | $0.017 | $0 / $1.02 / $2.55 |
| B3 Photo triage [V] | 0 / 200 / 600 | $0.006 | $0 / $1.20 / $3.60 |
| B6 DVIR analyst [V] | 0 / 600 / 1,500 | $0.0012 | $0 / $0.72 / $1.80 |
| B5 Repair-or-tow [V] | 0 / 20 / 60 | $0.084 | $0 / $1.68 / $5.04 |
| B4 AI shop calls (3 min) [E voice] | 0 / 0 / 60 | $0.331 | $0 / $0 / $19.86 |
| B8 ETA-impact drafts [V] | 0 / 100 / 300 | $0.007 | $0 / $0.70 / $2.10 |
| B7 Handoff writer [V] | 0 / 31 / 62 | $0.0075 | $0 / $0.23 / $0.47 |
| B10 PM/failure predictor [V] | 0 / 0 / 300 | $0.0075 | $0 / $0 / $2.25 |
| B9 Warranty recovery drafts [V] | 0 / 10 / 40 | $0.015 | $0 / $0.15 / $0.60 |
| C2 Renewal chaser AI part [V] | 0 / 50 / 200 | $0.003 | $0 / $0.15 / $0.60 |
| C3 DQ file assistant [V] | 0 / 40 / 120 | $0.012 | $0 / $0.48 / $1.44 |
| C4 Incident assistant [V] | 0 / 15 / 40 | $0.054 | $0 / $0.81 / $2.16 |
| C5 Audit memo [V] | 0 / 4 / 12 | $0.02 | $0 / $0.08 / $0.24 |
| B11/C6 Fleet chat [V] | 0 / 60 / 300 | $0.04 | $0 / $2.40 / $12.00 |
| **AI subtotal** | | | **$1.37 / $14.14 / $68.91** |
| Non-AI variable | Core / Pro / Autopilot | Unit | Monthly |
|---|---|---|---|
| SMS segments (reminders, chaser) [E] | 200 / 800 / 3,000 | $0.011 | $2.20 / $8.80 / $33.00 |
| Email [E] | 500 / 1,500 / 4,000 | $0.0004 | $0.20 / $0.60 / $1.60 |
| Storage (DVIR photos ~4,600/mo at ~0.4 MB, vault) [E] | 5 / 25 / 100 GB | $0.023 | $0.12 / $0.58 / $2.30 |
| Egress (10% of storage read) [E] | 0.5 / 2.5 / 10 GB | $0.09 | $0.05 / $0.23 / $0.90 |
| ELD ingestion/HOS (25 trucks) [E] | 0 / 25 / 25 | $0.25/truck | $0 / $6.25 / $6.25 |
| Places searches [E] | 40 / 200 / 500 | $0.032 | $1.28 / $6.40 / $16.00 |
| Non-AI subtotal | | | **$3.85 / $22.86 / $60.05** |
| **Department total at max caps** | | | **$5.22 / $37.00 / $128.96** |
Notes: voice minutes are inside the B4 row (180 min at cap). Pass-through to the tenant, not our cost: MVR fees (~$8-15 each [E]), Clearinghouse queries (~$1.25 each [E, verify]), TPA drug-test fees. Typical (not max) usage is ~25-35% of caps, so expected cost is roughly $1.50 / $11 / $40. Initial setup import (~700 pages at Batch 50%: $0.0026 each) = about $1.80 one-time.

## 8. Parity checklist (nothing silently missing)
### Deliberate decisions on features that ANH barely used
| ANH feature (usage) | Decision | Why / where it goes |
|---|---|---|
| Technician portal (4 techs, 0 work sessions, 0 voice notes; fake VIN scan, fake progress) | REDESIGN, move into optional Shop Floor module as "Technician mode" (V2) | Most customers use outside shops; build only for fleets with a yard. Real VIN barcode scan on-device, timer, photo, voice note, complete -> manager sign-off. Separate technician login kept (fixed redirect). |
| Technician Performance tab (random numbers, $400/job hardcoded) | DROPPED | Fake data is worse than none. Replaced by real labor hours and cost per work order from timers. |
| Parts hub / catalog / inventory / purchase orders (1 order, 1 inventory row, catalog 0, AI part search 3 times, prices invented) | DROPPED from Core; parts live as lines on a work order. Full stock/PO is add-on "Shop Floor" (Later). AI part ID kept only to name a part + open vendor search links; **no invented prices**. | Real usage: 28 required-part lines. |
| Vendors / preferred vendors (0 rows; no Add button) | KEEP, REDESIGN | Vendors auto-created from receipts and ticket close (942 tickets had a repair_shop name); preferred toggle; spend and turnaround scorecard. |
| Manager Review queue (0 tickets ever) | REPLACED by spend-approval rule (threshold) + resolution note required. | One mechanism, not two. |
| Cameras (mock) | DROPPED | Placeholder. |
| Yard inspection with AI photos (images not saved, no queue flag) | KEEP as "Inspection -> ticket" (photos stored, queue flag correct), Pro | Useful for outgoing equipment checks. |
| Driver onboarding checklist + 737 signed docs (4 sessions) | MOVED to Recruiting/Onboarding dept; Shop gets "New driver truck prep" work-order template (truck assigned, cleaned, decals, IFTA sticker, photos, mechanic sign-off). Signing and document store stay in vault. | Not a shop function; the work is. |
| Incoming drivers queue | MOVED to Recruiting/Dispatch; shop sees the truck-prep task only | |
| Driver behavior (AI analysis, 0 rows, dormant) | DROPPED as chat-sentiment; replaced by deterministic driver safety score (V2) | Input source (group chat) disabled; subjective. |

### Part A mapping
| ANH feature (inventory/shop_road.md; usage) | New location |
|---|---|
| Queue, handoff accept, drag order (66 shop tickets) | Tickets list with mode filter; Shop Floor bay board (V2); accept = acknowledge |
| New ticket dialog (1,018 tickets), AI analysis, fault hovercard, nearby shops, files, driver deduction | Tickets > New ticket; B2/B3; fault-code lookup; Find shops; Files; chargeback flag |
| Ticket dialog: start/close/reopen/delete, notes, receipts (967), required parts (28) | Work order screen; delete restricted + soft delete with children; receipts B1 |
| Report delay to dispatch | Automatic (M1 step 6) with link/unlink |
| Fleet Monitor (ELD, low fuel, faults) | Truck health + Dispatch map; alerts workflow; fault codes viewable |
| Driver Emergencies chat with AI on/off toggle (944 alerts) | Breakdown Desk; B2 autonomy switch replaces AI on/off |
| Call driver/shop (RingCentral protocol) | Click-to-call/SMS + call log (any phone); optional dialer integration |
| Find shop + AI call (1 call) | Find shops + B4 (Autopilot) |
| RoadTeamTicketDialog 3-step wizard + sentiment + leader rating | Work order timeline (Summary/Find help/Resolution); rating optional V2; sentiment dropped; summary at close (Pro) |
| Lifecycle analytics (funnel TTFR/TTFS/TTC/TRT) | Analytics response metrics, computed from timestamps correctly |
| DVIR review (1,696; 964 reviews; 96 redo), AI analysis, photo validation | DVIR Review, B6, defect->ticket auto |
| AI Decision wizard | Repair-or-tow (B5), results saved, presets editable |
| Data Import (tickets, fleet profiles) | Import (dry run, undo; wipe not default) |
| Preferred vendors tab, vendor history | Vendors (auto-built) |
| Parts catalog parse-document, Shop prep (bulk status) | Parts lines; receipts via B1; catalog Later |
| TicketDetails on /management (spend, categories, 14-day spend by truck, alerts, truck filter buttons) | Overview + Analytics |
| Pause/resume ticket, waiting_for_parts, tracking links | Work order status "Waiting on parts" with note; tracking link field (no PO module) |
| Tab persistence (localStorage), Excel exports | Saved views; CSV/Excel export everywhere |

### Part B mapping
| ANH feature (inventory/compliance.md; usage) | New location |
|---|---|
| AI Bulk Upload (84 cab cards, 4 registration, 2 inspection) + manual assign | Inbox/Sorter C1; full-fleet matching |
| Single Upload & Parse (broken) | Merged into Inbox; private-bucket signed URL fixed |
| Truck/Trailer Compliance tables (23/129 trucks with dates) + badges (14-day red) | Vehicle files + Expirations; "Not set" shows as a task, not green |
| Document history + "Current" + viewer/download (works) | Vault document history; viewer |
| Expiration Alerts widget (license/medical/asset_files, 60 days) | Server-side ladder + calendar; clickable rows |
| Sidebar driver/fleet/trailer compliance stats, incidents this year | Readiness home cards (null no longer counted OK) |
| Carrier filter | Global carrier switcher (tier-gated) |
| Incidents (0 rows) form/details/close | Incidents (edit, investigation notes, photos, claim fields, preventable, trailer/load) |
| Insurance (3 policies exp 2026-12-12) | Insurance (frequency saved, certificate, covered units, renew reminder) |
| Drug tests (pool 0; Alvys import 62 docs/0 records; Schedule Test broken; auto-negative) | Drug & alcohol; Alvys-specific import dropped, replaced by CSV/PDF import; auto-negative removed |
| driver_drug_tests 23, driver_mvr_records 23 (wizard) | DQ file items (migrated) |
| Audits tab (view-only), Scores tab (empty) | Audit packet + Readiness score; audits log with create form V2 |
| Driver behavior dashboard | Dropped (see above) |
| ConnectELDDevice (0 devices) | Integrations hub; Disconnect no longer wipes VIN |
| IFTA baseline (Accounting) | Stays in Accounting; Safety calendar links to filing due dates |
| License/medical dates on drivers (23/22) | DQ file fields, same expiry model |
| Two overlapping DB triggers on documents | One expiry-sync function |

## 9. NEW features beyond parity (vs Alvys-class TMSs)
1. **Dispatch gate** wired into dispatch: expired items block assignment with override audit (compliance becomes operational, not a report).
2. **Overnight handoff** with acknowledge-per-item and approval inbox on phone.
3. **"Could we pass an audit tomorrow?" score** with the specific gaps, plus one-click audit packet and AI memo.
4. **Cross-department signals:** PM due -> Dispatch roll call; ticket -> broker ETA draft; DVIR defect -> ticket; document renewals clearing gates automatically.
5. **Breakdown Desk with parallel AI shop calls and quote cards** (Autopilot) and tenant-set spend limits.
6. **Warranty/repeat-repair recovery** (money-recovery bot, Autopilot sells itself in dollars).
7. **Renewal chaser** by SMS with upload link; ~7 of 23 drivers had expired items at ANH.
8. **Downtime cost clock** per truck from real profit per day; shown on every down truck.
9. **Receipt-by-email per ticket** and auto-built vendor book with turnaround scorecard.
10. **CSA-style snapshot and roadside inspection log** from FMCSA public data for the carrier's DOT number [E, verify API terms]; HOS violation trends from ELD.
11. **Regulatory calendar templates** (IFTA quarterly, UCR, MCS-150, 2290) with proof upload [E dates, verify].
12. Locked-feature previews showing dollars and a usage meter on every AI card.

## 10. Open questions for Abdel
1. In-house shop module: build it in V1 as an add-on, or wait until a customer with a yard asks (my recommendation: V2, since ANH's own shop features were ~unused)?
2. Is AI shop calling allowed to place calls without a human click inside Autopilot (disclosure + recording consent vary by state), or always "click to call for me"?
3. Dispatch gate defaults: should an expired medical card hard-block assignment out of the box, or warn first for 24 hours?
4. Drug & alcohol: do you want only record-keeping + random draw, or a TPA/consortium integration (and Clearinghouse queries) as a later paid add-on?
5. HOS/ELD: connect read-only to the tenant's existing ELD (starting with Optima, which ANH uses) rather than shipping our own ELD; confirm.
