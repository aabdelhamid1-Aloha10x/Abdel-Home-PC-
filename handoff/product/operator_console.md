# Fleet OS Operator Console & Bot/System Monitoring — blueprint

Internal app for Abdel (owner) and the support team. NOT customer-facing. Plans per 00_PACKAGING_LOCKED.md: Solo $39 (1 truck, 300 credits), Core $97 (3, 1,000), Growth $249 (25, 4,000, voice), Enterprise 26+ (quote). Credits expire monthly; top-ups roll over; 1 credit ~ $0.01 of our cost. Bots drop to Suggest/Off at zero credits; workflows and drivers are never blocked. Console builds on the platform pieces already designed in command_platform.md: AI Gateway (jobs, tiers, routes, validators), Outbound Queue, Health Board, Off/Test/Live, Bot Control Center, kill switch. The console is the staff-side view over those same tables, never a second copy of the data.

Design principle (the lesson of the old ANH system: QuickBooks dead 4 months, geofence never ran, SMS inbound silently dropped since Sep 18, nobody noticed): **absence of success is an alert.** Every critical path has an expected-heartbeat; a missing heartbeat pages us. We alert on "should have happened and did not", not only on errors.

---
## 1. Who uses it and what a day looks like
| Staff role | Who (launch) | Day-to-day | Can see | Cannot |
|---|---|---|---|---|
| **Owner** | Abdel | Morning: Ops Home (health, MRR, open incidents, margin). Weekly: pipeline, releases, cost review. Approves break-glass, refunds > $100, kill switches | Everything except raw SSN/bank (nobody can) | Unmask SSN/bank |
| **Support L1** | Part-time hire / Abdel at first | Triage ticket queue, Account 360 read-only, send canned replies, reconnect-link resend, "view as customer" with consent | Tenant profile, usage, integration status, errors (redacted), tickets | Billing writes, break-glass, flags, prompts/AI logs raw |
| **Support L2** | Senior support | L1 + replay dead-letter, retry sync, bot mode change (Auto->Suggest), view AI run traces (redacted), break-glass request | + AI traces redacted, queue tools | Refunds, flags globally |
| **Finance** | Bookkeeper / Abdel | Billing console: grants, adjustments, refunds, failed payments, reconciliation | Billing, ledger, Stripe, MRR | Account 360 operational data, view-as |
| **Engineer** | Abdel / contractor | Releases, flags, model routes, canaries, runbooks, incident command | Logs, traces, bot registry; tenant data only via break-glass | Billing writes, unmasked PII |
| **Sales** | Abdel / part-time | Enterprise pipeline, quote calculator, demo calendar | Lead + prospect trial tenant summary | Customer production data |
Role-to-screen matrix is in section 2.2; every role is least-privilege with time-boxed elevation (section 12).

---
## 2. Screen map
Desktop-first web app at `ops.<product>.com`, separate deploy, separate auth pool (staff SSO via Google Workspace + mandatory 2FA, IP/device checks), never reachable with a customer login. Phone: Ops Home, Alerts, Incident, Ticket reply only (on-call from phone).

### 2.1 Screens
| Route | Screen | Purpose | Phone? |
|---|---|---|---|
| /home | **Ops Home** | Red/amber/green tiles: platform health, open incidents, vendor status, MRR, new signups, trials, tickets breaching SLA, credit-ledger recon, cost today vs budget | Y |
| /tenants | **Tenant Directory** | Search (name, MC/DOT, email, phone, Stripe id) + filters (plan, trucks, health score, MRR, credits balance, last active, flags). Saved views: "At risk", "Over truck limit", "Zero credits", "Trial ending" | Y |
| /tenants/:id | **Account 360** | Tabs: Overview, Users, Usage, Integrations, Bots, Errors, Tickets, Billing, Credits ledger, Audit, Notes | Y read |
| /tenants/:id/view-as | **View-as-Customer** | Read-only mirror of customer UI with banner, countdown, masked fields | N |
| /support/queue | **Issue Queue** | Tickets with SLA clock, severity, owner, context chips | Y |
| /support/ticket/:id | **Ticket** | Thread, auto-attached context bundle, AI summary, linked alert/incident, macros | Y |
| /billing | **Billing Console** | Plans, MRR/ARR, failed payments, refunds, grants, top-ups, Stripe sync status | N |
| /billing/credits | **Credit Adjustments** | Grant/adjust/expire with reason, approval, ledger | N |
| /sales | **Enterprise Pipeline** | Kanban: Contact Sales > Demo booked > Demo done > Quote sent > Negotiation > Won / Lost | N |
| /sales/quote/:id | **Quote Calculator** | Guardrail formula, margin check, modules, PDF | N |
| /flags | **Feature Flags & Kill Switches** | Global + per-tenant flags, kill switches, change log | N |
| /releases | **Releases & Rollouts** | Versions, staged rollout (internal > 5% > all), rollback, release notes | N |
| /analytics/cost | **Usage & Cost Analytics** | Revenue vs AI/telephony cost per tenant, margin per plan, abuse detection | N |
| /health | **Customer Health & Churn Risk** | Score distribution, drivers, at-risk list | Y |
| /announcements | **Announcements** | In-app banners, email, release notes, maintenance windows | N |
| /audit | **Compliance & Access Audit** | Immutable log of staff access, view-as, break-glass, exports, config changes | N |
| /staff | **Staff & Access Policy** | Roles, elevation grants, sessions, 2FA, access reviews | N |
| /monitor/bots | **Bot Registry & Metrics** | All bots/versions/models, per-bot dashboards | N |
| /monitor/evals | **Evals & Regression** | Nightly golden sets, pass-rate trends, model-change diffs | N |
| /monitor/canaries | **Synthetic Canaries** | Each canary, last run, history, failure drill-down | Y |
| /monitor/vendors | **Vendor & Failover** | Vendor status, error rates, failover state, drift alarms | Y |
| /monitor/queues | **Queues & Dead Letters** | Outbound queue depth, age, DLQ, replay | Y |
| /monitor/integrations | **Integration Fleet Health** | All tenants' token expiry and sync lag, sorted worst first | Y |
| /monitor/alerts | **Alerts & On-call** | Active alerts, ack/resolve, routing rules, schedule, runbook links | Y |
| /monitor/incidents | **Incidents** | Declare, timeline, status-page post, customer notices, postmortem | Y |
| /monitor/ai-logs | **AI Log Viewer** | Redacted prompt/response traces, access-gated and audited | N |

### 2.2 Role access matrix (R = read, W = write, A = approve, — = none)
| Screen | Owner | L1 | L2 | Finance | Engineer | Sales |
|---|---|---|---|---|---|---|
| Ops Home | R | R | R | R | R | R (limited) |
| Tenant dir / Account 360 | R/W | R | R/W (limited) | R (billing tabs) | R (no PII) | R (summary) |
| View-as | A | Consent only | Consent + break-glass req. | — | Break-glass req. | — |
| Ticket queue | R/W | R/W | R/W | R | R | — |
| Billing / credits | R/W/A | — | Propose | R/W | — | — |
| Pipeline / quotes | R/W/A | — | — | R | — | R/W |
| Flags / releases | R/W/A | — | Per-tenant kill only | — | R/W | — |
| Cost analytics | R | — | — | R | R | — |
| Bot monitoring / AI logs | R | — | R (redacted) | — | R/W (redacted; raw via break-glass) | — |
| Audit log | R | — | — | R (billing events) | R (own) | — |
| Staff policy | R/W/A | — | — | — | — | — |

---
## 3. Click-through flows

### Flow 1 — Customer reports a problem -> support finds root cause in Account 360
1. Dispatcher at a Growth tenant taps the **Help** widget (bottom-right in the customer app) > "Something is broken" > types "Texts to drivers not going out" > Send. (Screenshot optional, one-tap "Attach screenshot"; no session replay by default, see section 5.)
2. System auto-builds a **context bundle**: tenant id, plan, user + role, current route, app version, browser/OS, last 20 client errors (redacted), last 10 API failures, health-board snapshot (integrations, queue depth), bot modes, open alerts for this tenant, last 5 audit events. Creates ticket, severity guess (rules: "can't send/receive messages", "payments" = S2), SLA timer starts.
3. Thread Summarizer (Fast model) writes a 3-line summary on the ticket; **a workflow** links any open internal alert touching this tenant/vendor (e.g. "ALERT: SMS vendor delivery rate 62%").
4. Support L1 opens **Issue Queue** (sorted by SLA remaining) > clicks ticket > sees bundle chips: Integrations (Twilio-class number: red), Queue (212 messages, oldest 41 min), Errors (10x 'carrier filter 30007').
5. L1 clicks **Open Account 360** > **Integrations** tab: SMS number "Registration: campaign rejected" with date. **Errors** tab: grouped errors with count, first/last seen, deep link to Sentry event. **Credits** tab shows no credit issue (rules out "out of credits").
6. Root cause found (A2P campaign suspended). L1 clicks **Link to incident** (existing INC-14 for that vendor issue) or **Escalate to L2/Engineer** with a note. Replies from macro "Known issue + ETA", sets status Waiting. Customer sees the reply in the widget and by email.
7. When the incident resolves, the closing notice is sent to all linked tickets in one click; ticket auto-resolves in 48 h unless customer replies. Everything is stored: ticket, access log entries for each Account 360 tab opened (section 12).

### Flow 2 — Alert fires before the customer notices -> triage -> fix -> customer notice
1. **Canary** "inbound SMS round-trip" (test tenant, every 5 min) fails twice in a row; heartbeat rule also sees "inbound messages across all tenants = 0 for 20 min vs normal 40/h".
2. Alert engine creates **ALERT S1** "Inbound SMS silent", dedupes, routes: pager (SMS + phone call) to on-call, Slack #alerts-critical, email to Owner. Alert carries runbook link RB-SMS-IN, last good time, affected tenant count (computed).
3. On-call opens the phone page > **Ack** (stops escalation; unacked 10 min escalates to Owner) > Alert detail shows timeline: webhook gateway received 0 events since 02:14, vendor status feed green, signature failures 0, Cloud function error rate 100% (deploy 02:10).
4. Runbook step: "Check last release". **Releases** screen shows v2.41 rolled to all at 02:10. Click **Roll back** (one click, requires reason) > rollout reverts; canary rerun button > passes.
5. Engineer clicks **Replay dead-letter** for 02:14-02:40 inbound events (idempotency keys make replay safe). Queue tile drops to 0.
6. On-call clicks **Declare incident** (S1 auto-declares) > Incident page: timeline auto-filled from alert + release + replay actions. Click **Notify customers**: template "Delayed inbound texts, now recovered" > affected-tenant list (computed from the gap) > in-app banner + email to Owners, status page updated, linked tickets updated.
7. Resolve > postmortem draft (template pre-filled from timeline, human edits) due within 3 business days; action items become tracked tasks; a new canary or heartbeat rule is added if detection was late.

### Flow 3 — Contact Sales -> demo -> quote -> won
1. Visitor at 30 trucks in the pricing page clicks **Contact Sales** (Enterprise card) > form (company, MC/DOT, trucks, current TMS, modules wanted, phone) > submit.
2. System creates a **Lead** in /sales > column Contact Sales; sends auto-email with booking link; Sales gets Slack ping. Fleet size looked up from the form; flag "26+ trucks = Enterprise".
3. Prospect books a demo (calendar link); card moves to **Demo booked**, a **demo trial tenant** is provisioned in Test mode with sample data (one click "Create demo tenant", auto-expires in 14 days).
4. After the call Sales opens the card > **Quote Calculator**: inputs trucks=35, modules (Recruiting included in Growth+, voice volume), integrations count, support level (standard/named SLA), annual prepay.
5. Calculator applies the guardrail: price = $249 + $10 x (35-25) = **$349**; credits = 4,000 + 160 x 10 = **5,600**; computes projected cost (credits x $0.01 at full use + $2/truck + 3% fees) and **gross margin at full credit use**; shows green if >= 60%, red below (needs Owner approval). Adjustments (modules, SLA, prepay discount) shown as separate lines with margin impact.
6. **Quote helper** (AI) drafts the cover email from the quote data and the call notes; Sales edits and clicks **Send quote** (PDF + acceptance link). Card > Quote sent; follow-up reminder at +3 days (workflow).
7. Prospect accepts and pays (Stripe invoice/subscription with custom price + included-credits grant) > card = **Won** > system upgrades tenant plan to Enterprise, applies credits, enables Enterprise features (multi-entity, SSO setup task, audit export), creates onboarding checklist for support, starts health tracking. Lost reason captured otherwise.

### Flow 4 — View as customer session
1. L1 on a ticket clicks **View as customer** > modal: choose reason (ticket # required), scope (read-only, only option for L1), duration (15 min default, 60 max).
2. Path A (default) **Consent**: system sends the tenant Owner an in-app + email request "Support wants to view your account to help with ticket #812. Allow 30 min read-only?" Owner clicks Allow (or ticket reply "yes" through the widget counts as consent for 30 min).
3. Path B **Break-glass** (L2/Engineer, S1/S2 incidents or customer unreachable): enter reason + incident/ticket id; Owner (Abdel) gets push "approve break-glass?" > Approve (or auto-approve flag for S1 with after-the-fact review within 24 h). Customer Owner is **always notified afterwards** (email, line in their Audit page).
4. Session opens in a separate tab: customer UI rendered with a red banner "SUPPORT VIEW — read-only — expires 14:32 — session #A-5521". All write buttons are disabled **server-side** (read-only token, not just UI); outbound sends, bot runs, money actions blocked.
5. **Masking**: SSN, bank/routing, full driver license numbers, DOB, driver home address, pay rates for individual drivers (unless consent scope "include pay") render as `••••1234` or "Hidden by policy"; documents containing PII (DQ files, licenses) show a "locked" tile. No unmask button exists for SSN/bank for anyone.
6. Staff can click **Share pointer** (highlight a button for the customer on a call) and **Add note**. Session auto-ends at expiry or on **End session**; Owner can end it from their side at any time.
7. Audit: start/end, who, reason, consent or approver, every page route visited, every record id opened, masked-field reveal attempts, stored in the immutable audit log (retained 2 years), summarized to customer in Settings > Support access history.

### Flow 5 — Credit adjustment
1. Finance or L2 opens Account 360 > **Credits ledger** tab (shows included vs top-up, expiry date, every debit by bot/job). Clicks **Adjust credits**.
2. Form: type (Goodwill grant / Correction for our bug / Promo / Remove), amount, **bucket** (included-expiring month-end or top-up rolls over; default included for goodwill), reason (required, picklist + free text), linked ticket/incident.
3. Thresholds: <= 500 credits ($5 cost): L2/Finance self-approve; 501-5,000: Finance/Owner; > 5,000 or any negative adjustment: Owner approval (push to Abdel). Daily staff cap per person.
4. System writes a ledger entry (append-only; adjustments are new rows, never edits), updates balance, emails the customer a short receipt ("We added 300 credits: reason"), logs to audit.
5. If the cause was our bug (e.g., a bot looped and burned credits), a **Refund runs** action reverses specific bot runs by run id instead of a lump adjustment, so cost analytics stays accurate.
6. Nightly **reconciliation job** confirms balance = grants - consumption per tenant; mismatches page Finance (section 22).

---
## 4. In-app support (design)
- **Help widget** in the customer app (all plans): search help articles, "Report a problem", "Ask a question", "Request a feature". Solo/Core = self-serve + email ticket (target first response 1 business day). Growth = shared inbox priority + chat in business hours (4 business hours). Enterprise = named contact, SLA table below.
- **Context attached automatically** (bundle from Flow 1) with a visible "What we attach" line and a toggle to remove console errors; no PII fields are included (masked at the source).
- **Screenshot**: yes, user-initiated, with an on-canvas blur tool for names/numbers; stored 90 days; staff access audited.
- **Session replay: decision = NO at launch for the product; only on marketing site and signup funnel (PostHog replay free tier)**. Reason: the app shows driver SSN/bank/pay and customer freight data; replay masking is error-prone and is a compliance liability for a tiny team. Substitute: breadcrumbs (last 30 UI events with route + component names, no text), plus consent-based View-as. Revisit in V2 with "mask everything by default" and opt-in per tenant for a 24 h window.
- **Ticket model**: id, tenant, user, source (widget/email/Slack alert/phone), severity (S1-S4), category, status (New, Open, Waiting on customer, Waiting on us, Resolved), SLA clock, linked alert/incident/release, context bundle, AI summary, internal notes, CSAT after resolve.
- **SLA targets (first response / resolution target)**:
| Severity | Definition | Solo/Core | Growth | Enterprise |
|---|---|---|---|---|
| S1 | Platform down / can't dispatch / messages or payments failing for tenant | 4 h / 24 h | 1 h (24x7 page) / 8 h | 30 min / 4 h |
| S2 | Major feature degraded, workaround exists | 1 bus. day / 3 d | 4 h / 2 d | 2 h / 1 d |
| S3 | Question / minor bug | 2 bus. days | 1 bus. day | 4 h |
| S4 | Feature request | best effort | best effort | acknowledged in 2 d |
Breach warnings at 75% of SLA to the owner of the ticket and Slack #support. Launch reality: a single on-call person; S1 24x7 pages for all plans because a down platform is down for everyone.
- **Support AI**: Ticket Summarizer, suggested reply from help articles (Suggest only, staff sends). No auto-replies to customers at launch.
- **Buy vs build**: build ticket model in console (we already have all context and the Account 360), email in/out via our existing transactional email; buy nothing at launch, or Crisp Mini ($45/mo) if chat widget is wanted sooner (section 20).

---
## 5. Tenant directory and Account 360 (fields)
**Directory columns**: Company, plan, trucks (used/limit, red if over limit + grace days left), credits (included left / top-up balance), health score (0-100, color), MRR, last active (any user), created, country/state, flags (kill switch on, mode Test/Live), open tickets, integrations red count. Bulk actions: export (audited), message (announcement), add tag.

**Account 360 tabs**
| Tab | Contents |
|---|---|
| Overview | Plan, trucks, MRR, health score with top 3 drivers, owner contact, signup date, Test/Live mode per department, open alerts, open tickets, notes, quick actions (View as, Adjust credits, Resend invite, Kill bot, Change plan) |
| Users | Users/roles/last login/2FA, invite status, locked accounts; actions: resend invite, force logout, unlock (no password views) |
| Usage | Loads, invoices, drivers active, texts, voice minutes, storage, API calls; credits by bot, 30/90 days; trend vs plan average |
| Integrations | Each connection: mode, last success, lag vs normal, token expiry, error rate 24 h, last 5 errors, Reconnect-link, Replay |
| Bots | Per bot: autonomy (Off/Suggest/Auto), mode (Off/Test/Live), version, model route, runs 7 d, success %, escalation %, override/undo %, cost 30 d vs budget; actions: set to Suggest (L2), kill (all staff with reason) |
| Errors | Grouped client + server errors (Sentry links), failed jobs, DLQ items, failed webhooks, validation failures by bot |
| Tickets | Past + open with outcomes, CSAT |
| Billing | Stripe customer/subscription status, invoices, failed payments with retry state, next invoice, payment method brand/last4 only |
| Credits ledger | Append-only: date, bucket, +/-, source (plan grant, top-up, bot run id, adjustment, expiry), running balance |
| Audit | Customer's own sensitive actions + every staff access to this tenant |
| Notes | Staff notes, onboarding checklist, sales history |

---
## 6. Billing console
- **Plans catalog** (read-mostly): Solo $39/300, Core $97/1,000, Growth $249/4,000, Enterprise custom. Plan config is data (versioned), not code; changes apply to new subscriptions, existing subscribers grandfathered unless migrated.
- **Credit operations**: monthly grant at renewal (included, expires month end; unused included never rolls), top-up purchases (1,000 $25 / 5,000 $110 / 20,000 $400; roll over), staff grants, adjustments, expiry job. Consumption order enforced: included first, then top-up. All as ledger rows.
- **Stripe status panel**: webhook last received, failed webhook count, sync lag, subscription/invoice mismatch count (Stripe vs our plan table), dunning state per tenant. A nightly **Stripe reconciliation** diff list (plan mismatch, missing subscription, paid-but-locked) must be zero or pages Finance.
- **Failed payments**: list with attempt count, next retry, grace; macros: "update card" email with portal link. Dunning flow (workflow): day 0 email, day 3, day 7 banner, day 14 downgrade to Suggest/Off bots (workflows and drivers keep running), day 30 read-only; never lock drivers out.
- **Refunds**: Finance proposes, Owner approves > $100; Stripe refund executed with reason code; pro-rata guidance (first 14 days full refund policy to be decided, Q1).
- **Plan change flows**: upgrade (immediate, proration preview, credits difference granted pro-rata), downgrade (effective next renewal; warning if trucks > new limit: 30-day grace, nothing blocked), truck-limit overage prompt ("You have 4 trucks on Core, upgrade to Growth"), Enterprise conversion via Pipeline.
- **MRR dashboard**: MRR by plan, new, expansion (upgrade, top-ups shown separately as non-recurring), contraction, churn, trial-to-paid, ARPA, top-up revenue, failed-payment at-risk MRR.
- **Tax/receipts**: Stripe handles invoices/tax config; we store nothing card-related (PCI SAQ-A).

---
## 7. Enterprise sales pipeline (data model)
Lead: company, MC/DOT, trucks, source, contact, notes, owner, stage, timestamps. Quote: version, inputs, guardrail output, margin, approver, PDF, status (Draft, Sent, Accepted, Expired). Stage automation: Contact Sales > auto-email + booking link; Demo booked > create demo tenant; Quote sent > follow-ups at +3/+7 days; Won > provisioning checklist; Lost > reason. Stuck-lead rule: no activity 5 days = reminder.

**Quote calculator formula (internal, never public)**
- Base: $249 + $10 x (trucks - 25). Credits: 4,000 + 160 x (trucks - 25). Examples: 35 = $349 / 5,600 credits; 100 = $999 / 16,000 credits (matches locked doc, 160 x 75 = 12,000 + 4,000).
- Adders (suggested defaults to be tuned): extra legal entity (MC/DOT) $25/mo, named support/SLA $99-299/mo, extra voice minutes bundle priced at cost x 1.8, custom integration one-time fee, annual prepay discount up to 10%, onboarding fee optional.
- Margin check: cost = credits x $0.01 + trucks x $2 + 3% of price (+ voice minutes quoted); **floor gross margin >= 60% at full credit use**. Example 35 trucks: cost = 56 + 70 + 10.5 = $136.5 -> margin 61%. At 100 trucks: 160 + 200 + 30 = $390 -> 61%. Below 60% blocks Send unless Owner approves with reason. Support time not included (known gap).
- **Quote helper (AI, Fast/Balanced)**: reads quote inputs + notes, drafts email and a plain-language scope summary; never sets prices.

---
## 8. Feature flags, kill switches, releases
- **Flags**: key, type (boolean/percentage/tenant-list/plan), default, owner, expiry date (stale flags reported), environments. Evaluated server-side from the tenant record; client receives results only. Buy PostHog (free 1M flag requests/mo) or build on a `flags` table; recommendation: **build on the DB table** (we need per-tenant + plan + Test/Live anyway, and the Bot Control Center already has switches) and use PostHog only for marketing experiments.
- **Kill switches** (three scopes): global per bot, per tenant per bot, per vendor/integration (e.g., "disable all outbound SMS", "disable voice"). Effect enforced in the Outbound Queue and AI Gateway steps (before send/model call), takes < 60 s, shows in customer Bot Control Center as "Paused by support". Any staff can kill with reason; only L2+ can re-enable; Owner is paged on global kills.
- **Releases**: release record (version, git sha, change list, migrations, flags involved, canary result). Rollout stages: **internal tenant** (our own fleet, always first) > **5% of tenants** (opt-in beta cohort first, then random excluding Enterprise and tenants with open S1) > **25%** > **100%**. Auto-promote after N hours if error rate, canaries, and bot metrics are within thresholds; auto-halt on regression; one-click rollback. Database migrations are expand/contract so rollback is safe. Release notes feed Announcements.
- **Maintenance windows**: scheduled, announced 48 h ahead, pause non-critical jobs.

---
## 9. Usage and cost analytics
- Per tenant per month: revenue (plan + top-ups), AI cost (by job/bot/model from Gateway logs), telephony cost (SMS segments, voice minutes), email/storage/ELD estimates, payment fees, **margin $ and %**. Per plan: average, p10, p90, number of tenants below floor (Solo 84% / Core 81% / Growth 61% at full use targets from locked doc).
- **Credit accuracy**: compare credits charged vs actual vendor cost per run (1 credit = $0.01). Drift > 15% over a week on a job = alert (price/route changed).
- **Abusive/anomalous usage detection** (WORKFLOW rules, daily + hourly): tenant burns > 3x its 30-day median credits/hour; credits used > 80% in first 5 days of month; one user generating > 50% of runs; SMS volume spike with high STOP/complaint rate (A2P risk); outbound voice calls to many distinct numbers (dialer abuse); repeated failed payments + high usage; signup patterns (many tenants same card/IP); shared-credential logins. Action ladder: notify staff > auto-switch bots to Suggest > hold outbound > Owner review. Never silently throttle drivers.
- **Anomaly Explainer (AI)**: for each cost alert, writes "likely cause" from supplied facts (which bot, which job, versus baseline) with validator that every number comes from the data.
- Views: cost per run by job vs budget; top 20 cost tenants; vendor spend vs invoice (monthly true-up, catches billing drift); forecast month-end spend.

---
## 10. Customer health and churn risk
Score 0-100, recomputed nightly (WORKFLOW, transparent weights, shown in Account 360):
| Signal | Weight | Red when |
|---|---|---|
| Weekly active users / seats | 20 | drops > 40% vs 4-week avg |
| Core loop usage (loads created, invoices sent) | 20 | down > 30% |
| Integrations healthy (QuickBooks, ELD, SMS) | 15 | any critical connection red > 3 days |
| Bots used & trusted (runs, override/undo rate) | 15 | override rate > 40% or all bots Off |
| Support pain (open tickets, S1/S2 in 30 d, CSAT) | 10 | 2+ S2 or CSAT <= 2 |
| Billing (failed payments, downgrade views) | 10 | failed payment or cancel page visit |
| Onboarding progress (first load, first invoice, driver app installs) | 10 | stuck at < 3 steps day 14 |
Churn-risk list sorted by MRR x risk; playbooks: "integration dead > 3 days: reconnect call", "no login 10 days", "trial day 10 without first load: onboarding call". Weights re-fit quarterly against real cancellations (V2 simple logistic regression). An AI "why at risk" sentence is optional, Fast model.

---
## 11. Announcements
In-app banner (targeted by plan/tenant/flag), email, release notes page, maintenance and incident banners (auto from Incidents), "What's new" dot. Templates with variables. Approval: Owner for all-tenant sends. Every send logged with recipients; opt-out honored for marketing but never for service notices.

---
## 12. Compliance, audit and staff access policy
- **Immutable audit log** (append-only table + daily hash chain + export to cold storage): staff login/logout, every Account 360 tab view (tenant id, tab, user), view-as sessions, break-glass, credit adjustments, refunds, flag/kill changes, release actions, quote approvals, exports, AI-log reads, role changes. Retention 2 years (7 for billing). Customers see their own tenant's staff-access entries.
- **Least privilege**: roles in section 1; default none; Account 360 requires a ticket or alert id for L1/L2 (typed in once per tenant per day, logged); elevation is JIT (30-60 min), approved by Owner, auto-expiring; quarterly access review checklist.
- **No SSN visibility, ever**: SSN, bank account/routing, card numbers are encrypted fields; the console API returns only last 4 or a "present/absent" flag; no role has an unmask endpoint. Engineering DB access: no standing prod access; break-glass read replica with column-level masking; secrets in vault.
- **Driver PII** (license no., DOB, address, medicals, drug test results, pay): masked in Account 360 and view-as by default; reveal only to Owner with reason in a break-glass session with customer notice (and drug test/medical never revealable by staff).
- **Customer data requests**: export/delete workflow with checklist; DPA available; US data residency (consistent with AI Gateway rule: US-resident or zero-retention endpoints only).
- **Staff security**: Google SSO + hardware key/2FA, device posture where possible, session 8 h, IP allowlist optional, offboarding checklist (same-day revoke), no shared accounts.
- **Ethics line**: staff may not browse customers without ticket/alert; periodic sampled review of audit logs by Owner.

---
# PART 2 — BOT & SYSTEM MONITORING PLAN ("we must know before customers do")

## 13. Registry of all deployed bots, versions, models
Source of truth is the AI Gateway config + Bot Control Center registry (command_platform 5B). Console view adds live deployment state.
| Field | Meaning |
|---|---|
| bot_id / name / department | e.g., `doc_reader` (Dispatch/Accounting), `inbox_triage`, `reply_drafter`, `driver_text`, `detention_billing`, `short_pay_dispute`, `collections`, `dispatch_planner`, `check_call_voice`, `recruiting_text`, `recruiting_voice`, `maintenance_triage`, `morning_brief`, `ask_company`, `report_assist`, `alert_explainer`, `import_mapper`, `smart_search`, plus staff-side `ticket_summarizer`, `anomaly_explainer`, `quote_helper` |
| bot version | prompt + schema + validator bundle, semver, git sha, changelog; immutable |
| job + tier + route | primary, escalation, fallback list with **pinned dated model ids** (e.g., Fast: Gemini 3.1 Flash-Lite > gpt-6-luna > Haiku 5.5; Balanced: Gemini 3.6 Flash > Sonnet 5.5; Smart: Sonnet 5.5 > Opus 5.5 / gpt-6.1-sol / Gemini 3.1 Pro; Voice: Vapi/Retell cascade Deepgram + Haiku 5.5-class + ElevenLabs Flash, fallback gpt-realtime-2.1-mini) |
| rollout state | Shadow / internal / 5% / 100% per version |
| tenants on version | count and list, autonomy distribution |
| owner, runbook, budget per run, cap | tied to alerts |
| data class | PII allowed? zero-retention endpoints only? |
A **model inventory** table lists every vendor model in use with its retirement/price-change dates (e.g., Gemini 3.8 Flash price rise 2027-01-01 per AI_Model_Comparison) and raises a ticket 60 days before a known deprecation.

## 14. Per-bot metrics (computed from Gateway run logs; dashboard per bot, per version, per tenant)
| Metric | Definition | Alert threshold (starting values) |
|---|---|---|
| Runs | count/hour/day, vs 7-day same-hour baseline | 0 runs when baseline > 0 for 2x expected interval (silent-failure rule); > 3x baseline |
| Success rate | passed validators first try / runs | < 90% (S3), < 75% (S2) |
| Validation-failure rate | JSON schema, totals, "number must exist in context", policy filter | 2x 7-day baseline |
| Escalation rate | % cascaded to stronger model (expect 5-15% docs [E]) | > 25% or doubling |
| Human escalation rate | handed to human | trend alert |
| Latency p50 / p95 | per job; voice: time-to-first-word | p95 > 2x baseline or above job SLA |
| Cost per run vs budget | actual vendor cost / budget in registry | > 1.5x budget over 1 h window (S3), > 3x (S2) |
| Human override / undo rate | edits to drafts, rejects of Suggest, Undo clicks in 30-s window, Auto actions reverted | > 30% for Suggest, > 10% for Auto (auto-demote to Suggest at > 20%, S2) |
| Confidence distribution | histogram, % below threshold | median drops > 0.1 vs baseline (drift sign) |
| Tool-call error rate | for tool-using bots | > 5% |
| Customer outcome | e.g. POD found, invoice accepted without edit, dispute won | weekly review |
Cross-cut views: by tenant (find the one customer with a bad doc type), by model (find vendor drift), by version (compare to previous).

## 15. Nightly golden-set evals and regression tests
- **Golden sets** (stored in repo, redacted/synthetic or consented real docs with all PII removed): ~100 rate-cons/BOLs/invoices (varied brokers, scans, photos, rotated), ~50 ask-your-company questions with expected tool calls/numbers, ~40 triage messages (incl. STOP/HELP, safety words), ~30 driver-text intents, ~20 dispute/collections drafts (graded by rules: required facts present, no invented amounts, no banned phrases), ~20 maintenance photos, 20 voice scripts via simulated call (ElevenLabs/Vapi test mode).
- **Nightly run** (02:00 local, Batch API 50% off where possible): each job x each route in the registry (primary AND fallback models, so a failover is already proven). Cost target < $3/night [E: ~300 cases x $0.005-0.02].
- **Scoring**: deterministic checks first (JSON valid, totals equal, field exact match, forbidden-content regex), then LLM-as-judge only for draft quality (Smart model, sample of 20). Results stored per (bot version, model, date).
- **Gates**: pass rate must be >= baseline - 2 pts for release promotion; < baseline - 5 pts nightly = S2 alert + auto-switch route to previous best model for that job if Owner pre-approved. Model swap or prompt change cannot ship without a passing run on the full set (CI check).
- **Regression capture**: every confirmed production bad output (override with reason, support ticket) is added to the golden set (one click "Add to golden set" on a run) so a bug can only happen once.
- Evals dashboard: pass-rate trend lines per job/model, diff view of failing cases.

## 16. Synthetic canary transactions (test tenant, scheduled)
A dedicated **canary tenant** (flagged `is_canary`, Test-style data, real vendor paths where cheap) is excluded from revenue/health analytics. Canaries run end to end through the same code paths and queues customers use. Cost estimate: ~$15-40/mo total [E] (SMS segments, a few voice minutes, tokens).
| Canary | Schedule | Steps | Pass criteria | Pages |
|---|---|---|---|---|
| Rate-con read | every 30 min | upload a fake rate-con PDF + photo variant > Doc reader > compare JSON to expected | all fields match, < 30 s, cost <= budget | S2 after 2 fails |
| SMS outbound + inbound round-trip | every 5 min | send to a vendor-owned test number that auto-replies > inbound webhook > triage | reply seen in inbox < 60 s | **S1 after 2 fails** (the Sep 18 silent-drop case) |
| STOP test across SMS + voice | hourly + after each release | canary driver number texts STOP > opt-out recorded > next outbound blocked by queue; voice campaign skips that number; HELP returns text; START re-enables | suppression active < 10 s on both channels, no message leaves | **S1 immediately** (legal) |
| Test voice call | hourly business hours, daily off-hours | bot calls a test line, scripted answers, checks greeting latency, transcript contains expected key phrases, recording consent line played, call ends cleanly | time-to-first-word < 2 s, script completed | S2 |
| Test invoice send | every 2 h | create invoice in canary tenant > render PDF > send email to monitored inbox > link opens > mark paid via test mode | email delivered < 2 min, PDF checksum sane | S2 |
| Webhook round-trip | every 5 min | each provider's test event (Stripe test mode, Twilio status callback, ELD vendor sandbox, QuickBooks sandbox ping) > gateway > processed > DLQ empty | processed < 30 s, signature verified | S2; Stripe webhook S1 |
| Integration token check | every 15 min | exercise sandbox connections (QuickBooks sandbox, Gmail test mailbox) | token refreshes OK | S3 |
| Geofence/scheduled-job tick | every 15 min | canary truck ping moves into geofence > arrive event created, ETA recalculated | event within 2 min | S2 (the "geofence never ran" case) |
| Login + core UI journey | every 5 min | Checkly/Playwright: sign in, open dispatch board, create load, driver app loads | all steps < 10 s | S2 |
| Bot action safety | nightly | Auto-mode bot with a money-words draft must NOT send (policy filter) | blocked | S1 if it sends |
| Backup restore sanity | weekly | restore latest backup into scratch DB, row counts | OK | S2 |
Every canary writes a heartbeat; a **missed canary** (did not run) alerts like a failure. The canary runner is separate from the main scheduler (different host/vendor) so it cannot die together with what it watches.

## 17. Vendor / model drift, failover, and outage detection
- **Detection** (per vendor and per model): error rate (429/5xx/timeouts) over 5-min window, latency p95, empty/truncated output rate, validation-failure rate, cost per run, token counts for the same golden prompt (token drift reveals tokenizer/model change), nightly golden-set score, response `model` field mismatch vs pinned id. Plus external status feeds (Anthropic, OpenAI, Google AI, Twilio-class SMS vendor, Stripe, Vapi/ElevenLabs, Deepgram, Supabase/host, QuickBooks, Samsara/Motive) polled every 1-2 min, read as hints not truth (our own error rate wins).
- **Automatic cross-vendor failover** (Gateway circuit breaker): if a model's error rate > 20% for 3 min or timeouts > 10%, route flips to the next entry in the job's fallback list (Gemini <-> OpenAI <-> Anthropic <-> US-hosted open-weight third). Half-open probe every 2 min with 1% traffic; automatic return when 5 consecutive probes pass. Failover only among models whose golden score >= threshold and whose data class is allowed (no PII to non-approved vendors). Failover event = S3 alert (S2 if the fallback list is exhausted).
- **Drift alarm**: nightly golden score drop > 5 pts, or output-format/length change > 2 sigma on canary prompts, with unchanged pinned version = "silent model change": S2 ticket, route to prior vendor, open vendor support ticket.
- **Voice/SMS carrier outage**: voice canary fails 2x > pause outbound campaigns (queue holds), fall back to SMS/notify humans; SMS vendor delivery rate < 85% over 15 min or A2P campaign status change > pause marketing-type sends, S1 if transactional.
- **Cost-drift**: vendor price changes caught by monthly invoice true-up and a "price table" check comparing registry prices against the vendor pricing pages (manual quarterly + a scheduled fetch that flags a diff).

## 18. Stuck queues, dead letters, integrations, scheduled jobs (explicit silent-failure design)
| Silent failure (ANH precedent) | New design | Alert |
|---|---|---|
| QuickBooks dead 4 months | Every connection has `last_success_at`, `expected_interval`; token expiry date tracked; refresh attempted 7 days before expiry; Integration Fleet Health sorts worst first | Customer owner email + in-app banner at 7 days before expiry, at expiry, and daily after; **staff alert S3 at expiry+24 h, S2 if > 3 days and tenant is Growth+**; sync lag > 2x normal = S3; churn-risk score hit |
| Geofence never ran | **Scheduler registry**: every job has expected cadence and heartbeat; "not run in 2x interval" turns red and notifies admins within 5 min (per command_platform Health Board) | Missing heartbeat = S2; geofence canary (section 16) |
| SMS inbound dropped since Sep 18 | Inbound-volume baseline per tenant and globally; webhook gateway counts received vs processed vs DLQ; synthetic round-trip every 5 min; provider delivery/receipt reconciliation daily (vendor message log count vs our count) | S1 on round-trip fail; S2 on global inbound 0 for 20 min (business hours) or tenant inbound = 0 for 24 h where baseline > 5/day |
- **Queue rules**: Outbound Queue oldest-item age > 5 min (SMS/email) or > 2 min (voice) = S2; depth > 5x baseline; retry exhaustion count > 0 per hour = S3; dead-letter queue (DLQ) non-empty > 15 min = S2, > 100 items = S1; each DLQ row shows tenant, error, one-click Replay (idempotent) and "Discard with reason".
- **Document pipeline**: items in `processing` > 10 min; extraction jobs stuck; email-ingest mailbox last message age vs normal.
- **Background job table**: any job failing 3 consecutive runs; any job running > 3x its p95.
- **Database/host**: connection pool saturation, replication lag, disk > 80%, cert expiry < 14 days, domain expiry < 30 days, secrets rotation due, backup age > 26 h.
- **Per-tenant "silence" rules** (the pattern generalizing the above): for each tenant with baseline activity, no events of type X for Y -> staff alert (low severity digest, not paging), plus customer-facing banner where the customer can fix it.

## 19. Credit-ledger reconciliation and cost anomalies
- **Reconciliation (nightly, 03:00)**: for each tenant, balance recomputed from ledger rows must equal stored balance; sum of Gateway run costs (credits) equals ledger debits for the day (+- 0.5%); expiry job ran for every tenant at month end (count tenants vs expiry rows); Stripe top-up payments = top-up grants (no paid-but-no-credits, no credits-without-payment). Any mismatch = S2 to Finance + auto-hold on that tenant's adjustments; discrepancies > $50 total = Owner.
- **Cost anomaly alerts**: global AI spend today > 2x 14-day same-weekday avg; vendor spend vs vendor-side dashboard (daily API check where available); per-tenant credits/hour spike (section 9); runaway loop detector (same bot+entity > 20 runs in 10 min = auto-pause that bot for the tenant, S2); hard daily vendor budget caps set in vendor consoles as the last line.
- **Credit math sanity**: credits per run table vs registry budget; alert if a job's average credits/run changes > 25% week over week.

## 20. Severity, routing, on-call, runbooks, incidents, status page
| Sev | Meaning | Examples | Route | Response |
|---|---|---|---|---|
| **S1** | Customer-impacting now or legal/money risk | inbound/outbound SMS down, STOP failing, Stripe webhooks failing, login down, bot sent something it should not, data exposure | Pager call + SMS to on-call, Slack #alerts-critical, email Owner; escalate to Owner after 10 min unacked | ack 10 min, mitigate 1 h |
| **S2** | Major feature degraded, few tenants, or imminent S1 | canary failure x2, DLQ growing, vendor failover exhausted, golden score regression, geofence job missing | Push + Slack #alerts; SMS to on-call within business hours, page at night only if > 30 min | ack 30 min, same day |
| **S3** | Degradation with workaround, single tenant, cost drift | token expired at one tenant, failover occurred, cost 1.5x budget | Slack #alerts-low, daily digest email | next business day |
| **S4** | Info | version rollouts, recon passed | digest | none |
- **Alert hygiene**: each alert has owner, runbook link (required to ship the alert), dedupe key, auto-resolve rule, suppression during maintenance windows, weekly review of noisy alerts (alert that fired > 5x without action gets fixed or deleted). Target: < 5 pages/week.
- **On-call**: launch = Abdel primary, one engineer/contractor secondary, 1-week rotation when team >= 3; quiet-hours policy: S1 only at night; vacation overrides; phone must be able to bypass Do Not Disturb. Paging app handles escalation policy (ack timeout 5-10 min > secondary > Owner).
- **Runbooks** (one page each, in repo `/runbooks`, linked from alerts): RB-SMS-IN (inbound dead), RB-SMS-OUT, RB-STOP-FAIL, RB-VOICE-DOWN, RB-VENDOR-AI-OUTAGE (failover check, manual route flip), RB-DLQ, RB-STRIPE-WEBHOOK, RB-QB-TOKEN, RB-ELD-SYNC, RB-GOLDEN-REGRESSION, RB-COST-SPIKE, RB-RECON-MISMATCH, RB-DB, RB-DEPLOY-ROLLBACK, RB-DATA-EXPOSURE. Format: symptom, impact, check list (3-6 steps with links), mitigation, rollback, comms template, owner.
- **Incident process**: Declare (auto for S1) > assign Incident Commander (on-call) > Slack channel `#inc-YYYYMMDD-name` auto-created > updates every 30 min (S1) > status page post within 15 min of confirmed customer impact > mitigate > resolve > customer notice > blameless postmortem within 3 business days (what, impact count/tenants, timeline, detection gap: "did we know before customers?", fix, new alert). Postmortems stored in console, linked to tickets. Track MTTD (mean time to detect), MTTR, "found by customer" count (goal: 0 S1 found by customers).
- **Public status page**: status.<product>.com with components: Web app, Driver app, SMS, Voice calling, AI features, Email, Integrations (QuickBooks, ELD), Payments/Billing; history, subscribe (email/SMS), maintenance. Component status is set manually by IC on S1/S2, with auto-suggest from canaries; auto-post "investigating" only for S1 to avoid false alarms.
- **Proactive customer notification templates** (stored in Announcements; variables {{tenant}}, {{start}}, {{impact}}, {{eta}}):
  1. *Investigating*: "We're seeing {{impact}} since {{start}}. Your data is safe. We're working on it; next update by {{time}}."
  2. *Workaround*: "{{feature}} is delayed. Meanwhile do {{workaround}}. Nothing is lost; queued items will send automatically."
  3. *Resolved + catch-up*: "Resolved at {{end}}. {{n}} messages/events were delayed and have been replayed. No action needed. [See list]"
  4. *Integration action needed (per tenant)*: "Your QuickBooks connection expired on {{date}}; invoices are not syncing. Reconnect in 2 clicks: {{link}}. We'll re-sync missed items automatically."
  5. *Credits-impact apology*: "A bug used {{n}} of your credits; we've restored them."
  6. *Maintenance*: 48 h ahead with window and impact.
  7. *Security/data*: legal-reviewed template, Owner-approved only.
  Affected-tenant lists are **computed** (gap analysis), not guessed; notices go to tenant Owners and the ticket threads.

## 21. Shadow mode and staged rollout for new bots/models
1. **Offline**: golden-set eval must pass (section 15) and cost per run within budget.
2. **Shadow**: new bot/model version runs **in parallel on live traffic**, output stored but never used (no sends, no writes); compare vs the live version/human outcome: agreement rate, validation failures, cost, latency, confidence. Duration >= 3 days or 500 runs. Shadow cost doubles for that job, so sample 10-20% unless a high-risk bot.
3. **Internal tenant** (our own fleet, Live): 100% of internal traffic, 3-7 days.
4. **5% canary** of eligible tenants (opt-in beta group first; exclude Enterprise, tenants with open S1, tenants in Auto for money bots); Suggest-only for customer-facing and money bots in this stage even for tenants set to Auto. Hold 3 days.
5. **25% > 100%** with auto-halt rules: override rate +5 pts, validation failure 2x, escalation rate 2x, cost per run +30%, any S1; rollback is a registry pointer flip to previous version (previous version retained 30 days).
6. Model swaps (vendor changes a model alias, we change primary) follow the same ladder; pinned dated ids mean no silent swaps; vendor-forced migrations get a calendar entry.
7. Hard rule: bots that move money, send legally sensitive messages (STOP/consent, adverse action), or place voice calls never skip the shadow + internal stages.

## 22. Privacy of AI logs
- Gateway **masks SSN, bank/routing numbers, card numbers, DOB, and license numbers before any model call** (reuses the platform masking step); drivers' medical/drug-test data never sent to models. Prompts/responses stored as redacted text; originals of customer documents stay in tenant storage, referenced by id, not duplicated in the log DB.
- **Retention**: full redacted traces 30 days; metrics/aggregates 13 months; flagged/golden-set samples retained only after PII strip and tenant opt-in (terms of service clause); voice recordings per tenant setting and state consent law (default 30 days, transcripts 90); delete on tenant offboarding within 30 days. Vendor side: zero-retention or US-resident endpoints only (AI Gateway rule); no training on our data; confirm per vendor in DPA.
- **Who can read prompts**: nobody by default. Engineer and L2 can read **redacted** traces by run id after entering a ticket/alert id (audited; shown to the tenant in "support access history" if it includes their data). Raw/unredacted logs do not exist. Viewing a trace never exposes other tenants (tenant-scoped query enforced). Owner sees aggregate metrics only unless debugging. Export of AI logs disabled.
- **LLM observability tool configuration**: send only redacted payloads; hashed tenant id; no user names; sampling 100% of failures, 10% of successes to control volume and cost.

---
## 23. Recommended pragmatic stack (build vs buy), pricing checked 2026-10-10
Principle: buy commodity plumbing (error tracking, paging, uptime, status page); build what is specific to us (Account 360, ledger recon, canaries logic, bot metrics, flags, audit) because it reads our own tables and costs only dev time. Third-party pricing pages are cited via search results; confirm on vendor sites before purchase (some sources conflict, noted).
| Need | Recommendation | Build/Buy | Monthly cost (launch) | Source |
|---|---|---|---|---|
| Error tracking (web, driver app, functions) | **Sentry Team** (Developer free to start) | Buy | $26 (sources: $26; one lists $29) | [Capterra](https://www.capterra.com/p/165426/Sentry/pricing/), [CostBench](https://costbench.com/software/developer-tools/sentry/free-plan/) |
| LLM observability / traces | **Langfuse Cloud Core** (Hobby free: 50k units, 30 d, 2 users; Core 100k units, 90 d) — or build on Gateway run table first | Buy (or build) | $0-29 | [Langfuse docs snapshot](https://js-sdk-v4-docs-snapshot.langfuse.com/pricing/), [ZenML](https://www.zenml.io/blog/langfuse-pricing) |
| Uptime + heartbeat monitoring (cron/queue heartbeats), on-call paging, incident mgmt, status page | **Better Stack**: free tier = 10 monitors, 1 status page, Slack/email; paid responder license ~ $29/mo each (annual) / $34 monthly incl. phone+SMS alerts, on-call, incident mgmt, status page | Buy | $0 start; **$29-58** with 1-2 responders | [Better Stack pricing](https://betterstack.com/pricing?cid=482), [Hyperping comparison](https://hyperping.com/blog/betterstack-pricing) |
| Synthetic browser monitoring (login/UI journey) | **Checkly Hobby** free (10 uptime monitors, 1k browser runs, 10k API runs/mo); Starter if needed (sources conflict $24-29; browser overage $6.50 per 1k) | Buy | $0 (to ~$29) | [Checkly pricing](https://www.checklyhq.com/pricing.md), [CostBench](https://costbench.com/software/browser-testing/checkly/) |
| Business-logic canaries (SMS/STOP/voice/invoice/webhook) | Own runner (scheduled functions on a separate host, e.g., small VM or GitHub Actions cron) writing heartbeats to Better Stack | Build | ~$5 host + ~$15-40 vendor usage | n/a |
| Status page | Included in Better Stack; alternative **Instatus Pro** $20 ($15 annual), Business $300 | Buy (bundled) | $0 (bundled) | [Hyperping on Instatus](https://hyperping.com/blog/instatus-pricing), [ToolQuestor](https://toolquestor.com/vs/instatus-vs-statusio) |
| Feature flags | DB table + console (build); PostHog free flags only for marketing site | Build | $0 | [PostHog pricing](https://posthog.com/pricing) |
| Product analytics + replay (marketing site/signup funnel only) | **PostHog** free tier: 5,000 recordings/mo, 1M flag requests/mo | Buy | $0 | [PostHog](https://posthog.com/pricing), [replay pricing](https://posthog.com/session-replay/pricing) |
| Support chat / helpdesk | Launch: built-in tickets + email. Optional **Crisp** Mini $45 (4 seats), Essentials $95 (10 seats); price per workspace, conflicting reports on Feb 2026 changes | Build first | $0 (or $45) | [Drag](https://www.dragapp.com/blog/crisp-pricing/), [Featurebase](https://www.featurebase.app/blog/crisp-pricing) |
| Logs | Host-native logs + Better Stack Logs/Sentry; retain 14-30 d | Buy (bundled) | $0-10 | vendor |
| Secrets/audit cold storage | Cloud object storage with object lock | Buy | ~$1-3 | n/a |
| Ops console itself | Build (React + same DB, RLS-bypassing service role behind staff gateway) | Build | dev time | n/a |

### Monthly running cost of console + monitoring stack
| Scenario | Tools | Estimate/mo |
|---|---|---|
| **Lean launch (0-50 tenants)** | Sentry Team $26 + Better Stack (1 responder) $29-34 + Langfuse Hobby $0 + Checkly Hobby $0 + PostHog free $0 + canary vendor usage $15-40 + canary host $5 + eval runs (~$3/night x 30 = $90 at upper estimate; ~$30 if Batch + sampling) | **~$110-230** (typical ~$150) |
| **Growth (50-300 tenants)** | Sentry $26-80 + Better Stack 2 responders $58-68 + Langfuse Core $29-60 + Checkly Starter ~$29 + Crisp Essentials $95 (optional) + canary/evals $60-100 | **~$300-450** |
| Scale (300+) | add on-call seats, Langfuse Pro $199 or self-host, log volume | $600-1,000 |
At 50 tenants x average ~$150 MRR = $7,500 MRR, the lean stack is ~2% of revenue. All figures [E] from third-party price pages; verify on vendor pages. AI usage inside the console (ticket summaries, anomaly explanations, quote drafts) is ~$0.002-0.01 per use, under $5/mo.

---
## 24. Feature table
| Feature | What it does | WORKFLOW / AI BOT / HYBRID (+why) | Exists in ANH? | Plan relevance | Priority |
|---|---|---|---|---|---|
| Staff roles & SSO/2FA | 6 roles, JIT elevation | WORKFLOW (rules) | N | All | Launch |
| Tenant directory | Search/filter/sort | WORKFLOW | N | All | Launch |
| Account 360 | Per-tenant tabs, read-only | WORKFLOW | N | All | Launch |
| View-as-customer | Read-only, time-boxed, consented/break-glass, masked | WORKFLOW (security rules) | N | All | Launch (consent path); break-glass Launch |
| Help widget + context bundle | Ticket with auto context | WORKFLOW | N | All (SLA by plan) | Launch |
| Ticket summarizer | 3-line summary of thread + context | AI BOT (language; Fast model) | N | internal | Launch |
| Suggested reply from help articles | Drafts for staff to send | AI BOT (Suggest only) | N | internal | V2 |
| Issue queue + SLA clocks | Sorting, breach warnings | WORKFLOW | N | All | Launch |
| Session replay (product) | Not at launch (PII) | — | N | — | Later (opt-in) |
| Billing console + Stripe status | Plans, failed payments, refunds | WORKFLOW | N | All | Launch |
| Credit grants/adjustments + ledger | Append-only, approvals | WORKFLOW | N | All | Launch |
| Credit reconciliation | Nightly ledger vs usage vs Stripe | WORKFLOW | N | All | Launch |
| Enterprise pipeline + demo booking | Kanban, automations | WORKFLOW | N | Enterprise | Launch (simple) |
| Quote calculator (guardrail) | Formula, margin check, PDF | WORKFLOW (deterministic math) | N | Enterprise | Launch |
| Quote email helper | Drafts cover email | AI BOT (writing) | N | Enterprise | V2 |
| Plan upgrade/downgrade flows | Proration, 30-day grace | WORKFLOW | N | All | Launch |
| Feature flags, per-tenant kill switches | Gate features/bots/vendors | WORKFLOW | N | All | Launch |
| Release & staged rollout mgmt | Internal > 5% > 25% > all, rollback | WORKFLOW | N | All | Launch (basic: internal > all); staged V2 |
| Usage & cost analytics, margin per plan | Revenue vs cost | WORKFLOW | N | All | Launch (basic); full V2 |
| Abuse detection rules | Spike, STOP rate, dial pattern | WORKFLOW | N | All | Launch (3 rules); V2 rest |
| Anomaly explainer | Plain-language cause for cost/health alerts | HYBRID (rule fires, AI words it) | N | internal | V2 |
| Customer health & churn risk | Weighted score, playbooks | WORKFLOW | N | All | V2 (score v1 at launch is just 3 signals) |
| Announcements/status notices | Banners, email, templates | WORKFLOW | N | All | Launch |
| Compliance & access audit log | Immutable, exportable | WORKFLOW | N | Enterprise export | Launch |
| Bot registry + per-bot metrics | Versions, models, runs, cost, override | WORKFLOW | Partial (command_platform registry) | All | Launch |
| Nightly golden evals | Pass-rate gates | WORKFLOW (+ AI judge for drafts only) | N | internal | Launch (docs, triage, STOP); rest V2 |
| Synthetic canaries | Section 16 set | WORKFLOW | N | internal | Launch (SMS RT, STOP, webhook, login, rate-con); voice/invoice by V2 |
| Vendor drift + auto failover | Circuit breaker, golden scoring | WORKFLOW | N | All | Launch (failover); drift V2 |
| Dead-letter/stuck-queue monitors | Age/depth rules, replay | WORKFLOW | Partial (health board) | All | Launch |
| Integration token/sync-lag fleet board | Expiry, lag, silence rules | WORKFLOW | Partial | All | Launch |
| Alert routing, on-call, runbooks | Pager, escalation | WORKFLOW (bought tool) | N | internal | Launch |
| Incident mgmt + status page + notice templates | Declare, timeline, notify | WORKFLOW | N | All | Launch |
| Shadow mode + staged bot rollout | Parallel run, compare | WORKFLOW | N | All | V2 (manual internal-first at launch) |
| AI log viewer with redaction + access gate | Per-run traces | WORKFLOW | N | internal | Launch (minimal) |

---
## 25. AI bots in the console (modest)
| Bot | Trigger | Model | Tokens | Cost/run | Autonomy |
|---|---|---|---|---|---|
| Ticket Summarizer | ticket created/updated > 6 messages | Fast, Gemini 3.1 Flash-Lite (fallback gpt-6-luna) | 3k in / 200 out | 3,000 x $0.25/1M + 200 x $1.50/1M = **$0.0011** | internal, Auto |
| Anomaly Explainer | cost/health/alert rule fired | Balanced, Gemini 3.6 Flash (fallback Sonnet 5.5) | 3k in / 300 out | 3,000 x 0.75/1M + 300 x 3.75/1M = **$0.0034** | writes explanation only; validator: numbers must exist in facts |
| Quote Helper | Sales clicks "Draft email" | Balanced, Gemini 3.6 Flash | 4k in / 600 out | 4,000 x 0.75/1M + 600 x 3.75/1M = **$0.0053** | Suggest only; never edits price |
| Help-article reply suggester (V2) | ticket opened | Balanced | 6k in / 500 out | ~**$0.0064** | Suggest only |
Prices from AI_Model_Comparison.md section 1 [V]; tokens [E]. At 500 tickets, 300 alerts, 20 quotes/mo: ~$0.55 + $1 + $0.11 = ~$2/mo. These bots run through the same AI Gateway (job `internal_support`, `internal_explain`) so they are monitored, capped and logged like customer bots; they see redacted data only.

---
## 26. Launch vs V2 priorities
**Launch (blocks go-live; build order)**
1. Alerting foundation: Better Stack heartbeats + paging + status page; Sentry; runbooks for 8 core alerts (SMS in/out, STOP, DLQ, Stripe webhook, QB token, vendor outage, deploy rollback, cost spike).
2. Canaries: SMS round-trip, STOP across SMS+voice-skip, webhook round-trip, login journey, rate-con read; scheduler registry with missed-heartbeat alerts; integration token expiry + sync-lag monitors; DLQ monitor (**these directly cover the three ANH silent failures**).
3. Account 360 + tenant directory + audit log + staff roles + masking; consent-based view-as.
4. Billing console, credit ledger + adjustments, nightly reconciliation, Stripe sync checks, failed-payment dunning.
5. Help widget + ticket queue + SLA clocks + ticket summarizer.
6. Kill switches + basic flags + manual internal-first rollout + rollback.
7. Bot registry + per-bot metrics + AI log viewer (redacted) + cross-vendor failover + nightly golden evals for doc reader, triage, STOP.
8. Contact Sales form + pipeline + quote calculator.
**V2**: staged % rollout automation, shadow mode, full cost/margin analytics and abuse rules, churn model, voice and invoice canaries, break-glass automation polish, announcements segmentation, anomaly explainer, reply suggester, quote helper, Langfuse trace integration, Enterprise audit export, tenant-opt-in replay.
**Later**: public API for status, SOC 2 evidence automation, customer-facing "support access" portal, session replay with mask-all, multi-region.

---
## 27. Risks
| Risk | Impact | Mitigation |
|---|---|---|
| Alert fatigue with one-person on-call | Missed real S1 | < 5 pages/week target, runbook-required alerts, weekly pruning, secondary on-call as soon as possible |
| Canaries share fate with prod (same scheduler/vendor) | Blind spot | Separate runner/host, third-party heartbeat monitor, "canary missing" alert |
| Staff access leaks customer/driver PII | Legal + trust | Masking at API, no SSN unmask, JIT access, audit, customer-visible access history, quarterly review |
| View-as write leakage | Accidental customer changes | Read-only token enforced server-side, outbound blocked, tested per endpoint |
| Over-reliance on vendor status pages | Late detection | Own error-rate and canary signals decide; status feeds are hints |
| LLM judge noise in evals | False regressions | Deterministic checks first; judge only for drafts, thresholds with tolerance |
| Cost of shadow mode doubles AI spend for a job | Margin dip | Sample 10-20%, time-box, budget in registry |
| Tooling prices change / conflicting sources | Budget drift | Quarterly price check; stack replaceable (adapters: pager, status, errors) |
| Credit ledger bug erodes trust/margin | Revenue/disputes | Append-only ledger, nightly recon, adjustments by approval, runs-based reversal |
| Support burden above plan (cost excluded from margin model) | Margin below floor at Solo/Core | Track tickets per tenant per plan in console; self-serve help; cost analytics adds support minutes in V2 |
| Staff offboarding/shared accounts | Insider risk | Same-day revoke, no shared accounts, SSO only |
| A2P/telephony compliance violations | Carrier suspension | STOP canary S1, complaint-rate abuse rule, quiet hours in queue |

---
## 28. Open questions for Abdel (max 6)
1. **Staffing and on-call**: who is secondary on-call at launch (contractor? hire?), and is 24x7 paging for S1 acceptable on all plans, including Solo $39?
2. **Support SLAs per plan**: are the proposed targets (section 4) OK, and should Growth get chat in business hours while Solo/Core are email-only? Is named SLA a paid add-on for Enterprise quotes?
3. **Refund and trial policy**: 14-day full refund? Is there a free trial or demo tenant for Solo/Core, and what happens to unused included credits on cancel (they expire; confirm)?
4. **Break-glass auto-approval**: OK for S1 incidents to auto-approve engineer break-glass with after-the-fact Owner review, or must you approve each time? Also OK that customers are always notified after?
5. **AI log and golden-set consent**: may we keep redacted real customer documents/prompts as golden-set samples (needs a ToS/DPA clause), or synthetic-only?
6. **Build vs buy appetite**: bundle on Better Stack (pager + status + uptime) with Sentry, or prefer separate best-of-breed (e.g., Instatus status page, a dedicated pager) at higher cost; and should chat support (Crisp $45+) be bought at launch instead of built tickets?
