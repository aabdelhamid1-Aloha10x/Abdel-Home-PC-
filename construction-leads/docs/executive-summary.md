# Executive summary: what we decided, what we built, how it compares to Block Renovation, and what is missing

Prepared October 2026. Block facts are from Block's own pages and press (company claims unless noted). Our numbers come from `node docs/unit-economics.js`; its funnel rates are my assumptions, not data.

## 1. What we are building (current design)
A **NY/NJ renovation marketplace**: Meta/Google ads bring homeowners to a free estimate. Our estimator measures and (with consent) records the visit. The platform produces a **scope, a budget ceiling and a short-phase plan**. The customer approves the plan, vetted contractors **bid in a reverse auction**, the best eligible bid is offered to the customer, who **signs the contract with the winning contractor** and pays phase 1. From then on, **each phase is funded by the customer before it starts, finished by the contractor, approved by the customer, and paid out by the platform with the platform's fee withheld.** The platform is the marketplace and payment administrator, **not the contractor**.

## 2. How we got here (decision log)
| Step | What you asked for | What changed |
|---|---|---|
| 1 | Website + lead form, free estimate booking, AI voice agent that calls leads who don't book | Landing page, booking, voice-agent script |
| 2 | Full pipeline from Meta/Google Ads to estimate to quote (materials + labor + margin) to contract + deposit; recorded site visit with consent | Ad-lead webhooks, scheduler, technician phone app with server-enforced recording consent, quote engine, e-sign, Stripe deposit, jobs |
| 3 | NY/NJ only; let other subs sign up ($50-60/mo + 5-10% of award) and take our jobs | Sub accounts, approval, subscription, job board, ledger |
| 4 | Fee is a **percentage**, adjustable per job; **platform collects**, pay sub only after funds are in; think creatively about enforcement; feasibility study and competitor research | Percentage fee withheld from payouts (no invoicing), milestone payments, funded-before-committed gates, enforcement design, feasibility study |
| 5 | Can Stripe give a bond? who else? cost of $100K? **I don't want to be the contractor: auction, short phases, pay the sub per finished phase** | Phase planner, reverse auction (ceiling/floor, decrement, anti-sniping), customer-contractor contract, bond/structure analysis |
| 6 | (now) Summarize everything and compare to Block Renovation | This document |

## 3. The system as built (all tested: 32 automated tests plus browser runs)
- **Lead intake:** website form, Meta Lead Ads, Google lead forms; duplicates merged; out-of-area ZIPs saved but never booked or called; AI-call consent captured only on our own form (ad-form leads get the booking link and a human follow-up).
- **Estimate:** technician app (consent script, recording only after consent is logged, measurements, photos), optional transcription + AI scope draft, quote builder from a price book.
- **Phase plan:** lines ordered by construction stage, packed into short phases (default 5 crew-days / 25% of price max), first payment capped at 10%, 10% retainage; price becomes the **budget ceiling**.
- **Auction:** open reverse auction; bids <= ceiling and >= a 60% floor; each bid must beat the best by a minimum decrement; a sub can only lower their own bid; a bid in the last 15 minutes extends the clock (max 4); bids are binding; runner-up gets the offer if the customer declines or lets it lapse.
- **Contract and funding:** customer signs with the winner; **the winner is not committed (and never sees the customer) until phase 1 has cleared**.
- **Phases:** no phase starts unfunded; contractor submits photos + lien waiver; customer approves (silence = approved after 72h; a dispute freezes only that phase); payout = phase gross minus the fee; the contractor is never paid more than the customer has paid in.
- **Fees:** sub fee (default 5% of the winning bid, withheld) + optional customer fee (itemized); both adjustable per auction until awarded.
- **Admin:** pipeline, quote builder with live phase plan, auction manager (close, extend, re-offer, edit fees/ceiling/floor), ledger, payments per job, subs approval with COI view.
- **Docs:** `payment-enforcement.md`, `bond-and-structure.md`, `feasibility-study.md`, `unit-economics.js`.

## 4. The money, in one table
| Item | Where it stands |
|---|---|
| Revenue | Only fees: sub fee % + optional customer fee % (+ $55/mo subscription, immaterial) |
| **Economics at 5% sub fee only** | **Loses $1,800-$2,700 per signed job** at $165/lead ($8K-$28K jobs) |
| Break-even total take at $165/lead | ~37% on an $8K job, ~19% on $17K, ~12% on $28K |
| At $100/lead | ~25% / 13% / 8% |
| At $40/lead (strong referral/organic mix) | ~14% / 7.5% / 4.8% |
| Card vs ACH on a $10K phase | ~$290 vs $5 |
| $100K surety bond | ~$1,000-$3,000/yr good credit; plan on $3K-$10K for a new LLC, maybe with collateral. Stripe does not sell bonds; brokers do |
| What a bond is for | NY lets a contractor hold pre-completion payments in a NY trust account **or** post a bond/indemnity/LOC (amount rule not found). Money-transmitter bond if you hold funds yourself: NY default $500K |

## 5. Block Renovation compared
### 5.1 What Block is today (from Block's own pages)
- **Not a general contractor.** It "matches" a homeowner with "up to four personalized quotes from vetted pros." Contractors visit and build their own proposals; Block's "renovation experts and AI-enabled tools" **review each scope for gaps and red flags** ("Price Assurance"), and Block will review change orders on request.
- **Money:** "You pay Block, not the contractor. Block releases the payments in stages to your contractor upon completion of approved steps"; "no direct contractor transfers." Four payments: initial amount on proposal acceptance, first installment at ground-break, progress payment around the midpoint, final payment at ~99% complete (no percentages published).
- **Fees:** joining is free for contractors; they "pay Block a small commission" **only when they win** (percentage unpublished); **homeowners pay nothing** unless they buy optional Design Services. For reference, BuildZoom (which Block bought) charges 2.5-4.5% on contracts under $50K.
- **Protections:** 1-year workmanship warranty **from the contractor, not Block**; dispute support in 24 business hours but "Block does not act as a formal mediator" and "the final resolution is always between the homeowner and the contractor"; contractor handles permits; financing through a lending partner.
- **People and tools:** a free **Project Planner** per homeowner (also an AI assistant); free design/cost tools (Renovation Studio, visualizers); optional paid design.
- **Scale:** ~$104M raised through 2021 (Series C $50M, SoftBank VF2); in November 2025 it bought **BuildZoom's marketplace**, saying the combined platform handles **over $100 million in annual projects** in all 50 states.
- **Where it started (2018-2021):** a bundled model: all-inclusive upfront price, a dedicated designer, 3D rendering, construction manual, it said it **bought 100% of materials before construction** and promised a one-to-two-month plan/approval phase plus one month of construction (an advertorial; unverified claims). My inference, not Block's statement: it moved toward a matching marketplace with protections, and bought a demand engine, because the bundled model was capital-heavy.

### 5.2 Side by side
| | **Block (today)** | **Us (as built)** |
|---|---|---|
| Is the platform the contractor? | No ("matches"); contract party not stated publicly | No; **customer signs with the winning contractor** (explicit) |
| How the price is set | 3-4 contractor proposals, expert/AI scope review | **Reverse auction** on a platform-defined scope, ceiling and floor |
| Who does the site visit/estimate | **Each contractor** (their cost) | **Our estimator** (~$120 per visit, ~4 visits per signed job) |
| Who writes the scope | Contractors; Block reviews it | **Platform** (measurements, price book, phase plan) |
| Who holds the money | Block (customer pays Block) | Platform payment administration (customer pays platform) |
| Payment structure | 4 payments: acceptance / ground-break / midpoint / ~99% | **5+ short phases**, first <= 10%, each funded before it starts |
| Release rule | "Completion of approved steps" | Funded + photos + lien waiver + customer approval (or 72h) |
| Platform revenue | Contractor commission on won jobs (small, unpublished); homeowner free | Sub fee % (default 5%) + optional customer fee + $55/mo |
| Contractor joining cost | Free | **$50-60/month** |
| Warranty | 1 year, by the contractor | Placeholder in the contract, **not designed** |
| Disputes | Support, **not a mediator** | Freeze payout + admin handling; contract says "non-binding mediation" |
| Change orders | Expert review on request | **Contract mentions them; not built** |
| Design / visualization / selections | Free tools, optional paid designer | **None** |
| Project support | Planner (human + AI) | None (admin only) |
| Permits | Contractor handles | Not addressed |
| Financing | Lending partner | None |
| Demand | Own brand + **BuildZoom's demand engine** | Paid ads (the CAC problem) |
| Geography | 50 states | NY + NJ |

### 5.3 The three differences that matter most
1. **Who pays for the site visit.** Block pushes estimating cost onto contractors and collects only on a win. We pay for the estimator and recover it only if a bid is accepted. That single choice is a large part of why our modeled break-even take is high.
2. **Bids on a platform-defined scope vs. contractor-written proposals.** Our auction is cleaner to compare but gives lowball bidders a way in: a low price on a scope they haven't scrutinized is followed by change orders. Block's expert/AI scope review exists precisely to prevent that.
3. **Block's customers pay nothing and its contractors pay a commission only if they win.** We also charge subs $55/month and (optionally) the customer. Both change who signs up and how fast the marketplace fills.

## 6. What I think we were missing (ranked by impact)
1. **Bid quality and change orders.** A pure price auction needs a defense against lowballing: scope-inclusion checklist per bid, a platform scope/price review before a bid is offered to the customer, bidder reputation, and a built change-order flow (priced, signed by both, funded before the extra work). The contract already promises change orders; **the app does not implement them.**
2. **Materials money.** Our first payment is capped at 10% to protect the customer, but kitchen/bath contractors often must order cabinets, tile and fixtures early (large lead times). A 10% first payment may leave the contractor unable to buy materials. Needs a **materials draw** (a larger, evidenced early phase, or direct supplier payment) designed with NY's "reasonable relationship" rule in mind.
3. **Who the bidders really are.** A whole kitchen or bath needs a **licensed remodeling general contractor** who coordinates plumbers/electricians; single-trade subs (roofing, siding, gutters, concrete) fit natively. "Subcontractor" is the wrong word for most bidders, and NYC/county **licenses must be checked by jurisdiction**, not just stored as a number.
4. **Who pays for estimating.** Options: a refundable visit fee credited at signing (filters tire-kickers and raises visit-to-sign), remote AI/photo scoping before sending anyone, an instant online estimate tool (Block's Renovation Studio is a lead magnet), or letting winning contractors reimburse the visit.
5. **Demand.** Block bought one. We rely on paid ads. Referrals, reviews, SEO, rebooking past customers and an instant estimator tool are the cost-of-lead levers. **One asset we will own:** every auction produces real market prices (winning bid vs. budget); use them to calibrate the price book, which is the data advantage Block cites ("within 5-10% accuracy").
6. **Warranty and support.** Adopt a clear 1-year contractor workmanship warranty and claims process; define a Project Planner role (even part-time) to review bids and unblock jobs. Copy Block's explicit "we are not a formal mediator" posture; our contract currently promises mediation.
7. **Permits and building approvals.** Block says the contractor handles permits. In NYC co-ops and condos, board approvals and DOB filings can dominate timelines; we say nothing about them.
8. **Vetting depth and ratings.** We check a license number, an insurance date and a COI. Block cites screening, insurance verification and references; repeat work is its quality lever. We need references, background checks and a rating that decides who sees jobs first.
9. **Financing** (a lending partner) for $20K+ projects.
10. **Platform insurance and tax:** contingent liability/E&O coverage, 1099 reporting to contractors, and whether platform fees are subject to sales tax. I did not research these.
11. **Legal items still open** (from `bond-and-structure.md`): whether the platform itself needs an NYC/NJ license because it solicits or obtains contracts; fund-holding and money-transmitter treatment; the NY deposit-security amount; which payment architecture to use (recommended: funds held in the contractor's own Stripe balance with manual payouts released by the platform; **not built**).

## 7. Decisions only you can make
1. **Take rate:** commit to roughly 12-18% total (sub fee + customer fee), or bet on much cheaper leads? At 5% alone the model loses money.
2. **Who funds the estimate:** keep paying estimators, or shift cost to contractors / charge a refundable visit fee?
3. **Auction vs. curated quotes:** keep the open auction, or switch to Block-style "3-4 vetted quotes + platform scope review" (better quality, less race to the bottom)? A hybrid is possible: auction among a pre-qualified shortlist with a scope review gate.
4. **Bidder profile:** remodeling GCs for whole-room jobs, single-trade subs for exteriors, or both, and what jurisdiction-specific licenses are mandatory.
5. **Subscription:** keep $55/month, or follow Block's "free to join, commission only"?
6. **Payment architecture and bond:** funds in the contractor's Stripe balance (recommended) vs platform balance vs an escrow partner; bond/trust-account route with counsel.
7. **Legal opinion first:** written advice from a NY/NJ construction attorney on licensing, fund-holding and the contract before ad spend.

## 8. Suggested next steps
- **Weeks 0-4:** attorney opinion; choose payment architecture; decide fee level; define bidder requirements by jurisdiction.
- **Weeks 2-8:** $3-5K test campaign to measure real cost per lead and close rate (replace my assumptions); recruit 5-10 vetted contractors by hand; add the scope-review gate, change orders and a materials draw.
- **Months 2-4:** first 20-30 jobs; measure take, change-order rate, dispute rate, on-time rate; calibrate the price book from winning bids.
- **Then:** open the board publicly; consider financing and design services.

## Sources
- Block, how it works: https://www.blockrenovation.com ; protections: https://www.blockrenovation.com/block-protections ; FAQ: https://www.blockrenovation.com/faq ; contractors: https://www.blockrenovation.com/contractors
- TechCrunch, Series C (Nov 2021): https://techcrunch.com/2021/11/09/block-renovation-gears-up-for-national-expansion-following-50m-round/
- Brick Underground (Block advertorial, 2018): https://www.brickunderground.com/improve/block-renovation-reinventing-home-renovation-in-new-york-city
- Block acquires BuildZoom marketplace (Nov 2025): https://pulse2.com/block-renovation-buys-buildzoom-marketplace-to-create-nationwide-ai-construction-platform/ ; https://bostonrealestatetimes.com/block-renovation-acquires-buildzoom-marketplace-forming-nations-largest-ai-driven-renovation-and-construction-platform/
- BuildZoom fees: https://www.buildzoom.com/answers/6971/what-does-buildzoom-charge-for-this-service
- Everything else: see `feasibility-study.md` and `bond-and-structure.md`.
