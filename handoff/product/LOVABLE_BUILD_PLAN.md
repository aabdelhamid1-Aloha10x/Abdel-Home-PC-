# Build plan: mockup to real app (new Lovable project + new Supabase)

Rules: ANH untouched (read-only). New Lovable project and new Supabase project only. Money is record-only. One BRAND variable. Light/dark/auto.

## Phases (each = a few Lovable messages, tested before the next)
0. **Foundation**: project, design tokens (Night Shift), app shell (sidebar, top bar, user menu), auth (email, Google, Apple, phone code), multi-tenant schema with row-level security, roles and plan gating.
1. **Core TMS**: customers, drivers, trucks, trailers, loads (+ stops, detention), dispatch board, planner rules engine, roll call.
2. **Money**: invoices, settlements, pay plans, programs, expenses, factoring records (record-only).
3. **Chat**: rooms per driver, topics, department and team rooms, announcements, translation, SMS fallback.
4. **Driver app** (PWA first): sign-in by invite, Today, load, chat, pay, docs, issue, board.
5. **Integrations**: FMCSA lookup first, then Samsara, Motive, QuickBooks, SMS, mileage. Load-board sources only after partner approvals.
6. **Assistants and credits**: bots, approvals, credit meter, Stripe plans and top-ups.
7. **Voice** (Growth+), **Enterprise** (multi-carrier, SSO, API).

## Multi-tenant rule (phase 0, non-negotiable)
Every table has `company_id`. RLS on every table: a user sees only rows where `company_id` is in their memberships. Roles live in `memberships(user_id, company_id, role, team_id, is_leader)`. Plan and credits live on `companies`. No data is ever shared across companies.

## Source files for Lovable
- WEB_SPEC.md (screen-by-screen build spec, about 80 screens)
- Published design: https://claude.ai/artifact/635DAuPCpRwGFseWwFobo4
- world.py / world2.py (sample data shapes: teams, programs, pay plans, chat topics)
- CHAT_DESIGN.md, PAY_AND_PROGRAMS_DESIGN.md, 00_PACKAGING_LOCKED.md
