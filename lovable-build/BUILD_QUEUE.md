# Build queue (continuous mode). Owner authorized Oct 15: keep moving; goal: finish the Solo app today, then the web system (Core, Growth, Enterprise).
Rules that still hold: nothing published; no credit prices in customer UI; money record-only; no load-board passwords; no ANH/A&H data; never send while Lovable is mid-run; one round at a time; verify each round (read-only) before the next; ONE consolidated fix message per round. Owner-only items are never done by me: secrets (secure form), accounts, VM, publishing, pricing/credit numbers.
Credit/pricing system and the website merge WAIT until the app is finished and scenario-tested (owner decision Oct 15).

| # | Round | State |
|---|---|---|
| R1 | Usage metering (cost-only, per component, calls per second/minute, provider-reported Vapi cost breakdown, unit_economics) | SENT 14:25 (umsg_01m4zwg7tmfsdtcarzp3dk2mm5) |
| S1 | Solo: time and wording cleanup (UTC "today" spots, tz test) | next (spec in SOLO_COMPLETENESS_AUDIT.md) |
| S2 | Solo: "Done for you today" strip + goal line on Home | queued |
| S3 | Solo: missing chat tools (mark paid, IFTA report, schedule PM, renewal lookups, weekly review) | queued |
| S4 | Solo: spend limits in Rules + autonomy class A-D server tests | queued |
| S5 | Solo: finish Hire Masar (comfort dial, first job) + remove orphan routes | queued |
| S6 | Solo: one shared keep/deadhead calculation across list and detail screens | queued |
| P4 | Phase 4 app side: Vapi broker call path (webhook, cost parts, transcript untrusted, mid-call Accept/Counter/Decline ~20s then "check with management", booking confirmation, load creation after confirmed case, rate-con auto match). Needs Vapi keys to test live | after Solo rounds |
| W1.. | Web system (office /app): fleet entry to cases, Core/Growth/Enterprise screens | after Solo |
Solo audit: lovable-build/SOLO_COMPLETENESS_AUDIT.md (static read, 20+ files unread; statuses rely on QA_LOG for those).
Owner to-dos: Hostinger VM RAM/OS (worker host), Vapi account + keys via Lovable secure form, PERPLEXITY_API_KEY via secure form, reseller approval_ref recorded in app, pricing decisions (PRICING_PROPOSAL.md) later.
