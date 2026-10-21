# Prompt 01: Foundation (Phase 1, weeks 1-2)

Read `AGENTS.md`, `docs/01_INFRASTRUCTURE.md` §3-5. Prompt 00 must be done.

## Goal
A user signs up, a company is created, its preview site renders on `<slug>.crewzero.app`, and agent calls are traced with cost.

## Tasks
1. **Supabase schema + RLS** (`packages/db/migrations`):
   `companies(id, name, slug unique, plan, status, owner_id, created_at)`, `memberships(user_id, company_id, role, is_owner)`, `plans` (seeded from `packages/config/src/plans.ts` — hidden draft tiers Business 1-10), `credit_ledger(id, company_id, kind: grant|reserve|settle|release|topup|adjust, amount, task_id, note, created_at)` + view `credit_balance`, `usage_events` (from prompt 00, add company_id FK), `unit_costs(provider, model, input_per_mtok, output_per_mtok, cached_input_per_mtok)`, `audit_log`, `provisioning_steps(company_id, step, status, attempts, last_error, updated_at)`, `sites(id, company_id, template_key, config jsonb, published_version)`, `site_versions`.
   RLS on all; helper `is_member(company_id)`; two-company isolation test (pgTAP or Vitest against local Supabase).
2. **Auth**: Supabase Auth (email magic link + Google sign-in basic scope only — no sensitive scopes). After first login, create company from the waitlist idea if present.
3. **Credits functions** (SQL RPC, transactional): `credits_reserve(company, amount, task)`, `credits_settle(task, actual)`, `credits_release(task)`; never negative; unit tests.
4. **Renderer**: Next.js on Workers. Resolve tenant by hostname (`<slug>.crewzero.app` or custom domain from `domains` table — table now, used in Phase 3). Render `sites.config` with one starter template (`local_service`). Edge cache with purge on publish.
5. **Dashboard shell**: login, company switcher, empty org-chart page (placeholder cards from `agents` registry in `packages/agents`), settings page (company name, slug). Real data only.
6. **Jobs**: Trigger.dev project in `apps/jobs`; task `provision_company` (creates site row from template, writes `provisioning_steps`) — idempotent, retries.
7. **Observability**: Langfuse tracing in model-router; Sentry in dashboard/api/renderer; PostHog in dashboard.
8. **Environments**: dev / staging / prod configs; deploy scripts for Workers (wrangler) and Supabase migrations; document in `docs/DEPLOY.md`.

## Acceptance
- New user -> company -> `test-co.crewzero.app` renders template with company name.
- User A cannot read company B data (test proves it).
- A credit reserve/settle cycle is visible in the ledger.
- One traced model call with cost in `usage_events` and Langfuse.
- Report per definition of done.
