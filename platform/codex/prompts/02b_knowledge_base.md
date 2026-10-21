# Prompt 02b: Agent knowledge base + smart intake (run after 02, before 03)

Read `docs/06_KNOWLEDGE_BASE_AND_SCENARIOS.md` (Part A) and `AGENTS.md`.

## Goal
Every agent answers like a seasoned expert: it retrieves cited method cards, industry packs, live research, platform outcomes and company memory. Onboarding asks a few smart questions and scores Founder-Market Fit.

## Tasks
1. **Tables** (`packages/db`, RLS: global knowledge readable by all, company memory per company):
   `experts(id, name, domains[], achievements jsonb[{claim, status: verified|claimed|disputed, sources[]}], last_verified)`,
   `knowledge_sources(id, type: book|podcast|video|article|filing|court|ad_library|dataset, title, url, expert_id, license: public|purchased|licensed, captured_at)`,
   `method_cards(id, slug, title, agents[], industries[], when_to_use, steps jsonb, scripts jsonb, metrics[], failure_modes[], expert_ids[], source_ids[], quote, evidence jsonb, last_verified, version, status: draft|live|retired, embedding vector)`,
   `industry_packs(id, industry, benchmarks jsonb, regulations jsonb, seasonality jsonb, sources[], last_verified)`,
   `outcome_stats(card_slug, industry, metric, n, median_lift, updated_at)` (anonymized, aggregated only),
   `company_memory(id, company_id, kind, content, embedding)`,
   `kb_changes(id, card_id, diff, eval_before, eval_after, approved_by, approved_at)`.
2. **Retrieval** (`packages/agents/knowledge.ts`): hybrid search (pgvector + full-text) -> filter by agent + industry -> rerank -> boost cards with strong `outcome_stats` for this industry -> return top N with citations. Every agent prompt includes retrieved cards; outputs that use a card store its slug (so the dashboard can show "why").
3. **Knowledge Ops jobs** (Trigger.dev, weekly): `kb_scout` (Perplexity Sonar + Exa + Meta Ad Library + SEC EDGAR + YouTube Data API metadata), `kb_extract` (writes cards in our own words; max one quote <= 25 words with link; never stores full transcripts or book text), `kb_verify` (claim status), `kb_curate` (dedupe/merge/version), `kb_eval` (runs eval sets; blocks publish on regression), `kb_publish` (owner approval queue in admin).
4. **Seed content**: 150 method cards across the roster in Part A §A5 (≈15 per agent + capital-raising pack + compliance), 10 industry packs (local services, e-commerce, B2B SaaS, coaching, restaurants, dental/medical, real estate investing, home services, agencies, info products). Mark every expert achievement `verified/claimed/disputed` with sources.
5. **Eval sets** (`packages/agents/evals/`): 50 sales objections, 30 ad briefs, 20 pricing dilemmas, 20 validation cases, 15 compliance traps (fake reviews, return promises in investment ads, TCPA cold calls, HIPAA in DMs). Grader rubric per set.
6. **Smart intake** (onboarding, after the idea): 5-7 adaptive questions (Part A §A6), optional resume/LinkedIn PDF upload (parse to structured experience; delete raw file after 30 days), "Sign in with LinkedIn" (OpenID Connect: name/email/photo only). Compute `founder_fit` (0-100) with reasons; feed to coach verdict and plan generator (validation-first plan when fit is low).
7. **Regulated-industry switches**: if the idea involves securities/fundraising, health, legal, finance, alcohol, firearms, etc., load the compliance pack, show the user the rules up front, and require the professional-review steps (e.g. securities attorney sign-off) before related public outputs ship. Unstaffd never takes a percentage of capital raised.

## Acceptance
- The 5 scenarios in Part B run end-to-end in staging (seeded test users): intake -> verdict -> plan reflect the expected differences (e.g. Priya gets validation-first, James gets 506(c) rules and attorney step, Dr. Lee gets HIPAA-safe receptionist).
- Every plan section shows the method cards it used, with sources.
- KB update blocked when an eval regresses (prove with a test).
- Report per definition of done.
