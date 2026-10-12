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
