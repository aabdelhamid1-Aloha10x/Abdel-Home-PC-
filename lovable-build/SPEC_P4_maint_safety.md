# Screen spec: P4_maint_safety

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
