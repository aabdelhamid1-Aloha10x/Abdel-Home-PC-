# Prompt 03: Launch button + money rails (Phase 3, weeks 5-8)

Read `docs/01_INFRASTRUCTURE.md` §1, §3 and `docs/00_MASTER_SPEC.md` §12. Prompt 02 must be done.

## Goal
"Launch" turns a preview into a live business that takes real money on its own domain.

## Tasks
1. **Subscription checkout**: Stripe Billing (Crewzero Stripe account) for the selected tier + credit top-up packs. Webhooks in `apps/api` (signature verified, idempotent) -> `subscriptions`, `credit_ledger` grants. Customer portal for plan changes and online cancellation.
2. **Domain purchase** (GoDaddy reseller API): agreement acceptance, purchase with registrant = user's contact details, price = cost + markup, charged via Stripe first. Store in `domains(company_id, name, registrar, status, expires_at, auto_renew, cost, price)`. Renewal job charges renewal price 30 days before expiry.
3. **Custom hostname**: Cloudflare for SaaS API -> create custom hostname -> set DNS at GoDaddy (CNAME/A per Cloudflare instructions) -> poll SSL status -> mark live. Also "connect a domain I already own" with DNS instructions + verification.
4. **Stripe Connect Express** for the tenant: create account, hosted onboarding link, webhook `account.updated` -> Risk agent review task (checks prohibited categories, flags) -> `connect_accounts.status`.
5. **Tenant checkout on the site**: renderer components for buy button / booking deposit / invoice link using destination charges or direct charges with `application_fee_amount` = revenue share % from config. Only our Connect is supported in templates.
6. **Email**: SES identity per tenant domain (DKIM records set automatically at GoDaddy), `packages/email` sending with per-tenant from-address; SES bounce/complaint webhooks; built-in inbox via Cloudflare Email Routing -> Worker -> `inbox_messages`.
7. **Provisioning workflow** (Trigger.dev `launch_company`): every step above as a retryable step with status in `provisioning_steps`, shown live in the UI. No silent half-finished states.
8. **Disputes queue**: `disputes(company_id, task_id/charge_id, reason, status, decision, decided_by)`; support form in dashboard; admin review screen (case by case; no automatic refunds).

## Acceptance (test mode + one real $1 run by owner)
- Idea -> paid subscription -> domain bought (OTE) -> custom hostname SSL active -> Connect onboarded -> $1 test payment on tenant site -> application fee recorded -> email sent from tenant domain -> inbound email appears in dashboard.
- Report per definition of done.
