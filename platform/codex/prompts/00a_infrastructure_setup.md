# Prompt 00a: infrastructure setup by Codex (Week 0, run FIRST)

Read `AGENTS.md` first. This prompt sets up the real accounts' resources through their APIs:
buy the domains on **Hostinger**, set up **Cloudflare**, **Supabase**, **Amazon SES** and the **Cloudflare AI Gateway**.

## 0. What the owner must do before running this (Codex cannot)
Codex cannot sign up for accounts, pass email/phone checks, add payment cards or turn on 2FA. The owner does this once:
| Account | Owner action | Token to put in Codex environment secrets |
|---|---|---|
| Hostinger (existing) | Default payment method on file; a WHOIS contact profile for Masar AI Inc. (needed for .ai/.app/.co) | `HOSTINGER_API_TOKEN` (hPanel -> Account -> API) |
| Cloudflare | Create account, add card, Workers Paid plan | `CF_API_TOKEN` (permissions: Zone Edit, DNS Edit, Workers Scripts Edit, Workers R2 Storage Edit, AI Gateway Edit, Email Routing Edit, SSL and Certificates Edit, Account Settings Read), `CF_ACCOUNT_ID` |
| Supabase | Create account + organization, Pro plan, card | `SUPABASE_ACCESS_TOKEN` (personal access token), `SUPABASE_ORG_ID` |
| AWS | Create account, card, root MFA; create IAM user `unstaffd-setup` with SES, SNS and limited IAM permissions | `AWS_SETUP_ACCESS_KEY_ID`, `AWS_SETUP_SECRET_ACCESS_KEY`, `AWS_REGION` (e.g. us-east-1) |
| Cloudflare AI Gateway credits | Buy the first unified-billing credits in the Cloudflare dashboard (payment) | — |
| Spending limits | Decide | `MAX_PURCHASE_USD` (e.g. 400), `PURCHASE_APPROVED` (`no` until the owner approves the quote) |

Codex cloud: enable **internet access** for this environment with an allowlist: `api.hostinger.com`, `developers.hostinger.com`, `api.cloudflare.com`, `api.supabase.com`, `*.amazonaws.com`, `registry.npmjs.org`.

## 1. Safety rules for this prompt
- **Never print, log or commit a secret value.** Generated secrets (DB passwords, keys) go straight into the Cloudflare/Supabase secret stores and are referenced by name only.
- **Every paid action needs approval.** First produce a quote; only buy when `PURCHASE_APPROVED=yes` and the total is <= `MAX_PURCHASE_USD`. Otherwise stop and print the quote for the owner.
- **Idempotent scripts.** Everything lives in `infra/scripts/*.ts` (run with `pnpm infra:<step>`), safe to re-run, with a `--dry-run` flag.
- **Record everything** (names, IDs, statuses; no secrets) in `infra/STATE.md`.

## 2. Tasks
### A. Domains on Hostinger (`infra/scripts/domains.ts`)
1. Check availability of `unstaffd.com`, `unstaffd.ai`, `unstaffd.app`, `unstaffd.co` (Hostinger domains availability endpoint; max 10 requests/min).
2. Read prices from the Hostinger catalog (prices are in cents). Note: `.ai` needs a 2-year minimum.
3. Print a quote (domain, years, price, total). Stop unless approved (rules above).
4. When approved: purchase via `POST /api/domains/v1/portfolio` using the owner's WHOIS profile and default payment method. Turn on auto-renew and WHOIS privacy where offered.
5. Record order IDs and expiry dates in `infra/STATE.md`.

### B. Cloudflare (`infra/scripts/cloudflare.ts`)
1. Add zones `unstaffd.com`, `unstaffd.app`, `unstaffd.ai` and `unstaffd.co` (.ai and .co redirect to .com); read the assigned Cloudflare nameservers.
2. Set those nameservers on the Hostinger domains via the Hostinger API; poll until the zones are **active**.
3. DNS: apex + `www` for unstaffd.com -> dashboard Worker; wildcard `*.unstaffd.app` -> renderer Worker.
4. Create R2 bucket `unstaffd-media` (+ `unstaffd-media-staging`).
5. Enable **Email Routing** on unstaffd.com (catch-all -> Worker placeholder, `hello@` forward to owner email from env `OWNER_EMAIL`).
6. **Cloudflare for SaaS** on the unstaffd.app zone: fallback origin = renderer, ready for custom hostnames (Phase 3).
7. Create **AI Gateway** `unstaffd-gateway` (logging on, caching on for idempotent tasks, rate limit per IP for the free idea score). If provider keys are present (`ANTHROPIC_API_KEY`, etc.), register them as BYOK; otherwise use unified billing.
8. Smoke test: one tiny model call through the gateway (cheapest model) and report status + cost.

### C. Supabase (`infra/scripts/supabase.ts`)
1. Create projects `unstaffd-prod` and `unstaffd-staging` in `SUPABASE_ORG_ID`, region `us-east-1`; generate strong DB passwords (never printed).
2. Wait until healthy; fetch project URL, anon key, service role key.
3. Enable extensions `pgvector`, `pg_net`, `pgcrypto`.
4. Auth settings: site URL `https://unstaffd.com`, redirect URLs (localhost, staging, prod), email provider = SES SMTP (after step D).
5. Store URL/keys as secrets: Cloudflare Workers secrets (`wrangler secret put`) for dashboard/api/renderer, and local `.env.local` for the owner's machine only.

### D. Amazon SES (`infra/scripts/ses.ts`)
1. Create SES domain identity `unstaffd.com` with Easy DKIM; create a custom MAIL FROM `mail.unstaffd.com`.
2. Write DKIM CNAMEs, SPF, MAIL FROM MX/TXT and DMARC (`p=none` to start, reports to `OWNER_EMAIL`) into Cloudflare DNS; poll until **verified**.
3. Configuration set `unstaffd-default` + SNS topic for bounces/complaints (webhook target `apps/api` later).
4. Create IAM user `unstaffd-app-ses` with send-only permission; store its keys as Workers secrets; generate SES SMTP credentials for Supabase Auth.
5. Request **production access** (`sesv2 put-account-details`, use case: transactional + opt-in waitlist emails for unstaffd.com). AWS reviews it (~1 day); record status.
6. Send a test email to `OWNER_EMAIL` from `hello@unstaffd.com` (works in sandbox to a verified recipient: verify `OWNER_EMAIL` as a recipient first).

### E. Wrap-up
1. `infra/STATE.md`: every resource, ID, region, status, and what is still pending (e.g. SES production approval).
2. `infra/OWNER_TODO.md`: only the steps that truly need the owner (approve quote, buy AI Gateway credits, delete `unstaffd-setup` IAM user after setup, etc.).
3. Suggest the owner **rotate/revoke** the setup tokens once this prompt is complete.

## Acceptance
- Domains owned (or a quote waiting for approval), zones active on Cloudflare, wildcard DNS live.
- Supabase prod + staging healthy; secrets stored; nothing secret in git.
- SES identity verified; test email received; production access requested.
- AI Gateway smoke call succeeded with cost shown.
- Report per definition of done, including exactly what is pending and why.
