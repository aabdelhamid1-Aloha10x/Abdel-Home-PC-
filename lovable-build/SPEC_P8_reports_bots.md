# Screen spec: P8_reports_bots

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
