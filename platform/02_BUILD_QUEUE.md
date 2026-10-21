# Crewzero build plan: next steps and phases

Who does what:
- 👤 **Owner**: only things that need your identity, signature, payment or login (accounts, applications, legal, purchases).
- 🤖 **Builder**: Claude Code (main) + Codex (reviewer) writing the code.
- ⚙️ **Crewzero agents**: once live, they run our own company (Company #0) and Masar (Company #1).

Rule (from Masar): an item is done only when it has been **run and verified**, not just written.
Timeline assumes a full-time solo founder + AI. Phases overlap where noted.

---

## Week 0: next 7 days (start now)

### 👤 Owner
1. **Domains**: buy `crewzero.ai` (main), `crewzero.app` (tenant previews; a separate domain keeps user sites isolated from our app), `crewzero.co` (protection).
2. **Handles**: claim `@crewzero` (or closest) on X, Instagram, TikTok, YouTube, LinkedIn page, Facebook page, Threads, Reddit, Product Hunt.
3. **Trademark**: file intent-to-use application CREWZERO (standard characters), classes 9, 35, 42, owner Masar AI LLC (~$350/class). Optional attorney check on CrewAI.
4. **Accounts (under Masar AI LLC)**:
   - GitHub: new private repo `crewzero` (or let the builder create it).
   - Cloudflare (Workers Paid; enable Cloudflare for SaaS), Supabase (Pro org), Trigger.dev, Langfuse, Sentry, PostHog.
   - AWS (SES; request production access, which takes ~1 day).
   - Stripe: a **separate Stripe account for Crewzero under Masar AI LLC** (clean books from Masar), enable Billing + Connect (Express).
   - Model API keys with monthly spend limits: Anthropic, OpenAI, xAI, Google AI, Perplexity.
   - Dev tools: Claude Max 20x + ChatGPT plan with Codex.
5. **Long-lead applications** (some take weeks):
   - **GoDaddy reseller (API)** account + test (OTE) keys + prepaid balance.
   - **Meta**: Business Manager for Crewzero, business verification (Masar AI LLC documents), developer app created (App Review comes in P3 once screens exist).
   - **Google Ads**: manager account (MCC) + API developer token application.
   - **Twilio**: account + ISV setup (A2P) — can wait until P6 if needed.
   - **Modash** (creator API) — can wait until P6.

### 🤖 Builder
1. Monorepo skeleton + `CLAUDE.md` rules (Masar's definition of done, multi-tenancy, no dead buttons) + CI (typecheck, lint, tests).
2. **Waitlist site on crewzero.ai**: one input box ("type your idea") -> instant free idea score (cheap model) -> join waitlist -> referral link to move up. This starts build in public with something real.
3. Draft Privacy Policy + Terms of Service (needed for Meta/Google reviews; owner reviews).
4. Build-in-public kit: Day-1 post/video script, weekly format, metrics page skeleton.

**Week 0 done when:** domains + handles owned, trademark filed, all accounts open, applications submitted, waitlist live and collecting signups, Day-1 post published.

---

## Phase 1: Foundation (weeks 1-2)

**Goal:** the plumbing every later feature sits on.

| Area | Deliverable |
|---|---|
| Repo | `apps/dashboard` (React/Vite), `apps/renderer` (Next.js on Workers), `apps/api` (Hono), `packages/agents`, `packages/model-router`, `packages/db`, `packages/ui`, `packages/config` (brand.ts, plans.ts) |
| Database | Supabase: auth, `companies`, `memberships`, `plans`, `credit_ledger`, `usage_events`, `unit_costs`, `audit_log`, `provisioning_steps`; RLS on every table; two-company isolation test |
| Edge | Dashboard on Cloudflare; wildcard `*.crewzero.app` served by renderer from tenant config |
| Agents | Trigger.dev project; `model-router` with direct keys + Cloudflare AI Gateway; Langfuse tracing on every call; cost logged per call |
| Billing | Stripe Billing in test mode with **hidden draft tiers** + credit packs |
| Ops | Environments dev/staging/prod; Sentry; Better Stack uptime |

**Done when:** a test user signs up, a company row is created, a preview site renders on `test.crewzero.app`, and one agent call is traced with its cost logged.

---

## Phase 2: The aha moment (weeks 3-6)

**Goal:** a stranger types an idea and gets a business plan + live site preview in under 20 minutes, free.

- One input box + 3 onboarding paths (idea / running business URL / import repo).
- Research agents in parallel (Perplexity, Grok, web): market, competitors, niche options, ICP. Streamed live into the org chart.
- Coach: validation report, Go / Pivot / Kill score, pushback on weak points.
- Business plan: offer, pricing, channels (channel-fit engine), 90-day roadmap, First Win plan.
- Domain-first name suggestions (GoDaddy availability API) + brand kit.
- 5 hardened templates: local service, book-a-call/VSL, store, SaaS landing, lead magnet. Rendered on `<slug>.crewzero.app`.
- Abuse limits and a cost cap per free signup.

**Done when:** 10 outside testers each get plan + preview in < 20 min; free-stage cost measured (target < $1-3 per signup); nothing broken in the preview.

---

## Phase 3: Launch button + money rails (weeks 5-8, overlaps P2)

**Goal:** "Launch" turns the preview into a live business that can take money.

- Checkout: choose (hidden draft) tier -> Stripe Billing.
- Domain purchase through **GoDaddy reseller API** (registrant = user, our markup) -> **Cloudflare for SaaS** custom hostname -> SSL.
- **Stripe Connect Express** onboarding (KYC) -> Risk agent review -> platform checkout/booking/invoices on the tenant site, application fee (revenue share).
- **SES** sending identity per tenant domain (SPF/DKIM/DMARC set automatically) + built-in inbox (Cloudflare Email Routing).
- Provisioning workflow: every step retryable and visible in the UI.

**Done when:** one test company goes from idea -> paid -> own domain live with SSL -> takes a real $1 payment -> payout scheduled -> email sent from its domain.

---

## Phase 4: Autopilot core (weeks 7-11)

**Goal:** a company runs itself day to day.

- Orchestrator daily cycle per company; credit reserve -> settle when the task passes testing.
- Coach chat -> orchestrator -> owning agent; challenge protocol; playbook knowledge base v1 (first 100 cards).
- QA & Compliance Guard on every public output.
- Org-chart dashboard (live), agent detail pages, KPIs, credit pace, aggressiveness slider.
- Engines v1:
  - Social posting (Facebook Page + Instagram via connect wizard; then others).
  - **Meta ads Mode 1** (ad account per company under our Business Manager, prepaid balance, 20%-style fee logic per decided %).
  - Email flows (welcome, abandoned cart, newsletter).
  - Content -> DM closer + speed-to-lead (reply within 60 s).
- Finance agent v1 (our books, Stripe reconciliation), Risk agent v1 (Connect review, disputes queue: case by case).
- 👤 **Meta App Review** submitted as soon as these screens work (needs screencasts + privacy policy).

**Done when:** one company runs 14 days on autopilot with zero manual fixes, posting daily, running a prepaid ad campaign, answering DMs, and sending a daily report.

---

## Phase 5: Masar proof + private beta (weeks 8-14, overlaps P4)

**Goal:** prove it on a real business and collect the data to set prices.

- Import **Masar OS** (continue mode): repo + `lovable-build/` docs -> tasks from `SOLO_STATUS.md` gaps -> **Engineering agent** finishes them in a sandbox, PRs reviewed.
- Masar go-to-market on Crewzero: B2B email, LinkedIn, trucking Facebook groups, calculators/lead magnets, demo funnel (creators come in P7).
- Masar baseline at week 0 of this phase -> public 30-day report.
- **Private beta**: 20-50 companies from the waitlist (mixed business types).
- **Credits and tiers test** (30 days): real cost per action -> set credit values -> confirm small tiers reach a First Win.

**Done when:** Masar 30-day report published; tier prices and credit values set from real data; beta M1 retention and Time to First Result measured.

---

## Phase 6: Public launch (around month 4)

- Publish tiers (Business 1-10 + top-ups).
- Launch week: Product Hunt + Show HN + X/LinkedIn/YouTube + live "build a business in 20 minutes" stream, same day.
- Directories (There's An AI For That, Futurepedia, G2, Capterra, AlternativeTo...), comparison pages, 30% recurring affiliate program.
- Viral loops: "Built & run by Crewzero" badge, shareable idea score card, referral credits.
- Public live metrics page.
- Founder Grant Contest season 1 (official rules drafted by counsel).

**Done when:** first 100 paying companies.

---

## Phase 7: Growth engines (months 4-6)

- Click-to-message ads + AI Closer (Messenger / Instagram / WhatsApp), booking + deposits.
- Lead-gen engines: Meta instant forms, VSL pages, quizzes/calculators, webinars.
- Voice receptionist + missed-call text-back (Twilio subaccounts + Vapi), A2P registration per business.
- Creator agent (Modash API): search -> score -> outreach -> deal -> tracking -> payout.
- Google Ads (our MCC), TikTok ads/posting, YouTube/LinkedIn/Pinterest/X posting.
- Engineering agent for custom features per company (Workers for Platforms).

**Done when:** each engine has at least 10 companies using it with measured results.

---

## Phase 8: Moat (months 6-12)

- One new niche pack per month, chosen from data.
- Learning loop: nightly Retro agent, eval-gated prompt/playbook updates, cross-company playbook library.
- Creator marketplace phase B (creators join, opportunity feed, matchmaking, % of payouts).
- Agency / white-label tier.
- Fine-tuned small models for high-volume tasks.
- Fundraising decision based on public metrics (bootstrap vs accelerator vs angels vs community round).

---

## Dependencies to watch
- Meta App Review needs working screens + privacy policy -> submit in Phase 4; business verification must start in Week 0.
- Google Ads developer token approval can take weeks -> apply in Week 0, used in Phase 7.
- SES production access -> request in Week 0, used in Phase 3.
- GoDaddy reseller approval + prepaid balance -> Week 0, used in Phase 2 (availability) and Phase 3 (purchase).
- Pricing is not published until Phase 5 data is in.
