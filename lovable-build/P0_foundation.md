PHASE 0: FOUNDATION. Build only this phase. Read the project knowledge first; its "definition of done" applies to everything below.

GOAL: a signed-in, multi-tenant shell with real auth, real company/user/role management and the shared components every later phase reuses. No trucking screens yet.

1. THEME + SHELL
- Tailwind tokens for Night Shift (dark default, light, auto). Fonts: Space Grotesk, IBM Plex Mono. Accent lime #C8F25C (dark) with a darker accessible lime for light mode. Theme switch (Light / Dark / Auto) in the top bar and in the profile menu, saved to profiles.theme.
- src/config/brand.ts, src/config/plans.ts (plan limits, prices, credits, feature flags: voice, departments, teams, builder, inbox, recruiting, multiCarrier, sso, api).
- Office layout at routes under /app: left sidebar with sections Home, Dispatch, Load hub, Chat, Customers, Accounting, Fleet, Maintenance, Safety, Recruiting, Inbox, Reports, Assistants, Settings. Each section has a tab bar of its pages. Sections/pages not built yet render a real "Not built in this phase" empty page ONLY for admins in development; hide them from normal users. Sidebar collapses to icons under 1100px and becomes a bottom sheet under 768px.
- Top bar: "Ask my company" input (opens a right drawer; wiring comes in phase 8, for now the drawer shows an explanation and is disabled with the reason), credit meter (reads companies.credits_balance), approvals bell (count from approvals table, empty for now), theme switch.
- Bottom-left user card (name, role, company) opens a menu: Profile, Switch carrier (Enterprise only, hidden otherwise), Preview as plan (admin/dev only), Roles, Notifications, Plan and billing, Help, Sign out. Every item navigates or acts.
- Route guard: unauthenticated -> /sign-in. Authenticated without a company -> /onboarding. Plan gating component <PlanGate feature="voice"> that blurs the page and shows an upgrade card with a working "See plans" button.

2. AUTH (Supabase Auth)
- Routes /sign-in, /sign-up, /forgot-password, /reset-password, /verify (code), /invite/:token.
- Sign in: email + password, magic-link not needed. Small buttons for Google, Apple and Phone (SMS code) on ONE row above the email form with an "or" divider. Wire Google and Apple with Supabase OAuth providers; if a provider is not configured yet, the button is disabled with the tooltip "Enable in Supabase Auth settings" and I will configure it. Phone login uses Supabase phone OTP; same rule.
- Sign up creates auth user + profile. Forgot password sends the real reset email. Email verification on.
- Invite flow: an admin invites by email with a role; the invitee opens /invite/:token, sets a password or uses Google/Apple, and is added to memberships with that role. Tokens expire in 7 days and are single use.
- Password rules (min 10), rate limit messages, "Show password" toggle, errors inline.

3. DATABASE (write migrations; enable RLS on every table)
- companies(id, name, legal_name, mc, dot, phone, email, address jsonb, yard_address, remit_to, timezone, units, fiscal_year_start, plan text default 'core', plan_status, trial_ends_at, credits_balance int, credits_period_end, settings jsonb default {cost_per_mile:2.31, fuel_price:4.85, mpg:6.9, detention_free_hours:2, detention_rate:75, net_days:30, late_fee_pct:1.5}, logo_url, created_by, created_at)
- profiles(id = auth.uid, full_name, phone, avatar_url, language default 'en', theme default 'auto')
- memberships(id, user_id, company_id, role, team_id null, is_leader bool, status active|invited|disabled, created_at) unique(user_id, company_id)
- invites(id, company_id, email, role, is_leader, token unique, expires_at, accepted_at, invited_by)
- role_permissions(company_id, role, department, can_view, can_edit, can_approve) primary key(company_id, role, department). Seed per company on creation with the defaults from the spec (Owner everything; Dispatch manager = operations manager; Dispatcher; Accountant; Shop manager; Safety manager; Recruiter).
- audit_log(id, company_id, user_id, action, entity, entity_id, before jsonb, after jsonb, created_at). Append only (no update/delete policy).
- Helper SQL functions: is_member(company uuid), member_role(company uuid), has_perm(company uuid, dept text, level text). All RLS policies use them. Write an automated SQL test that creates two companies and proves user A cannot read or write company B rows in every table.
- Edge function create_company(name, mc, dot...) that creates the company, owner membership, seeds role_permissions, and sets plan by chosen tier. Active company is stored in profiles.active_company_id (add column) and exposed via a CompanyContext.

4. SHARED COMPONENTS (build once, used everywhere; show them working on the Users and Audit pages)
- DataTable: status tabs with live counts, search box, filter row, column chooser, sortable headers, row selection with select-all, bulk action bar (message + action buttons), side drawer (details key-value list + timeline + "Open full record" link), pagination, CSV export (client side, current filter), empty/loading/error states, keyboard accessible. Generic over a column config.
- FormDrawer, ConfirmDialog, KPI strip, StatusChip, Stepper, Toggle row, Stat card, EmptyState, PageHeader (title, subtitle, actions), Breadcrumbs, Toast.
- useAudit() hook: every mutation calls it.

5. SETTINGS PAGES (full spec attached: SPEC_P0_settings.md). Build these now, fully functional:
- Company (profile, addresses, region, cost settings with live example, detention defaults, invoice defaults, unsaved-changes bar, Save writes audit_log).
- Users (table + invite drawer + role change + deactivate + resend/cancel invite; two-step reminder column can show "Not set up" for now), Roles (permission matrix with V/E/A toggles saved to role_permissions, Owner locked, leader flag, "view the app as a role" banner that really limits the UI), Profile (name, phone, language, theme, change password, sign out all devices), Audit log (table with filters by user/entity/date, export), Plan and billing (shows current plan from plans.ts, usage, truck count vs limit; Stripe checkout buttons come in phase 8, so show them disabled with reason "Billing opens in phase 8"), Security (sign-in rules display, session list, "Require two-step" toggle stored but enforced later: label it), Notifications (per-user channel preferences saved to a notification_prefs table).
- Integrations, Chat rules, Carriers, Import and export: render the page list per spec but each connector row is disabled with "Coming in phase N". Do not fake connections.

6. SEED + DEMO
- A "Load sample company" button in Company settings (admin only) that inserts a demo dataset marked is_demo=true; and a "Remove sample data" button. For now seed only users/roles; later phases extend it.

ACCEPTANCE CHECKLIST (verify each, list results in your reply):
[ ] Sign up with email, verify, create company, land in /app.
[ ] Sign out and sign in again; session persists on reload.
[ ] Invite a second user as Dispatcher; accept in a private window; they see only what the Dispatcher role allows.
[ ] Change a permission in the matrix; the second user's sidebar changes after refresh; direct URL access to a forbidden page shows a "No access" page, and the API also refuses (RLS).
[ ] Two companies created; neither sees the other's users, audit log or settings.
[ ] Theme switch works in all three modes and persists.
[ ] Every button on Company, Users, Roles, Profile, Audit log, Notifications does something real; every form saves and survives reload; every save writes an audit_log row.
[ ] 390px width: shell and all pages usable.
[ ] No console errors on any route.
At the end reply with: routes list, tables list, checklist results, and anything not done.
