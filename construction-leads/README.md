# Construction lead-to-contract pipeline + subcontractor marketplace

Meta/Google ads → lead → booked free estimate → recorded site visit → internal quote
(materials + labor + margin) → customer signs + pays deposit → in-house or subcontractor job.

Zero dependencies. Needs Node 22.5+ (uses the built-in SQLite).

```
npm start          # http://localhost:3000   (seeds a starter price book + 2 estimators)
npm test           # 28 tests: quote math, settlement math, the whole funnel, and the marketplace
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
   JOB (deposit paid) ─► auto-posted to the SUBCONTRACTOR BOARD ─► eligible sub claims it ─► customer details unlock
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


## Subcontractor marketplace (`/sub.html`)

Service area is **New York and New Jersey** (ZIP-routed; out-of-area leads are saved but never booked or called).

**Flow:** sub applies (license, insurance, trades, ZIP coverage) → you review and **approve** → they **subscribe**
($50-60/mo via Stripe) → when a customer signs and the deposit clears, the job is **auto-posted** →
an eligible sub **claims** it (first come, atomic: two subs racing gives exactly one winner) →
customer name, phone and address unlock for that sub only.

**Revenue model:** monthly subscription + a **flat fee per claimed job** (no percentage). Set `SUB_MONTHLY_PRICE` and `SUB_FLAT_FEE`;
you can override the fee and award price per job in Admin → Marketplace before it's claimed. The fee is added to the sub's next Stripe invoice (and always logged in the ledger).

**What subs see before claiming:** trade, ZIP3 area ("105xx"), scope lines and quantities, room measurements, customer wishes, award price, fee, net.
**Never:** customer name/phone/address, the contract price, your margin (tested). The award price defaults to your direct cost + contingency; edit it per job.

**Who can claim** (enforced server-side): account approved · subscription active · liability insurance not expired · covers the state and ZIP prefixes · trade matches
(or the sub has "general"). A sub can't be assigned or start work until the deposit is paid **and** the customer's cancellation window has closed.

### Money flow: the two modes (`SUB_PAYMENT_MODE`, switchable per job)

Example: $20,000 job, $2,000 deposit, sub award price $14,000, flat fee $150. Your profit is **$6,150 in both modes** (price − award + fee, before tax pass-through).

| | `direct_balance` (your plan) | `platform_collects` |
|---|---|---|
| Customer pays the platform | $2,000 deposit | $20,000 |
| Customer pays the sub | $18,000 balance | nothing |
| Sub is entitled to | $13,850 (award − fee) | $13,850 |
| Settlement | **Sub remits $4,150 to you** | You pay the sub $13,850 |

**Read this before choosing `direct_balance`.** The balance the customer pays the sub includes *your margin*. So:
1. **Credit risk is yours.** If the sub keeps the money, you chase them for $4,150. You hold only the deposit, and a legal 10-15% deposit often can't cover your share.
2. **The sub sees the full contract price** when they invoice the customer, so your margin isn't hidden.
3. **The contract and lien law get complicated.** The customer contracts with *you*; paying the sub directly needs a clear direction-to-pay clause (a draft is in the contract template for your attorney).
My recommendation: use `platform_collects` with milestone payments (the sub is paid after you collect), or at minimum require a signed remittance agreement and withhold fees from the sub's next payouts. The ledger records `sub_remittance_due` / `sub_payout_due` when a job completes, and the admin screen shows the sub's remittance exposure per job.

### NY / NJ: confirm with an attorney before launch
Not legal advice. These are the issues to put in front of a NY/NJ construction lawyer:
- **Licensing.** NYC requires a home improvement contractor license (DCWP); several NY counties (e.g. Westchester, Nassau, Suffolk, Rockland, Putnam) have their own; NJ requires home improvement contractor registration with Consumer Affairs, and plumbers/electricians are separately licensed. Decide whether *you* are the licensed contractor of record (most likely, since the customer signs with you) and what you require of subs. Admin approval is where you check licenses; the system only stores the number, state and insurance date.
- **Your liability.** You contracted with the customer, so you are responsible for the sub's work. Require a certificate of insurance naming you as additional insured, and consider workers' comp proof.
- **Trust-fund and lien rules.** NY (and NJ) have rules on how contractors must handle owner payments and pay subs. Deposit handling and the remittance flow above should be reviewed against them.
- **Deposit limits and the 3-day cancellation right** in both states. No NY/NJ deposit cap is hard-coded (the engine warns); the cancellation window is enforced.
- **Worker classification.** NY is strict about independent contractor vs employee. Terms, control and exclusivity matter.
- **Fees to subs** for access to work, and whether the platform is a referral service, a staffing arrangement, or a general contractor, can change your licensing and tax treatment.

Config keys: `SUB_MONTHLY_PRICE`, `SUB_FLAT_FEE`, `SUB_PAYMENT_MODE`, `AUTO_PUBLISH_JOBS`.
Stripe additionally needs webhook events `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.paid`.

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
- Single company (not yet multi-tenant: other construction companies can't run their own pipeline on it), single timezone, admin is one shared token.
- One sub per job. A multi-trade job (e.g. kitchen + roof) goes to a single claimer; splitting a job by trade is a next step.
- No sub ratings, reviews, bidding or messaging yet. Jobs are first-come at a fixed award price.
- Sub password reset and email verification aren't built yet.
- No change-order or progress-billing flow yet; milestone invoices are the natural next module.
- The availability model is estimator-based with fixed 90-minute slots (Mon-Sat 8-6); edit `booking` in `server/config.js`.
