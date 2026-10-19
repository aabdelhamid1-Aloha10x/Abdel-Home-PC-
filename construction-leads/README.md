# Online design studio + contractor auction: lead-to-contract platform for NY/NJ renovations

A customer designs a kitchen or bathroom in the **studio**, gets an **instant fixed price**, signs a contract **with us** and pays a small **phase 1**.
Then licensed contractors **bid in a reverse auction** under a ceiling; the lowest eligible bid wins. The customer pays us phase by phase (each funded
before it starts); we pay the contractor per approved phase, withholding a 5% fee. **Our revenue = the spread (customer price minus winning bid) + the fee.**
We are the **contractor of record** (see `docs/spread-model.md`). Leads also arrive from Meta/Google ads and the free-estimate booking flow; an estimator
can build the same kind of fixed-price quote after a site visit. The earlier fee-only marketplace is preserved at git commit `82f9eed`.

Zero dependencies. Needs Node 22.5+ (uses the built-in SQLite).

```
npm start          # http://localhost:3000   (seeds a starter price book + 2 estimators)
npm test           # 32 tests: studio pricing, quote and phase planning, spread/schedule math, the whole funnel, the auction rules and the payment gates
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
   /admin.html QUOTE BUILDER (or /studio.html): fixed customer price + SHORT-PHASE PLAN, ceiling = price - minimum spread
                                     ▼
   customer link /quote.html?t=…: reviews price + phases ─► signs the contract WITH THE PLATFORM ─► pays phase 1 (<= 10%)
                                     ▼
   phase 1 CLEARED ─► AUCTION opens (/sub.html: vetted contractors bid under the ceiling; anti-sniping) ─► lowest eligible bid WINS
                                     ▼
   winner confirmed, customer details unlock ─► per phase: customer funds ─► contractor works ─► photos + lien waiver ─► customer approves
                                     ▼
   platform pays the contractor (fee withheld) and books the spread on each approved phase
   JOB: awaiting_deposit ─► bidding ─► rescission_period (3 business days) ─► ready ─► in progress ─► complete
```

## Pages

| URL | Who | What |
|---|---|---|
| `/` | public | Landing page + lead form (UTM / gclid / fbclid captured) and a link to the studio |
| `/studio.html` | customer | Design studio: room, dimensions, finishes, instant fixed price, reserve |
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


## Contractor auction (`/sub.html`) and the spread

Service area is **New York and New Jersey** (ZIP-routed; out-of-area leads are saved but never booked or called).

**Contractor flow:** applies (license, insurance, trades, ZIP coverage) → you review and **approve** → subscribes ($50-60/mo via Stripe) → **bids** on live auctions →
the lowest eligible bid **wins automatically** when the clock ends → customer details unlock → phases run. Remember: the bidders for whole-room jobs must be licensed remodeling
contractors (single-trade subs fit exteriors natively).

**Quotes carry a phase plan.** Every quote (studio or estimator-built) is split into short phases (`server/phases.js`): lines ordered by construction stage, packed into phases of at most
N crew-days and M% of the price (defaults 5 days, 25%), big lines split across phases, the **first payment capped (default 10%)**, 10% held as final retainage.

**The ceiling.** Contractors bid at or below `price × (1 - MIN_SPREAD_PCT)` (default 15%) and at or above a floor (60% of the ceiling). They **never see the customer price**, only the ceiling.

**Auction rules** (`marketplace.placeBid`): open auction (best bid visible, bidders anonymous; `AUCTION_SEALED=1` hides it); a new bid must beat the best by a minimum decrement (1%);
a contractor can only lower their own bid; a bid in the last 15 minutes extends the clock (max 4 times); bids are binding; default window 48h. Admin can close now, re-open, tune the
fee/ceiling/floor, or award a specific bidder. **Funded before committed:** no auction opens (and nothing can be awarded) until phase 1 has cleared.

**Revenue:** spread + `SUB_FEE_PCT` (default 5% of the bid, withheld from payouts, never invoiced). Example: $10,000 price, $8,000 bid → spread $2,000 + fee $400 = **$2,400 (24%)**.
The spread is recognized phase by phase when each phase is approved. The admin screen shows each auction's revenue and warns when it cannot cover `ACQ_COST_ESTIMATE`.
**The spread only exists if contractors bid below your price; read `docs/spread-model.md` section 4 before trusting 20%.**

### Money flow: phases, funded first, platform pays per approved phase
The customer pays **the platform** (ACH preferred: $5 vs ~$290 per $10K by card):
1. Customer signs the fixed-price contract and pays **phase 1**. It clears (card, or ACH after the bank debit settles) → **only now does the auction open.**
2. The winner is awarded; the contractor's payouts are fixed against the customer's schedule, proportional per phase. Cancellation window (3 business days) closes; work starts.
3. Contractor uploads photos + a lien waiver and submits; the next phase is invoiced; the customer approves (silence = approved after 72h; a dispute freezes only that phase).
4. Payout = phase gross minus the 5% fee (Stripe Connect transfer, or recorded as due in the ledger). **No phase starts unfunded, and the contractor is never paid more than the customer has paid in** (checked in code).

See **[docs/spread-model.md](docs/spread-model.md)** (the model, what it costs in legal exposure, the premium/discount math, what is not built),
**[docs/payment-enforcement.md](docs/payment-enforcement.md)**, **[docs/bond-and-structure.md](docs/bond-and-structure.md)** (bond costs, licensing, fund-holding),
**[docs/feasibility-study.md](docs/feasibility-study.md)** and **[docs/executive-summary.md](docs/executive-summary.md)**. `node docs/unit-economics.js` reproduces the economics.

Config keys: `SUB_MONTHLY_PRICE`, `SUB_FEE_PCT`, `MIN_SPREAD_PCT`, `STUDIO_MARGIN_PCT`, `RISK_RESERVE_PCT`, `ACQ_COST_ESTIMATE`, `AUCTION_HOURS`, `AUCTION_SEALED`, `AUTO_APPROVE_HOURS`.
Stripe needs webhook events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.paid`, and Stripe Connect (Express) for contractor payouts.

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
- One contractor per job: a multi-trade job (e.g. kitchen + roof) goes to a single winner; splitting an auction by trade is a next step.
- No contractor ratings/reviews or messaging yet; the winner is the lowest eligible bid unless you override it.
- The studio uses rules of thumb for rectangular rooms and a placeholder price book; no 3D visualization, permits, board approvals or financing.
- **Change orders, contractor-default re-assignment and verified-measurement checks are not built** (see `docs/spread-model.md` section 6); the contract promises change orders.
- The platform collects into its own Stripe balance and transfers to contractors. Because we are the contractor of record, how pre-completion funds are held (NY trust account or bond) is a legal/operational choice not implemented in code.
- If a customer signs but never pays phase 1, the contract stays pending (no automatic expiry yet).
- Sub password reset and email verification aren't built yet.
- No change-order or progress-billing flow yet; milestone invoices are the natural next module.
- The availability model is estimator-based with fixed 90-minute slots (Mon-Sat 8-6); edit `booking` in `server/config.js`.
