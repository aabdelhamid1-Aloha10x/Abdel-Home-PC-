# Masar OS: full project handoff for Codex
Prepared by Claude (acting as product manager / go-to-market / build coordinator) for Abdel (product owner). Date of this handoff: 2026-10-12.
Read this file first, then the files it points to. Nothing in this package contains secrets. Never write a secret value into any file, chat, commit, screenshot or report.

## 1. What we are building
**Masar OS** ("Your back office on autopilot"): a multi-tenant SaaS TMS for trucking companies, owner-operators to 25+ trucks, operated by **Masar AI Inc.** (Delaware C corp, 403 Old Town Circle E, Cherry Hill, NJ 08034; registered agent 131 Continental Dr Suite 305, Newark, DE 19713). Product idea (owner decision, Oct 12): "ChatGPT for your company". Anything can be done by a text or a voice note. Each department is a staffer (dispatch, accounting, maintenance, safety, recruiting, driver comms) that does the work; the user watches, steers, approves, or stops it. Autopilot is the default for harmless jobs; Ask-first is the fallback. If the AI is switched off the product is just paperwork software, so the AI IS the product and credits are the revenue engine.
Segments: Solo (1 truck, mobile only), Core (up to 3 trucks), Growth (up to 25), Enterprise (26+, contact sales).

## 2. Hard rules (do not break)
1. **ANH / A&H (the owner's live company) is read-only. Never touch it.** Never use Supabase project `kldiqwkjrhpkcfjlbolw`. Masar OS lives in its own Lovable project and its own Lovable Cloud backend.
2. **Money is record-only.** The app never moves money. The owner pays outside the app and clicks Mark paid. Do not change this rule; a payment-guarantee/escrow idea for shops is only being STUDIED (see section 9).
3. Never ask for or store load-board usernames/passwords. Official APIs, OAuth, email forwarding, share-to-app, manual entry only.
4. **Credits never appear on the marketing website**, only inside the app, and never as per-action prices in the customer UI. Included credits expire monthly; packs never expire.
5. Trial: 14 days, **card required at sign-up**, charged on day 15, auto-renews. **No refunds**; cancel anytime; account stays open until the end of the billing period; no further charges (exceptions: our billing mistakes, where law requires).
6. Secrets only in Lovable's secure Secrets form. Never in chat, files, logs, commits.
7. Do not create pull requests unless asked. Commit footer when committing here: `Co-Authored-By` line plus the session link the owner provides.
8. Keep replies short; save Lovable credits (ask Lovable for real browser verification, never trust "should work").
9. The AI does not volunteer "I'm an AI" on calls, but never denies it when sincerely asked.
10. Verify before reporting. Say plainly what was NOT tested.

## 3. Locked packaging (website + app must match)
| Plan | Monthly | Annual (2 months free) | Notes |
|---|---|---|---|
| Solo | $39 | $390 | 1 truck, mobile app only, 300 credits/mo |
| Core | $97 | $970 | up to 3 trucks, 1,000 credits/mo, Recruiting add-on ($49/mo placeholder) |
| Growth | $249 | $2,490 | up to 25 trucks, 4,000 credits/mo, voice/phone assistant, breakdown case owner, teams and department roles, department chat rooms, report builder, shared inbox, unlimited incentive programs, Recruiting included |
| Enterprise | 26+ trucks | | contact sales |
Credit packs (app only): $25/1,000, $110/5,000, $400/20,000. Dept chat rooms/teams/topic routing are Growth+; driver rooms and one Dispatch room on all plans. No Telegram bridge (optional one-time import wizard later).
Emails: info@masar10x.io (general/system), sales@masar10x.io (demo/booking), billing@masar10x.io (Stripe/billing). Calendly: https://calendly.com/masarai2025/demo-meeting-masar-os (account masarAI2025@gmail.com).

## 4. Systems and accounts (names only, no secrets)
| Thing | Where |
|---|---|
| App (Lovable, TanStack Start + React + Tailwind + shadcn + Lovable Cloud/Supabase) | project "Masar OS" id `91b7f59c-fc37-4c05-932d-7d99f2c8167b`, https://lovable.dev/projects/91b7f59c-fc37-4c05-932d-7d99f2c8167b, live https://app.masar10x.io |
| Marketing website (Lovable) | project "Masar Ride Guide" id `299bd402-de90-47e3-ae2e-2c376ccd98d9`, live https://masar10x.io (canonical, no www; www redirects) |
| Workspace | Lovable workspace "abdel's Lovable" id `f77KvdH419ku7Ef0lwm6` |
| Design (Claude Design artifact, v40) | https://claude.ai/artifact/635DAuPCpRwGFseWwFobo4 |
| Repo | GitHub `aabdelhamid1-aloha10x/abdel-home-pc-`, branch `claude/options-trading-alerts-scanner-5lgr30` (docs, specs, brand, screenshots) |
| DNS | Hostinger (masar10x.io): root + app subdomain live; Resend records present and verified |
| Email sending | Resend (domain masar10x.io verified); sender "Masar OS <info@masar10x.io>" |
| Billing | Stripe via Lovable Payments, TEST mode; account verification form pending; open decision on Link/3.5% fee |
| Google sign-in | Own Google OAuth client in Google Cloud project "Masar OS" (account masarai2025@gmail.com); Search Console Domain property masar10x.io verified; branding verification submitted/synced |
| Apple sign-in | NOT set up (needs Apple Developer Services ID, Team ID, Key ID, .p8) |
| FMCSA | QCMobile webKey added as secret; Company Census open data (data.transportation.gov, dataset az4n-8mr2) used for phone/email |
| Voice / SMS | Vapi (voices via ElevenLabs: Garret `dTqqnmNMKYl0Y5SqbNOz` for shops, Eryn `dMyQqiVXTU80dDl2eNK8` for drivers), Twilio. Keys being added by Codex now (VAPI_API_KEY, VAPI_WEBHOOK_SECRET, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER). Use a NEW Vapi key for Masar |
| LLM | Direct Anthropic API (key ANTHROPIC_API_KEY pending) via a provider-agnostic router; built-in Lovable AI gateway (Gemini) as fallback; OpenAI allowed as optional provider (OPENAI_API_KEY slot); DeepSeek excluded (data goes to China) |
| Fuel prices | EIA open data (EIA_API_KEY pending, free) |
| Stack notes | Lovable previews are private (401), published sites public. Lovable has a stack default; no direct deploy from here; owner must click Publish/Update. |

## 5. Product principles for every screen
- Outcome-first: "Done for you / Needs you / Coming up", not data tables first.
- Autonomy classes (server-enforced): A harmless = Autopilot default; B outward-facing reversible (send invoice/email broker/text shop) = Ask first, can earn Autopilot per job; C commitments and money = Ask first unless within user limits; D safety/legal/large spend = human decides. Global dial (Suggest / Ask first / Autopilot), per-job dials, spend limits, quiet hours, **Pause everything** always visible, undo where possible, audit log for every action.
- Out of credits means fall back to Ask-first with a one-tap top-up, never a dead stop.
- A plan only shows what it includes (no "unavailable on Solo" rows). Plans are mentioned only on Upgrade.
- Design tokens (exact, see `build_prompts/DESIGN_SPEC.md`): dark bg #0A0E13, nav #0D1218, s1 #121821, s2 #18202B, border #1E2733, text #E8EDF2, muted #8A97A5, accent lime #C8F25C; light bg #F3F5EE, s1 #FFFFFF, s2 #ECEFE4, border #DEE3D3, text #10151B, muted #56616D, accent text #3A7300; radii card 18px, button/input 11px; semantic palette: coral #FF6B6B, amber #F5B84B, blue #5AA9FF, violet #A78BFA, teal #2DD4BF. Brand mark: route-line "M" (origin ring + destination dot); startup splash draws it. Default theme Auto.
- Mobile first (390px), light/dark both tested.

## 6. Architecture quick map (app project)
Routes: `/app/*` office app; `/s/*` Solo; `/d/*` driver app; `/sign-in /sign-up /verify /start/* /invite/$token /apply/:companySlug/:jobId` (Recruiting, Phase 7 pending); public machine routes `/api/public/vapi`, `/api/public/twilio/sms`, daily-check job, MCP server (built, NOT published).
Core tables (RLS per company_id): companies, memberships/roles (owner, dispatch_manager, operations_manager [added], shop_manager, safety_manager, accountant, dispatcher, driver), loads/stops/customers/drivers/trucks, invoices/settlements/expenses, incentive programs engine (SQL), chat rooms/messages/topics, work_orders/pm_schedules/dvirs/shops/documents/driver files/drug tests/incidents/hos logs (Phase 4), driver_action_log (offline queue), breakdown_cases/case_events/case_providers/case_timers/case_approvals/call_log/sms_messages/sms_consents/llm_usage/voice_eval_* (Phase 5V), masar_messages/masar_actions/masar_goals/masar_settings/cost_profile/fuel_price_cache (S1), email_log, fmcsa_cache. Migrations 0000 to 0032+ in `drizzle/migrations`.
Server pieces: model router `src/lib/ai/router.server.ts` (tasks to provider/model/effort config), Masar tool layer `src/lib/masar/tools.server.ts`, billing/credits (`consume_credits`), email via Resend, FMCSA server functions.
Plan gating: `src/config/plans.ts`; Solo redirects to `/s`; other plans `/app`.

## 7. Where things stand (Oct 12)
| Area | Status |
|---|---|
| Phase 0 foundation (auth, tenancy, roles, plan gating, brand) | Built, tested |
| Sign-up, onboarding, FMCSA (+Census phone/email), email codes via Resend, required-field glow | Built, tested. Codes were failing (default sender + 8-digit vs 6-digit box); fixed |
| Google sign-in | Reaches Google with own branding; full round trip needs a human test |
| Apple, Phone sign-in | Apple not set up; Phone shows "Coming soon" |
| Phase 1 core TMS, Phase 2 money, 2b incentives, Phase 3 chat | Built; Phase 1/2 broad browser verification done once in a later verification round (all flows passed after 3 fixes) |
| Phase 4 maintenance + safety | Built, tested (DB rules + browser) |
| Phase 5 driver app (PWA, offline queue) | Built, tested at 390px; not tested: Late/Off roll call, real-phone camera, Spanish wording, push to phones, successful approve flow |
| Voice + SMS + breakdown case owner (Phase 5V) | Built; DB rules tested; runs in DRY-RUN until Vapi/Twilio secrets exist; 20 test scenarios "Not run" |
| Phase 6 Solo + load hub | Built; Solo audit fixes done (grouped More, ELD in one place, pre-trip with photos/defects/OOS, logo + splash, palette) |
| Phase S1 Solo front door (Masar thread, tools+undo, goals, Hire Masar, cost model) | Built, tested; gaps below |
| MCP agent integration (Claude/ChatGPT/Cursor connect to a tenant) | Built, NOT to be published until revoke + audit + rate limit + owner-only enablement + form regression |
| Phase S2 fleets (company-wide Ask Masar, department staff pages) | NEXT (sent to Lovable) |
| Phase 7 recruiting | After S2 |
| Reports/assistants/credits admin (P8), integrations (P9: ELD, QuickBooks, SMS numbers, SSO/API), Capacitor apps (P10) | Not started (P8 partly present: credits engine, bots) |
| Marketing website | Live; needs QA round 2 (dedupe mobile pricing cards, shorter trial copy, hero "Ask Masar" demo, plan feature lists, Calendly demo booking with questionnaire + confirmations/reminders 24h/1h/15m + /demo/welcome + /admin/demos), Calendly connector link, publish, hide Lovable badge |
| Legal pages (terms, privacy, cancellation/refund) | Draft live with company details; need attorney review; confirm governing state (Delaware vs New Jersey) |

### Known gaps and bugs (from Lovable's own reports)
- Goals count booked loads as revenue; need booked vs collected, and net-profit on delivered+paid.
- Undo shown on an invoice after it was emailed (refused); should show Void.
- Daily email only to the owner.
- Not tested: real voice notes/hands-free, insurance declarations reader, EIA lookup, Anthropic path, marked-delivered invoice trigger, receipt-photo amount reading (not built), MPG learning from fill-ups (in progress).
- LLM router bugs (sent to Lovable): wrong price table (Haiku 5.5 $0.10/$0.50, Sonnet 5.5 $2/$10, Opus 5.5 $4/$20 per million; cached read 0.01/0.20/0.20), thinking tokens count against tiny max_tokens, no handling for max_tokens/refusal, regex JSON parsing, preview Gemini model id risk.
- MCP server: no revoke, no rate limit; library upgrade changed form validation (number fields, Terms checkbox, chat settings) untested.
- Voice credit rate (10 credits/min = about $0.25) may leave thin margin vs Vapi + speech + telephony; needs real cost report.
- Hiding shop payment details (done in DB) and call-back verification (done) need browser test.
- Pre-trip item count 12 vs 10 (owner decision pending; recommend keep 12).

## 8. Remaining roadmap (recommended order) with dependencies
1. **Close S1 + LLM hardening** (Lovable message sent): price table fix, provider-agnostic router (Anthropic default, OpenAI optional), thinking/max_tokens/refusal handling, structured outputs, 30-case eval, goals booked vs collected, Undo/Void, extra email recipients, finish untested items, trust nudge, credits-vs-cost report and voice rate proposal.
2. **Secrets and go-live of voice/SMS** (Codex task in progress): add Vapi, Twilio, Anthropic, EIA secrets; Twilio inbound webhook to /api/public/twilio/sms; Sync assistants; first real shop-call pilot with the owner's own shop and A&H trucks as design partner (A&H data stays read-only: use only as a customer with its own Masar account, never touch its Supabase).
3. **Phase S2 fleets**: company-wide Ask Masar (role-aware), department staff pages (live activity, queue, KPIs, dial, guardrails, Needs you), manager home, company goals, per-truck profitability.
4. **Publish + regression**: form regression across the app, publish app, owner tests on real phones (voice notes, camera, splash, push).
5. **Phase 7 recruiting** (SPEC_P7), **P8** reports/assistants/credits admin, **P9** integrations: ELD (Optima direct and/or Terminal aggregator; need Optima API answer and Terminal pricing), QuickBooks, SMS/number management per tenant, SSO/API for Enterprise.
6. **Money/ELD-driven accuracy**: MPG from ELD, fuel card feed, fault codes to work orders.
7. **Billing go-live**: Stripe verification, decide Link/3.5% fee, live keys, full test-card journey (trial with card, day-15 charge, cancel, annual), webhooks, tax.
8. **Website QA round 2 + Calendly booking flow**, publish, hide badge, SEO, analytics; then go-to-market (see section 10).
9. **Mobile apps (Phase 10)**: Capacitor wrapper for iOS/Android (driver + Solo), push, camera, biometrics; Apple Developer ($99/yr) and Google Play accounts, D-U-N-S for the company, store listing assets; Apple IAP caution: sell on the web, app is login-only; expect weeks for store review.
10. **Security and ops**: security review (RLS audit, MCP/API tokens, rate limits), secrets rotation, backups, error monitoring, cost dashboards, SOC2-lite policies later; legal review; privacy policy sub-processor list (Anthropic, Google gateway, Resend, Stripe, Vapi, ElevenLabs, Twilio, EIA).

## 9. Research conclusions and open product decisions
- **Maintenance competitors** (see `research/MAINTENANCE_COMPETITOR_STUDY.md`): FleetNet (Cox Fleet) is a vendor-management broker, 65k vendors, 800k events/yr; bills customer gross vendor invoice + fees from a private Service Document + a 2.5% terms fee unless paid by check/wire within 15 days; pays vendors after completion (vendors report 1 to 2 weeks), keeps vendor early-pay discounts/rebates; 2022 revenue $343M, ~1.7% operating margin; sold for $100M in 2023. Masar's edge: AI coordination cost, TMS integration, customer's own shops. Weakness: no payment guarantee for shops and no vendor network at start.
- **Public complaints about FleetNet** (documented, limited): multi-hour waits, repeated "mechanic 2 hours away" with no show, tow denied over a $500 limit, no supervisor escalation, BBB B-, Glassdoor 2.6/5; no public vendor complaints found. The owner's shop is a FleetNet vendor and reports 1 to 2 week payment. Owner decision: **do not change any money rule now; still studying**. Possible later: carrier-funded wallet/virtual card/ACH payout via a licensed partner with a 1 to 2% fast-pay discount; legal review needed (money transmission).
- **Marketplace sequencing**: carriers first (product works alone: AI calls the carrier's own shops), vendors via carriers, guarantee later, single region density.
- **LLM plan**: tasks mapped to Haiku 5.5 (voice turns, SMS, classify, summary), Sonnet 5.5 (case decisions), Opus 5.5 (escalations); OpenAI optional; judge by the 30-case eval, not price alone.
- **Open owner decisions**: Stripe Link/3.5% fee; governing law; Recruiting add-on price; pre-trip 12 vs 10 items; Apple sign-in timing; Optima vs Terminal for ELD.

## 10. Go-to-market summary (details in the Google Doc "Masar OS Go-to-Market Plan")
Funnel assumes card-required trial: roughly 8,500 visitors to 170 trials to 100 paid. Channels: Meta + Google ads (small test), cold email/LinkedIn to owner-operators and small fleets (prospect lists from FMCSA Company Census: filter active, for-hire, 1 to 25 power units, with phone/email; email is legal with unsubscribe and address, no auto-texting without consent), content/SEO, partnerships (factoring, insurance, ELD resellers), FreightWaves/press, conferences. Budget assumption $6,000/month awaiting owner confirmation. Pitch: "One person. 100 trucks." with measured results ("Masar handled N events, saved X hours").

## 11. How to work with Lovable (important)
- Lovable MCP tools (if available to you): list/get/send_message (use `wait=false`, then poll get_message), file attachments via get_file_upload_url + PUT, respond_to_approval ONLY after the owner decides (plans in `.lovable/plan.md` pause for approval; sending a message instead of approving rejects the pending tool), read_file/list_files/get_diff to audit code, set_project_knowledge (10k char max), query_database, deploy_project/publish (owner must click Publish).
- Lovable often skips real browser verification: always demand throwaway-account browser tests at 390px light+dark, deletion of test data afterward, and a plain "not tested" list.
- Previews are private (401); use published URLs or Lovable's own browser tests.
- Verify claims by reading the code (read_file) before trusting reports; e.g. the AI price table was wrong in code.
- Never put secrets in a message; use the secure form (secrets can only be approved in the Lovable editor).
- Specs are copied into the app repo under `docs/specs/`.

## 12. File index of this package
- `product/` blueprint (v1 product spec, framework, packaging locked), master plan, product+pricing v2, feasibility study, department feature spec, pricing options, incentives and chat/pay designs.
- `build_prompts/` Lovable phase prompts P0 to P10, SPEC_P* screen specs, 00_PROJECT_KNOWLEDGE, DESIGN_SPEC, AUTOPILOT_PRODUCT_SPEC, VOICE_AGENT_SPEC (+ ElevenLabs samples), legal drafts, website spec and prompt.
- `research/` competitor and market research, FleetNet/maintenance study, AI model comparison, integrations, onboarding economics, safe staging, EDI/tracking, AI dispatcher.
- `design/` UI web spec, webkit README, reference screenshots of the app and website, brand assets (logo mark, favicon, icons, og image).
- `models/` pricing and unit-economics spreadsheets.
Not included on purpose: A&H Fleet OS internal audits and operational data (ANH is private). Ask the owner if needed.
