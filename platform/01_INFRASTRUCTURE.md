# Infrastructure: where we build, host, and run every tenant

Status: DRAFT recommendation for owner decision. Date: 2026-10-21.
Prices are approximate, from vendor pages and third-party guides (Sept-Oct 2026). Verify on each vendor's pricing page before buying.

Principles:
1. **Solo-operable.** Managed services over self-hosted. One founder + agents must be able to run it.
2. **One multi-tenant system, not one deployment per customer.** Every tenant site is served by the same tested renderer from config in the database (Shopify model). That is how we avoid "agents crashed the product".
3. **Cost scales with paying usage.** No large fixed per-tenant cost for free/trial users.
4. **Same stack family as Masar OS** (React, TypeScript, Supabase, Tailwind, shadcn), so Lovable, Claude Code and Codex can all work on it and Masar patterns carry over.
5. **Isolation by default.** Tenant data, credentials and agent tool access are always bound to one company server-side.

---

## 1. Decision table

| Layer | Pick | Why | Alternative |
|---|---|---|---|
| Code | GitHub monorepo (pnpm + Turborepo) | One repo for dashboard, renderer, agents, shared types | — |
| Platform dashboard (the app users log into) | React + Vite + TypeScript + Tailwind + shadcn/ui | Same as Masar OS; Lovable-compatible | Next.js |
| Dashboard hosting | Cloudflare Workers (static assets) | Cheap, global, same vendor as tenant edge | Vercel |
| Core backend | **Supabase** (Postgres, Auth, Storage, Edge Functions, RLS, pgvector, Realtime) | Owner already runs Masar on it; RLS multi-tenancy; Realtime powers the live org chart | Neon + custom auth |
| Webhooks / public API | Hono on Cloudflare Workers | Fast, cheap, handles Stripe/Meta/Twilio webhooks | Supabase Edge Functions |
| **Agent runtime** (orchestrator, daily cycles, long jobs) | **Trigger.dev** (TypeScript tasks, no timeouts, schedules, retries, per-tenant concurrency keys) | Durable long-running agent jobs without running our own queue | Inngest; Temporal later at scale |
| Code sandboxes (finishing imported apps, custom code tier) | E2B or Daytona sandboxes; or Claude Managed Agents (Anthropic-hosted sandbox) | Untrusted/generated code never runs on our servers | Modal |
| LLM gateway | Own `model-router` module + **Cloudflare AI Gateway** (logging, caching, rate limits, provider fallback), **direct API keys** to Anthropic, OpenAI, Google, xAI, Perplexity | One call path for every agent; no token markup; full Batch API (50% off) and prompt caching | OpenRouter only for experiments / long-tail models (5.5% credit fee) |
| LLM tracing + evals | **Langfuse** | Traces every agent run; feeds eval sets and the learning loop | Braintrust, Helicone |
| **Tenant sites** (websites, stores, funnels, booking pages) | One multi-tenant **Next.js renderer on Cloudflare Workers** (OpenNext); tenant config + content in Postgres; edge-cached | SEO-friendly SSR, one tested codebase for all tenants | Astro on Workers; Vercel Platforms |
| Platform subdomains | Wildcard `*.<platform>.app` | Instant site preview during onboarding | — |
| **Custom domains** | **Cloudflare for SaaS** custom hostnames (auto SSL). 100 included, then ~$0.10/hostname/mo | Built for SaaS with customer domains | Vercel domains API |
| Domain registration | **GoDaddy reseller API** (DECIDED). .com wholesale ~$10.69/yr, our markup on registration + renewals, registrant = the user. Users can also connect a domain they already own | Full markup revenue from day one | Entri Sell; Hostinger has no domain reseller API (see `04_COST_ANALYSIS.md` §5) |
| Custom code tier / per-tenant JS | **Workers for Platforms** ($25/mo: 20M requests, 1,000 scripts; $0.02/extra script) | Isolated per-tenant scripts on our account | Separate projects per tenant |
| Imported apps (continue mode) | **Bring-your-own infra first**: keep the tenant's existing Supabase/Lovable/Vercel; agents work via their repo + credentials. Optional migration later | Masar stays where it is; no risky migration | Dedicated Supabase project per tenant (premium) |
| Files / media | **Cloudflare R2** (no egress fees) | Videos, images, brand kits | Supabase Storage for small files |
| Video delivery | Cloudflare Stream | UGC/VSL playback on tenant sites | Mux |
| Transactional email (tenant domains) | **Amazon SES** (cheapest at volume) or Resend (simplest). Per-tenant sending domain with SPF/DKIM/DMARC set by agent | Deliverability isolated per tenant | Postmark |
| Inbound email / company inbox | Cloudflare Email Routing -> Worker -> Postgres | Each company gets hello@theirdomain into the dashboard at near-zero cost | Postmark inbound; Google Workspace as paid upsell for a full mailbox |
| Social accounts | User creates/owns accounts; connect wizard (OAuth) grants us posting/messaging access; agents prepare names, bios, images | Platforms do not allow account creation by API | — |
| Ad accounts | Mode 1: one ad account per company under **our** Meta Business Manager / Google Ads MCC, prepaid balance (Polsia model). Mode 2: user's own ad account via partner access | Fast aha moment by default; ownership option for running businesses | — |
| Cold outreach (B2B only) | **Separate** secondary domains + warm-up/sending provider API (Instantly or Smartlead) | Never touches transactional reputation | — |
| Phone + SMS | **Twilio** subaccount per tenant; A2P 10DLC brand + campaign per business (we register as ISV) | Clean per-tenant billing and compliance | Telnyx |
| Voice agents | **Vapi** (BYO provider keys) + ElevenLabs voices | Already used in Masar | OpenAI Realtime |
| Payments (us) | **Stripe Billing** (tiers, credit packs), Stripe Tax | Same as Masar | — |
| Payments (tenants) | **Stripe Connect Express** + application fees; Stripe Identity; Radar | Revenue lock + KYC + payouts + 1099s | — |
| Accounting (us) | Finance agent on Stripe + bank feed (Plaid) + QuickBooks/Xero API | Agent-run books | — |
| Research / SEO data | Perplexity Sonar, DataForSEO, Exa; Grok for X trends | Pay-as-you-go | Serper |
| Creator discovery | **Modash API** (from ~$199/mo, 350M+ creators) | Public API, covers search to payments | influencers.club, Upfluence |
| Browser automation (no-API sites) | Browserbase; or own Playwright workers on a VPS (same pattern as `masar-browser-worker/`) | Agents can use websites safely | Steel |
| Social posting | Direct platform APIs; aggregator (Ayrshare/Blotato-type) to start fast | Covers many networks in MVP | — |
| Product analytics (our app) | PostHog | Funnels, activation, retention | — |
| Tenant site analytics | First-party events -> Postgres (ClickHouse later) | Powers KPIs, contest, learning loop | Cloudflare Web Analytics |
| Errors / uptime | Sentry + Better Stack (synthetic checks on every tenant site) | Catch breakage before users | — |
| Secrets | Platform secrets in Cloudflare/Supabase/Trigger.dev secret stores (or Doppler); tenant OAuth tokens encrypted in Postgres (Supabase Vault), server-only | Never in the browser | Infisical |
| CI/CD | GitHub Actions; Supabase branching for preview DBs; environments dev / staging / prod | Safe deploys, auto rollback | — |

---

## 2. Architecture

```
                         ┌──────────────────────────────────────────┐
  Users ── browser ──►   │  Platform dashboard (React/Vite)          │  Cloudflare
                         │  onboarding · org chart · coach chat      │
                         └──────────────┬───────────────────────────┘
                                        │ Supabase Auth + RLS, Realtime
                         ┌──────────────▼───────────────────────────┐
                         │  Supabase Postgres (+pgvector)            │
                         │  companies · agents · tasks · credits ·   │
                         │  playbooks · memory · leads · kpis ...    │
                         └───▲───────────▲──────────────▲───────────┘
                             │           │              │
       ┌─────────────────────┴──┐  ┌─────┴──────────┐ ┌─┴──────────────────────┐
       │ Agent runtime          │  │ Webhooks/API   │ │ Tenant site renderer    │
       │ Trigger.dev tasks      │  │ Hono on Workers│ │ Next.js on Workers      │
       │ orchestrator, daily    │  │ Stripe, Meta,  │ │ *.platform.app +        │
       │ cycles, coach actions  │  │ Twilio, Vapi   │ │ custom domains (CF SaaS)│
       └───┬─────────┬──────────┘  └────────────────┘ └─────────────────────────┘
           │         │
           │   ┌─────▼──────────────┐     ┌─────────────────────────────────────┐
           │   │ model-router       │────►│ Cloudflare AI Gateway ─► Anthropic,  │
           │   │ (task -> model)    │     │ OpenAI, xAI, Google, Perplexity, ... │
           │   └────────────────────┘     └─────────────────────────────────────┘
           │
           ├──► Tool layer (company-scoped): Stripe Connect · Meta/Google/TikTok Ads ·
           │    social APIs · Twilio/Vapi · SES · registrar · Modash · DataForSEO ·
           │    HeyGen/Sora/Veo/ElevenLabs · Browserbase · E2B sandboxes · GitHub
           │
           └──► Langfuse (traces, evals) · Sentry · PostHog · R2 (media)
```

---

## 3. Tenancy model (how new users are hosted)

### Isolation tiers
| Tier | Who | Data | Site | Code |
|---|---|---|---|---|
| A. Shared (default, ~all users) | Every template-based company | Shared Postgres, `company_id` + RLS on every row | Shared renderer, per-tenant config | No custom code |
| B. Isolated code | Custom-code add-on, imported JS apps | Shared Postgres or tenant's own DB | Workers for Platforms script per tenant | Sandboxed builds (E2B), deployed per tenant |
| C. Bring-your-own / dedicated | Imported companies (Masar), enterprise | Tenant's own Supabase (or a dedicated project we create) | Their existing host, or ours | Their repo; agents work through GitHub + sandbox |

### Provisioning a new company (one idempotent Trigger.dev workflow, status shown live in the UI)
1. Create `companies` row + owner membership + credit ledger.
2. Assign subdomain `<slug>.<platform>.app` (wildcard DNS, instant).
3. Write site config from the chosen template; renderer serves the preview immediately.
4. On Launch (paid):
   - register domain via registrar API (registrant = user) -> add Cloudflare for SaaS custom hostname -> SSL auto-issued;
   - create Stripe Connect Express account -> hosted onboarding (KYC) -> Risk agent review;
   - create SES sending identity, set SPF/DKIM/DMARC via registrar DNS API; create inbound route;
   - schedule the company's daily agent cycle.
5. When an engine is enabled: Twilio subaccount + number + A2P registration; Meta/Google/TikTok OAuth connects (user's own ad accounts); creator search; etc.
Every step is retryable, logged in `provisioning_steps`, and visible to the user. Nothing silently half-finishes.

### Rules carried over from Masar OS
- Every business table has `company_id uuid not null`; RLS on every table; test with two companies.
- No service-role key in the browser. Role and plan checks in BOTH UI and database.
- Third-party credentials entered via OAuth or server-side forms, stored encrypted, never returned to the browser.
- Plans enforced from one source (`src/config/plans.ts` + `companies.plan`).

---

## 4. Agent runtime design

- **Daily cycle**: Trigger.dev schedule per company (staggered). Orchestrator reads KPIs + plan + memory -> picks highest-value tasks within the aggressiveness level -> fans out to agents.
- **Concurrency**: per-company concurrency key (one cycle at a time per company); global limits per provider to respect rate limits.
- **Credits**: atomic reserve before each task -> settle actual cost after -> automatic refund if the task fails QA or errors. Ledger table, never a mutable balance only.
- **Hard limits enforced in the tool layer, not the prompt**: spend caps, budget, allowed channels, niche compliance rules, destructive-action confirmation.
- **Company binding**: tools receive `company_id` from the server context, never from model output. An agent for company A cannot touch company B's credentials.
- **Prompt-injection defense**: web pages, DMs, emails and reviews are treated as data. Money-moving and public-posting tools require server-side policy checks regardless of what the model asks.
- **QA gate**: every public output (post, ad, email, page, DM template) passes the Compliance Guard before it ships.
- **Kill switches**: per agent, per company, global.
- **Observability**: every run traced in Langfuse (inputs, outputs, model, cost, outcome) and summarized into `agent_runs` for the dashboard.

---

## 5. Core data model (first cut)

Platform: `companies`, `memberships`, `plans`, `subscriptions`, `credit_ledger`, `usage_events`, `unit_costs`, `audit_log`, `provisioning_steps`, `connections` (encrypted OAuth tokens), `risk_flags`.
Agents: `agents`, `agent_tasks`, `agent_runs`, `agent_lessons`, `business_plans`, `plan_items`, `coach_threads`, `coach_messages`.
Knowledge: `playbook_cards` (+ embedding), `company_memory` (+ embedding), `eval_sets`, `eval_results`, `prompt_versions`.
Site: `sites`, `pages`, `site_versions`, `domains`, `templates`, `niche_packs`.
Growth: `channels`, `campaigns`, `creatives`, `ad_accounts`, `social_accounts`, `posts`, `lead_magnets`, `leads`, `contacts`, `conversations`, `messages`, `bookings`.
Money: `connect_accounts`, `orders`, `payments`, `refunds`, `application_fees`, `payouts`, `invoices`.
Creators: `creators`, `creator_deals`, `creator_links`, `creator_payouts`.
Contest: `contest_seasons`, `contest_entries`, `milestones`, `awards`.
Metrics: `kpis_daily` (per company), `site_events`.

---

## 6. Long-lead approvals and accounts (start in week 1: some take weeks)

| Item | Why | Notes |
|---|---|---|
| Legal entity | Required by Stripe, Meta business verification, registrar, Twilio | DONE: Masar AI LLC (Delaware), EIN, bank, Stripe |
| Meta: Business verification + App Review | Ads, Pages, Instagram messaging/publishing, lead ads, WhatsApp | Scopes such as ads_management, pages_messaging, instagram_manage_messages, instagram_content_publish, leads_retrieval, business_management, WhatsApp Tech Provider. Needs privacy policy, ToS, screencasts |
| Google Ads API developer token | Ads from our own MCC (Mode 1) | Still needed. OAuth app verification is **skipped at launch** (no Gmail, built-in calendar, ads via our own MCC); add only if we later connect users' Calendar / Business Profile / YouTube |
| TikTok for Business / Content Posting API audit | TikTok ads + posting | Audit required for public posting |
| YouTube Data API quota increase | Uploading Shorts/videos for tenants | Default quota is small |
| X API paid tier | Posting + trend data | Grok covers trend reading |
| LinkedIn Marketing Developer Platform | LinkedIn posting/ads | Hard to get; aggregator first |
| Stripe Connect platform (Express) | Tenant payments, KYC, payouts | Platform profile + use-case review |
| GoDaddy reseller account (API) | In-app domain purchase with markup | Apply in week 1; OTE sandbox for testing; prepaid balance |
| Twilio ISV + A2P 10DLC | SMS for tenants | Register as ISV; per-tenant brand/campaign |
| Modash API | Creator search | Paid plan |
| Cloudflare for SaaS + Workers for Platforms | Custom domains, per-tenant code | Enable on the account |

---

## 7. Environments, deploys, reliability

- Environments: `dev` (local + Supabase branch), `staging` (full copy, fake tenants), `prod`.
- Every PR: typecheck, lint, unit tests, migration check, renderer snapshot tests across all templates.
- Deploy: staged rollout of the renderer; automatic rollback on error-rate spike.
- Synthetic monitoring: Better Stack checks every live tenant site and the onboarding flow every few minutes.
- Backups: Supabase daily backups (PITR when revenue allows); R2 versioning for media.
- Status page public (part of the honesty story).

---

## 8. Cost at launch (approximate, monthly)

| Item | Approx. |
|---|---|
| Supabase Pro + compute (one project) | $25-100 |
| Cloudflare Workers Paid + Workers for Platforms (when needed) | $5 + $25 |
| Cloudflare for SaaS hostnames | first 100 free, then ~$0.10 each |
| Trigger.dev | ~$10-50 |
| Langfuse, Sentry, PostHog, Better Stack | free tiers -> ~$50-150 |
| Modash API | ~$199+ |
| DataForSEO, Perplexity, Exa | pay as you go |
| Registrar deposit | one-time, refundable against purchases |
| **Fixed total before usage** | **~$300-600/mo** |

Usage-based (passed through to tenants with markup via credits or billing): LLM tokens, Twilio, Vapi, ElevenLabs, HeyGen, video models, SES, domains.

### Scaling path
| Stage | Companies | Changes |
|---|---|---|
| 0 | 0-100 | Everything above, single Supabase project |
| 1 | 100-2,000 | Bigger Supabase compute, read replica for dashboards, event data partitioned |
| 2 | 2,000-20,000 | Events to ClickHouse, Trigger.dev self-host or Temporal, dedicated provider rate-limit pools, Cloudflare Enterprise for hostnames > 50,000 |

---

## 9. Masar OS in this infrastructure

- Masar stays on its current Lovable + Supabase stack (Tier C, bring-your-own).
- The Platform connects through: GitHub repo access, Lovable project, Supabase management access (scoped), Stripe (Masar's own account connected as a Connect account or via restricted key for analytics), Vapi, and the existing `masar-browser-worker` VPS.
- Agents work on Masar code inside a sandbox (E2B) and open PRs; nothing is pushed straight to production without passing Masar's own checks.
- Masar marketing runs on the Platform's growth agents like any other tenant.
