# Solo app status, Oct 15 2026 (Lovable project 91b7f59c, latest verified commit 10ac09a)
Method: every round was verified by reading the diff/code with read-only subagents. NOTHING was run or clicked: no tests executed, no migrations applied by us, no logged-in visual check. "Verified" below means "read in the code".

## Built and code-verified
- Shell and Home v3 (greeting, road hero, ELD rings, needs-you chips, money card, goal card + goal line), bottom bar, dark/light.
- Loads: My loads (On the road + Next up only), Past loads with monthly folders, compact load screen, Find a load (what the system knows + suggestion + one question, ranked offers with offer ids, no outgoing links), offer detail/reply, late invoice, case screen (email/call broker, approve terms, request booking).
- Masar chat tools: add_expense, add_load, evaluate_offer, draft_counter, invoices, goals, profit_report, weekly_review, mark_paid (ask first), ifta_report, renewals, schedule_pm, find_shop (saved shops only), ask_web (Perplexity), weather/traffic.
- Rules for Masar: dial, per-job levels, quiet hours, spend limit (default $0), summary line, Pause everything (tested paths: outbox, daily chase, vapi send_sms, add-expense, offer_reader/broker_writer/money_helper).
- Hire Masar (5 steps, comfort dial, "show me one real job" preview), setup chip, orphan routes removed/redirected.
- Notifications: clearing fixed at root (RLS rpc), one alert per sender/subject/day, undo list. Quotes address simplified, forwarding moved to Connections > Other mailboxes.
- Time zones: device > company > UTC flagged; local "today" everywhere audited.
- Shared keep/deadhead calculation (keep.ts), deadhead stored on the load; "empty miles not set" instead of 0.
- Usage metering (usage_events, unit_costs, admin usage screen, Vapi cost breakdown parts); credits/plans untouched.
- Spanish removed (English only; self-harm safety regex still matches Spanish phrases by design: owner may remove).
- Load agent Phases 1-2 (brief, ranking, case/approval, background search contract, negotiation states). Browser worker program exists in masar-browser-worker/ (6 tests vs a fake site; not run against the real reseller site).

## Known gaps (not fixed)
- Never visually verified in a logged-in browser. Earnings: owner thinks it looks older; S2/S2b/S3 did not touch it (code is still v3). Needs a screenshot.
- Partial: expense and assistants screens are redirects (contents never listed); "owner or dispatcher" wording sweep only partly done; render-level parity test is shallow; Earnings/profit_report use of the shared keep function not confirmed; several tests are source-text scans or use mocked clients; drizzle snapshots 0070-0085 are empty stubs.
- Lovable commit messages understated content repeatedly (R1, S3, S5, S6, S6b).
- Not built: carrier setup packet (owner paused), Hours with real ELD data, push/Capacitor build, text channel live, Vapi broker call app side (P4), web system (Core/Growth/Enterprise office screens).

## Owner to-do list (cannot be done by Claude)
1. Apply Lovable migrations through 0085 in the live database; confirm 0066 applied.
2. Add PERPLEXITY_API_KEY via the Lovable secure form; read Perplexity retention terms.
3. Provide a logged-in visual check: phone screenshots (Home, Loads, Find a load, Earnings, Rules, notifications), or a local Claude Code session using lovable-build/smoke/SMOKE_TEST_PLAN.md with a fresh empty Solo test account.
4. Google: finish OAuth verification (100-user cap and warning screen until then).
5. ELD: choose provider and apply (Hours shows real data only after that). Twilio: SMS number/token/webhook. Stripe: confirm live mode. Apple/Google developer accounts + push keys.
6. Vapi: new webhook secret (not an A&H one), keys via Lovable secure form, create the Masar Load Inquiry assistant (local session, prompt in lovable-build/LOCAL_SESSION_PROMPTS.md and lovable-build/vapi/SYSTEM_PROMPT.md); counsel review of AI disclosure/recording/calling hours/do-not-call.
7. Worker: Hostinger VPS (KVM 4, 16 GB, shared with n8n): snapshot, firewall (22 from owner IP, 80, 443), deploy worker, run inspector; written reseller approval_ref recorded in the app per company.
8. Decisions: pricing/credits (after scenario tests), website merge, sister-fleet testimonials, carrier setup packet option.
