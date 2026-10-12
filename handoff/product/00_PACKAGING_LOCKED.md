# Fleet OS — Packaging & pricing (LOCKED by Abdel, 2026-10-10). Supersedes the Core/Pro/Autopilot tiers and per-truck pricing in all earlier files.

## Plans (flat monthly price, AI credits included, credits EXPIRE at month end; purchased top-up credits roll over)
| Plan | Trucks | Price/mo | Included AI credits | Voice calling |
|---|---|---|---|---|
| Solo | 1 | $39 | 300 | No (AI texting only) |
| Core | up to 3 | $97 | 1,000 | No (AI texting only) |
| Growth | up to 25 | $249 | 4,000 | Yes |
| Enterprise | 26+ | CONTACT SALES: book a demo call; custom quote | quoted | Yes |
Credits sizing rule: included credits ≈ 50% of what a heavy user of that fleet size would use. Top-ups: 1,000 credits $25 / 5,000 $110 / 20,000 $400 (roll over). 1 credit ≈ $0.01 of our AI/telephony cost. No per-truck charges ever; beyond the plan's truck limit = upgrade prompt with 30-day grace, nothing blocked. Out of credits: workflows keep running, bots drop to Suggest/Off, drivers never locked out. Consumption order: included (expiring) credits first, then top-up credits.
## Internal sales quote guardrail (NOT public): Enterprise quote ≈ $249 + $10 × (trucks − 25); credits ≈ 4,000 + 160 × (trucks − 25); floor gross margin ≥ 60% at full credit use. Examples: 35 trucks ≈ $349, 100 trucks ≈ $999. Adjust for modules (Recruiting, voice volume), integrations, support level, annual prepay.
## Feature gating (non-AI): all AI features available on all plans except VOICE (Growth+). Plans differ in team/scale features:
- Solo/Core: owner + dispatcher + driver roles, phone-first, standard dashboards, 1-2 integrations, self-serve support. Recruiting = paid add-on on Core, not on Solo.
- Growth: department roles + leader flag + teams, report builder, shared inbox, voice calling, Recruiting included, health board, more integrations.
- Enterprise: multi-entity (several MC/DOT), approval chains, SSO, API/webhooks, audit export, custom analytics, named support/SLA.
## Cost model (estimates): AI credits at $0.01 each + ~$2/truck non-AI (texts/email/storage/ELD, UNVERIFIED) + ~3% payment fees. Margins: Solo ~84%, Core ~81% full use / ~86% typical, Growth ~61-69% full use / ~69-77% typical. Support time not included.
## Out of product: sales/investor module (ANH-internal).

## ADDENDUM — decisions by Abdel, 2026-10-10 (later)
- Product name is NOT "Fleet OS" (placeholder only). Use a single BRAND variable in all specs/mockups/code; final name TBD by Abdel.
- Build platform: Lovable (front end) + a NEW Supabase project (own account) as backend. Never reuse ANH's Supabase project (kldiqwkjrhpkcfjlbolw); verify project id after any connect/remix.
- Texts AND emails are credit-metered (texts 1.2 credits; email proposed 0.1 credit; system emails — login, security, billing receipts — never metered). Daily send limits for deliverability/abuse.
- Mobile: a real mobile app is wanted. SOLO plan = MOBILE ONLY (owner-operator is owner+dispatcher+driver in one phone app). Core/Growth/Enterprise = web app for dispatch/office + the same mobile app in driver mode. Solo keeps a minimal web page for billing/export/account only.
- Money: undecided between record-only vs move-money; recommendation = record-only at launch.
