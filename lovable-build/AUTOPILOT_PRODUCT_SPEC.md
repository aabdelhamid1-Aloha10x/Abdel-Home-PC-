# Masar OS: Autopilot product spec (Solo first, then fleets)
Owner decisions: the app is "ChatGPT for your company". Anything can be done by a voice note or a text. AI does the work, the user watches, steers and can stop it. Autopilot is the default for harmless jobs; Ask-first is the fallback for everything else. Money stays record-only (the owner pays outside the app).

## 1. Principle
Not a TMS with AI features. A back office that runs itself. Manual screens exist for viewing, correcting and the rare manual job. Screens are organized around outcomes ("what got done", "what needs you", "am I on goal") not around data tables.

## 2. Solo front door (replaces the earlier tab layout)
Bottom bar: **Masar** (home, the thread) | Loads | Money | Truck | More.
Masar home screen, top to bottom:
1. Goal strip: progress ring and one line ("$5,420 of $8,000 this week. $2,580 to go. 2 good loads would do it."). Tap to edit goal.
2. Needs you: one-tap cards (approve counter-offer, confirm expense category, OK a repair estimate, sign the invoice).
3. Done for you today: short list of what Masar did, each tappable to see detail and undo.
4. The conversation thread with a composer at the bottom: text, VOICE NOTE (hold to record), camera/photo, attach file, and a hands-free voice mode. Suggestion chips adapt to context ("Add today's fuel", "Show unpaid invoices").
Masar also starts conversations: push, text and voice when something needs attention or a goal is at risk.
Loads tab contains My loads | Find | Offers (Find hidden or minimal until a load source is Connected). Money tab: invoices, expenses, settlements, IFTA, taxes set-aside. Truck tab: truck, trailer, documents, pre-trip, maintenance, ELD/GPS (one grouped connection page). More: Rules for Masar, Profile, Credits, Upgrade, Help, Terms. Features the plan does not include never appear (no "unavailable" rows).

## 3. Command layer (everything by message or voice)
Natural language or voice note > transcription > intent > tool call(s) > result card in the thread. Voice notes are transcribed (speech-to-text) and the transcript is kept. Tools (each audited, each metered in credits, never shown as a per-action price):
- Loads: add_load (from text/photo/email), evaluate_offer, draft_counter, book_load (ask first), update_status, find_loads (when a source exists).
- Money: add_expense (receipt photo, forwarded email, "$412 fuel in Ohio"), categorize, create_invoice, send_invoice (ask first until trusted), chase_payment (drafts, then sends within rules), mark_paid, profit_report, ifta_report.
- Goals: set_goal, goal_status, recommend_next_load, weekly_review.
- Truck: start_pretrip (voice-guided, photo for defects), report_issue, find_shop, schedule_pm, document_upload (reads dates), renewal_reminders.
- Info: "how much did I keep last month", "which broker pays best", "when is my medical expiring".
Rule: if intent is unclear Masar asks ONE short question. Every action is shown in the thread with Undo where possible.

## 4. Autonomy policy
Action classes:
- A Harmless (read, calculate, categorize, log, remind, draft, summarize, reminders): AUTOPILOT by default.
- B Outward-facing and reversible (send invoice, send broker email, text a shop): ASK FIRST at the start; can be moved to Autopilot per job after the user sees a track record.
- C Commitments and money (accept a load, approve spend, anything that costs money): ASK FIRST always unless within user-set limits.
- D Safety-critical or unusual (accident, injury, legal, large spend): human decides.
Controls: global dial (Suggest / Ask first / Autopilot), per-job dial, spend limits, quiet hours, "Pause everything" switch always visible, activity log, undo window where possible. New users start with A on Autopilot, B and C on Ask first. Unused credits expire monthly; if credits run out, automation falls back to Ask-first and the user can top up in one tap (never a dead stop).

## 5. Goals engine
Goal types: revenue (week/month), net profit, loads, miles, profit per day, equipment uptime. Set by voice or text ("I want $3,000 net this week").
Engine: tracks actuals (delivered + booked + invoiced), pace to goal, remaining gap, days left, and the loads/actions that close it. Offers are ranked by contribution to the goal and net profit per DAY (including deadhead and time), not just rate per mile. Daily check-in message; alerts when the goal is at risk ("You're $1,300 short with 2 days left. This load adds $980 net. Counter at $2.40?"); end-of-week review. Fleets: company goals (revenue/week, on-time %, cost per mile, uptime %, no expired documents) plus per-truck and per-driver goals.
Equipment-running goal: uptime target; Masar watches PM, defects, fault codes (when ELD connected) and schedules fixes before the truck stops.

## 6. Accurate cost model (profit per load, per day, per mile)
Onboarding captures everything below; every item can be "skip, use an estimate" and is refined later from real data. A confidence badge shows Estimated / Learning / Based on your data.
Equipment (separately for truck and trailer): ownership type (owned, financed, leased, lease-purchase, rented, provided by carrier, none), monthly payment, down payment/deposit, term and balance (optional), weekly or monthly rental rate, lease-operator deductions if leased to a carrier.
Insurance (monthly or annual, convert automatically): primary liability, cargo, physical damage, occupational accident or non-trucking liability, bobtail, trailer interchange, deductible; or "insurance is deducted by my carrier" with the weekly deduction. Option to upload the insurance declarations page and have Masar read the amounts.
Fixed costs: permits and fees (IRP plates, UCR, 2290/HVUT, IFTA admin, state permits), ELD and GPS subscription, phone, accounting, load-board fees, parking, truck wash, loan/lease escrow, taxes set-aside %, owner pay target.
Variable per mile: fuel (see below), maintenance reserve per mile, tires per mile, tolls, DEF, scales, lumper (when applicable).
Business percentages: factoring fee %, dispatcher fee %, broker fees.
Load profit = revenue - fuel (loaded + deadhead miles / mpg x price) - variable per-mile costs - tolls - percentage fees - fixed costs allocated by days the load occupies the truck (including deadhead and waiting) - taxes set-aside optionally. Show net per mile, net per day, and "you keep".
Fuel price: start with the regional/national average diesel price for the load's origin region and along the route (EIA weekly by region, cached, fallback company setting); once the user logs fuel receipts, learn the user's own average price paid (rolling 30-60 days, by region/state) and use it, flagged "Based on your fuel". Fuel-card discounts (e.g., cents off per gallon) are applied.
MPG: default class 8 estimate (about 6.5) until real data: compute from full-tank fill-ups (miles between fills / gallons) or from the ELD fuel and odometer feed when connected (Phase 9). Seasonal and load-weight adjustments later.
All numbers editable in "Rules for Masar", with a clear history of what was learned.

## 7. Onboarding: "Hire Masar" (conversational, 3 to 5 minutes)
Steps (each one a chat message with quick-reply buttons plus voice): 1) FMCSA lookup (existing). 2) Truck and trailer: own/financed/leased/rented, payments. 3) Insurance (type, amount, or upload the declarations page). 4) Fixed and fuel basics (fuel card, ELD, phone) with "estimate for me". 5) Goal ("weekly revenue or net profit?"). 6) Comfort dial (default: harmless on Autopilot, outward-facing on Ask first). 7) Connect inbox (email forwarding address or Gmail/Outlook OAuth) and optional text-to-Masar number. 8) First real automation: ask for the last broker email or a receipt and show Masar doing the job. Success metric: first automation within 10 minutes.

## 8. Fleets (same idea, department staff)
The company has a company-wide "Ask Masar" thread (role-aware: a dispatcher only sees what a dispatcher may). Each department is a staffer with its own page: Dispatch, Accounting, Maintenance, Safety, Recruiting, Driver communications. Each staff page shows: live activity feed of what the AI is doing right now (calls in progress, timers, drafts), its queue, KPIs, its autonomy dial and guardrails, and a "Needs you" list. Manager home = Needs you + Done for you + company goals. Per-truck profitability and a weekly "what Masar did and saved" report.

## 9. Channels
Phase S1: in-app thread (text + voice notes + photos). Phase S2: text-message channel (text the company's Masar number, same agent), push notifications, voice call-in. Phase S3: ELD/telematics for MPG, location, fault codes; fuel card feed.

## 10. Credits and cost control
Every tool call and LLM call logs cost and credits. Included monthly credits expire; packs never expire. Fast cheap model for chat/classification, mid model for decisions, top model for hard calls (see VOICE_AGENT_SPEC section 11). Track "automation rate" (share of actions done by Masar) per company as the key health metric.

## 11. Acceptance for Phase S1 (Solo front door)
[ ] Masar home with goal strip, Needs you, Done for you, thread with text, voice note and photo. [ ] At least these tools work end to end with undo: add_expense, add_load, evaluate_offer, create_invoice, set_goal, goal_status, start_pretrip, document_upload. [ ] Onboarding captures equipment, insurance (incl. leased/rented), fixed costs, fuel, goal, dial. [ ] Profit math uses all of section 6 with confidence badges. [ ] Autonomy classes A to D enforced server-side with audit log. [ ] Pause everything works. [ ] No unavailable-feature rows on Solo. [ ] Tested in a real browser at 390px light and dark; report gaps plainly.
