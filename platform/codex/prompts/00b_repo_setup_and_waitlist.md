# Prompt 00b: repo setup + waitlist site (Week 0)

Run after `00a_infrastructure_setup.md`. Use the resources recorded in `infra/STATE.md`.

Paste this whole file into Codex. Read `AGENTS.md` and `docs/` first.

## Goal
1. Create the monorepo skeleton exactly as described in `AGENTS.md` (Stack).
2. Ship a **waitlist site on crewzero.ai** that already shows the product idea:
   one input box -> instant free idea score -> join waitlist -> referral link.

## Tasks
### A. Monorepo
- pnpm workspaces + Turborepo. Root scripts: `dev`, `build`, `typecheck`, `lint`, `test`, `db:migrate`, `db:types`.
- Create `apps/dashboard`, `apps/renderer`, `apps/api`, `apps/jobs`, `packages/db`, `packages/model-router`, `packages/agents`, `packages/config`, `packages/ui` with minimal working code and a README each.
- `packages/config/src/brand.ts`: `BRAND = { name: "Crewzero", domain: "crewzero.ai", previewDomain: "crewzero.app", tagline: "AI agents that run your whole company" }`.
- ESLint + Prettier + Vitest. GitHub Actions CI: install, typecheck, lint, test on every push.
- `.gitignore` covers `.env*` except `.env.example`.

### B. Waitlist site (inside `apps/dashboard`, public route `/`)
- Hero: one large input "Type your business idea" + button "Score my idea".
- On submit: call `apps/api` endpoint `POST /v1/idea-score` which uses `packages/model-router` with task type `idea_score_free` (cheapest configured model; Claude Haiku 5.5 `claude-haiku-5-5` by default) and returns JSON:
  `{ score: 0-100, verdict: "go"|"pivot"|"rethink", strengths: string[3], risks: string[3], better_angle: string }`.
  Use structured output; validate with zod; max 1 request per IP per minute and 5 per day (store counters in Supabase or Cloudflare KV).
- Show the score card nicely + **"Share my score"** (generates an image card URL `/s/:id` with Open Graph image) + **"Get it built: join the waitlist"** (email field).
- Waitlist table `waitlist(id, email unique, idea, score_id, referral_code unique, referred_by, position, created_at)`. Position = signup order minus 3 per successful referral (min 1).
- After joining: show position + personal referral link `crewzero.ai/?ref=CODE`.
- Confirmation email via Amazon SES (`packages/email` helper, template "You're #N on the Crewzero list").
- Footer: links to `/privacy` and `/terms` pages (render the markdown in `docs/legal/` — create drafts, see C).
- Public counter "N founders waiting" (real count).

### C. Legal drafts
- `docs/legal/privacy.md` and `docs/legal/terms.md`: plain-English drafts for Masar AI Inc. (Delaware C corporation), covering waitlist data, AI processing, cookies. Mark "DRAFT for owner/counsel review".

### D. model-router v0
- `route(taskType, input, { companyId?, taskId? })`.
- Config map task type -> { provider, model, fallback, maxCostUsd }.
- Calls go through Cloudflare AI Gateway (env vars in `.env.example`); provider keys optional (BYOK) else gateway unified billing.
- Log every call to `usage_events(id, company_id nullable, task_id, task_type, provider, model, input_tokens, output_tokens, cost_usd, latency_ms, ok, created_at)`.

## Acceptance (run and verify)
- `pnpm i && pnpm typecheck && pnpm lint && pnpm test` pass.
- Local: type an idea -> score card appears -> share page has OG image -> join waitlist -> email sent (or logged in dev) -> referral link moves position.
- Rate limit works. `usage_events` row written with cost.
- Report per `AGENTS.md` definition of done.
