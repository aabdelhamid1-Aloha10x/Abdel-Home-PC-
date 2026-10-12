# Recruiting & HR / Onboarding — blueprint

Inputs used: inventory/recruiting_hr.md (cited as INV §x), Department_Feature_Spec.md §8, AI_Model_Comparison.md (cited as AMC Job 5 etc.), _FRAMEWORK.md. Cost tags: [V] = vendor page in AMC, [E] = my estimate.
Honesty note: I could not listen to bland_demo_audio.mp3 (no audio tool in this run). "Abdel liked Bland's sound" is taken as a stated preference; section 5, Bot R4 turns that into a blind test instead of a guess.

## 1. Who uses it and what a day looks like
- **Recruiter / HR (daily user).** Opens the app on a phone or desktop to the "Needs me" queue: replies waiting, overdue follow-ups, documents to check, travel today. Almost everything else is done by workflows (and, in Pro/Autopilot, the AI texter/caller) before they look.
- **Owner / HR leader.** Turns the AI on/off, sets autonomy (Off / Suggest / Auto), pastes ad spend, reads cost per hire, approves hires, signs off activation.
- **Safety / compliance lead.** Owns MVR, Clearinghouse, PSP results, adverse-action letters, drug-test status.
- **Candidate (external, phone only).** Applies on /apply, gets texts and calls, signs the agreements from a link, receives travel info.
- **New driver (external).** Completes the secure paperwork link, e-signs, becomes an active driver with a login.
- **Typical day (ANH scale: about 26 new leads/week, 42 completed applications in the period, 8 approved):** 07:30 AI has already texted overnight leads inside the allowed window; 08:00 recruiter sees 6 "Needs me" items; AI voice has screened 4 candidates and left summaries; recruiter approves 2 for background checks; 14:00 two candidates are due at orientation tomorrow, travel reminders are queued automatically.

## 2. Screen map
| Route | Screen | Purpose | Phone / Desktop |
|---|---|---|---|
| /recruiting | **Needs me** (home) | Urgency-sorted queue: overdue next action, replies waiting, failed sends, docs missing, arrivals within 48h. One tap opens the candidate. | Phone-first; desktop too |
| /recruiting/pipeline | **Pipeline** (List + draggable Board) | Stages, filters (stage, owner, experience, language, replied, source, state), metric cards (Applicants, Replied, 1y+ exp, Approved, Travel, Hired) with date range. Board cards ARE draggable (fixes ANH read-only board). | Desktop primary; phone = list |
| /recruiting/c/:id | **Candidate profile** (split panel on desktop, full page on phone) | Tabs: Conversation (SMS + voice + notes in one timeline), Checks (MVR / Clearinghouse / PSP / drug test), Documents, Onboarding (agreements), Travel, Activity (audit), Details/Edit | Both |
| /recruiting/inbox | **Two-way inbox** | All threads, unread first, "New reply" pin, one composer with STOP/quiet-hour guard, take-over / resume AI | Both |
| /recruiting/nurture | **Nurture** | Candidates in long-term drip, search only | Desktop |
| /recruiting/travel | **Orientation & travel** | Columns: Approved-not-booked, Arriving in 3 days, Arriving later; orientation class roster and capacity | Both |
| /recruiting/calls | **AI calls** | Recent calls with outcome, recording player, transcript, "stuck dialing" alarm, call-window/cap settings, live-transfer status | Desktop |
| /recruiting/analytics | **Funnel & ad spend** | Funnel by source/campaign/ad/state/owner, cost per applicant / approval / hire / start, spend import, reply speed, drill-down to people | Desktop |
| /recruiting/form | **Application form** | Form editor (questions, hiring states, pay text, consent text), link / embed code / QR, live preview, tracking pixels | Desktop |
| /recruiting/settings | **Settings & compliance** | Master switch + Test/Live, per-channel switches, quiet hours, caps, consent ledger view, 10DLC status, integration cards with REAL connection status, auto-reject rules (single source), autonomy per bot | Desktop |
| /hr | **HR home** | Onboarding queue (pending activation), agreements status, driver docs, behavior reports | Both |
| /hr/onboarding | **Onboarding queue** | Per new driver: checklist (agreements x7, documents, drug test, MVR/PSP/Clearinghouse, bank, orientation) with progress; Activate button gated | Both |
| /hr/drivers | **Drivers directory** (shared Fleet component) | Staff add driver, filters, bulk actions; HR sees onboarding tab | Desktop |
| /hr/behavior | **Behavior reports** | Daily AI driver-behavior summary with manual "Run now" button (ANH had none) | Desktop |
| /apply (public) | **Application** | 5 steps, mobile-first, consent, optional CDL photos | Phone-first |
| /driver-signup/:token (public) | **Secure paperwork wizard** | Token + OTP; 10 steps; e-sign; encrypted SSN/bank | Phone-first |
| /sign/:envelope (public) | **E-sign** | One agreement at a time, draw/type signature, audit trail | Phone-first |
| Global dock + bell | **Reply dock / alerts bell** | Messenger-style bubbles, sound, "Lead replied" bell; sends through the SAME gated composer (not ungated) | Both |

## 3. Click-through flows

### Flow A — Candidate applies (public form → lead → first touch)
1. Candidate taps the Facebook/Indeed ad → /apply loads; system captures utm_*, fbclid/_fbc, campaign/adset/ad ids, referrer and stores them against a draft lead id held in the browser.
2. Taps **Start Application** → Basics step (name, phone, email, state, ZIP). Phone validated to E.164 on the spot (fixes 35 dead ANH calls).
3. Consent block, three separate UNCHECKED checkboxes: (a) texts, (b) AI-assisted calls, (c) recording of calls. Each shows the company legal name, "AI assistant", "msg & data rates may apply, reply STOP", link to privacy/terms. System stores the exact text, timestamp, IP, device, form version in the **consent ledger** (append-only).
4. **Next** → server creates the lead (service-side, rate-limited, captcha/Turnstile; NO anonymous direct table insert). De-duplicates on E.164 phone + email: if found, attaches to the existing lead and never creates a second record (fixes ANH duplicates 19 groups, 17 blocked identities).
5. Experience step (6 options) → under 12 months: lead set to Rejected-not-qualified with polite end screen and nothing queued. CDL class/state, endorsements saved.
6. Optional CDL front/back photos → stored in private storage, virus-scanned; AI reads them later (Doc bot) to pre-fill and cross-check.
7. Safety step (violations, accidents, DOT violation, SAP, ready-to-start). **Submit** → ONE rules engine (single source, editable in Settings) screens: hiring-state list, violations over limit, accidents, SAP, start date. Result stored with the reason; the candidate sees a neutral message.
8. System fires Meta Pixel + Conversions API Lead (server hashes PII, dedupes by event id) only for qualified applicants.
9. Workflow queues the first text (acknowledgement) inside quiet hours; urgency score is computed; "Needs me" updates. If the candidate left after Basics, a reminder text goes out after 2 hours only if consent (a) was ticked. Forms older than 24h resume the same lead (fixes duplicate-lead bug).

### Flow B — AI texting a candidate (Pro) and STOP handling
1. Trigger: lead enrolled (consent on file, qualified, not human-paused, outbound Live).
2. Workflow checks gates in this order and logs each: master switch → Test/Live → consent for SMS → global STOP/DNC list (shared with voice) → candidate local quiet hours (default send window 08:00–20:00 local, never inside 21:00–08:00) → attempt caps → provider/10DLC campaign approved.
3. Failing any gate = job is not sent; reason written to audit log; if only quiet hours, job is rescheduled to next window.
4. AI Text bot drafts the message from a template library + candidate facts (name, state, missing item). Pro = **Suggest**: draft appears in the inbox with "Send" button. Autopilot = **Auto** within the owner's rules (templates, topics allowed, max 3 unreplied sends).
5. Candidate replies. Inbound webhook stores the message FIRST (hard requirement: every inbound is persisted before any processing; if the provider payload lacks a message id the system generates one and raises an alert, never drops it — fixes ANH loss since 18 Sep).
6. **STOP / STOPALL / UNSUBSCRIBE / CANCEL / END / QUIT (and "don't text me", "remove me" via Fast classifier)** → system, in one transaction: revokes SMS AND voice consent, writes ledger row, cancels all queued jobs for the lead, ends nurture, sends the carrier-required confirmation once, shows a red "Opted out" badge. A human cannot override from the UI; only the candidate re-consenting (START or a new form) lifts it. Test: a nightly synthetic STOP test fails the health check if any job is sent afterwards.
7. Normal reply → Fast triage (intent: question, interested, not interested, scheduling, document sent, angry/legal) → workflow cancels pending nudges, updates last_reply, raises bell + sound. AI drafts/sends the answer only from the approved FAQ/pay/home-time sheet; anything outside it escalates.
8. **Human take-over:** staff types in the composer, or taps **Take over** → assistant_paused = true (reason, who, when); queued AI jobs cancelled; a yellow "You are handling this" banner shows; AI also pauses automatically when status reaches MVR stage or later, or on a positive-handoff intent. **Resume the assistant** is a deliberate button (not automatic). While paused, workflow reminders (documents, travel) still run only if the owner ticked "keep system reminders during take-over".
9. Audit log row for every draft, send, skip, escalation: inputs, model, confidence, who approved.

### Flow C — AI voice screening call (Autopilot)
1. Trigger: first text delivered + 30 minutes (configurable), or staff taps **Call now**.
2. Gates: same as text plus voice consent (b), candidate-local call window 08:00–20:00, max 4 attempts 2 hours apart, no call in progress, concurrency slot available (queue rather than fail on "Over concurrency", fixes 31 dead ANH calls), voicemail detection.
3. Voice bot dials from the tenant's registered number (STIR/SHAKEN attested). First 10 seconds: names the company, says it is an AI assistant, says the call may be recorded (two-party-consent states) and offers "press 9 or say 'stop calling' to opt out".
4. Script asks the screening questions the form did not (equipment preferences, home time, pay expectations, start date), answers FAQs from the approved sheet, and offers the next step.
5. Live events (answered, outcome, transcript chunks) stream to the webhook. A **heartbeat monitor** marks any call "dialing" for more than 10 minutes as failed and alerts (fixes 24 stuck calls).
6. If the candidate says "stop calling me" (or equivalent) → same STOP transaction as Flow B steps 6, voice and SMS both.
7. If the candidate asks for a person or is hot (qualified + ready now) → **warm transfer** to the on-duty recruiter's phone (schedule in Settings); if nobody picks up in 20s, bot books a callback slot and creates a "Needs me" item.
8. After hang-up: Post-call summary step (Balanced model) writes outcome, structured answers into the profile, next step, and a 3-line summary; recording + transcript are attached to the timeline. Staff can play the recording (signed link, 120 seconds). Status moves to "Screening call completed" (workflow).
9. Cost is added to the usage meter (minutes and dollars).

### Flow D — Approval → checks → signup link
1. Recruiter drags candidate to **Ready for checks**. System opens the **Checks** tab with 4 rows: MVR, PSP, Clearinghouse, drug test; each has state Not requested / Requested / Received / Cleared / Failed.
2. Recruiter taps **Request checks**. System first shows the candidate's consent state: MVR and PSP require the driver's signed written authorization; Clearinghouse requires the driver's electronic consent registered in the FMCSA Clearinghouse (limited query allowed with consent). If missing, system sends a consent e-sign (Flow E) before anything is ordered.
3. Integrations (section 7 notes): MVR vendor API, PSP vendor API, Clearinghouse query through an approved C/TPA or the employer's own account. None exist in ANH today (ANH just had two manual "Record approved" buttons that were never used, 0 rows). Results land as a PDF/JSON on the profile; Fast/Balanced AI reads the MVR and highlights violations against the owner's criteria (Suggest only).
4. A human with the Safety role records the decision (Approve / Not approved + note) on each check. The decision rows are append-only, with who and when.
5. **Adverse action:** if a check leads to "Not approved", system generates the pre-adverse and adverse action letters (FCRA) with the report copy; the Smart model may draft cover text; a human must click Send. Nothing is auto-sent.
6. Stage **Approved** is enforced by the system: it is only selectable when experience ≥ 12 months AND MVR cleared AND Clearinghouse cleared AND PSP (if required by the tenant's policy) cleared; otherwise the Stage control shows exactly what is missing (ANH only showed a wrong promise).
7. Moving to Approved: confirm dialog → system issues a **single-use signup token** (random, 7 days, bound to the candidate, stored hashed), queues the approval text/email with the link, logs the activity, pauses AI texter, starts the onboarding checklist. If SMS is blocked (STOP), the link goes by email only and the recruiter is told.
8. Candidate opens the link → identity step (OTP to the phone/email that applied) → Flow E.

### Flow E — E-sign agreements and secure activation
1. Candidate passes OTP. The server (not the browser) opens a session; no direct table writes from the page.
2. Wizard collects 10 steps (contractor type, info, address, license/medical, endorsements incl. TWIC number saved this time, tax id, bank, emergency contacts, drug test, MVR) — drug test and MVR results are NOT self-reported: those fields are read-only and populated from vendor results/staff entry (fixes ANH trust problem).
3. **SSN/EIN and bank routing/account** go over TLS straight to a server function that encrypts them with envelope encryption (per-tenant data key in a KMS; AES-256-GCM), stores only ciphertext + last-4, never logs them, and AI models never see them. Reveal needs a staff role with "payroll" permission, a reason, a re-auth, and writes an audit row.
4. Agreements (template set per tenant; ANH had 7: Equipment, ELD/HOS, Drug & Alcohol, Safety, Employment, Direct Deposit, ELD Training): each is shown one at a time; candidate must scroll to the end, then types or draws a signature and taps **Sign**.
5. Audit trail per signature: document hash (SHA-256) before and after, template version, signer name, email/phone verified by OTP, IP, user agent, timestamp (UTC) with timezone, consent-to-e-sign disclosure (ESIGN/UETA), geo (coarse), signature image; a final signed PDF with an embedded certificate page; the envelope is sealed and tamper-evident. HR can open the audit view and download the PDF.
6. Submit → server creates the driver in **Pending activation** (not Active) and links the lead. Status = Onboarding.
7. HR opens /hr/onboarding: checklist must be 100% for **Activate driver** to enable (agreements, license + medical on file, drug test negative, MVR/PSP/Clearinghouse cleared, bank on file, orientation done). Activate needs an authenticated staff with the activation permission; an unauthenticated or token-only caller can never activate (the public flow can only reach Pending).
8. Activate → system sets Active, sends driver-app invite (verified email/phone), creates the payroll vendor/accounting sync (QuickBooks / accounting module), assigns role Driver, writes audit row. If any gate fails the button explains what is missing.

### Flow F — Orientation and travel
1. Recruiter opens the candidate's **Travel** tab or /recruiting/travel and picks an **orientation class** (date, location, capacity, instructors) → candidate is added to the roster.
2. Candidate chooses arrival method (own vehicle, bus, flight, ride). For paid travel the recruiter adds legs (mode, carrier, confirmation, from/to, depart/arrive, timezone). AI step (optional): paste an itinerary email/screenshot and the Doc bot fills the legs (Suggest).
3. Recruiter taps **Send itinerary** → candidate gets text + email with a confirm link; **candidate acknowledgement** is recorded, and the overnight-reminder preference.
4. Workflow schedules reminders: 3 days, 1 day, morning-of, "have you left?" and a no-show alert to the recruiter 2 hours after planned arrival (respecting quiet hours unless the candidate agreed to overnight reminders).
5. On arrival the recruiter taps **Arrived** (or driver taps a geofence/check-in link); reminders cancel; roster shows attendance; orientation checklist (photo ID, drug test collection, safety video, truck assignment) is ticked.
6. After orientation → Activate (Flow E step 7); the lead's stage becomes Hired / Started driving; cost-per-hire is calculated.

### Flow G — Ad spend and funnel analytics
1. Owner opens **Funnel & ad spend** → picks date range (default 90 days).
2. **Connect ad account**: Meta Ads read-only sync (OAuth), Indeed/Google via CSV import. CSV path: drop file → browser parse → server dry run → preview (days, total, campaigns, refused rows, duplicates) → **Import** in batches.
3. System joins spend to leads by campaign/adset/ad id and first-touch attribution (one person = one lead via phone/email clustering).
4. Screen shows funnel: Spend → Clicks → Applications started → Completed → Qualified → Replied → Screened → Approved → Arrived → Started; cost per step; reply-speed median; best/worst ads; state and city map; drill-down lists people behind every number.
5. Pro: "Ask the funnel" chat (Smart model, read-only, tenant-scoped SQL). Autopilot: weekly brief text ("Campaign X costs $212 per qualified applicant, 2.4× campaign Y — shift $300?") and suggest-only budget moves (Meta write needs the owner's click).
6. KPI definitions are stored once (applicant, qualified, started) so numbers do not disagree between screens.

## 4. Feature table
Legend: Y = yes in ANH, P = partial, N = no. INV = inventory/recruiting_hr.md.
| Feature | What it does | WORKFLOW / AI BOT / HYBRID (why) | In ANH today? | Tier | Priority |
|---|---|---|---|---|---|
| Public application form (5 steps, mobile) | Collects screening answers, UTM/fbclid, consent | WORKFLOW (fixed form) | Y (INV §1.6; 42 completed) | Core | Launch |
| Form editor, link, embed, QR | Edit questions, hiring states, pay text; copy link/iframe | WORKFLOW | P (copy only, INV §1.3) | Core | Launch |
| Server-side lead creation, dedupe, rate limit, captcha | Replaces anonymous inserts; one lead per phone/email | WORKFLOW | N (INV §7 #11, #14, #5) | Core | Launch |
| Single auto-screen rules engine | Hiring states, violations, accidents, SAP, start date, experience gate; editable | WORKFLOW (deterministic) | P (3 disagreeing copies, INV §5 #10) | Core | Launch |
| Urgency score + "Needs me" queue | Sort by overdue/quiet/failed/arrival/pending checks (+100/+80/+70/+60/+40/+30/+20, same weights as ANH, editable) | WORKFLOW (arithmetic) | Y (INV §5 #1) | Core | Launch |
| Pipeline list + draggable board, filters, metric cards | Stages, owner, filters, saved widths/split | WORKFLOW | Y (read-only board) | Core | Launch |
| Candidate profile (conversation, checks, docs, travel, activity, details) | One screen first contact to hired | WORKFLOW | Y (INV §1.1.2) | Core | Launch |
| Add candidate (no data loss) | Manual lead with ALL fields saved | WORKFLOW | P (drops fields, INV §1.1.9) | Core | Launch |
| Lead intake: Meta Lead Ads, webhooks, CSV, GHL/other import (auth required) | Pull leads in, dedupe | WORKFLOW | P (GHL import has no auth; INV §1.4 #2) | Core | Launch (webhook/CSV); V2 (Meta Lead Ads sync) |
| Two-way SMS inbox + dock + bell | Persist every inbound; sound + toast; mark read; gated composer | WORKFLOW | P (inbound lost since 18 Sep, INV §7 #1) | Core | Launch |
| Consent ledger, STOP honored across SMS+voice, DNC list | Append-only consent; one STOP revokes all channels | WORKFLOW (legal, must be deterministic) | P (STOP not honored in tests; Spec §8) | Core | Launch |
| Quiet hours, caps, candidate-local timezone | Per-tenant send windows; area-code/ZIP timezone | WORKFLOW | P (DB-only settings, INV §1.2) | Core | Launch |
| A2P/10DLC registration wizard | Brand + campaign registration, status, opt-in proof pack | WORKFLOW | N | Core (SMS needs it) | Launch |
| Template SMS sequences (ack, follow-up, nurture, docs, travel) | Timed cadence without AI | WORKFLOW | Y (INV §2.3 outbound worker) | Core | Launch |
| Human take-over / resume, auto-pause at MVR stage | Pause AI per lead; cancels jobs; banner | WORKFLOW | Y (INV §1.1.2 #8, 18 paused) | Core (applies once AI is on) | Launch |
| AI Text assistant (draft + auto-reply) | Answers questions, nudges missing docs, books next step | AI BOT (natural-language conversation) | Y in practice (437 SMS sent) | Pro (Suggest) / Autopilot (Auto) | Launch (Pro); V2 (Auto) |
| Reply triage / intent / STOP-intent detection | Classify inbound | AI BOT Fast (unstructured text) + keyword rules first | P | Pro | Launch |
| AI voice screening call + voicemail + warm transfer | Calls, scores, summarizes | AI BOT Voice (live conversation) | Y (229 calls; webhook dead, INV §7 #2) | Autopilot | Launch |
| Call heartbeat / stuck-call watchdog | Alarm on dialing >10 min; retry within caps | WORKFLOW | N (24 stuck) | Autopilot | Launch |
| Recording + transcript player | Signed 120s link | WORKFLOW | Y (recording currently off) | Autopilot | Launch |
| Post-call summary + structured answers | Writes profile fields from transcript | HYBRID (AI reads, workflow saves) | P | Autopilot | Launch |
| CDL/medical/ID document intake + classification | Reads photos, labels type, flags blur/expired; staff "verified" button | HYBRID (AI reads; human verifies) | P (no verify button, INV §1.1.2) | Core (25/mo) / Pro / Autopilot | Launch |
| MVR integration | Order and ingest MVR; AI highlights | HYBRID (vendor API + AI summary) | N (integration does not exist) | Pro (Core: manual entry) | V2 |
| PSP integration | Ordered via vendor with driver consent | WORKFLOW + vendor | N | Pro | V2 |
| Clearinghouse integration | Consent tracking + query via C/TPA or employer account | WORKFLOW + vendor | N | Pro | V2 |
| Manual check recording with append-only dispositions | Safety records Approved/Not + note | WORKFLOW | Y code, 0 rows | Core | Launch |
| Approval gate (experience + checks) | System enforces; shows what is missing | WORKFLOW | N (broken, INV §7 #3) | Core | Launch |
| Adverse-action letters (FCRA) | Pre-adverse / adverse templates with report; human sends | HYBRID (template + Smart draft, human approval) | N | Pro | V2 |
| Approval → single-use signup link (SMS/email) | Token hashed, 7 days, OTP | WORKFLOW | P (never fired, INV §1.1.2) | Core | Launch |
| Secure paperwork wizard (10 steps) | Server-written, encrypted SSN/bank | WORKFLOW | P (broken + plaintext, INV §1.7) | Core | Launch |
| E-sign agreements with audit trail | Templates, hash, OTP, IP/device, sealed PDF | WORKFLOW | Y (737 signed; INV §1.5.4) | Core | Launch |
| Onboarding checklist + gated Activate | 100% gates; permissioned; accounting sync | WORKFLOW | P (Activate had no gates) | Core | Launch |
| Orientation classes + roster | Dates, capacity, attendance | WORKFLOW | N | Core | V2 |
| Travel itinerary + reminders + arrival | Legs, versions, acknowledge, reminders, no-show alert | WORKFLOW | P (built, 0 use; INV §1.1.2) | Core | Launch |
| Itinerary parsing from email/screenshot | Fills legs | HYBRID (AI reads) | N | Pro | V2 |
| Telegram/group hand-off bot | Recruiter group posts bookings; HR Q&A | HYBRID | P (light use, INV §1.1.6) | Pro | Later |
| Funnel by source / cost per hire | Join spend and leads | WORKFLOW (calculation) | P (1 account, 30 rows) | Core | Launch |
| Ad-spend import (CSV dry-run) + Meta read sync | Spend by day/campaign | WORKFLOW | P (CSV only) | Core (CSV) / Pro (sync) | Launch / V2 |
| Meta Pixel + CAPI | Feeds ad optimization | WORKFLOW | Y (80 events) | Core | Launch |
| Ask the funnel chat | Natural-language analytics | AI BOT Smart (multi-step reasoning) | N | Pro | V2 |
| Weekly recruiting brief + budget suggestions | Plain-language recommendations | AI BOT Smart | N | Autopilot | V2 |
| Driver behavior reports + Run now | Daily summary of messaging behavior | AI BOT Fast/Balanced | P (cron off, empty) | Pro | Later |
| Roles + route guards (recruiter role on home, tenant isolation) | Real guard on every route | WORKFLOW | N (INV §0, §7 #12) | Core | Launch |
| Duplicate-person merge (dock, reports) | Cluster by phone/email | WORKFLOW | P | Core | Launch |

## 5. AI bots in this department
Model names are from AMC section 6. Token counts are per run. All bots obey Rule 3: Test/Live per tenant, kill switch, audit log, quiet hours, escalation.

### Bot R1 — AI Text Assistant
- Trigger: inbound text, or workflow nudge due (missing doc, no reply 24h, interview reminder).
- Steps: (1) Fast triage classifies intent + STOP-intent; (2) workflow gates (Flow B step 2); (3) Balanced model drafts a reply from FAQ sheet + candidate facts; (4) validator checks: no promises outside the sheet, no pay figures not in the sheet, length ≤ 2 segments, no links except the tenant's; (5) send or queue for approval.
- Reads: lead profile, last 10 messages, FAQ/pay/home-time sheet, document checklist. Writes: message, activity, intent tag, next action.
- Human approval: Pro = every message is Suggest; Autopilot = Auto for template-class intents, Suggest for pay disputes, legal, complaints, "why was I rejected" (always human).
- Autonomy default: Core n/a; Pro Suggest; Autopilot Auto with owner-set limit (max 3 unreplied).
- Model: Fast = Gemini 3.1 Flash-Lite for triage; Balanced = Gemini 3.6 Flash for the reply (AMC §6); escalate to Claude Sonnet 5.5 if validator fails.
- Tokens: triage 500 in / 50 out; reply 2,000 in (prompt + sheet, cacheable) / 150 out.
- **Cost per inbound handled:** triage = 500×$0.25/1M + 50×$1.50/1M = $0.0002; reply = 2,000×$0.75/1M + 150×$3.75/1M = $0.0015 + $0.0006 = $0.0021. Total **$0.0023** [V prices, E tokens]. Outbound-only nudge (no triage) $0.0021.
- Saves: ANH sent 437 texts in the period; a recruiter spends about 1.5 minutes per text, so ~11 hours = about $220 at $20/hr; AI cost ≈ $1.

### Bot R2 — AI Voice Screening Caller
- Trigger/steps: Flow C. Reads candidate profile, screening script, FAQ sheet, call window. Writes call record, transcript, recording link, outcome, structured answers, next step, reply alert. Tool calls mid-call: send application-link text (gated, consent-checked), book callback, warm transfer.
- Human approval: none during the call (it only collects and informs; no offers, no approvals, no hiring decisions); a recruiter reviews every "qualified" before Approved. Autonomy: Autopilot only; default Suggest = calls only start when the recruiter taps **Call now** or approves the day's call list; Auto = bot dials per cadence.
- Model: **Voice tier** (AMC §6). Vendor options in the next subsection. Post-call summary uses Balanced Gemini 3.6 Flash: 4,000 in / 400 out = 4,000×$0.75/1M + 400×$3.75/1M = **$0.0045**.
- Typical run: 4 minutes (ANH: 229 calls, 135 completed; AMC assumes 5; I use 4 because screening calls that reach voicemail are short [E]).
- **Cost per call** (4 min, recommended Vapi cascade ≈ $0.12/min all-in incl. carrier) = **$0.48 + $0.0045 summary = $0.485** [E from V]. Dialing attempts that hit voicemail (≈30 seconds) cost $0.06.
- Saves: a human screening call is about 12 minutes including note-taking and no-answer retries ≈ $4.00 at $20/hr; saves ≈ $3.50 per completed screening. ANH scale (135 completed) ≈ $470 saved vs ≈ $65 voice cost.

### Voice-bot options for "Recruiting" (Bland vs Vapi vs ElevenLabs, from AMC Job 5)
Pricing and latency facts are straight from AMC Job 5 (vendor pages 2026-10-10); anything else is tagged [E].
| | Bland | Vapi (ANH uses today) | ElevenLabs Agents |
|---|---|---|---|
| Price/min | $0.14 Start ($0 fee) / $0.12 Build ($299/mo) [V] | ~$0.09–0.13 all-in cascade (hosting $0.05 + STT ~$0.01 + LLM $0.008–0.045 + TTS $0.015–0.024 + telephony ~$0.01) [V] | $0.08 + LLM cost (not stated on page) [V]; burst $0.16 [V]; my all-in guess ≈ $0.10 [E] |
| 4-min call | $0.56 / $0.48 + $299 fixed | $0.36–0.52 | ≈ $0.32–0.40 + LLM |
| 5-min call (AMC) | $0.60–0.70 plus telephony [V] | $0.45–0.65 [V] | $0.40 + LLM [V] |
| Latency | ~700–900 ms median (affiliate-interest source) and slower than Retell in one test [V] | tuned ~500–700 ms median [V] | ranking ~2.1 s, units unclear [V]; Flash TTS ~75 ms [V] |
| Control / tools | Most turnkey for outbound campaigns; page names no LLM/TTS, less control [V] | Bring your own STT/LLM/TTS; best transcripts, tool calls, handoff control [V] | Pick Claude/GPT/Gemini; strongest voices [V] |
| Voice quality | **Abdel liked the demo sound** (stated; I did not hear it) | Depends on the TTS chosen; with ElevenLabs Flash voices can sound very natural [E] | Best-in-class voice catalog and cloning [E] |
| Risk | Pricier, slower, lock-in, fixed $299 Build fee | Several moving parts to tune; ANH's webhook silently died on 30 Sep | Newest of the three for phone campaigns, latency unclear [V] |
| Multi-tenant fit | Per-tenant subaccounts [E, to verify] | Per-tenant assistants via API [E] | Per-tenant agents via API [E] |

**Recommendation.** (1) Default for launch = **Option R2-V: Vapi cascade (Deepgram STT + Claude Haiku 5.5/gpt-6-luna-class LLM + ElevenLabs Flash TTS)** — it matches AMC's Voice pick, keeps the existing ANH assistant and tools running, is cheapest of the three at full control, and the voice is chosen separately, so we can match what Abdel liked. (2) **Option R2-B: Bland** as the "premium turnkey" choice if the blind test (below) shows a clear sound preference and Abdel accepts roughly +$0.04–0.10/min, the $299/mo Build fee at 600+ minutes/mo, and less control. (3) **Option R2-E: ElevenLabs Agents** if voice quality matters most and latency tests hold. (4) Cost-saver for large tenants: Gemini Live (~$0.023/min [V]) once its tool reliability is proven. The product exposes this as a per-tenant "Voice engine" setting behind one internal interface so switching vendors is configuration, not a rebuild.
**Decision test (do before choosing):** 20 live calls per vendor to the same 10 volunteer drivers with the same script; score (a) "sounds human" 1–5 blind, (b) median response gap, (c) tool success rate (SMS link sent, transfer connected), (d) total cost per completed screening, (e) drop-offs before the first question. Cheap [E ≈ $25 per vendor].

### Bot R3 — Document Reader (CDL / medical card / ID / agreement uploads)
- Trigger: file arrives by form, MMS, or upload. Steps: Balanced model reads (type, name match, expiry, class/endorsements, legibility), validators compare to the application; low confidence → escalates to Sonnet 5.5; staff taps **Verify**. Writes: document type, extracted fields, flags. Autonomy: Suggest at all tiers (staff verify); auto-label OK in Pro+.
- Model: Balanced Gemini 3.6 Flash, escalate Sonnet 5.5; 6,000 in / 1,000 out = **$0.0083** [V AMC Job 1]; 15% escalation adds ≈ $0.0005 → use **$0.009**. Saves ≈ 2 minutes of staff checking (≈ $0.67) per document.

### Bot R4 — MVR/Report Reader (Pro, V2)
- Trigger: MVR/PSP report received. Reads the PDF; lists violations, accidents, license status; compares to the owner's criteria; outputs "meets / review / does not meet" with citations. Human Safety role decides (always).
- Model: Balanced Gemini 3.6 Flash, escalate Sonnet 5.5; 8,000 in / 1,200 out = $0.006 + $0.0045 = **$0.0105** [E tokens]. Saves ≈ 6 minutes ($2.00) per report.
- PII: SSN/DOB masked before the model call.

### Bot R5 — Funnel Analyst ("Ask the funnel") and Weekly Brief
- Trigger: user question (Pro) / weekly cron (Autopilot). Smart model Claude Sonnet 5.5, read-only tenant-scoped SQL, cached prefix.
- Question cost **$0.04** (AMC Job 4, cached) [V]; brief 15,000 in / 2,000 out = 15,000×$2/1M + 2,000×$10/1M = $0.03 + $0.02 = **$0.05** [V prices, E tokens].
- Autonomy: Suggest only; any budget change on an ad platform needs the owner's click.
- Saves: owner reading spreadsheets ≈ 1 hour/week ($30–60).

### Bot R6 — Adverse-Action / Legal Drafter (Pro V2)
- Trigger: a "Not approved" disposition. Smart model drafts the cover text in the owner's tone around the fixed FCRA templates; human reviews and sends. 1,500 in / 400 out = **$0.007** [V AMC Job 3]. Saves ≈ 10 minutes.

### Bot R7 — Itinerary Parser (Pro V2)
- Reads pasted confirmation email/screenshot into trip legs. Balanced; 6,000 in / 1,000 out = **$0.0083**. Saves ≈ 4 minutes per trip.

### Bot R8 — Driver Behavior Reporter (Later)
- Daily batch summary of each active driver's messages; Fast Gemini 3.1 Flash-Lite via Batch (50% off): 3,000 in / 300 out ≈ $0.0012 per driver [E]. Owner-visible only, never used automatically for firing.

## 6. Tier matrix
| Feature / bot | Core | Pro | Autopilot |
|---|---|---|---|
| Form, pipeline, urgency, profile, inbox, e-sign, onboarding, travel, funnel analytics (workflows) | ✓ | ✓ | ✓ |
| Template SMS sequences (non-AI) | ✓ (500 segments/mo) | ✓ (2,000) | ✓ (6,000) |
| STOP/consent ledger, quiet hours, 10DLC wizard, take-over | ✓ | ✓ | ✓ |
| R1 AI Text Assistant | — | Suggest, 1,500 AI messages/mo | Auto or Suggest, 6,000/mo |
| R2 AI Voice Caller | — | — (preview with dollars) | ✓ 600 min/mo (≈ 150 calls) |
| R3 Document Reader | limited: 25 docs/mo | 100 docs/mo | 400 docs/mo |
| R4 MVR/PSP Reader + vendor integrations | manual entry only | ✓ 30 reports/mo | ✓ 100/mo |
| R5 Ask the funnel | — | 50 questions/mo | 300 questions/mo |
| R5 Weekly brief + budget suggestions | — | 4 briefs/mo (no suggestions) | 30 runs/mo |
| R6 Adverse-action drafter | — | 20/mo | 60/mo |
| R7 Itinerary parser | — | 20/mo | 100/mo |
| R8 Behavior reports | — | ✓ (daily, 30 drivers) | ✓ (daily, 100 drivers) |
| Meta Ads read-only sync | CSV only | ✓ | ✓ |
| Autonomy switch (Off/Suggest/Auto) | n/a | Off/Suggest | Off/Suggest/Auto |
Upsell previews to build in: locked "Calls today" card in Pro showing "11 candidates replied to nothing for 48h; the AI caller would have reached ~7 of them (≈ $4.20 in calls)"; Core inbox shows "AI could have answered 31 of 40 replies this week"; usage meter on Settings shows minutes/messages/dollars with a compare table.

## 7. Cost to run at each tier's MAX caps (monthly, one tenant at ANH-like scale)
Unit costs: R1 $0.0023/message [V+E]; R2 $0.12/min voice all-in [E from V] + $0.0045 summary per call at 4 min per call; R3 $0.009/doc; R4 $0.0105/report; R5 question $0.04, brief $0.05; R6 $0.007; R7 $0.0083; R8 $0.0012 per driver-day.
| AI feature | Core cap | Pro cap | Autopilot cap | Unit cost | Core $ | Pro $ | Autopilot $ |
|---|---|---|---|---|---|---|---|
| R1 AI text messages | 0 | 1,500 | 6,000 | $0.0023 | 0 | 3.45 | 13.80 |
| R2 voice minutes | 0 | 0 | 600 | $0.12 | 0 | 0 | 72.00 |
| R2 post-call summaries | 0 | 0 | 150 | $0.0045 | 0 | 0 | 0.68 |
| R3 documents | 25 | 100 | 400 | $0.009 | 0.23 | 0.90 | 3.60 |
| R4 reports | 0 | 30 | 100 | $0.0105 | 0 | 0.32 | 1.05 |
| R5 questions | 0 | 50 | 300 | $0.04 | 0 | 2.00 | 12.00 |
| R5 briefs | 0 | 4 | 30 | $0.05 | 0 | 0.20 | 1.50 |
| R6 adverse drafts | 0 | 20 | 60 | $0.007 | 0 | 0.14 | 0.42 |
| R7 itinerary parses | 0 | 20 | 100 | $0.0083 | 0 | 0.17 | 0.83 |
| R8 behavior reports (driver-days) | 0 | 900 | 3,000 | $0.0012 | 0 | 1.08 | 3.60 |
| **AI subtotal** | | | | | **$0.23** | **$8.26** | **$109.48** |

Non-AI variable costs this department drives (unit prices [E], verify with provider):
| Item | Unit price | Core (cap) | Pro (cap) | Autopilot (cap) |
|---|---|---|---|---|
| SMS segment (carrier + 10DLC surcharge + provider) | $0.012 all-in [E] | 500 → $6.00 | 2,000 → $24.00 | 6,000 → $72.00 |
| Voice minutes (counted above in R2) | included | — | — | — |
| Phone number (SMS/voice) | $1.15/mo [E] | $1.15 | $1.15 | $2.30 (SMS + voice line) |
| 10DLC brand + campaign (pass-through) | brand $4.50 one-time; campaign about $15/mo [E] | $15 | $15 | $15 |
| Storage (CDL photos, recordings, signed PDFs) | $0.023/GB-mo [E]; Core 5 GB, Pro 20 GB, Autopilot 100 GB (recordings) | $0.12 | $0.46 | $2.30 |
| Email (approval, e-sign, reminders) | $0.0009/email [E]; 1,000 / 3,000 / 8,000 | $0.90 | $2.70 | $7.20 |
| MVR report (vendor, pass-through to tenant) | $6–15 per report [E, unverified] | tenant pays | tenant pays | tenant pays |
| PSP report | about $10 per report [E, unverified] | tenant pays | tenant pays | tenant pays |
| Clearinghouse query | FMCSA fee per query billed by FMCSA/C-TPA [unverified] | tenant pays | tenant pays | tenant pays |
| Meta CAPI, pixel | $0 | 0 | 0 | 0 |
| **Non-AI subtotal (excl. vendor checks)** | | **$23.17** | **$43.31** | **$98.80** |
| **Total at max caps** | | **$23.40** | **$51.57** | **$208.28** |
Notes: the Autopilot voice figure assumes cap use; typical use is 40–60% of caps, so expect about $110–130. Vapi hosting adds no fixed fee; if Bland Build is chosen add $299/mo (breakeven versus Start pricing at 14,950 minutes, so Build is never cheaper below the cap here: 600 min × $0.02 saving = $12 versus $299 fee; use Start). ElevenLabs/Vapi platform fees are inside the $0.12/min estimate. Compare to AMC §7's voice line: 400 min × $0.11 ≈ $44, consistent.

## 8. Parity checklist (every ANH feature with real use mapped; nothing silent)
Usage numbers from INV §6.
| ANH feature (INV ref) | Usage | Where in the new design |
|---|---|---|
| /recruiting + /hr workspace, 4+6 tabs (§0, §1.1) | daily; 181 leads | /recruiting (Needs me, Pipeline, Inbox, Nurture, Travel, Calls, Analytics, Form, Settings) and /hr |
| Index HR view for management roles; deep link `?lead=` (§0, §5 #2) | bell + toasts | Candidate route /recruiting/c/:id works for any role with permission |
| Candidate list columns, sort, resize, localStorage widths, split (§1.1.1) | daily | Pipeline list; widths/split saved per user (in a user-preferences capability, not localStorage only) |
| Search, scope (Needs me / Active / Closed), filters (stage, owner, experience, language, replied) (§1.1) | daily | Pipeline filters; Clear keeps date range |
| Metric cards with %, range select (§1.1 #19-20) | daily | Pipeline header cards |
| Board (read-only) (§1.1 #11) | occasional | Draggable board (improved) |
| Nurture sub-view (§1.1 #2) | automation active | /recruiting/nurture |
| Add candidate dialog (§1.1.9) | occasional | Add candidate, saving every field (fixes silent loss) |
| Detail panel header, expand/close (§1.1.2) | daily | Candidate profile |
| Stage select, 17 stages (§1.1.2 #3) | 127 changes | Stage control, same stages, with enforced approval gate |
| Owner select + activity row (§1.1.1 #5) | 53 changes | Owner select + activity |
| Text / Call now buttons (§1.1.2 #5-6) | 4 / 1 uses | Composer / Call now (Autopilot); same gates |
| Take over / Resume assistant (§1.1.2 #8) | 18 leads paused | Take over / Resume, plus banner |
| Messages timeline with SMS/calls/notes, attachments, recording play, transcript (§1.1.2) | daily | Conversation tab |
| Internal notes (§1.1.2 #4) | 80 notes | Notes in the timeline |
| Activity tab with "previous system" notes (§1.1.2) | daily | Activity tab (legacy notes imported read-only) |
| Checks tab: MVR / Clearinghouse approve/reject with notes (§1.1.2) | never used | Checks tab (now with vendor integrations V2; manual stays) |
| Hired / Arrived / Started driving buttons with gates (§1.1.2 #4) | never used | Replaced by stage + outcome confirmations inside Onboarding/Travel; same gates (experience, MVR, Clearinghouse) kept |
| Documents tab, Open file with 120-second link (§1.1.2) | 225 docs | Documents tab; adds Verify button and classification (fixes gap) |
| Travel tab: versions, legs, acknowledgement (§1.1.2) | 0 uses (status used instead) | Travel tab and /recruiting/travel, simplified to the real workflow (status + arrival date + optional legs) |
| Details tab: profile edit (37 fields), read-only form, experience editor with confirm and audit (§1.1.2, §4.4) | 0 profile edits; experience edits audited | Details tab, same fields, same role rule for changing experience, written to audit |
| Channels on file, application links list (§1.1.2) | 22 links | Details tab |
| SMS inbox view (by candidate / all, New reply) (§1.1.4) | daily (broken inbound) | /recruiting/inbox |
| Travel arrivals 3 cards (§1.1.5) | occasional | /recruiting/travel |
| Telegram hand-offs, registrations, confirm booking (§1.1.6) | 10 replies, 0 handoffs | Kept as optional "Group chat bridge" integration, Pro, Later |
| AI calling card + recent calls + call pattern (§1.1.7) | 229 calls | /recruiting/calls |
| Marketing performance: funnel, cost per X, reply speed, geography, attribution, drill-down (§1.1.8) | 1 account, 30 spend rows | /recruiting/analytics |
| Ad accounts card, spend CSV import with dry run (§1.1.8 #7-10) | 1 import | Same, plus Meta read-only sync (Pro) |
| Automation tab: master/practice/SMS/social/voice switches, candidates list, attachments, scheduled actions (§1.2) | live | Settings & compliance + Automation panel; Test/Live, kill switch, per-channel switches; DB-only settings (quiet hours, caps, bonus, link TTL, voice person) are now editable |
| Facebook/Instagram reply channel (`outbound_social_enabled`) (§1.2) | enabled | Later: social DMs through the inbox (Meta messaging API); flag kept in settings, marked "V2" |
| Form tab: copy link, embed, signup link, preview (§1.3) | occasional | /recruiting/form (adds QR) |
| Settings tab: GHL import, criteria cards, Meta pixel id (§1.4) | static / no-op | Settings: real integration status; criteria are the live rules engine; pixel id actually used; "GHL import" becomes authenticated CSV/API import |
| HR Behavior tab (§1.5.1) | 0 rows | /hr/behavior with Run now (Later, Pro) |
| Assets: Drivers/Trucks/Trailers (§1.5.2) | daily | Lives in Fleet/Assets blueprint; HR sees Drivers and onboarding tabs; Clear filter fixed |
| Add Driver Wizard, 10 steps, financial steps by role (§1.5.2, §4.2) | staff | Same wizard in Onboarding (staff entry); sensitive steps need payroll permission; SSN/bank encrypted |
| Pending Activation queue + Review + Reject + Activate + QuickBooks vendor sync + password reset (§1.5.3) | 12 pending | /hr/onboarding; Activate gated; accounting sync event to the Accounting module; invite replaces password reset |
| DriverProfileDialog Docs tab + RecruitingDocumentsCard + SignedAgreementsCard (§1.5.4) | 737 signed | Driver profile (Fleet blueprint) Documents + Agreements views |
| E-sign view: IP, device, signature image, x/7 badge (§1.5.4) | 737 | E-sign audit view, hash, PDF, progress badge |
| /apply public form with all fields and attribution (§1.6, §4.1) | 42 completed | /apply |
| Driver paperwork wizard `/driver-signup/:token` (§1.7) | broken, 0 linked | Flow E |
| Global SMS dock with beep, toast, bubbles, auto mark-read, attachment viewer, Enter-to-send (§1.8) | 172 sms_sent | Reply dock; sends through gated composer only; viewer without Google Docs |
| Reply alerts bell, Mark all read, deep link (§1.9) | 63 alerts | Bell + inbox |
| Orphaned override dialog / assign-truck-to-lead (§1.10) | 0 | Truck assignment moved into Onboarding checklist step "Equipment"; override dialog dropped: replaced by "Approve with reason" (audited) by the Safety role |
| Cron: outbound worker backstop, attachment worker, behavior analysis (§2.1) | 576 runs/48h | Queue worker with heartbeat; attachment worker kept; behavior cron optional |
| Triggers: experience gate, screening, enrol on application, application-ack, auto-pause at MVR stage, cancel on inbound/takeover/consent change, stop on failed screen (§2.2) | live | Workflows in the rules engine; each logged |
| Edge functions list (§2.3): outbound worker, manual send/call, recording, automation status, approval sms, ghl-webhook, inbound, upload doc, meta-capi, vapi webhook/tools, telegram, quickbooks | live | Rebuilt as authenticated tenant-scoped services; provider (GHL→direct SMS provider with 10DLC; Vapi→voice engine interface) replaceable |
| Integrations: GHL, Vapi, ElevenLabs/Twilio, Telegram, Meta, Storage, Auth, QuickBooks (§3) | live | SMS/voice provider interface, Meta, storage, auth, accounting sync; Telegram optional |
| Hidden features 1-20 (§5): urgency, deep link, sounds, auto mark-read, duplicate merge, saved UI state, auto-pause, STOP, ack SMS, rules, experience gate, CAPI dedupe, 24h window, token link, QB sync, embed code, password reset, spend dry run | various | All mapped above; #16 hard-coded email dropped (replaced by a financial-access permission), #13 24h edit window replaced by resume-same-lead, #10 one rules engine |
| Dropped: `recruiting-welcome-sms` (retired), legacy `recruiting_calls`, legacy `recruiting_background_checks`, Behavior placeholder status text, Settings "Connected" badges | — | dropped: dead or fake |

## 9. NEW features beyond ANH (better than Alvys-class TMSs)
1. **Compliance-first recruiting:** consent ledger, shared STOP across SMS+voice, nightly synthetic STOP test, per-candidate-local quiet hours, 10DLC wizard with proof pack. Most TMSs have no recruiting at all.
2. **Hiring gate you can trust:** approval cannot be set until experience + MVR + PSP + Clearinghouse are recorded; missing items listed.
3. **One timeline, three channels:** SMS, AI calls, notes with recording playback and AI summaries.
4. **Money view:** cost per applicant / approval / hire / start by ad and by state; weekly brief suggesting where to move budget.
5. **Warm transfer + callback booking** from the voice bot to the on-duty recruiter.
6. **Secure onboarding:** single-use link, OTP, envelope-encrypted SSN/bank, sealed e-sign PDFs with audit certificates, no unauthenticated activation.
7. **Orientation planner:** class capacity, roster, no-show alerts, travel reminders.
8. **Voice-engine switch:** per-tenant Vapi / Bland / ElevenLabs / Gemini Live behind one interface plus a built-in A/B test tool.
9. **Candidate reactivation:** workflow resurfaces past applicants when a new class opens ("12 past applicants fit your next orientation").
10. **Referral program:** driver referral links, bonus tracking (the ANH offer has a $2,000 sign-on bonus paid over 6 months; bonus installments tracked and paid via payroll).
11. **Spanish/Arabic AI conversations** (ANH tracks preferred language): the text and voice bots answer in the candidate's language from the same FAQ sheet.
12. **Candidate-facing status page** (no login, link by text): "Documents received, MVR in progress, orientation Oct 21".

## 10. Open questions for Abdel
1. **Sound:** should I schedule the 20-call blind test (Bland vs Vapi + ElevenLabs voice vs ElevenLabs Agents) before locking the launch voice? Please also confirm what you liked in the Bland demo (voice timbre, pacing, or the filler words) so I can match it.
2. **Background-check vendors:** do you already have accounts for an MVR/PSP vendor or a Clearinghouse C/TPA, or should I shortlist vendors and prices (my price lines are unverified estimates)?
3. **Product scope:** is Recruiting a separate paid add-on (Spec §8 said "Add-on") or included in Pro/Autopilot as drawn here? That changes the tier matrix.
4. **AI outreach policy:** are you comfortable with the AI disclosing itself as an AI on every call and with recording on by default (two-party-consent states), and with first call only 30 minutes after the first text? A lawyer should review TCPA/A2P wording before Live.
5. **Activation payroll rule:** should Activate also create the payroll/accounting vendor automatically (as ANH did to QuickBooks), or wait for an Accounting approval step?
