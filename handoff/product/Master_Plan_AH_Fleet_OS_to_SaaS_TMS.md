# Master Plan — Fix A&H Fleet OS, then turn it into a tiered multi-tenant TMS
Date: 2026-10-10. Built from the 5-area audit + 3 research reports (all in this folder). Prices and competitor facts are hypotheses until verified on vendor pages.

## 0. Non-negotiable safety rules (team uses the system daily)
**Key finding:** A&H Fleet OS runs on YOUR OWN Supabase project (id kldiqwkjrhpkcfjlbolw), connected to Lovable — not Lovable Cloud. Therefore:
- A database migration approved in the Lovable editor/chat runs on the LIVE database **immediately**. Edge-function edits deploy to LIVE immediately. "Publish" only controls the frontend. **So "we won't publish" does NOT protect the backend.**
- Drafts/branches protect code only; they share the same database.
- Therefore: **no message is sent to the live Lovable project's agent for any change** until it has been tested elsewhere. Read-only inspection is fine.
- Recruiting workers (5-min cron) are texting/calling real candidates right now. A cloned DB would also carry live tokens and cron jobs and would text/call real people. Staging must be built with scrubbed tokens, unscheduled crons, separate sandbox accounts, and an outbound_mode switch (off/sandbox/live).
- Remix behaviour with a Supabase-connected project is undocumented; it may keep pointing at production. Never remix without verifying the Supabase project id in client.ts/config.toml afterwards.
- Lovable's own revert is documented for code only, not DB or deployed functions.

### Safe workflow
1. **Backup first**: pg_dump/`supabase db dump`, export of storage buckets (daily Supabase backups exclude files), export of cron jobs, git tag, copy of config/secrets list. Confirm Supabase plan backup retention (Pro 7d / PITR ~$100/mo).
2. **Freeze live project**: set Lovable agent permissions to "Ask each time"; agree internally that nobody prompts the live project during this effort. Turn on GitHub sync for the live project (export-only safety copy) so the code is in your GitHub.
3. **Create STAGING**: new Supabase project + new Lovable project (via GitHub-synced copy or verified remix). Verify project ids. Deploy schema + functions with the Supabase CLI. Restore data from the dump, anonymise PII (names, phones, emails, SSN/bank, documents), remove tokens, unschedule all crons, set `outbound_mode=off`. Use separate sandbox GHL/Vapi/Twilio/QuickBooks/Gmail/Telegram apps.
4. **Fix on staging** with additive-only migrations (add columns/tables, backfill, then switch code; never drop/rename in the same release) and DB feature flags so changes can be dark-launched.
5. **Release to live** only after the checklist passes, in order: (a) DB migrations (additive), (b) edge functions, (c) frontend Publish — at a quiet hour, one department at a time, with a rollback note. Rollback = forward-fix; dump restore is last resort.
6. **SaaS build is a separate project** (new Supabase + new Lovable) so the live ANH system is never at risk; ANH is imported later as tenant #1.

### Release checklist (every release)
Backup taken · migration is additive · tested on staging with anonymised copy of real data · outbound_mode verified · role-by-role click-through (dispatch, accounting, HR, shop, driver) · auth on every new/changed function · rollback written · announce to team · post-release 24h watch.

## 1. Order of work
**Track A — Stabilise ANH (live team keeps working)**
- A0 Immediately, no code needed: rotate credentials; confirm email-confirmation setting; take backups; decide who may touch the live project. (Security holes in the audit are urgent but fixed via staging→release, in small surgical releases, not a big bang.)
- A1 Security hotfix release (smallest possible, additive): lock profile-email→role path; require auth on the ~40 verified-dangerous functions (then the remaining ~80); lock storage buckets by role; OTP attempt cap; remove bank numbers from client bundle; encrypt/limit token tables.
- A2 Department-by-department fixes (below).
- A3 Re-enable dormant automations one at a time with outbound_mode and kill switch.

**Track B — Product foundation (separate project)**
- B1 Multi-tenant core: organizations, members, per-org roles, org_id JWT claim, org-scoped RLS, plans/features/feature-flags, per-org integrations & branding, usage metering, generalised job queue (from recruiting queue design).
- B2 Billing (Stripe), self-serve onboarding, import wizards (loads/drivers/trucks/QuickBooks).
- B3 Port modules in tier order; ANH becomes tenant #1.

## 2. Department-by-department bug-fix backlog (Track A2)
Each department: fix on staging → click-through by that dept's leader → release.

**Dispatch / Loads (priority high; daily use)**
- Fill `loads.broker_id` (backfill from brokerage/contacts) and fix broker notification + 4-hourly updates + delay-risk broker factor.
- Driver BOL/POD columns bug (loaded_at/delivered_at) — store timestamps correctly.
- Geofence/arrival: align monitor-geofence with the working Optima integration; schedule monitor-fleet; unify arrival logic.
- Driver suggestions: add HOS, current-load drop-off, deadhead cap, real-time GPS freshness.
- Open items: review LoadBoard, LoadDetailsDialog, DispatchDriverMap, Trucks/Drivers screens (not yet code-reviewed).

**Driver app (PWA)**
- Fix web push (payload encryption, VAPID import, token registration — only 6/48 sessions have one); background location; offline; signature capture; post-trip DVIR; stop deleting prior DVIR on resubmit; DVIR cutoff/timezone configurable.
- Modernise UX; bonuses/streaks/contests (currently empty) as later feature.

**Accounting / Finance**
- Settlements: link statements to loads with locking; unify pay math (one function); implement per_diem/hourly/salary; fix Sunday/week boundary.
- Factoring: use carrier/company fee config + calculate_factoring_costs(); idempotent submit (write before email); fix paid→escrow booking; fix 'Factored' status query; escrow release flow.
- QuickBooks: reconnect (token expired May 29), then fix account mappings; payroll "paid" needs real payment rail or honest manual-mark flow.
- Financial report: correct maintenance cost columns; remove fabricated balance sheet.
- Truck P&L: fix dispatch-fee, weeks, double-counts; fuel import idempotency.
- Add: invoice PDF generation/numbering, AR aging, rate-con generation.

**HR / Recruiting (priority: compliance)**
- Fix inbound message-id drop (231 rejected) so replies/STOP/photos are stored.
- Honor STOP for sms AND voice; have a human review the 3 STOP-like texts; add voice consent wording.
- Repair Vapi webhook (secret/server URL), reconcile 24 stuck 'dialing' calls and 70 completed calls without outcome.
- Fix automation-state gaps (42 leads without state, 14 without location, 113 dead SMS jobs, 64 stopped voice sequences); verify consent trigger requires tick box.
- Lock anon INSERT policy (server-side validation, rate limit, captcha); update stale docs/settings badges.
- Add compliance items: FCRA adverse action, DQ file, e-sign audit trail, A2P/10DLC registration evidence.

**Shop / Maintenance / Road team**
- Auto-prioritise tickets (1,014/1,017 are Medium); remove mock camera feed or implement; stop hallucinated part prices (use real catalogs/quotes); fix driver-AI column errors; UTC business hours → tenant timezone; AI caller disclosure + human approval gate.

**Compliance / Safety**
- Server-side expiry alerts (email/SMS/push); populate drug pool, scores, incidents; fix large-file parse (btoa).

**Communication / Chat / AI**
- Decide fate of internal chat (1 msg/30d); fix shared inbox N+1 gmail; AI usage quotas and per-tenant attribution via an AI gateway.

**Platform / code health**
- strict TS on; frontend tests; single lockfile; replace xlsx; delete one-off functions; dedupe components; route-level role guards; move hard-coded company data to settings.

## 3. Tiers & pricing (draft — validate against vendor pricing pages; priced per ACTIVE TRUCK, unlimited users)
| Plan | Target | Price (hypothesis) | Core contents |
|---|---|---|---|
| Starter | 1–5 trucks, owner-operators | $39/mo flat ≤3 trucks, then $9/truck | Loads, broker book, driver app (status/docs/DVIR), rate-con + invoice PDF, load P&L, fuel import, expiry tracking, load-board links, IFTA |
| Fleet | 6–50 trucks | $14/truck, $149 min | + settlements with locking, factoring/escrow, QuickBooks, ELD map, dispatch board suggestions, maintenance + repair wizard, tracking links, broker auto-updates |
| Enterprise | 50+ trucks | $9–12/truck, $1,500 min + onboarding fee | + multi-carrier entities, EDI/API, geofence/detention, lane analytics, ACH payroll/1099, SSO, white-label, SLA |
| Dispatch Co | dispatch services managing others' trucks | $149 base + $6/managed truck | Multi-carrier workspace, carrier onboarding packets, per-carrier statements & commissions, owner-operator portal |
| Add-on: AI Dispatcher | any | ~$79/mo incl. 200 actions, ~$0.40/action after | See §4 |
| Add-on: Driver Recruiting | any | ~$99/mo + metered SMS/AI-call minutes; screening at cost +15% | Full funnel, SMS cadence, AI voice, apply form, docs, e-sign onboarding |
| Add-on: Safety & Compliance | Fleet+ | TBD | DQ file, drug/alcohol pool, MVR/Clearinghouse, incidents, scores |
| Add-on: Community & Rewards | any | TBD | Chat community, contests, bonus programs, leaderboards |
Notes: benchmarks — small tools $20–$150/mo; 20-truck fleet ~$300–800/mo; large quote-only $2k+. Per-seat pricing is the market pain point; per-truck unlimited users is the wedge.

## 4. AI Dispatcher (add-on) — design
Flow: search boards → match to driver/truck (location, equipment, HOS, rate/mile, deadhead) → email broker + AI voice call → driver sees load card and Accept/Reject in app (live during the call) → booked → rate-con arrives by email → parsed and imported as a load → driver dispatch → BOL upload notifies broker → POD upload notifies broker → invoice broker directly or submit to factor.
- **States:** found → shortlisted → broker contacted → negotiating → driver confirm → booked → ratecon received → parsed → verified → dispatched (terminal: rejected/expired/lost/canceled); append-only event log; idempotency keys; queue with leases.
- **Load boards:** use official APIs only (123Loadboard first — most open; DAT and Truckstop via partner programs). **No scraping/browser automation** (DAT bans bots; account-ban/legal risk). Per-tenant board credentials. Also parse emailed load offers.
- **Onboarding with brokers:** MVP stores W-9/insurance/authority docs and attaches to emails (no public carrier-packet API).
- **Guardrails:** AI announces itself + call recording disclosure (about 11–13 all-party-consent states); never commits without driver accept; rate floor + counter limit; human takeover; call logs; kill switch; sandbox mode; Twilio SHAKEN/STIR + 10DLC; TCPA treats AI voices as artificial (cell phones) — rely on consent/business relationship; get counsel review.
- **Cost:** est. $3–12 per booked load (Vapi $0.08–0.33/min all-in + LLM) — meter per tenant.
- **MVP:** 123/DAT search + matching + email outreach + one call script + rate-con parser with review screen. Later: negotiation, multi-board, auto-onboarding packets, EDI.
- **Closing the loop:** BOL/POD capture → auto-email broker → invoice PDF → factor package (OTR/Apex integration paths; email/portal package for others) → QuickBooks invoice.

## 5. Phases (rough, depends on team capacity — estimates are not commitments)
- Phase 0 (this week): backups, credential rotation, freeze rules, staging project plan, decide data-anonymisation approach.
- Phase 1 (weeks 1–2): staging live; security hotfix release; recruiting STOP/inbound/Vapi fixes released first (compliance).
- Phase 2 (weeks 2–8): department fixes in order: Dispatch/Loads → Driver app → Accounting → HR/Recruiting → Shop → Compliance; each released separately.
- Phase 3 (weeks 6–14): multi-tenant foundation in the new project; tiering/feature flags; billing.
- Phase 4 (weeks 12–20): Starter+Fleet packaged (rate-con/invoice PDF, load-board links, IFTA, tracking links); Recruiting add-on productised; ANH imported as tenant #1.
- Phase 5: AI Dispatcher MVP; Dispatch Co mode; Enterprise features; Community & Rewards.

## 6. Decisions needed from Abdel
1. Approve the staging approach (new Supabase + new Lovable project; ANH data anonymised) and who performs the backups (needs your Supabase access — I only have Lovable access, not Supabase dashboard/CLI).
2. Who on the team signs off each department's click-through?
3. Fresh multi-tenant build vs retrofit (recommended: fresh).
4. Which first customer segment to target (solo vs mid-size vs dispatch companies) → decides build order.
5. Keep investor/sales module inside ANH only (recommended).
6. Share this plan with Hanan? (Lovable workspace admin.)
