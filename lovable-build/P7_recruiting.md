PHASE 7: RECRUITING (paid add-on on Core, included on Growth). Attached: SPEC_P7_recruiting.md. Routes /app/recruiting/(pipeline, candidates, candidates/:id, jobs, sources, onboarding). Tables: jobs, job_forms, candidates(source, stage, scores, notes), candidate_events, applications, onboarding_tasks, offers. Pipeline kanban with drag between stages (audited), public application form per job at /apply/:companySlug/:jobId (no login, rate-limited, spam protected), candidate record with timeline, documents, texts and calls log, onboarding checklist that converts a hired candidate into a driver record and sends the driver app invite. Third-party feeds (Tenstreet, Indeed) are disabled with "Needs approval" until configured.

ACCEPTANCE (verify each, report results; say plainly what is NOT done):
[ ] Every route listed renders with real data and no console errors, at 390px and desktop, light and dark.
[ ] Every button, tab, toggle, filter, bulk action, menu item and row click on these pages performs its real action and persists after reload. List any you did not wire.
[ ] Every create/edit/delete/status change writes audit_log and respects role permissions (UI and RLS). Test with two companies and two roles.
[ ] Plan limits enforced (UI and database) where mentioned.
[ ] Sample data extended: seed function adds the demo rows for this phase (is_demo=true) and removal works.
Reply with: routes added, tables and policies added, edge functions added, checklist results, gaps.
