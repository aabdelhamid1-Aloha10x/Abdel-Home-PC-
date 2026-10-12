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
