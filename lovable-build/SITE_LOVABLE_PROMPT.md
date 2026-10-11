PHASE SITE: PUBLIC WEBSITE, SIGN-UP, TRIAL CHECKOUT AND ONBOARDING. Build only this phase. Read the project knowledge first; its "definition of done" applies to everything below. Attached mockups (match layout, copy and behavior): SiteHome, SiteHomeMobile, SitePricing, SiteSolo, SiteFleets, SiteDemo, SiteSignUp, SiteVerify, SiteWelcome, SiteCheckout, SiteOnboard, SiteGetApp, SiteSignIn, SiteLegal, SiteClickMap. Also attached: SITE_SPEC.md (copy, emails, events, SEO, claims we may not make). Phase 0 (shell, auth, companies, roles) must already exist; this phase extends its sign-up and onboarding routes.

GOAL: a public marketing site that explains the product and gets a visitor to a 14-day trial (no card), a verified account, a company created from an MC or DOT lookup, and a saved nine-step onboarding. Plus a demo lead form for Growth and Enterprise, and optional Stripe checkout during or after the trial.

1. ROUTES
Public (no login, server-rendered or prerendered, one H1 each): `/` (SiteHome), `/pricing`, `/owner-operators` (SiteSolo), `/fleets` (SiteFleets), `/demo`, `/get-app`, `/terms`, `/privacy`, `/security`, `/contact`, `/status` (the last five are tabs of one layout but real separate routes), `/sitemap.xml`, `/robots.txt`.
Auth and flow: `/sign-in` (extends Phase 0; includes reset password), `/sign-up` (SiteSignUp), `/verify` (SiteVerify), `/welcome` (SiteWelcome), `/billing/checkout` (SiteCheckout), `/onboarding` (SiteOnboard).
Mobile: all public pages work at 390px (stacked layout, hamburger menu as in SiteHomeMobile). Light, dark, auto theme switch in the site nav, saved to localStorage for visitors and to profiles.theme when signed in.
Guards: signed-in user with a company who visits `/sign-up` goes to `/app`. Signed-in user with no company goes to `/onboarding`. Onboarding complete goes to `/app`. `/onboarding` and `/billing/checkout` require login.
Brand: every product name comes from `src/config/brand.ts` (BRAND.name). Plans, prices, packs and limits come from `src/config/plans.ts` (single source). Prices: Solo $39, Core $97, Growth $249 a month; annual is 10 months for 12 (Solo $390, Core $970, Growth $2,490). Enterprise: contact sales. Credit packs: $25 for 1,000, $110 for 5,000, $400 for 20,000, never expire. Included credits renew monthly and expire. Do not show any per-action credit price anywhere. Money is record only: the app never moves money; say so in the footer and checkout.

2. DATABASE (migrations, RLS on every table)
- `leads` (id, created_at, source, plan_interest, name, company, mc_dot, trucks_band, email, phone, current_tools text[], preferred_time, stage text default 'new' check in (new, contacted, demo, trial, won, lost), owner uuid null, notes, utm_source, utm_medium, utm_campaign, utm_content, referrer, landing_path, consent_at, ip_hash, converted_company_id null). RLS: NO public insert or select policy. Only the edge function (service role) inserts. Platform staff (a `platform_staff` role table) can select and update. Index on email, stage.
- `lead_events` (id, lead_id, at, kind, data jsonb) for stage changes and emails sent.
- `rate_limits` (key, window_start, count) used by the edge function.
- `companies.onboarding jsonb default '{}'`: shape `{step, done:{"1":"done","2":"skip"}, answers:{...}, connections:{...}, assistants:{...}, checklist:{...}, completed_at}`. Saved on every Next, Skip, Back and change; read on load so a refresh resumes. `companies.plan`, `plan_status` (trialing, active, paused, canceled), `trial_ends_at` (14 days from verify).
- `integration_catalog` (key, name, kind, status check in (ready, needs_approval, registration_needed), blurb). Step 6 reads it; do not hardcode statuses in the UI. Seed: samsara ready, motive ready, geotab needs_approval, quickbooks needs_approval, fuel_card ready (file import), texting_number registration_needed.
- `fmcsa_cache` (number, type, payload jsonb, fetched_at) for lookups.
- `funnel_events` (id, at, anon_id, user_id null, company_id null, name, props jsonb). Insert through an edge function only.

3. EDGE FUNCTIONS
- `submit-lead`: input validated with zod (same rules as the form). Honeypot field `website` non-empty: return success, store nothing. Rate limit 5 per ip_hash per hour and 20 per day (return 429 with a plain message the form shows). Insert into `leads`, attach UTM params sent by the client, send an email to sales and an auto-reply to the visitor (Resend). Never return other leads' data.
- `fmcsa-lookup(type, number)`: calls the FMCSA QCMobile API with a server-side key, caches 24h, returns legal name, DBA, operating status/authority, USDOT, MC, address, power units, and the insurance-on-file flag exactly as FMCSA reports it. Never claim more than FMCSA says. Not found returns a clear not-found result. Rate limited per user.
- `create_company` (from Phase 0) is called at the end of onboarding step 1 when the user confirms the company; it stores mc, dot, name, address, plan, trial_ends_at and seeds roles.
- `stripe-checkout` (setup mode for the trial, subscription mode on request) and `stripe-webhook` (checkout.session.completed, customer.subscription.updated/deleted, invoice.paid/payment_failed). Stripe Tax on. Card details only on Stripe's hosted page. Webhook updates companies.plan_status, writes a `payments` record, emails receipts. Credit packs are one-time Checkout payments that add to `credits_purchased` (never expire).
- `track`: batches funnel events; drops them if Do Not Track is on.
- Email sequences via a scheduled function: welcome (on verify), day 1, day 3 nudge (only if onboarding under 50 percent), trial ending (day 12), win-back (30 days after pause). Copy is in SITE_SPEC.md. Each send writes `lead_events` or an `email_log`, never sends twice, and stops when the user pays or unsubscribes.

4. PAGE BEHAVIOR (every button does something real)
SiteHome: nav Product scrolls to the features section; Start free trial stores plan=core and opens `/sign-up`; hero planner card is an interactive illustration: Approve, Not now, Undo change its state (no server). Assistant mode tabs change the text. FAQ opens one answer at a time (aria-expanded). Footer links open the real legal routes.
SitePricing: Monthly/Annual toggle (URL param `?billing=annual`) changes every price and the billed-yearly line. Plan buttons store the plan and go to `/sign-up?plan=solo|core|growth`; Enterprise goes to `/demo?plan=enterprise`. Credit pack cards are selectable and show a message plus Start free trial. Comparison table renders from plans.ts. Add JSON-LD offers and FAQPage.
SiteSolo and SiteFleets: CTAs as above; truck-count buttons on Fleets pick the recommended plan card.
SiteDemo: fields and validation as the mockup; submit calls `submit-lead`; show errors inline; show the thank-you state after success; "Send another" resets. Capture UTM params and referrer from the landing URL (store first-touch in localStorage). Prefill plan_interest from `?plan=`.
SiteSignUp: plan cards (Enterprise shows the Talk to sales panel), Google, Apple and Phone buttons on one row (disabled with the tooltip "Enable in Supabase Auth settings" if a provider is not configured), email, name, password (min 10, Show/Hide), Terms checkbox required, inline errors. Submit creates the Supabase user, records signup_started, and goes to `/verify`. Trial needs no card: say so on the page.
SiteVerify: email code or SMS code (Supabase OTP), 6 digits, wrong-code error, resend with a 30 second cooldown, change email or number. On success set trial_ends_at, send the welcome email, go to `/welcome`.
SiteWelcome: tiles go to `/onboarding`, `/get-app`, `/billing/checkout`. Solo shows the app-first tile text.
SiteCheckout: plan summary with billing toggle; promo code field validated against Stripe promotion codes (show not found, applied with what it takes off); optional credit pack; Due today and First plan charge date computed from trial_ends_at; the Continue button opens Stripe Checkout in setup mode and returns to a saved state with the receipt line; tax note and receipts note as in the mockup; list receipts later in Plan and billing.
SiteOnboard (the wizard; the same behavior as the mockup):
 - Stepper on the left with progress percent; clicking a step jumps to it. Each step has Back, Next and Skip for now. Next validates the step with zod and shows inline errors; Skip never validates. Save after every action to `companies.onboarding`; a page refresh resumes at the same step with the same answers.
 - Plan-aware: Solo skips steps 3 and 4 and ends on SiteGetApp; Core shows roles Owner, Dispatcher, Driver and hides the Team option and teams question behind a Growth upsell; Growth shows department roles, teams, and the setup-call card. Plan limits are enforced: trucks above the plan show the notice with Compare plans; above 25 trucks points to Enterprise.
 - Step 1: MC or USDOT, Look up calls `fmcsa-lookup`; show the result card (legal name, authority, USDOT, address, power units, insurance on file note). "Yes, that is my company" calls `create_company` and prefills name, phone, address (editable). "Not you?" switches to manual entry.
 - Step 2: trucks, trailers, equipment types, haul type, up to 3 lanes; writes to companies.settings and creates nothing else.
 - Step 3: role style, teams yes/no (Growth), driver programs (company, lease, owner-operator), pay methods; seeds the Phase 3 programs and pay plan stubs.
 - Step 4: up to 5 email rows with a role each; creates invites (7 day token, single use) and sends emails; driver phone invite sends an SMS only if the company has confirmed it has consent (checkbox) and a texting number is active, otherwise it creates the invite and shows the link and QR; Copy invite link really copies.
 - Step 5: CSV import goes through the Phase 1 import tool with column matching; QuickBooks is a file export import now; Start empty does nothing; Sample company inserts `is_demo=true` rows (removable in Settings, Company).
 - Step 6: each tool shows its real status from `integration_catalog`. Connect starts the real flow where status is ready (token form or OAuth); needs_approval creates a row in `integration_requests` and emails the team; Skip records skipped. Never show a connection as made that is not.
 - Step 7: cost per mile, fuel price, mpg saved to companies.settings; live example updates as you type (Nashville to Atlanta, 248 mi, $1,090).
 - Step 8: assistants per plan, Off / Suggest / Auto, default Suggest; writes the assistant settings table. Auto is allowed but shows a one-line warning.
 - Step 9: the first-week checklist with deep links to `/app` pages, items tick automatically when the real thing exists (first truck, first driver, first load, first invoice, ELD connected) and can be ticked by hand; progress bar; Growth shows "Book a 20-minute setup call" (Cal.com or a booking link from brand config); Solo shows Get the app.
SiteGetApp: App Store and Google Play links and the QR come from brand config; Solo and Driver tabs; "use it in your browser" opens the mobile web app route.
SiteSignIn: Phase 0 sign-in plus reset password inline.
SiteLegal: five routes, content from markdown files in the repo (placeholders marked DRAFT until counsel replaces them). Contact form posts to `submit-lead` with source=contact_form. Status reads the status provider or shows "Status page not configured".
Theme: every Site page uses the Night Shift tokens in light, dark and auto; no hex colors in components.
Honest copy: use the claims rules in SITE_SPEC.md section 9. Testimonials are not shown until real ones exist (render the section only when rows exist in `testimonials`); the mockup shows Sample labels.

5. ANALYTICS AND SEO
Emit the funnel events (visit, signup_start, signup_verified, company_created, onboarding_step_completed, first_load_created, first_invoice_sent, subscription_started) and the UI events in SITE_SPEC.md through `track`. Admin page `/app/platform/funnel` (platform staff only) shows counts and step rates and the leads table with stage changes (DataTable component). Titles, descriptions, canonical, Open Graph, sitemap, robots, JSON-LD as in the spec.

6. SECURITY
Public inserts only through edge functions. Rate limits, honeypot, zod on server. No secrets in the client. RLS test: an anonymous client cannot select or insert `leads`; user A cannot read user B's onboarding or company. Passwords min 10. Do not log emails or phone numbers to the console.

ACCEPTANCE CHECKLIST (verify each, list the results in your reply):
[ ] Every button, link, tab, toggle, accordion and card on every Site screen does something real (compare with SiteClickMap row by row). No dead buttons, no console.log, no "coming soon" toasts.
[ ] Visitor goes Home, Pricing (toggle annual, prices change), Start free trial, sign-up, verify, welcome, onboarding, app, with no card entered.
[ ] Sign-up validation: bad email, short password, unticked Terms each show their inline error; Enterprise sends to /demo.
[ ] Demo form: invalid shows errors; valid inserts one `leads` row with UTM params, sales email and auto-reply sent; 6th submit in an hour shows the rate-limit message; filling the honeypot inserts nothing.
[ ] An anonymous request to read or write `leads` directly is refused (test with the anon key).
[ ] MC lookup with a real number returns the real FMCSA name and address; a wrong number shows not found; "Not you?" works.
[ ] Onboarding: refresh on step 4 resumes on step 4 with typed values; Skip works on all 8 steps; Back works; Solo skips steps 3 and 4 and ends on Get the app; Core cannot choose Team; trucks above the plan limit show the notice.
[ ] Invites created in step 4 appear in Settings, Users and the accepted invite lands in the right role.
[ ] Step 6 shows the statuses from `integration_catalog`; Needs approval creates a request row; nothing is shown as connected unless it is.
[ ] Checkout: promo code valid and invalid, credit pack adds to Due today, Stripe test card saves, webhook updates plan_status, receipt email arrives, tax line comes from Stripe Tax.
[ ] Funnel events appear for each stage in `funnel_events`; the admin funnel page shows them.
[ ] Emails: welcome sends on verify; day 3 sends only when setup is under 50 percent; nothing sends twice.
[ ] Light, dark and auto work on every page and persist; 390px width works on every public page with no horizontal scroll.
[ ] Lighthouse SEO 95 or better on /, /pricing, /owner-operators, /fleets; sitemap and robots correct.
[ ] No console errors on any route.
At the end reply with: routes list, tables list, edge functions list, checklist results, and anything not done.
