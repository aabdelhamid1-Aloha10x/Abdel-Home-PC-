# Web (office /app/*) audit, Masar OS
Date 2026-10-15. Lovable project 91b7f59c, commit 10ac09a2e7620ad5cce70fbd4fa769b5c2a9edb1 (get_project; agentFinished=false, so a build was running).
Method: list_files of the full tree plus read_file of key files (nav.ts, plans.ts, PlanGate, app.$section, app.inbox, app.masar.index, app.dispatch.index, app.settings.integrations/carriers/voice, app.fleet.map, app.chat.index). NOTHING was run, clicked or opened in a browser. DONE means "file exists and the part I read is wired", not "tested". Files I did not open are marked (listed only).
Solo /s/* is out of scope.

## 1. Route and feature table (spec screen -> status)
Evidence = src/routes/app.* in the commit. nav.ts flags: built=false for Load hub, Recruiting, Reports, Assistants.
| Spec | Screen | Status | Evidence |
|---|---|---|---|
| P0 | Company, Carriers, Users, Roles, Chat rules, Notifications, Billing, Audit, Security, Data, Profile | DONE (listed only, not opened) | app.settings.{company,carriers,users,roles,chat-rules,notifications,billing,audit,security,data,profile}.tsx |
| P0 | Carriers: add more MC/DOT | PARTIAL | app.settings.carriers.tsx shows the primary carrier; "Add carrier" is a LockedAction "Coming in phase 9" |
| P0 | Integrations | PARTIAL | app.settings.integrations.tsx is a static table; every Connect is LockedAction "Coming in phase N" (ELD, fuel, QuickBooks, Gmail/Outlook, calendar, phone, DAT/Truckstop, factoring, e-sign, webhooks/API keys) |
| P0 | Voice and Autopilot settings | DONE | app.settings.voice.tsx (PlanGate voice, zod, audit, Vapi status, sync). Needs keys/webhook to be live |
| P1 | Overview / Home | DONE (listed only) | app.home.tsx, app.index.tsx |
| P1 | Ask Masar Today + staff cards | DONE (read) | app.masar.index.tsx (role-filtered staff, voice composer, Today strip); app.masar.$dept.tsx (listed only) |
| P1 | Planner | DONE (read) | app.dispatch.index.tsx: six checks, override with reason + audit, team filter |
| P1 | Board, Loads list/detail, New load, Import rate con, Roll call | DONE (listed only) | app.dispatch.{board,loads.index,loads.$id,new,import,roll-call}.tsx |
| P1 | Customers, Locations, Lanes, Customer detail | DONE (listed only) | app.customers.{index,locations,lanes,$id}.tsx |
| P1 | Drivers, Trucks, Trailers + details, Programs, Teams | DONE (listed only) | app.fleet.{drivers,trucks,trailers}.* ; fleet.programs, fleet.teams |
| P1 | Live map | PARTIAL | app.fleet.map.tsx: manual positions only ("until the ELD feed connects"); no ELD feed |
| P2 | Accounting overview, Invoices(+detail), Collections, Bills, Driver pay (settlements + detail), Pay plans, Expenses, Fuel/IFTA, Factoring, Profit | DONE (listed only) | app.accounting.* (all 12 files present) |
| P2b | Incentives list/detail, programs | DONE (listed only) | app.fleet.incentives.{index,$id}.tsx; components/incentives/Builder.tsx |
| P3 | Chat rooms, Announcements | DONE (read chat.index) | app.chat.index.tsx (driver/dispatch/dept/team/DM rooms, roll call), app.chat.announcements.tsx |
| P3 | Shared inbox: Messages, Calls, Templates | PARTIAL | app.inbox.tsx = QuotesInbox plus a PlanGate "inbox" card whose Connect Gmail/Outlook are LockedAction ("not set up yet"). No Calls, no Templates, no threads UI |
| P4 | Maintenance: overview, work orders(+detail), schedules, inspections, shops, cases, needs-you, autopilot | DONE (listed only) | app.maintenance.* (10 files) |
| P4 | Safety: readiness, documents, driver files, drug/alcohol, incidents, HOS | DONE (listed only) | app.safety.* (6 files). HOS/ELD shows real data only after an ELD is chosen |
| P6 | Load hub: Find loads, Sources, Preferences and rules | MISSING | nav.ts load-hub built:false, no "to"; /app/load-hub resolves to app.$section.tsx = "Not built in this phase" (owner-only). All load search lives in /s/find, /s/search, /s/case/$id, /s/sources, /s/rules |
| P7 | Recruiting: Pipeline, Candidates, Jobs/forms, Sources, Onboarding, Candidate | MISSING | nav.ts recruiting built:false; placeholder only. Tables not seen in migrations list |
| P8 | Reports: Library, Builder, Scheduled | MISSING | nav.ts reports built:false; placeholder only (only /app/accounting/profit exists) |
| P8 | Assistants: Control center, Approvals, Activity, Usage, Voice, Bot | MISSING (office) | nav.ts assistants built:false. Pieces exist elsewhere: NeedsYouCard (components/cases), app.maintenance.needs-you, app.settings.voice, platform-admin app.admin.usage. No unified screen |
| Platform | Admin billing / funnel / usage | DONE (listed only) | app.admin.{billing,funnel,usage}.tsx (internal, not customer) |
| Auth | sign-in, sign-up, invite, onboarding, start.* | DONE (listed only) | sign-in.tsx, sign-up.tsx, invite.$token.tsx, onboarding.tsx, start.{index,company,plan,payment,setup}.tsx |

## 2. Plan tier and gating
Source: src/config/plans.ts (features map) + companies.plan; src/components/shared/PlanGate.tsx (blur + "X is on Growth" card, UI only; DB side not checked by me except incentive limit comment "mirrors incentive_programs_before()").
| Feature | Tier (plans.ts / knowledge) | Gate in code |
|---|---|---|
| Dispatch, customers, fleet, accounting basics, maintenance, chat basics, 1 bonus program | Core (3 trucks) | no gate needed; truck cap = maxTrucks (enforcement not read) |
| Departments, teams, dept chat rooms, shared inbox, report builder, recruiting, voice, unlimited incentives, factoring, safety files | Growth (25 trucks) | PlanGate on voice, inbox, chat dept rooms (c.feature("departments")); incentives limit INCENTIVE_LIMIT; others unverified |
| Multi-carrier, SSO, API/webhooks, approval chains, audit export | Enterprise | PlanGate multiCarrier on carriers (content is a locked button). No code seen for SSO, API keys, approval chains. Audit log screen exists; export unverified |
Gaps: Recruiting is "Growth included / Core add-on" in knowledge but OWNER_DECISIONS 10-13 says "shown as available everywhere": plans.ts has recruiting only on Growth+ and no add-on flag. Nav (SECTIONS) is gated by role/dept only, not by plan. No upgrade nudges on unbuilt sections.

## 3. Load-agent office entry (fleet screen to cases)
Status: MISSING in /app. The case screen (s.case.$id: email/call broker, approve terms, request booking, record quote), search (s.search, s.find.*), sources (s.sources) and rules (s.rules) are all /s/* only. /app has no route to a load_search_case; app.masar.index links to Today strip, dispatch board and inbox, not to cases. Backend is shared and role-aware (migrations 0067-0073, tools.server.ts, "Only the owner or a dispatch manager can approve and book"), so the office needs screens only: Load hub (Find, Cases, Sources, Rules) under Dispatch. Not built (per LOAD_AGENT_DESIGN): browser worker running for real, Vapi broker assistant, knowledge base, auto load creation after confirmed case. Release blocker: written provider approval (DAT bars bots).

## 4. Known gaps from QA_LOG touching /app
- Fleet screens (/app/masar, U6) never opened in a browser; no Core or Growth test account exists (Void Test is Solo and gets redirected).
- Role-based visibility on /app/masar, RLS/audit of new tables: not code-verified at the time (U6 round); later rounds read only partially.
- Mailbox: Google OAuth runs unverified (100-user cap, warn 80, stop 95); /app/inbox still shows "not set up yet" locks although Gmail connected for Solo.
- Money gate on spend lookup fixed; rate and per-load calc shared; but "owner or dispatcher" wording sweep never finished (4 times).
- Drizzle snapshots 0070-0074, 0082, 0083 are empty stubs; spend_limit migration not found / 0082 VALIDATE may fail (owner must apply migrations through 0085).
- Vapi app side (P4 voice) not built; Twilio SMS number/token pending; ELD provider not chosen so Live map/HOS are manual.
- Integrations page: every card locked (phases 2-9 labels are stale).
- Credits: no per-action prices in UI (rule held in all reviews).

## 5. Proposed build rounds (one Lovable message each, independent, smallest risk first)
1. Truth pass on gating and stubs (low risk, UI only). Hide or relabel unbuilt nav, replace "Not built in this phase" with a plan-aware card, update stale "Coming in phase N" reasons, decide recruiting access in plans.ts. Accept: every nav item opens a real page or is hidden; Core user sees Growth items disabled with reason; no console errors.
2. Create a Core and a Growth test company (SQL/seed, owner approves) and a two-company RLS test for office roles. Accept: test accounts sign in, /app/masar loads, dispatcher cannot see money, company B rows never visible.
3. Office Load hub, Find and Cases: /app/load-hub (Dispatch tab) reusing existing server fns: brief, ranked offers with truck verdicts, case list and case detail with approve/request/record quote. Accept: dispatcher runs a search, opens a case, owner approves, quote never sets accepted_rate; non-dispatch roles see nothing.
4. Load hub Sources and Rules for office (+ unlock Integrations rows that already work: Gmail/Outlook, DAT/Truckstop status). Accept: owner/dispatch manager can connect, others see status; rules save with one audit row.
5. Shared inbox for Growth: Messages (threads linked to loads/customers), Templates, Calls log (Vapi/Twilio events); connect via the existing mailbox OAuth. Accept: inbound reply shows in thread, send gated by role, plan gate blocks Core.
6. Reports: Library (10 saved reports from existing data), Scheduled (email), Builder (Growth). Accept: each report matches Accounting numbers for the A&H sample; CSV export; builder PlanGate.
7. Assistants (Growth): Control center, Approvals (reuse NeedsYouCard), Activity, Usage (customer view: balance and packs only, no per-action prices), Bot detail. Accept: pause/resume persists; approvals write audit; usage shows bar only.
8. Recruiting (Growth): migrations + Pipeline, Candidates, Jobs/forms, Onboarding. Accept: public apply form creates a candidate; stage move persists; hire creates a driver draft. (Enterprise items, SSO/API/multi-carrier/approval chains, are a separate later quote-driven phase; not in these 8.)

## 6. What the OWNER must provide
- Apply Lovable migrations through 0085 in the live DB; publish after each round.
- Decisions: recruiting access (Core add-on price vs everywhere), Growth tier split ($297 for 4-10 / $497 11-25 pricing proposal), which reports go in the Library, Enterprise scope (SSO/API/approval chains: build now or per customer), whether the office shows the load agent before the worker is live.
- Keys/accounts: ANTHROPIC key check; PERPLEXITY_API_KEY (secure form); Vapi keys + new webhook secret + assistant creation; Twilio number/token/webhook; ELD provider choice (Samsara/Motive/Geotab) and keys; QuickBooks, fuel-card and factoring partner accounts if those integrations are wanted; Google OAuth verification (and Microsoft app); HERE key allowed origins; Stripe live-mode confirmation.
- Load-agent: written reseller/DAT approval recorded per company (approval_ref); Hostinger VPS for the browser worker.
- A logged-in visual check (screenshots or local smoke run), since nothing has been run by these audits.

## Could not check
Nothing was executed: no tests, no migrations, no browser, no RLS/plan enforcement in SQL, no truck-cap enforcement. Most /app route files were only listed, not read (marked above). Role/permission behaviour, plan gating in the database, and whether each listed screen's buttons actually work are unverified. The project was mid-build (agentFinished=false), so the commit may already be stale.
