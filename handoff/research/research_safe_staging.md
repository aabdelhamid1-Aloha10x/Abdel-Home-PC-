# Safe staging for A&H Fleet OS (Lovable + Supabase) - research (2026-10-10)

## 0. Key facts about THIS project
- get_database_status => `{"enabled":true,"stack":"supabase"}`: it uses a user-owned Supabase project via the Supabase integration (config.toml project_id = kldiqwkjrhpkcfjlbolw), NOT Lovable Cloud. So Cloud-only features (Cloud Backups UI, Test/Live, Drizzle migrations, Cloud remix backend copy) do NOT apply.
- config.toml lists ~125 functions all verify_jwt=false (incl. ghl-webhook, vapi-webhook, telegram-webhook, recruiting-inbound/outbound-worker, quickbooks-oauth-callback, gmail-oauth-callback). These are public endpoints on the prod Supabase URL.

## 1. Environments (does editing touch live?)
- Supabase integration: Lovable writes SQL, asks approval in chat, then "runs the migration on your Supabase project", saves file in supabase/migrations/, regenerates types. Edge functions: Lovable "deploys it to your Supabase project" directly at edit time. => A chat edit/approved migration/function change hits the PRODUCTION Supabase immediately; Publish only governs frontend hosting. https://docs.lovable.dev/integrations/supabase
- Frontend: Publish deploys a snapshot to lovable.app; later edits don't go live until Publish again; accepting a draft does not publish. https://docs.lovable.dev/features/deploy
- Drafts (Sep 9 2026): separate copy of project with own chat/preview, but "Every draft uses the same database as your project" (Cloud docs) - drafts do NOT isolate data/backend. https://docs.lovable.dev/features/database , changelog https://docs.lovable.dev/changelog
- Cloud Test/Live: changelog says unavailable for new Cloud projects since Mar 24 2026 (existing keep it). A third-party GitHub issue claims retirement 2026-10-05 (unverified). Irrelevant to a Supabase-integration project; no built-in dev/prod DB split. Third-party incident report shows Publish promoting a stale Test schema over Live on Cloud: https://github.com/stanleymay20/scroll-wisdom-weave-d69aa349/issues/144
- MCP tools: send_message/Lovable agent edits can trigger the above; deploy_project = publish frontend. Treat every send_message to the live project as a prod write. (get_project/deploy_project exact internals not in public docs - unknown.)
- Cloud-only guard: "Execute backward incompatible database migrations" permission (default Never) makes Lovable use additive changes; Cloud docs https://docs.lovable.dev/integrations/cloud . Unverified whether it applies to external Supabase - assume not; set Agent permissions to "Ask each time" (Account settings -> Preferences -> Agent permissions) and always review SQL.

## 2. Remix
- Copies: code, DB structure (Cloud), optionally chat/files/knowledge/history. Not copied: data, secrets (new auto keys on Cloud), GitHub sync, connectors, custom domains, publish state, collaborators; copy starts unpublished. https://docs.lovable.dev/features/projects/remix.md , changelog Sep 8 2026 (Files tab no longer auto-copied).
- Cloud projects remix to Cloud only and get a NEW backend (schema/edge fns, no data). For Supabase-connected projects docs do not say what happens to the connection - UNKNOWN/risk: a remix may still point at (or share) the prod Supabase project. Lovable warns when two projects share one Supabase project, and shared projects overwrite each other's secrets (https://docs.lovable.dev/integrations/supabase). Safest: do not remix; instead create new Supabase project + GitHub-repo-based copy (below), or remix then IMMEDIATELY disconnect/reconnect to a new Supabase project before any chat edit, verifying client.ts/config.toml project id differ.
- Git sync is export only (cannot import an existing repo), so a staging Lovable project must come from remix/new project, not from importing the repo. https://docs.lovable.dev/integrations/git-sync-overview
- Hardcoded Supabase project IDs/URLs in client.ts, edge functions, config.toml commonly stay pointing at old project (https://www.productcompass.pm/p/lovable-branching) - grep and centralize.

## 3. GitHub, branches, history, backups
- Git sync: two-way, ONE branch at a time; branch picker in Project settings -> Git (switch/create branches, GitHub/GitLab/Bitbucket). Commits on other branches reach Lovable only after merge or switching synced branch. No force-push/rebase/squash on synced branch (Lovable backs up and owner can restore). Protected branch => pushes go to `lovable-sync`. Drafts are not branches. https://docs.lovable.dev/integrations/git-sync-overview
- Git sync does NOT deploy edge functions or run migrations when commits sync (Cloud text; for Supabase integration, deploy still happens via Lovable chat). So a branch is code-only safety; DB/functions need a separate Supabase project.
- Lovable can't "build from a branch" independently: it edits whichever branch is synced. Pattern: staging Lovable project synced to its own repo/branch; prod project stays on main.
- Version history/revert: restores code; does not roll back Supabase DB or already-deployed functions (inference; docs page 404). Cloud-only: daily backups ~14 days, DB only (not storage), restore permanent.
- Supabase backups (applies to your project): daily backups Pro 7d/Team 14d/Enterprise 30d; PITR add-on ~$100/mo (7d); backups exclude storage object files (metadata only); restore causes downtime. Manual: `supabase db dump` / `pg_dump` (schema, data, roles) plus copy storage buckets (~19k objects) via Storage API/S3-compatible endpoint or `supabase storage cp -r`. https://supabase.com/docs/guides/platform/backups . Dumps don't include secrets, cron job definitions are in cron schema (include), auth.users included only if dumping auth schema.

## 4. Integrations / webhooks and double-sending
- Prod URL-bound items: GHL webhooks -> ghl-webhook/recruiting-inbound; Vapi webhooks/assistant serverUrl -> vapi-webhook/vapi-maintenance-webhook; Telegram setWebhook -> telegram-webhook (only ONE webhook URL per bot: setting it on staging steals prod); QuickBooks and Gmail/Google OAuth redirect URIs registered to prod function URLs (staging needs separate OAuth apps/redirects; QBO sandbox company); Twilio/GHL numbers; Meta CAPI; Alvys, Optima syncs; Resend/email.
- A staging DB cloned from prod contains live tokens (QB/Gmail refresh tokens, GHL/Vapi keys in tables) and 5-min pg_cron jobs: restoring a dump WITH cron jobs/secrets will start texting/calling real people and refresh tokens (rotating refresh tokens can invalidate prod's!).
- Pattern: (a) never copy cron.job rows / disable pg_cron in staging until set; (b) global `system_settings.outbound_mode` = off | sandbox | live, default `off` in staging, enforced in ONE shared send helper used by ghl-send-sms, vapi-initiate-call, send-*-email, investor-send-*, telegram; sandbox mode rewrites recipients to allowlisted test numbers/emails and logs to an outbox table instead; (c) staging uses separate GHL sub-account/location, Vapi test assistant/number, Telegram test bot, Twilio test creds, QBO sandbox, test Google OAuth client; (d) assert in each function `if (SUPABASE_URL !== EXPECTED_PROD_URL && mode==='live') throw`; (e) env var ENVIRONMENT=staging secret; (f) scrub all token/secret/credential columns and API-key tables in the copy.

## 5. Recommended workflow
1. Freeze & baseline: take `pg_dump` (schema+data), schema-only dump, cron.job export, storage bucket copy, list of edge function secret NAMES, git tag the current GitHub main (connect GitHub sync if not yet). Confirm Supabase plan/backups (consider PITR during project). Set Lovable agent permissions to Ask each time on the PROD project; stop sending chat messages to prod project (use read-only tools only).
2. Create new Supabase project (staging) and a new Lovable project/branch for it (remix with new backend or new project fed from repo copy via GitHub: clone prod repo to new repo, create new Lovable project, ask it to build from that - UNVERIFIED that Lovable can import; git sync is export only, so likely remix is the only route; verify project id in client.ts/config.toml immediately).
3. Apply schema via supabase/migrations (or restore schema-only dump), redeploy 125 functions with `supabase functions deploy --project-ref <staging>`, set secrets to TEST values only.
4. Data: restore dump to staging, then run anonymisation SQL (names, phones -> 555 test numbers, emails -> @example.test, SSN/DOB, driver licence, GHL/QB/Gmail tokens nulled, storage files replaced with samples or subset), truncate message/outbox queues, `cron.unschedule` all jobs, set outbound_mode='off'.
5. Fix bugs on staging first; reproduce, fix, test with sandbox mode, review generated SQL as additive-only (add column/table/index, nullable or defaulted, no drop/rename/type change; expand -> migrate -> contract over later releases). Use flags in DB (feature_flags table) for dark launch.
6. Multi-tenant SaaS: build as separate third project/Supabase (tenant_id + RLS + per-tenant secrets/integrations) from staging lineage; don't retrofit prod. Migrate a tenant from prod only by export/import when ready.
7. Promotion: git branch dev -> PR -> main on repo; apply same migration files to prod Supabase in a maintenance window via Supabase CLI (`supabase db push` after `--dry-run`) or Lovable chat with SQL review; deploy changed functions individually; THEN Publish frontend last (frontend depends on additive schema already present). Never Publish before backend verified.
8. Rollback: frontend - republish previous version/revert commit; functions - redeploy previous git tag; DB - forward-fix migration (additive design means old frontend still works); last resort PITR/dump restore (downtime, data loss since backup).
9. Release checklist: backup taken & restorable (test restore once); diff of migrations reviewed; no DROP/RENAME; verify_jwt unchanged; webhooks/cron untouched; crons paused only if needed; smoke test after deploy (login, recruiting inbound, worker run, QB status); watch edge function logs 30 min; kill switch ready (outbound_mode='off').

## Unknowns / risks
- Behavior of remix with Supabase-connected project (shared backend risk) is undocumented.
- Whether "backward incompatible migration" guard and Drizzle migrations apply to external Supabase: undocumented.
- Version revert effects on DB/functions undocumented (docs page 404).
- Lovable agent can overwrite edge functions/migrations in prod on any chat message; stale preview/branch publishes can regress things.
- Two Lovable projects sharing one Supabase overwrite each other's secrets.
- Test/Live retirement date conflict (Mar 24 vs Oct 5 2026) - irrelevant unless Cloud.

## Sources
- https://docs.lovable.dev/integrations/supabase
- https://docs.lovable.dev/integrations/cloud
- https://docs.lovable.dev/features/database
- https://docs.lovable.dev/features/deploy
- https://docs.lovable.dev/features/projects/remix.md
- https://docs.lovable.dev/integrations/git-sync-overview
- https://docs.lovable.dev/changelog
- https://supabase.com/docs/guides/platform/backups
- https://www.productcompass.pm/p/lovable-branching
- https://github.com/stanleymay20/scroll-wisdom-weave-d69aa349/issues/144
