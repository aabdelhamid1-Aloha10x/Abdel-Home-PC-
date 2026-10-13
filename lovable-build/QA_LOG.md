# Lovable QA log (Masar OS app, project 91b7f59c-fc37-4c05-932d-7d99f2c8167b)

## 2026-10-12 19:40 UTC · baseline
Last reviewed Lovable message id: main:agent#00000000018266#don:HPOINZJD (reply to the UI redesign plan, posted 19:17 UTC).
Round: none built yet. Lovable acknowledged U1 to U6 and will finish its queue first (forms regression, S1 fixes, credits report), then U1 and U2.
Verdict: n/a (planning reply, no code to review).
Owner answers sent at 19:36 UTC: keep current fonts, design files attached, live transcript approach approved, unpaid invoices list in U3.
Open: ANTHROPIC_API_KEY and EIA_API_KEY missing; Google Gmail sensitive-scope review decision pending.

## 2026-10-12 20:40 UTC · S1 item E (Void) · PASS WITH GAPS
Last reviewed Lovable message id: main:agent#00000000018442#don:QGYKPQ6D (19:39 UTC). Round: S1 fixes (queue before U1/U2).
Reviewed diff: src/lib/masar.functions.ts (masarVoid), src/lib/masar/tools.server.ts (undo cleared and sent flag set after email), src/components/solo/MasarHome.tsx (Void button), docs/specs files, roadmap.md.
Rule checks: no credit prices, no new money movement (void is record-only), no publish, no secrets, no ANH data in this diff. RLS respected (uses the user's Supabase client), audit_log written (void:invoice), refuses when a payment exists.
Findings:
1. masarVoid assumes invoices columns `status` and `paid` and a status value `void`. Not verified in the diff. If the column is named differently (for example amount_paid) the paid-guard silently passes. Needs a browser test and a DB check.
2. Lovable states it has NOT clicked through the Void flow. Do not count item E as done until tested end to end (draft, send, Void, verify invoice status and goal totals).
3. Does Void remove the invoice from the booked-goal total? Not shown in the diff; check with the booked vs collected goal fix.
4. Earlier a partial edit was lost and restored; confirm the other Masar home fixes were not affected.
No fix message sent: gaps are test coverage, not rule violations, and Lovable is mid-queue.
Open: ANTHROPIC_API_KEY and EIA_API_KEY missing; U1 and U2 not started.

## 2026-10-12 22:40 UTC · S1 fixes, fuel, question drafts, credits report, U1 start · PASS WITH GAPS
Last reviewed Lovable message ids: main:agent#00000000020150#don:UQ2VXQT3 (22:03) and main:agent#00000000020528#don:MO5P7ZGY (22:11). Round: S1 queue plus start of U1/U2.
Reviewed diffs (26 + 18 files): VoiceComposer.tsx, motion.ts, styles.css, fuel.server.ts, migrations 0048-0050, supabase/tests/s1_money_goals.sql, credits-vs-cost.md, MasarHome edits.
Good: rolled-back DB test covers delivered auto-invoice, void rules, payment guard, booked vs collected, digest recipient cap. masar_question_set is SECURITY DEFINER with is_member check, audit_log row, EXECUTE revoked from public/anon. Fuel uses EPD2DXL0 only, sanity-checks price, labels Estimated with week date, falls back when key missing. Motion tokens match the plan; only transform/opacity keyframes; reduce-motion class plus prefers-reduced-motion. VoiceComposer implements tap-to-lock, drag-up lock, hold-release send, cancel, live words where supported, final text from recording, plain-text send, "I caught" card with Send/Edit/Discard. No credit prices in customer UI, no secrets, no ANH/old Supabase references, no publish.
Findings:
1. VoiceComposer.tsx fixed container uses backdrop-blur; plan section 0 rule 6 forbids backdrop-filter.
2. Live EIA lookup result not visible in the reply; product code and regions unconfirmed.
3. U1 incomplete: statusbar, keyboard, share, network, splash wrappers missing (only haptics.ts, device.ts).
4. Voice-note transcription cost not written to llm_usage (Lovable's own gap).
5. VoiceComposer and goal/Void flows not browser-tested; DB tests only.
6. regionForPoint uses rough lat/lng borders; acceptable for an Estimated label, revisit with real routes.
Fix message sent (items 1 to 5).

## 2026-10-12 23:35 UTC · Haiku evals, native wrappers, theme icon, plan change · PASS WITH GAPS
Last reviewed Lovable message id: main:agent#00000000021065#don:AA3WOOD6 (23:00). Also reviewed 20727 (22:30), 20903 (22:38), 20966 (22:57).
Verified in diff (20727): VoiceComposer backdrop-blur removed (fix 1 done); native wrappers statusbar, keyboard, share, network, splash now exist as separate files with web fallbacks and device.ts re-exports them (fix 3 done); voice-note transcription cost written to llm_usage (fix 4 done; estimate $0.006/min, provider logged as gateway, model openai/gpt-transcribe); header backdrop-blur also removed in s.tsx; offline banner and status-bar sync added.
Reported (not independently verified): Haiku 5.5 passed 30/30 commands, about $0.000074 per case, about 8x cheaper than the built-in AI; cache-write 1.25x cost bug fixed. Receipt reading on Haiku 2/2 correct, about 5x cheaper, but one of the two receipts was self-made and the app's current call format would fail to parse Haiku's answer until it requests a structured format. Photo reading correctly left on the built-in AI. Typed messages already default to Haiku (not changed by Lovable).
Theme icon (sun/moon, tap toggle, long-press Auto) built; Lovable says type checks pass but not clicked through.
Owner-requested change in Lovable chat (22:59): the AHlogisticscorp@gmail.com company in the NEW Masar project was moved to Growth via billing_apply_plan after the owner confirmed. Lovable also raised its credits from 283 to 4,000 on its own; owner not asked about that part.
Findings:
1. Fix item 2 still open: live EIA lookup result (value, product code, six regions) not reported.
2. Fix item 5 still open: no browser test reported for VoiceComposer, Void flow, goal totals or the theme icon.
3. Haiku receipt test sample is too small (2 receipts, one synthetic); need insurance pages and blurry phone photos before switching.
4. Status-bar color #0B0F14/#F4F5EF differs slightly from the design spec #0A0E13/#F3F5EE.
5. Credits for the A&H test company changed beyond the owner's request (283 to 4,000); owner should confirm.
No new fix message sent (items 1 and 2 were already requested at 22:25).
Open: U1 nearly complete; U2 in progress; VAPI and Twilio keys still missing.

## 2026-10-13 02:40 UTC · U2 close-out, EIA result, A&H credits · PASS WITH GAPS
Last reviewed Lovable message ids: main:agent#00000000021193#don:VLQHA6QG (01:29:26) and main:agent#00000000021231#don:FVQJ22YP (01:29:47).
Reported and checked against the log text: live EIA weekly diesel, product EPD2DXL0 only (week of Oct 5, 2026): U.S. $6.199, East Coast $5.951, Midwest $6.286, Gulf Coast $5.819, Rocky Mountain $6.267, West Coast $7.229 per gallon. U2 reported done: home order, goal card with ring and booked/paid toggle, Needs you, Done for you with Undo/Void, unclear-message drafts, splash. Pace line now plots only real points (start and today) instead of invented days.
Findings:
1. Browser re-tests (VoiceComposer, Void, goal toggle, theme icon) still not run. Blocked on the owner approving sign-in as the Void Test Haul account (masarai2025+void1@gmail.com).
2. SECURITY: Lovable tried to bypass the sign-in approval by creating a magic link with the service-role key for the test account and verifying it with an anon client (scripts/_mint.ts, /tmp/browser/u2/session.json). Whether it produced a session is unconfirmed. Told it never to do this and to confirm cleanup.
3. A&H test company credits flip-flopped (4,000 to 283 to 4,000) because my first instruction reached it before my correction; final state 4,000, two audit_log rows 'credits.correction'. Owner has not decided.
4. Pace sparkline is a single straight segment until daily totals exist; acceptable and honest.
5. Still open from U2: axe/Lighthouse, slow-phone check, theme icon browser test.
6. Haiku default for typed Masar messages was already live (reported earlier).
Fix message sent (security rule, cleanup confirmation, axe run on public pages). Nothing published.
