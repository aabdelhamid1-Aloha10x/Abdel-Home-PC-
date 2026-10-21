# Prompt 04: Autopilot core (Phase 4, weeks 7-11)

Read `docs/00_MASTER_SPEC.md` §5-9, §12-16. Prompt 03 must be done. This prompt is large: Codex may split it into 04a-04e and report after each.

## Goal
A company runs itself for 14 days with zero manual fixes.

## Tasks
### 04a Orchestrator + credits
- Trigger.dev schedule per company (staggered). Orchestrator reads KPIs, plan, memory, aggressiveness level -> creates prioritized `agent_tasks` within the credit pace.
- Credits: reserve before each task, settle when it **passes QA**; revisions requested by the user are new tasks. Pacing spreads included credits across the month; low-balance coach message with top-up/upgrade.
- Kill switches: per agent, per company, global (admin).

### 04b Coach chat
- Dashboard chat -> Coach agent -> challenge protocol (understand goal -> research -> verdict with numbers + playbook principle -> user decides) -> if agreed, routes to owning agent via orchestrator; logs risk if user insists.
- Daily lesson message. Playbook KB grows to 100 cards (own words + cited source).

### 04c QA & Compliance Guard
- Every public output (post, ad, email, page change, DM template) passes rules engine + LLM grader before shipping. Blocks: fabricated testimonials/reviews, false claims, prohibited categories, niche rules (HIPAA, bar rules, etc.), platform AI-content rules where they apply.

### 04d Engines v1
- **Connect wizard**: Facebook Login for Business (Page + Instagram), then X, TikTok, LinkedIn, Pinterest, YouTube as their APIs allow. Agents prepare handle, bio, images; user creates/connects; we store tokens encrypted (`connections`).
- **Social posting**: calendar, generation, scheduling, publishing, metrics back into `kpis_daily`.
- **Meta ads Mode 1**: one ad account per company under the Unstaffd Business portfolio (system user), prepaid `ad_balances` via Stripe, management fee from config, budget caps enforced server-side, daily optimization task.
- **Email flows**: welcome, abandoned cart, newsletter (SES).
- **Content -> DM closer** + **speed-to-lead**: Messenger/IG webhooks -> AI Closer replies (business-specific, discloses AI when asked), qualifies, sends checkout/booking link, logs to CRM (`contacts`, `conversations`, `messages`, `leads`).

### 04e Dashboard + finance/risk
- Org chart home with live agent cards, agent detail (history, outputs, credits, lessons), KPIs (visitors, leads, bookings, sales, revenue, ad spend, ROAS, Time to First Result), credits pace, aggressiveness slider, budget settings.
- Finance agent v1: Stripe reconciliation, monthly P&L for Unstaffd itself. Risk agent v1: Connect reviews, fraud flags, dispute queue triage.

## Acceptance
- Owner's test company runs 14 days: daily posts, one prepaid Meta campaign, DMs answered < 60 s, daily report emails, no manual fixes. Log incidents honestly.
- Meta App Review package ready: screencasts list + permission justifications in `docs/meta_app_review.md`.
- Report per definition of done.
