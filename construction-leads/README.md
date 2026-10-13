# Construction lead-to-contract pipeline

Meta/Google ads → lead → booked free estimate → recorded site visit → internal quote
(materials + labor + margin) → customer signs + pays deposit → in-house or subcontractor job.

Zero dependencies. Needs Node 22.5+ (uses the built-in SQLite).

```
npm start          # http://localhost:3000   (seeds a starter price book + 2 estimators)
npm test           # 19 tests: quote math + the whole funnel end to end
```

## The pipeline

```
 Meta Lead Ads ──┐
 Google Lead Form ├─► /webhooks/*  ─┐
 Landing page ────┘   /api/leads   ─┼─► LEAD ──► book.html (self-serve slots)
                                     │      │
                         5 min, no booking, consented?
                                     │      ▼
                                     │   AI voice agent calls ─► books via /api/voice/*
                                     ▼
                     APPOINTMENT (auto-assigned to a free estimator, recording notice sent)
                                     ▼
   /tech.html (phone): read consent script ─► consent ─► record audio ─► measure rooms ─► photos ─► submit
                                     ▼
        transcribe (ElevenLabs STT) ─► AI drafts scope + suggested price-book lines (Claude)
                                     ▼
   /admin.html QUOTE BUILDER: price-book lines × measurements ─► cost ─► margin ─► price (live preview)
                                     ▼
   customer link /quote.html?t=…: sees scope + price only ─► signs ─► contract (hash stored) ─► deposit (Stripe)
                                     ▼
   JOB: awaiting_deposit ─► rescission_period (3 business days) ─► ready ─► scheduled ─► in progress ─► complete
        assigned in-house OR to a subcontractor (with sub bid, margin re-computed)
```

## Pages

| URL | Who | What |
|---|---|---|
| `/` | public | Landing page + lead form (UTM / gclid / fbclid captured) |
| `/book.html?lead=&k=` | lead | Slot picker (links go out by SMS/email) |
| `/tech.html#<token>` | estimator | Consent script, recorder, measurements, photos |
| `/admin.html` | you | Pipeline, lead detail, quote builder, jobs, price book, subs, team, message log |
| `/quote.html?t=<token>` | customer | Review, sign, pay deposit |

Set `ADMIN_TOKEN` (the admin page prompts for it once). Each estimator gets a private link under **Team**.

## How the quote is priced (`server/quote-engine.js`)

```
materials   = Σ qty × (1 + waste) × material $/unit
labor       = Σ qty × labor hrs/unit × labor rate × (1 + burden)     (or the sub's bid on that line)
direct      = materials + labor + subs + other
cost        = direct × (1 + contingency) × (1 + overhead)
sell price  = cost ÷ (1 − margin)          ← margin is of the SELL price
total       = sell price + permit (no margin) + sales tax on the material share
deposit     = total × deposit %            (capped by state law, see below)
```

- A 25% margin means 25¢ of every sell dollar is gross profit. A 25% *markup* only yields 20%.
  The builder shows the effective margin live so you can see exactly what you're earning.
- Customers only ever see scope lines at sell price. Cost, hours, margin and sub bids never leave the server (tested).
- Sent quotes can't be silently changed after signing. Quotes lock on approval; use a new quote/change order.
- **Replace the seeded price book** (Price book tab) with your real supplier costs and crew productivity. The seeded numbers are placeholders.

## Setup, in order

1. `cp .env.example .env`, fill in company info, `PUBLIC_URL`, `ADMIN_TOKEN`, **`COMPANY_STATE`**, `COMPANY_TZ`.
2. Deploy anywhere that runs Node with a persistent disk (Fly.io, Railway, Render, a VPS). Persist `DATA_DIR` (DB + recordings). HTTPS is required for the technician's microphone.
3. **Meta Lead Ads:** create an app, subscribe the Page to `leadgen`, webhook URL `https://YOU/webhooks/meta`, set `META_VERIFY_TOKEN`, `META_APP_SECRET`, and a long-lived Page token in `META_PAGE_TOKEN`. Name your form fields `full_name`, `phone_number`, `email`, `zip_code` (standard).
4. **Google Ads:** lead form extension → webhook `https://YOU/webhooks/google-leads`, set the same key in `GOOGLE_LEAD_KEY`.
5. **Voice agent:** in ElevenLabs Agents, paste `voice-agent/prompt.md`, buy/import a Twilio number, add the 4 server tools below, set `ELEVENLABS_*` and `VOICE_TOOL_SECRET`.
6. **Quote intelligence:** `ANTHROPIC_API_KEY` turns transcripts + measurements into a draft scope with suggested price-book lines. Without it, everything still works, you just pick lines by hand.
7. **Deposits:** `STRIPE_SECRET_KEY`, and a Stripe webhook to `https://YOU/webhooks/stripe` for `checkout.session.completed` → `STRIPE_WEBHOOK_SECRET`. Without Stripe, use "Mark deposit paid (offline)".
8. **Messages:** `TWILIO_*` (SMS) and `RESEND_API_KEY` (email). Until set, messages are only logged (Admin → Messages) so dev never texts real people.
9. Open **Team**, send each estimator their link. Add real subcontractors with license + insurance dates.

## Voice agent tools (ElevenLabs "server tools"; all send header `x-tool-secret: <VOICE_TOOL_SECRET>`)

| Tool | Method + URL | Body |
|---|---|---|
| `check_availability` | `GET /api/voice/availability` | none → `{slots:[ISO…]}` |
| `book_appointment` | `POST /api/voice/book` | `{lead_id, start, address, email}` (lead_id arrives as the `lead_id` dynamic variable) |
| `update_lead` | `POST /api/voice/update-lead` | `{lead_id, scope, ownership, timeline, budget, other_quotes}` |
| `log_outcome` | `POST /api/voice/outcome` | `{lead_id, outcome: booked\|callback\|voicemail\|not_interested\|do_not_call}` |

`do_not_call` permanently flags the lead and blocks all calls and texts.

## Compliance and legal: read before going live

These are the things that can actually get a contractor sued or fined. The code enforces what it can; the rest needs your attorney.

1. **Recording the visit.** Many states (e.g. CA, FL, IL, MD, MA, PA, WA) require **all-party** consent. The system: (a) tells the customer in the booking page, T&Cs and confirmation message, (b) makes the estimator read a consent script and log who agreed, (c) **the server refuses to accept audio until consent is recorded**, and (d) lets the customer decline, in which case the estimator takes notes by hand. Consent is stored per visit.
2. **Calling leads with an AI voice.** Requires prior express written consent (TCPA). Only leads who ticked the consent box on *our* form are auto-called. **Leads from Meta/Google forms are ingested with consent = NO**: they get the booking link and show up as "needs human call". If you add a consent line to those forms' disclosures, you can switch it on. The agent also discloses it's AI, calls only 8am–8pm, and honors DNC instantly. Scrub against the National DNC registry and check state rules.
3. **Deposit caps.** Many states limit home-improvement down payments. California is the lesser of 10% or $1,000, which the engine enforces when `COMPANY_STATE=CA`. **Your 10–15% idea is illegal as-is in CA.** For every other state, check the cap and set deposit % accordingly. Milestone payments are the usual way to collect more up front without breaking the cap.
4. **Right to cancel.** Contracts signed at the customer's home generally carry a 3-business-day cancellation right (FTC rule + many state laws). The contract states it, the system records the window, and **jobs can't be scheduled or started until it expires** and the deposit has cleared.
5. **Licensing.** Contractor license number must typically appear on ads, contracts and your site. Subcontractors must be licensed and insured; verify before assigning.
6. **Contract text** (`server/contract.js`) is a **starter template**. A construction attorney must replace it with state-compliant language (required notices, lien rights, warranty, dispute resolution).
7. **Data.** Recordings and signatures are sensitive. Keep `DATA_DIR` on encrypted storage, back it up, and set a retention policy.

## Known limits (v1)

- Recording is uploaded when the estimator taps Stop, so record the conversation in one segment. A phone crash mid-recording loses it.
- Single company, single timezone, admin is one shared token. Add real user accounts before giving staff separate access.
- No change-order or progress-billing flow yet; milestone invoices are the natural next module.
- The availability model is estimator-based with fixed 90-minute slots (Mon-Sat 8-6); edit `booking` in `server/config.js`.
