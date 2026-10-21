# Build queue (solo founder + AI)

Order matters: each phase ends with something a real user (or Masar) can use. Mark items done only after they are run and verified, not just written.

## P0 — Foundation (weeks 1-2)
- [ ] Legal entity, bank, domain for the Platform, Google Workspace.
- [ ] Start every long-lead approval in `01_INFRASTRUCTURE.md` §6 (Meta, Google, TikTok, Stripe Connect, registrar, Twilio ISV, Modash).
- [ ] Monorepo: `apps/dashboard`, `apps/renderer`, `apps/api`, `packages/agents`, `packages/model-router`, `packages/db`, `packages/ui`.
- [ ] Supabase project: auth, `companies`, `memberships`, `plans`, `credit_ledger`, `usage_events`, `audit_log`, RLS + two-company test.
- [ ] Cloudflare: dashboard hosting, wildcard subdomain, renderer skeleton serving tenant config.
- [ ] Trigger.dev project; model-router with Cloudflare AI Gateway; Langfuse tracing.
- [ ] Stripe Billing: tiers + credit packs (test mode).
- [ ] Build-in-public pipeline live on all platforms (record -> clip -> schedule). Day-1 post.

## P1 — Aha moment (weeks 3-6)
- [ ] Landing: one input box; 3 onboarding paths (idea / running business URL / repo import).
- [ ] Research agents in parallel (Perplexity, Grok, DataForSEO), streamed live into the org chart.
- [ ] Validation report + Go/Pivot/Kill + ICP.
- [ ] Business plan generator (offer, pricing, channels, 90-day roadmap, First Win plan).
- [ ] 3-5 hardened templates (local service, book-a-call/VSL, store, SaaS landing, lead magnet page) rendered on subdomain preview.
- [ ] Brand kit + domain search with marked-up price.
- [ ] Launch screen -> Stripe checkout -> provisioning workflow (domain, custom hostname, Connect Express, email identity).
- [ ] Target: plan < 15 min, live preview < 20 min. Free-stage cost per signup measured.

## P2 — Autopilot core (weeks 6-10)
- [ ] Orchestrator daily cycle, per-company concurrency, credit reserve/settle/refund.
- [ ] Coach chat -> orchestrator -> owning agent; challenge protocol; playbook KB v1 (first 100 cards).
- [ ] QA & Compliance Guard on every public output.
- [ ] Org-chart dashboard (Realtime), agent detail, KPIs, credits pace, aggressiveness slider.
- [ ] Engines v1: Meta ads (user's ad account), organic social posting, email flows, content -> DM closer, speed-to-lead.
- [ ] Finance agent v1 (our own books), Risk agent v1 (Connect review).

## P3 — Masar proof + first niche pack (weeks 8-14, overlaps P2)
- [ ] Import Masar (continue mode): repo + `lovable-build/` docs -> task list from `SOLO_STATUS.md` gaps -> agents finish in sandbox, PRs reviewed.
- [ ] Masar GTM on the Platform: creators (Modash), LinkedIn, B2B email, calculators/lead magnets, demo funnel.
- [ ] Public Masar baseline + 30-day report.
- [ ] First niche pack (pick with owner: e.g. plumbers/HVAC or trucking SaaS).
- [ ] First 50 paying users.

## P4 — Growth engines + retention (months 4-6)
- [ ] Click-to-message ads + AI Closer (Messenger / IG / WhatsApp), booking + deposits.
- [ ] Lead-gen engines: Meta instant forms, VSL pages, quizzes/calculators, webinars.
- [ ] Voice receptionist (inbound) + missed-call text-back (Vapi + Twilio).
- [ ] Creator agent Phase A end to end (search -> outreach -> deal -> tracking -> payout).
- [ ] Full tier ladder (Business 1-10) + top-ups; pricing recalibrated from 30 days of usage.
- [ ] Contest season 1 (rules drafted by counsel), milestones, leaderboard.
- [ ] Public live metrics page.

## P5 — Moat (months 6-12)
- [ ] One new niche pack per month.
- [ ] Learning loop: nightly Retro agent, eval-gated prompt/playbook changes, cross-company playbook library.
- [ ] Creator marketplace Phase B (creators join, opportunity feed, matchmaking, % of payouts).
- [ ] Agency / white-label tier, Workers for Platforms custom-code tier.
- [ ] Fine-tuned small models for high-volume tasks.
