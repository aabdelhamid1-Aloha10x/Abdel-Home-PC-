# Command Center, Communications & Platform — blueprint

Scope: (1) Command Center & Analytics for owner/managers, (2) Communications (shared inbox, texts, notifications), (3) Platform (roles, settings, company profile, integrations hub, billing/usage, plan comparison, AI gateway, bot control center). Sales/investor module is OUT of the product (see parity, section 8).
Name "Fleet OS" is a placeholder. Tiers: Core / Pro / Autopilot. Model tiers per AI_Model_Comparison.md section 6: Fast = Gemini 3.1 Flash-Lite; Balanced = Gemini 3.6 Flash; Smart = Claude Sonnet 5.5 (high effort); Voice = Vapi/Retell cascade or Gemini Live. Cost tags: [V] = from vendor prices in AI_Model_Comparison.md, token counts are assumptions; [E] = my estimate.
Time valuation used for savings: owner/manager $30/h, dispatcher/back-office $22/h [E].
ANH scale used for examples: ~23 trucks, ~295 loads/month (TMS_Product_and_Pricing_v2.md), ~25 messages per load = ~7,400 messages/month (AI_Model_Comparison.md section 7 assumption).

---
## 1. Who uses it and what a day looks like
- **Owner / executive** (1 at ANH): 6:30am phone, reads the Morning Brief (5 lines + 3 decisions), taps one decision to assign it, asks "which broker should I drop?" in chat, glances at the Fleet Wall. Weekly: Monday brief, Friday profit review by truck and lane. Only person who touches billing, bank changes, bot autonomy "Auto", kill switch.
- **Manager / department leader** (ANH: management 3, *_leader 11): live roll call on the desk screen, department scorecard, goal progress, team ranking, approvals queue (load overrides, driver approvals), assigns inbox threads.
- **Dispatcher / accounting / safety / recruiter** (ANH: dispatch 11, accounting 3, ...): lives in the shared inbox and notification bell; sees only their department's data and their own team queue; gets AI triage chips and a drafted reply to approve.
- **Driver / owner-operator**: receives texts and push; replies by text; never sees the inbox. Owner-operator is Owner + Driver in one login (role switcher).
- **IT / admin** (rare): connects integrations, watches the health board, invites users, sets roles.

---
## 2. Screen map
Phone = P, Desktop = D. Routes are logical names.

### 2A. Command Center
| Screen | Route | Purpose | P / D |
|---|---|---|---|
| Command Cockpit (home) | /home | Company pulse 0-100, freight-to-cash pipeline, fleet wall, decisions waiting, autopilot ledger, Ask box, money-found card | P compact / D full |
| Morning Brief | /brief | Today's 5-line brief + 3 decisions, history, delivery settings (app, email, SMS, voice), time, recipients | P primary |
| Live Roll Call (owner view) | /rollcall | Every moving truck: live position, miles left, ETA vs appointment, status colour; exceptions first (late, parked, no GPS, compliance/maintenance holds). Dispatch owns the working version; this is read + escalate | D + P |
| Profit Lens | /profit | One screen, dimension switch: Load / Truck / Driver / Lane / Customer (broker) / Dispatcher / Carrier entity. Period, filters, columns, sparkline per row, vs fleet average, vs benchmark | D (P list view) |
| Load P&L | /profit/load/:id | Waterfall: rate + accessorials - driver pay - fuel - tolls - maintenance - allocated fixed - factoring fee = profit and profit/mile; every figure clickable | P + D |
| Trends & Forecast | /trends | Revenue/cost/profit by week/month/year vs prior period / last year; 7/30-day revenue and cash forecast | D |
| Department Scorecards | /scorecards | Dispatch, Accounting, Maintenance, Safety, Recruiting: 4 KPIs each, status On track / Watch / Act now, goals | D + P |
| Goals | /goals | Targets per KPI/department/team; progress computed automatically from the metric engine (ANH goals never updated) | D |
| What-if | /whatif | Sliders: rate, diesel, driver pay, miles, deadhead; profit and break-even move live | D |
| Benchmarks | /benchmarks | Own cost per mile by line vs industry (ATRI 2026 figures in Department_Feature_Spec) | D |
| Ask Your Company | /ask | Chat with tool-use, answers with numbers, tables and charts, "pin to dashboard", "email me this weekly" | P + D |
| Dashboards | /dashboards, /dashboards/:id | User-built widget grid (KPI tile, chart, table, leaderboard, map, alert list); shared by role; TV mode | D (P view-only) |
| Report Library | /reports | Reports by department (fixed, trusted templates) + My reports + Shared | D |
| Report Builder | /reports/new | Source, fields, filters, group by, chart type, totals, save, export CSV/XLSX/PDF, schedule, read-only share link (bank masked) | D |
| Scheduled Reports | /reports/schedules | List, next run, recipients, last delivery status, pause | D |
| Alerts & Rules | /alerts | Active alerts (ack/snooze/assign), rule list (built-in + custom), channels, quiet hours | P + D |
| Decision Log | /decisions | Record big decisions, owner, expected effect, review date, "did it pay off?" | D |
| Metric Definitions | /metrics | The one versioned definition per metric (profit/mile, cost/mile, on-time, days-to-get-paid), who changed it, effective date | D (read), Owner edit |
| Fuel price | inside /trends | EIA diesel by region (daily job fixed) | D |

### 2B. Communications
| Screen | Route | Purpose | P / D |
|---|---|---|---|
| Shared Inbox | /inbox | Unified list for email + texts + in-app threads; tabs Mine / Unassigned / Team / Mentions / Waiting / Closed; filters by mailbox, label, linked load/broker/driver, AI category | D full / P triage |
| Thread view | /inbox/:id | Messages, internal notes (yellow, never sent), assignee, status, linked objects, AI chips (category, priority, entity match, suggested action), AI draft panel, send via outbound queue | D + P |
| Compose | modal | New email or text; templates; attachments; send-as mailbox; schedule send; Undo | D + P |
| Texts | /texts | Two-way SMS with drivers, brokers, candidates; opt-in/STOP state per number, quiet hours banner, templates, broadcast to group (e.g., "all drivers on I-80") | D + P |
| Mailboxes | /inbox/settings/mailboxes | Connected mailboxes, per-role access (server-enforced), signature, send-as, health | D |
| Rules & Templates | /inbox/settings/rules | Auto-label/assign rules, canned replies, auto-reply hours, spam/ignore list | D |
| Notification Center (bell) | /notifications | All alerts and approvals in one list: fleet alerts, load overrides, driver approvals, bot suggestions, integration problems; ack, snooze | P + D |
| Notification Preferences | /settings/notifications | Per user: per event type per channel (push / SMS / email / in-app), digest, quiet hours (saved on server; ANH switches were not saved) | P + D |
| Notification Rules (admin) | /settings/notification-rules | Defaults per role/department, escalation (if unacknowledged 15 min, text the leader) | D |
| Object threads (load room) | embedded in load / truck / ticket / driver | Shared component from dispatch/driver app; appears in inbox when mentioned | P + D |

### 2C. Platform
| Screen | Route | Purpose | P / D |
|---|---|---|---|
| Users | /settings/users | Invite, role, team/group, status, last login, deactivate (persisted), re-send invite, reset password, sessions, 2FA status | D |
| Roles & Permissions | /settings/roles | Role cards, permission matrix by department and sensitive flags, custom roles, "view as role" | D |
| Teams / Org chart | /settings/teams | Groups (replaces hard-coded dispatch teams Hunters/Hawks/...), leaders, org chart | D |
| Company Profile | /settings/company | Legal name, DBA, MC/DOT, address, logo, time zone, units, week start, contact numbers; per-carrier tab (tier-gated) | D |
| Company Settings | /settings/company/rules | Thresholds (break-even margin, detention free time, late-minutes), numbering, templates (invoice/email/SMS), quiet hours, approval limits | D |
| Integrations Hub | /integrations | Catalog cards: Connect / Connected; filters by category; Off/Test/Live per connection | D |
| Integration detail | /integrations/:id | Auth, mappings, data it reads/writes, mode switch, test button, logs, replay | D |
| Health Board | /integrations/health | One page: every connection, scheduler job, webhook, queue; green/amber/red, last success, lag, errors, "fix" button | D + P (alerts) |
| Webhook & API | /integrations/webhooks | Inbound hook URLs (one gateway), outbound webhooks, API keys, delivery log with replay | D |
| Outbound Queue | /integrations/queue | Everything waiting to leave: email, SMS, push, API, packets; filter by mode; cancel / send now / approve | D |
| Billing & Usage | /billing | Plan, usage meters, invoices, payment method, overage rules, spend alerts | D (P view) |
| Compare Plans | /plans | Three columns, locked-feature previews with the tenant's own dollars, "what you'd get" | P + D |
| Bot Control Center | /bots | Table of all bots; autonomy switch; mode; kill switch; cost meter | D + P (kill switch on phone) |
| Bot detail | /bots/:id | Rules, guardrails, run log with inputs/outputs, test run, acceptance rate, cost | D |
| Audit Log | /audit | Who/what/why for users AND bots; filter, export CSV | D |
| Data Export & Import | /settings/data | Full tenant export; AI-assisted import with preview/undo | D |
| Security | /settings/security | 2FA policy, sessions, IP allow-list (Later), secrets vault status, bank-change second approval | D |

---
## 3. Click-through flows

### Flow 1 — Owner opens the Morning Brief (the 10-second answer)
1. 6:30 the brief job fires (WORKFLOW cron per tenant time zone; if tenant mode is Test it sends only to the owner) → 2. System runs the metrics engine (SQL, no AI): yesterday and week-to-date revenue, profit, profit/mile, loads delivered, not-yet-invoiced $, AR over terms $, trucks idle >12h, expiring docs, open breakdowns, bots' ledger (hours saved), top 3 decisions ranked by dollars at stake.
3. Brief Writer bot (Balanced) receives ONLY that JSON and writes 5 lines; a validator checks that every number in the text exists in the JSON (else retry once, then escalate to Smart, then fall back to the plain template version) → 4. Brief saved to /brief history and pushed to phone ("Profit up 6%. $8,420 delivered not invoiced. 2 decisions.").
5. Owner taps push → Brief page opens: 5 lines, each number tappable (opens drill-down of the loads/bills behind it); 3 decision cards with money at stake.
6. Owner taps "Assign" on "Invoice 9 delivered loads ($8,420)" → picker of department/person → System creates a task for accounting with due time, a notification, and an inbox/bell item; card moves to "Delegated" and the Decision Log tracks completion.
7. Owner taps "Snooze" on a card → card hidden until chosen date; "Dismiss" requires a reason chip (feeds rule tuning).
8. Core tenants: same page, template text without the AI paragraph (still the same numbers). Pro: Monday brief only. Autopilot: daily + proactive alerts + optional voice read-out (V2).

### Flow 2 — "Ask your company" with a chart, pinned and scheduled
1. Owner types "Which broker should I drop? Last 90 days" in /ask → 2. System checks entitlement and remaining cap (Pro 150 / Autopilot 1,000 per month), shows "148 left".
3. Router (Haiku 5.5, thinking off) classifies: simple lookup vs multi-step analysis. Simple → one parameterised query via the semantic layer (tools such as get_profit_by_dimension, get_ar_aging, get_lane_stats; NO free-form SQL against raw tables). Complex → Smart model (Sonnet 5.5) plans up to 5 tool calls.
4. Every tool call runs with a read-only role scoped to the tenant (and carrier entity and the user's permission: a dispatcher cannot ask for driver pay or company profit if the role lacks those flags; the tool simply returns "not permitted").
5. Model returns a structured answer: summary sentence, table, chart spec (bar/line, validated against a schema), "basis" line (period, filters, metric definition version), confidence chip. The UI draws the chart itself (the model never emits HTML).
6. Owner sees: "Drop or re-price 3 brokers: Northline -$0.31/mi, 52 days to pay..." with a bar chart. Each bar tappable → loads behind it.
7. Owner taps "Pin" → widget added to a chosen dashboard (stores the question spec, not a snapshot, so it refreshes at zero AI cost: the widget runs the saved tool calls via WORKFLOW).
8. Owner taps "Email me this every Monday" → Scheduled Report created (WORKFLOW), delivers PDF/CSV; one optional AI summary line.
9. Owner taps thumbs-down → saved with the question to the regression set; no autonomous action ever comes from chat (read-only; any "do it" button opens the normal approval flow of the owning department).

### Flow 3 — Connect an integration (three styles) and go Test → Live
1. Admin opens /integrations, taps a card. Card type decides the screen:
   a. **Connect (OAuth)** — Gmail/Outlook, QuickBooks, Motive/Samsara, Google Calendar. Tap "Connect Gmail" → popup to Google consent → callback verifies state + tenant, stores encrypted refresh token per tenant per mailbox (not per global app) → Hub shows the mailboxes found and asks "who can read this mailbox" (roles/teams; enforced server-side).
   b. **Paste API key + Test** — EFS/WEX/Comdata, factoring portals with API, DAT/Truckstop (when available), Telegram. Admin pastes key; "Test connection" calls a cheap read endpoint, shows green check with what was found ("14 cards, 3 trucks") or the exact error text; key stored in the secrets vault, masked after save.
   c. **Built-in provided** — Maps, SMS numbers, voice, e-sign, email sending, AI, storage: no setup, shown as "Included, metered"; one toggle to turn each on.
2. System creates the connection in mode **Off**. Admin sets mode:
   - **Off**: nothing reads or writes.
   - **Test**: adapter READS real data into a sandbox view and maps it to the common data format; all WRITES and sends go to the Outbound Queue marked TEST (visible in the queue as "would have sent", delivered only to the admin's own email/phone, or to nowhere). Mapping preview table shows vendor field → common field with sample rows; admin can fix mappings.
   - **Live**: reads feed production tables; writes/sends are real (still passing approval gates and quiet hours).
3. Admin taps "Go Live" → System runs a readiness check (token valid, mapping complete, last test < 24h green, owner approval needed if integration can send money-related messages) → switches mode, writes an audit row (who, from, to, why note).
4. Inbound data arrives through the single **Webhook Gateway** (one URL pattern per tenant/provider; signature verified per provider; replay window; idempotency key; raw payload kept 30 days; ack in <1s; processing async; failures to dead-letter with Replay button).
5. Health Board shows the connection: green (last success 3 min ago), amber (lag > 2x normal), red (token expired / 3 consecutive failures). Red triggers a bell notification to admins + "Reconnect" button; the same job that silently failed in ANH for 6 weeks (stale Gmail tokens, QuickBooks disconnected since May) now alerts on day 1.

### Flow 4 — Shared inbox: triage, assign, AI draft, approve, send
1. Email arrives via the mailbox connection (push/watch + poll fallback) → 2. System stores the message, threads it by RFC Message-ID/In-Reply-To (fixes ANH threading bug), de-duplicates, applies rule-based labels/assignment first (WORKFLOW: sender is a known broker on an active load → assign to that load's dispatcher; subject has "rate confirmation" and PDF → send to the Rate-con intake of Dispatch; "remittance" → Accounting).
3. Pro/Autopilot: Triage bot (Fast) adds chips: category (rate-con, POD request, payment question, claim, driver, spam, other), priority (money or late-load words), matched entities (load #, broker, driver), suggested action. Confidence < 0.7 → chip shows "?" and goes to Unassigned.
4. Dispatcher opens thread; taps **Assign** (self/person/team) → thread leaves Unassigned; assignee notified; assignment logged. Types an **Internal note** ("@Samar broker says detention approved by phone") → saved with note type, shown yellow, can never be sent, notifies mentioned user.
5. Taps **Draft reply** (Pro: Suggest; Autopilot: may auto-send only whitelisted categories) → Drafter (Smart) receives thread, load facts (statuses, ETA, docs attached), tone guide, template; returns a draft plus "what I used" list (load 4411, POD attached). Anything mentioning money, rates or legal terms is flagged "needs human" and cannot auto-send.
6. User edits and taps **Send** → message enters the Outbound Queue: checks mode (Test/Live), quiet hours (n/a for email), approval rule, then holds **30 seconds with Undo** → sends through the mailbox the thread belongs to (not a hard-coded "primary" mailbox) → status "Sent", copy stored in thread, audit row.
7. Attachments from the email (POD, rate con) show "Attach to load 4411" suggestion; one tap files them to the load (WORKFLOW).
8. Auto-reply case (Autopilot, only if owner enabled category "POD received acknowledgement"): bot sends with the same queue and undo-less (undo only on manual sends); every auto-send listed in Bot audit with the confidence score.

### Flow 5 — Bot Control Center: Suggest → Auto, and the kill switch
1. Owner opens /bots → table of every bot: name, department, tier required, mode (Off/Test/Live), autonomy (Off/Suggest/Auto), runs 30d, pending approvals, acceptance rate (approved without edits), cost 30d vs cap, last error.
2. Owner opens "Short-pay dispute bot" (Autopilot) → card shows: "Suggested 22 drafts, you approved 21 unchanged (95%), recovered $1,880." System offers: "Switch to Auto for disputes under $250?" 
3. Owner moves autonomy switch to **Auto** → modal forces guardrails: max $ per action, allowed recipients (brokers on file only), quiet hours, confidence floor (default 0.9), daily action cap, "notify me" channel → Owner confirms with password/2FA (autonomy Auto is owner-only) → System writes audit row + shows a 7-day "Auto trial" banner with daily digest.
4. A run happens: trigger → inputs snapshot → model + version → output → validator result → confidence → guardrail check → action (via Outbound Queue) → ledger (+$ recovered). All stored; any run opens as a readable "why" page.
5. Something looks wrong → Owner taps **Kill switch** (top bar, always visible; scopes: this bot / this department / ALL bots). System: sets flag in config read by the AI gateway and the Outbound Queue (takes effect in <5 s), cancels queued-but-unsent bot items (moved to "Held" not deleted), stops in-flight voice calls at the next turn, flips affected bots to Suggest or Off per scope, notifies admins, writes audit row. Resume requires owner tap + reason.
6. Tenant-level and department-level mode (Off/Test/Live) sit above the bot switches: Test = bot runs, produces output and cost, but nothing leaves the building; used for the first week after turning on any department.

### Flow 6 — Locked-feature preview with dollars and upgrade
1. A Core tenant sees on Cockpit a card: "Fleet OS found **$412** of detention you may not have billed last month (7 loads). Autopilot would bill it for you." (example figure; real number is computed per tenant).
2. How the number exists: Money-Found detectors run in **shadow mode** on every tenant (WORKFLOW, no AI cost): detention (dwell time from geofence/timestamps beyond free time vs billed accessorials), short-pays (remittance < invoice), unbilled delivered loads, AR past terms, fuel outside route, unused discounts. Each shows basis and list of loads; user can open the list on any tier (the list is free; the automated action is locked).
3. Tap "See what you'd get" → /plans opens scrolled to the row, showing: the tenant's own last-30-day number, assumed recovery rate (shown, e.g., 60% [E]), Autopilot price, "net +$X per month if repeated".
4. Tap "Try Autopilot free for 14 days" (or "Upgrade") → Stripe checkout/subscription change with proration preview ("$X today, then $Y/mo") → on success, entitlements flip immediately (no deploy), the relevant bot appears in Bot Control Center in **Test** mode with Suggest autonomy, onboarding checklist "turn on 3 bots".
5. Downgrade/cancel: bots auto-switch to Off, queued items cancelled, data kept; the Cockpit card returns with the money missed since downgrade.
6. Honesty rules: label "estimate", never count the same dollar twice, only show a locked-preview dollar if the user can click through to the records.

---
## 4. Feature table
Legend ANH: Y / Partial / N. Files: MA = inventory/management_admin.md, II = inventory/inbox_integrations.md, DFS = Department_Feature_Spec.md.

### 4A. Command Center & Analytics
| Feature | What it does | WORKFLOW / AI BOT / HYBRID | ANH today? | Tier | Priority |
|---|---|---|---|---|---|
| Command Cockpit | Pulse score, pipeline, fleet wall, decisions, ledger | WORKFLOW: deterministic math over metric engine; AI only wording of the pulse sentence (HYBRID optional) | Partial (MA 2a-2c War Room; math unreliable) | Core | Launch |
| Company pulse 0-100 | Weighted dept scores vs targets | WORKFLOW: formula | N | Core | Launch |
| Freight-to-cash pipeline | Booked > Moving > Delivered > Invoiced > Paid, $ and days per step, bottleneck highlight | WORKFLOW: event history | N | Core | Launch |
| Fleet wall | Truck tiles shaded by weekly profit | WORKFLOW | N | Core | Launch |
| Morning Brief (template) | Numbers + top decisions, no prose | WORKFLOW: rules + template | N | Core | Launch |
| Morning Brief (AI narrative, daily) | 5-line narrative + ranked decisions | HYBRID: workflow computes JSON, AI writes words (needs natural language) | N | Pro weekly / Autopilot daily | Launch |
| Brief by voice | Reads brief to owner by phone/app | HYBRID: TTS of the same text | N | Autopilot | V2 |
| Live roll call (owner view) | Live position, miles left, ETA vs appointment, holds | WORKFLOW: ETA math from GPS/ELD | N (ANH did manual ETA texting; DFS dispatch update) | Core | Launch |
| Profit Lens by load / truck / driver / lane / customer / dispatcher | Ranked, filterable, per-row trend, vs average and benchmark | WORKFLOW: aggregation | Partial (MA 2c Trucks tab; 2i Compare; math errors, hard-coded $0.08 insurance, $0.05 tolls) | Core | Launch |
| Load P&L waterfall | Per-load profit with every figure clickable | WORKFLOW | Partial (DFS section 4 profitability) | Core | Launch |
| Cost profile allocation | Fixed costs per truck/company feed cost per mile (replaces hard-coded constants) | WORKFLOW | N | Core | Launch |
| Metric definitions (versioned) | One definition per KPI | WORKFLOW | N | Core | Launch |
| Drill-down on any number | Opens loads/bills/rules behind it | WORKFLOW | N | Core | Launch |
| Trends & comparisons | Period vs prior / last year | WORKFLOW | Partial (MA 2j Historical) | Core | Launch |
| Diesel price panel | EIA regional price, daily | WORKFLOW (cron; ANH cron was off, last price 2026-07-20) | Partial (MA 2j) | Core | Launch |
| Department scorecards | 4 KPIs + status per department | WORKFLOW | N (MA 2d HR tab only) | Core | Launch |
| Goals with auto progress | Targets, progress from metrics | WORKFLOW (ANH progress never updated; 1 goal ever) | Partial (MA 2e) | Core | V2 |
| Team / dispatcher ranking | Composite score by team and person | WORKFLOW | Y (MA 2e Team Performance) | Core | V2 |
| Org chart | Departments, leaders, members (multi-role fixed) | WORKFLOW | Partial (MA 2e Organization) | Core | V2 |
| What-if sliders | Profit / break-even under changed inputs | WORKFLOW | N | Pro | V2 |
| Forecast 7/30 day | Revenue and cash from booked loads + invoice due dates | WORKFLOW (statistical; confidence band shown) | N | Pro | V2 |
| Benchmarks | Own cost lines vs industry | WORKFLOW | N | Pro | V2 |
| What to do next (rules) | 8 launch rules, each with $ at stake, one-tap action | WORKFLOW: rules; wording by template | N | Core (5 rules) / Pro (all) | Launch |
| Alert explainer | Why an alert fired, probable cause, suggested action | HYBRID: rule fires, AI explains with drill-down links | N | Pro | V2 |
| Proactive alerts (delay risk, margin drop, slow payer, idle truck) | Push before the owner asks | HYBRID: detection is statistical rule; AI writes the note | N | Autopilot | V2 |
| Ask Your Company chat | Natural-language questions, tables and charts | AI BOT: multi-step reasoning over tools | N (MA 10 AI assistant existed, unmounted, 0 usage) | Pro limited / Autopilot deep | Launch |
| Smart search | "loads for Northline in Ohio last week" to filters | AI BOT (Fast): parse intent to filter spec; results via workflow | Partial (MA 2a search box, client-side) | Core | Launch |
| Dashboards (user-built) | Widget grid, share by role, TV mode | WORKFLOW | N | Core 3 / Pro 15 / Autopilot 50 | V2 |
| Report Library | Department reports; PDF/XLSX/CSV/print | WORKFLOW | Partial (fixed templates; generate-financial-report) | Core | Launch |
| Report Builder | Any field, filter, group, chart, saved view | WORKFLOW (declarative spec) | N | Pro | V2 |
| Report Builder AI assist | "Describe the report" to spec | AI BOT (Balanced) | N | Pro / Autopilot | V2 |
| Scheduled reports | Email PDF/CSV on a schedule; share link | WORKFLOW | N | Core 3 / Pro 20 / Autopilot 100 | V2 |
| Decision Log | Record decisions, review whether they paid off | WORKFLOW | N | Pro | Later |
| Delegation tracking | Assigned tips become tasks with owners | WORKFLOW | N | Core | V2 |
| TV mode | Big-screen office display | WORKFLOW | N | Pro | Later |
| Money-Found engine (shadow mode) | Dollar estimate of what locked bots would recover | WORKFLOW (detectors; no AI) | N | Core (feeds upsell) | Launch |

### 4B. Communications
| Feature | What it does | WORKFLOW / AI BOT / HYBRID | ANH today? | Tier | Priority |
|---|---|---|---|---|---|
| Shared inbox (email) | Connect mailboxes, list, read, reply, forward, labels, attachments | WORKFLOW | Partial (II Part A /inbox; actions fail: no primary mailbox, B1; accounting tokens can't refresh, B2) | Core: 2 mailboxes / Pro 5 / Autopilot 10 | Launch |
| Per-mailbox role access (server-enforced) | Who may read which mailbox | WORKFLOW | Partial (II B5: UI-only) | Core | Launch |
| Assignment, status, team queues | Assign thread to person/team; Open/Waiting/Closed; SLA timer | WORKFLOW | N (teams used Gmail labels as folders, II hidden feature 3) | Core | Launch |
| Internal notes and @mentions | Private notes, notify mentioned user | WORKFLOW | N | Core | Launch |
| Link to load / broker / driver | Thread auto-linked by load #, MC#, email domain | WORKFLOW: matching rules | N | Core | Launch |
| Rules, templates, snippets | Auto-label/assign, canned replies | WORKFLOW | N | Core | Launch |
| Correct reply threading, reply-all, forward with body + attachments | Fixes ANH B3-B4 | WORKFLOW | Partial | Core | Launch |
| Rate-con capture | Rate-con email to Dispatch rate-con inbox | HYBRID (reader bot belongs to Dispatch dept) | Partial (DFS) | Core | Launch |
| AI triage | Category, priority, entity match, suggested action | AI BOT (Fast): reads unstructured text | N | Pro (3,000/mo) / Autopilot (10,000) | Launch |
| AI draft reply | Draft with load context and tone guide | AI BOT (Smart): writes language | N | Pro / Autopilot | Launch |
| Thread summary / handoff | "What happened so far" for long threads | AI BOT (Fast) | N | Pro / Autopilot | V2 |
| Auto-reply on whitelisted categories | POD received, status request, remittance ack | HYBRID: workflow picks template, AI fills facts; money words blocked | N | Autopilot | V2 |
| Texts (two-way SMS) | Threads with drivers/brokers/candidates; STOP/consent; quiet hours | WORKFLOW | Partial (GHL for recruiting only, 909 recruiting_sms; Twilio dormant) | Core (300 segments) / Pro 1,500 / Autopilot 5,000 | Launch |
| Group text / broadcast | One message to a driver group | WORKFLOW | N (ANH used Telegram groups) | Core | V2 |
| Driver Text Assistant | Answers "where is my pay / next load / parking" from data; free-text via AI | HYBRID: templates from data, AI only for free text | N | Pro (500) / Autopilot (3,000) | V2 |
| Notification center (bell) | Alerts + approvals + bot suggestions, ack, snooze | WORKFLOW | Y (MA 0b; fleet alerts, overrides) | Core | Launch |
| Notification preferences (saved) | Per event x channel, digest, quiet hours | WORKFLOW | Partial (MA 7: switches not saved) | Core | Launch |
| Escalation rules | Unacked 15 min to leader by text | WORKFLOW | N | Core | V2 |
| Reliable push + SMS fallback | Push first; SMS if not delivered | WORKFLOW | Partial (II: push likely broken) | Core | Launch |
| Object threads (load/truck/ticket/driver) | Shared chat per object | WORKFLOW | Partial (II chat hidden; 217 messages ever, 1 in 30 days) | Core | Launch |
| Telegram / SMS bridge for switchover | Drivers reply from Telegram into thread | WORKFLOW | Partial (II Telegram bot, 1 staff user) | Core | V2 |
| Email sending domain per carrier | Branded from-address, SPF/DKIM guide | WORKFLOW | Partial (II Resend + Gmail) | Core | Launch |

### 4C. Platform
| Feature | What it does | WORKFLOW / AI BOT / HYBRID | ANH today? | Tier | Priority |
|---|---|---|---|---|---|
| Users, invites, deactivate | 72h hashed-token invites, persisted deactivate, resend | WORKFLOW | Y (MA 2f; deactivate UI not persisted) | Core | Launch |
| Roles: 8 built-in + custom | Owner, Manager, Dispatcher, Accounting, Maintenance, Safety, Recruiter, Driver; Leader as a flag | WORKFLOW | Partial (MA: 23 roles, 126 permission rows cosmetic) | Core (built-in) / Pro (custom) | Launch |
| Permission matrix + sensitive flags | See profit, see pay rates, see bank/SSN, export, approve money, change bot autonomy | WORKFLOW | N (MA gap 4: shell showed profit to every role) | Core | Launch |
| Data scope by team | All / my team / assigned only | WORKFLOW | N | Pro | V2 |
| View as role | Preview what a role sees (audited) | WORKFLOW | Y (MA: "View as Driver") | Core | V2 |
| 2FA, sessions, password reset | | WORKFLOW | N (MA 7 "Coming soon") | Core (owner/accounting required) | Launch |
| Auto-join by verified email domain | New user from company domain lands pending with default role | WORKFLOW | Partial (MA hidden 1: authorized_role_emails, no UI, typo entries) | Core | V2 |
| Company profile + branding | | WORKFLOW | N (hard-coded A&H values) | Core | Launch |
| Company settings & thresholds | Break-even margin, free detention time, quiet hours, numbering, templates | WORKFLOW | N | Core | Launch |
| Multi-carrier entities | Each carrier its own company on paper | WORKFLOW | Y (carriers page, MA 0c) | Core 1 / Pro 3 / Autopilot 10 | V2 |
| Integrations Hub | Connect / paste key / provided; adapters; Off/Test/Live | WORKFLOW | Partial (II B5: global keys only) | Core | Launch |
| Webhook Gateway | One verified inbound endpoint family | WORKFLOW | Partial (II B3: ~6 endpoints, mixed auth) | Core | Launch |
| Outbound Queue | One path for every send; modes, quiet hours, approvals, undo | WORKFLOW | N | Core | Launch |
| Health Board | Status, lag, errors, token expiry, scheduler jobs | WORKFLOW | N (13 cron jobs, 11 switched off in March unnoticed, II B2) | Core | Launch |
| AI-assisted import / mapping | Upload spreadsheet/PDF, map columns, preview, undo | HYBRID: AI maps columns, workflow imports | Partial (DFS) | Core 5 / Pro 20 / Autopilot 50 per month | Launch |
| Billing & usage meter | Plan, meters, invoices, overage rules | WORKFLOW (Stripe metered) | N | Core | Launch |
| Plan comparison + locked previews with dollars | Upsell page | WORKFLOW (shadow detectors) | N | Core | Launch |
| AI Gateway | Job + tier routing, cheap-first, validate, escalate, cross-vendor fallback, budgets | WORKFLOW (code, no model needed) | N (single Lovable AI key, II) | All | Launch |
| Bot Control Center | List, autonomy, mode, audit, kill switch, cost | WORKFLOW | N | Core (list + kill switch) / Pro-Autopilot (autonomy controls) | Launch |
| Audit log (users + bots) | Who/what/why, export | WORKFLOW | Y (MA 2g, 18,623 rows; no export) | Core | Launch |
| Data export | Full tenant export zip | WORKFLOW | N | Core | Launch |
| Public API / outbound webhooks | | WORKFLOW | N | Pro | V2 |
| SSO (SAML) | | WORKFLOW | N | Enterprise | Later |

---
## 5. AI bots in this department
Common to all: autonomy default Off/Suggest/Auto per tier is given; the AI Gateway enforces cap, model route and validators; all runs logged; kill switch applies.

**Bot 1 — Morning Brief Writer** (Command)
- Trigger: daily cron at tenant time (Autopilot), Mondays (Pro), on-demand "Refresh".
- Steps: metrics engine builds JSON (workflow) > writer drafts 5 lines + 3 decisions > validator: every number must appear in JSON, no new facts > publish.
- Reads: metric engine rollups only (not raw rows). Writes: brief record, push/email/SMS via Outbound Queue to owner/managers.
- Human approval: none needed (internal read-only); owner-facing only.
- Autonomy default: Core n/a (template); Pro Auto-for-self (weekly); Autopilot Auto. Switch exists (Off/Suggest/Auto).
- Model: Balanced, Gemini 3.6 Flash; fallback Sonnet 5.5, then template.
- Tokens: 12k in, 0.8k out. COST/RUN = 12,000 x $0.75/1M + 800 x $3.75/1M = $0.009 + $0.003 = **$0.012** [V prices, E tokens].
- Saves: ~15 min/day of owner screen-checking = $7.50/run [E]; ANH had no brief.

**Bot 2 — Ask Your Company** (Command)
- Trigger: user question. Steps: entitlement check > router (Haiku 5.5, thinking off) > simple: one tool call; complex: Sonnet 5.5 plans up to 5 tool calls > chart/table spec validated > answer with basis.
- Reads: semantic-layer tools, tenant- and permission-scoped, read-only DB role. Writes: chat history, pinned widgets, saved schedules (only on user tap). Cannot write business data.
- Human approval: not needed (read-only); action buttons open the owning department's approval flow.
- Autonomy: Pro Suggest-only (answers); Autopilot same (read-only) + may proactively post findings to the brief. Off available.
- Model: router Fast/Haiku 5.5; analysis Smart/Sonnet 5.5 (escalate Opus 5.5 / gpt-6.1-sol for failed validation); fallback chain Gemini 3.6 Flash.
- Tokens: ~40k cumulative in, 2k out per complex question (5 rounds, 4k prompt re-sent), caching cuts input 70-90%.
- COST/RUN: simple (Haiku) 40k x $0.10/1M + 2k x $0.50/1M = **$0.005**; complex (Sonnet) uncached 40k x $2 + 2k x $10 = $0.08 + $0.02 = $0.10, cached about **$0.04** [V per AI_Model_Comparison Job 4]. Blended typical (60% simple, 40% complex cached) = 0.6 x 0.005 + 0.4 x 0.04 = **$0.019**. Cost at cap uses worst case $0.04.
- Saves: a cross-department question that took ~20 min in spreadsheets (Compare + Historical tabs + export) = $10 per complex question [E]; simple ~5 min = $2.50.

**Bot 3 — Report Builder Assistant** (Command)
- Trigger: "Describe your report" box. Steps: prompt + field catalog > Balanced model returns a declarative report spec (JSON) > schema validation + permission check > preview rendered by workflow > user saves.
- Reads: field catalog (names, not data). Writes: draft report spec.
- Approval: user must Save. Autonomy: Suggest only. Tiers: Pro 40, Autopilot 200.
- Model: Balanced, Gemini 3.6 Flash; fallback Sonnet 5.5. Tokens 6k in, 1.5k out. COST/RUN = 6,000 x 0.75/1M + 1,500 x 3.75/1M = $0.0045 + $0.0056 = **$0.010** [V/E].
- Saves: ~15 min of builder clicking = $7.50 [E].

**Bot 4 — Alert Explainer / Proactive Alert Writer** (Command)
- Trigger: a WORKFLOW rule fires (margin drop, idle truck, slow payer, delay risk, cost/mi >1.5x fleet). Steps: collect facts for the rule > AI writes cause hypothesis + recommended action + links > validator checks that claims map to supplied facts > create alert.
- Approval: alerts are informational; any action taken goes through department flows. Autonomy: Pro Suggest; Autopilot Auto (push to owner within quiet hours).
- Model: Balanced, Gemini 3.6 Flash. Tokens 3k in, 300 out. COST/RUN = 3,000 x 0.75/1M + 300 x 3.75/1M = $0.00225 + $0.00113 = **$0.0034**.
- Saves: ~10 min diagnosing per alert = $5 [E].

**Bot 5 — Inbox Triage** (Communications)
- Trigger: new inbound email/text. Steps: rules first > Fast model classifies + extracts entities (JSON) > entity match against DB > chips + suggested assignee.
- Reads: message body (PII masking of SSN/bank numbers before the call), sender, linked objects. Writes: labels, chips, suggested assignee; Autopilot may auto-assign on confidence >= 0.85.
- Approval: none for labeling; auto-assign reversible. Autonomy: Pro Suggest (chips only); Autopilot Auto-assign.
- Model: Fast, Gemini 3.1 Flash-Lite; fallback gpt-6-luna, Haiku 5.5 (thinking off). Tokens 500 in, 50 out. COST/RUN = 500 x 0.25/1M + 50 x 1.50/1M = $0.000125 + $0.000075 = **$0.0002** [V] (AI_Model_Comparison gives $0.07-0.075 per 1,000 for the cheapest picks; I use the Gemini 3.1 Flash-Lite price). Batch (50% off) for backfills.
- Saves: ~15 s per message x $22/h = $0.09; at ANH ~7,400 messages/month = ~$680/month of sorting time [E].

**Bot 6 — Inbox Reply Drafter** (Communications)
- Trigger: "Draft reply" button, or auto for whitelisted categories (Autopilot). Steps: gather thread + load facts + tone guide > Smart model drafts > validator: no invented numbers (rates, dates must come from context), no banned phrases, money/legal terms flag "needs human".
- Writes: draft in thread. Approval: human click Send in Pro (Suggest); Autopilot Auto only for POD-received / status / ack categories, confidence >= 0.9, no money words. Customer-facing = human approval in Pro always.
- Model: Smart, Claude Sonnet 5.5; fallback gpt-6.1-sol, Gemini 3.6 Flash. Tokens 1.5k in, 400 out. COST/RUN = 1,500 x 2/1M + 400 x 10/1M = $0.003 + $0.004 = **$0.007** [V].
- Saves: ~3 min per reply = $1.10 [E].

**Bot 7 — Thread Summarizer** (Communications)
- Trigger: thread > 8 messages or on handoff; button "Summarize". Fast model, 3k in, 200 out: 3,000 x 0.25/1M + 200 x 1.50/1M = $0.00075 + $0.0003 = **$0.00105**. Writes summary note. Approval none. Autonomy Auto (internal). Saves ~2 min read = $0.73 [E].

**Bot 8 — Driver Text Assistant** (Communications; HYBRID)
- Trigger: inbound driver text. Steps: Fast intent classify (pay, load, parking, document, breakdown, other) > data-backed answer from template (WORKFLOW, free) > only if free-text answer needed, Balanced writes reply from facts > send via Outbound Queue; breakdown/safety keywords hand to a human immediately.
- Approval: Pro Suggest (dispatcher taps Send); Autopilot Auto for read-only answers (pay status, next load, ETA); never money amounts changes.
- Model: Fast + Balanced. COST/RUN = Fast $0.0002 + Balanced (2k in x 0.75/1M = $0.0015; 200 out x 3.75/1M = $0.00075) = **$0.00245** worst case; many runs are template-only ($0.0002).
- Saves: ~2 min per question = $0.73 [E]; ANH dispatchers answered these by Telegram/phone.

**Bot 9 — Import Mapper** (Platform; HYBRID)
- Trigger: user uploads CSV/XLSX/PDF in import wizard. Steps: sample 50 rows > Balanced proposes column mapping + data fixes > workflow shows preview, flags duplicates, user confirms > workflow imports with undo.
- Writes only after user confirm. Autonomy: Suggest only. Model: Balanced, Gemini 3.6 Flash (fallback Sonnet 5.5). Tokens 8k in, 1k out. COST/RUN = 8,000 x 0.75/1M + 1,000 x 3.75/1M = $0.006 + $0.00375 = **$0.0098**.
- Saves: ~45 min manual mapping per file = $16.50 [E].

**Bot 10 — Smart Search** (Command; all tiers)
- Fast model turns text into a filter spec; 1k in, 100 out: 1,000 x 0.25/1M + 100 x 1.50/1M = $0.00025 + $0.00015 = **$0.0004**. No writes. Saves ~1 min per search = $0.37 [E].

**Not bots (deliberately WORKFLOW):** Money-Found detectors, scorecards, roll-call ETA, scheduled reports, notification routing, health board, kill switch, permissions. They are deterministic and cost ~$0 per run.

### 5B. Bot registry (what the Bot Control Center lists)
The control center lists every bot in the product, not only those above. Registry fields: bot_id, name, owner department, tier required, models by job, default autonomy per tier, hard ceiling (e.g., money movement never Auto), caps, guardrail schema, cost 30d.
| Bot | Department doc | Core | Pro | Autopilot | Hard rule |
|---|---|---|---|---|---|
| Rate-con / BOL / invoice reader | Dispatch / Accounting | Assist (bundle) | Assist | Assist | human confirms load creation |
| Receipt scanner | Accounting | Assist | Assist | Assist | |
| Maintenance triage (photos) | Maintenance | — | Suggest | Suggest | never autonomous repair decisions |
| Detention billing | Accounting | — | Suggest (preview) | Auto within $ cap | money movement stays human |
| Short-pay dispute | Accounting | — | Suggest | Auto under $ cap | |
| Collections follow-up | Accounting | — | Suggest | Auto within cadence | |
| Dispatch planner | Dispatch | — | — | Suggest/Auto per rules | code validates HOS/equipment |
| Check-call voice agent | Dispatch | — | — | Auto (Voice) | consent, recording law |
| Recruiting text bot / voice agent | Recruiting | — | Suggest | Auto | STOP, adverse action = human |
| Delay-risk bot | Dispatch | — | Suggest | Auto notify | |
| Morning Brief, Ask Your Company, Report Assist, Alert Explainer | this doc | per tier above | | | read-only |
| Inbox Triage, Reply Drafter, Summarizer, Driver Text Assistant, Import Mapper, Smart Search | this doc | per tier above | | | customer-facing = human in Pro |

---
## 6. Tier matrix
Caps are per tenant per calendar month unless stated. "Assist" = AI helps but a human does the act.
| Feature / bot | Core | Pro | Autopilot |
|---|---|---|---|
| Cockpit, pulse, pipeline, fleet wall, roll call, Profit Lens, load P&L, drill-down, trends, scorecards | ✓ | ✓ | ✓ |
| What to do next rules | limited (5 rules) | ✓ (all) | ✓ (all + custom rules) |
| Morning Brief | template (no AI) | AI weekly: 5 runs | AI daily: 31 runs (+ voice V2) |
| Smart search (Fast) | limited: 300 | 1,000 | 3,000 |
| Ask Your Company | — | limited: 150 questions | 1,000 questions |
| What-if, forecast, benchmarks | — | ✓ | ✓ |
| Dashboards / saved reports | 3 / 10 | 15 / 100 | 50 / unlimited |
| Report Builder | — | ✓ | ✓ |
| Report Builder AI assist | — | 40 | 200 |
| Scheduled reports | 3 | 20 | 100 |
| Alert explainer (AI) | — | 100 | 500 |
| Proactive alerts | — | — | ✓ |
| Money-Found preview (shadow) | ✓ (list free, action locked) | ✓ | ✓ (actions live) |
| Shared inbox mailboxes | 2 | 5 | 10 |
| Assignment, notes, rules, templates | ✓ | ✓ | ✓ |
| AI triage | — | 3,000 msgs | 10,000 msgs |
| AI draft reply | — | 300 | 1,500 |
| Auto-reply on whitelisted categories | — | — | ✓ |
| Thread summary | — | 500 | 2,000 |
| Texts (SMS segments, pooled, all-in) | 300 | 1,500 | 5,000 |
| Driver Text Assistant | — | 500 | 3,000 |
| Notifications, preferences, escalation | ✓ | ✓ | ✓ |
| Users | unlimited staff, price by loads | same | same |
| Roles | 8 built-in | + custom roles, team data scope | + custom, SSO later |
| Integrations (connections) | 6 | 15 | unlimited |
| Public API / outbound webhooks | — | ✓ | ✓ |
| AI-assisted import | 5 | 20 | 50 |
| Bot Control Center | list + kill switch + audit | + autonomy (max Suggest) | + autonomy up to Auto, guardrails, auto-trial |
| Audit log retention | 90 days | 1 year | 3 years |
| Carriers (entities) | 1 | 3 | 10 |
| Overage | pay-per-run at published price, or hard stop (owner picks) | same | same |

Draft plan prices (placeholders [E], final pricing lives in pricing docs): Core = delivered-load ladder from TMS_Product_and_Pricing_v2 ($1.00/load first 100, $0.75 next 400, $19 minimum; ANH 295 loads = $246). Pro = Core + about $0.30/load ([E], min +$29). Autopilot = Core + about $0.75/load ([E], min +$79). Plan page shows the tenant's own number computed from last 30 days.

---
## 7. Cost to run at each tier's MAX caps
Unit costs from section 5 ([V] = price from AI_Model_Comparison, token counts assumed; [E] = estimate).
| AI feature | Core cap | Pro cap | Autopilot cap | Unit cost | Core $ | Pro $ | Autopilot $ |
|---|---|---|---|---|---|---|---|
| Morning Brief (AI) | 0 | 5 | 31 | $0.012 [V] | 0 | 0.06 | 0.37 |
| Smart search | 300 | 1,000 | 3,000 | $0.0004 [V] | 0.12 | 0.40 | 1.20 |
| Ask Your Company (worst case all complex cached) | 0 | 150 | 1,000 | $0.04 [V] | 0 | 6.00 | 40.00 |
| Report Builder AI assist | 0 | 40 | 200 | $0.010 [V] | 0 | 0.40 | 2.00 |
| Alert explainer | 0 | 100 | 500 | $0.0034 [V] | 0 | 0.34 | 1.70 |
| Inbox triage | 0 | 3,000 | 10,000 | $0.0002 [V] | 0 | 0.60 | 2.00 |
| Reply drafter | 0 | 300 | 1,500 | $0.007 [V] | 0 | 2.10 | 10.50 |
| Thread summarizer | 0 | 500 | 2,000 | $0.00105 [V] | 0 | 0.53 | 2.10 |
| Driver Text Assistant (worst case) | 0 | 500 | 3,000 | $0.0025 [V] | 0 | 1.25 | 7.50 |
| Import Mapper | 5 | 20 | 50 | $0.0098 [V] | 0.05 | 0.20 | 0.49 |
| Brief by voice (TTS 900 chars x $0.04/1K [V ElevenLabs Flash]) | 0 | 0 | 31 | $0.036 | 0 | 0 | 1.12 |
| **AI subtotal at cap** | | | | | **$0.17** | **$11.87** | **$68.98** |
Typical (not cap) Ask cost at blended $0.019 would be about $19 at 1,000 questions; ANH-scale expected use (600 questions in the AI_Model_Comparison volume table) is about $11-24.

Non-AI variable costs this area drives:
| Item | Unit price assumption | Core at cap | Pro at cap | Autopilot at cap |
|---|---|---|---|---|
| SMS segments outbound, all-in (carrier + surcharge) | $0.012 [E] (Twilio-class $0.0083 + carrier fees) | 300 = $3.60 | 1,500 = $18.00 | 5,000 = $60.00 |
| SMS number + 10DLC campaign (fixed per tenant) | $12/mo [E] | $12 | $12 | $12 |
| Transactional email sent | $0.0004 [E] (Resend-class) | 2,000 = $0.80 | 10,000 = $4.00 | 30,000 = $12.00 |
| Attachment storage | $0.023/GB-month [E] | 5 GB = $0.12 | 25 GB = $0.58 | 100 GB = $2.30 |
| Push notifications | free (FCM/APNs) | 0 | 0 | 0 |
| Report PDF rendering | $0.001/PDF [E] | ~$0.10 | ~$0.50 | ~$2.00 |
| Analytics rollups / read replica share | $1/tenant [E] | $1 | $1 | $1 |
| Webhook gateway + queue + health jobs | $0.50/tenant [E] | $0.50 | $0.50 | $0.50 |
| Mailbox sync (Gmail/Outlook APIs) | free | 0 | 0 | 0 |
| **Non-AI subtotal at cap** | | **$18.12** | **$36.58** | **$89.80** |
| **Total at cap (AI + non-AI)** | | **$18.29** | **$48.45** | **$158.78** |
Voice minutes for check calls and recruiting calls belong to the Dispatch and Recruiting blueprints (Voice tier, Gemini Live ~$0.12 per 5-minute call, Vapi cascade ~$0.45-0.65 per 5-minute call [V]); the AI Gateway only meters them here. Stripe fees: 2.9% + $0.30 per charge on plan revenue [E], not in table.
Sanity check vs plan revenue at 400 loads (draft prices): Pro add-on about $120/mo against $48 worst-case cost; Autopilot add-on about $300/mo against $159 worst-case (this department only; other departments' bots add cost, so Autopilot caps must be reviewed across all blueprints). Typical usage is far below caps.

---
## 7B. Design of the platform pieces (reference for build)

### Integrations Hub model
- **Three ways to connect** (shown as button type on each card): `Connect` (OAuth), `Paste key + Test`, `Included` (built-in provided service). Catalog categories: Email (Gmail, Outlook), GPS/ELD (Motive, Samsara, Geotab, Omnitracs; phone GPS is built-in), Fuel cards (EFS, WEX, Comdata: key or file/email ingest), Accounting (QuickBooks Online), Factoring (packet builder; API where factor offers one), Load boards (DAT, Truckstop, 123Loadboard: deep links at launch, API Later), Calendar, Messaging bridge (Telegram), Zapier/Make, EDI (Later), custom webhook/API.
- **Provided services (no keys)**: Maps and distance, SMS numbers, voice, e-sign, transactional email, AI, storage, diesel price feed. They appear in Billing meters, not as integrations to configure.
- **Adapters to a common data format**: each adapter is a small module `{auth, pull|subscribe, toCommon, fromCommon, test, health}`. Common entities: Position, Stop event (arrive/depart), Fuel transaction, Email message, Text message, Accounting transaction, Document, Invoice status, Remittance. Raw vendor payload stored 30 days (replay). Adding a vendor = one adapter, no changes to departments.
- **One verified webhook gateway**: `/hooks/{tenant}/{provider}/{connection}`; provider-specific signature check (HMAC / Ed25519 / shared token) in one place; replay window 5 min; idempotency key; return 200 immediately; process async; dead-letter + Replay. Replaces ANH's ~6 endpoints with mixed auth (II B3) and unauthenticated functions (II B6).
- **One outbound queue**: all emails, SMS, push, API writes, factoring packets and bot actions. Steps: kill-switch flag > mode (Off drops, Test diverts to log/test recipient, Live proceeds) > approval gate > quiet hours (SMS/voice) > consent/STOP check > rate limit per provider > send with backoff retries > Undo window for manual sends (30 s default) > result stored. This is how "nothing leaves the building in Test" is enforceable.
- **Off / Test / Live** exists at three levels: tenant, department, connection. The most restrictive wins.
- **Health Board** rows: connection, mode, last success, lag vs normal, error rate 24h, token expiry date, queue depth, last 5 errors, "Reconnect/Retry/Replay" button. Scheduler section lists every scheduled job (brief, diesel, reports, reminders) with last run and result; any job not run in 2x its interval turns red and notifies admins. Notification to admins on red within 5 minutes.

### Roles and permissions model
- Roles (8 built-in): Owner, Manager, Dispatcher, Accounting, Maintenance, Safety, Recruiter, Driver. Owner-Operator = Owner + Driver. "Leader" is a flag on any role (replaces dispatch_leader, accounting_leader, shop_leader, road_team_leader, hr_leader, safety_leader = 11 ANH rows); "Team" is a group (replaces hard-coded Hunters/Hawks/Jalapenos/Strikers/Catchers).
- Matrix: rows = departments (Dispatch, Accounting, Maintenance/Shop, Safety, Recruiting, Fleet records, Communications, Analytics, Settings, Billing, Bots); columns = None / View / Edit / Approve / Admin. Sensitive flags (separate, default off except Owner): see company profit and margins, see driver pay rates, see bank/SSN, export data, approve money, change bank details (also needs second approval), set bot autonomy to Auto, use kill switch (all managers can), view audit log.
- Data scope: All / My team / Assigned only (Pro).
- All checks server-side and tested per role per endpoint (fixes ANH: no route guards, UI-only mailbox filtering, cosmetic permission toggles).
- Invites: 72 h hashed token, role fixed at invite; role change replaces (not adds) roles; multiple roles allowed by explicit "additional role" toggle; deactivate persists.

### AI Gateway (job + tier, not vendor)
- Callers request **a job**, never a model: `doc_extract`, `triage`, `draft_external`, `draft_internal`, `analytics_chat`, `report_spec`, `brief_write`, `vision_triage`, `dispatch_plan`, `voice_call`, `classify_simple`. Each job maps (config, versioned, DB-stored, not code) to a **tier** and a **route**: primary model, escalation model, fallback list, validators, token and reasoning caps, cache prefix, batch-eligibility, data-class (PII allowed? US-only?).
- Default routes (AI_Model_Comparison section 6): Fast = Gemini 3.1 Flash-Lite > gpt-6-luna > Haiku 5.5 (thinking off). Balanced = Gemini 3.6 Flash > Sonnet 5.5. Smart = Sonnet 5.5 (high effort) > Opus 5.5 / gpt-6.1-sol / Gemini 3.1 Pro. Voice = Vapi/Retell cascade (Deepgram STT + Haiku 5.5-class LLM + ElevenLabs Flash TTS), cost-saver Gemini Live, fallback gpt-realtime-2.1-mini.
- Request pipeline: 1) auth + tenant + entitlement + monthly cap check, 2) kill-switch + mode check, 3) PII masking (SSN, bank numbers), 4) idempotency/result cache, 5) **cheap-first**: call the cheapest tier configured for the job, 6) **validate**: JSON schema, arithmetic/total checks, number-must-exist-in-context check, policy filter (money/legal words), confidence, 7) fail > retry once > **escalate** to next tier (expect 5-15% on documents [E]), 8) on 429/5xx/timeout > **cross-vendor fallback** (Gemini <> OpenAI <> Anthropic, same prompt and tool schema; one US-hosted open-weight model as third fallback), 9) log tokens, cost, latency, model version, validator outcome to the cost meter and audit.
- Rules: tenant data only to US-resident or zero-retention endpoints; no China-hosted APIs for tenant data; pin dated model versions; regression set (~100 real docs and ~50 chat questions per tenant type) re-run before any model swap; shared prefix caching with tenant-isolated cache keys; Batch (50% off) for nightly backfills and bulk triage.
- Budgets: per-tenant monthly AI budget derived from caps; alerts at 80% and 100%; at 100% non-essential jobs stop (or overage if owner allowed); essential jobs (doc extraction for active loads) continue and are flagged.
- Provided-service pricing: customers see runs and caps, not tokens or vendors. Vendor swaps change cost, not UI.

### Billing and usage meter (UI)
- Header: plan, next invoice date and estimate, payment method.
- Meters (bars with remaining and reset date): delivered loads this month (the price meter); per AI feature runs vs cap (grouped: Command, Inbox, Dispatch, Accounting, Recruiting, Voice); SMS segments; voice minutes; storage GB; connections count; carriers.
- Overage choice per meter: Stop at cap / Auto-buy a pack / Pay as I go at the published price. Spend alert emails at 80% and 100%.
- Invoices list (PDF), plan change with proration preview, tax info, cancel with data export prompt.

---
## 8. Parity checklist (current ANH, nothing silently missing)
| ANH feature (usage) | Source | New home |
|---|---|---|
| Login, set-password, invite accept (invitations 43, 31 accepted) | MA 1a-1b, 8 | Users + invite flow (Platform), role fixed at invite |
| Role landing by primary role (precedence list) | MA 1 | Role-based home: Owner/Manager Cockpit; Dispatcher Dispatch; Accounting money pipeline |
| No-role screen (2 users had no role) | MA 1c | "Waiting for approval" screen + admin notification |
| Management super-shell with every department tab | MA 1d | Cockpit + normal department nav gated by permission matrix (fixes open profit view) |
| Global notification bell: fleet alerts, load overrides, recruiting overrides, ack all, set truck location | MA 0b | Notification Center (approvals + alerts, one list) |
| Recruiting reply alerts bell | II Part A helpers, MA 1d #14 | Notification Center item type "candidate replied" (Recruiting dept) |
| War Room Overview (revenue, loads, RPM, on-time, utilization, maintenance cost, trends, fleet status donut, alerts) | MA 2b | Cockpit + Trends (math moved to metric engine) |
| War Room Trucks (per-truck P&L, top/bottom 5, cost pie) | MA 2c | Profit Lens by truck (real cost linkage, no hard-coded $0.08/mi insurance and $0.05/mi tolls) |
| War Room HR analytics (active drivers, hires, retention, tenure, pipeline) | MA 2d | Recruiting scorecard + Recruiting dept analytics (time-to-hire formula fixed) |
| Goals & KPIs (1 goal ever; progress never updated) | MA 2e | Goals with auto progress (V2) |
| Team Performance, composite score, radar | MA 2e | Profit Lens by dispatcher/team + scorecards (weights configurable) |
| Organization chart | MA 2e | Teams / Org chart (multi-role fixed) |
| User Management: invite 23 roles, team leaders, assign role, team, technician link, resend, reset, deactivate, delete (88 profiles, 89 role rows) | MA 2f | Users screen; 8 roles + Leader flag + Team; technician link stays in Maintenance; deactivate persisted |
| Role permission toggles (126 rows, cosmetic) | MA 2f | Roles & Permissions matrix actually enforced server-side |
| Audit logs (18,623 rows, 29 users in 30 days) | MA 2g | Audit Log (adds export, bot actions, filters) |
| Bonus Programs (executive; 3 programs, cron off) | MA 2h | Moved to Driver app / Accounting timed-bonus program (not this area); permission "manage bonuses" in matrix |
| Compare view | MA 2i | Profit Lens |
| Historical + diesel prices (21 rows, stale) | MA 2j | Trends + Fuel price (daily job on Health Board) |
| Signup page for new dispatchers (self-signup) | MA 3 | Dropped: replaced by invite + verified-domain auto-join (self-signup into a tenant is a security hole) |
| /sales, /invest, investor module, investor statements, nurturing, Calendly, Google Calendar booking | MA 4-6 | Dropped: Sales/investor module is OUT of product. (Open decision in TMS_Product_and_Pricing_v2: investor statements/truck-owner payouts; owned by Accounting blueprint) |
| User Settings: email, role, reset password, theme, notifications (not saved), auto-refresh, 2FA "coming soon" | MA 7 | Profile + Notification Preferences (saved), theme, 2FA live. Auto-refresh toggle dropped: live updates by default |
| Accept invitation page | MA 8 | Invite flow |
| Broker unsubscribe page | MA 9 | Email footer unsubscribe handled by Outbound Queue (suppression list), tenant-level |
| AI assistant "AI clone" (37 settings rows, 0 usage) | MA 10 | Replaced by Ask Your Company; per-user AI instructions Later |
| Role auto-assign by email (8 rows, typo domain) | MA hidden 1 | Verified-domain auto-join with default role + admin approval |
| Hard-coded payroll super-access by email | MA hidden 2 | Dropped: replaced by permission flags |
| Carriers menu, truck mapping, View as Driver | MA 0c | Multi-carrier settings; Truck mapping in Fleet; View as role |
| Shared inbox: Gmail 3-pane, folders, labels, search, compose, reply/forward, attachments, 4 mailboxes (1 actively used) | II Part A | Shared Inbox (works for every mailbox; threading fixed) |
| Gmail labels as team folders (Catchers, Hawks, ...) | II hidden 3 | Team queues + labels, migrated at import |
| Mailbox role filter (UI only) | II B5 | Server-enforced per-mailbox access |
| OAuth callback auto-link mailbox to carrier | II hidden 7 | Mailbox belongs to a carrier entity in Integrations |
| Internal chat (115 conversations, 217 messages, 1 in last 30 days), live location share | II chat | Object threads; location share via driver app; conversation import dropped (low use) |
| Telegram staff bot (1 allowlisted user, 0 handoffs) | II Telegram | Bridge V2; staff Q&A replaced by Ask Your Company |
| Integrations: Gmail 3 OAuth apps, QuickBooks, GHL, Vapi, Twilio, Google Maps, Google Calendar, EIA, Resend, OpenRouter | II B5 | Hub: Gmail/Outlook Connect; QuickBooks Connect; GHL replaced by provided SMS (GHL import adapter Later); Vapi/Twilio replaced by provided voice/SMS; Maps provided; EIA provided; Calendar dormant dropped; OpenRouter replaced by AI Gateway |
| Cron jobs (13; 11 off since 2026-03-10: broker updates, geofence, delay risk, QuickBooks, bonuses, diesel, document review, payments) | II B2 | Scheduler section of Health Board; each job owned by a department blueprint |
| Webhooks: telegram-webhook, recruiting-inbound (909 SMS rows), ghl-webhook, vapi-webhook | II B3 | Webhook Gateway (provider adapters) |
| Unauthenticated functions, global keys, account-takeover in driver activation | II B6, MA gaps | Fixed by design: auth on every endpoint, per-tenant keys in vault, tests |
| Driver push (broken) | II helper | Reliable push + SMS fallback |
| Error boundary, offline-first query defaults | MA 0 | Platform shell (engineering) |

---
## 9. NEW features beyond ANH (better than Alvys-class)
1. **Money-Found engine in shadow mode** on every plan: dollar proof for upgrades, honest and clickable.
2. **Every number explains itself**: formula, metric version, rows behind it, on any screen.
3. **Ask Your Company with charts** that can be pinned and scheduled; permission-aware tools, no free-form SQL.
4. **Report Builder + user dashboards** (the Alvys complaint: fixed templates only), with AI assist.
5. **Test mode across the product**: Off/Test/Live per tenant, department, connection, bot; everything routed through one outbound queue.
6. **Bot Control Center**: single place for all bots, autonomy, guardrails, auto-trial, audit, kill switch, cost.
7. **Health Board** that catches silent failures (stale tokens, dead cron) in minutes.
8. **Shared inbox tied to loads/brokers**, internal notes, assignment, AI triage and drafts, undo-send.
9. **Decision Log + delegation tracking**: did the decision pay off; follow-through visible to the owner.
10. **Proactive alerts + voice brief** (Autopilot).
11. **Switchover bridge**: Telegram/SMS replies land in load threads during migration from the old system.
12. **Promotion path for bots**: system proposes Suggest to Auto based on measured acceptance rate.
13. **Plan preview with the tenant's own dollars** and net-benefit math; downgrade shows missed money.
14. **TV mode** with live numbers and celebrations (record week, on-time streaks).

---
## 10. Open questions for Abdel
1. Plan prices: are the draft add-ons (Pro about +$0.30/load, Autopilot about +$0.75/load, minimums) acceptable, or should Autopilot be a flat monthly per carrier? At-cap cost here is $159/mo for Autopilot (this area only), so a per-load-only add-on is thin for small fleets.
2. Should Ask Your Company be hard-capped (150 / 1,000) or soft-capped with overage at about $0.10 per question? Cost at cap is $40/month at Autopilot, the largest AI line in this document.
3. Auto-send in the inbox: OK to allow Autopilot to auto-reply (POD received, status, remittance ack) without any human click, given brokers see these as the company's voice? Default I propose: off until the owner enables per category.
4. Shared inbox as Core or Pro? I put it in Core (it is the front door for rate-cons) with AI triage/drafts in Pro; confirm.
5. Money-Found shadow detectors run on Core tenants' data at near-zero cost; are you comfortable showing estimated dollars to Core users as an upsell, with the "estimate" label and clickable basis?
