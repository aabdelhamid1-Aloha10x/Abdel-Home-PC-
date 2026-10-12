# Accounting / Back Office — blueprint

Product: Fleet OS (placeholder name). Department key: `accounting`. Sources: inventory/accounting.md (parity checklist, "ANH-inv"), inventory/inbox_integrations.md (Gmail/QuickBooks parts, "ANH-int"), Department_Feature_Spec.md section 4, TMS_Product_and_Pricing_v2.md, AI_Model_Comparison.md.
Legend: [V] verified in a source file, [E] my estimate. WORKFLOW = rules/templates/calculations (near-free). AI BOT = needs unstructured input, judgment, or writing. HYBRID = workflow with one AI step.

Design stance in one line: money is a LEDGER, not a set of status flags. Every dollar (invoice, advance, reserve, fee, short-pay, driver pay, fuel, expense) is a ledger line tied to a load, a truck and a party, so settlements lock, escrow reconciles and P&L is trustworthy. Most ANH defects (double-pay, fee booked as escrow, three copies of pay math, 90-day hidden loads) disappear by design.

---

## 1. Who uses it and what a day looks like

- **Owner-operator (1-3 trucks, phone only):** is the accountant. Morning: one card "Money today" (to invoice, waiting on payment, cash expected this week). Delivers a load, taps **Invoice**, taps **Send to factor**. Snaps fuel/lumper receipts. Quarter end: taps **IFTA report**.
- **Bookkeeper / accountant (small-mid fleet; ANH has 1 heavy user doing 261 factoring submissions and 99 driver statements a month [V]):** Works a queue, not tabs: "Delivered, not invoiced", "Packets ready", "Remittance to match", "Short-pays", "Past due", "Settlements to approve". Clears it top to bottom, then weekly settlements and month-end.
- **Accounting leader / controller:** approvals (settlements, write-offs, disputes over $ threshold), AR aging, truck/lane/customer P&L, factor reconciliation, QuickBooks sync health.
- **Owner/executive:** reads the Money cockpit (cash, DSO, margin, what Autopilot recovered), approves bank-detail changes (second approval), sets autonomy switches.
- **Dispatcher (read only):** sees invoice/paid state and per-load profit on the load; never sees bank details or pay rates they lack permission for.
- **Driver / truck owner (in driver app, not here):** sees own settlements and statements; this department publishes them.

Role model fixes ANH: page-level guards per role (ANH `/accounting` has none; payroll/QB/investor rights hang on one hard-coded email [V ANH-inv]).

---

## 2. Screen map

Desktop = laptop-first full tables. Phone = same data, card lists, big primary buttons. "P" = phone-complete, "D" = desktop-first (usable on phone read-only).

| Route | Screen | Purpose | Device |
|---|---|---|---|
| `/money` | Money home (queue + cash) | "What needs me" queue with counts and dollars; cash-in forecast; Autopilot recovered-this-month tile; upsell preview tiles | P+D |
| `/money/invoices` | Invoices | Delivered-not-invoiced list, invoice builder, package preview, send (broker / factor / both), status chips Draft-Sent-Viewed-Paid-Short-Disputed | P+D |
| `/money/invoices/:id` | Invoice detail | PDF + attached RC/BOL/POD, send history (who/when/to), payment status, notes, accessorials, dispute thread | P+D |
| `/money/factoring` | Factoring | Packet queue (per factor), batch submit, advances, fees, reserves, submission history, factor settings and fee model (flat or aged tiers) | D (P: submit one) |
| `/money/factoring/reconcile` | Remittance reconciliation | Upload/receive factor remittance (PDF/CSV/XLSX/email), auto-match to invoices, exact/short/over/unmatched lanes, resolve, post to ledger | D |
| `/money/reserves` | Reserves / escrow | Per-factor, per-broker reserve balance, holds, releases, release-claim helper, single quarter format | D |
| `/money/collections` | Collections / AR aging | Aging buckets (0-30/31-60/61-90/90+), by broker, DSO, reminder queue, NOA batch, escalation, redirect-payment campaign | D (P: view+nudge) |
| `/money/shortpay` | Short-pay & disputes | Detected short-pays, evidence pack, draft dispute, status, recovered $ | D |
| `/money/detention` | Detention & accessorials | Timers from geofence/ELD/driver app, claims, approvals, billed vs unbilled | P+D |
| `/money/settlements` | Settlements | Per driver/owner-operator weekly (or custom) period; trips locked to statement; credits, deductions, advances; approve; PDF; publish to driver app | D (P: approve) |
| `/money/settlements/:id` | Statement detail | Line items each linked to a load; audit trail; lock state | D |
| `/money/payroll` | Pay run | Approved statements -> pay run -> export (ACH file / check list / QuickBooks bill-pay / payroll hook); paid marker with proof | D |
| `/money/advances` | Advances & deductions ledger | Per-driver ledger (advance, escrow, equipment, insurance, ELD) with recovery schedule | D |
| `/money/owners` | Owner & investor statements | Truck-owner / lease-on statements (see decision in section 9) | D |
| `/money/fuel` | Fuel | Card import/feed, receipt scan, match to truck/driver/load, anomalies, per-load fuel allocation, ppg, MPG | P (scan) + D |
| `/money/expenses` | Expenses | Receipt photo -> categorized expense linked to truck/load (tolls, scales, lumper, repairs), approval | P+D |
| `/money/ifta` | IFTA | Quarterly miles + gallons by state, tax due/credit, filing-ready report, odometer baselines | D (P: view) |
| `/money/books` | Books sync | QuickBooks Online connection health, mapping, review queue, categorization rules, bank feeds, sync log | D |
| `/money/pnl` | Profitability | Load, truck, lane, customer, dispatcher P&L; month select; drill-down to loads | D |
| `/money/reports` | Reports | Library (AR aging, Collected, Escrow, Settlements, Fuel, IFTA, P&L), scheduled email, share link (bank masked) | D |
| `/money/vendors` | Vendors & payees | Vendors, 1099 flags, W-9 vault (tokenized), payment methods | D |
| `/money/settings` | Money settings | Factors, fee models, invoice template and numbering per carrier, bank (masked, second approval), terms, pay-rate profiles, autonomy switches, thresholds, role permissions | D |
| `/money/audit` | Audit log | Every money action and every bot action: who/what/why, inputs, output | D |
| Load detail "Money" tab | Embedded | Invoice, expenses, pay lines, profit, short-pay, detention for one load (shared component) | P+D |
| Global | Universal search + KPI cards | Typing finds load/order#/truck/driver/broker/invoice and jumps to the right screen | P+D |

Navigation pattern: "queue first". The old 15-tab strip becomes 5 groups: **Bill** (invoices, factoring, reconcile, reserves), **Collect** (collections, short-pay, detention), **Pay** (settlements, pay run, advances, owners), **Spend** (fuel, expenses, IFTA, vendors), **Know** (books, P&L, reports, audit).

---

## 3. Click-through flows

### Flow 1 — Delivered load to paid-package (invoice + factor submit)  [WORKFLOW with one AI check]
1. Driver uploads POD (or load hits Delivered) -> System: Document Reader (Balanced, Gemini 3.6 Flash) classifies the file and checks it: signature present, delivered date within stop window, load number matches. Confidence >= 0.85 passes; below goes to "Needs a look" with the photo.
2. Rule fires (workflow): Delivered + RC + BOL + POD present = load enters **Ready to bill** (replaces ANH trigger `auto_advance_completed_load` [V]). Missing docs: a missing-doc reminder is sent to driver/dispatcher (workflow) and the load stays visible with a red "needs BOL" chip.
3. User opens `/money` -> sees "12 ready to bill, $31,400". Taps **Invoice all** (or one load).
4. System: builds invoice number from the carrier's own sequence (INV-2026-000412), generates invoice PDF (carrier template, remit-to, terms), merges RC+BOL+POD into one package PDF, stores it, writes the invoice record + ledger line (Receivable, load_id). Nothing is sent yet. User sees a preview with To address and attachment chips.
5. To address resolution (workflow, visible): broker invoicing email from rate con > broker contact > broker primary; factor submission address if the customer is factored. Missing email shows a one-tap "Ask broker for billing email" draft.
6. User picks route per customer default: **Send to factor** / **Send to broker** / **Both (NOA)**. Taps **Send**.
7. System (idempotent): writes a submission record FIRST (status "queued", per-load fee preview = advance %, fee % or aged tier, processing, wire), then sends email in batches of 5 (ANH sends first, records after [V bug]), then marks each load "Sent" with message id. Failures retry; duplicates are blocked by invoice-id + route key. Progress dialog shows each load.
8. Undo window 30 s on single sends; batch shows "Recall not possible, resend is blocked 24 h" to prevent duplicates.
9. System starts the clocks: expected-pay date from terms/factor schedule, aging, follow-up reminders. Load card now says "Sent to Factor, advance expected tomorrow".
10. Owner-operator on phone: steps 3-7 collapse to **Invoice -> Send to factor** (2 taps).

### Flow 2 — Remittance arrives: reconcile, post, spot short-pays  [HYBRID: matching is workflow, reading/ambiguity is AI]
1. Factor emails/uploads remittance (PDF, CSV or XLSX; ANH accepts PDF/CSV only, XLSX broke [V]) -> System: Remittance Reader (Balanced) turns it into rows (invoice/PO, gross, fee, reserve, wire, net, date). CSV/XLSX parse by saved column map, no AI.
2. Matcher (workflow): by invoice number, order #, reference, then amount+broker+date. Expected net is computed from the carrier's fee model (flat or aged tier, processing, wire, reserve %). Within $0.50 = **Exact**, auto-posted.
3. Ambiguous or unmatched rows (~10-15% [E]) go to Reconciliation Matcher (Balanced) which proposes a load with a reason; user sees "Probably load 48211 (same broker, amount 99.6%)" with Accept / Pick other.
4. User opens `/money/factoring/reconcile`: lanes **Exact (auto-posted)**, **Short**, **Over**, **Unmatched**. Short rows show expected vs received and the difference split into: factor fee diff, reserve, wire, broker short-pay.
5. User taps **Post N payments**. System writes ledger lines atomically: Collected, fee expense, reserve hold (single quarter key `YYYY-Qn`), wire fee; the load becomes Paid. The factor's own fee is NEVER booked as escrow/short-pay (ANH defect [V]). Nothing posts from a cancelled import (ANH saves decisions mid-import [V]).
6. Each short row has **Dispute** (Pro: AI drafts, human approves; Autopilot: bot acts within rules) and **Write off** (needs approver above threshold). Short-pay Recovery bot (section 5) opens a case with evidence pack: rate con, POD, accessorial approvals, prior emails.
7. Reserve ledger updates; "Reserve due to release" shows when the factor's release terms are met. Aged-tier factors: fee check compares charged vs contracted tier and flags overcharge.
8. Saved: remittance file, parsed rows, match decisions, who approved, journal lines, audit entries.

### Flow 3 — Weekly driver / owner-operator settlement (locked)  [WORKFLOW]
1. User opens `/money/settlements`, chooses period (any week; ANH limits to last 4 completed weeks [V]) -> System lists drivers with **eligible loads** = delivered, paperwork complete, not on any other statement.
2. Taps a driver -> **Draft** is generated by ONE pay engine (replaces ANH's three copies): per-load pay by driver's profile (percent of revenue, per mile loaded/empty, flat, hourly, salary, per diem; accessorial rules; revenue basis = invoice revenue, not rate), then credits (bonus, detention share, reimbursements), deductions (advance recovery, insurance, escrow, equipment, ELD, fuel advances, tolls), and fuel deducted where the profile says so.
3. Each trip is saved as a statement line linked to `load_id`, with a unique constraint: **a load can be on at most one non-void statement per pay line type** (blocks double pay, an ANH gap: 0 trip items saved [V]).
4. User reviews, edits a line (reason required, audit logged), taps **Finalize**. System **locks** lines; later load edits create an adjustment line in the next statement instead of mutating a paid one.
5. Pay-rate mismatches (driver pay missing on 3,427 ANH loads [V]) show as yellow "no pay rule" rows to fix before finalize.
6. Taps **Send for approval** -> approver (leader) sees only exceptions first (new driver, net negative, > +25% vs 4-week average, advance exceeds balance) then approves in bulk. Phone approval supported.
7. Approved -> **Publish**: statement PDF and in-app view go to the driver app with push; email fallback. "Send to Driver" is real (ANH placeholder [V]).
8. `/money/payroll`: pick approved statements -> choose method (ACH file, check list with numbers, QuickBooks bill-pay, or payroll-provider export) -> **Mark paid** requires method + reference; for rails we do not run, the system says "marked paid, money not moved by Fleet OS". Paid status is the only way to reach Paid (ANH's 0 paid in 1,233 statements [V]). Driver gets "Payment sent" push with expected-arrival date.
9. Void/return: returning a statement to draft releases the load locks; every change is an audit row.

### Flow 4 — Detention: detect, bill, collect  [AUTOPILOT bot on a workflow spine]
1. Geofence/ELD/driver-app timestamps give arrival and departure per stop (workflow). Timer compares to free time on the rate con (default 2 h, read from rate con by the Doc Reader).
2. When dwell exceeds free time, the load gets a **Detention candidate** with hours, amount, evidence (timestamps, geofence screenshot, driver note, BOL in/out times).
3. Core/Pro: user sees "Detention: 3.1 h, $155 unbilled" on the load and in `/money/detention`; Pro adds **Draft claim** (AI writes email, human clicks approve+send).
4. Autopilot (autonomy = Auto within rules): Detention Hunter checks rules (min $, max $, broker allow-list, evidence quality >= threshold, not already on rate con as paid), adds the accessorial to the invoice before it is sent or issues a supplemental invoice, and emails the broker with the evidence pack. Over-threshold or low-evidence goes to approval.
5. Broker approves/denies by reply -> Triage reads the reply (Fast) and updates the case: Approved (adds to receivable), Denied (bot replies once with evidence; then escalates to human), Silent 5 days (follow-up).
6. When paid, the detention share to the driver is added as a credit on the next settlement (workflow, rule set by owner).
7. Saved: timers, evidence, drafts, sends, outcomes. Tile shows "Detention recovered this month: $X".

### Flow 5 — Collections and AR aging  [HYBRID]
1. Nightly workflow recomputes aging per invoice and DSO, expected pay date per customer from real history (broker pays in 38 days avg).
2. `/money/collections` shows buckets 0-30/31-60/61-90/90+ and a ranked "Chase today" list: oldest, biggest, broker avg days late.
3. User taps **Remind** on a row, or **Chase all due (N)**. Core: fixed templates, merge fields, send via the carrier mailbox. Pro: Collections Drafter writes a tone-appropriate email from the invoice history (first nudge, firm, final), human approves each. Autopilot: bot sends on a cadence (day 1 past due, +7, +14, +21) within quiet hours and per-broker rules; replies are triaged ("paid last week", "need POD", "dispute"); POD/RC re-sent automatically.
4. Factored invoices go to the **factor** (NOA/redirect campaign), not the broker, using the saved batch tool: pick brokers, preview, send, and every send is logged (ANH logs nothing for redirect payments and its NOA batch is hard-coded [V]).
5. 61+ days: escalation step (leader review, phone call task, credit hold on broker so Dispatch sees a warning on new loads for that broker, "do not use" at 90+ with approval).
6. Any payment reply or remittance closes the case; promised-to-pay date creates a reminder.

### Flow 6 — Fuel import, match to loads, IFTA quarter  [WORKFLOW + AI for receipts]
1. Fuel cards: connect feed (EFS/WEX/Comdata API or scheduled CSV email) or drag files. Receipts: phone camera -> Receipt Scanner (Balanced) fills date, gallons, ppg, amount, state, vendor; user confirms; image is stored (ANH drops the image [V]).
2. System dedupes on card+transaction id, matches card to truck/driver (146 unmatched in ANH [V] go to a "Match" queue), and writes fuel ledger lines. Provider is a field, not hard-coded 'efs'.
3. Per-load fuel allocation (workflow): ELD miles between fuel events, MPG per truck, state by GPS/odometer, fuel cost attributed to loads by miles.
4. Fuel Watch (workflow rules, AI only to explain): flags no-truck, gallons > tank capacity, two fills < 4 h apart, fuel away from route, ppg outlier, card used while truck parked. Flags enter a queue; Pro adds a plain-English explanation and suggested deduction line.
5. `/money/ifta`: system accumulates miles by jurisdiction (ELD/GPS crossings, or odometer + route when no ELD) and gallons by state from fuel lines. Quarter picker -> table: state, miles, taxable miles, gallons, MPG, tax rate, tax due/credit, net. **Export** filing-ready PDF/CSV in jurisdiction format; flags missing data ("Truck 114 has 2 days of no GPS").
6. Saved: fuel lines, allocations, state mileage, quarterly report snapshot (immutable after "Mark filed").

---

## 4. Feature table

Tier = lowest tier where included (higher tiers include it, with larger caps). "ANH today" cites inventory file.

| Feature | What it does | WORKFLOW / AI BOT / HYBRID (why) | Exists in ANH today? | Tier | Priority |
|---|---|---|---|---|---|
| Ready-to-bill queue | Delivered + docs complete -> queue; missing-doc reminders | WORKFLOW (status + checklist rule) | Y (DB trigger, tabs Expected/Completed; accounting.md) | Core | Launch |
| Invoice builder + numbering | Numbered invoice PDF per carrier template, terms, accessorials, consolidated invoice per customer | WORKFLOW (template + counter) | N (ANH only emails uploaded docs, no numbering; Dept Spec 4) | Core | Launch |
| Invoice package builder | Invoice + RC + BOL + POD merged PDF | WORKFLOW | Y (2,718 packages, auto-built on tab open; accounting.md Factoring tab) | Core | Launch |
| Document completeness check | AI reads POD/BOL: signature, date, load # | HYBRID (reading a photo needs AI; gate is a rule) | N | Core (small bundle) | Launch |
| Send to broker | Preview, quick-pay toggle, send from carrier mailbox, send log | WORKFLOW | Y (45 loads direct; #34, #39-40) | Core | Launch |
| Send to factor / packet builder | Per-factor packet format (email, portal CSV, PDF bundle), batch, idempotent, fee preview | WORKFLOW | Y (1,845 submissions; #33; fee math partial) | Core | Launch |
| Factor-specific buyout packet (Tab Bank type) | Per-factor eligibility check (RC+POD required), per-load email, tracked sent flag | WORKFLOW (config, not hard-coded contact) | Y (255 sent; #46) | Core | Launch (as generic "factor packet rules") |
| Factor fee models | Flat %, aged tiers, processing, wire, advance %, reserve % per factor, applied in math | WORKFLOW | Partial (tiers configured, never applied; #18) | Core | Launch |
| Remittance import (PDF/CSV/XLSX) | Parse factor reports into rows | HYBRID (PDF via AI, CSV/XLSX via column map) | Y (944 rows; #52-54, XLSX broken) | Core | Launch |
| Auto-match + exact-match posting | Match to invoices, $0.50 tolerance, auto-post | WORKFLOW | Y (#62; 530 pending) | Core | Launch |
| Ambiguous-match assistant | Proposes load for unmatched rows with reason | AI BOT (judgment across messy refs) | N (ANH searches last 100 loads only; #59) | Pro | Launch |
| Reconciliation workbench | Lanes Exact/Short/Over/Unmatched, resolution reasons, bulk resolve, no silent delete | WORKFLOW | Y/Partial (Reconciliation tab, #77-83) | Core | Launch |
| Reserves / escrow ledger | Holds, releases, balance by factor/broker, one quarter format | WORKFLOW | Partial (640 holds, 0 releases; Escrow tab) | Core | Launch |
| Reserve release claim helper | Lists holds due for release, drafts claim to factor | HYBRID (due-date rule + drafted email) | N | Pro | V2 |
| Collected view (no hidden age) | All collected, server paging, exports, no 90-day cutoff | WORKFLOW | Partial (5,522 hidden; #63-69) | Core | Launch |
| AR aging + DSO | Buckets, by broker, expected pay date from history | WORKFLOW | N (accounting.md gap 19) | Core | Launch |
| Reminder templates | Past-due nudge templates, manual send, log | WORKFLOW | Partial (Collections dialog broken; #51) | Core | Launch |
| Collections Drafter | Writes firm/polite follow-ups using history; human approves | AI BOT (natural language) | N | Pro | Launch |
| Collections Autopilot | Cadence sender, reply triage, re-send docs, escalate | AI BOT (live replies, judgment) | N | Autopilot | V2 |
| NOA / redirect-payment campaign | Pick brokers, preview, send with docs, logged | WORKFLOW | Partial (hard-coded batch + RL Desue page, nothing logged; #50, redirect-payments) | Core | V2 |
| Broker credit hold | Late-paying broker flagged on new loads in Dispatch | WORKFLOW | N | Core | V2 |
| Short-pay detection | Compare paid vs invoice by broker; classify cause | WORKFLOW (arithmetic) | Partial (Underpaid KPI, reconciliation types; #77) | Core | Launch |
| Short-pay dispute drafting | Evidence pack + email | AI BOT | N | Pro | Launch |
| Short-pay Recovery bot | Opens case, sends, follows up within rules | AI BOT | N | Autopilot | Launch |
| Detention timers + claims | Dwell from geofence/ELD, claim amount, evidence | WORKFLOW | N (Dept Spec 2: missing) | Core (alert), Pro (draft) | V2 |
| Detention Hunter | Auto-adds detention/layover/lumper to invoice and bills broker | AI BOT (multi-step, writes) | N | Autopilot | Launch |
| Invoice Leak Finder | Compares rate con terms vs invoice, finds unbilled accessorials (lumper, TONU, fuel surcharge, layover) | HYBRID (rate con read once; compare is code) | N | Autopilot (preview in Core/Pro) | V2 |
| Settlement engine (one pay engine) | Pay by % / mile / flat / hourly / salary / per diem, accessorial sharing | WORKFLOW | Partial (3 copies of math; DriverSettlementsTab) | Core | Launch |
| Locked statements linked to loads | Unique load lock, immutable after finalize, adjustments next period | WORKFLOW | N (0 trip items [V]) | Core | Launch |
| Credits / deductions / advances ledger | Per-driver ledger with recovery schedule | WORKFLOW | Partial (per-statement only, no ledger; #116-122) | Core | Launch |
| Settlement approval + publish | Exception-first approval, publish PDF to driver app with push | WORKFLOW | Partial (approve works, send is a toast; #127, #132, #154) | Core | Launch |
| Settlement Auditor | Explains outliers, finds missing loads, pay-rule mismatches | HYBRID (rules find, AI explains) | N | Pro | V2 |
| Pay run + paid marker | Method, reference, proof, expected arrival; export to ACH file/QuickBooks/payroll | WORKFLOW | Partial (status flip only, 0 paid; #156) | Core | Launch |
| Payroll provider hooks | Export/API to Gusto/ADP/Paychex-class | WORKFLOW | N | Pro | Later |
| Owner / investor statements | Generated statements for truck owners with revenue, deductions, net, link delivery | WORKFLOW (generated from ledger) | Y (548 statements, 527 sent; Investors tab) | Core (generation), Pro (PDF import/parse) | V2 |
| Fuel import (cards) | CSV/PDF/feed import, dedupe, truck/driver match, provider field | WORKFLOW (+AI only for PDF) | Y (6,230 rows; #90) | Core | Launch |
| Receipt scan | Photo -> structured expense/fuel, stored image | AI BOT (unstructured photo) | Partial (~200 rows, image not stored; #89) | Core (bundle) | Launch |
| Fuel-to-load allocation | Cost per load by miles and MPG | WORKFLOW | Y (1,407 allocations; #93, #100) | Core | Launch |
| Fuel Watch | Anomaly flags with explanation | HYBRID | Partial (600 issues, stopped 2026-03-05; Fuel Analysis tab) | Core (rules), Pro (explanations) | V2 |
| Expenses | Receipt -> categorized expense linked to truck/load, approval | HYBRID | Partial (ticket receipts, fuel only; Dept Spec 4) | Core | Launch |
| Toll import | Transponder statements matched to loads | WORKFLOW | N (toll_transactions empty) | Core | V2 |
| IFTA quarterly report | Miles/gallons by state, tax, filing-ready export | WORKFLOW (arithmetic) | Partial (baseline importer only; #96-97) | Core | Launch |
| IRP / UCR reminders | Weights/mileage summary for IRP renewals | WORKFLOW | N | Pro | Later |
| QuickBooks Online sync | OAuth, vendors, categories, bills/payments, class sync, health banner on token expiry | WORKFLOW | Partial (token expired 2026-05-29; hourly sync off; QB tab) | Core (basic), Pro (two-way) | V2 |
| Bank-feed categorization | Learns from corrections, rule creation ("Set Rule", "Teach AI") | HYBRID (rules first, AI for the rest) | Y (622 txns, 26 corrections; #163-175) | Pro | V2 |
| Vendors / W-9 vault | Vendors, 1099 flag, tokenized tax/bank data | WORKFLOW | Partial (45 vendors; plaintext SSN/bank [V]; #140) | Core | Launch |
| Truck / lane / customer / load P&L | One margin definition, drill to loads, shop/overhead from cost profile | WORKFLOW | Partial (Truck P&L; double-counted dispatch fee [V]) | Core | Launch |
| Cost profile per truck | Fixed costs (payment, insurance, permits) feeding cost per mile | WORKFLOW | N (hard-coded constants) | Core | Launch |
| Cash forecast | Expected receipts from open invoices + bills/settlements due | WORKFLOW | N | Pro | V2 |
| Ask-your-books chat | Natural-language questions over tenant data | AI BOT (multi-step reasoning) | N | Pro (limited) | V2 |
| Morning cash brief | Daily summary and "do these 5 things" | AI BOT (writes, prioritizes) | N | Autopilot | V2 |
| Reports + schedules + share link | Library, export PDF/Excel/CSV, schedule, masked share link | WORKFLOW | Partial (4 exports, financial report has none) | Core | Launch |
| Money audit log | Every money action and bot action | WORKFLOW | N (accounting.md: no logs for NOA/redirect) | Core | Launch |
| Multi-carrier books | Per-carrier template, numbering, bank, factor, mailbox | WORKFLOW | Partial (carrier column, hard-coded RL Desue) | Fleet plan | V2 |
| Leak preview | Free nightly scan that shows "$ found" blurred behind upgrade | WORKFLOW (counts and sums only) | N | Core/Pro (upsell) | Launch |

---

## 5. AI bots in this department

Model picks come from AI_Model_Comparison.md. Fast = Gemini 3.1 Flash-Lite ($0.25 in / $1.50 out per 1M [V]); Balanced = Gemini 3.6 Flash ($0.75 / $3.75 [V]); Smart = Claude Sonnet 5.5 ($2.00 / $10.00 [V]); Voice = Vapi cascade (~$0.11/min [E]). Cost per run = tokens x price. Escalation: low confidence moves Balanced -> Sonnet 5.5 (10% of runs [E]). Default autonomy: Off / Suggest / Auto; defaults shown per tier. All bots: Test/Live per tenant, kill switch, audit row (inputs, output, confidence, who approved), quiet hours, per-bot dollar thresholds.

ANH-scale baseline used for savings [E, anchored on V figures]: ~300 loads/month now (295 last 30 days [V], TMS_Product_and_Pricing_v2) and ~3,000 loads/month in the Alvys era [V]; 261 factoring submissions/month [V]; 2,718 invoice packages built [V]; 6,230 fuel rows, 431 in 30 days [V]; 640 escrow holds totalling $101,461, avg $158 [V audit_finance]; avg invoice $2,000 [E], so revenue ~$600k/month at 300 loads and ~$6M at 3,000; factoring cost ~2% of revenue = $12k/month and $120k/month; accounting labor $30/h loaded [E].

**B1 Document Reader (invoice package check)**
- Trigger: POD/BOL/RC upload or email attachment. Steps: classify, extract load #, signature, delivered date, rate con terms (free time, detention rate, lumper policy), validate against load, score confidence. Reads: file, load record. Writes: document type, extracted fields, pass/fail, "needs a look" flag. Human point: failures only. Autonomy default: Core Auto (classification only, no money), Pro Auto, Autopilot Auto. Model: Balanced, Gemini 3.6 Flash. Tokens: 6k in / 1k out (3-page doc, from the comparison). Cost: 6,000 x 0.75/1M + 1,000 x 3.75/1M = $0.0045 + $0.00375 = **$0.0083 per doc** (+10% escalation to Sonnet 5.5 at $0.022 -> blended $0.0097; table uses $0.0083 base [V], the +15% escalation allowance is in the 20-30% headroom in section 7). Saves ~2 min of eyeballing per load; at 300 loads x 3 docs = 30 hours/month, worth ~$900/month at $30/h; 3,000 loads = ~$9k.

**B2 Receipt Scanner**
- Trigger: phone photo/upload. Steps: OCR+structure, match truck/driver, propose category, store image. Writes: expense or fuel line (draft until confirm). Human point: tap Save. Autonomy: Core Suggest (user confirms), Pro Suggest, Autopilot Auto for amounts under owner threshold. Model: Balanced. Tokens: 3k in (image) / 0.5k out. Cost: 3,000 x 0.75/1M + 500 x 3.75/1M = $0.00225 + $0.001875 = **$0.0041**. Saves 1.5 min typing; replaces 100% of manual fuel receipt entry.

**B3 Remittance Reader**
- Trigger: factor email attachment/upload (PDF). Steps: extract table, normalize invoice refs, compute implied fee%, check totals sum to net. Writes: remittance rows (staged). Human point: Post N payments button. Autonomy: Core Suggest, Pro Suggest, Autopilot Auto-post exact matches. Model: Balanced, escalate to Sonnet 5.5 on total mismatch. Tokens: 15k in / 3k out (10-page report). Cost: 15,000 x 0.75/1M + 3,000 x 3.75/1M = $0.01125 + $0.01125 = $0.0225; with 10% Sonnet escalation (15k x 2.00/1M + 3k x 10/1M = $0.06): 0.9 x 0.0225 + 0.1 x 0.06 = **$0.0263**. ANH has monthly-or-more factor reports (944 rows total [V]); saves ~20 min per report and prevents manual entry errors.

**B4 Reconciliation Matcher**
- Trigger: remittance rows the rule matcher cannot match (~12% [E]). Steps: search by broker/amount/date/reference fuzzy, rank 3 candidates with reasons. Writes: suggestion only. Human point: Accept. Autonomy: Pro Suggest, Autopilot Auto when confidence >= 0.95. Model: Balanced. Tokens: 3k in / 0.3k out. Cost: $0.00225 + $0.001125 = **$0.0034**. Saves ~3 min per unmatched row (ANH has 526 pending [V]).

**B5 Bank/QuickBooks Categorizer**
- Trigger: new bank/QB transaction with no rule hit. Steps: apply tenant rules first (workflow, free), AI categorizes the remainder using past corrections, writes "teach" rule on correction. Human point: review queue (approve in bulk). Autonomy: Pro Suggest, Autopilot Auto above 0.9 confidence. Model: Fast, Gemini 3.1 Flash-Lite, run in Batch (-50%). Tokens: 500 in / 50 out. Cost: 500 x 0.25/1M + 50 x 1.5/1M = $0.000125 + $0.000075 = **$0.0002** ($0.0001 batch). Saves ~20 s per transaction.

**B6 Detention Hunter** (money recovery, Autopilot)
- Trigger: dwell > free time at a stop, or load delivered with candidate flag. Steps: (1) gather timestamps and evidence (workflow), (2) read rate con clause (cached from B1), (3) decide billable amount and whether to attach to the invoice or send supplemental, (4) write evidence-backed claim, (5) send, (6) track reply. Reads: stop times, geofence log, driver notes, rate con terms, broker history. Writes: accessorial line, claim email, case status. Human point: Pro = approve each; Autopilot = auto within caps (min $25, max $400, evidence score >= threshold), above that Suggest. Autonomy: Pro Suggest only, Autopilot Auto. Model: Smart, Sonnet 5.5 (writing + judgment). Tokens: 3k in / 0.6k out. Cost: 3,000 x 2.00/1M + 600 x 10.00/1M = $0.006 + $0.006 = **$0.012 per claim** (plus a cheap Balanced reply read ~$0.002; ignored). Saves: see ANH-scale recovery table below.

**B7 Short-Pay Recovery**
- Trigger: reconciliation row classed broker short-pay or invoice paid below amount. Steps: classify cause (fuel surcharge, lumper, detention, quick-pay discount, claim, error), assemble evidence, draft dispute, send, follow up, record outcome. Human point: Pro Suggest; Autopilot Auto under owner threshold (default $250) else Suggest. Model: Smart, Sonnet 5.5. Tokens: 4k in / 0.8k out. Cost: 4,000 x 2.00/1M + 800 x 10.00/1M = $0.008 + $0.008 = **$0.016 per case**.

**B8 Collections Drafter / Autopilot**
- Trigger: invoice past due per cadence. Steps: read invoice, send history, last broker reply; choose tone; draft; (Autopilot) send, wait, triage reply (Fast), re-send POD/RC, escalate at 61+ days. Human point: Pro = approve each; Autopilot = Auto on cadence, escalate disputes. Model: Smart for drafts (Sonnet 5.5, $0.007 per the comparison: 1.5k in / 0.4k out), Fast for reply triage ($0.0001). Cost per draft **$0.007**.

**B9 Settlement Auditor**
- Trigger: statement moves to "send for approval". Steps: rules find exceptions; AI writes one-line explanation and suggested fix (missing load, rate mismatch, deduction over balance, week-over-week swing). Human point: approver reads. Autonomy: Pro Suggest; Autopilot Suggest (settlements move money: never Auto). Model: Balanced. Tokens: 8k in / 0.8k out. Cost: 8,000 x 0.75/1M + 800 x 3.75/1M = $0.006 + $0.003 = **$0.009**. Catches double-pay/missed-load errors; at ~0.3% of driver pay (~28% of revenue [E]) = ~$500/month at 300 loads.

**B10 Fuel Watch Explainer**
- Trigger: flagged fuel line. Steps: summarize why flagged using truck GPS/route, propose action (ignore, deduct, call driver). Autonomy: Pro Suggest; Autopilot Suggest (deduction needs approval). Model: Fast. Tokens: 2k in / 0.3k out. Cost: 2,000 x 0.25/1M + 300 x 1.5/1M = $0.0005 + $0.00045 = **$0.00095**; use $0.003 with Balanced fallback. Replaces manual review of ~600 historic issues [V].

**B11 Ask-Your-Books chat**
- Trigger: user question. Steps: tool-using SQL on tenant-scoped read-only role, up to 5 rounds, answer with linked drill-down. Reads: ledger, invoices, settlements, fuel, loads. Writes: nothing (read-only). Model: Smart, Sonnet 5.5, cached. Tokens ~40k cumulative in / 2k out (comparison, Job 4). Cost: $0.04 with cache (about $0.10 without) -> **$0.04 per question**. Pro cap limited, Autopilot deepest.

**B12 Morning Cash Brief** (Autopilot)
- Trigger: daily 6:30 local + weekly Monday deep brief. Steps: read AR, cash forecast, exceptions, bot outcomes; write 8-line brief with the 5 biggest dollar actions and one-tap links. Model: Smart. Tokens: 20k in / 1.5k out. Cost: 20,000 x 2.00/1M + 1,500 x 10.00/1M = $0.04 + $0.015 = **$0.055**.

**B13 Invoice Leak Finder**
- Trigger: invoice about to send, and nightly over last 60 days. Steps: compare rate con terms vs invoice and timestamps for unbilled lumper, TONU, layover, fuel surcharge, extra stops; propose line items. Human point: Suggest on Pro (preview only in Core), Autopilot Auto within caps. Model: Balanced. Tokens: 5k in / 0.6k out. Cost: 5,000 x 0.75/1M + 600 x 3.75/1M = $0.00375 + $0.00225 = **$0.006**; use $0.01 with escalation allowance.

### ANH-scale dollars recovered by Autopilot (money-recovery bots) [E]
Assumptions (all [E] unless tagged): 300 loads/month now, 3,000 in the Alvys era; avg invoice $2,000; factoring cost 2% of revenue.

| Bot | Assumption | $ found / month @ 300 loads | Autopilot recovery rate | $ recovered / month @ 300 | @ 3,000 |
|---|---|---|---|---|---|
| Detention Hunter | 12% of loads have billable detention (36); avg $140; 25% currently billed -> 27 unbilled = $3,780 | $3,780 | 60% | **$2,270** | $22,700 |
| Short-Pay Recovery | 6% of loads short-paid (18) at avg $158 (ANH escrow average, 640 holds / $101,461 [V]); ~60% genuine broker short-pay (rest are factor fee booking errors the ledger fixes) = $1,710 | $1,710 | 45% | **$770** | $7,700 |
| Factor fee / tier audit | Factoring cost $12,000; 2% overcharge or wrong tier (ANH uses 1.00% setting vs 2.25% factor discount [V]) | $240 | 100% (flag + claim) | **$240** | $2,400 |
| Collections Autopilot | Write-offs/aged loss ~0.25% of revenue = $1,500 avoided by earlier chase; plus DSO cut ~3 days on $600k = $60k working capital freed (not counted as recovered) | $1,500 | 50% | **$750** | $7,500 |
| Invoice Leak Finder | Lumper/TONU/fuel-surcharge unbilled: 4% of loads x $120 x 50% unbilled = $720 | $720 | 80% | **$580** | $5,800 |
| Fuel Watch (deduct/recover) | ~$138k fuel/month (431 txns x $320 [E]); 1% leakage = $1,380 | $1,380 | 50% | **$690** | $6,900 |
| **Total recovered** | | | | **~$5,300 / month** | **~$53,000 / month** |

One-time backlog preview: 640 reserve holds totalling $101,461 with 0 releases [V]. If even 15% is genuine reserve owed back by the factor, that is ~$15,000 to claim once [E]. Reserve Release Claim helper (Pro) shows this number.
ROI: Autopilot AI cost at cap is ~$114/month (section 7) vs ~$5,300 recovered at ANH-today scale: ~46x; more at 3,000 loads. These bots must stay in Autopilot because their value dwarfs the price.

### Upsell mechanics (built into the department)
- **Leak preview (Core and Pro):** a free nightly workflow scan (no AI, near-zero cost) counts delivered loads with dwell over free time, short-paid invoices, unbilled lumper flags and aged invoices, then shows on `/money`: "Fleet OS found $412 of unbilled detention and $286 of short-pays last month. Turn on Autopilot to recover it." The list is visible with amounts, claim buttons are locked.
- **Usage meter** on `/money` and in settings: "AI documents 74 / 100 this month", with the reset date; warnings at 80%.
- **Compare drawer:** one click opens Core | Pro | Autopilot with "what you'd have gotten last month" in dollars for the tenant's own data.
- **Recovered-this-month tile** (Autopilot) so the value is visible every month.

---

## 6. Tier matrix

Caps are per tenant per month; sized for a ~300-loads/month fleet and scaled by load count tiers (cap x loads/300, with the stated minimum, an extra-credits wallet for overage). AI caps below are the reference caps. "limited (n)" shows the cap.

| Feature / bot | Core | Pro | Autopilot |
|---|---|---|---|
| Ready-to-bill queue, invoices, packages, send, factor packets, fee models | ✓ | ✓ | ✓ |
| Remittance import + rule matching + reconciliation workbench, reserves ledger, AR aging, reminders (templates), settlements engine, locks, pay run, fuel import, IFTA, P&L, reports, audit log | ✓ | ✓ | ✓ |
| B1 Document Reader | limited (100 docs) | limited (1,000) | limited (5,000) |
| B2 Receipt Scanner | limited (50 receipts) | limited (300) | limited (1,500) |
| B3 Remittance Reader | limited (5 reports) | limited (60) | limited (200) |
| B4 Reconciliation Matcher | — | limited (300 rows) | limited (1,500) |
| B5 Bank/QB Categorizer | — | limited (2,000 txns) | limited (10,000) |
| B6 Detention Hunter | alert only (workflow) | limited (30 drafts, human sends) | limited (400 claims, Auto) |
| B7 Short-Pay Recovery | detection only (workflow) | limited (40 drafts) | limited (300 cases, Auto) |
| B8 Collections | templates only | limited (150 drafts) | limited (1,000, Auto cadence + triage) |
| B9 Settlement Auditor | — | limited (100 statements) | limited (400) |
| B10 Fuel Watch Explainer | rules only | limited (100 flags) | limited (500) |
| B11 Ask-Your-Books chat | — | limited (100 questions) | limited (600) |
| B12 Morning Cash Brief | — | — | limited (40 runs) |
| B13 Invoice Leak Finder | preview only (workflow) | preview + suggest (600) | limited (600, Auto) |
| Voice collections call (Later) | — | — | limited (30 calls, 3 min) |
| Autonomy switch per bot (Off/Suggest/Auto) | Off / Suggest (Auto only for B1) | Off / Suggest | Off / Suggest / Auto |
| QuickBooks | basic sync | two-way + rules | two-way + AI categorize |
| Owner/investor statements | generate + send | + PDF import/parse | same |
| Locked "found $" previews | shown with Autopilot lock | shown | n/a (live) |

---

## 7. Cost to run at each tier's MAX caps

All unit costs from the same token assumptions as section 5. [V] = prices verified on vendor pages in AI_Model_Comparison.md; [E] = my estimate of tokens/volumes. Caps are the reference caps in section 6. Costs assume no prompt caching except B11 (cached figure) and exclude Batch discounts (conservative).

### AI cost at cap
| AI feature | Core cap | Pro cap | Autopilot cap | Unit cost | Core $ | Pro $ | Autopilot $ |
|---|---|---|---|---|---|---|---|
| B1 Document Reader (Gemini 3.6 Flash) | 100 | 1,000 | 5,000 | $0.0083 [V price, E tokens] | 0.83 | 8.30 | 41.50 |
| B2 Receipt Scanner | 50 | 300 | 1,500 | $0.0041 | 0.21 | 1.23 | 6.15 |
| B3 Remittance Reader | 5 | 60 | 200 | $0.0263 | 0.13 | 1.58 | 5.26 |
| B4 Reconciliation Matcher | 0 | 300 | 1,500 | $0.0034 | 0 | 1.02 | 5.10 |
| B5 Bank/QB Categorizer (Flash-Lite) | 0 | 2,000 | 10,000 | $0.0002 | 0 | 0.40 | 2.00 |
| B6 Detention Hunter (Sonnet 5.5) | 0 | 30 | 400 | $0.012 | 0 | 0.36 | 4.80 |
| B7 Short-Pay Recovery | 0 | 40 | 300 | $0.016 | 0 | 0.64 | 4.80 |
| B8 Collections drafts | 0 | 150 | 1,000 | $0.007 | 0 | 1.05 | 7.00 |
| B9 Settlement Auditor | 0 | 100 | 400 | $0.009 | 0 | 0.90 | 3.60 |
| B10 Fuel Watch Explainer | 0 | 100 | 500 | $0.003 | 0 | 0.30 | 1.50 |
| B11 Ask-Your-Books (cached) | 0 | 100 | 600 | $0.04 | 0 | 4.00 | 24.00 |
| B12 Morning Cash Brief | 0 | 0 | 40 | $0.055 | 0 | 0 | 2.20 |
| B13 Invoice Leak Finder | 0 | 600 (suggest) | 600 | $0.01 | 0 | 6.00 | 6.00 |
| **AI subtotal** | | | | | **$1.17** | **$25.78** | **$113.91** |
| Voice collections call (Later, Vapi cascade ~$0.11/min x 3 min, 30 calls) [E] | — | — | 30 | $0.33 | 0 | 0 | 9.90 |
| **AI + voice subtotal** | | | | | $1.17 | $25.78 | **$123.81** |

(Pro cap for B13 is suggest-only runs; Core B13 is the free workflow preview, $0.)

### Non-AI variable costs this department drives [E unit prices]
| Item | Unit price assumption | Core volume | Pro volume | Autopilot volume | Core $ | Pro $ | Autopilot $ |
|---|---|---|---|---|---|---|---|
| Outbound email (invoices, packets, reminders; Resend-class) | $0.001 per email [E] | 800 | 3,000 | 12,000 | 0.80 | 3.00 | 12.00 |
| SMS (collections nudges, driver statement alerts) | $0.008 per segment [E] | 0 | 200 | 600 | 0 | 1.60 | 4.80 |
| Storage (invoice packages, receipts, remittance files) | $0.023 per GB-month [E]; ~0.6 MB per package/receipt | 0.5 GB | 2 GB | 6 GB | 0.01 | 0.05 | 0.14 |
| Bank feed (Plaid-class) | $0.30 per linked account per month [E] | 0 | 3 | 6 | 0 | 0.90 | 1.80 |
| Push notifications | ~free | | | | 0 | 0 | 0 |
| ELD pings | not driven by this department beyond reusing Dispatch/Tracking data | | | | 0 | 0 | 0 |
| ACH/payout rails | not run by us in V1 (export only); if added: pass-through $0.25-0.50 per payout [E] | | | | — | — | — |
| **Non-AI subtotal** | | | | | **$0.81** | **$5.55** | **$18.74** |
| **Total at max caps** | | | | | **~$2** | **~$31** | **~$143** |

Headroom: add 20-30% for retries and prompt growth (comparison section 7) -> Core ~$2.5, Pro ~$40, Autopilot ~$180/month maximum. Typical usage is far below the caps (a 300-loads fleet uses ~40% of Autopilot caps [E]). Even at max cap, Autopilot AI cost is ~3% of the ~$5,300/month it recovers at ANH-today scale.

---

## 8. Parity checklist (ANH features real users rely on)

Usage numbers from inventory/accounting.md [V]. "Fixed by design" = ANH bug removed. Row refs are the inventory's control numbers (#).

| ANH feature (usage) | Where it lives now | Note |
|---|---|---|
| KPI cards: Ready for Factoring, Invoiced, Collected, Escrow, Expected Today, Underpaid (#20) | `/money` queue tiles; each tile opens its filtered list | Expected Today lives on Dispatch too; included in queue |
| Universal search with suggestions that jump to tab and open load (#6-11) | Global search | Broker suggestions use the real brokers table (fixed by design) |
| Period selector incl. custom range (#12-13) | Period control on every list | Period is a choice of date field: pickup, delivery, invoice, paid (ANH pickup only) |
| Factoring settings and Factoring companies (2 rows) (#14-19) | `/money/settings` > Factors | Tier fees now applied; executives can edit with approval |
| Expected tab (#22-23) | `/money` queue "Delivering today/overdue" | |
| Completed tab and Send to Factoring / Move to Invoiced (#24-28; Completed has 0 loads) | Ready-to-bill queue | Dropped: "no selection = all" behavior (risk) |
| Factoring tab: auto package PDF (2,718 packages), Excel/PDF export, filters, payment method, Submit (1,845 submissions; 57 in last 7 days), Send to Brokers, Custom email, Move to, row mail menu, preview with Quick Pay, mailto "request accounting info" (#29-42) | `/money/factoring`, `/money/invoices` | Submission idempotent, record-first, drops no loads, default payment method from settings (fixed by design) |
| Invoiced tab with channel chips, Net, Expenses, Quick Edit (22 loads) (#43-48) | `/money/invoices` + load Money tab | Expense edit is atomic and typed (fixed by design) |
| Tab Bank buyout batch (255 sent) (#46) | Factor packet rules (eligibility RC+POD, per-factor contact) | Contact no longer hard-coded; retry skips already-sent |
| Import FactorView daily report with AI parse, matching, $0.50 exact tolerance, carrier fee profiles, inline status/reason/notes, Assign to Load, Import N Payments (944 rows) (#49, #52-62) | `/money/factoring/reconcile` | XLSX works; no edits to load gross from inside import; decisions saved only on Post (fixed by design) |
| Send NOA to Brokers (35 loads, one-off) (#50) | `/money/collections` > NOA campaign | Generalized, logged, no hard-coded recipients |
| Collections Outreach (broken, enum 'Factored') (#51) | Collections queue + Drafter/Autopilot | Fixed by design |
| Collected tab with exports (24 columns), KPI (6,431 collected, 5,522 hidden by 90-day cutoff) (#63-69) | `/money/reports` > Collected + invoices history | No age cutoff; server paging |
| Escrow tab, holds, quarter release, import release (640 holds, 0 releases) (#70-76) | `/money/reserves` | One quarter format; per-row release status; PDF import fixed |
| Reconciliation tab with Pending/Overage/Completed/Chargebacks/Underpaid, resolution list, notes, Done, delete (#77-83) | Reconciliation workbench | Delete becomes soft-delete with confirm |
| Fuel Cards tab: KPIs, truck filter, scan receipt, import fuel cards (6,230 rows, 431/30 days), ELD refresh, issues, load allocations, import (#84-95) | `/money/fuel` | No 500-row cap; provider selectable; image stored; delete confirms |
| IFTA baseline from odometer, odometer CSV import (60 baselines) (#96-97) | `/money/ifta` baselines | Dates no longer hard-coded; becomes part of full IFTA report |
| Fuel Analysis: reports, issues, allocations, resolve with notes, mark reviewed (21 reports, 600 issues, 1,407 allocations) (#98-108) | Fuel Watch + per-load allocation | Runs on every import (ANH stopped 2026-03-05); documentation upload implemented |
| Settlements: driver picker, trips, credits, deductions, fuel, Save Draft, PDF, Finalize, Statements list (1,233 statements; 99/month) (#109-134) | `/money/settlements` | Trips locked to loads; one pay engine; "Move to Draft" and "Send to Driver" work; any period |
| Payroll tab: Pending/Approved/Processed, Approve schedules Thursday 2 PM, Return to Settlements, Process to Paid, push "Payment Processed" (236 approved, 0 paid) (#152-158) | `/money/payroll` | Pay run with method + reference; scheduled time in tenant time zone |
| Bulk Sync Drivers to QB (46 synced) (#152) | `/money/books` > payees sync | |
| Analytics tab (revenue, collected net, fees + escrow, fuel; trends) (Analytics tab) | `/money/pnl` + company Analytics | Cancelled/TONU excluded |
| Vendors tab (45 vendors, 1099, QB sync, banking) (#135-140) | `/money/vendors` | SSN/bank tokenized and masked (fixed by design) |
| Investors tab: 107 investors, 548 statements (527 sent), upload PDFs by truck number, parse, short-link send, bulk send (#141-151) | `/money/owners` (see section 9 decision) | Investor CRM, blast email, deal/lead functions dropped (sales module is out of product); statement generation, send and history kept |
| QB Reconciliation: connect, bank accounts, sync, For Review/Categorized/Excluded, AI Categorize, bulk actions, Set Rule, Teach AI (622 txns, 26 corrections) (#159-175) | `/money/books` | Token-expiry banner and auto-refresh; "Alvys Bills" detector kept as import cleanup tool, delete asks second approval |
| Financial Reports P&L / Balance Sheet / Cash Flow (#176) | `/money/reports` + QuickBooks reports | Real maintenance cost; export added |
| Expense Analytics, Top 20 vendors (#177) | `/money/reports` | No 1,000-row truncation |
| Truck P&L: 8 KPIs, drivers, export xlsx, Sync Receipt Amounts, expand per load (#178-183) | `/money/pnl` | Dispatch fee not double-counted; shop cost is a setting, not $10,000 hard-coded |
| LoadDetailsDialog financials, Profit, Docs, "Confirm & Send to Accounting", follow-ups (#all) | Load detail Money tab | |
| Redirect Payments page (upload A/R export, match, send with RC/BOL/POD) (/accounting/redirect-payments) | `/money/collections` > Redirect payments | Per-tenant, logged, role-guarded |
| Status triggers: Completed->Ready to Factor, Cancelled->Collected with $0, short-pay escrow trigger (Automations) | Ready-to-bill rule; Cancelled sets invoice void; reserve entries come from the ledger | Escrow trigger deliberately NOT ported (it booked factor fees as escrow) |
| Cron: process scheduled payments, QB hourly sync, diesel prices (all inactive) | Scheduled jobs on by default with health monitor | |
| Dead/placeholder UI: AccountingFilters, Legacy payroll confirm, BankAccounts active toggle, Fuel "other charges only" | Dropped: dead code | |
| Investor "Blast Email" (sales component) | Dropped: sales module out of product | |
| Hard-coded RL Desue data, Tab Bank contact, SG Capital CC list | Dropped: moved to tenant configuration | |
| Gmail/Resend sending from carrier mailboxes (4 gmail credentials) | Per-carrier sending identity in settings (ANH-int Gmail integration) | Server-side role checks, send log |

---

## 9. NEW features beyond parity (Alvys-class TMSs stop at invoicing + settlements)

1. **Money-recovery bots (Autopilot):** detention, short-pay, factor fee audit, collections cadence, invoice leaks (section 5).
2. **Leak preview with real dollars** shown to Core/Pro tenants for upsell.
3. **Ledger-first money model** with locked statements and one pay engine; every number drills down to loads and rules.
4. **Cash view and forecast** from open invoices, broker pay history, factor schedules, settlements due.
5. **Phone-only owner-operator mode:** 2-tap invoice+factor, receipt photo, IFTA, "Money today" card.
6. **Connector-free factoring for any factor:** packet builder per factor (email/portal CSV/PDF), no vendor approval needed.
7. **Real IFTA:** quarterly state report with jurisdiction rates and missing-data checks (ANH has none).
8. **Reserve release claims** (ANH holds $101k, never released).
9. **Broker credit scoring** (days to pay, short-pay rate, dispute rate) feeding a Dispatch warning at booking.
10. **Settlement exceptions-first approval** on phone; driver sees statement with each load line.
11. **Auto-categorized books** with learn-from-correction rules and token-expiry health banner.
12. **Truck-owner / investor statements decision (keep or separate):** KEEP as a Core V2 module named "Owner statements", built on the settlement engine (statement type = owner payout: revenue, deductions, net, per truck). It generalizes to owner-operator leasing and small investor-owned trucks, ANH uses it heavily (107 investors, 527 statements sent [V]), and generating statements from the ledger removes the PDF-by-truck-number upload. SEPARATE (drop from Fleet OS): investor CRM, lead/deal tracking, blast email, short-link download funnel; those stay in ANH's own sales app. PDF-statement import with AI parsing is kept only as a Pro migration helper.
13. **Scheduled and shared reports** with masked bank details.
14. **Anomaly and duplicate guard on money sends** (same invoice cannot be sent twice within 24 h without override).
15. **Voice collections call (Later):** Voice-tier agent for 61+ day invoices, with consent and recording rules.

---

## 10. Open questions for Abdel

1. **Does Fleet OS move money or only record it?** (ACH payouts to drivers, collecting from brokers). Recording only for V1 is cheap and safe; payment rails bring licensing and liability.
2. **Autopilot recovery pricing:** flat monthly with caps (assumed here) or a share of recovered dollars (e.g., 10%)? At ANH scale, ~$5,300/month recovered suggests either works; the preview should match the choice.
3. **Owner/investor statements:** confirm the KEEP-in-Core-V2 recommendation (generate from ledger, drop investor CRM/blast).
4. **Average invoice and detention assumptions:** recovery figures use $2,000 per load, 12% detention incidence and 25% currently billed [E]. Can you give ANH's real average rate and detention billed vs unbilled to tighten the preview math?
5. **Settlement safety:** confirm settlements never auto-approve and fuel/damage deductions always need a human, even at Autopilot (assumed yes).
