# Fleet OS — Department Blueprint framework (shared by every department writer)

Product: multi-tenant SaaS TMS for owner-operators and small/mid fleets. Name "Fleet OS" is a placeholder. Positioning: "your back office on autopilot".
Source of truth to read first (all under /tmp/claude-0/-home-user-Abdel-Home-PC-/d301fd9f-e644-571f-880a-6ab5b6589b47/scratchpad/):
- inventory/*.md  = click-by-click inventory of the CURRENT ANH system (use ONLY as a parity checklist: nothing real users rely on may be lost; ignore its bug lists except to note "fixed by design")
- Department_Feature_Spec.md, TMS_Product_and_Pricing_v2.md, CEO_Creative_Concepts.md = earlier decisions
- AI_Model_Comparison.md = model tiers + per-run costs (Fast / Balanced / Smart / Voice)
- ui_design/project/*.dc.html = existing screen mockups (look at names/layout only)

## Rule 1 — Workflow first, AI only where thinking is needed
Use a plain WORKFLOW (rules, triggers, templates, calculations, queues — free/near-free to run) when the logic is deterministic: status changes, reminders, calculations, notifications, imports, approvals, scheduled reports.
Use an AI BOT only when the task needs one of: reading unstructured input (PDF/photo/email/voice), judgment between options, writing natural language, multi-step reasoning/planning, or a live conversation.
For every feature in a department say explicitly: **WORKFLOW** or **AI BOT** (or **HYBRID**: workflow with one AI step), and why.

## Rule 2 — Three tiers; AI is the upgrade path
Tier names (draft): **Core**, **Pro**, **Autopilot**. (Enterprise = custom, ignore for costing.)
- **Core** — everything needed to run a fleet with workflows; AI limited to "assist" basics: rate-con/BOL/invoice reading with a small monthly bundle, receipt scan, simple smart search. Humans do the judgment.
- **Pro** — AI *assists* with approval: drafted emails/disputes/broker updates, triage of messages/tickets/documents, ask-your-company chat (limited), delay-risk alerts, maintenance triage with photos, AI texting for recruiting. A human clicks approve on anything that leaves the building or moves money.
- **Autopilot** (premium, the one we want everyone to choose) — bots that ACT within rules the owner sets: autonomous money-recovery (detention billing, short-pay disputes, collections follow-up), dispatch planning, voice agents (recruiting calls, check calls, shop calls), morning brief and proactive alerts, deepest analytics chat, highest caps.
Upsell mechanics to design into every department: **locked-feature previews that show dollars** ("Fleet OS found $412 of unbilled detention last month — turn on Autopilot to recover it"), a usage meter, and an obvious "what you'd get" compare. Money-recovery bots belong in Autopilot because their value dwarfs the price.
Every AI feature has: tier availability (Core/Pro/Autopilot), monthly cap per tier, cost per run, and an owner-controlled autonomy switch: Off / Suggest (human approves) / Auto.

## Rule 3 — Safety rails on every bot
Off/Test/Live mode per tenant and per department; kill switch; full audit log (who/what/why, inputs, output); human approval gates for money movement, customer-facing messages in Pro, and anything legal (STOP/consent, adverse action); quiet hours; per-run confidence with escalation to a stronger model or a human.

## Output format for each department (markdown, one file per department)
# <Department> — blueprint
## 1. Who uses it and what a day looks like (3-6 lines; roles)
## 2. Screen map (list every screen/tab with route name and purpose; phone vs desktop)
## 3. Click-through flows — for the 4-6 most important jobs, write numbered steps "1. User does X → 2. System does Y → 3. ..." that show exactly what happens when each key button is pressed, including what the AI/workflow does behind the scenes, what is saved, and what the user sees
## 4. Feature table — columns: Feature | What it does | WORKFLOW / AI BOT / HYBRID (+why) | Exists in ANH today? (Y/Partial/N — cite inventory file) | Tier (Core/Pro/Autopilot) | Priority (Launch / V2 / Later)
## 5. AI bots in this department — for each: name; trigger; steps; reads; writes; human-approval point; autonomy switch default per tier; model tier (Fast/Balanced/Smart/Voice) and the exact model chosen from AI_Model_Comparison.md; typical tokens/minutes per run; COST PER RUN in USD with the assumptions shown; time/money it saves per run (use ANH-scale numbers where possible)
## 6. Tier matrix — rows = features/bots, columns = Core | Pro | Autopilot, cells = ✓ / limited (give cap) / —; plus monthly cap per AI feature per tier
## 7. Cost to run at each tier's MAX caps — a table: AI feature | cap per month at Core / Pro / Autopilot | unit cost | monthly cost at cap. Subtotals per tier. State all unit-cost assumptions and mark [E] estimate / [V] vendor-page-verified (from AI_Model_Comparison.md). Also non-AI variable costs this department drives (SMS segments, voice minutes, ELD pings, storage, email) with unit price assumptions.
## 8. Parity checklist — every current-ANH feature from inventory/ for this department that real users rely on (usage numbers) mapped to where it lives in the new design, or "dropped: reason". Nothing silently missing.
## 9. NEW features not in ANH today (beyond parity) that make it better than Alvys-class TMSs
## 10. Open questions for Abdel (max 5)

Be concrete and numeric. No filler. Keep each department file under ~700 lines. Write the file EARLY (draft within your first ~25 tool calls) then refine. Do not modify anything outside the blueprint/ folder. Do NOT touch the live Lovable project (no Lovable write tools at all; reading inventory files is enough, you do not need Lovable access).
