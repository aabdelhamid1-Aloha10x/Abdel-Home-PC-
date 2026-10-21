# Building Unstaffd with Claude: what the owner connects, how we work

Status: ACTIVE. Date: 2026-10-21.
Model: Claude builds, tests and deploys; the owner connects accounts and reviews. The owner never writes code.

---

## Step 1 — The code home (10 minutes)
1. github.com -> New repository -> name `unstaffd` -> **Private** -> Create (empty, no README).
2. Go to **https://claude.ai/connect-github**: make sure your GitHub account is connected and the **Claude GitHub App** is installed with access to `unstaffd` (choose "Only select repositories" -> add `unstaffd`).
3. Tell Claude "repo is ready". Claude attaches it to the session (or you start a new session with `unstaffd` selected) and pushes the full package (docs, prompts, AGENTS.md) as the first commit.

## Step 2 — The cloud environment Claude works in (5 minutes)
In the Claude Code session: click the **environment name in the session title bar -> Edit**.
- **Network access**: choose **Limited** and add these under *Allowed domains* (keep "Allow package managers" ticked):
  `api.cloudflare.com`, `api.supabase.com`, `*.supabase.co`, `api.stripe.com`, `api.godaddy.com`, `api.ote-godaddy.com`, `api.hostinger.com`, `*.amazonaws.com`, `api.anthropic.com`, `api.openai.com`, `api.x.ai`, `generativelanguage.googleapis.com`, `api.perplexity.ai`, `gateway.ai.cloudflare.com`, `api.trigger.dev`, `cloud.langfuse.com`, `graph.facebook.com`, `googleads.googleapis.com`, `api.twilio.com`, `api.vapi.ai`, `api.elevenlabs.io`, `api.apollo.io`
  (Or pick the broadest level if you prefer fewer prompts later.) Docs: https://code.claude.com/docs/en/cloud-environments#network-access
- **Secrets**: under **Network secrets** (or "Environment variables" in older apps) add each key below with **exactly** these names. Never paste a key into chat.
- Start a **new session** after saving (secrets are read when a session starts).

## Step 3 — Accounts and keys (do in this order; each is identity/payment, so only you can do it)
| # | Service | You do | Secret name(s) for Claude | Needed by |
|---|---|---|---|---|
| 1 | Domains (Hostinger) | Buy unstaffd.com, .ai, .app, .co (or let Claude buy them via API) | `HOSTINGER_API_TOKEN` (hPanel -> Account -> API) | Week 0 |
| 2 | Cloudflare | Sign up, add card, Workers Paid plan; API token with Zone/DNS/Workers/R2/AI Gateway/Email Routing/SSL edit | `CF_API_TOKEN`, `CF_ACCOUNT_ID` | Week 0 |
| 3 | Supabase | Sign up, create org, Pro plan; Account -> Access Tokens | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_ORG_ID` | Week 0 |
| 4 | AWS (email) | Sign up, card, MFA; IAM user `unstaffd-setup` (SES, SNS, limited IAM) | `AWS_SETUP_ACCESS_KEY_ID`, `AWS_SETUP_SECRET_ACCESS_KEY`, `AWS_REGION` | Week 0 |
| 5 | AI models | Create API keys with monthly spend limits: Anthropic, OpenAI, xAI, Google AI, Perplexity | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `XAI_API_KEY`, `GOOGLE_AI_API_KEY`, `PERPLEXITY_API_KEY` | Week 0 |
| 6 | Stripe | New Stripe account for Unstaffd under Masar AI Inc.; enable Billing + Connect (Express); **restricted key** | `STRIPE_SECRET_KEY` (test mode first) | Phase 1 |
| 7 | Trigger.dev, Langfuse, Sentry, PostHog | Sign up (free tiers to start) | `TRIGGER_SECRET_KEY`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `SENTRY_DSN`, `POSTHOG_KEY` | Phase 1 |
| 8 | GoDaddy reseller | Apply for reseller/API access, add prepaid balance | `GODADDY_API_KEY`, `GODADDY_API_SECRET` | Phase 2 |
| 9 | Meta | New "Unstaffd" business portfolio under your verified business; developer app; system user token | `META_APP_ID`, `META_APP_SECRET`, `META_BUSINESS_ID`, `META_SYSTEM_USER_TOKEN` | Phase 4 |
| 10 | Google Ads | Existing manager account + developer token; create "Unstaffd clients" sub-manager | `GOOGLE_ADS_*` (see `.env.example`) | Phase 7 |
| 11 | Twilio + Vapi | Sign up; Twilio ISV/A2P registration | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `VAPI_API_KEY` | Phase 7 |
| 12 | Leads | Apollo API key (Clay already connected) | `APOLLO_API_KEY` | Phase 7 |
| 13 | Company formation partner | Contact doola (Formation API) sales; Stripe Atlas partner team | `DOOLA_API_KEY` (when issued) | Phase 7 |

Tip: use **restricted / least-privilege** keys and turn on spend limits everywhere. After Week 0 setup, delete the `*_SETUP_*` keys.

## Step 4 — Connectors (optional, makes some work faster)
At **https://claude.ai/customize/connectors**: authorize **Stripe** (already listed in this workspace, waiting for sign-in) and add Cloudflare, Supabase and Hostinger connectors if they appear in the directory. Then start a new session. Everything still works with the API keys alone.

## Step 5 — How we work, every phase
1. **Claude builds** the phase (from `codex/prompts/…`, same order), with tests, on a branch.
2. **Claude self-reviews**: runs typecheck, lint, tests, a second-model review of the diff, and clicks through the app in a headless browser.
3. **Claude deploys to staging** (`staging.unstaffd.com`) and sends you: the link, a 5-line "what to try" checklist, screenshots, and what was NOT verified.
4. **You review** in your browser/phone and reply: approve, or what's off ("the coach is too pushy", "this button should…").
5. Claude fixes, then merges and deploys to production.
6. Every Friday: a short build-in-public summary (what shipped, numbers, next week), ready to post.

Note on usage: building a platform this size uses a lot of Claude usage. If your plan runs out mid-phase, the same prompts work in Codex; the repo is the single source of truth either way.

---

## New service: "Start your company" (formation, EIN, bank account)
Findings (Oct 21 2026):
- **Stripe Atlas** ($500 one-time; Delaware C-corp or LLC, EIN, 83(b) filing) is a **self-serve founder product with no public API for platforms** to incorporate on a user's behalf. The closest integrations are partnerships (e.g. Carta). Options: Atlas partner/referral link inside our flow, and ask Stripe's Atlas team about a partnership. (The Stripe connector in this workspace also lists an Atlas company-formation tool; once Stripe is authorized, Claude will check what it allows.)
- **Formation APIs that already serve platforms**:
  - **doola Formation API**: state filing, **EIN**, registered agent, business address, annual reports; powers formation inside Ramp and Whop (2026).
  - **FileForms API**: LLC formation, EIN, annual reports, registered agent, all 50 states.
  - **Palm**: name check, filing, EIN, documents in one API.
- **Bank account**: Mercury and similar banks have referral/partner programs; their APIs manage existing accounts, not open accounts for others. Opening accounts inside our app would need an embedded-banking provider (heavy regulation); start with referral links.
- **Pricing**: we resell formation at the partner's wholesale price + our markup (e.g. a "Company setup" package: formation + EIN + registered agent year 1 + operating agreement template), and earn referral fees on banking.
- **Rules**: state certificate of formation and EIN confirmation letter are delivered by the partner into the company's document vault; we are not a law firm (no legal advice; entity-choice guidance is general, with an attorney referral for complex cases).
- **Plan**: Phase 7 capability `form_company` with providers doola (primary) / FileForms (backup) / Atlas (referral for Delaware C-corp + Stripe perks).
