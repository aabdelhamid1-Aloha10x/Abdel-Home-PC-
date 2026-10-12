# Dispatch & Loads + Driver App — blueprint

Product: Fleet OS (placeholder name). Scope: load board, new-load wizard with rate-con reading, feasibility, assignment, tracking/ETA/geofence, check calls, broker updates, broker/customer book, truck/trailer/driver/carrier records, the driver phone app (incl. DVIR with noon lock), and the owner-operator "run everything from the phone" mode.
Sources: inventory/dispatch.md, inventory/driver_app.md, inventory/shop_road.md (DVIR part), Department_Feature_Spec.md sections 2-3 and the Oct-2026 UI-review update, AI_Model_Comparison.md (model prices [V] = from that file's vendor-page fetch of 2026-10-10).
Legend: WORKFLOW = deterministic rules/queues; AI BOT = needs reading unstructured input / judgment / language; HYBRID = workflow with one AI step. [E] = my estimate. [V] = vendor-page-verified in AI_Model_Comparison.md.
ANH reference scale used for savings: 293 loads created/month, ~23 active drivers, ~30 active trucks, 530 BOL+POD docs uploaded by staff/month, 187 DVIRs/month, labor valued at $22/hour loaded [E].

---

## 1. Who uses it and what a day looks like
- **Dispatcher** (lives in Dispatch desktop; phone for after-hours): 7:30 opens Morning roll call (every truck: where, miles left, ETA vs appointment, what needs a human). Rate cons arrive in the inbox queue already read; dispatcher checks 1 screen per load, hits Create & Offer. All day: exceptions only (late risk, missing doc, detention clock, broker reply). Check calls and broker updates are drafted/sent by the system.
- **Dispatch leader / manager**: approves overrides (under break-even, infeasible timing, do-not-use broker), watches the Control tower and team scorecard, sets autonomy switches and geofence/check-call rules.
- **Driver (company driver or leased O/O)** (phone PWA/store app): morning DVIR before noon, then Today screen: one big "next action" button per load (Start trip / Arrived / Loaded - scan BOL / Delivered - scan POD), messages, pay statement, documents. Never types an address; Navigate hands off to Maps/Waze.
- **Owner-operator (1-5 trucks, no staff)**: same phone app in "Operator mode" with 5 tabs: Today, Loads, Money, Truck, More. Takes a photo of a rate con -> load exists -> self-assigned -> runs it -> docs scanned -> invoice/settlement triggers flow to Accounting module. Dispatch desktop is optional.
- **Back-office viewers** (accounting, safety, shop): read-only chips on Load detail (docs complete, detention proven, DVIR defect on this truck).

---

## 2. Screen map
Phone = driver/operator PWA (routes under `/d`) or responsive desktop. Desktop = `/dispatch`, `/book`, `/fleet`.

### 2a. Dispatch (desktop-first, all responsive)
| Route | Screen | Purpose |
|---|---|---|
| `/dispatch/tower` | Control tower | "What needs me" feed: late-risk loads, unassigned loads, missing docs, override requests, stale trucks, detention clocks; KPI strip (on-time %, loads in motion, unassigned, revenue MTD); fleet map thumbnail |
| `/dispatch/rollcall` | Morning roll call | One row per truck: live position, miles left, ETA vs appointment, status, heads-up chips (PM due, DVIR missing, expiring doc), auto-drafted broker update with Send/Undo. Replaces manual texting |
| `/dispatch/new` | New load wizard | Entry points: drop/forward rate con, phone scan, email inbox, copy repeat load, load-board link, manual. 4 steps: Read -> Check -> Assign -> Create |
| `/dispatch/inbox` | Rate-con queue | Drafts auto-created from email; PDF left, extracted fields right with per-field confidence; duplicate flag; "Create" / "Reject" |
| `/dispatch/loads` | All loads (board) | Table + kanban toggle, saved views per user (replaces the 36-column customizer), filters (status, team, driver, truck, broker, dispatcher, docs, date ranges), bulk status/assign, My loads switch, server-paginated, search across load#/order#/ref#/truck/driver/broker |
| `/dispatch/loads/:id` | Load detail | Tabs: Overview, Stops, Docs, Money (profit, driver pay, accessorials), Track (map + trail + ETA), Comms (broker/driver thread + check calls), Activity (audit), Notes & Tasks. Edit drawer with segments (recovery driver), multi-stop editor, cancel/TONU dialog |
| `/dispatch/map` | Live fleet map | Phone GPS + ELD merged; status colors; 24 h trail; parked/idle alerts; "find nearest truck to X" |
| `/dispatch/overrides` | Approvals | Override requests (infeasible, below break-even, broker standing); approve/deny with reason |
| `/book/brokers` | Broker & customer book | List + detail: contacts (deduped), MC/DOT with FMCSA lookup, remit-to/NOA, invoicing instructions, payment history, rate history per lane, cancellation history, do-not-use flag, notification preferences |
| `/book/contacts` | Contacts | Flat searchable contact list, merge duplicates |
| `/fleet/trucks`, `/fleet/trucks/:id` | Trucks | Status KPIs, filters, bulk status (role-gated, audited); profile: Manage, Docs (+expiry), Fuel, Loads, Maintenance, Notes, New ticket |
| `/fleet/trailers`, `/fleet/trailers/:id` | Trailers | Same pattern + Excel import |
| `/fleet/drivers`, `/fleet/drivers/:id` | Drivers | Roster, pending activation, pairing truck/trailer/team driver; profile tabs (Info, Equipment, Loads, Pay, Docs, Notes) - banking/tax masked and permission-gated (Accounting/HR dept owns edits) |
| `/fleet/carriers` | Carriers / entities | MC/DOT entities, sender email, factoring, bank (masked, second-approval change); tier-gated count |
| `/fleet/eld` | ELD & tracking connections | Vendor connect (Samsara/Motive/Optima-Hive), device<->truck matching (link/unlink by VIN or number), sync preview |
| `/dispatch/analytics` | Dispatch analytics | Dispatcher/team/driver/truck/lane leaderboards, truck goals (target per truck/month, pro-rated), CSV/PDF export; deep dives live in Command Cockpit |
| `/settings/dispatch` | Dispatch settings | Status rules, required docs per transition, geofence radius, check-call cadence, update templates (per carrier), feasibility buffers, break-even rule, autonomy switches, quiet hours, DVIR cutoff |
| `/track/:token` (public) | Broker tracking link | No-login page: status, map dot, ETA, last update; expires after delivery + 7 days |

### 2b. Driver app (phone PWA / store wrapper)
| Route | Screen | Purpose |
|---|---|---|
| `/d/login` | Sign in | SMS-link or code login (primary), email+password fallback; biometric re-entry |
| `/d/activate/:token` | Activate from text link | Profile, license/medical photos, e-sign, direct deposit (banking via PCI-style vault, never plain) |
| `/d/home` | Today | DVIR banner (due by cutoff), current load card with ONE next-action button, next load, alerts, GPS/consent status |
| `/d/loads`, `/d/loads/:id` | My loads | Offered (Accept/Decline), Active, In transit, Delivered; detail: stops with windows, contacts, refs unlocked by status, special instructions, Navigate, pay for this load (rate hidden unless tenant allows), scan buttons, "Message dispatch about this load" |
| `/d/scan` | Document scanner | Auto-crop, multi-page -> one PDF, classify (BOL/POD/lumper/scale/receipt), attach to load, works offline (queue) |
| `/d/dvir` | DVIR | Pre-trip / post-trip, pick unit(s), 10-photo rapid capture, checklist, review, submit; history |
| `/d/pay` | Pay | Statements (weekly), per-load pay, deductions/advances, earnings to date, PDF |
| `/d/docs` | My documents | CDL, medical card, expiry badges, e-sign agreements, upload with camera |
| `/d/messages` | Messages | Thread per load + Dispatch / Road team / Shop / Accounting / HR channels (each routes to the right team), photos, voice note, share location |
| `/d/breakdown` | Breakdown / emergency | Describe + photos + voice, share location, nearest shops with phone, AI triage + auto-ticket |
| `/d/profile` | Profile & settings | Contact edit (works), theme, notifications (push/SMS fallback), language EN/ES, sign out |
| `/m/*` | Operator mode | Tab bar: **Today** (load + DVIR + money snapshot), **Loads** (inbox photo -> load, board, repeat load), **Money** (invoices, who owes me, settlement to self, fuel/receipts), **Truck** (docs, PM due, tickets), **More** (broker book, reports, settings). Same components as desktop, phone-sized |

---

## 3. Click-through flows

### Flow A — Rate con in, load out (the money flow)
1. Rate con arrives: broker emails the tenant's `loads@` address (or dispatcher drops PDF/DOCX, or driver/operator snaps a photo, or "Forward to Fleet OS").
2. System (WORKFLOW) saves the file to the tenant vault, computes hash; if hash or (broker + order# + pickup date) matches an existing load -> flags "Possible duplicate of L-10492" and stops auto-draft.
3. System (AI BOT: Rate-Con Reader, Balanced model) extracts: stops (facility, address, window/appointment, ref#), equipment, commodity, weight, temp, line haul, FSC, accessorials, detention/layover terms, payment terms, broker name/MC/DOT/contact/invoicing instructions, special instructions, document grand total. Each field gets a confidence 0-1. If any money/date field < 0.85 or validation fails (line items != total, delivery before pickup, MC not 6-8 digits) -> auto-retry with escalation model (Smart).
4. System (WORKFLOW) matches broker by MC -> DOT -> normalized name; matches or creates ONE brokerage row and ONE contact (dedup by email) — fixes ANH's 685 duplicate contacts. Pulls broker standing (do-not-use flag, avg days to pay, cancel history).
5. System (WORKFLOW) calls Maps once per stop pair: loaded miles; deadhead from each candidate truck's last known position; runs break-even check (rate vs cost/mile profile; Core uses tenant's typed cost/mile, Pro+ uses live cost profile) and compares to the verbal/quoted rate if the dispatcher entered one.
6. Draft appears in `/dispatch/inbox` (and push to dispatcher). User sees PDF left, fields right with yellow chips on low-confidence fields, a green/amber/red strip: "Duplicate: no | Broker: OK, avg pays in 31 d | Rate: $2.12/mi vs break-even $1.74 | Best truck: T-118, 41 mi deadhead".
7. User fixes any yellow field (click field -> PDF scrolls to the source line, tap to accept/edit). Correction is saved as feedback for that broker's template.
8. User clicks **Create & Offer** (or **Create** only). System: reserves load number (sequence per carrier, atomic), writes load + `load_stops` + rate-con document + audit entry; sets status Booked; if truck chosen -> runs Flow B check; sends driver an offer push/SMS ("L-10493 Dallas->Atlanta $2,610, Accept?").
9. Hybrid autonomy: Core = all steps manual-confirm; Pro = inbox drafts auto-created, human clicks Create; Autopilot (owner opt-in, per-broker allow-list, rules such as rate >= break-even +10% and no flags) = auto-create + auto-offer to best truck, human sees it in the feed with Undo for 15 min. Never auto-accepts a tender at the broker.
10. Saved: load, stops, doc, extracted-vs-final diff (for accuracy tracking), confidence, model used, cost. User sees the new load on the board and in Roll call.

### Flow B — Feasibility check, assign, override
1. Dispatcher opens a load (or Step 3 of wizard) and clicks **Assign** -> sees ranked trucks/drivers.
2. System (WORKFLOW) filters: status Active, equipment match, driver activated, no open Critical maintenance/DVIR out-of-service defect, not on a conflicting load (schedule-conflict check), then ranks by deadhead miles, HOS hours remaining (ELD integration or driver-reported), hours-to-appointment, current load drop time + buffer, team/home-time rules. Pro adds "why this truck" one-liner (AI, Fast).
3. User clicks a truck. System runs feasibility: last drop ETA + deadhead time + buffer (tenant-set, default 60 min) vs pickup appointment; HOS 11/14-hour check if ELD connected. Result: OK / Tight / Infeasible with the numbers.
4. If OK/Tight: auto-fills driver and driver's trailer (choose swap if wrong). **Assign** -> load Dispatched, driver notified, truck row updates, Roll call updated.
5. If Infeasible: **Request override** -> justification box -> goes to leaders' approval queue with push; user sees Waiting/Approved/Denied live. Manager/owner role bypasses with a required reason. Create/Assign stays blocked until approved. Audit logs requester, approver, numbers.
6. Inline "assign driver to this truck" is a one-time assignment for this load unless user ticks "make permanent" (fixes ANH's silent permanent changes).
7. Saved: assignment history row (driver<->truck<->trailer with timestamps), override record, notification to driver.

### Flow C — Dispatched to delivered: taps, geofence, ETA, check calls, broker updates
1. Driver on `/d/home` taps **Start trip** (status En Route; location stamped; trailer attached). System (WORKFLOW): writes status + timestamp, event row, queues "Driver en route, ETA hh:mm" to the broker via the broker-update workflow (template per carrier; Core sends automatically from template; Pro adds AI-drafted wording for exceptions with human approve).
2. System (WORKFLOW) recomputes ETA every 5 min from phone GPS/ELD + truck-routing API; stores ETA history. If ETA > appointment + tolerance -> delay-risk flag. Pro/Autopilot AI (Fast) writes the one-line reason and suggested action; dispatcher sees it in Tower and Roll call.
3. Geofence (WORKFLOW, server-side, 0.5-mile default, per-facility override): phone/ELD enters pickup fence -> system sets Arrived at Pickup + timestamp, starts detention clock after free time (default 2 h or from rate con), pushes driver "Arrived? Scan BOL when loaded". Driver can also tap **Arrived** manually (not blocked by distance; flagged if >5 mi from the fence). Fixes ANH's 0 geofence events.
4. Check calls: workflow schedule (e.g. every 4 h in motion, or milestone-based). Core = reminder task for human; Pro = AI-drafted text to driver, human sends; Autopilot = Voice agent calls the driver or sends a "Reply 1 on time / 2 delayed / 3 problem" text; answers update ETA, notes, and flags exceptions to a human. Quiet hours respected.
5. Driver taps **Loaded - scan BOL** -> Flow D. System moves to In Transit on BOL receipt, emails broker "picked up" with BOL attached (template; Autopilot auto-send; Pro human approve for non-template text).
6. Arrival at delivery by geofence -> Arrived at Delivery; **Delivered - scan POD** -> Flow D.
7. On POD: status Delivered; rate con + BOL + POD all present -> load flagged "Ready to invoice" and handed to the Accounting department's queue (no more silent auto-jumps; the status change is logged with who/what).
8. Saved: status history with source (driver/geofence/dispatcher/system), GPS stamps, ETA history, detention timers, broker messages sent, all in the load Activity tab.

### Flow D — BOL/POD scan on the driver phone
1. At the dock, driver taps **Scan BOL** (button text changes by status). Camera opens with document frame, auto-crop, flash toggle.
2. Driver snaps page 1 -> preview -> **Add page** or **Done**. On-device enhancement (OpenCV/WASM) cleans it; pages merge to one PDF.
3. System (WORKFLOW) uploads (resumable; queues offline and retries), attaches to load as BOL v1 (never overwrites; a second scan = v2, lumper/receipts can have many), stamps GPS + time.
4. System (AI BOT: Document Reader, Balanced) classifies type, reads key fields (BOL#, seal#, pieces/weight, consignee signature present, date), checks legibility (blur/cut-off) and the weight/commodity vs the load. Illegible or unsigned -> driver sees "Retake: signature not visible" before leaving the dock.
5. Status moves (BOL -> In Transit; POD -> Delivered) via the same workflow rules as Flow C; broker email with attachment goes out per autonomy setting.
6. If wrong load picked (driver has 2 open loads): the reader suggests the matching load by ref#/consignee; driver confirms with one tap.
7. Saved: document, extracted fields, confidence, status event. Dispatcher sees a green "BOL" chip on the board row within seconds.

### Flow E — DVIR with 10 photos and noon lock
1. Home shows amber "DVIR due by 12:00 PM (your timezone)" with **Start DVIR**. Push reminders at 07:00 and 11:00 (workflow) if not done; SMS fallback if push token missing.
2. Driver taps Start -> **Vehicle**: truck and trailer pre-filled from assignment; can change either (fixes "no way to pick another unit"); toggle Pre-trip / Post-trip (post-trip offered after Delivered or end of day).
3. **Photos**: rapid capture full-screen with sample image per slot: truck front/rear/left/right, dashboard, trailer front/rear/left/right, tires. Each photo compressed (<=1920 px JPEG), blur/black detection on device, tap to retake. Progress persisted so a camera page-kill doesn't lose work (4 h).
4. After photo 10, system (AI BOT: DVIR Photo Inspector, Balanced; Pro+) checks each tile: right subject, not duplicate, license plate/unit number legible, obvious damage/leaks/flat/missing mirror. Advisory: red ring + "retake" prompt; never blocks submit.
5. **Checklist**: "Everything looks good - mark all OK" or open category -> per component OK / Defect -> severity Minor/Major/Critical + note + optional photo.
6. **Review** (counts, defects, thumbnails, notes) -> **Submit**. System (WORKFLOW): saves a NEW immutable report (resubmits create v2; prior never deleted), uploads photos to private storage, records Eastern/tenant-local date, clears the lock.
7. If defects: WORKFLOW rule by severity — Minor: note to Shop queue; Major: ticket auto-created for Maintenance + dispatcher chip on the truck; Critical: truck flagged "Do not dispatch" (hidden from assignment, dispatcher push, driver told "Do not drive - call shop"). Pro+: AI (Balanced) writes the defect summary, recommended action, repeat-defect history, and drafts the ticket.
8. **Noon lock (server-enforced)**: at cutoff (default 12:00 tenant-local, configurable per tenant/driver group), a scheduled job marks drivers with an assigned truck and no DVIR today as "DVIR overdue". Drivers see a full-screen lock ("Complete DVIR to continue") — all screens except DVIR, Emergency/Breakdown, call dispatch and Sign out. Safety rule: lock is applied only when the vehicle is not moving (speed < 5 mph for 2 min) so a driver is never distracted at speed; load actions are blocked server-side too (API rejects status taps), so a modified client cannot bypass it. Dispatcher can one-tap "Grant 2 h grace" with a reason (logged). Offline: DVIR can be completed offline and syncs.
9. Staff review: Safety/Shop review screen lists today's DVIRs with photos and defects; **Request redo** (reason, 30-minute deadline; if missed -> lock; attempt 2 -> immediate lock) sends push + SMS. Defect actions (Repair now / Fix at terminal / Monitor / Not urgent) are stored; "Repair now" now creates a ticket (fixes ANH gap).
10. Retention: reports and photos kept >= 3 months (FMCSA 396.11 minimum, confirm with counsel) — default 12 months.

### Flow F — Owner-operator runs everything from the phone
1. O/O opens the app -> `/m/today` (Operator mode). Shows: DVIR due, current load, money snapshot ("$3,240 invoiced, $1,180 unpaid, next fuel stop...").
2. Broker texts/emails a rate con: O/O taps **+ Load -> Scan rate con** (or the email auto-arrives). Reader (Flow A steps 3-6) shows a single card: route, miles, $/mile, "Above your break-even by $0.38/mi", broker credit/standing, DAT-style lane note if available. Taps **Book it** -> load created and self-assigned (no feasibility override: warning only).
3. Day-of: same driver Today screen (Flow C/D) — **Start trip, Arrived (geofence), Scan BOL, Delivered, Scan POD**.
4. Broker updates + tracking link send automatically from templates (Core) so the O/O never texts the broker.
5. At POD: system hands the load to Accounting module's invoice step. O/O sees "Invoice ready — send to broker/factor?" one tap (accounting department blueprint owns the invoice/factoring logic).
6. Money tab: who owes me, aging, settlement to self (weekly), fuel receipts scanned, IFTA miles. Truck tab: PM due, docs expiring, ticket button.
7. If the O/O later hires a driver or adds trucks: **Switch to Fleet mode** unlocks desktop dispatch, roles, roll call; data is the same (no migration).

---

## 4. Feature table
Y/Partial/N = exists in ANH today. Priority: Launch / V2 / Later.

### 4a. Dispatch & loads
| Feature | What it does | WORKFLOW / AI BOT / HYBRID (why) | In ANH? | Tier | Pri |
|---|---|---|---|---|---|
| Rate-con reading | PDF/DOCX/photo -> full draft load with confidence per field | HYBRID: AI reads unstructured doc; rules validate/match | Y (dispatch.md "parse-rate-confirmation") | Core (30/mo) / Pro / Autopilot | Launch |
| Rate-con email inbox | Forward address or Gmail/M365 connect; each rate con -> draft; duplicate detection | HYBRID: workflow routing + AI read | Partial (spec: parser exists, email flow incomplete) | Pro | Launch |
| New-load wizard | 4-step Read/Check/Assign/Create, drafts auto-saved, repeat-load copy | WORKFLOW | Y (CreateLoadDialog, 409 drafts) | Core | Launch |
| Multi-stop and editable stops | N pickups/deliveries, windows, FCFS vs appointment, per-stop refs, editable after creation | WORKFLOW | Partial (stops not editable post-create) | Core | Launch |
| Load numbering and duplicate guard | Atomic sequence per carrier; duplicate order#/hash check | WORKFLOW | Y (reserve_next_load_id) | Core | Launch |
| Break-even / quoted-rate check | Compares rate to cost/mile and to dispatcher's verbal rate; warns/blocks per rule | WORKFLOW (arithmetic) | N | Core (typed cost/mi); Pro (live cost profile) | Launch |
| Broker standing check | Do-not-use, slow payer, cancel history at load creation | WORKFLOW | Partial (cancel history warning only) | Core | Launch |
| Feasibility check + override | Timing, deadhead, HOS, equipment, conflicts; manager approval | WORKFLOW (deterministic math) | Y (feasibility + 657 overrides) / Partial (no HOS) | Core | Launch |
| Best-truck ranking | Rank by deadhead, HOS, ETA, equipment; "why" line | WORKFLOW rank + AI one-liner (Pro) | Partial (GPS-only planner, buggy) | Core rank; Pro "why" | Launch |
| Dispatch Planner | Multi-load, multi-truck plan proposals with constraint validator | AI BOT (multi-step reasoning) | N (research_ai_dispatcher) | Pro (60/mo suggest) / Autopilot | V2 |
| Load board (All loads) | Filters, saved views, bulk status, server pagination, universal search | WORKFLOW | Y (LoadBoard 1,912 lines; broken broker filter/search/pagination) - fixed by design | Core | Launch |
| Control tower + Roll call | Exceptions feed; per-truck ETA vs appointment; auto update drafts | WORKFLOW (+ AI wording Pro) | N (UI-review decision) | Core | Launch |
| Status workflow | Enforced order, per-transition required docs, rollback roles, timestamps, cancel/TONU dialogs everywhere (bulk too) | WORKFLOW | Y (DB-enforced) | Core | Launch |
| Cancel / TONU | Reason lists broker/carrier, TONU revenue, auto-close | WORKFLOW | Y | Core | Launch |
| Recovery driver segments | Mid-route handoff splitting miles and pay | WORKFLOW | Y (4 segments ever) | Core | Launch |
| Documents per load | RC/BOL/POD/lumper/scale/other; versions; many receipts; viewer; missing-doc chips | WORKFLOW (+ Document Reader) | Y (12,108 docs; replace-bug) | Core | Launch |
| Document classification/reading | Reads BOL/POD/lumper/receipt, checks signature/legibility | AI BOT (images) | Partial (Gemini result discarded) | Core (60/mo) / Pro / Autopilot | Launch |
| Load P&L tab | Revenue, driver pay, fuel, tolls, insurance, maint, factoring, dispatch fee | WORKFLOW (uses Accounting cost profile; no hard-coded constants) | Y (hard-coded rates) | Core | Launch |
| Notes, tasks, follow-ups | Per-load notes, @mention, due tasks, reminders | WORKFLOW | Partial (follow-ups 0 rows) | Core | Launch |
| Live map + trail | Phone GPS + ELD merge, 24 h trail, stale/offline states, parked alerts | WORKFLOW | Y (48 sessions) | Core | Launch |
| ETA engine | Recompute ETA every 5 min from position + traffic-aware truck routing | WORKFLOW | Partial (only inside broker-update job) | Core | Launch |
| Geofence arrival/departure | Server-side fences, events, auto status, detention clock | WORKFLOW | N (0 events ever) | Core | Launch |
| Detention timer + evidence | Timer from geofence, free-time rules, evidence pack for billing | WORKFLOW (billing bot sits in Accounting) | N | Core timer; Autopilot recovery handoff | V2 |
| Delay-risk alerts | Late probability + explanation + suggested action | HYBRID: workflow computes risk; AI writes reason | Partial (predict-delay-risk, cron off) | Pro | Launch |
| Broker updates (milestones) | Templated emails/SMS at assigned/en route/picked up/arrived/delivered with BOL/POD | WORKFLOW (templates) | Partial (dead: broker_id NULL; 12 emails ever) - fixed by design | Core | Launch |
| Broker update drafting for exceptions | Delay/breakdown wording, human approves | AI BOT (language) | N | Pro | Launch |
| Tracking link | Public no-login page with map, ETA, status | WORKFLOW | N | Core | Launch |
| Check calls (human reminders) | Cadence rules create tasks; results logged | WORKFLOW | N (no check-call workflow) | Core | Launch |
| AI check calls (text/voice) | Texts or calls driver, parses reply, updates ETA/notes | AI BOT (conversation; Voice) | N | Autopilot (text in Pro) | V2 |
| Broker & customer book | Brokerages, contacts (dedup), notes, payment/rate history, NOA/remit, DNU, FMCSA lookup | WORKFLOW | Y (2,759 brokerages, 2,633 contacts; duplicates) | Core | Launch |
| Broker import and merge | CSV import, auto-merge duplicate names/contacts | HYBRID (AI suggests merges, human approves) | N (61 dup names, 685 dup contacts) | Core import; Pro AI merge | V2 |
| Load-board links | Pre-filled DAT/Truckstop/123Loadboard searches from truck position/equipment | WORKFLOW | N | Core | Launch |
| Rate lookup (market rate hint) | Lane rate hint from own history (later vendor API) | WORKFLOW (own data) | N | Pro | V2 |
| Dispatcher/team analytics, truck goals | Leaderboards, per-truck target pro-rated by hire date | WORKFLOW | Y (Truck Goals $35k hard-coded) | Core (target configurable) | Launch |
| Columns/saved views | Per-user layouts/widths/filters | WORKFLOW | Y (24 users) | Core | Launch |
| Ask-your-company (dispatch scope) | Natural-language questions with drill-down | AI BOT (tool-using) | N | Pro (100/mo) / Autopilot | V2 |
| Smart search | "Atlanta loads for Coyote last month" -> filtered board | AI BOT (Fast; query parsing) | N | Core (300/mo) | V2 |
| Inbox triage (load-related mail/text) | Classify rate con / BOL / question / tender / invoice query -> route | AI BOT (Fast) | Partial (Inbox is another dept) | Pro | V2 |

### 4b. Fleet records
| Feature | What it does | W/A/H | In ANH? | Tier | Pri |
|---|---|---|---|---|---|
| Trucks CRUD + docs | Number, VIN, plate, ELD id, expiry dates, docs per type, status & reason, parked location, audit | WORKFLOW | Y (129 trucks, 1,136 asset files) | Core | Launch |
| Trailers CRUD + Excel import | Same + type/length, AI-mapped import with preview | HYBRID (AI column mapping) | Y / Unclear import | Core (manual map) / Pro (AI map) | Launch |
| Drivers records | Full profile, endorsements, pay rates, contacts, assignment history; banking masked and permissioned | WORKFLOW | Y (230 drivers) | Core | Launch |
| Assignments (team driver, shared trailer) | Co-driver, confirmations, history | WORKFLOW | Y | Core | Launch |
| Bulk status change | Role-gated, reason/location kept, audited | WORKFLOW | Partial (no role limit, data dropped) | Core | Launch |
| ELD mapping | Link ELD devices to trucks by VIN/number, sync preview | WORKFLOW | Y (Truck Mapping) | Core | Launch |
| Carriers / entities | MC/DOT entities, factoring, sender email | WORKFLOW | Y (3 carriers) | Core (1) / tier-gated | Launch |
| Expiry reminders | Registration/insurance/IFTA/license/medical -> push/SMS/email countdown | WORKFLOW | Partial (browser-only) | Core | Launch |
| Vendor-neutral import (CSV/PDF) | Upload truck/driver/broker lists | HYBRID | Partial | Pro | V2 |

### 4c. Driver app
| Feature | What it does | W/A/H | In ANH? | Tier | Pri |
|---|---|---|---|---|---|
| SMS-link login + activation | Text link -> profile, license/medical photos, e-sign, direct deposit | WORKFLOW | Partial (activation works, security holes; OTP orphaned) | Core | Launch |
| Today screen + next-action button | One tap per milestone with GPS stamp | WORKFLOW | Y (DriverLoadWorkflow) | Core | Launch |
| Offer / Accept / Decline | Offer push, accept in app, decline reason | WORKFLOW | N | Core | Launch |
| Address/ref unlock by status | Street/ref numbers revealed by status; rate shown/hidden by tenant switch | WORKFLOW | Y (address rules; rate visible to drivers) | Core | Launch |
| Navigate hand-off | Google/Apple Maps/Waze/truck-app deep links | WORKFLOW | Partial (Google only) | Core | Launch |
| Document scanner | Auto-crop, enhance, multi-page PDF, offline queue, classify | HYBRID (scan is on-device; AI classify) | Y (DocumentScanner) | Core | Launch |
| DVIR pre-/post-trip, 10 photos | See Flow E | WORKFLOW (+ AI inspector Pro) | Y pre-trip only (1,696 reports; 0 post-trip) | Core (workflow) / Pro (AI) | Launch |
| DVIR noon lock | Server-enforced, safe-when-parked, grace by dispatcher | WORKFLOW | Partial (client-only) | Core | Launch |
| DVIR defect -> ticket | Severity rules auto-create shop ticket / do-not-dispatch | WORKFLOW | N ("Repair Now" makes no ticket) | Core | Launch |
| DVIR redo request | Staff request, 30-min deadline, lock | WORKFLOW | Y (96 requests) | Core | Launch |
| Pay statements | Weekly statements with real loads, deductions, advances, PDF | WORKFLOW (Accounting owns math) | Partial (shows nothing since March; placeholder PDF) | Core | Launch |
| Documents + e-sign | CDL/medical/agreements, expiry badges, upload | WORKFLOW | Partial (profile edit/upload broken) | Core | Launch |
| Messages with routing | Per-load thread + Dispatch/Road/Shop/Accounting/HR channels; photos, voice notes, location share | WORKFLOW | Partial (3 of 5 channels misrouted; 1 msg/30 d) | Core | Launch |
| Push + SMS fallback | Working Web Push / native push; SMS when no token | WORKFLOW | Partial (push never delivered) | Core (SMS metered) | Launch |
| Breakdown/emergency | Report, photos, voice note, location, nearest shops, ticket | HYBRID (AI triage Pro) | Y (46 alerts, 0 tickets) | Core report; Pro triage | Launch |
| Driver co-pilot chat | "How much did I make this week?", "Where do I deliver?", HOS/policy Q&A | AI BOT (Fast) | Placeholder (disabled) | Pro (300 turns/mo) | V2 |
| Voice-note transcription | Driver dictates notes / check-call replies | AI BOT (speech-to-text) | N | Pro | V2 |
| Background GPS + wake lock | Foreground/background position, consent screen, battery rules | WORKFLOW | Partial (SW token expiry) | Core | Launch |
| Language (EN/ES) | Full Spanish UI | WORKFLOW | N | Core | V2 |
| Store apps | iOS/Android wrapper for push/camera/background location | n/a (packaging) | N (PWA) | Core | Launch (decision Q4) |
| Operator mode (/m) | Phone-first back office for O/Os | WORKFLOW | N | Core | Launch |
| View-as-driver | Staff read-only mirror of the real driver UI | WORKFLOW | Partial (0 sessions, not mirrored) | Core | V2 |
| Bonuses/contests | Timed programs with leaderboard | WORKFLOW | Partial (paused, 0 rows) | Pro | Later |

---

## 5. AI bots in this department
Model names are exactly from AI_Model_Comparison.md section 6. Costs use [V] prices from section 1 of that file. Token counts are [E] assumptions unless the comparison file gives them.

### B1. Rate-Con Reader (also runs inside B3 and Operator scan)
- **Trigger:** file arrives (upload, email, phone photo, forward).
- **Steps:** classify doc is a rate con -> OCR/vision extract to strict JSON schema -> validate (money sums vs document total, date order, MC format, required stops) -> confidence per field -> escalate failures -> match broker/contact -> produce draft + diff against any existing duplicate.
- **Reads:** file, tenant broker list, tenant stop-address book. **Writes:** draft load, document, extraction log (fields, confidence, model, cost).
- **Human gate:** Create click (Core/Pro). Autopilot: auto-create under owner rules (rate >= break-even + margin, known broker, confidence >= 0.95 on all money/date fields), still never accepts at the broker.
- **Autonomy default:** Core = Suggest (always human). Pro = Suggest. Autopilot = Auto-draft, Suggest-to-create until owner enables Auto-create per broker.
- **Model:** Balanced = Gemini 3.6 Flash; escalation Claude Sonnet 5.5.
- **Run size:** 6k in / 1k out (3-page RC) = $0.0083 [V]; escalation 12% of runs [E] x Sonnet 5.5 $0.022 [V] -> **$0.011 per run** (0.0083 + 0.12 x 0.022). Latency 2-6 s.
- **Saves:** ~6 min of typing per load = $2.20 vs $0.011. At ANH scale (293 loads) ~29 h/mo = ~$645/mo.

### B2. Document Reader (BOL, POD, lumper, scale ticket, receipt)
- **Trigger:** driver scan, email attachment, staff upload.
- **Steps:** classify type -> read key fields -> legibility/signature check -> match to load by ref#/consignee/driver's open loads -> attach as new version.
- **Reads:** image/PDF, load stops and refs. **Writes:** document row + fields, retake prompt to driver, status trigger via workflow.
- **Gate:** none for attach; retake prompt is advisory; billing-related use sits in Accounting.
- **Autonomy default:** Core Auto for attach/classify (low risk, reversible); all tiers.
- **Model:** Balanced = Gemini 3.6 Flash. **Run size:** ~3k in / 0.5k out = **$0.004** [E from 0.75/3.75 per M, [V]].
- **Saves:** 1.5 min filing/checking = $0.55; ANH 530 docs/mo -> ~13 h/mo = ~$290.

### B3. Inbox Load-Intake Agent (email/text -> draft loads)
- **Trigger:** new message to `loads@` or connected dispatch mailbox.
- **Steps:** triage (Fast): rate con / tender / BOL / question / spam -> route: rate con -> B1; BOL/POD -> B2; broker question -> thread on the load with a drafted reply (B5); tender needing a reply -> "Needs you" card.
- **Reads:** message + attachments, open loads by ref#. **Writes:** draft loads, doc attachments, tasks, thread messages.
- **Gate:** Pro: human approves every outbound reply; Autopilot: auto-replies only to templated status questions.
- **Autonomy default:** Pro Suggest; Autopilot Auto (file/route), Suggest (replies that quote money).
- **Model:** Fast = Gemini 3.1 Flash-Lite; ~500 in / 50 out = **$0.000075** per message [V: $0.075/1,000 msgs]; plus B1/B2/B5 cost when invoked.
- **Saves:** 1 min sorting per message; ANH-scale 25 msgs/load x 293 = 7,300 msgs -> ~120 h/mo if fully triaged; realistic 20% = 24 h = $530/mo [E].

### B4. Delay-Risk & ETA Narrator
- **Trigger:** workflow ETA engine finds projected arrival > appointment - tolerance, or HOS/hours shortfall, or truck stopped > N min off route.
- **Steps:** workflow calculates risk % and late-by; AI writes one-sentence cause ("I-40 closure near Memphis, +72 min; driver has 3.1 h HOS left - will need a 10 h break before delivery") and 2 suggested actions; offers B5 draft.
- **Reads:** position, route, traffic, HOS, appointment, load notes. **Writes:** alert + explanation + suggested action.
- **Gate:** alert only. **Autonomy default:** Pro Suggest; Autopilot Auto-notify broker within template rules.
- **Model:** Fast = Gemini 3.1 Flash-Lite ($0.25/$1.50 per M [V]); 1.5k in / 0.3k out = **$0.0008**.
- **Saves:** one avoided late-delivery penalty or re-delivery fee ($75-$250 [E]) per ~30 alerts acted on; ~3 min per alert triage.

### B5. Broker Update Drafter
- **Trigger:** exception (delay, breakdown, detention, appointment change) or broker inquiry.
- **Steps:** gather load context + tone guide -> draft email/text -> show diff vs template -> Send/Undo.
- **Gate:** Pro: human clicks Send. Autopilot: auto-sends for delay <= tolerance and templated cases; anything mentioning money/liability waits for human.
- **Model:** Balanced = Gemini 3.6 Flash; 1.5k in / 0.4k out = **$0.0026** [V job 3 table]. Escalate to Claude Sonnet 5.5 ($0.007) for disputes/complaints.
- **Saves:** 3 min per draft = $1.10 vs $0.003. Routine milestone updates are WORKFLOW templates (free).

### B6. Dispatch Planner
- **Trigger:** morning roll call, new unassigned load(s), truck becomes empty, driver/truck unavailable.
- **Steps:** gather unassigned loads, truck positions, HOS, windows, equipment, home-time rules -> LLM proposes assignments and relays -> deterministic validator checks HOS/equipment/time windows/DNU -> rank proposals with $ impact (deadhead saved, revenue/day) -> one-click **Accept plan**.
- **Reads:** loads, trucks, drivers, HOS, ETAs, broker standing. **Writes:** plan record, assignments (after approval).
- **Gate:** human approves in Pro; Autopilot may auto-assign inside owner rules (never overrides infeasible/DNU/below-break-even; stays within driver home-time).
- **Autonomy default:** Pro Suggest (cap 60); Autopilot Suggest on day 1, owner can flip to Auto for loads under X miles.
- **Model:** Smart = Claude Sonnet 5.5 (high effort), Opus 5.5 for hard multi-load plans. **Run size:** 15k in / 4k out = **$0.07** [V job 7].
- **Saves:** 15 min dispatcher planning per run ($5.50) plus deadhead: if 30% of 293 loads save 20 miles at $0.70/mi cost = ~$1,230/mo [E; unproven until measured].

### B7. Voice Check-Call Agent
- **Trigger:** check-call cadence (workflow) or driver unreachable by text; also after-hours "driver stopped" calls.
- **Steps:** place call (consent recorded) -> ask status/location/ETA/issues -> parse -> write ETA/notes -> if "problem" or no answer after 2 tries -> escalate to dispatcher with transcript; summary to load Activity.
- **Reads:** load, ETA, driver phone/consent. **Writes:** check-call record, notes, ETA, alerts.
- **Gate:** owner enables per driver group; STOP/consent + two-party recording rules; quiet hours; legal items need human.
- **Autonomy default:** Core/Pro: off; Autopilot: Suggest first 2 weeks (human listens to summaries), then Auto.
- **Model:** Voice = Vapi cascade (Deepgram STT + Claude Haiku 5.5 + ElevenLabs Flash TTS). **Run size:** 3-min call at ~$0.12/min all-in [E: Vapi $0.05 + STT ~$0.01 + LLM ~$0.01 + TTS ~$0.02 + telephony ~$0.014 [V ranges]] = **$0.36 per call**. Cost-saver Gemini Live ~$0.025/min [V] -> $0.075.
- **Saves:** human check call ~4 min = $1.47; ANH-scale 2 calls x 293 loads = 586 calls x $1.47 = $860/mo labor vs $211 voice cost.

### B8. DVIR Photo Inspector + Defect Triage
- **Trigger:** all 10 photos captured; defects marked at submit.
- **Steps:** per tile check subject/duplicate/legibility/visible damage -> advisory flags; for defects: summarize, pull repeat history, recommend action (Repair now / terminal / monitor), draft ticket text.
- **Reads:** photos, checklist, truck history, open tickets. **Writes:** advisory flags, defect summary, ticket draft (workflow creates the ticket by severity rule).
- **Gate:** photo check advisory only; ticket from AI draft is human-reviewed in Pro, auto in Autopilot for Major/Critical (workflow rules already create the ticket in Core).
- **Autonomy default:** Pro Suggest; Autopilot Auto.
- **Model:** Balanced = Gemini 3.6 Flash. Photo check ~12k in (10 downsized photos ~1.1k tokens each + prompt) / 0.6k out = **$0.011**; defect triage 4k in / 0.8k out = **$0.006** [V job 6 table].
- **Saves:** staff review 2 min per DVIR -> 187/mo = 6 h ($137/mo) and earlier catch of tire/brake issues (one avoided roadside call ~$450 [E]).

### B9. Breakdown Triage
- **Trigger:** driver taps Breakdown (text + photos + voice).
- **Steps:** calm triage message to driver, safety-first ("pull off, hazards on"), ask 2 questions, classify (drivable / tow / roadside), get ELD or phone position, find 5 nearby shops with phones, create ticket, notify dispatch and Roll call, draft broker delay (B5).
- **Gate:** no autonomous repair or tow purchase; always a human on the ticket; safety rule "unsafe to drive -> call tow".
- **Autonomy default:** Pro Suggest (ticket created by workflow on report); Autopilot Auto (triage chat + shop search + ticket + broker draft queued).
- **Model:** Balanced = Gemini 3.6 Flash; 4k in / 0.8k out = $0.006 [V] + Places lookup ~$0.032 [E: $32/1,000 requests] = **$0.038**.
- **Saves:** 8 min road-team time per event ($2.90) and faster tow ETA.

### B10. Ask-Your-Company (dispatch scope)
- **Trigger:** user question in chat bar.
- **Steps:** tool-calling with read-only tenant-scoped query tools -> answer with numbers + "show me" drill-down link.
- **Gate:** read-only; no writes. **Autonomy:** n/a (read only).
- **Model:** Smart = Claude Sonnet 5.5; 5 tool rounds ~40k cumulative in / 2k out = $0.10 uncached, ~**$0.04 cached** [V job 4]. Simple lookups routed to Fast (Haiku 5.5 $0.005).
- **Saves:** ~20 min spreadsheet pull ($7.30) per question.

### B11. Driver Co-pilot (driver app chat)
- **Trigger:** driver asks a question or uses voice.
- **Steps:** answers from the driver's own data (loads, pay, docs due, DVIR status) and tenant policy; deep links to screens; escalates "talk to dispatch" button.
- **Gate:** cannot change pay, loads, or status; cannot answer legal/medical HOS-violation questions beyond policy text.
- **Model:** Fast = Claude Haiku 5.5 (thinking off): ~6k in (half cached) / 0.4k out = ~$0.0005; budget **$0.001 per turn** incl. tool calls [E].
- **Saves:** 3 min of dispatch time per answered question.

### B12. Smart Search (Fast)
- NL query -> structured filter chips (never SQL shown). Gemini 3.1 Flash-Lite, 500 in / 100 out = **$0.0003** [E]. Saves ~30 s per complex search.

---

## 6. Tier matrix
Caps shown are the monthly maximum for a 25-truck reference fleet; for larger fleets caps scale linearly per active truck above 25 (so bills don't surprise). "Overage" = metered at unit cost x margin, shown in the usage meter.

| Feature / bot | Core | Pro | Autopilot |
|---|---|---|---|
| Load board, wizard, status workflow, docs, map, ETA, geofence, tracking link, check-call reminders | ✓ | ✓ | ✓ |
| Broker/customer book, fleet records, carriers, ELD mapping, expiry reminders | ✓ | ✓ | ✓ |
| Driver app (Today, scan, DVIR workflow + noon lock, pay, docs, messages, breakdown report, operator mode) | ✓ | ✓ | ✓ |
| Milestone broker updates (templates) + SMS/push | ✓ (200 SMS/mo bundle) | ✓ (1,000) | ✓ (3,000) |
| B1 Rate-Con Reader | limited 30/mo | 150/mo | 600/mo |
| B2 Document Reader (BOL/POD/receipt) | limited 60/mo | 600/mo | 2,400/mo |
| Smart search (B12) | limited 300/mo | 1,500/mo | 5,000/mo |
| Rate-con email inbox -> auto-draft (B3) | — | ✓ (counts in B1/B3 caps) | ✓ + auto-create under rules |
| Inbox triage (B3) messages | — | 3,000/mo | 15,000/mo |
| B4 Delay-risk narrator | — | 500/mo | 3,000/mo (auto-notify) |
| B5 Broker update drafter | — | 300/mo (approve) | 1,500/mo (auto in rules) |
| B8a DVIR photo inspector | — | 1,000/mo | 3,000/mo |
| B8b Defect triage + ticket draft | — (workflow ticket still works) | 150/mo | 600/mo (auto) |
| B9 Breakdown triage | — (report + manual ticket) | 60/mo | 300/mo |
| B10 Ask-your-company (dispatch) | — | 100/mo | 600/mo |
| B11 Driver co-pilot turns | — | 300/mo | 3,000/mo |
| Voice-note transcription (min) | — | 300 | 1,500 |
| B6 Dispatch Planner | — (ranking only) | 60 plans/mo, suggest | 800 plans/mo, auto within rules |
| B7 Voice check-call agent (min) | — | — (text check-calls drafts via B5) | 600 min/mo |
| Locked-preview upsell cards with $ | ✓ shown | ✓ shown (Autopilot items) | n/a |
| Autonomy switch per bot (Off/Suggest/Auto) | Off/Suggest | Off/Suggest | Off/Suggest/Auto |

Upsell placements (dollar-based, wording shown in locked state, numbers computed from the tenant's own data):
- Core, Load board: "14 loads this month needed 20+ min of typing. Pro reads rate cons from your inbox: about 4.6 hours saved." [illustrative]
- Core, Roll call: "6 trucks were late last week with no broker update sent. Autopilot would have notified brokers and logged detention starts." 
- Pro, Control tower: "Fleet OS found $412 of unbilled detention across 5 loads last month [illustrative] - turn on Autopilot to recover it."
- Pro, Planner card: "Planner would have saved 312 deadhead miles (~$218) last week."
- Usage meter bar at top of AI panels: "Rate cons 112/150 - Docs 340/600"; "What you'd get" compare drawer.

---

## 7. Cost to run at each tier's MAX caps (per 25-truck reference tenant, per month)
Unit-cost assumptions: Gemini 3.6 Flash $0.75 in / $3.75 out per M tokens [V]; Gemini 3.1 Flash-Lite $0.25/$1.50 [V]; Claude Sonnet 5.5 $2.00/$10.00, cached read $0.10 [V]; Claude Haiku 5.5 $0.10/$0.50 [V]; Vapi voice ~$0.12/min all-in [E]; Deepgram STT ~$0.0043/min [E]; Google Places Nearby ~$0.032/request [E]; Google routes/geocode ~$0.005/element [E]; Twilio SMS $0.0109/segment (incl. carrier fee) [E per research file]; email ~$0.0004 each [E]; storage ~$0.021/GB-month [E].

### 7a. AI cost at max caps
| AI feature | Cap Core / Pro / Autopilot | Unit cost | Monthly cost at cap Core / Pro / Autopilot |
|---|---|---|---|
| 1 Rate-con read | 30 / 150 / 600 | $0.011 [E, 12% escalation] | $0.33 / $1.65 / $6.60 |
| 2 BOL/POD/receipt read | 60 / 600 / 2,400 | $0.004 [E] | $0.24 / $2.40 / $9.60 |
| 3 Smart search | 300 / 1,500 / 5,000 | $0.0003 [E] | $0.09 / $0.45 / $1.50 |
| 4 DVIR photo inspection | 0 / 1,000 / 3,000 | $0.011 [E] | $0 / $11.00 / $33.00 |
| 5 DVIR defect triage | 0 / 150 / 600 | $0.006 [V job 6] | $0 / $0.90 / $3.60 |
| 6 Delay-risk narrator | 0 / 500 / 3,000 | $0.0008 [E] | $0 / $0.40 / $2.40 |
| 7 Broker update drafter | 0 / 300 / 1,500 | $0.0026 [V job 3] | $0 / $0.78 / $3.90 |
| 8 Inbox triage (msgs) | 0 / 3,000 / 15,000 | $0.000075 [V job 2] | $0 / $0.23 / $1.13 |
| 9 Ask-your-company | 0 / 100 / 600 | $0.04 [V job 4, cached] | $0 / $4.00 / $24.00 |
| 10 Driver co-pilot turns | 0 / 300 / 3,000 | $0.001 [E] | $0 / $0.30 / $3.00 |
| 11 Dispatch planner | 0 / 60 / 800 | $0.07 [V job 7] | $0 / $4.20 / $56.00 |
| 12 Voice check-call minutes | 0 / 0 / 600 | $0.12/min [E] | $0 / $0 / $72.00 |
| 13 Breakdown triage | 0 / 60 / 300 | $0.038 [E] | $0 / $2.28 / $11.40 |
| 14 Voice-note transcription (min) | 0 / 300 / 1,500 | $0.0043/min [E] | $0 / $1.29 / $6.45 |
| **AI subtotal** | | | **$0.66 / $29.88 / $234.58** |

### 7b. Non-AI variable cost this department drives (same reference tenant, 400 loads/mo)
| Item | Core | Pro | Autopilot | Assumption |
|---|---|---|---|---|
| SMS at cap (200 / 1,000 / 3,000) | $2.18 | $10.90 | $32.70 | $0.0109 per segment [E] |
| Maps/routing/geocode | $12.00 | $12.00 | $12.00 | ~6 calls/load x $0.005 x 400 loads [E] |
| Email (2,000 / 5,000 / 10,000) | $0.80 | $2.00 | $4.00 | $0.0004 each [E] |
| Storage (docs + DVIR photos, 12-mo steady state) | $0.75 | $3.20 | $6.00 | DVIR ~4 MB x 550 / 1,000 / 3,000 per mo; load docs 0.5 MB x 4 x 400; $0.021/GB-mo [E] |
| Phone GPS database writes | <$1 | <$1 | <$1 | 1 ping/min on duty, ~100 B each [E] |
| Web/native push | $0 | $0 | $0 | FCM/APNs free |
| ELD API calls (vendor pass-through, billed separately by Tracking module) | n/a | n/a | n/a | ~$2-4/truck/mo vendor [E] - not counted |
| **Non-AI subtotal** | **$15.73** | **$28.10** | **$54.70** | |

### 7c. Totals at max caps
| | Core | Pro | Autopilot |
|---|---|---|---|
| AI | $0.66 | $29.88 | $234.58 |
| Non-AI | $15.73 | $28.10 | $54.70 |
| **Total** | **$16.39** | **$57.98** | **$289.28** |
Reading: at max caps in a 25-truck fleet the dispatch+driver department costs ~$0.04 / $0.14 / $0.72 per load (400 loads). Real usage is typically 30-50% of caps, so expected cost is about $6 / $22 / $110. AI_Model_Comparison's all-in LLM estimate for a 20-truck fleet is ~$145/mo (about $0.36 per load); this table is higher in Autopilot because it assumes 600 voice minutes and 800 planner runs maxed. Voice is 31% of the Autopilot AI cost: switching to Gemini Live ($0.025/min) drops that line to $15.

---

## 8. Parity checklist (current ANH -> new design)
"Fixed by design" = ANH bug list item not carried over.

### 8a. Dispatch (inventory/dispatch.md)
| ANH feature (usage) | Where it lives in the new design |
|---|---|
| Load Board with 7 period filters, KPIs, trends vs week/month | `/dispatch/loads` + Tower KPI strip; server-paginated (fixes pagination never used, Clear All reset mismatch, Canceled KPI always 0) |
| Universal search by load/order/truck/driver/broker | Load board search over all id types (fixes order#/truck# hidden results) + Smart search (AI) |
| Filter chips (status, team, driver, truck, broker, dispatcher, docs, assignment, date ranges) | Same filters; broker filter uses brokerage entity (fixes always-0 broker filter, broker sort blank) |
| My Loads Only switch; per-user columns/order/widths (24 users) | Saved views per user (columns, filters, sort, My loads) |
| 36 columns incl. driver GPS and delay-risk badge | Column picker keeps all; live location and risk chips included |
| Truck Goals ($35k/truck/mo prorated by hire date) | Dispatch analytics -> Truck goals with configurable target (no hard-code) |
| Bulk Change Status (leaders) | Bulk bar, role-gated; Cancel/TONU capture enforced in bulk too |
| Load Details tabs Overview/Profit/Delays/Docs/Notes/Driver/Broker | Load detail tabs Overview, Stops, Docs, Money, Track, Comms, Activity, Notes & Tasks |
| Status transitions with role rules and prerequisites (BOL before In Transit, RC+BOL+POD before Ready to Factor), rollback for management | Status workflow in settings; same prerequisites; rollbacks audited; accounting-stage statuses hidden from default board view |
| Cancel dialog (reason lists, TONU amount) -> Collected at $0 | Cancel/TONU dialog on every path; TONU sets revenue; auto-close rule preserved |
| Delay Risk prediction + analyze-delay (1 load ever) | B4 narrator + delay-risk alerts; "analyze delay" becomes the post-delivery delay reason on Activity |
| Docs: upload/replace/view/delete, signed URL, 10 MB, RC/BOL/POD/Lumper/Receipt/Other | Docs tab with versions (fixes second lumper overwrite), many receipts, scale tickets, executive-only delete |
| Confirm & Send to Accounting | "Ready to invoice" handoff to Accounting dept queue |
| Notes (17), Follow-ups (0 rows) | Notes & Tasks with due dates/@mentions; check-call tasks |
| Edit Load (route, financials, cargo, assignments, refs) incl. recalc miles | Edit drawer; miles recalc on address change; Load ID not editable; team list from settings (fixes missing Catchers); trailer list all Active/Available |
| Recovery driver segments (4 ever) | Segments in Edit drawer (kept) |
| New Load wizard: RC upload AI, drafts (409), load # reserve, duplicate order# guard | Flow A + `/dispatch/new` + drafts in All loads views |
| Stops with Google Places autocomplete, FCFS/appointment, timezone | Same; per-stop edit afterwards |
| Truck selection filters (Active, activated driver, no Critical ticket) + auto-fill driver and trailer | Flow B filters + Critical DVIR/ticket block |
| Feasibility check + manager override (657 requests) | Flow B + `/dispatch/overrides` |
| Auto miles, deadhead, route cost, full profitability breakdown, factoring settings, driver-pay estimate | Money tab + wizard Check step; cost profile from Accounting |
| Broker/Carrier tab: search, create, contact required, cancellation history | Broker select with standing card; one contact per email (fixes 685 duplicates) |
| Driver Map: app GPS + ELD, markers, trail 24 h, refresh, status colors | `/dispatch/map`; stale thresholds match labels (fixes label mismatch) |
| Driver Planner (closest drivers) | Best-truck ranking in Assign + Dispatch Planner |
| Analytics tab (KPI cards, leaderboards, charts, CSV/PDF) | Dispatch analytics + Command Cockpit drill-down |
| Trucks: KPIs, filters, Export VINs, Add Truck wizard w/ 9 doc types, bulk status, profile tabs, assign/unassign, new driver inline, detect-from-ELD parked location, tickets | `/fleet/trucks` (all kept; bulk status role-gated; reasons/location saved) |
| Trailers: KPIs, Excel import, Add, filters, bulk, profile, docs | `/fleet/trailers` (fixes expiring-soon false flag, empty truckId ticket bug) |
| Drivers: Add wizard, KPI cards, Pending Activation, assign truck/trailer/co-driver, bulk, profile tabs, Quick Pay/QuickBooks sync | `/fleet/drivers`; Quick Pay and QuickBooks live in Accounting; banking tab permission-based (no hard-coded email) |
| Brokers tab: Brokerages, Contacts, add/edit, FMCSA MC lookup, notifications on/off, capacity email flag | `/book/brokers`, `/book/contacts`; broker "Loads" counts fixed |
| Notification History & Templates (per carrier, 5 types, toggles, greeting, brand color, preview) | Settings -> Broker updates (templates per carrier with preview); history on Comms/Activity |
| Broker unsubscribe page `/broker-unsubscribe` | Kept (footer unsubscribe + preference per contact) |
| Truck Mapping (Optima sync, add device, link/unlink) | `/fleet/eld` |
| Carriers: CRUD, factoring fields, Gmail connect (dispatch/accounting), test connection | `/fleet/carriers`; bank fields masked/vaulted; mailbox connections in Integrations |
| Auto-dispatch on create, status-by-assignment triggers, doc-driven status transitions, cancelled -> collected, completed -> ready to factor | Workflow rules (no duplicate triggers); every auto change logged with source |
| Fleet alerts (route deviation, low fuel, parked truck, maintenance emergency) | Tower alerts (workflow rules, configurable) |
| Daily capacity emails (1 enabled) | Dropped as default; kept as optional scheduled broker email (V2) - very low use |
| Hard-coded Alvys legacy fields/sync | Dropped: legacy import tool only (one-time migration) |

### 8b. Driver app (inventory/driver_app.md and DVIR part of shop_road.md)
| ANH feature (usage) | Where it lives |
|---|---|
| Email+password login, forgot/reset | `/d/login` SMS link + email/password fallback + reset |
| Signup 8-step wizard, recruiting-token prefill, e-sign certificate, progress tracking | Recruiting/Onboarding dept; driver app receives activated driver (activation `/d/activate`); duplicate checks done server-side (fixes always-pass) |
| Activate by email/phone lookup | SMS invite link with signed token (fixes P0 account-takeover and enumeration) |
| Driver QR page | Kept as QR in Settings / printable onboarding card |
| Location gate, banner, live tracking, history (34,707 rows), background sync, wake lock | Consent screen + same tracking; token refresh handled; native wrapper for background reliability |
| DVIR gate: noon lock, redo with 30-min deadline, lock at attempt 2 | Flow E (server-enforced; safe-when-parked) |
| Trips tab (Active/In Transit/Delivered, pull to refresh, realtime, Delayed/Reconciliation visible) | `/d/loads` (fixes hidden statuses) |
| Driver pay computed from rates; address and reference privacy by status | Kept; rate visibility per tenant switch (see Q2) |
| Load workflow sheet: En Route, Arrived (GPS-gated), Scan BOL, Upload PDF, Lumper, Arrived Delivery, Scan POD, Next Assigned Load, Navigate | Flow C/D; arrival by geofence + manual; Upload PDF kept; Next Load button kept |
| Broker emails with BOL/POD attachments from driver actions (0 ever logged) | Broker-update workflow (fixed by design) |
| DocumentScanner (multi-page PDF, OpenCV enhance) | `/d/scan` |
| DVIR form 4 steps, 10 photos rapid mode, AI check, Mark All OK, severity, persistence 4 h, history | Flow E + history screen (photos shown in detail) |
| DVIR AI defect analysis (421), Staff review, redo, defect actions | B8 + Safety/Shop review screens (other dept blueprints) |
| Messages (Dispatch, Maintenance chat; AI disabled) | `/d/messages` with correct routing; co-pilot replaces disabled AI |
| Maintenance emergency (text, chips, photo, voice, AI triage, ticket, 5 shops) | `/d/breakdown` + B9; chat attachments in private bucket |
| Notifications bell + realtime (4,175 rows) | Inbox with deep links to the load; push actually delivered |
| Profile: pay statements, personal info edit, license/medical upload | `/d/pay`, `/d/profile`, `/d/docs` (edit and upload fixed; statements show real data) |
| Settings: theme, location switch, push, tutorial, sign out | `/d/profile` settings; refreshed tutorial |
| View as Driver (0 sessions) | Staff "Preview as driver" (V2), mirrors real UI |
| Bonuses tab (paused, 0 rows) | Pro/V2 timed programs (Later) |
| Orphans: send-otp, driver-ai-assistant, group-ai, bonus cron | Dropped: replaced by SMS-link auth, co-pilot, new programs |
| Maintenance DVIR post-trip (0 rows, UI missing) | Post-trip DVIR added (Launch) |

---

## 9. NEW features beyond ANH (better than Alvys-class)
1. **Roll call that writes the updates**: per truck ETA vs appointment with an auto-drafted broker note; dispatcher reviews exceptions only (Alvys-class TMSs list loads, they do not draft).
2. **Rate-con inbox with PDF-beside-fields and per-field confidence** plus verbal-rate and break-even check at the moment of booking.
3. **Operator mode**: a full back office on the phone (scan -> book -> run -> invoice) and one-click upgrade to fleet mode with no data migration.
4. **Server-enforced, safety-aware DVIR lock** with dispatcher grace, immutable versions, defect-to-ticket and do-not-dispatch automation, and post-trip DVIR.
5. **Detention clock with evidence pack** from geofence timestamps handed to the Autopilot money-recovery bot.
6. **Public tracking link** for brokers (no login) cutting inbound "where's my truck" calls.
7. **AI check calls (text and voice)** that update ETA and escalate with transcript.
8. **Dispatch Planner** with deterministic constraint validator and dollar impact per proposal.
9. **Broker book intelligence**: payment speed, cancel rate, rate history by lane, do-not-use, duplicate merge.
10. **Offline-first driver app**: scans, DVIR and status taps queue and sync; Spanish UI; SMS fallback when push is off.
11. **Autonomy dashboard**: per-bot Off/Suggest/Auto, 15-minute Undo window on auto actions, weekly "what the bots did for you" digest with hours and dollars saved.
12. **Load-board deep links** (DAT/Truckstop/123Loadboard) pre-filled from the truck's position and equipment.

---

## 10. Open questions for Abdel
1. **DVIR lock policy:** hard lock (blocks all load actions until DVIR) as the default for every tenant, or advisory in Core and hard lock opt-in? I assumed hard lock with safe-when-parked rule and a dispatcher grace button.
2. **Driver visibility of broker rate:** ANH shows the broker rate to drivers. Default hide for company drivers, show for owner-operators and leased O/Os?
3. **Tracking sources at launch:** phone GPS only plus which ELD vendors first (Optima/Hive for ANH, Samsara, Motive)? And is ELD cost a pass-through line in the Tracking module?
4. **Driver app packaging:** ship PWA first (iOS push requires "Add to Home Screen") or store wrapper at launch for reliable push and background location?
5. **Autopilot limits:** may Autopilot auto-create loads from known brokers and auto-assign without a human click (with 15-min Undo), and is AI voice calling to drivers acceptable under your consent/recording policy? Spec said "always review" for booking; I assumed Autopilot may auto-create but never auto-accept a tender.
