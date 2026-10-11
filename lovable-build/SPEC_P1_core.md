# Screen spec: P1_core

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


### Drivers (`WebDrivers`)

One list of every driver with live hours of service, equipment, document expiry, pay rule and safety score.

- Tabs: All, Driving, On duty, Off / home, Needs attention. Needs attention means a CDL or medical card expiring within 60 days, a 70-hour cycle at 60 h or more, a safety score under 86, or a truck that is in the shop, out of service or has an inspection expiring within 30 days.
- Hours of service (drive left, window, 70-hour cycle) come from the ELD integration every 5 minutes. Red cycle bar at 60 h or more, amber at 50 h or more.
- Click a row to open the side drawer; "Open the full record" goes to the driver page. Bulk actions: Message, Request documents (sends a request in the driver app), Set home time, Export.
- A driver cannot be shown as Driving while the truck is in the shop or out of service; the roll call and planner use the same rule.
- Pay rule is read only here. It is edited on the driver page (Managers and Accountants only).
- Assistant: reminds drivers about expiring documents (Ask first sends a draft for approval, Auto sends it at 60, 30 and 7 days).


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
