# Solo completeness audit (read-only), 2026-10-15
Project 91b7f59c, commit f9ce6f13 (Spanish removed). Method: read src/routes/s.*.tsx and key libs via Lovable MCP at that ref, compared with the local specs and QA_LOG.md. Static code read only: nothing clicked, no tests run, no live DB checked.
Legend: DONE = built and matches spec in code; PARTIAL = built, a spec part is missing or unverified; MISSING = not in code.

## 1. Screen and feature table
| Spec item | Status | Evidence / gap |
|---|---|---|
| Bottom bar Home, Loads, Masar ball, Earnings, Truck; gear and bell top right | DONE | s.tsx (v3 layout, replaces the old Masar/Loads/Money/Truck/More bar) |
| Home road screen (hero, next up, ELD rings, Needs-you chips, money card, greeting) | DONE | s.home.tsx, components/solo/v3.tsx |
| Home goal strip with ring and "$X to go" line | PARTIAL | Goal only inside MoneyCard / earnings (goalLine); no "2 good loads would do it" line |
| Home "Done for you today" list with detail and undo | MISSING | Not on s.home; only chat cards (Undo) and /s/activity (bell) |
| Chat thread: text, voice note, photo, attach, tasks, archive | DONE | MasarHome.tsx (mode chat), VoiceComposer, s.archive |
| Hands-free voice mode | PARTIAL | VoiceComposer not read; in-app only, real cab test never done (QA 10-14) |
| Chat tools: add_expense, add_load, evaluate_offer, draft_counter, create_invoice, send_invoice, chase_payment, set_goal, goal_status, recommend_next_load, profit_report, start_pretrip, document_upload, report_issue, load_status; lookups (invoices, loads, offers, weather, web, ETA, snapshot, spending, late notice, find_loads) | DONE | masar/tools.server.ts, lookup.server.ts |
| Spec tools not present: mark_paid, ifta_report, categorize, find_shop, schedule_pm, weekly_review, renewal_reminders, book_load by chat, "when is my medical expiring" | MISSING | No schema in SCHEMAS/LOOKUP_SCHEMAS (Mark paid exists only as a button on s.late) |
| Load screen compact (map, miles line, stops, step strip, one next button, 3 doc tiles, More menu, countdown + checklist) | DONE | s.loads.$id.tsx, LoadParts.tsx (LOAD_SCREEN_FIX items all present; RateConCheck removed) |
| Load keep number includes empty miles | PARTIAL | s.loads.$id and MyLoadCard call masarLoadKeep with deadhead: 0 (offer screens use real deadhead); list and detail can differ |
| Rate con from email automatic; broker status emails (owner tap or ask once) | DONE | lib/mail/ratecon.server.ts, solo/ratecon-auto, status-email.ts (QA 10-14 14:40, 15:40) |
| Loads tab My loads (On the road, Next up, Done) | DONE | s.loads.index.tsx (MyLoadCard with keep ring) |
| Loads tab "Offers" as separate tab (spec 2 and mockup) | PARTIAL | Now only My loads and Find a load; offers live in FindLoad. Confirm this is intended |
| Find / offer detail / add offer | DONE | s.find.index, s.find.$id, s.find.new (not re-read; QA verified) |
| Offer reply screen (mock 8) | DONE | s.reply.$id.tsx |
| Hours of service screen (mock 7) | PARTIAL | s.hours.tsx built; real data needs a connected ELD (s.connections.eld is a provider picker). Demo shows Sample |
| Late invoice screen (mock 9) | DONE | s.late.$id.tsx (reminder via EmailSheet, Mark paid + undo_payment) |
| Earnings: you kept ring, week/month/year bars, owed, aging, ready to invoice | DONE | s.money.tsx |
| Invoices create/send, expenses, IFTA, factoring, disputes, recap | DONE | s.invoice.$loadId, s.expense, s.ifta, s.factoring, s.dispute, s.recap |
| Taxes set-aside, settlements | PARTIAL | Set-aside only as an estimate at goal reached (GoalReached); no settlements view (Solo owner has none: confirm N/A) |
| Truck tab: MPG, days no breakdown, coming up, repairs, pre-trip, docs, ELD, truck info | DONE | s.garage.tsx, s.truck, s.pretrip, s.docs |
| Goals engine: revenue, net, loads, miles, profit per day | DONE | tools.server.ts goalLine |
| Goals: uptime goal, at-risk daily check-in push, weekly review | PARTIAL | Uptime returns 0 and a text only; EOD 6 pm and digest exist; no weekly_review |
| Cost model with Estimated / Learning / Based on data, EIA fuel, learned MPG | DONE | masar/cost.ts, fuel.server.ts, FuelPriceLine |
| Hire Masar onboarding | PARTIAL | s.hire.tsx has 4 steps (DOT, confirm, costs + goal, connect email). Missing: comfort dial step, text-to-Masar number, "first automation now" step. Audit 10-14 called s.hire an orphan: reachability not confirmed |
| Rules for Masar: dial, per-job A/B levels, quiet hours, digest, cost profile, history | DONE | s.rules.tsx (owner-only edit) |
| Spend limits ("within user-set limits" for class C) | MISSING | No limit field in s.rules |
| Autonomy classes A to D enforced server-side with audit | PARTIAL | masarDecide/masar_actions used; server enforcement not read this cycle |
| Pause everything | DONE | PauseSwitch in s.more |
| Connections page (ELD, accounting, load sources, email) | PARTIAL | s.connections.index, s.connect-email, s.quotes, s.sources; Gmail/Outlook need Google verification (owner); no ELD provider actually connected |
| Credits, Upgrade, billing outside the app | DONE | s.credits, s.upgrade, BillingOutside.tsx (audit items 13, 14 fixed) |
| Help, Terms, Profile + memory + activity log, Notifications, Activity | DONE | s.help, s.terms, s.profile, s.notifications, s.activity |
| "Features the plan lacks never appear" | PARTIAL | s.more still lists "AI assistants" (/s/assistants, not read); orphan s.calc, s.ai, s.bots, s.design remain |
| Text-message channel to Masar | PARTIAL | api/public/twilio.sms.ts exists; Twilio token/number is an owner item |
| Push notifications / Capacitor shell | PARTIAL | lib/native/push.ts wrapper only; no store build |
| Find-a-load agent (brief, ranked offers, browser worker) | PARTIAL | Phases 1-2 built; browser worker is in this repo, not live; reseller permission needed |
| Per-screen QA at 390 px light and dark | PARTIAL | Lovable reported axe 0 violations (7 screens); mock 5-9 screens never clicked by us |

## 2. Carrier setup packet step (RMIS / Highway)
Status: PAUSED by owner (QA_LOG 10-14 14:40, 16:05, 19:30). Not in code, not in any round. Do not build until the owner picks an option. Needs an owner decision and likely an RMIS or Highway account before any round.

## 3. Minor held items (checked in code at f9ce6f13)
| Item | Status | Evidence / action |
|---|---|---|
| Spending reply English only | CLOSE | Spanish was removed (f9ce6f1); nothing left to translate. Drop it |
| unpaid_invoices uses UTC "today" | OPEN | lookup.server.ts `new Date().toISOString().slice(0,10)`; use localToday(new Date(), ctx.tz) from spend.ts (export is there) |
| "Fuel" has no i18n entry | CLOSE | i18n is English only now (AnswerCards uses t(c.name)); no user effect |
| "Ask your owner or dispatcher" wording | PARTIAL | spendingLookup now says "Company money is for the owner. Ask your owner." The old phrase was not found in the files I read; the remaining spot, if any, was not located (no repo grep available) |
| Test that device tz beats company tz | OPEN | spend-lookup.test.ts never sets ctx.tz; only spendWindow is tested with a tz. Add: ctx.tz Pacific vs company Chicago near midnight |
Other UTC-today spots found: tools.server.ts `today()` (add_expense default date), periodStart/actuals (server clock for week/month goals and profit_report), s.late received_on (`toISOString().slice(0,10)`), s.garage inDays. All are wrong by a day on a US evening.

## 4. Proposed rounds (max 6, one message each, independent, smallest risk first)
R1 Time and wording cleanup (lowest risk)
- Use ctx.tz/device tz for: unpaid_invoices today, add_expense default date, actuals/periodStart, s.late received_on, garage inDays. Fix any remaining "owner or dispatcher" text. Add the tz-beats-company test.
- Accept: tests pass; at 21:00 Chicago (02:00 UTC next day) an expense logs with the local date and unpaid days late matches the Earnings screen.
R2 Done for you today + goal line on Home
- Add a "Done for you today" strip (from masar_actions, tap for detail, Undo where possible) and a one-line goal gap under the goal ring; add weekly_review lookup and a real uptime goal figure (pre-trips and open repairs).
- Accept: Home shows 3 sample actions on the demo account; Undo works; goal line text uses recorded numbers only; 390 px light and dark; no new per-action prices.
R3 Missing chat tools
- Add mark_paid (ask first, uses undo_payment), ifta_report (read), renewal lookup ("when is my medical/insurance expiring"), schedule_pm (draft, ask first), find_shop only if a data source exists (else do not add). Add eval phrases and tool-choice tests.
- Accept: each phrase picks the tool in the eval set; money/outward ones are proposed, not run; undo or void exists.
R4 Rules and autonomy proof
- Add owner spend limit (auto-approve under $X, ask above) to s.rules; add server-side tests that class B/C/D never run without approval, Pause forces Suggest, driver cannot change rules.
- Accept: SQL/vitest tests for A-D; paused account runs nothing outward; limit saved and audit logged.
R5 Hire Masar completion and cleanup
- Add comfort-dial step and "show me one real job" step (paste a broker email or snap a receipt); link s.hire from the Home setup chip; remove or hide s.calc, s.ai, s.bots, s.design, and the "AI assistants" row if the plan does not include it.
- Accept: new Solo account reaches Hire Masar from Home; finishes in under 5 steps; no unavailable-feature rows in More; routeTree has no dead /s links (existing routing test).
R6 Numbers match everywhere
- Load screen and My loads keep ring use the same deadhead as the offer (store deadhead on the load at booking, or compute from truck position); remove deadhead: 0. Ensure list vs detail keep, fuel price and MPG are one shared calculation.
- Accept: same load shows the same keep/miles in Loads, load screen, Earnings and chat; test with a load that has 35 deadhead miles.
Not in these rounds (waiting): carrier setup packet (paused), load-agent Phases 3-5, Capacitor build, signed expiring links for BOL/POD (decided against, documented).

## OWNER must do
- Perplexity: add PERPLEXITY_API_KEY via the Lovable secure form; read Perplexity data-retention terms.
- Confirm migration 0066 is applied in the live database; publish the app (nothing is live until you publish).
- Google: finish Gmail verification (until then the warning screen and the 100-user cap apply); Microsoft app registration if not done.
- ELD: choose a provider and apply for partner/API access (Motive, Samsara, etc.); Hours screen shows real data only after that.
- Twilio: SMS number, token and webhook for the text-to-Masar channel; Vapi/ElevenLabs keys for voice if wanted.
- HERE: confirm terms for carrier use and that the key allows app.masar10x.io and *.lovableproject.com. Open-Meteo: paid commercial plan.
- Load agent: written DAT reseller permission, a worker host, the platform login stored as host secrets, run `npm run inspect`.
- Stripe: confirm live mode (earlier note said Test mode on the billing page). Apple/Google developer accounts, APNs/FCM keys for push and the Capacitor build.
- Decide: carrier setup packet option; pricing proposal; whether Offers should be its own tab again.

## What I could not check
- Nothing was run or clicked; no tests executed; live DB, applied migrations, published app and secrets not inspected.
- Not read: s.find.*, s.pretrip, s.docs, s.expense, s.ifta, s.factoring, s.credits, s.upgrade, s.help, s.terms, s.activity, s.archive, s.assistants, FindLoad, LoadParts, v3.tsx, VoiceComposer, PauseSwitch, masar.functions.ts (server-side autonomy), road.server.ts, solo.functions.ts. Their statuses rely on QA_LOG verdicts.
- Mockups other than solo_v3 (v2, journey, ads, signup) were not compared; solo_v3 screens 1-4 were not compared in detail.
- No repo-wide grep was possible, so the "owner or dispatcher" string and any other UTC date use may exist in unread files.
