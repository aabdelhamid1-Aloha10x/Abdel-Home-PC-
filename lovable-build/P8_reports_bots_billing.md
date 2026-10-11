PHASE 8: REPORTS, ASSISTANTS, CREDITS, STRIPE BILLING. Attached: SPEC_P8_reports_bots.md.
- Reports library + builder (Growth): pick dataset, fields, filters, group, chart; save, schedule by email (scheduled edge function), export CSV/PDF.
- Assistants (bots): control center with each assistant On / Suggest / Off; approvals queue; activity log; assistants call a server-side function using the Lovable AI gateway; every action is logged; "Ask my company" drawer answers questions from the company's own data through read-only database functions scoped by RLS (never raw SQL from the model).
- Credits: companies.credits_balance debited by an edge function per assistant action using a server-side rate table (never shown in UI); monthly included credits reset on the billing date and expire; top-up packs add non-expiring credits; at zero the assistants drop to Suggest/Off and workflows keep running.
- Stripe: products for Solo/Core/Growth, add-ons (Recruiting), and the three credit packs; Checkout for signup/upgrade/downgrade, Billing Portal for cards/invoices, webhook edge function that updates plan, plan_status and credits; Enterprise = "Contact sales" form that creates a lead row. Use Stripe test mode first and tell me which secrets to add.

ACCEPTANCE (verify each, report results; say plainly what is NOT done):
[ ] Every route listed renders with real data and no console errors, at 390px and desktop, light and dark.
[ ] Every button, tab, toggle, filter, bulk action, menu item and row click on these pages performs its real action and persists after reload. List any you did not wire.
[ ] Every create/edit/delete/status change writes audit_log and respects role permissions (UI and RLS). Test with two companies and two roles.
[ ] Plan limits enforced (UI and database) where mentioned.
[ ] Sample data extended: seed function adds the demo rows for this phase (is_demo=true) and removal works.
Reply with: routes added, tables and policies added, edge functions added, checklist results, gaps.
