# Screen spec: P0_settings

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
