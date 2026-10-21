# Cost analysis: hosting, data, building, domains, models, email, phone, accounts

Status: DRAFT. Date: 2026-10-21. Prices come from vendor pages and third-party guides (2025-2026); several could not be confirmed on the official page. **Verify every price before committing.** Estimates are marked "est.".

---

## 1. Custom domains (customer sites on their own domain)

Free previews always use our wildcard subdomain (`company.platform.app`), which costs nothing per company. Custom domains are only needed for paying companies.

| Option | Per-domain cost | 1,000 domains | 10,000 domains | Notes |
|---|---|---|---|---|
| **Cloudflare for SaaS** | 100 free, then ~$0.10/mo | ~$90/mo | ~$990/mo | Auto SSL, DDoS, global edge. >50,000 hostnames = Enterprise |
| Self-hosted (Caddy on-demand TLS on a VPS, e.g. existing Hostinger KVM) | $0 | VPS only (~$10-30/mo) | VPS cluster | We own uptime, DDoS, certificate rate limits, scaling. Ops burden on a solo founder |
| Vercel (Pro, domains API) | no per-domain fee (check plan limits) | $20/seat + usage | usage grows | Simple, but compute/bandwidth cost more at scale |
| Entri Connect / Secure | quote only | — | — | Best UX for "connect my existing domain" (auto DNS for 35-70+ DNS providers) |

**Recommendation: Cloudflare for SaaS.** At ~$0.10 per domain per month against a $29+ subscription, it costs under 0.4% of revenue and removes all certificate and DDoS work. The self-hosted VPS route only makes sense if we pass ~10,000 domains and want to save ~$1K/mo, and that is not worth the risk early on.

---

## 2. Database and logins

| Option | Starting cost | At ~100k end users | Fit |
|---|---|---|---|
| **Supabase (managed)** | Pro $25/mo (incl. $10 compute credit, 100k MAU, 8 GB DB, 250 GB egress) | ~$25 + compute upgrades (est. $50-300/mo) | Postgres + Auth + Storage + Realtime + pgvector in one; owner already uses it for Masar |
| Supabase self-hosted (VPS) | VPS only | VPS only | Cheapest, but backups, security patches, upgrades and auth email are on us |
| Neon (Postgres) + Clerk (auth) | ~$19 + free auth tier | Clerk-style per-MAU pricing gets expensive with many end users | Two vendors, more glue |
| Neon + Better Auth (open source) | ~$19 | ~$19 + compute | Cheap, but we build more auth ourselves |
| Firebase | pay per read/write | unpredictable | NoSQL; poor fit for relational data and row-level isolation |

- Supabase extra MAU beyond 100k is billed per user (~$0.00325/MAU, verify). End customers of tenant sites (shoppers, leads) do **not** need logins in most cases, so MAU stays low.
- Supabase Team ($599/mo) is only needed later for SOC 2 / SSO requirements.

**Recommendation: managed Supabase.** Re-evaluate self-hosting at ~5,000+ active companies, when the compute bill justifies the work.

Est. monthly: stage 0 (≤100 companies) $25-50; stage 1 (≤2,000) $100-400; stage 2 (≤20,000) $600-2,000.

---

## 3. Building the Platform (our own development tools)

| Tool | Cost | Best for | Watch out |
|---|---|---|---|
| **Claude Code** (Claude Max 5x $100 / 20x $200 per month) | flat subscription, usage-capped | Main builder: full repo work, multi-file features, migrations, tests | Weekly caps on heavy use |
| **Codex** (included in ChatGPT paid plans; Pro ~$200) | flat subscription | Second builder and **reviewer**: independent review of every change (the Opus-builds / Codex-reviews pattern Polsia's founder uses) | — |
| Lovable | credits per message | Fast UI mockups | Gets expensive for heavy iteration (owner experience on Masar) |
| Cursor / others | ~$20-200/mo | IDE workflow | Optional |

**Recommendation:** Claude Code (Max 20x) as the main builder + Codex as reviewer ≈ **$220-400/mo flat**. Keep Lovable only for quick visual drafts, or drop it.

**Important rule:** consumer subscriptions (Claude Max, ChatGPT Pro) are for *our own development work*. The agents that serve customers **must use API keys and pay per token**. Subscriptions may not be used to power a product for other users.

---

## 4. Where the agents live

```
Customer clicks / daily schedule
        │
        ▼
Trigger.dev workers (cloud, or self-hosted on our VPS)      ← agent code (TypeScript) runs here
  ├─ orchestrator, coach, marketing, closer, finance agents → call model APIs (pay per token)
  ├─ tools: Stripe, Meta, Twilio, SES, registrar, Modash...  (company-scoped)
  └─ Engineering agent → starts a sandbox (E2B/Daytona) with the company's repo,
                         runs Claude Agent SDK or Codex CLI headless inside it,
                         runs tests, opens a PR, QA agent checks, then deploy
        │
        ▼
Supabase (state, memory, credits, KPIs)  +  Langfuse (traces)  +  R2 (media)
```

- Trigger.dev cloud: ~$10-50/mo to start, billed by compute time. Self-hosting it on the existing Hostinger VPS removes the meter but adds ops work.
- Sandboxes are billed per second while running; only Engineering tasks use them, and those are priced at 200-1,000 credits.
- Alternative: Claude Managed Agents (Anthropic hosts the agent loop and the sandbox) for Engineering tasks. Less to run ourselves, but tied to one provider.

---

## 5. Domains: registrar, reseller, Hostinger

**Registrar** = a company accredited to register domains (GoDaddy, Namecheap, Openprovider...). **Reseller account** = an account with a registrar that lets *our app* register domains for our users through an API, at wholesale price, and charge our own price (that is where the markup comes from).

| Option | Reseller account needed? | Markup revenue | Effort | Notes |
|---|---|---|---|---|
| A. User buys the domain anywhere and connects it | No | None | Lowest | Auto DNS setup via Entri Connect or a guided wizard |
| **B. Entri Sell** (domain purchase embedded in our app) | No: Entri is the seller | Commission paid by Entri (rate not published) | Low | No deposits, no domain support work for us |
| C. Registrar API on our account (Openprovider, GoDaddy reseller ~$10.69/yr .com wholesale, Namecheap API, NameSilo) | Yes | Full markup (e.g. +$3-5/yr + renewals) | Medium: deposit, support, renewals, transfers, disputes | Register in the **user's** name (Polsia registers in its own name first, and users complain) |
| Hostinger | — | Affiliate commission only | — | No domain reseller API found. Hostinger is ending cPanel reseller hosting (renewals stop Oct 1 2026, shutdown Oct 1 2027). Not a fit for in-app domain sales |

**Recommendation:** MVP = **A + B** (connect your own domain, or buy one in-app through Entri Sell). Move to **C** once domain volume justifies running a reseller account (roughly 500+ domains/yr). We do **not** need a reseller account to launch.

---

## 6. AI models: direct vs a router like OpenRouter

- **Our own router** is just code that picks the model for each task. It adds **$0** per token.
- **Cloudflare AI Gateway** (logging, caching, fallback) is free for the core features.
- **OpenRouter** charges no markup on token prices, but takes a **5.5% fee on credit purchases** (8% on Business). Bring-your-own-key: no fee on the first $25K/mo of usage, then 5%.

| Monthly token spend | Direct to providers | Via OpenRouter credits |
|---|---|---|
| $1,000 | $1,000 | ~$1,055 |
| $10,000 | $10,000 | ~$10,550 |
| $50,000 | $50,000 | ~$52,750 |

Direct access also gets the biggest savings in full: **Batch APIs (50% off)** for non-urgent work (nightly reports, retro agent, bulk content) and **prompt caching** (cached input on Claude ~5% of the normal input price). Those two levers save far more than the 5.5%.

**Recommendation:** connect **directly** to Anthropic, OpenAI, Google, xAI and Perplexity (≈95% of volume) through our router + Cloudflare AI Gateway. Use OpenRouter only for experiments and long-tail models.

---

## 7. Email: Hostinger mailboxes vs Amazon SES

These solve two different jobs:

| | Hostinger email | Amazon SES |
|---|---|---|
| What it is | Human mailbox (Outlook/Gmail-style inbox) | Sending engine for apps (API) |
| Cost | Included with Hostinger hosting plans | ~$0.10 per 1,000 emails (verify) |
| Sending limit | Per mailbox, rolling 24h; third-party tests show ~100/day on free email | Scales to millions after warm-up |
| Automation | Needs a Hostinger account/plan per customer domain; not built for app-driven sending; bulk sending against terms | Fully automated per tenant domain (SPF/DKIM/DMARC set by agent) |
| Inbox / reading | Yes | No (sending only) |

**Plan:**
- **Sending** (receipts, flows, newsletters, AI replies) through SES. 100,000 emails ≈ $10.
- **Receiving**: a built-in company inbox in our dashboard (Cloudflare Email Routing → Worker → database), so `hello@theirdomain` works at near-zero cost.
- **Optional upsell**: Google Workspace mailboxes for owners who want a full Gmail-style inbox.

---

## 8. Phone and SMS (Twilio)

**Yes, your understanding is right.** One **Twilio master account** (ours), with one **subaccount per customer company**:
- each subaccount has its own numbers, usage and logs, and can be suspended on its own;
- billing rolls up to our master account, and we re-bill customers through credits with markup;
- subaccounts are created only when a company turns on SMS or voice.

US texting requires **A2P 10DLC** registration per business (we register as an ISV):

| Fee | Approx. |
|---|---|
| Brand registration (one-time) | $4.50 (sole proprietor / low-volume) or ~$46 (standard, incl. vetting) |
| Campaign (monthly) | ~$1.50-10 depending on use case |
| Phone number | ~$1-2/mo |
| Messages / minutes | per use; voice agents ~$0.07-0.22/min all-in with Vapi |

Pass these through to the customer at cost + markup.

---

## 9. Google OAuth verification and Google Ads API

**Mostly correct, with one nuance.** Verification is done **once for our app**, not by each user. It is only required if our app asks for sensitive or restricted Google permissions, and only once more than 100 users connect.

| Google feature | Scope type | What it takes |
|---|---|---|
| Sign in with Google (name/email) | basic | No verification |
| Calendar (booking), Business Profile, Google Ads | sensitive | One-time app verification (privacy policy, demo video). Google Ads also needs a **developer token** approval |
| Reading/sending a user's Gmail | **restricted** | Verification **plus a yearly third-party security assessment (CASA)**: expensive and slow |

**Decision:** we **never request Gmail scopes**. Email runs on SES and our own inbox, so we avoid the security assessment entirely. Users who never connect Google never see any of this. We still verify our app once for Calendar / Business Profile / Ads (start early: Masar already hit the 100-user cap).

---

## 10. Social accounts and ad accounts: how Polsia does it, and our plan

**How Polsia does it** (from its changelog and third-party reviews):
- The company owner **connects an existing Facebook Page** (about 1 minute); agents post to it. Pinterest was added Sept 2026.
- **Meta ads run from Polsia's own shared ad account**, not the user's. The user gets no ad account or campaign history when leaving. Polsia takes 20% of the ad budget, and ads are funded from credits or a separate balance.
- Domains are registered in Polsia's name first (transfer after 60 days on request).

**What the platforms allow:** regular apps cannot create Facebook Pages, Instagram accounts, X accounts or YouTube channels through the API, and creating accounts on someone's behalf breaks most platforms' terms. So the user creates or connects their own accounts; we manage them after they grant access.

**Our flow (connect wizard, ~5-10 min total, inside onboarding):**
1. Agents prepare everything: handle availability per platform, bio, profile picture, cover, first posts.
2. The user logs in with **their own** Facebook (Facebook Login for Business). If they have no Page, we deep-link them to Meta's create-Page screen with our prepared details, then come back. Instagram is linked to the Page.
3. Same pattern for YouTube (Google login), TikTok, X, LinkedIn, Pinterest.
4. Our app gets posting/messaging access; the user stays the owner and admin.

**Ads (two modes):**
| | Mode 1: Platform-managed (Polsia model) | Mode 2: User's own ad account |
|---|---|---|
| Setup | Zero for user: we run ads from ad accounts under **our** Business Manager | User grants partner access to their ad account |
| Billing | User prepays an ad balance; we pay Meta; our fee taken automatically | Meta bills user's card; we bill the management fee |
| Pros | Fastest aha moment; full fee control | User owns history; one bad user cannot hurt our account |
| Risks | One user's policy violation can restrict **our** Business Manager; ad account limits; we must prepay (never front cash) | Setup friction |

**Recommendation:** Mode 1 by default for new/idea-stage users (small prepaid budgets, strict Compliance Guard, one ad account per company so problems stay contained). Mode 2 for running businesses and advanced users. Offer a migration path to Mode 2. Google Ads works the same way through a **manager account (MCC)** that can create client accounts for each company.

---

## 11. Monthly cost summary at launch (est.)

| Item | Est./mo |
|---|---|
| Supabase | $25-50 |
| Cloudflare (Workers, AI Gateway, SaaS hostnames, R2) | $5-40 |
| Trigger.dev | $10-50 |
| Langfuse, Sentry, PostHog, Better Stack | $0-150 |
| Modash (creator API) | ~$199 |
| Claude Max + Codex (our dev tools) | $220-400 |
| Domains (Entri Sell / connect) | $0 |
| Twilio / SES / models / video / voice | pass-through usage, re-billed with markup |
| **Total fixed** | **~$460-890/mo** |

---

## 12. Testing plan for credits and tiers (before publishing)

1. Instrument every action: real cost per action from Langfuse + provider invoices.
2. Run Masar + 10-20 beta companies (mixed: local service, e-commerce, B2B, idea-stage) for 30 days on hidden draft tiers.
3. Set credit values per action so cost ≤ 25-35% of credit sale price.
4. Check that Business 1-3 users reach a First Win before running out of credits; adjust included credits.
5. Publish tiers only after that review.
