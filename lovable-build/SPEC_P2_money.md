# Screen spec: P2_money

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
