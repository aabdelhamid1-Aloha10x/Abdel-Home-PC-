# Project knowledge (persistent rules for every prompt)

PRODUCT: "Masar OS", multi-tenant SaaS TMS for trucking (owner-operators to 25+ truck fleets). The name lives in ONE constant: src/config/brand.ts (BRAND.name = "Masar OS", BRAND.tagline = "Your back office on autopilot"). Never hardcode the name elsewhere.

STACK: React + Vite + TypeScript + Tailwind + shadcn/ui, Supabase (Postgres, Auth, Storage, Edge Functions, RLS). React Router. TanStack Query for data. One responsive codebase: desktop office app, mobile driver app, mobile solo app, all under one login. Must later be wrapped with Capacitor (iOS/Android): so no browser-only hacks, use relative routes, put device features (camera, push, geolocation, share) behind small wrappers in src/lib/native/ that fall back to the web API.

DESIGN "Night Shift": dark cockpit, accent lime #C8F25C, fonts Space Grotesk (UI) + IBM Plex Mono (numbers, ids). Light, dark and auto theme (auto = system), stored per user. All colors are CSS variables/Tailwind tokens, never hex in components. The reference design is https://claude.ai/artifact/635DAuPCpRwGFseWwFobo4 and the attached spec files describe every screen. Match layout, labels and behavior from the spec. Do not invent a different look.

DEFINITION OF DONE FOR EVERY SCREEN (this is the most important rule):
1. EVERY button, link, tab, toggle, menu item, row click, bulk action, filter, search box, form and drawer must do something real. No dead buttons, no console.log handlers, no "coming soon" toasts, no placeholder alerts. If a feature belongs to a later phase, do not render its button at all, or render it disabled with a visible reason ("Available on Growth", "Connect QuickBooks first").
2. Data comes from the database, never from hardcoded arrays. Create, edit, delete, status changes and assignments persist and survive reload.
3. Every list is the same shared DataTable component: status tabs with counts, live search, filters, column chooser, sortable columns, bulk select + bulk actions, side drawer with details and timeline, pagination, CSV export, empty state, loading state, error state.
4. Every form validates (zod), shows inline errors, disables submit while saving, shows success/error toast, and writes an audit_log row.
5. Every page has loading, empty and error states, works at 390px width, and works in light and dark.
6. Role and plan checks happen in BOTH the UI (hide/disable with reason) and the database (RLS / edge function). Never trust the client.
7. After finishing a prompt, list in your reply: every route added, every table added, and a checklist of buttons you wired. Then run the app and verify each route renders with no console errors. If something is not wired, say so explicitly instead of faking it.

MULTI-TENANCY (non-negotiable): every business table has company_id uuid not null. RLS enabled on every table. Policy: a row is visible/writable only if company_id is in the current user's active memberships. Roles live in memberships(user_id, company_id, role, team_id, is_leader). Never use a service-role key in the browser. Never share data across companies. Test with two companies.

MONEY IS RECORD-ONLY: the app records invoices, payments, advances, settlements. It never moves money (no payouts, no ACH from drivers). Wording: "Record payment", "Mark as paid". The only money the app charges is the customer's own subscription and credit packs, through Stripe.

PLANS (enforced by a single source: src/config/plans.ts + companies.plan column):
- Solo $39: 1 truck, 300 credits, mobile only, no voice.
- Core $97: up to 3 trucks, 1,000 credits, no voice. Roles: Owner, Dispatcher, Driver. Recruiting is a paid add-on.
- Growth $249: up to 25 trucks, 4,000 credits, voice, department roles + leader flag + teams, report builder, shared inbox, recruiting included, department chat rooms.
- Enterprise 26+ trucks: contact sales. Multi-entity (several MC/DOT), approval chains, SSO, API/webhooks, audit export.
Credit packs: $25/1,000, $110/5,000, $400/20,000, never expire. Included credits expire monthly. Out of credits: workflows keep running; assistants drop to Suggest or Off. NEVER show a per-action credit price in the UI. Show only balance and pack prices. Rates are in the Terms.

HOURS-OF-SERVICE AND PLANNING RULES (planner): planning speed 55 mph; 11 h driving, 14 h window, 70 h cycle, 30-minute break after 8 h, 10 h rest; home-time blocks; equipment match; inspection expiry; profit = rate - miles x operating cost per mile (default $2.31, excludes fuel) - fuel (miles / mpg 6.9 x fuel price $4.85). All defaults are company settings.

NEVER touch or reference any other Supabase project. Never store credentials of third-party load boards. Use OAuth or API keys entered by the customer, stored encrypted server-side (Supabase Vault or encrypted column via edge function), never returned to the browser.

LANGUAGE: plain, short English. Spanish translation exists for driver-facing screens (i18n files en/es from day one, all strings through t()).

DRIVER INCENTIVES: management designs bonus programs from building blocks (who, metric, rules, reward, period, approval). Calculation is server-side SQL/edge function, idempotent, unit-tested, explainable. Drivers see only ACTIVE programs they are eligible for. Cash awards become a Bonus line on the settlement (record only). Not the same as "Employment programs" (company/lease/owner-operator). Core: 1 simple program; Growth: unlimited with tiers, ranking, custom metrics.
