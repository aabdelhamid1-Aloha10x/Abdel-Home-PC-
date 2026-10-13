# Construction lead-to-contract pipeline + subcontractor auction marketplace

Meta/Google ads → lead → booked free estimate → recorded site visit → **estimate with a short-phase plan** (the budget ceiling) →
customer approves the plan → **reverse auction among vetted subs** → customer accepts the best bid and signs **with the winning sub** →
pays phase 1 → sub confirmed → phase-by-phase: customer funds, sub works, customer approves, platform pays the sub (fee withheld).
The platform is the marketplace and payment administrator, not the contractor. See `docs/bond-and-structure.md`.

Zero dependencies. Needs Node 22.5+ (uses the built-in SQLite).

```
npm start          # http://localhost:3000   (seeds a starter price book + 2 estimators)
npm test           # 32 tests: quote and phase planning, fee/schedule math, the whole funnel, the auction rules and the payment gates
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
   /admin.html QUOTE BUILDER: price-book lines × measurements ─► budget ceiling + SHORT-PHASE PLAN (live preview)
                                     ▼
   customer link /quote.html?t=…: reviews the plan + budget ─► approves ─► AUCTION opens (24-96h, anti-sniping)
                                     ▼
   /sub.html: vetted subs BID at or below the budget ─► best eligible bid is OFFERED to the customer
                                     ▼
   customer accepts + signs WITH THE WINNING SUB ─► pays phase 1 (<= 10%) ─► cleared ─► sub CONFIRMED, details unlock
                                     ▼
   per phase: customer funds ─► sub starts ─► photos + lien waiver ─► customer approves ─► platform pays sub (fee withheld)
   JOB: bidding ─► awaiting_deposit ─► rescission_period (3 business days) ─► ready ─► in progress ─► complete
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


## Subcontractor auction marketplace (`/sub.html`)

Service area is **New York and New Jersey** (ZIP-routed; out-of-area leads are saved but never booked or called).

**Flow:** sub applies (license, insurance, trades, ZIP coverage) → you review and **approve** → they **subscribe** ($50-60/mo via Stripe) →
the customer approves a project plan → an **auction** opens on the board → eligible subs **bid** → the lowest eligible bid is **offered** to the customer →
the customer **accepts and signs the contract with that sub** and pays phase 1 → the sub is **confirmed** and the customer's details unlock → phases run.

**The estimate becomes a phase plan.** Every quote is split into short phases automatically (`server/phases.js`): lines are ordered by construction stage
(demo, rough-in, main install, finishes), packed into phases of at most N crew-days and M% of the price (defaults 5 days, 25%), a large line is split across
phases, the **first payment is capped (default 10%)** and 10% is held as final retainage. The customer funds each phase before it starts, so cash flows continuously.
The quote's price is the **budget ceiling**: no bid can exceed it.

**Auction rules** (`marketplace.placeBid`): bids at or below the ceiling and at or above a floor (default 60%, stops "too good to be true" lowballs);
open auction (best bid visible, other bidders anonymous; `AUCTION_SEALED=1` hides it); a new bid must beat the best by a minimum decrement (default 1%);
a sub can only lower their own bid; a bid in the last 15 minutes extends the clock (max 4 times); bids are binding; default window 48h (customer picks 24-96h).
If the customer declines, or lets the offer lapse (72h), the **runner-up** gets the offer. You can re-open, extend, change ceiling/floor/fees, or offer a specific bidder.

**Revenue:** a **sub fee** (default 5% of the winning bid, `SUB_FEE_PCT`, withheld from payouts, never invoiced) plus an optional **customer fee**
(`CUSTOMER_FEE_PCT`, itemized in the contract). Both adjustable per auction until awarded. **At 5% alone the model loses money per job at typical lead costs; read
`docs/bond-and-structure.md` section 5** (break-even take is roughly 12-19% for $17-28K jobs at $165/lead). The admin screen flags auctions whose fees cannot cover `ACQ_COST_ESTIMATE`.

**What subs see before bidding:** trade, ZIP3 area, scope, phases with durations and shares, measurements, customer wishes, the budget, the best bid and bid count.
**Never:** customer name/phone/address until the job is confirmed (they win AND the customer funded phase 1).

**Who can bid** (enforced server-side): approved · subscription active · liability insurance current · covers the state and ZIP prefixes · trade matches (or "general").
No work starts until phase 1 has cleared **and** the customer's 3-business-day cancellation window has closed.

### Money flow: phases, funded first, platform pays per approved phase
Example: winning bid $40,000, 5% sub fee, 3% customer fee, 5 phases. The customer pays $41,200 in total through the platform (ACH preferred: $5 vs ~$290 per $10K by card):
1. Customer accepts, signs with the winning sub, pays **phase 1** (<= 10%). It clears (card, or ACH after the bank debit settles) → **only now is the sub committed.**
2. Cancellation window closes. The sub starts phase 1; uploads photos + a lien waiver; submits. The next phase is invoiced to the customer.
3. The customer approves (silence = approved after 72h; a dispute freezes just that phase). Payout = phase gross minus the 5% fee, via Stripe Connect transfer or recorded as due in the ledger.
4. Repeat. **No phase starts unfunded, and the sub is never paid more than the customer has already paid in** (checked in code).

See **[docs/payment-enforcement.md](docs/payment-enforcement.md)** (enforcement on customer and sub, abuse cases),
**[docs/bond-and-structure.md](docs/bond-and-structure.md)** (bond costs, who sells them, the licensing and fund-holding questions of "not being the contractor", fee economics) and
**[docs/feasibility-study.md](docs/feasibility-study.md)** (competitors, structures, risks, sources). `node docs/unit-economics.js` reproduces the economics.

Config keys: `SUB_MONTHLY_PRICE`, `SUB_FEE_PCT`, `CUSTOMER_FEE_PCT`, `ACQ_COST_ESTIMATE`, `AUCTION_HOURS`, `ACCEPT_HOURS`, `AUCTION_SEALED`, `AUTO_APPROVE_HOURS`.
Stripe needs webhook events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.paid`, and Stripe Connect (Express) for sub payouts.

### NY / NJ: confirm with an attorney before launch
Not legal advice. These are the issues to put in front of a NY/NJ construction lawyer:
- **Licensing.** NYC requires a home improvement contractor license (DCWP); several NY counties (e.g. Westchester, Nassau, Suffolk, Rockland, Putnam) have their own; NJ requires home improvement contractor registration with Consumer Affairs, and plumbers/electricians are separately licensed. Decide whether *you* are the licensed contractor of record (most likely, since the customer signs with you) and what you require of subs. Admin approval is where you check licenses; the system only stores the number, state and insurance date.
- **Your liability.** You contracted with the customer, so you are responsible for the sub's work. Require a certificate of insurance naming you as additional insured, and consider workers' comp proof.
- **Trust-fund and lien rules.** NY (and NJ) have rules on how contractors must handle owner payments and pay subs. Deposit handling and the remittance flow above should be reviewed against them.
- **Deposit limits and the 3-day cancellation right** in both states. No NY/NJ deposit cap is hard-coded (the engine warns); the cancellation window is enforced.
- **Worker classification.** NY is strict about independent contractor vs employee. Terms, control and exclusivity matter.
- **Fees to subs** for access to work, and whether the platform is a referral service, a staffing arrangement, or a general contractor, can change your licensing and tax treatment.

Config keys: `SUB_MONTHLY_PRICE`, `SUB_FEE_PCT`, `AUTO_APPROVE_HOURS`, `AUTO_PUBLISH_JOBS`.
Stripe additionally needs webhook events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.paid`. Enable Stripe Connect (Express) so subs can receive payouts.

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
- Single company (not yet multi-tenant), single timezone, admin is one shared token.
- One sub per job: a multi-trade job (e.g. kitchen + roof) goes to a single winner; splitting an auction by trade is a next step.
- No sub ratings/reviews or messaging yet; the winner is the lowest eligible bid unless you override it (rating-weighted selection is a natural next step).
- The platform currently collects into its own Stripe balance and transfers to subs; the lower-risk 'funds held in the sub's connected account' architecture is documented but not built.
- If a customer accepts but never pays phase 1, the contract stays pending (no automatic expiry yet).
- Sub password reset and email verification aren't built yet.
- No change-order or progress-billing flow yet; milestone invoices are the natural next module.
- The availability model is estimator-based with fixed 90-minute slots (Mon-Sat 8-6); edit `booking` in `server/config.js`.
