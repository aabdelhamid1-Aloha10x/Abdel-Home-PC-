# Handoff: Unstaffd (for the Claude Code session on the owner's computer)

## Where everything is
- **Repo**: https://github.com/aabdelhamid1-Aloha10x/Abdel-Home-PC-
- **Branch**: `claude/options-trading-alerts-scanner-5lgr30` (the branch name is historical; the repo also holds the owner's trading tools and Masar OS docs)
- **Folder**: `platform/` (everything about Unstaffd lives here)
- **Clone**: `git clone -b claude/options-trading-alerts-scanner-5lgr30 https://github.com/aabdelhamid1-Aloha10x/Abdel-Home-PC-.git`
- **Design mockup** (8 clickable screens, premium Apple/ElevenLabs style, AI crew as orb characters): https://claude.ai/artifact/PcFDYjv9YJ9ihHyExk58en
- **Build package** (ready to become the new repo's root): `platform/unstaffd-codex-package.zip`

## What Unstaffd is (one paragraph)
Unstaffd ("A whole company. Zero employees.") is a platform where a user types a business idea (or connects a running business, or imports a half-built project) and a crew of named AI agents (Theo CEO, Nora coach, Mila research, Jonah builder/engineer, Ava growth, Sam sales/reception, Iris brand/content, Leo finance) researches it, builds it, launches it and runs it daily on autopilot. Nora the coach pushes back with evidence. Product of **Masar AI Inc.** (Delaware C corporation). Solo founder + AI, no employees, built in public. Masar OS (trucking TMS, to be renamed, HaulCrew recommended) is Company #1. Competitor reference: Polsia.

## Read in this order
| File | What it is |
|---|---|
| `platform/README.md` | Index |
| `platform/00_MASTER_SPEC.md` | Product, positioning, agents, coach, engines, creators, pricing (test only), contest, compliance |
| `platform/01_INFRASTRUCTURE.md` | Stack and hosting decisions, tenancy, agent runtime, data model, approvals |
| `platform/02_BUILD_QUEUE.md` | Week 0 next steps + phases 1-8 with exit criteria |
| `platform/03_OWNER_DECISIONS.md` | Everything decided (with dates) + open questions |
| `platform/04_COST_ANALYSIS.md` | Cost comparisons, credits testing plan |
| `platform/05_LAUNCH_GTM_FUNDRAISING.md` | Launch, viral loops, fundraising |
| `platform/06_KNOWLEDGE_BASE_AND_SCENARIOS.md` | How agents become experts + 5 end-to-end user scenarios |
| `platform/07_TOOL_HUB_AND_CAPITAL_ENGINE.md` | Capability hub (every tool behind one crew), human-grade conversation rules, capital-raising engine, company formation |
| `platform/08_BUILD_WITH_CLAUDE.md` | Accounts/keys checklist (with secret names) and the build/review workflow |
| `platform/codex/AGENTS.md` | Coding rules + definition of done (use as `AGENTS.md`/`CLAUDE.md` in the new repo) |
| `platform/codex/prompts/` | Build prompts in order: 00a, 00b, 01, 02, 02b, 03, 04, 04f, 05 |

## Key decisions (do not re-litigate)
- Name **Unstaffd** (no "e"). Domains: unstaffd.com (main), unstaffd.app (tenant previews), unstaffd.ai + unstaffd.co (protection). USPTO knockout clear; descriptiveness risk -> attorney picks filing strategy.
- Stack: pnpm/Turborepo monorepo; React+Vite dashboard; Next.js renderer on Cloudflare Workers; Hono API; Supabase; Trigger.dev; Cloudflare (Workers, R2, Email Routing, AI Gateway, Cloudflare for SaaS); Amazon SES; Stripe Billing + Connect Express; GoDaddy reseller (customer domains); Hostinger (our own domains).
- Multi-provider models via router + Cloudflare AI Gateway (Claude, OpenAI, Grok, Gemini, Perplexity).
- Ads Mode 1 (ad accounts under our Meta business portfolio / Google MCC, prepaid). No automatic refunds (disputes case by case). Pricing tiers are TEST ONLY until beta data.
- Owner experience is context, never a cap. Agents never claim to be human; disclose where law requires.
- Never: fake testimonials/reviews, a % of capital raised, AI cold calls without consent, secrets in code or chat.

## Status (Oct 21 2026)
- Specs, decisions, cost analysis, KB design, tool hub, mockup: done.
- Not started: the `unstaffd` GitHub repo (owner creates it, private), accounts/keys (see `08_BUILD_WITH_CLAUDE.md` Step 3), code.

## First tasks for the local session
1. Help the owner create accounts and API keys in their Chrome (Hostinger, Cloudflare, Supabase, AWS, AI providers, then Stripe, Trigger.dev, Langfuse, Sentry, PostHog). Store keys only in secret stores / `.env.local`, never in chat or git.
2. Create the private repo `unstaffd`, unzip `platform/unstaffd-codex-package.zip` into it, rename `AGENTS.md` usage for Claude Code (copy to `CLAUDE.md` too), commit, push.
3. Run `prompts/00a_infrastructure_setup.md` (quote first; buy only when the owner approves), then `00b`, then the phases in order. After each phase: staging link + "what to try" checklist + what was not verified, then wait for owner approval.
