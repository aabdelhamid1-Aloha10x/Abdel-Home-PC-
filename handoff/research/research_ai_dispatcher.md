# AI Dispatcher research (as of 2026-10-10)
Legend: [V] verified from a fetched/searched source; [U] unverified / general knowledge / vendor marketing. Not legal advice.

## 1. Load board access
| Board | Findings |
|---|---|
| DAT (DAT One, ex-Power) | Developer portal with APIs for Load Board (search/post), BookNow, tracking, freight posting. Needs a portal account; per third-party (API Evangelist) REST integration needs a DAT One subscription + organization service account, two-tier token (org token + user token) [V-secondary]. Contact developersupport@dat.com. Pricing for public subscriptions conflicting ($45-$329/mo by tier) [U]; API/partner fees not published. DAT ToS bans bots/spiders/crawlers/scraping of Product Data without prior written approval, and DAT sued Convoy over data misuse [V]. |
| Truckstop | Load Search API (search, bulk detail), plus carrier, rate insights, documents APIs. Requires signed Systems Integration Agreement; OAuth2; Technology Partner Program (marketplace.truckstop.com) with API key + account manager [V-secondary]. Carrier needs own Truckstop subscription for the integration (existing TMS pattern: Aljex, TruckMaster, Trucker Path). Owns RMIS (onboarding). ToS text not retrieved [U] - assume scraping banned. |
| 123Loadboard | Public Developer Portal: search loads, search trucks, lane rate check, post loads/trucks, messages, bids, book-now requests; "Become a partner" form; partner-integrations@123loadboard.com [V]. Eligibility/fees not published. Existing integrations: TrueTMS, LoadzPro, Vektor. Most accessible API for a carrier-side SaaS. |
| Sylectus, Parade, Trucker Path, uShip, Direct Freight | Not verified. Parade has a Truckstop "instant booking" integration (broker capacity side) [V-headline only]. Trucker Path has Truckstop load access partnership [V]. Contact each for partner APIs [U]. |
| Amazon Relay | Amazon says it does not tender via third-party load boards; loads only through Relay portal/app for onboarded carriers [V]. No public API found. Auto-booker Chrome extensions exist but are ToS-risk/ban risk [U]. Exclude from MVP. |
Per-tenant credentials: yes in practice - API access ties to a carrier's own paid subscription/org account (DAT, Truckstop). Model: each tenant connects own board account (OAuth/token) or you become a registered partner and tenants authorize their account.
Scraping/browser automation: DAT explicitly prohibits; others assumed similar. Risks: account termination (carrier loses their board), CFAA/contract claims, IP blocking. Recommendation: do not scrape; use official APIs, plus email-based load offers.
Email alternative: carriers receive load offers/"hot load" emails and broker blasts to their inbox. Parse via inbound email (Postmark/Resend/Gmail-Outlook OAuth per tenant) + LLM extraction. Lower ToS risk, but broker-dependent and unstructured. Also broker portals (Emerge, etc.) not researched [U].

## 2. Booking mechanics
- Most truckload bookings still phone/email (~80% claim, Numeo marketing [U-vendor]). Also: board "Book Now"/bid APIs (DAT BookNow; 123 book-now requests), broker portals, Amazon Relay in-app.
- Carrier must be onboarded to broker first: authority, insurance COI, W-9, broker-carrier agreement. Tools: Truckstop RMIS (acquired; ~97% COI already on file claim), Highway, MyCarrierPortal, OnRamp workflows [V-vendor]. No public API for carrier packet automation found - MVP: store carrier packet docs (W-9, COI, MC letter, NOA) and auto-attach to broker emails; flag "onboarding required" to the human.
- Rate cons: PDF/email in broker-specific formats. Parsing options: SenseML (sensible.so), LlamaParse, Nanonets, Bubba, Vektor, or DIY (Claude/GPT vision with JSON schema + confidence + human review for low-confidence fields) [V-vendor]. Always compare parsed rate to agreed rate/pickup/delivery to the pursuit record; mismatch -> human review. Rate con signature (e-sign) often required.

## 3. AI voice legality (not legal advice; confirm with counsel)
- FCC Declaratory Ruling FCC 24-17 (Feb 8, 2024): AI-generated voices are "artificial" under TCPA [V]. TCPA 227(b) artificial/prerecorded restrictions historically target residential lines and wireless numbers; calls to business landlines generally outside, but broker dispatchers often answer on cell phones -> covered, consent needed [U general knowledge]. Safe route: B2B calls to broker office lines/published numbers, prior business relationship, tenant-level written consent from brokers via carrier setup/broker agreement, honor DNC/opt-out. FCC one-to-one consent rule status conflicting in sources (reportedly vacated) [U]; a "June 2026 ruling" claim unverified [U].
- Consent to record: ~11-13 all-party states (CA, FL, IL, MD, MA, MI, MT, NV, NH, PA, WA, CT, DE vary by source) [V-secondary]. Always announce at start: "This is an AI assistant for [Carrier]; call is recorded."
- AI disclosure: disclose AI at start (CA B.O.T. Act, Utah AI disclosure law not verified in research) [U].
- Caller ID: Twilio Trust Hub business profile, SHAKEN/STIR A attestation, Voice Integrity to avoid spam labels, consistent number per carrier/tenant, Branded Calling in beta [V-secondary].
- SMS: A2P 10DLC registration mandatory; unregistered traffic blocked since Feb 2025; vetting 1-3 weeks [V-secondary].
- Guardrails: AI never commits rate/booking without driver accept (and tenant-set rate floor); max counter-offer bounds; hard-coded disclosure; no recording without announcement; transfer to human on request; call logs/transcripts/recordings retained; quiet hours; per-broker attempt caps; kill switch; dry-run mode.

## 4. Competitors
- FleetWorks: $17M (First Round); AI dispatcher for carriers + broker partnerships (15 of top 100 brokers claimed), 10k+ carriers onboarded [V-news, Oct 2025].
- Numeo AI Hub (May 2026): carrier-side agent connecting to boards/broker portals [V-vendor].
- TruckSmarter Dispatch: $16M raise, AI + human-in-the-loop [V].
- HappyRobot: broker-side voice agents; $44M Series B (2025), reports of $150M Series C at $1.22B (Aug 2026, unconfirmed) [V-secondary]. Pallet: $27M Series B, AI inside TMS/email [V]. Vooma: broker-side, customers Echo, MODE, Arrive, NFI [V-secondary]. Augment: no data. DAT/Truckstop AI features: not researched [U].
- Pricing signals: not found; carrier-side dispatch typically 5-10% of load revenue or per-seat SaaS [U]. Gaps: most focus on broker side (booking calls received); carrier-side agents limited by onboarding with brokers, rate negotiation trust, board API access, driver-in-loop UX, and downstream docs/invoicing. Your integrated TMS + invoicing + factoring is the differentiator.

## 5. Architecture (Supabase + queue + Vapi)
State machine for `load_pursuits`: FOUND -> SHORTLISTED(driver notified; optional) -> BROKER_CONTACTED (email sent / call placed) -> NEGOTIATING -> DRIVER_CONFIRM (live push, e.g. 60-120s timeout, auto-decline) -> BOOKED -> RATECON_RECEIVED -> RATECON_PARSED -> RATECON_VERIFIED -> DISPATCHED (load created). Terminal: REJECTED, EXPIRED, LOST, CANCELED. Store transitions in `pursuit_events` (append-only) for audit.
Components: pg_cron / pgmq (Supabase Queues) or Inngest/Trigger.dev for jobs; edge functions: board-poller (per tenant, respect API rate limits), matcher (scoring: deadhead, RPM, equipment, HOS window), outreach (email via Resend/Gmail OAuth; call via Vapi create-call with assistant overrides, metadata pursuit_id), Vapi webhooks (tool calls: get_driver_decision, submit_offer; end-of-call report), push/Realtime to driver app (Supabase Realtime + FCM) with accept/reject; inbound-email webhook -> ratecon parser -> load import; idempotency keys per pursuit step; RLS by tenant.
Live driver gate: Vapi assistant says "one moment" and calls tool `await_driver_decision` (long-poll function waiting on Realtime row) or uses hold music + callback.
MVP: load board API (123 or DAT) search + matching + email outreach with templates + human dispatcher approves; Vapi call for a single script (check availability/rate) with driver accept button; ratecon email ingest + LLM parse + review screen. Later: autonomous negotiation, multi-board, onboarding automation, broker voice inbound, SMS.
Cost per booked load (estimates [U]): Vapi $0.05/min hosting + STT/LLM/TTS ~ $0.08-0.13/min on defaults, $0.25-0.33 realistic with premium stack + telephony [V-secondary]. Typical pursuit: 3-5 calls x 3 min x ~$0.20 = ~$2-3; conversion maybe 20-30% -> ~$6-12 voice per booked load worst case; LLM tokens (matching, email drafts, ratecon parse ~10-20k tokens) ~ $0.05-0.30. Total ~ $3-12/booked load; meter per minute and per pursuit, cap per tenant.

## 6. Documents / factoring
- BOL/POD: driver app camera + edge detection/PDF scan (e.g., Scanbot/ML Kit), upload to Supabase Storage, send to broker contact from ratecon via email (Resend, tenant-branded reply-to) with BOL at pickup and POD at delivery; log delivery; check-calls optional.
- Invoice: generate PDF from load + ratecon, attach POD, send to broker AP email; or submit to factor.
- Factors: OTR Solutions has API-driven TMS integrations (Alvys, Vektor), payment status [V-vendor]; Apex via Axele TMS link [V-vendor]; Triumph/TriumphPay, RTS, Thunder: no public API found [U] - most accept email/portal submission or TMS partnerships; build "email schedule package" fallback + partner API where available. Also consider factor-neutral approach via Denim/Bobtail-style integrations [U].
- QuickBooks: Intuit QuickBooks Online API (OAuth2) supports Customer, Invoice, Payment objects [U general knowledge].

## Sources
- https://123loadboard.com/api
- https://www.dat.com/api-integration ; https://dat.com/docs/api ; https://providers.apievangelist.com/providers/dat-freight/
- https://www.dat.com/terms-and-conditions-2026 ; https://landline.media/?p=53360
- https://truckstop.com/product/integrations/ ; https://providers.apievangelist.com/providers/truckstop/ ; https://partner-program-directory.partnerfleet.io/partners/truckstop-technology-partner-program
- https://relay.amazon.com/blog/intro-to-amazon-relay/how-to-find-truck-loads-faster-with-amazon-relays-free-freight-search
- https://transnexus.com/blog/2024/ai-voice-calls-and-tcpa/ ; https://www.akingump.com/en/insights/ai-law-and-regulation-tracker/fcc-issues-declaratory-ruling-on-ai-generated-voice-robocalls
- https://softcery.com/lab/us-voice-ai-regulations-founders-guide.md ; https://www.twilio.com/docs/trust-hub/registrations
- https://www.metaverselaw.com/two-party-consent-requirements-for-recording-calls/
- https://trillet.ai/blogs/vapi-pricing-per-minute ; https://zeeg.me/en/blog/post/vapi-ai-pricing
- https://www.freightwaves.com/news/how-fleetworks-17m-funding-fuels-ai-dispatcher-innovation ; https://numeo.ai/introducing/ai-hub ; https://www.freightcaviar.com/p/6ed00801-46fb-4acb-8925-1d88d510ddfb
- https://sacra.com/c/happyrobot/ ; https://yespress.io/pallet/who-competes-with-pallet-mapping-the-freight-ai-automation-field
- https://www.freightwaves.com/news/rmis-automates-carrier-compliance-for-brokers-big-and-small ; https://onramp.us/solutions/carrier-onboarding
- https://www.sensible.so/logistics ; https://www.llamaindex.ai/services/rate-confirmation-ocr ; https://www.nanonets.com/document-ocr/rate-confirmation
- https://otrsolutions.com/?p=27068 ; https://www.ajot.com/news/axele-announces-partnership-with-apex-capital ; https://www.freightwaves.com/checkpoint/best-factoring-companies-for-trucking
