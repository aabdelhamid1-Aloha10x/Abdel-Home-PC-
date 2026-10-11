PHASE 9: INTEGRATIONS, VOICE, ENTERPRISE. Build connectors one by one; each must be real or visibly disabled.
ORDER: FMCSA lookup (free webkey), Samsara (OAuth + token fallback; locations, HOS, DVIR), Motive, Geotab, QuickBooks Online (OAuth; sync invoices/bills/payments; Test mode previews, Live writes), Telnyx SMS, mileage/ETA (HERE or Google Routes), EIA diesel price, Document reader (Google Document AI or Textract) for BOL/rate con/receipts, e-sign (Dropbox Sign), Relay Payments and Bestpass if keys available. Each connector: OAuth/key stored encrypted server-side, Off/Test/Live modes, health panel (last sync, last error), disconnect that keeps data, sync logs table, webhook receivers with signature verification, retry with backoff.
VOICE (Growth+): Telnyx or Twilio number per company; AI receptionist for inbound broker/shipper calls and driver hotline; escalation check calls (default off); AI disclosure and recording notice at call start; consent and quiet hours; transcripts and outcomes in Inbox > Calls; Enterprise: several numbers, custom flows.
ENTERPRISE: multiple carrier entities (MC/DOT) under one company with a carrier switcher and combined view, approval chains, SSO (SAML via Supabase), API keys + webhooks, audit export.

ACCEPTANCE (verify each, report results; say plainly what is NOT done):
[ ] Every route listed renders with real data and no console errors, at 390px and desktop, light and dark.
[ ] Every button, tab, toggle, filter, bulk action, menu item and row click on these pages performs its real action and persists after reload. List any you did not wire.
[ ] Every create/edit/delete/status change writes audit_log and respects role permissions (UI and RLS). Test with two companies and two roles.
[ ] Plan limits enforced (UI and database) where mentioned.
[ ] Sample data extended: seed function adds the demo rows for this phase (is_demo=true) and removal works.
Reply with: routes added, tables and policies added, edge functions added, checklist results, gaps.
