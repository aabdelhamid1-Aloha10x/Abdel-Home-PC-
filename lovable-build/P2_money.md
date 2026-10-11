PHASE 2: MONEY (record-only). Attached: SPEC_P2_money.md. The app never moves money.

ROUTES: /app/accounting (overview), /invoices, /invoices/:id, /collections, /bills, /settlements, /settlements/:id, /pay-plans, /expenses, /fuel, /factoring, /profit; /app/fleet/teams, /app/fleet/programs.

TABLES: invoices(number, customer_id, load_ids, lines jsonb, subtotal, tax, total, status draft/sent/partial/paid/void, due_date, sent_at, terms), payments(invoice_id, amount, method, reference, received_at, recorded_by), bills(vendor, amount, due, status, category, load_id null), expenses(date, category, amount, vendor, driver_id, truck_id, load_id, receipt path, status pending/approved/rejected), fuel_transactions(date, truck_id, driver_id, gallons, price, amount, state, card, source manual/import), pay_plans(name, method per_mile|hourly|pct_gross|pct_net_fuel|pct_net_all, loaded_rate, empty_rate, pct, deductions jsonb, escrow jsonb, tenure_steps jsonb, version, effective_from, status), programs(name company/lease/oo/team, rules jsonb: board allowed, booking rule never/approval/direct, pay_plan_id, classification label), settlements(driver_id, period, lines jsonb, gross, deductions, escrow_change, net, status draft/approved/paid, pay_plan_version), settlement_lines, advances, escrow_ledger(driver_id, amount, reason, settlement_id), factoring_schedules(items, advance, reserve, fee, status), teams(name, leader_user_id, dispatcher_ids), team_members.

BEHAVIOR:
- Invoice: create from delivered loads (one or many), PDF generation server side (edge function) with company logo/remit-to, send by email through the company's connected mailbox if present else download link; "Record payment" (partial/full) updates status and balance; aging buckets computed; collections list with reminder templates (creates a task + email draft, never sends silently).
- Pay plans: editor with all methods and options exactly as in the spec; saving creates a NEW version with an effective date; approved settlements keep the version they used. A pure TS calculator src/lib/pay/ computes a settlement for a driver and period from deliveries, miles loaded/empty, fuel cost, maintenance cost, deductions and escrow; show line-by-line math and a "Compare plans on this load" table. Unit-test with the 7 example plans in the spec (30% of linehaul = $492 on load 4857 linehaul $1,640).
- Settlements: generate for a period for all drivers of a program; review, edit lines, approve (approval permission), "Mark as paid" (record only) with reference; driver sees it in the driver app later.
- Programs and Teams: as per spec: programs set load-board access and booking rule; teams assign leader and dispatchers; "One dispatch group" switch hides teams everywhere; moving a driver between teams is audited.
- Factoring: schedule builder from invoices, advance/reserve/fee math, mark funded (record).
- Expenses with receipt upload and approval; Fuel import CSV with column mapping; IFTA quarter summary by state computed from fuel and miles (miles by state manual entry or from trip data if present).
- Profit: per load, truck, driver, customer using real data and company cost settings; CSV export.
- Role gating: only Owner and Accountant can approve pay and invoices; leaders approve for their department only.

ACCEPTANCE (verify each, report results; say plainly what is NOT done):
[ ] Every route listed renders with real data and no console errors, at 390px and desktop, light and dark.
[ ] Every button, tab, toggle, filter, bulk action, menu item and row click on these pages performs its real action and persists after reload. List any you did not wire.
[ ] Every create/edit/delete/status change writes audit_log and respects role permissions (UI and RLS). Test with two companies and two roles.
[ ] Plan limits enforced (UI and database) where mentioned.
[ ] Sample data extended: seed function adds the demo rows for this phase (is_demo=true) and removal works.
Reply with: routes added, tables and policies added, edge functions added, checklist results, gaps.
