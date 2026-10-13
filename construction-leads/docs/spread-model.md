# The spread model: fixed price to the customer, auction to contractors, online design studio

Prepared October 2026. The marketplace version (customer signs with the winning contractor) is preserved in git at commit `82f9eed`. Economics: `node docs/unit-economics.js`. Facts are sourced at the end; my assumptions are labeled.

## 1. The model
1. A customer designs a kitchen or bathroom in the **studio** (room size + finishes) and sees an **instant fixed price**.
2. They sign a contract **with us** and pay a small **phase 1** (default <= 10% of the price).
3. Only then do we open an **auction**: licensed, insured contractors bid at or below a **ceiling** (our price minus a minimum spread, default 15%). The lowest eligible bid wins automatically.
4. The customer pays us phase by phase (each funded before it starts); we pay the winning contractor per approved phase, withholding a **5% fee** from the contractor's payouts.
5. **Our revenue = spread (customer price - winning bid) + 5% of the bid.** Your example: $10,000 price, $8,000 bid, 5% = $400, revenue **$2,400 = 24% of the price** (verified by the code and by a test).

## 2. The price of the spread: you are the contractor of record
A fixed price signed with us means **we are the contractor, not a marketplace.** That reverses the earlier "I don't want to be the contractor" decision, and it is the reason the spread is ours (a platform that merely introduces parties earns a disclosed commission, not a hidden spread). Consequences:
- **Licensing:** NYC requires a home-improvement contractor license (DCWP); NYC, Suffolk, Nassau, Westchester, Putnam and Rockland counties all license (NY AG); NJ requires registration with security of $10K-$50K (reported) and is moving to licensing. As the contracting party you must hold the right ones, in the right jurisdictions. Your own contractors still need theirs.
- **Contract content (NY GBL 771):** contractor name, address, phone and license number; description of work and materials (including make/model); approximate start and completion dates with contingencies; price; the mechanic's-lien notice. The contract template has these as placeholders for an attorney.
- **Pre-completion payments:** NY requires them to be held in a NY trust account within 5 business days, or secured by a bond/indemnity/letter of credit (NY AG). **That duty is now yours, so the bond questions apply to you again** (about $1K-$3K/yr per $100K at good credit; plan $3K-$10K for a new company; see `bond-and-structure.md`). Funds are also trust assets for the people who did the work (NY Lien Law Art. 3-A).
- **Risk transfer, in the wrong direction:** with a fixed price you absorb cost overruns, hidden conditions, change orders, warranty and callbacks, and you are responsible if a contractor walks off. Data on how often this happens is weak (sources range from "1-4% over budget" at a careful remodeler to "15-40%" in contractor marketing); I modeled a **4% risk reserve** as an assumption.
- **Honest marketing:** do not tell customers that contractors "bid to lower your price" while keeping the difference. The contract says you assign a licensed, insured contractor and remain responsible; the studio says "fixed price".

## 3. Why the economics are far better than the fee-only model
| | Fee-only marketplace (previous) | **Spread model** |
|---|---|---|
| Revenue per job | ~5% of the bid | **~24% of the price at a 20% spread** |
| $25K job at $100 per studio quote, 12% sign | loses money | **~$3,700 contribution** |
| Break-even spread, $25K job | n/a (fee too small) | **4.5%** |
Same numbers in `unit-economics.js`: at a 20% spread, a $10K job nets ~$750, a $15K job ~$1,700, a $25K job ~$3,700, a $40K job ~$6,700 (after studio acquisition, verification visit, support, payment costs and a 4% risk reserve; **before** fixed overhead such as insurance, bond, software and staff, roughly 4-14 signed jobs a month to cover an assumed $25K/month).

NAHB's FY2024 survey puts the average remodeler at **29.9% gross margin and 6.3% net**, with operating expenses at 23.6% of revenue. Your 24% revenue is within the normal range of a remodeler's gross margin; the difference is that you do not carry crews, so the question is whether your acquisition and support costs stay far below the industry's 23.6%. Modeled variable costs are 3-12% of price depending on job size, which is why **job size matters so much** (minimum viable job is roughly $15K).

## 4. The central assumption, and the one that can break the model
**Does a 20% spread exist?** It is the gap between what we charge and what contractors will accept. If contractors normally earn a 30% gross margin (NAHB average), their normal price is their cost divided by 0.70. Let M be the price they would normally charge and P your fixed price:
- With **no premium (P = M)**, a bid 20% below your price means the contractor takes a **12.5% margin** (their cost is 70% of M; they bid 80%). Many will not bid, or quality will suffer.
- Auction competition typically pulls bids below a contractor's normal price; I do not have data on how far for NY/NJ residential. Spread = 1 - (1 - discount) / (1 + premium):

| Your premium over market (P vs M) | bids 5% below market | 10% below | 15% below |
|---|---|---|---|
| 0% | 5.0% | 10.0% | 15.0% |
| 5% | 9.5% | 14.3% | 19.0% |
| 10% | 13.6% | 18.2% | 22.7% |
| 15% | 17.4% | 21.7% | 26.1% |
| 20% | 20.8% | 25.0% | 29.2% |

So a 20% spread needs roughly **a 15-20% price premium plus a 5% auction discount, or a 10-15% premium plus a 10-15% discount.** The studio's "margin" setting (`STUDIO_MARGIN_PCT`, default 30%) is a placeholder, not a calibrated number. The premium is justifiable only if you deliver what Block does: a fixed price, design/visualization, a planner, protected payments, a warranty, and faster scheduling. And **a higher price lowers conversion**, which the economics assume at 12% (my assumption).
**How to find out before spending on ads:** run the studio on 5-10 real configurations, send the scope to 3 contractors each, and measure (a) what they bid versus your studio price and (b) how many of the customers who reach the quote page sign. Spread and conversion are the two numbers the whole model rests on.

## 5. What was built (all tested: 32 automated tests plus browser runs)
- **Studio (`/studio.html`):** kitchen or bathroom, dimensions, finishes by group (cabinets, countertops, backsplash, flooring; floor tile, shower walls, vanity, fixtures) with swatches; a live **whole-dollar fixed price**, a price breakdown by group, working days and short phases; then a reserve form (NY/NJ ZIP and contact consent required) that creates the lead and a signable quote. Prices and quantities come from the price book and simple, transparent rules of thumb for a rectangular room (`server/studio.js`).
- **Contract (customer with us):** fixed price, payment schedule, payment rules, **field verification clause** (a verified change of more than 5% means a written change order or cancellation with a full refund), 3-day cancellation, **assignment clause** (we assign a licensed, insured contractor; if we cannot at this price within 30 days either party may cancel with a full refund), dates with contingencies, hidden conditions, lien-notice and escrow-notice placeholders.
- **Flow guard "funded before committed":** no auction opens until phase 1 clears; no contractor is awarded before that.
- **Auction:** ceiling = price minus minimum spread (admin-adjustable but never above the customer price), floor, minimum decrement, anti-sniping, binding bids, automatic award to the lowest eligible bid, admin override. Contractors never see the customer price, only the ceiling.
- **Payments:** customer schedule from the fixed price; the winner's payouts are fixed against it at award, proportional per phase, cash-safe by construction (payout never exceeds what the customer has paid in); fee withheld; **the spread is recognized phase by phase when each phase is approved** (`platform_spread` in the ledger).
- **Admin:** each auction shows the customer price, the ceiling, every bid, and **our revenue, spread and fee at that bid**, with the risk reserve and a warning if revenue cannot cover the cost of winning a job.

## 6. What is NOT built, and why it matters more in this model
1. **Change orders.** As the fixed-price contractor you eat cost overruns but must bill customer-requested changes. The contract promises a change-order process; **the app has none.** The 5% verification clause also needs it.
2. **Contractor default mid-job.** If the winner quits, you must re-bid the remaining phases and may pay more. No re-assignment flow yet.
3. **No bids at the ceiling.** The admin can re-open or extend the auction, but raising the ceiling above the customer price is blocked (the job would lose money before any other cost). Otherwise the customer waits until the 30-day refund clause applies. A supply-first launch (3+ vetted contractors per trade and area before the studio goes live) is the real mitigation.
4. **Verification visit.** The customer is offered a measurement-visit booking; the technician app exists, but comparing the verified measurements with the studio's assumptions and triggering a change order is manual.
5. **Studio accuracy and design.** Quantities are rules of thumb for rectangular rooms: L-shapes, islands, soffits, plumbing/electrical moves, structure and older-building conditions are not modeled. There is no 3D visualization (the swatch board is a simple stand-in; third-party 3D configurators exist as vendor products), no material lead-time scheduling, no permits or NYC co-op/condo board approvals, no financing.
6. **Customer refund/chargeback handling** and the **bond/trust-account operation** itself.
7. **Everything legal in section 2:** licensing, escrow/bond, the contract, and how the deposit is held. A NY/NJ construction attorney must sign off before any customer pays.

## 7. How this compares with Block Renovation
Block started (2018-2021) with exactly this shape: an all-inclusive upfront price, design help and a vetted contractor network; by 2025 its own pages describe a matching marketplace (up to four contractor quotes, expert/AI scope review, milestone payments held by Block, commission from the contractor). I **inferred, without Block saying so,** that the bundled model was capital-heavy. Treat Block's shift as a warning: the spread model puts price risk, warranty and working capital on the platform, and pays you more for it.

## 8. Decisions for you
1. **Accept being the contractor of record**, with the licensing, bond/escrow and liability that go with it? (If not, the only structure that avoids it is the commission marketplace, where revenue falls to roughly 5-18% depending on fees; see `bond-and-structure.md`.)
2. **How much premium will your market pay for the studio experience**, and how will you prove it before launch?
3. **Supply first:** recruit and vet 3+ licensed contractors per trade and area before opening the studio there?
4. **Minimum job size** (suggest $15K+) and which rooms to start with (kitchens and baths).
5. **Change orders and contractor-default handling** are the next two builds; agree?

## Sources
- NAHB remodelers' Cost of Doing Business (FY2024): https://eyeonhousing.org/2026/04/remodelers-saw-profit-margin-gains-in-2024/ ; https://www.nahb.org/blog/2026/04/home-remodeling-profit-margin
- NY GBL 771 contents: https://newyork.public.law/laws/n.y._general_business_law_section_771 ; Erie County summary: https://www3.erie.gov/consumerprotection/home-improvement-contract-requirements
- NY AG home improvement fact sheet (escrow/bond, licensing, cancellation): https://ag.ny.gov/home-improvement-fact-sheet
- NY Lien Law Art. 3-A: https://blogs.duanemorris.com/constructionlaw/2025/12/22/under-article-3%E2%80%91a-of-the-ny-lien-law-settlement-proceeds-are-trust-assets-not-a-source-of-contractor-reimbursement/
- NJ registration/security: https://www.suretybonds.com/blog/a-guide-to-new-jerseys-updated-home-improvement-contractor-laws/
- Change-order and overrun figures (weak, marketing-grade): https://phxhomeremodeling.com/the-real-cost-of-change-orders-in-phoenix-interior-remodels-drivers-and-prevention-strategies-for-2026/ ; https://www.jlconline.com/business/budget-busters-not-allowed/
- Block Renovation (today and 2018-2021): https://www.blockrenovation.com/block-protections ; https://www.blockrenovation.com/faq ; https://www.brickunderground.com/improve/block-renovation-reinventing-home-renovation-in-new-york-city
- Configurator vendors (marketing only): https://www.vividworks.com/solutions/kitchen-configurator
