# Prompt 04f: Tool hub (capabilities + providers) and the capital-raising engine

Read `docs/07_TOOL_HUB_AND_CAPITAL_ENGINE.md`. Run after Prompt 04.

## Tasks
1. **Capability registry** (`packages/capabilities`): typed interfaces (`find_leads`, `enrich_contact`, `verify_email`, `send_email_sequence`, `place_call`, `send_sms`, `post_social`, `run_ads`, `create_video`, `book_podcast_guest`, `publish_podcast_episode`, `host_webinar`, `send_for_signature`, `verify_accredited_investor`, ...). Each declares: providers, cost model, credits price, required consents, disclosure rules, blocked industries.
2. **Provider adapters + router**: start with Apollo (or Clay) for leads, Instantly/Smartlead for B2B email, Vapi + Twilio for calls, DocuSign/PandaDoc for signatures, Listen Notes-type database for podcasts. Router picks by quality/cost/availability; metered to `usage_events`; swappable without agent changes.
3. **Human-grade conversation standard** in the Closer/Sales agents: brand voice, memory, human pacing, premium voices; **disclose AI where law requires and never deny when sincerely asked**; consent checks before any call/SMS (TCPA), CAN-SPAM for email, no AI cold calls to non-consenting numbers.
4. **Capital-raising engine** (feature flag, regulated pack): offering path selector (506(b)/506(c)/Reg CF/Reg A+) recorded with attorney sign-off; investor CRM + data room (access logs, NDA gate); content + outbound + webinar funnel per §4.2; qualification script answering only from counsel-approved materials; third-party accredited verification; e-signature; investor reporting. Hard block: any fee tied to amount raised; any return promise; general solicitation when path = 506(b).
5. **Dogfood**: configure Unstaffd's own investor pipeline (506(b) mode: no public offer posts) in the admin company.

## Acceptance
- James scenario (506(c)) and Unstaffd's own raise (506(b)) both run in staging with the right blocks firing (prove: a public "invest now" post is blocked in 506(b) mode; a return promise is blocked in both).
- Swapping the lead provider requires no agent change (test).
- Report per definition of done.
