# How we make "platform collects" stick

**The problem you described:** the sub is on site, the customer is standing next to them. Why wouldn't they settle in cash and skip us?
**The honest answer:** you cannot physically stop two adults paying each other. You make the platform path *clearly better* for both, make the off-platform path *costly and unprotected*, and make sure **you are never exposed** if they try it. Four layers, strongest first.

## Layer 1: Structure. Make the customer's obligation run to YOU, not to the sub
- The customer signs **one contract with the platform** (contractor of record). The sub is *your* subcontractor. The sub has no contract with the customer and no right to be paid by them.
- The signed contract (clause 2A, in `server/contract.js`) says: pay only through our links; crew and subs are **not authorized** to take payment; a payment made to anyone else **does not count** toward the price and is **not covered by the warranty**; we may suspend work while a payment is overdue.
- So if a customer slips the crew $2,000 cash, the customer still owes you the milestone. The only way "cash on site" saves the customer money is if you never find out, which the next layers address.

## Layer 2: Money mechanics. The platform is the only way anyone gets paid
```
 Customer ──ACH/card (platform link only)──► PLATFORM  ──per approved phase, fee withheld──► SUB
        milestone invoiced ▲                     │                                        (instant payout rail)
                           │                     └─ holds the money; NEVER pays ahead of what it collected
 Gate 0  sign contract  ->  3-business-day cancellation window
 Gate 1  deposit CLEARED ->  job posted; a sub may CLAIM it      (funded before committed)
 Gate 2  phase N funded  ->  sub may START phase N               (no pay, no work)
 Gate 3  sub submits photos + lien waiver  ->  customer approves (or silence for 72h)  ->  payout for phase N
 Gate 4  dispute freezes that phase's payout only
```
Implemented in `server/milestones.js`, `server/marketplace.js` and tested (`test/pipeline.test.js`):

| Rule | Where enforced |
|---|---|
| A sub cannot **claim** a job until the customer's deposit has cleared | `marketplace.claim` re-checks inside the transaction |
| A sub cannot **start** a phase until the customer funded it, the cancellation window closed, and the previous phase was approved | `milestones.startPhase` |
| A sub cannot **submit** without at least one photo and a signed lien waiver | `milestones.submitPhase` |
| Payout happens only if funded + waiver + approved + not disputed; created atomically; double-approval cannot double-pay | `milestones.release` |
| Sub payouts can never exceed what the customer has paid in (deposit funds nothing for the sub; schedule is cash-checked) | `milestones.allocatePayout` / `cashSafe` (unit tested) |
| **The fee is withheld from each payout**, so you never invoice or chase a sub | `milestones.release` writes `platform_fee` + `sub_payout` |
| Fee % is per job and adjustable (0-30%, default 5% of the award), locked once awarded | `PATCH /api/admin/posts/:id` |
| ACH counts as funded only after the bank debit settles (card: when paid) | Stripe webhook `async_payment_succeeded` |
| Customer silence is approval after 72h; a dispute can't be auto-approved | `milestones.autoApproveTick` |

**Cash safety:** the sub for phase N is paid only from money the customer already paid for phases up to N. The platform's margin and the fee therefore accrue as it collects, and your downside on a customer who stops paying mid-job is bounded to the unpaid phase.

## Layer 3: The "why would I bother going around them?" incentives
For the **sub**:
1. **Fast, certain pay.** Competitors pay slowly (a Procore-sponsored survey: over two-thirds of sub payments arrive 30+ days late). Pay within ~1-2 business days of approval via Stripe Connect and you are the best-paying GC in the area. That is the real enforcement.
2. **Zero collection risk.** The customer's money is in before they start each phase.
3. **No fee invoicing.** It comes out of payouts, so there is nothing to dodge.
4. **Loyalty ladder (creative, not yet built):** first job 5%, repeat customers 2% *only if rebooked through the platform*. Poaching a repeat customer saves them 2%; staying earns them platform leads, instant pay and warranty backing.
5. **Scorecard.** On-time, rework and dispute rates decide who sees jobs first. Going around the platform ends the relationship with the lead source.
6. **Non-circumvention clause** in the sub agreement (12 months on introduced customers, liquidated damages). Enforceable only if reasonable and drafted by a NY/NJ lawyer; it is a deterrent, not a mechanism.

For the **customer**:
1. **Protection only exists on-platform:** warranty, 10% retainage held to the final walkthrough, lien waivers with each payout (so a sub cannot lien their house), dispute freeze, insured and vetted crews.
2. **They do not have to hand cash to strangers.** Every payment is a link on their own phone: no awkward on-site negotiation.
3. **They approve each phase with photo proof** before the crew is paid. That is real leverage that cash-on-site gives up.

## Layer 4: Detection and deterrents on site (creative ideas, realistic)
- **Job Passport QR** on a permit-style card at the site: the customer scans it to pay/approve; the sub scans it to check in (the app already stores optional geolocation on phase start). Evidence trail for chargebacks and disputes.
- **"Funded" signal:** the sub's app shows `Phase 3 funded: $6,650 held` before they mobilize, like Upwork's escrow badge. Subs only work against funded phases, so there is nothing to renegotiate in cash.
- **Cash-offer reporting (to build):** sub agreement requires reporting any off-platform payment request within 24h; reporting is rewarded (fee credit), concealment is a termination event. Suspicious signals worth alerting on: a phase stuck "invoiced" while the sub keeps checking in, photo uploads on an unfunded job, a customer who pays nothing after phase 1 yet the site stays active.
- **No completion certificate / no final inspection sign-off** (permit closeout, warranty registration) until every milestone is funded.
- **Masked communications (to build):** a proxy number so contact details are not exchanged before award; after award the sub knows the customer, so this protects the lead, not the job.

## Where the money actually sits (decision needed, with a lawyer)
Two facts constrain the design:
1. **New York** requires pre-completion customer payments to be held in a **trust (escrow) account at a New York bank within five business days**, or covered by a **bond** delivered within ten business days (NY Attorney General; Lien Law 71-a, GBL 771). Progress payments must also bear a "reasonable relationship" to the work done. Funds are also trust assets for subs under Lien Law Art. 3-A.
2. **Stripe does not provide escrow.** Its guidance: hold funds in a platform balance only with a clear purpose, and consult a legal advisor.

Practical options:

| Option | How | Trade-off |
|---|---|---|
| **A. Bond + Stripe Connect** | Post the surety bond / contract of indemnity NY allows; take milestones via Stripe; pay subs by Connect transfer | Fastest to launch; the bond has a cost and requires underwriting |
| **B. Segregated NY trust account** | Stripe pays milestone funds out to a dedicated NY-bank trust account; sub payouts come from that account (ACH, wire or a payments API) | Cleanest compliance; more operations and a bank/treasury integration |
| **C. Licensed escrow/payment partner** | Use a construction-payments provider that holds funds | Least custody burden; cost and vendor fit unverified |

The code is agnostic: it records `funded` and `released` and keeps the ledger; which account holds the cash is an operational choice. **Do not launch without choosing A, B or C with counsel.**

## What can still go wrong (and the answer)
| Attack / failure | Mitigation |
|---|---|
| Customer pays crew in cash to get a discount | Contract: doesn't count, no warranty; subs paid only via platform so they lose nothing by refusing; reporting duty |
| Sub asks customer for "materials money" up front | Contract names crew as unauthorized; customer sees "never pay crew directly" on every payment page and SMS |
| Customer chargeback or ACH return after sub was paid | Pay out only after funds clear (ACH settles before `funded`); keep a reserve; evidence pack = signed contract, milestone approvals, geo/photos |
| Customer disputes, work is fine | Evidence pack; 72h auto-approval is in the contract; dispute freezes only that phase |
| Sub abandons job mid-way | Only phases they completed were paid; funded-but-unstarted money remains; re-post remaining scope |
| Sub does bad work, customer approves anyway | 10% retainage to the final walkthrough; warranty; scorecard |
| Fee dodge by the sub | There is nothing to dodge: withheld from payouts |
| Customer link shared or guessed | Links are long random tokens; v1 weakness: anyone with the link can approve. Add SMS OTP before launch |
| Platform fails or is sued | Trust-fund handling (above) and clear records; counsel on structure |

## Implemented vs. not yet
**Done:** percentage fee withheld per payout; milestone schedule and cash-safety check; funded-before-committed claim gate; no-pay-no-work phase start; photo + lien-waiver submission; customer approve/dispute/auto-approve; payouts recorded in a ledger with optional Stripe Connect transfers; ACH-aware funding events; contract terms.
**Not yet:** OTP on customer approvals; geofence enforcement (location is recorded, not enforced); masked comms; loyalty fee ladder; Connect payout setup UI is wired but untested against live Stripe; change orders with their own milestones; chargeback evidence export; the NY escrow/bond operation itself.
