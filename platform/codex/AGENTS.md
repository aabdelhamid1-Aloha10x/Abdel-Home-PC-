# AGENTS.md — rules for Codex (and any coding agent) in the Crewzero repo

Crewzero: "AI agents that run the whole company." A product of Masar AI. Solo founder + AI, built in public.
Read `docs/00_MASTER_SPEC.md` (what), `docs/01_INFRASTRUCTURE.md` (how), `docs/02_BUILD_QUEUE.md` (order) before any task.
The current task is always one file in `prompts/`. Do only that task.

## Hard rules
1. **No secrets in code, files, commits, logs, screenshots or chat.** Secrets live only in the platform secret stores (Cloudflare, Supabase, Trigger.dev) or `.env.local` (git-ignored). `.env.example` lists names only.
2. **Brand name lives in one constant**: `packages/config/src/brand.ts` (`BRAND.name = "Crewzero"`). Plans live only in `packages/config/src/plans.ts`. Never hardcode either elsewhere.
3. **Multi-tenancy is non-negotiable**: every business table has `company_id uuid not null`; RLS enabled on every table; a row is visible/writable only if `company_id` is in the user's active memberships. Test with two companies in every migration that adds a table.
4. **Agents never choose the tenant.** Tool functions get `companyId` from server context, never from model output. Credentials are loaded server-side by `companyId`.
5. **Hard limits are enforced in code, not prompts**: spend caps, budgets, allowed channels, destructive-action confirmation, compliance rules.
6. **No service-role key in the browser.** Role and plan checks in BOTH UI and database/edge.
7. **Credits**: ledger only (reserve -> settle when the task passes testing). Never a mutable balance without a ledger row. No automatic refunds; disputes go to a review queue.
8. **Every model call goes through `packages/model-router`** (which logs model, tokens, cost, companyId, taskId to `usage_events`). No direct SDK calls elsewhere.
9. **Tenant sites are rendered by `apps/renderer` from config in the database.** Agents change config/content, not renderer code. Custom code is only via the Engineering agent in a sandbox.
10. **Legal**: never generate fake testimonials/reviews or AI "customers" presented as real. Follow each ad/social platform's own AI-content rules. Voice calls only inbound / consented. Cold email B2B only with unsubscribe.

## Definition of done (every task)
1. Every button, link, tab, form and menu does something real. No dead buttons, no `console.log` handlers, no "coming soon" toasts. Out-of-scope features are not rendered, or are disabled with a visible reason.
2. Data comes from the database, never hardcoded arrays. Creates/edits/deletes persist and survive reload.
3. Forms validate with zod, show inline errors, disable submit while saving, toast success/error, write an `audit_log` row.
4. Every page has loading, empty and error states, works at 390px width, light and dark.
5. `pnpm typecheck && pnpm lint && pnpm test` pass. New logic has unit tests. Migrations have an RLS two-company test.
6. **Run it.** Start the app and verify each route/flow you touched. If something could not be run or verified, say so explicitly.
7. Final reply lists: routes added, tables/migrations added, env vars needed (names only), tests added, what was verified by running, what was NOT verified.

## Stack (do not swap without an owner decision)
pnpm + Turborepo monorepo. TypeScript everywhere.
- `apps/dashboard`: React + Vite + Tailwind + shadcn/ui + TanStack Query + React Router. Hosted on Cloudflare Workers (static assets).
- `apps/renderer`: Next.js (App Router) on Cloudflare Workers via OpenNext. Serves `*.crewzero.app` and custom domains.
- `apps/api`: Hono on Cloudflare Workers (webhooks: Stripe, Meta, Twilio, SES/SNS, GoDaddy).
- `apps/jobs`: Trigger.dev tasks (agents, daily cycles, provisioning).
- `packages/db`: Supabase migrations (SQL), generated types, RLS tests.
- `packages/model-router`: task-type -> model mapping, Cloudflare AI Gateway, cost logging.
- `packages/agents`: agent definitions, tools (company-scoped), prompts.
- `packages/config`: brand.ts, plans.ts, credit values (draft, hidden).
- `packages/ui`: shared components (DataTable, forms, states).
Supabase (Postgres, Auth, Storage, Realtime, pgvector). Cloudflare (Workers, R2, Email Routing, AI Gateway, Cloudflare for SaaS). Stripe (Billing + Connect Express). Amazon SES. GoDaddy reseller API.

## Design
Clean, minimal, premium. Landing = one input box. Dashboard home = live org chart of agents. Colors are CSS variables/Tailwind tokens only (no hex in components). Fonts and palette in `packages/ui/src/theme.css`.

## Git
Small commits with clear messages. Do not open pull requests unless asked. Never commit `.env*` except `.env.example`.
