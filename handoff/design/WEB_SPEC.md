# Office web app: build spec (generated from the mockup)

Source of truth is the clickable mockup. Each screen below lists its purpose and the behaviors, rules and permissions it must implement.
Look: Night Shift (dark cockpit, lime accent, light/dark/auto). Multi-tenant: every record carries org_id and is protected by row-level security. Money is record-only.

## Home

### Overview (`WebHome`)

Command cockpit for the owner and dispatch manager: everything that needs attention today in one screen.

- KPI row: loads in motion (with late count), revenue and profit this week, cash owed (with overdue), and a live count of approvals waiting.
- Needs you: actions proposed by assistants in Ask first mode. Approve, Decline, Approve all and Undo work in place; every decision is written to the audit log with user and time. Managers and the owner can approve; dispatchers only see their own items.
- Alerts: expiring truck and driver documents, low driving hours, late loads, overdue invoices, trucks in shop. Each links to its record and can be dismissed for the day.
- Loads in motion uses the standard table (tabs On time, Late, Loading, search, drawer). Progress and ETA come from ELD pings and driver check calls.
- Fleet map thumbnail, assistants today (mode and what each did), fleet health gauges, today schedule, cash due with Remind (drafts only, never sends without approval) and week at a glance.
- Records money only: Remind and Mark paid never move money. Credit balance lives in the top bar; no per-action prices are shown.

### Ask (`WebAsk`)

Full-page "Ask my company": a chat for the logistics business that answers with tables, charts and one-click actions.

- Large input with mic and attach. Suggested questions are learned from what the team asks most; tapping one shows its answer on top of the conversation.
- Scope chips (Loads, Money, Fleet, Safety, Recruiting) limit which data areas the assistant searches and which suggestions show. Answers respect the user role: an accountant cannot read recruiting data.
- Each answer card has a headline, a small table, a bar chart, a plain-English why, sources, and actions. Actions that touch people (reminders, texts, offers) create drafts in Approvals and never send on their own.
- What I learned: list of company-specific facts (unit naming, what owes means, cost per mile). Each can be forgotten, all can be cleared with Undo, and learning can be turned off.
- History keeps the last 90 days of questions per user. Answers can be pinned to Home or scheduled as a report (Reports section).
- Credit use is shown only as a balance in the top bar. Read-only: the assistant cannot change loads or money from this page.

## Dispatch

### Planner (`WebDispatch`)

Assign trucks to loads with the rules checked for you: equipment, timing, hours of service, home time, truck and trailer status, and profit.

- Left to right: pick a load that needs a truck, compare every truck in one table (six checks plus profit, best first), read why, assign.
- Verdict per truck: Fits (assign), Warning (assign, the driver sees it), Blocked (a manager can override with a reason; saved in the audit log and the driver is told).
- Hours of service: 11-hour driving limit, 14-hour window, 70-hour cycle, 30-minute break after 8 hours, 10-hour rest. The planner adds a rest and rechecks the delivery window.
- Home time: blocks loads that start inside the driver’s home time or bring them home more than 8 hours late; warns when slightly late.
- Filter by team (Team East, Team West) when teams are on; one group otherwise. Each row shows the dispatcher and program.
- Week calendar shows the same load placed on the chosen truck, with home time, other loads and inspection dates.
- After assigning: notify the driver in chat (SMS if the app is not opened), send the rate con, share the tracking link. Undo is available.
- Rules live in plan_engine.py; speed for planning is 55 mph.

### Roll call (`WebRollCall`)

Start-of-day check: the system asks every driver for a status in the driver chat room, then shows every driver with check-in state, channel, reply time, hours of service, truck, load, home time and issues, so the dispatcher can fix gaps before the day starts.

- The default is an in-app message, not a call. At the start time (default 6:00 am) the system posts "Good morning, reply Ready, Late or Off" in each driver chat room with one-tap buttons in the driver app. A tap or a typed reply fills the board row.
- Escalation ladder (each step only reaches drivers who have not replied; every step has a switch and a minute stepper): app message 6:00, app reminder and push 6:15, SMS 6:20 (metered, from the included text allowance, no per-message price shown), voice call 6:30 (Growth plan, voice assistant), then a dispatcher alert for drivers still silent. A step out of order shows a warning.
- Check-in states: Ready, Late, Off, Needs a sub, Home time. A driver is Late when no reply arrives by the late time (default 7:30 am). Channel shows the step that got the reply (App, SMS, Call) or Dispatcher when nobody replied; Replied shows the time. Drivers on home time, leave or Off are not asked.
- Hours left comes from the ELD feed (driving left today of 11 h) and the 70-hour cycle; under 8 h shows amber. Truck status comes from the truck record (Active, In shop, Out of service).
- Group by team (Growth plan) shows each team leader's counts for Team East and Team West and lets you filter the board to one team; One group shows everyone together (Core always runs one group). Nudge late drivers in chat posts one reminder in each late driver room, or per team.
- Confirm the day logs who confirmed and when, and sends pickup confirmations to brokers for loads picking up today. Assistant suggestions (Ask first by default, Auto optional): substitute drivers, late-arrival broker updates, inspection and PM conflicts. Nothing is sent until a person clicks.
- Message template is editable in English and Spanish for the morning message, reminder and SMS, with fields in braces; each driver gets the language on their profile. SMS needs the driver's consent and includes opt-out wording. Schedule sets days, start time, late time, quiet days and holiday skip.
- Roles: Operations manager, Dispatch managers and Dispatchers confirm the day and nudge drivers; team leaders see their own team; Accountants and Recruiters see read-only. Every message, nudge, setting change and confirmation is written to the audit log.

### New load (`WebNewLoad`)

Build a complete load, check which truck can take it, and dispatch it to the driver in one screen.

- Sections: customer and broker (authority, bond and credit check), rate con numbers, stops with appointment windows and reference numbers, freight and equipment, rate and extra charges, driver and truck, documents, notes.
- Choosing a customer runs the checks: FMCSA authority and bond for brokers, credit left against the limit, payment history. A customer over the credit limit needs a manager approval.
- Stops fill address, hours and dock notes from Locations. Add a stop for extra pickups and deliveries. A stop with a rating C shows a warning about long waits.
- The planner runs 6 checks on every truck: equipment, timing, hours of service, home time, truck and trailer, profit. Changing equipment, weight or rate recalculates them live. Blocked trucks need a manager override with a reason, saved in the audit log.
- Dispatch and notify driver is allowed only when a truck is assigned. It offers the load to the driver (30 minutes to accept), sends the rate con to the app and can email a tracking link. It can be undone until the driver accepts.
- Rate con import (Import a rate con) fills this form and shows a confidence chip per field. Assistants only suggest the best truck (Ask first by default). Money amounts are records; the app does not move money.
- Roles: Dispatchers and the Dispatch manager can create and dispatch; Accountants see read-only. Detention terms here are the defaults for the invoice assistant.

### Import rate con (`WebImport`)

Turn a rate confirmation (PDF, photo or Word file) into a draft load, with the assistant showing how sure it is about each field.

- Attachments come from the connected inboxes (Gmail or Microsoft email), the forwarding address and uploads. Each row shows status: Reading, Ready to review, Needs review, Created, Duplicate.
- The review screen puts the original document on the left and the 15 extracted fields on the right. Every field has a confidence chip. Under 90% is flagged Needs review and highlighted on the page.
- Each flagged field has Looks right and Edit. Create the load stays disabled until every flagged field is confirmed or edited. Edits are stored next to the original value so extraction accuracy can be measured.
- Duplicate check compares broker load number, route and rate with existing loads. A duplicate needs an explicit Create anyway.
- Assistant mode: Ask first (default) builds drafts and waits. Auto creates loads only for known customers with 95% or better on money and dates, at or above the lane minimum, never duplicates. Auto never notifies the driver and never accepts a load at the broker.
- Create and assign a truck opens New load pre-filled. The load appears on the board and in the planner; the planner checks run as soon as a truck is chosen.
- Roles: Dispatchers and the Dispatch manager review and create; Auto mode can be changed only by the Owner or Dispatch manager (audit logged).

## Load hub

### Find loads (`WebLoadHub`)

One ranked list of load offers from boards, brokers, email and text for the whole fleet, showing what the fleet keeps and which truck should take each one.

- Offers come from connected sources (see Sources): load boards, broker APIs, forwarded emails and text messages. Each offer is read, matched to a lane and checked against the broker authority list daily.
- Ranking: offers with a verified broker and at least one truck that passes the planner come first, then by the profit the fleet keeps (rate minus fuel and operating cost for loaded plus empty miles). Empty miles are measured from the best truck.
- The planner runs the same 6 checks as the dispatch planner (equipment, timing, hours of service, home time, truck and trailer, profit) for the three best trucks. Changing rate or weight recalculates them live.
- Verdict: Book it (all checks pass, keep of $300 or more and $1.00 a mile or more), Counter at a rate that reaches $1.35 a mile, Try another truck, or Pass (broker not verified or no truck fits). Unverified brokers cannot be booked.
- Buttons: Book sends a booking request or reply and starts a load; Reply sends the suggested reply; Counter sends a counter; Pass sends a polite no. All are Ask first by default. Auto-reply and auto-book are controlled in Preferences and rules.
- Replies use the company signature. Everything that is sent is written to the load thread and the audit log. Offer data from boards is shown only as the provider allows (see Sources).
- Roles: Dispatchers and the Dispatch manager can reply, counter and book; Accountants and Recruiters cannot see the Load hub.

### Sources (`WebSources`)

Where load offers come from: status, connection method, what each source allows and how to connect it safely.

- Statuses: Connected, Waiting for approval, Email only (offers arrive by email or EDI, no live search), Not available (provider offers no carrier access yet). Methods: API, EDI, Email, Share.
- What it can do shows search, book and rates per source. Booking is shown only where the provider allows booking by third-party apps; otherwise the app helps reply to the broker.
- The row drawer shows the connect steps, the exact permissions asked for and the last errors. Reconnect appears when a token expires; missed offers are loaded after reconnecting.
- Rules: passwords are never stored or asked for. Only OAuth or an official API or partner key is used, stored encrypted per company. No scraping of provider websites.
- Request access sends a pre-written request (MC, DOT, insurance, use case) to the provider and tracks the answer. The status moves to Waiting for approval and the company is emailed on any change.
- Roles: Owner and Dispatch manager can connect, reconnect and disconnect. Dispatchers can see status and errors. Every change is written to the audit log.

### Preferences and rules (`WebHubRules`)

Company preferences and rules for the Load hub: what to show, which brokers to trust, when to reply and when the assistant may book.

- Search preferences: lowest rate a mile, farthest empty miles, heaviest load, equipment, states to avoid, preferred lanes. Offers that break a rule are hidden or ranked lower; the test panel shows exactly what is hidden and why.
- Home-time rules reuse the planner checks. Require verified authority hides brokers whose FMCSA authority or bond is not active; it is re-checked every morning.
- Blocked brokers are never shown, replied to or booked. A broker is added by a manager with a reason (late pay, double brokering) and can be unblocked here. Changes are audit logged.
- Auto-reply rules send short templated replies with the company signature inside quiet hours. Counters are calculated, never above the posted rate plus a cap, and never include promises about detention or accessorials.
- Auto-book defaults to Ask first. Auto within my rules books only when all 6 planner checks pass with no warnings, the broker is verified and known, rate and profit meet the limits, and the daily cap is not reached. Reefer, hazmat and team loads are never auto-booked.
- Only the Owner and Dispatch manager can change auto-reply and auto-book rules. Save writes one audit log entry listing each change.

## Chat

### Chat (`WebChat`)

The chat hub: one persistent room per driver, department and team rooms, direct messages and the Fleet broadcast, with topic routing, private topics, Needs me, translation and assistant help. Replaces the Telegram groups.

- Driver room: one persistent conversation per driver. Members are the driver, the assigned dispatcher and team leader, plus any department seat pulled in by a topic. The driver sees one plain chat; staff see a topic tag on every message.
- Topics: General, Load (auto-tagged with the driver current load), Maintenance, Pay and accounting, Safety and compliance, Recruiting and HR. Posting in a topic notifies that department seats. Staff filter by topic or Needs me. The assistant tags topics and staff can change the tag.
- Private topics: Pay and accounting is readable only by accounting, management and the assigned dispatcher if the role allows it. Everyone else sees a Private topic placeholder. The View as switch shows what each seat sees.
- Needs me: any message can be assigned to a person. It shows on their queue until Mark done. One-click actions turn a message into a work order, expense, task or dispatch note, and show a created chip on the message.
- Files and voice: photos and documents (BOL, receipt) are read by the assistant and offered as load documents. Voice notes show a transcript. English and Spanish are translated both ways; the original is kept and the translation line can be hidden.
- Delivery and timers: read receipts per message. If the driver has not opened the app within the SMS fallback minutes the message is sent by text (metered credit use, never shown as a price). Unanswered messages go amber after the topic SLA. After-hours coverage rules route to the on-call seat.
- Assistant strip (Ask first): summarize a long thread, draft a reply, auto-tag the topic, detect a breakdown and offer a work order, detect a short-pay claim. Nothing changes until a person clicks.
- Plans: driver rooms and one Dispatch room on every plan. Department rooms, team rooms, topic routing and private topics on Growth. Carrier-wide chat controls on Enterprise.

### Announcements (`WebAnnounce`)

Announcements and the morning roll call: one-way notices to the whole fleet, a team, a driver program or selected drivers, with read receipts, acknowledgement, scheduling and text fallback.

- Audience: everyone, a team, a driver program (company, lease, owner-operator, team drivers) or selected drivers. The reach count updates as you choose. Send now or schedule.
- Delivery: the app first. If a driver has not opened it after the fallback minutes it is sent by text message (metered credit use, never shown as a price). Spanish readers get a translated copy; staff see the original.
- Acknowledge: optional. The driver taps Acknowledge; the table shows delivered, read and acknowledged bars. The drawer lists who has not acknowledged with a Remind button per person and Remind everyone. Reminders go to the driver room.
- Read receipts and acknowledgement are Growth. On Core announcements are plain messages in the Fleet channel without receipts.
- Roll call: a scheduled message in every driver room with Ready, Late and Off buttons. Replies fill the Roll call screen. Escalation ladder: text after N minutes, tell the dispatcher, assistant call (Growth, Ask first, consent required).
- Roles: operations manager, dispatch leaders and the owner can send fleet notices. Team leaders can send to their own team. Every send is in the audit log.

## Customers

### Customers (`WebCustomers`)

Address book of brokers and shippers with terms, credit, balance and results, so dispatch and accounting use the same record.

- Columns: type, MC number, contact, terms, average days to pay, credit limit, open AR, loads and revenue this year, rating. Rating A to C is calculated from days to pay, short-pays and disputes.
- Tabs: Brokers, Shippers, Owes money (open AR above zero), Watch list (average days above 35 or rating B or lower).
- The side drawer shows the summary and last events. Open the full record goes to the customer page. Bulk: send statements, export.
- New customer asks for MC or DOT first, then reads authority and insurance from FMCSA and fills the form. Verified authority shows a green check.
- Open AR and days to pay come from Accounting. A customer over 90% of the credit limit blocks new loads until a manager approves.
- Roles: Dispatch and Accounting can view; only Owner, Dispatch manager and Accountant can edit terms and credit limits (audit logged).

### Locations (`WebLocations`)

Address book of shippers and receivers with hours, appointment rules, dwell time and dock notes.

- Choosing a location on a new load fills the address, hours, appointment rules, detention terms and dock notes. Dock notes are sent to the driver before arrival.
- Average dwell comes from GPS arrival and departure on the last 90 days of stops. Over 2.5 hours is amber, over 3 hours is red and the location shows in Slow docks.
- Rating A to C is calculated from dwell, detention paid and driver reviews. A low rating adds a warning in the planner and the Load hub verdict.
- Detention terms (free time and hourly rate) feed the detention timer and the invoice assistant. Customer terms override location terms.
- Add a location can read an address from a rate con or a pasted address and checks it on the map. Duplicate locations are merged by address.
- Roles: Dispatch and Dispatch manager can edit; Drivers see notes in the app but not ratings.

### Lanes and rates (`WebLanes`)

Rate memory per lane: what you charge, what the market pays and where you lose money.

- A lane is origin city to destination city on delivered loads in the last 90 days. Your rate a mile is revenue (linehaul and fuel surcharge) divided by loaded miles.
- Market rate comes from the connected rate sources (DAT, Truckstop, 123Loadboard) when available; otherwise from your own recent offers. It is labeled with its source and date.
- Vs market is green at +3% or better, amber within 3%, red below. Trend is the change in the 12 week weekly average.
- Lane insights (assistant, Ask first): best customer, best pickup day, backhaul options and the minimum rate to quote (break-even $3.01 a mile plus a margin).
- Set a minimum rate writes a lane rule used by the Load hub verdict and by rate con import (flags offers below the minimum). The rule is visible in Preferences and rules.
- Roles: Dispatch manager and Owner can set minimums; Dispatchers can view.

### Customer (`WebCustomer`)

One customer: terms, loads, lanes, invoices, people, documents and credit risk in one place.

- Tabs: Overview, Loads, Lanes and rates, Invoices and payments, Contacts, Documents, Credit and risk, Notes, Activity. Side cards show the main contact, credit use and assistant tips.
- Authority and bond are read from FMCSA when the customer is created and re-checked every morning. Lost authority turns the chip red and blocks new loads for dispatchers.
- Documents: broker-carrier agreement, our W-9, certificate of insurance (shows the expiry date), carrier packet. An expired COI is flagged on every new load for that customer.
- Credit hold is a manager-only toggle. It blocks new loads and is written to the audit log with the user and time. Credit limit warnings start at 90% used.
- Billing rules (POD required, auto-email, detention from GPS) feed the invoice assistant. Payments are recorded here and in Accounting; the app never moves money.
- Assistant suggestions are Ask first by default: reminders for due invoices and lane rate nudges.

## Accounting

### Overview (`WebAccounting`)

One screen that shows what money is coming in, what is stuck, and what the assistant wants approved today.

- KPIs: cash in this week and month, open AR, factoring advance available, profit a mile. All read from the ledger of recorded payments.
- Money pipeline: ready to invoice, sent, past due, short-paid, paid. Each box opens the filtered list.
- Assistant to-do list: detention to add, short-pays to dispute, receipts to match, invoices to send, reminders. Ask first means nothing leaves the building until Approve is clicked; Approve all is available to Accountant, Dispatch manager and Owner.
- AR aging bars use the same buckets as Collections (current, 1-30, 31-60, 61-90, 90+).
- Cash forecast comes from due dates, promised-to-pay dates, pending settlements and recurring bills; weeks with negative net are flagged by the assistant.
- Money is record only. The app never moves money; payments are recorded when the accountant or the bank feed confirms them.
- Roles: Owner and Accountant see everything; Dispatchers see invoice status and load profit but not bank or factoring details.

### Invoices (`WebInvoices`)

List of every invoice with status, balance and how it was sent.

- Statuses: Draft, Ready (papers attached), Sent, Partial, Paid, Short-paid, Overdue. Overdue is set automatically from the due date (invoice date plus customer terms).
- Created from a delivered load: the assistant builds the draft from the rate con, adds detention from the geofence timer and attaches the BOL and POD.
- Bulk actions: Send, Remind, Mark paid (records a payment, never moves money), Export. Mark paid asks for date and method.
- Method column: Email, Portal (customer payables portal upload) or Factoring (submitted to the factor on a schedule of accounts).
- Drawer shows terms, balance and the last events. Open the full record to edit lines, attach papers and send.
- Roles: Accountant and Owner create, send and record. Dispatchers have read-only access to status.

### Collections (`WebCollections`)

Who owes you, how late they are, what the assistant will do about it, and the short-pay disputes.

- AR aging by customer in five buckets (current, 1-30, 31-60, 61-90, 90+). Totals match the Accounting overview and the open balance on each customer.
- Reminder schedule has six steps, each with a toggle. Assistant mode per company: Off, Ask first (drafts into Approvals), Auto (steps 1 to 3 only). Calls and letters always ask first.
- Promised-to-pay dates pause reminders until the date; a missed date reopens the schedule and notifies the accountant. Mark kept records the payment date.
- Short-pay disputes are detected when a payment is lower than the invoice; the assistant builds an evidence pack (rate con, BOL, POD, detention proof) and drafts the message.
- Over 60 days or over the credit limit shows a warning on new loads for that customer (Dispatch manager sees it before booking).
- Roles: Accountant and Owner send reminders and resolve disputes; Dispatch manager can log promises. Everything is recorded in the audit log.

### Bills (`WebBills`)

Payables: every bill from shops, tire vendors, insurance, permits, the fuel card and lumpers, from emailed PDF to recorded payment.

- Bills arrive by email or upload; the assistant reads vendor, amount, due date and truck, and matches shop bills to work orders and fuel card bills to the fuel import.
- Status: Needs approval, Approved, Scheduled (recurring), Overdue, Paid. Approval thresholds are set in Company settings (for example, over $2,000 needs the Owner).
- Mark as paid only records the payment (date, method, reference). The app never moves money, so pay in your bank or by check first.
- Recurring bills create a draft each period (insurance, ELD, yard, truck loans, fuel card). Toggles turn a rule on or off.
- Variances over 5% against the work order estimate are flagged for the Shop manager.
- Roles: Accountant approves and records; Shop manager can add and comment on shop bills; Owner approves large bills.

### Driver pay (`WebSettlements`)

Weekly driver and owner-operator settlements: gross pay from delivered loads, deductions, advances, escrow, net.

- One statement per driver per pay period. Loads are locked to the statement when the period closes, so a load can never be paid twice.
- Gross pay uses each driver pay rule (percent of linehaul or cents a mile). Detention is paid only if the pay rule says so.
- Deductions, cash advances, fuel advances and escrow come from the driver ledger. Escrow stops at its cap.
- Status Draft, Approved, Paid. Approve is for Accountant or Owner; the person who built the statement cannot be the only approver above a set amount.
- Record payment stores date, method and reference. The app never moves money; payment happens in the bank or payroll system.
- Published statements appear in the driver app (read only). The assistant holds statements that have missing receipts or negative net.

### Pay plans (`WebPayPlans`)

Build and version the rules that turn delivered loads into driver pay: method, extras, deductions, escrow, caps, cycle and approvals.

- Seven plan types: per mile (one rate or loaded and empty, mileage source, tenure steps, team split), percent of revenue, percent after costs (fuel, fuel and maintenance, or a custom list), flat per load, hourly, per stop, day rate.
- Extras: detention share, layover, TONU, stop-off, lumper reimbursement, safety, fuel economy and referral bonuses. The editor warns when detention would be paid twice.
- Deductions are weekly ledger items (fuel and cash advances, insurance, ELD, truck and trailer rental, tickets, other with approval). Escrow has a target, weekly contribution, cap, interest, release rules and a monthly statement.
- Holdbacks: deductions stop before net pay falls under the minimum; the rest carries to the next statement or is dropped, as set. Pay can be held until the signed POD is in.
- Plans are versioned. Saving makes a new version with an effective date; approved statements keep the version they were built with. Every save is written to the audit log.
- Approval chain: Accountant, then Operations manager or Owner above a limit. The app records pay and never moves money.
- The live example runs load 4857 through the plan being edited line by line, and the compare table runs all seven plans on the same load. Roles: Accountant and Owner edit; Operations manager views.

### Expenses (`WebExpenses`)

Every non-fuel expense with its receipt: lumper, scale, tolls, parking, lodging, supplies, small repairs.

- Receipts arrive from the driver app, email or upload. The assistant reads vendor, date, total and lines, then suggests category, truck, driver and load. Ask first: it only suggests, you approve.
- Unmatched receipts tab shows expenses with no load or truck; matching links the cost to the load profit and to the truck cost per mile.
- Receipt viewer in the drawer shows the image beside what the assistant read and how sure it is. Low confidence is highlighted.
- Driver-paid expenses can be added to the next settlement as a reimbursement; lumper and scale fees can be billed back on the invoice.
- Approval limits are set in Company settings (for example, managers over $100). Approving is recorded in the audit log.
- Roles: drivers add receipts in the app; Accountant and Dispatch manager approve; Owner sees everything.

### Fuel and IFTA (`WebFuel`)

Fuel card transactions, the quarterly IFTA return and fuel price guidance in one place.

- Fuel card transactions import from the card feed or a file and are matched to truck, driver and load by card, date and location. Unmatched and off-route purchases are flagged.
- Fuel cost per load uses real gallons and price; planned cost uses $4.85 a gallon at 6.9 mpg until the card data arrives.
- IFTA tab: miles by state (from ELD or trip sheets), gallons used (miles divided by mpg) and bought, tax rate per state, net tax due or credit. Rates update each quarter.
- Filing checklist and deadlines: the app prepares the return; filing and paying happen on the state portal. Record filing stores the date and confirmation number only.
- Fuel prices tab shows prices on your lanes and suggests where to fuel on planned loads. Suggestions are sent to the driver only when you approve.
- Roles: Accountant and Owner handle IFTA and card matching; Dispatchers see fuel notes on loads.

### Factoring (`WebFactoring`)

Factoring in one place: which invoices to submit, what the factor advanced, what it holds in reserve and what it charges.

- Advance request lists invoices that are ready (papers attached, customer approved by the factor). Submit builds the schedule of accounts and sends it to the factor by email or API.
- Record the deposit when the advance lands in your bank. The app never moves money and never logs in to the bank.
- Schedule table shows advance (90%), fee and reserve for each invoice, with status: Ready to submit, Verifying, Funded, Reserve released, Not accepted, Short-paid.
- Notice of assignment per customer: sent, accepted, declined. Remit-to on invoices switches to the factor once the notice is accepted.
- Fees follow the fee model in Factor settings (flat or aged tiers). Reserve is released when the customer pays the factor; the remittance is matched to invoices.
- Available on Growth. Roles: Accountant and Owner only; Dispatchers never see factoring.

### Profit (`WebProfit`)

Where money is made or lost: profit by load, truck, driver, customer and lane.

- Profit per load = revenue (linehaul plus accessorials) minus operating cost ($2.31 a mile, including deadhead) minus fuel (miles / 6.9 mpg x $4.85). Numbers match the load hub profit shown on each load.
- Tabs: by load, by truck, by driver, by customer, by lane. Each table can be exported or saved as a report. Real fuel card data replaces the planned fuel cost when matched.
- Cost a mile breakdown: fixed, driver pay, insurance, repairs, tires, fuel. Break-even rate is shown so Dispatch knows the minimum rate.
- Profit a mile trend over 8 weeks, with best and worst loads linking to the load.
- Assistant insights suggest rate floors per lane, customer priorities and trucks with low mpg. Suggestions only; the Owner decides.
- Roles: Owner and Accountant see all; Dispatch manager sees load, lane and customer profit; Dispatchers see per-load profit only; drivers never see company profit.

### Invoice (`WebInvoice`)

One invoice: the document, its line items, the papers that go with it, how it was sent and what was paid.

- Preview is the exact PDF: company header, bill-to, load references, line items, remit-to (factor if assigned) and terms. Remit-to switches to the company when the factor toggle is off.
- Line items are editable by Accountant and Owner. Detention is created from the geofence timer (2 h free, $75 an hour, from the rate con) and needs the detention proof attached.
- Attachments: rate con, signed BOL, POD, detention proof. Attach all ticks every paper; unticked required papers show a warning before sending.
- Send options: email, customer portal upload, factor submission. Each choice writes a row in Send history with who and when. Texts and emails use plan credits.
- Payments are recorded only (date, amount, method, reference). The app never moves money. Partial and short payments update the status to Partial or Short-paid and offer a dispute.
- Dispute panel drafts the message with the proof. Status stepper: Draft, Ready, Sent, Viewed, Paid. All edits go to Activity.

### Settlement (`WebSettlement`)

One driver statement for one pay period: loads paid with the pay rule, deductions, advances, escrow and net.

- Each load row shows the pay rule used and the pay amount; changing the pay rule on the driver profile never changes an approved statement.
- Deductions, advances and escrow come from the driver ledger with source and date. Escrow shows balance before and after and the cap.
- Checks before approving: loads delivered with POD, fuel advance matches the fuel card, no open claims, escrow below cap, net not negative.
- Approve (Accountant, Owner, Dispatch manager under the approval limit) then Record payment (date, method, reference). The app never moves money.
- Print or send the statement; sending publishes it to the driver app and emails a PDF. Every step is written to Activity.
- After approval the statement is locked; reopening needs a reason and writes to the audit log.

## Fleet

### Drivers (`WebDrivers`)

One list of every driver with live hours of service, equipment, document expiry, pay rule and safety score.

- Tabs: All, Driving, On duty, Off / home, Needs attention. Needs attention means a CDL or medical card expiring within 60 days, a 70-hour cycle at 60 h or more, a safety score under 86, or a truck that is in the shop, out of service or has an inspection expiring within 30 days.
- Hours of service (drive left, window, 70-hour cycle) come from the ELD integration every 5 minutes. Red cycle bar at 60 h or more, amber at 50 h or more.
- Click a row to open the side drawer; "Open the full record" goes to the driver page. Bulk actions: Message, Request documents (sends a request in the driver app), Set home time, Export.
- A driver cannot be shown as Driving while the truck is in the shop or out of service; the roll call and planner use the same rule.
- Pay rule is read only here. It is edited on the driver page (Managers and Accountants only).
- Assistant: reminds drivers about expiring documents (Ask first sends a draft for approval, Auto sends it at 60, 30 and 7 days).

### Teams (`WebTeams`)

Choose how dispatch is organized (one group or teams) and manage the structure: Owner, Operations manager, team leaders, dispatchers and drivers.

- A switch at the top sets one dispatch group or teams. A preview shows what changes: planner filters, roll call, chat rooms, scorecards and approvals. Switching keeps all assignments.
- Org chart: Owner, then Operations manager, then team leaders, then dispatchers, then drivers. In one-group mode the leaders disappear and the four dispatchers sit under the Operations manager.
- Every driver belongs to exactly one team and one dispatcher. Moving a driver to another team picks the dispatcher with the fewest drivers; picking a dispatcher from another team moves the driver too. Loads in motion keep their dispatcher until delivered. Moves go to the audit log.
- A dispatcher can cover another team only through a coverage rule (days, hours, what they may do). Coverage never changes team membership.
- Per-team settings: who approves planner overrides (leader or Operations manager), the leader spend limit, planner and roll call scope, and the team chat room.
- Leaders see their own team scorecards; the Operations manager and Owner see all. Departments (Accounting, Maintenance, Safety and compliance, Recruiting, Management) serve every team.
- Plan: teams are a Growth feature. Core runs one dispatch group and sees an upgrade notice on this page; data is kept if the plan changes.

### Driver programs (`WebPrograms`)

Define what each kind of driver may do in the driver app and how they are paid: company driver, lease operator, owner-operator, team drivers.

- A program controls: whether the driver sees the load board, whether they can book (never, with approval, instantly within rules), and whether they see the full rate or only their own pay.
- How loads arrive: dispatch assigns, dispatch offers and the driver accepts, or the driver books from the board. Instant booking checks minimum rate a mile, longest load, equipment, hours of service, home time and customer credit.
- Truck, trailer and fuel rules (company or own truck, trailer pool, fuel card or driver pays), default pay plans, escrow on or off, and which deductions are allowed.
- Insurance, compliance and required documents (lease agreement, driver agreement, W-9, certificate of insurance, title, direct deposit) block assignment until complete; Safety tracks expiry.
- Chat topics and notifications visible to the program are set here; the phone preview shows Today, Loads, Load board (only when allowed), Pay and Chat.
- The 1099 or W-2 flag is a label for reports only. Classification is set by your accountant or lawyer; the app gives no legal advice.
- Every driver has exactly one program. Roles: Owner and Operations manager edit; dispatchers view. Changes are written to the audit log.

### Trucks (`WebTrucks`)

The truck register: identity, odometer, driver, status, PM and compliance dates in one list.

- Tabs: All, Active, In shop (in the shop or out of service), PM due soon (under 2,500 miles to the next PM), Docs expiring (within 60 days).
- Odometer, ELD id and mpg come from the ELD integration; fuel card id from the fuel card feed. Everything else is edited on the truck page.
- A truck that is In shop or Out of service cannot be assigned in the planner. The planner also blocks a load that ends after the DOT inspection expiry (Truck 8 on Oct 11).
- Bulk actions: Schedule service (creates one work order per truck), Request inspection, Export. Add a truck is for Owner and Shop manager.
- Assistant: books service when a truck crosses 2,000 miles to the next PM (Ask first shows the shop and slot, Auto books within the preferred shops).

### Trailers (`WebTrailers`)

The trailer register: type, plate, VIN, status, hooked truck, annual inspection, location and reefer hours.

- Tabs: All, Dry vans, Reefers, Needs attention (in the shop or annual inspection within 4 months).
- Location comes from the hooked truck (ELD) or from the trailer tracker when it is parked in a yard. Reefer hours come from the reefer unit telematics.
- Equipment rules: the planner only offers a reefer trailer for a reefer load and a dry van for dry freight. A trailer in the shop cannot be assigned.
- Bulk actions: Schedule service, Assign truck, Export. Add a trailer is for Owner and Shop manager.

### Live map (`WebMap`)

Live fleet map with truck pins by status, a searchable truck list, a detail card for the selected truck, geofences and shareable tracking links.

- Pins and the list use the same filters (All, Driving, On duty, Off / home, Shop) and the same search. Clicking a pin or a row selects the truck and shows its card: driver, load, ETA, speed, location and hours of service.
- Pin colors: lime is driving, amber is on duty, gray is off duty, home or on leave, red is in the shop or out of service. A late load shows an amber Late chip on the card.
- Share tracking link makes a public page for one load (or one truck) with position and ETA only. Expiry options: until delivered, 24 hours, 7 days. Links are logged in the audit log and can be revoked.
- Geofences fire an alert when a truck enters or leaves. At customer docks the detention clock starts on entry and stops on exit. Alerts are per geofence (toggle).
- Positions come from the ELD every 60 seconds; the map is a stylized view of the central and southeast US (the build uses a real map provider).
- Visible to Owner, Dispatch manager, Dispatchers, Safety and Shop manager. Accountants see it read only.

### Driver (`WebDriver`)

Everything about one driver: live hours of service, loads, documents, pay, safety record, home time and messages.

- Header clocks (drive time, duty window, 70-hour cycle, next break) come from the ELD and use the same rules as the planner (11 h driving, 14 h window, 70 h in 8 days, 34 h restart).
- Tabs: Overview, Loads, Hours of service, Documents (CDL, medical card, MVR, drug test, application), Pay and settlements, Safety, Home time, Messages.
- Home time: a month calendar with requests. Approve or Decline is for Managers only; approved home time blocks pickups in the planner and is logged. Declining tells the driver in the app with a reason.
- Put on leave: removes the driver from the planner and warns about booked loads. Change truck: lists free trucks and re-runs the planner check. Both are written to the audit log.
- Pay rule and settlements are visible to Owner, Dispatch manager and Accountant. Dispatchers see the rule but not amounts.
- Messages go through the driver app (push, then SMS if not opened in 5 minutes). Assistants may draft replies (Ask first) and never send money or pay changes.

### Trailer (`WebTrailer`)

One trailer: details, maintenance, documents, reefer unit, loads and where it is parked.

- Reefer unit tab appears for reefer trailers with unit hours, set point, return air, fuel and alarms from the unit telematics; for a dry van it shows an empty state.
- Location and yard: live position from the hooked truck or the trailer tracker, a yard map with spots, and geofence events. Mark dropped at yard records the drop and unhooks it from the truck.
- Maintenance and documents work like the truck page. Annual inspection reminders go out at 60, 30 and 7 days.
- The planner uses the equipment type (dry van or reefer) and the in-shop status of the trailer when it checks a load.

### Truck (`WebTruck`)

One truck: status, PM countdown, maintenance, documents, fuel and mpg, cost a mile, loads, telematics, parts and tires.

- PM countdown compares the odometer (from the ELD) with the next PM due miles and days. It turns amber under 2,500 miles and red when overdue.
- Schedule service picks a shop and slot (preferred shops first), creates a work order and tells dispatch; the planner stops offering the truck for loads that end after the slot.
- Take out of service blocks assignment immediately and flags booked loads. Return to service needs the closed work order or a manager note.
- Costs: operating cost is $2.31 a mile and excludes fuel; fuel is gallons from the fuel card at the matched price. Repairs and tires come from closed work orders.
- Telematics shows location, speed and fault codes from the ELD every 15 minutes. A major active fault drafts a work order.
- Documents: registration, insurance, IFTA decal, annual inspection, Form 2290. Expiry reminders go out at 60, 30 and 7 days.

## Maintenance

### Overview (`WebMaint`)

Maintenance home: how healthy the fleet is, what is due, what is in the shop and what the assistant wants to book.

- Fleet health is a score from open DVIR defects, active fault codes, tread depth, PM status and inspection dates. Road-ready means not in the shop, not out of service and no blocking defect.
- PM due this month projects each truck's next PM from the odometer and the driver's average miles a day; the 7-day calendar shows booked work orders and links to them.
- Assistant suggestions book shop slots. Ask first shows the shop and slot and waits for a tap; Auto books within preferred shops when the planner finds no load conflict and can be undone for 24 hours. Credits are shown only as a balance in the top bar.
- Downtime clock: starts when a truck is set to In shop or Out of service, stops on return. Cost uses the average revenue a truck makes in a day ($520).
- Visible to Owner, Dispatch manager, Shop manager and Safety manager. Dispatchers see status and dates but not costs.

### Work orders (`WebWorkOrders`)

Every repair, PM, tire and inspection job on a truck or trailer, with shop, cost, due date and approval status.

- Types: PM, Repair, Tires, DOT. Sources: driver report, DVIR defect, PM schedule, assistant or manual. A work order always has one asset (truck or trailer).
- Statuses: Open, Waiting approval, Approved, Scheduled, Parts ordered, In shop, Done. Estimates over $1,500 need a manager (Owner or Dispatch manager) to approve; the Shop manager can approve up to $1,500.
- Priority Urgent means the asset cannot be dispatched (out of service or inspection expiring). Urgent items sort to the top of the shop manager's list.
- Closing needs a resolution note and the final invoice attached; on close the odometer-based PM dates reset and the cost lands on the truck cost per mile.
- Bulk actions: Approve (managers only), Change shop, Export.

### Schedules (`WebPM`)

Preventive-maintenance schedules: which service each truck and reefer needs, when it is due, and whether the work order is created automatically.

- A schedule is a template (PM-A, PM-B, tire rotation, annual DOT inspection, reefer unit service) with an interval in miles, hours or days, whichever comes first, attached to a truck or trailer.
- Odometer and reefer hours come from the ELD and reefer telematics every 15 minutes. Next due date is projected from the driver's average miles a day.
- Status: On track, Due soon (under 2,500 mi or 7 days), Due tomorrow, Overdue, Booked (a work order is scheduled).
- Auto-create work orders per template, and Assistant mode: Ask first drafts the work order for approval; Auto books it in a preferred shop when the planner finds no conflict and tells dispatch.
- Closing a PM work order resets the schedule (last done, next due). Changing an interval is for Owner and Shop manager.

### Inspections (`WebDVIR`)

Driver vehicle inspection reports: what drivers found, who reviewed it, what was fixed, and how a defect becomes a work order.

- Drivers submit pre-trip and post-trip reports in the driver app with photos. A clean report is signed off automatically; any defect puts the report in Needs review.
- Per defect the reviewer picks Repair now, Fix at the yard, Monitor or Not urgent. Repair now and Fix at the yard create a work order (source DVIR) with the photos attached, tell dispatch and notify the driver. Defects that are out-of-service items set the truck to Out of service.
- Mark reviewed is blocked until every defect has an action. A reviewer can ask for a redo; the second redo locks the driver app until it is done.
- Reports and defect repairs are kept for 12 months (49 CFR 396.11). The sign-off shows who reviewed and when. Reviewers: Shop manager and Safety manager.
- Assistant: groups related defects, flags repeats (same defect 3 times in 30 days) and drafts the work orders (Ask first creates them after a tap).

### Shops (`WebShops`)

The list of shops, tire dealers, reefer and roadside vendors you use, with rates, turnaround, rating and open work orders.

- Shops are added automatically the first time a work order or receipt names them (no double entry); Add a shop is for ones you want ready before the first job.
- Preferred shops are asked first for quotes and used first by the assistant when it books PM slots; Owner and Shop manager can change the flag.
- Rating is from your own work orders (cost against quote, time against promise, driver feedback) not a public score.
- The drawer shows phone, hours, specialties, rates and the last jobs; Open the full record goes to the work orders for that shop.
- Find shops near a truck uses the ELD location and a radius of 10, 25 or 50 miles and marks preferred shops (breakdown flow).

### WorkOrder (`WebWorkOrder`)

One work order from open to closed: tasks, parts and labor, vendor quotes, approvals, photos, invoices, downtime and activity.

- Stepper: Opened, Approved, Parts ordered, In shop, Ready, Closed. The action button moves it forward; Close needs the final invoice attached and a resolution note.
- Approvals: estimates over $1,500 need a manager (Owner or Dispatch manager). A supplement found by the shop is a new approval request; the shop continues only after approval. Approve and Decline are managers only and are written to the audit log.
- Quotes are collected from up to 3 shops (assistant calls or emails, Ask first before spending); the chosen shop and the reason are saved.
- Downtime clock starts when the truck is In shop or Out of service and stops at return to service; lost revenue uses $520 a truck day.
- Closing resets PM dates when the work order is a PM, adds the cost to the truck cost per mile and notifies dispatch that the truck is available.
- Everything the shop or driver sends (photos, invoices, messages) lands in the activity log with who and when.

## Safety

### Readiness (`WebSafety`)

One screen that tells the safety manager how ready the company is for a DOT audit and what to fix first.

- Audit readiness score is computed from driver file completeness, document status, drug and alcohol records, hours of service and inspections. It is a sample score in this mockup.
- DOT audit checklist has 12 items with live progress. Items the system cannot verify are marked reviewed by a person (logged in the audit log with name and time).
- Assistant to-dos list renewals and driver requests (inspection booking, medical card upload, previous employer requests, PSP consent). Ask first mode waits for approval, Auto mode sends and reports in Activity.
- CSA scores are shown as percentiles with the intervention threshold. They are sample data until the FMCSA SMS feed is connected under Integrations.
- Tiles link to Documents, Driver files, Drug and alcohol, Incidents and HOS and ELD. Roles: Safety manager and Owner can edit; Dispatch manager can view.
- Plan: Core and Growth both include this page. Fed by documents, driver files, the ELD integration, incidents and the drug test records.

### Documents (`WebDocs`)

Single register of every compliance document with expiry tracking, for the company, drivers, trucks and trailers.

- Table columns: type, owner, number, issued, expires, days left, status (Valid, Expiring at 30 days or less, Expired), file. Tabs: All, Expiring soon, Company, Drivers, Trucks, Trailers.
- Upload takes a photo or PDF. The assistant reads type, number and dates, the user confirms, saving replaces the file and keeps the old one in history.
- Reminders go to the office and driver at 60, 30, 14 and 7 days. A renewal to-do is created at 60 days and appears on Safety readiness.
- Expired driver documents (CDL, medical card) block dispatching that driver. A manager can override with a reason, written to the audit log.
- Drivers can upload from the driver app and the office is told to review. Roles: Safety manager and Owner edit, dispatchers view.
- Sources: driver and truck profiles (CDL, medical, registration, inspection), company settings, and the shop module for inspections.

### Driver files (`WebDQ`)

Per driver compliance matrix showing which qualification file items are on file, due or missing.

- Ten requirements per driver: application, MVR, medical card, CDL, road test, drug test, previous employer checks, PSP, Clearinghouse query, annual review. Each cell is OK, Due or Miss.
- Due means the item expires or comes up for review within 60 days. Miss means not on file or overdue. A driver with any Miss cannot be dispatched without a manager override.
- Clicking a row opens a drawer listing exactly what is missing and the next step. Open the full record goes to the driver profile Documents tab.
- Bulk actions request missing items from drivers by text or app, order MVRs, and export the audit set (a ZIP of the files per driver).
- Assistant watches expiry dates and drafts the request. Ask first mode waits for approval.
- Hiring from Recruiting copies the application, checks and test results into the new driver file automatically.

### Drug and alcohol (`WebDrug`)

Manage the DOT drug and alcohol program: random pool, test records, Clearinghouse queries and MRO notes.

- Tests table covers pre-employment, random, post-accident and reasonable suspicion tests with lab, date, result and MRO status. Tabs filter by type, pending and needs action.
- Random pool contains every driver who can drive. Drivers on leave leave the pool. Draws run automatically each quarter, are time stamped and cannot be edited. Selected drivers get a text and the dispatcher is told to release them.
- Clearinghouse card tracks the pre-employment full query and the yearly limited query for each driver. A refusal or positive moves the driver to Prohibited and blocks dispatch until the return-to-duty steps are done.
- Post-accident tests are created from an Incident record with 8 and 32 hour timers.
- Visible to Safety manager and Owner only. Dispatchers see only pass, pending or action needed on the driver profile. Every open and export is audit logged.
- Integrations: lab and C/TPA result import, FMCSA Clearinghouse (manual entry of query results in v1).

### Incidents (`WebIncidents`)

Log and review every accident, incident, citation and claim, with preventability and cost.

- Table columns: case, date, driver, truck, type and place, preventable, cost, claim status. Tabs: All, Accidents, Incidents, Citations, Claims, Open, Preventable.
- Drawer shows driver, truck, preventable, injuries, damage, police report, claim number, cost, photos and the timeline. Full record has the photo gallery and documents.
- Add incident form can be filled by the office or the driver app. Choosing Accident starts the post-accident test timers (alcohol 8 hours, drug 32 hours) on Drug and alcohol and notifies the Safety manager.
- Preventable is decided by the Safety manager after review and recorded with a reason. Accident register for the DOT audit is built from this table (3 years).
- Claims status tracks the insurer claim number, adjuster next step and payment. Claim payments and fines can be recorded to Accounting as expenses (the app only records money).
- Assistant can draft the insurer first notice of loss and the driver coaching note, always ask first.

### HOS and ELD (`WebHOS`)

Hours of service compliance and ELD health in one place for the safety manager and dispatch.

- Violations table: driver, date, rule (11-hour, 14-hour, 30-minute break, 70-hour cycle, form and manner), how much over, status (Open, Coached, Reviewed, Disputed). Tabs filter by status and repeat drivers.
- Unassigned driving events come from the ELD. The office assigns to a driver (the assistant suggests one from truck assignment and duty status) or dismisses as non-driving. Original records stay and every change is audit logged.
- Log edit requests come from drivers in the app. Only the Safety manager approves, driving time needs a reason, and the driver confirms the final edit.
- ELD health shows device status per truck (reporting, weak GPS, firmware, offline). Fed by the ELD integration (Samsara in this mockup).
- Live driver clocks show drive time left and 70-hour cycle used, the same values the Planner uses for dispatch rules.
- Assistant drafts coaching texts for repeat violations and attaches dispatch evidence to disputes. Ask first by default.

## Recruiting

### Pipeline (`WebPipeline`)

Kanban view of every driver candidate by hiring stage, with filters and assistant suggestions.

- Stages: New, Contacted, Interview, Road test, Offer, Hired / Orientation. Cards show name, CDL class, years, source, next step and days in stage (amber at 5 days, red at 7).
- Cards are draggable on desktop to change stage. Moving to Hired creates the onboarding checklist and a driver draft; moving to Rejected asks for a reason and offers a polite text.
- Filters: source, owner, experience, endorsements, waiting 5 days or more. Source chips update counts live. Click a card to open the candidate page.
- Assistant suggestions cover first replies, interview rescheduling, and re-ordering checks. Ask first by default. In Auto the assistant may send first replies and reminders only, never offers or rejections.
- Plan: Recruiting is included on Growth. Roles: Recruiter, Safety manager and Owner can edit; dispatchers cannot see it.
- Fed by the public application form, job board imports, referral links and manual entry.

### Candidates (`WebCandidates`)

Searchable list of all driver candidates with bulk text and stage changes.

- Table columns: candidate and phone, CDL class and endorsements, experience, home city, source, stage, applied date, last contact, score, recruiter. Tabs by stage.
- Score (0 to 100) blends years of experience, equipment match, MVR, qualifying answers and response speed. It ranks, it never auto-rejects without the recruiter confirming.
- Drawer shows key facts and a timeline. Open the full record goes to the candidate page.
- Bulk actions: send a text to selected candidates (opt-out and quiet hours enforced, message check by the assistant), move stage, assign recruiter, reject with reason.
- Texts use the company number. A STOP reply marks the candidate Do not text across all stages.
- Export includes only fields the user role may see. Roles: Recruiter, Safety manager, Owner.

### Jobs and forms (`WebJobs`)

Create driver job posts, publish them to boards, and manage the public application form, link, QR code and website embed.

- Posts table: title, route type, pay, status (Live, Paused, Draft, Closed), boards posted to, applicants, cost. Status tabs filter. The assistant writes the post text and refreshes it weekly.
- Form builder: name, phone, CDL class and years are always asked. Other fields toggle on or off. Qualifying questions can auto-decline (polite text, moved to Rejected, recruiter can restore) or flag for review.
- Public link, QR code and embed snippet (iframe) share one form. Each source adds a tracking tag (for example src=jobfair) so Sources can count applicants and hires.
- Boards connected in Integrations (Indeed, Facebook, TruckersReport in this mockup). Cost per post is recorded by hand or imported.
- Applications land in Candidates at the New stage and trigger the assistant first reply within 2 minutes (inside quiet hours rules).
- Plan: Recruiting is included on Growth. Roles: Recruiter, Owner.

### Sources (`WebRecSources`)

Shows which recruiting sources produce hires and what each hire costs, so the owner can move money to what works.

- Table: source, spend, applicants, qualified, hires, cost per hire, cost per applicant, quality score, call (Best value, Keep, Review, Pause). Last 90 days by default, date range filter.
- Source comes from the tracking tag on the apply link, QR, board or referral link. Candidates with no tag show as Unknown and the recruiter can set the source by hand.
- Spend is entered by hand (the app only records money) or imported from a board. Referral bonuses are added automatically when a referred driver passes 90 days.
- Quality is the average candidate score plus 90-day retention of hires from that source.
- Charts: cost per hire, applicants per week and the hiring funnel. The assistant suggests moving budget and always asks first.
- Roles: Recruiter and Owner. Cost columns are hidden from the Recruiter role if the Owner turns on Hide costs.

### Onboarding (`WebOnboard`)

Track every new hire through the five onboarding task sets until they are ready for their first load.

- Table: new hire, start date, status of Paperwork, Drug test, Orientation, ELD training and Truck assignment, overall progress bar, e-sign status. Tabs: In progress, Stuck, Complete.
- Checklist template is editable (tasks, owner, order). Templates per hire type (Company driver, Owner-operator, Local). Starting a checklist happens automatically when a candidate is moved to Hired.
- E-sign sends the offer letter, FCRA consent, PSP and Clearinghouse consent, W-4 and I-9, direct deposit and handbook acknowledgment. Signed copies are filed in Driver files.
- When all tasks are done the driver profile is created and the driver app login is sent. Truck assignment is confirmed in the Planner.
- Assistant reminds new hires by text every 2 days (max 3), warns about stuck tasks, and suggests second-seat plans. Ask first by default.
- Roles: Recruiter edits paperwork, Safety manager edits drug test and orientation, Dispatch manager edits ELD training and truck.

### Candidate (`WebCandidate`)

Everything about one candidate: application, documents, conversation, checks, notes and onboarding tasks, with the actions a recruiter takes.

- Header shows name, key facts and a stage stepper (New to Hired). Actions: Text, Call, Schedule interview, Send offer, Reject with reason. Each opens a panel and logs to the timeline.
- Texts and calls shows the SMS thread and the voice call log in one place. The assistant drafts replies. The recruiter approves in Ask first mode. Quiet hours (8 am to 8 pm candidate time) and STOP opt-outs are enforced.
- Checks tab: MVR, PSP, background, drug test, Clearinghouse and previous employers, each with status and next step. All need the signed FCRA consent first.
- Offer rule: needs a clean MVR, PSP report and passed road test. Owner or Dispatch manager can send early with a reason that is audit logged.
- Reject asks for a reason (saved for recruiting reports, never sent to the candidate) and offers a polite text. Adverse action letters are generated when a check causes the rejection.
- Moving to Hired creates the onboarding checklist and a draft driver profile, copies the checks and documents into the driver qualification file.

## Inbox

### Messages (`WebInbox`)

Shared inbox for email, texts and calls with load links, assignment, internal notes and assistant-drafted replies.

- Three panes: folders (All, Mine, Brokers, Drivers, Customers, Candidates, Unassigned, Starred), thread list with channel icon, linked load and assignee, and the thread.
- The Inbox assistant sorts each thread, writes a one-line summary, links the load, and drafts a reply with the company signature. Ask first: a person always presses Send. Undo send works for 10 seconds.
- Assign to any teammate, star, snooze until Monday 8:00 am, close (a new reply reopens it). Internal notes are visible to staff only, never to the sender.
- Link to load: the assistant proposes loads by sender, route and numbers in the text. Linking puts the thread in the load timeline. Candidate threads link to the candidate record.
- Permissions: dispatch, accounting and safety see threads in their mailboxes; owner and dispatch manager see all. Mailboxes and the text number are connected in Settings, Integrations.
- Texts and emails are credit metered; the balance is in the top bar and no per-message price is shown.

### Calls (`WebCalls`)

Call log with recordings, transcripts, voicemail and the voice assistant (Growth plan).

- Table lists inbound, outbound, missed and voicemail with a call type (inbound broker, driver hotline, check call, broker status, shop call, recruiting), the linked load, duration, outcome, recording, a one-line summary and who handled it (a person or the voice assistant).
- Row drawer shows the transcript lines and the details. Recordings are kept 90 days; transcripts stay with the load. Callers hear a recording notice where required by state law.
- Handled shows Assistant or Person. A link card opens Voice settings, where each use case has its own switch. Voice assistant is a Growth plan feature. Master switch, after-hours, busy-line and check-call options are on this page; greeting, voice and languages are on Assistants, Voice.
- Hand-off rules send the live call to a person (rate talk, accidents, angry caller, money). Voicemails are transcribed and summarized and appear in the Messages inbox as threads.
- Usage is counted against included credits; only the balance shows, never a per-call price. Money is never discussed or moved by the assistant.

### Templates (`WebTemplates`)

Message and document templates plus the signature manager. Assistants draft from these so every reply sounds like the company.

- Table of email, SMS and document templates with variables count, use in the last 30 days, owner and status. Select a row to edit it in the card on the right.
- Variables such as {driver}, {load}, {pickup}, {delivery}, {broker}, {amount} are filled from the linked load, customer or candidate. Tap a chip to insert one; Show sample data previews the resolved text.
- SMS shows character and segment count. Texts and emails are credit metered; the balance is in the top bar.
- Signature manager: several signatures per role, a default, preview, automatic add, MC and DOT numbers and the privacy line required on candidate emails.
- Editing requires the Edit templates permission (owner, dispatch manager, accountant). Every save creates a version in the audit log; Archive keeps old messages intact.
- Rate con, invoice cover and detention form documents use the same variables and feed Load, Invoice and Accounting PDFs.

## Reports

### Library (`WebReports`)

Report library: ready-made reports by category with run, export, schedule and favorites.

- Categories Operations, Money, Fleet, Safety and Recruiting. Each report lists owner, last run and schedule. Select a row to see a live preview with the first rows and a chart.
- Run now refreshes the data; Export CSV and Export PDF download with the company header. Bank and factoring details are masked in exports and shared links.
- Favorites are per user and appear on the right. Schedule opens Scheduled reports with the report preselected; Open in builder copies the report into the builder.
- Visibility follows role: Money reports are for owner, dispatch manager and accountant; Safety for safety manager and managers; Recruiting for recruiter and managers.
- Ask my company can create a report from a question and save it here. The builder (Growth plan) makes new reports; Core plans use the library only.

### Report builder (`WebBuilder`)

Report builder (Growth plan): choose a data source, columns, filters, grouping and chart, then save, schedule or share.

- Growth plan feature. On Core the page shows the plan comparison with a preview and an upgrade prompt; the library stays available.
- Steps: data source (Loads, Invoices, Drivers, plus Trucks, Fuel, Candidates in the full build), columns, filters (date range, status and more), group by, sort, and chart type. The preview and chart update live.
- Grouping adds up number columns (or averages scores and hours) per group. Exports include every matching row, not just the preview.
- Describe-it box: the Report builder assistant sets up the sources, columns and grouping from plain English; the user can change anything after.
- Save puts the report in the library under a category. Schedule sends a PDF or CSV on a frequency to chosen teammates (outside emails need an owner OK). Share creates a read-only company link with bank and factoring details always masked.
- Permissions: only fields the user can already see are available as columns; Money sources need owner, dispatch manager or accountant.

### Scheduled (`WebScheduled`)

Scheduled reports and accounting exports: what runs when, who gets it, and controls to run, pause or edit.

- Table of schedules with how often, recipients, file format (PDF or CSV), next run and status. Reports and exports (for accounting software) are listed together and can be filtered with the tabs.
- Select a row for details and recent runs. Run now sends once (a paused schedule stays paused). Pause and Resume work immediately. Edit changes how often and the file format.
- Failed runs (bounced email, missing permission, source removed) show a banner and a red status; the owner of the schedule and the dispatch manager are notified.
- Recipients can be teammates or an inbox. Emailing outside the company needs the owner OK; bank and factoring fields are masked in every file.
- Schedules are created from Reports, Library or the builder (Growth plan). Files are kept 90 days. Every create, pause and edit is in the audit log.

## Assistants

### Control center (`WebBots`)

Control center for every assistant: choose how much each one may do on its own, see how it is doing, and stop everything with one switch.

- 14 assistants in four departments (Dispatch, Accounting, Fleet and safety, Recruiting). Each row has a three-way switch: Off, Ask me first, Automatic. The switch saves at once and is audit logged.
- Ask me first: the assistant prepares the action and it waits in Approvals. Automatic: it acts, shows in Activity and can be undone. Low-confidence items always go to Approvals even in Automatic.
- Kill switch pauses all assistants in under 5 seconds, holds unsent texts and emails, keeps workflows running. Owner and managers only. Resume needs a reason.
- Credits low: workflows and drivers are never blocked; Automatic drops to Ask me first, Ask me first drops to Off. Top-up credits are used after monthly credits.
- Safety-critical steps (hours of service, inspections, drug and alcohol, dispatch blocks) are workflow only. HOS watcher and PM scheduler can only alert or draft.
- Columns: last 7 days actions, approvals waiting (live from the mode), right-first-time and undo rate. A row opens the assistant page.
- Voice screener needs the Growth plan voice calling add-on and a phone number set up on the Voice page.

### Approvals (`WebApprovals`)

One queue for everything an assistant wants to do and has been told to ask about first.

- Table columns: assistant, what it wants to do and why, load or customer, age, risk, status. Click a row to open the evidence drawer (what it read, numbers, the draft text).
- Approve runs the action now and logs who approved. Edit opens the drawer with the draft in an editable box, then Approve. Decline discards it and tells the assistant.
- Bulk approve works on selected rows that are still waiting. "Approve all low risk" never touches Medium or High items.
- Risk: Low changes only drafts. Medium touches money, drivers or outside messages. High is a bulk send or something hard to undo; High is never approved by a bulk action.
- Who can approve: Owner and department managers for their own department (Dispatch manager approves dispatch items, Accountant approves accounting items).
- Items older than 24 hours are flagged and the bell shows the number waiting. Low-confidence items from Automatic assistants land here too.

### Activity (`WebBotActivity`)

Audit trail of every action an assistant took, with who approved it and a way to undo it.

- Table: time, assistant, action, target, mode (Automatic or Approved by you), result, undo. Filters: assistant, date range, customer, risk. Tabs: All, Automatic, Approved by you, Undone.
- Undo is offered when the change can be reversed (invoice lines, load builds, expense records, assignments). Texts and emails already sent show "Cannot undo".
- Undo restores the earlier value, writes its own line in the audit log and tells the assistant so it learns. Bulk undo works on selected rows that can still be undone.
- The drawer shows why the assistant acted and who approved it. It links to the assistant page and the record it touched.
- Visible to Owner and managers. Export is CSV. Entries are kept 2 years and cannot be edited or deleted.

### Usage and credits (`WebUsage`)

Shows credits left, who used them and how to add more, without ever showing a price per action.

- Balance: included monthly credits (Growth: 4,000, reset Nov 1, unused ones expire) and top-up credits (never expire). Included credits are used first.
- Usage by assistant lists credits and action counts only. The product never shows a per-action credit price. Texts and emails use credits but are not itemized by price.
- Top-up packs: $25 for 1,000, $110 for 5,000, $400 for 20,000. Buying adds credits at once and a receipt appears in Plan and billing. Owner and Accountant can buy.
- Auto top-up: when balance falls below a number, add a chosen pack. Monthly cap stops assistants from using more than a set number of credits.
- If credits run out: workflows and driver apps keep running; assistants drop to Ask me first (or Off, by choice). Alerts at 20% and 0%.
- Daily send limits for texts and emails protect deliverability. System emails (sign-in, security, billing receipts) are never counted.
- Daily chart shows credits per day for the current month; today is partial.

### Voice (`WebVoice`)

Set up the phone assistant that makes and answers calls for the office (Growth plan and above).

- Use cases, each with its own switch: answers the company number (brokers, shippers, receivers), driver hotline (caller ID, opens a work order or chat thread, alerts the department), check calls to drivers (off by default, only after app and text get no reply or when late to a pickup), broker status calls, shop calls, recruiting screening (with Recruiting) and detention and appointment calls. Morning roll call is a chat message, not a call.
- Growth: one company number, standard flows, up to 5 concurrent calls. Enterprise: several numbers (one per carrier or team), custom flows and scripts, higher volume, recording retention and API and webhooks.
- Compliance: the assistant says it is an AI, plays a recording notice, only contacts people who consented, keeps quiet hours, honors do-not-call and always offers a human. Not legal advice.
- Growth plan feature. Core and Solo keep AI texting only and see an upgrade card instead of this page.
- Setup: a local phone number, greeting, what the assistant may do (check calls, driver status, broker questions, applicant screening). Each is a switch.
- Call rules: calling hours in the person's local time, tries per person, ring time, transfer to a named person, voicemail. Anything about money, claims, an accident or "agent" transfers to a person.
- Consent: a recording notice plays at the start of every call. Recordings and transcripts are kept 90 days. People who say "stop" are added to the do-not-call list.
- Script editor per call type. Words in braces are filled from the load or driver. Saved scripts apply to the next call; versions are kept.
- Test call rings the owner's own phone. Call stats and the log show outcome, length, who it transferred to, and link to the load.
- Voice uses credits from the monthly balance. If credits run out voice drops to transfer-only.

### Bot (`WebBot`)

One assistant explained: what it does, how it decides, the rules you control, what it can and cannot touch, its mode, what it did, and how to test it before trusting it.

- Example page: Detention biller. Every assistant page uses the same layout: purpose, mode switch, steps, editable rules, inputs, can and cannot, recent actions, test, versions.
- Rules are numbers and toggles (free time, rate, wait past free time, cap, proof). Saving creates a new version. Restore loads an old version for review; the user saves to make it live.
- Recent actions each have Why? (what it looked at) and Undo. Undo is allowed until the invoice is sent; after that the action is locked and shows a link to correct it by hand.
- Test it runs the current rules and mode on a past stop. It never saves or sends anything and shows the exact decision: bill, ask first, or nothing.
- Over the cap or missing proof always goes to Approvals, even in Automatic. It can never change rates, send invoices or move money.
- Edit rules: Dispatch manager and Owner. Accountant can view. Mode changes are audit logged with the person and time.

## Settings

### Company (`WebCompany`)

The company profile and the defaults every other page uses.

- Profile: name, legal name, MC, DOT, phone, email, logo, addresses (office, mailing, yard, remit-to). Yard address is the start point for empty miles.
- Region: time zone, currency, miles or kilometers, fiscal year start (drives reports and IFTA quarters).
- Cost settings: operating cost a mile $2.31 (excludes fuel), fuel $4.85 a gallon at 6.9 mpg. These feed load profit, the planner and quotes. Real fuel card data replaces the assumption when available.
- Detention defaults (2 hours free, $75 an hour) feed the Detention biller and invoices; a rate con can override them per load.
- Invoice defaults: number prefix and next number, terms, late fee text, POD attachment rule, email signature.
- Edit: Owner. Accountant can edit invoice defaults only. Any change shows "Unsaved changes" and writes an audit log entry on save.

### Carriers (`WebCarriers`)

Run several carrier entities (MC/DOT numbers) in one account. Enterprise feature.

- Plan gate: Enterprise only. Core and Growth have one carrier; the profile menu shows a locked "Several carriers" row.
- Carrier = legal entity with MC, DOT, SCAC, address, factoring company, insurance, IFTA/2290/UCR accounts, invoice prefix and remit-to, mailbox and driver pay entity.
- Add a carrier by MC or DOT: FMCSA lookup fills the name, address and authority status; the user confirms and sets defaults.
- Each truck belongs to one carrier; moving it keeps history. Drivers, customers, locations are shared; users get a carrier scope in their role.
- Carrier switcher in the profile menu changes the working context; Combined view adds up reports and Ask my company across carriers.
- Invoices, factoring, compliance and tax filings never mix across carriers. Audit log records every move.

### Users (`WebUsers`)

Manage office users and decide what each role can view, edit and approve.

- Table of users: name, role, email, last active, status (Active or Invited), two-step sign-in. Tabs: All, Active, Invited, No two-step. Drawer shows role, departments, leader flag and recent sign-ins.
- Roles: Owner, Dispatch manager, Dispatcher, Accountant, Shop manager, Safety manager, Recruiter. Solo and Core plans only have owner, dispatcher and driver; department roles are Growth and above.
- Permission matrix: departments (Dispatch, Accounting, Fleet, Safety, Recruiting, Reports, Settings) by role with View, Edit and Approve. Owner is fixed. Saving writes an audit log entry.
- Invite flow: email, role, optional leader flag. Invite link expires in 7 days; the new user sets a password and two-step sign-in on first visit. Resend or cancel from the row.
- Approve means: approve assistant actions, manager overrides and money records for that department. Only Owner and Accountant can approve pay and invoices.
- Bulk actions: change role, send a two-step reminder, deactivate. Deactivated users keep history but cannot sign in.

### Roles (`WebRoles`)

Define what each role can do in every department. Roles are enforced on screens, assistant actions, exports and Ask my company answers.

- Core has three roles (Owner, Dispatcher, Driver). Department roles, leader flag, teams and custom roles start on Growth. Approval chains are Enterprise.
- Permission matrix: rows are features grouped by department, columns are View, Create, Edit, Delete, Approve, Export. Only valid combinations are shown. Owner is locked.
- Sensitive switches add access on top of the matrix: driver pay, company profit, personal data (DOB, SSN, medical), override planner rules, delete, export all, money questions in Ask my company, spend approval, API keys.
- Data scope per role: all carriers, own team, own trucks. Row-level security enforces it in the database; the UI only mirrors it.
- Saving writes before/after to the audit log. Roles in use cannot be deleted. At least one Owner must exist.
- View the app as a role: preview of hidden screens and disabled buttons, read-only, nothing saved.
- Leaders (flag per role) see team scorecards, approve within the team up to a limit, and receive assistant escalations.

### Chat rules (`WebChatRules`)

Settings for Chat: topic routing and privacy, coverage and quiet hours, translation, text fallback, who can start rooms, files and retention, and the move from Telegram.

- Topics and routing table: for each topic tick which seats are notified (dispatcher, team leader, ops manager, accounting, maintenance, safety, recruiting, management), whether it is private, and the minutes before an unanswered message turns amber.
- Private topics: Pay and accounting is private by default. Accounting and management always read it; the assigned dispatcher and team leader only if switched on. Others see a Private topic placeholder. Manager reads are logged.
- Coverage: business hours, weekend and night on-call seats per team, an auto-reply to the driver after hours, and breakdown words that reach on-call at any hour. Quiet hours stop staff alerts only.
- Translation: English and Spanish both ways, original kept, voice-note transcripts. Text fallback: off or after N minutes unread, a daily cap per driver, per-topic switches. It uses message credits; no price is shown anywhere.
- Rooms and privacy: who can start a driver room, department and team rooms (teams optional; with one dispatch group there is one Dispatch room), staff direct messages, driver visibility of staff names. Carrier-wide controls and legal hold are Enterprise.
- Telegram import wizard: upload the export, map each Telegram group to a driver or staff room, preview the counts, run the go-live checklist, one-time import only (no Telegram bridge), invite drivers by link.
- Plans: driver rooms and the Dispatch room on every plan; department rooms, topic routing, private topics, announcements with read receipts on Growth; carrier-wide controls on Enterprise.
- Only the owner and operations manager can edit. Every change is in the audit log.

### Integrations (`WebIntegrations`)

One place to connect, test and monitor every outside system.

- Table: integration, state (Connected or Not connected), mode (Off, Test, Live), last sync. Tabs by category (ELD, fuel, accounting, email, calendar, phone, load boards, factoring, e-sign, developer).
- Connect starts the sign-in with that provider (OAuth or key). New connections start in Test: reads real data, writes nothing, shows what would change. Live turns on writing.
- Drawer: what the connection is allowed to read and write, health (token expiry, last error, delivery rate), and Disconnect. Disconnect keeps old data and stops syncing.
- Load boards (DAT, Truckstop and others) are set up in Load hub Sources; this page links there. Webhooks and API keys are managed in Security.
- Failures raise a bell alert and email to the Owner; the row shows what to do. Only the Owner and the Accountant (accounting tools) can connect or disconnect.
- The app records money only: QuickBooks and factoring sync records, never move money.

### Notifications (`WebNotify`)

Per-person choice of which events notify them, by app, email or text, plus quiet hours, escalation and a daily digest.

- Matrix of events by channel (app, email, text). Every switch saves at once. Events: late loads, missed check calls, detention, invoices paid, short pays, expiring documents, hours limits, inspections, approvals, credits, integration problems, new sign-ins.
- Quiet hours hold texts and emails; the app bell still fills. Urgent safety alerts and escalated items go through anyway.
- Escalation: if an urgent alert is not acknowledged within the wait time, the next person in the chain is told (text, then call for the owner).
- Daily digest: one email at a chosen time with at-risk loads, money and expiring documents.
- Texts and emails use credits and follow daily send limits (Usage and credits). System emails are never counted.
- Owner can set role defaults; each person can override their own switches.

### Plan and billing (`WebBilling`)

The subscription page: current plan, truck count, plans compared, payment method and invoices from us.

- Growth plan: $249 a month, up to 25 trucks, 4,000 credits a month, voice calling, department roles, report builder, shared inbox, Recruiting included (no add-on needed).
- Plan comparison shows Core ($97, up to 3 trucks) and Growth, and Enterprise for 26 or more trucks as "Contact sales / Book a demo" with a custom quote. Core shows as unavailable when the fleet has more trucks than the plan allows.
- Trucks: 18 of 25 with a meter. Over the limit: upgrade prompt with a 30-day grace period; nothing is blocked and drivers are never locked out.
- Invoices from us: plan and credit top-ups with PDF download. Card is updated here and charged by our payment processor; the app never stores full card numbers.
- Credit packs: $25 for 1,000, $110 for 5,000, $400 for 20,000. Purchased credits never expire; included monthly credits expire at month end. Buying is on Usage and credits.
- Only the Owner can change plan or card. The Accountant can view invoices and download receipts.

### Audit log (`WebAudit`)

A tamper-proof history of every change and override, for the owner, the accountant and any audit.

- Every entry has time, user or assistant, action, target, before and after values, and IP address. Entries cannot be edited or deleted.
- Overrides are listed in their own tab: manager override on dispatch (hours-of-service block or warning), customer credit limit, rate under minimum. Each needs a reason chosen at the time and the driver is told.
- Filters: user or assistant, action, date range, target. Search covers all text. Export all or selected rows as CSV (Enterprise adds a scheduled export).
- Assistant actions appear with the mode (Automatic or approved by whom). Security events (sign-ins, blocks, key changes) appear in red.
- Visible to Owner, and to the Accountant and managers for their department. Kept 2 years on Growth.

### Security (`WebSecurity`)

Controls for who can sign in, how, from where, and how long data is kept.

- Two-step policy: optional, required for managers and owner, or required for everyone. Session length 8 hours to 30 days. Lock after 5 wrong passwords. New-device alerts to the owner.
- SSO (SAML 2.0 or OpenID Connect) is part of Enterprise. On Growth the form can be filled as a preview and a "Book a demo" button leads to Plan and billing.
- IP allowlist limits office sign-in to listed addresses. Drivers in the app are not affected. Turn on only after adding the office address, or the owner could be locked out.
- API keys and webhooks each have Off, Test (sample data, no changes) and Live. Revoke ends a key immediately. Full API is Enterprise; Growth has webhooks and a read-only key.
- Retention settings for documents, call recordings, messages, audit log (minimum 2 years) and location history. Deleting at the end of the period is permanent.
- Devices list shows each signed-in device, place and last use; Sign out ends that session. Owner only.

### Import and export (`WebData`)

Get data in (CSV or another TMS), get everything out, back up, and delete the account safely.

- Import wizard: choose what (drivers, trucks, loads) and where from (CSV or another TMS), upload, match columns, preview, import. Required fields (for example driver name, phone, CDL number) must be matched before Next is allowed.
- The assistant matches columns by name and sample values; the user changes any match by clicking it. "Skip" leaves a column out. Duplicates are skipped by phone, VIN or load number.
- Preview shows how many rows will be added and how many have problems; problem rows come back as a file to fix. Every import can be undone for 30 days.
- Export everything: pick data sets, we email a zip of CSV files (documents as a separate zip). No fee, no lock-in.
- Backups: nightly, kept 35 days. Back up now or download the last backup; restore is done with support.
- Delete account: Owner only. Type the company name to confirm. The account is kept 30 days with a Cancel button, then deleted for good. Records the app holds for tax or safety law are exported first.

### Profile (`WebProfile`)

The signed-in person: details, sign-in security, sessions and preferences. Opened from the profile menu at the bottom of the sidebar.

- The profile menu (bottom left) shows name, email, role, carrier (and carrier switcher on Enterprise), plan preview (mockup only), profile, roles, notifications, billing, help, sign out.
- Sign-in methods: email and password, phone code, Apple, Google, company SSO (Enterprise). 2FA and passkeys here.
- Sessions list with sign out of other devices; every sign-in is audited.
- Role, team and data scope are read-only here; changed by an admin under Roles.
