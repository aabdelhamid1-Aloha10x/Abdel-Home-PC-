# Bonds, and what "I don't want to be the contractor" means legally and financially

Prepared October 2026. Facts are sourced (links at the end). Where I could not verify something, it is in section 6.

## 1. Can we get a bond through Stripe?
**No evidence that Stripe sells bonds.** I found nothing indicating Stripe offers surety bonds; Stripe is a payment processor, and its own docs say it "doesn't provide escrow services or support escrow accounts." A surety bond comes from a **surety company, usually through an insurance/bond broker** (a broker shops several sureties for you). Brokers that appeared in my research include SuretyOne, Bond Exchange, SuretyBonds.com, Bryant Surety Bonds, Axcess Surety, Palmetto Surety and Insureon; I have not vetted any of them, so treat that as a starting list and get three quotes.

## 2. What would a $100,000 bond cost per year?
A surety bond is not insurance for you; you pay an annual **premium** (a percentage of the bond amount) and you sign an indemnity agreement promising to repay the surety if a claim is paid. Published ranges:

| Applicant credit | Annual premium | On a $100,000 bond |
|---|---|---|
| Good (700+) | 1% - 3% | **$1,000 - $3,000** |
| Middling | 3% - 5% | $3,000 - $5,000 |
| Poor / non-standard market | 5% - 15% (one source: up to 10%) | **$5,000 - $15,000** |

One source summarizes the whole range as **$1,000 - $15,000 a year** on a $100,000 bond. Performance bonds generally cost more than license bonds; a one-year term is cheaper than multi-year; improving credit lowers the renewal rate.

**What I'd plan for (my estimate, not a quote):** a brand-new LLC with no operating history is not a "good credit" applicant. Budget **3-10% ($3,000-$10,000/yr)** and expect the surety may ask for **collateral** (cash or a letter of credit) or a personal indemnity from the founders. Contract-surety underwriting reviews financial statements and a new facility can take 4-6 weeks (Marsh guide); smaller commercial/license bonds are usually faster.

## 3. What would the bond be FOR, and how big must it be?
Three different bonds could come up. Do not confuse them:

| Bond | Who needs it | Why | Amount |
|---|---|---|---|
| **NY home-improvement deposit security** (GBL 771 / Lien Law 71-a) | The **contractor** that receives pre-completion payments | The alternative to putting those payments in a NY trust account: a bond, contract of indemnity or irrevocable letter of credit "guaranteeing the return or proper application" of the payments | **I could not find the amount rule.** Verify GBL 771 text with counsel |
| **NJ home-improvement contractor security** | NJ registered contractors | Consumer protection; reported tiers $10K / $25K / $50K by contract size (since 2025) | Tiers above (secondary source) |
| **NYC home-improvement license bond** | NYC licensed contractors | Licensing | $20,000 bond or trust-fund membership (secondary source) |
| **Money-transmitter bond** | A business that transmits money for others without relying on a licensed partner | Licensing | NY default **$500,000** (bond sellers; not primary); NJ reported "around $100,000", unverified |

**Sizing the deposit-security bond (my estimate, if it must cover funds you hold):** the design keeps cash exposure small by funding phases just in time. Funds sitting on a job at any moment are roughly *the phase in progress + the next invoiced phase* (about 20-35% of the price). On $25,000 jobs that is about **$5,000-$9,000 per active job**, so a **$100,000 bond would cover roughly 11-20 concurrent jobs.** At 1-3% that is $1,000-$3,000/year for good credit, $3,000-$10,000 for a new company. This is arithmetic on my assumptions, not a legal requirement.

**Cheaper than a bond?** A segregated **NY trust account** has no premium but ties up cash and needs operational discipline; an **irrevocable letter of credit** from a bank typically needs cash collateral. Both are named alongside the bond in the NY notice.

## 4. If you are "not a contractor"
You said you only want to take the jobs, run an auction, manage phases, collect payments and pay the sub after each finished phase. That is the **marketplace + payment-administrator** model. The app now works this way: the **customer contracts with the winning subcontractor**, the platform is named in the contract as marketplace and payment administrator, and the sub is the contractor of record.

**What this changes (good):**
- The sub carries the work, licensing, insurance, warranty and workmanship liability, and the NY/NJ contractor duties (including the deposit-security duty above).
- No need to hold your own general-contractor license *to do the work*.

**What it does NOT automatically change (check with counsel):**
1. **Licensing of the platform itself.** DCWP's guide says anyone who "solicits, canvasses, sells, performs, or obtains" a home improvement contract as a contractor needs a license; NYC repealed the separate salesperson license in 2020. I found no DCWP guidance on referral/marketplace platforms. NJ's Act covers persons "engaged in the business of making or selling home improvements"; I found nothing on referral services. A platform that **sets the scope, runs the estimate, runs the auction and collects payments looks more like a seller than a pure lead-generator**, so do not assume you are exempt.
2. **Holding customer money.** Stripe's docs say a marketplace that manages customers' funds may need its own money-transmitter license and that Stripe's license can be used to offload that burden. NY's default transmitter bond is $500,000 (and licensing is far heavier than a bond). The practical answer is to **keep the platform out of the flow of funds**: see option 1 below.
3. **The escrow duty still exists** for whoever is the contractor (the sub). Whether a platform-held or Stripe-held balance satisfies it is a legal question, not a technical one.

**Three payment architectures (pick with counsel; the code currently implements #2):**
1. **Funds sit in the sub's Stripe connected-account balance, payouts set to manual, the platform releases each phase after approval.** Stripe's docs explicitly describe holding funds in a connected account's balance before paying them out. The platform is never the holder of the money, which is the strongest posture against money-transmitter treatment. Needs destination charges with application fees, and every bidder onboarded to Stripe before bidding. *Not built yet.*
2. **Platform collects into its own Stripe balance, then transfers to the sub per approved phase** (separate charges and transfers). Simple, and what the app does now, but the platform holds customer money, which is exactly where regulation bites. Stripe recommends holding funds only with a clear purpose and speaking to a legal advisor.
3. **A licensed escrow/payment partner** holds the funds (construction-payment escrow providers exist; I could not verify their fit or cost).

## 5. The money consequence of the pivot (the part that decides the business)
As the contractor of record you earned the spread between the customer price and the sub's cost (about 32% of price). As a marketplace you earn **only the fee**. `node docs/unit-economics.js` models it (funnel rates are **my assumptions**; cost per lead is $90-$250 from published ranges):

- At **5% from the sub and nothing from the customer**, every signed job **loses $1,800-$2,700** at $165/lead, on jobs from $8K to $28K.
- Break-even **total take rate** (sub fee + customer fee, as % of the winning bid) at $165 per lead: **37% on an $8K job, 19% on a $17K job, 12% on a $28K job.** At $100 per lead: 25% / 13% / 8%. With cheap leads ($40: strong organic and referral mix): 14% / 7.5% / 4.8%.
- Compare real marketplaces: BuildZoom 2.5-4.5% (with a far cheaper acquisition model), Handy ~20% (2015 reporting; no longer disclosed).
- **A reverse auction also shrinks the base the fee is taken from** (assumed 10% below budget), and trade groups warn lowest-bid auctions pressure quality and margins; the app mitigates with a budget ceiling, a 60% floor, minimum decrements, anti-sniping, vetting, and customer choice.

**Ways to make it work (not mutually exclusive):**
1. **Take 12-18% total** (e.g. 8% from the sub + 5-8% customer "project management and payment protection" fee, itemized). Both are config settings (`SUB_FEE_PCT`, `CUSTOMER_FEE_PCT`) and adjustable per job.
2. **Lower acquisition cost**: referrals, reviews, SEO, past-customer rebooking; use the voice agent to qualify leads so estimators only visit serious ones.
3. **Raise the minimum job size** (>= $20-25K), where the same $120 visit and $165 lead are a small share of the job.
4. **Charge subs for access** to the pre-measured jobs beyond the subscription (the model above assumes they don't).
5. **Reconsider being the contractor of record** (the earlier design): it earns ~6-10x more per job but carries the licensing, bond, escrow and liability burden you want to avoid.

## 6. Not verified
The GBL 771 bond amount; whether a platform bond can satisfy the sub's deposit-security duty; whether a marketplace like this needs an NYC/NJ license; NY/NJ money-transmitter treatment; NJ's licensing start date; the surety premium for a startup specifically (ranges above are generic); who actually underwrites a first-year LLC.

## Sources
- Surety premium ranges: https://www.nfp.com/insights/how-much-does-a-surety-bond-cost/ ; https://www.risk-strategies.com/learn/surety-bonds/how-much-does-a-surety-bond-cost ; https://www.insureon.com/small-business-insurance/surety-bonds/cost ; https://gritinsurance.com/bonds-surety/bond-education-center/credit-score-needed-for-surety-bond/
- New-applicant underwriting (Marsh): https://www.marsh.com/content/dam/marsh/Documents/PDF/en_au/new-applications-for-surety-bonds.pdf
- GBL 771 (notice of bond / indemnity / LOC): https://newyork.public.law/laws/n.y._general_business_law_section_771
- NY AG home improvement fact sheet: https://ag.ny.gov/home-improvement-fact-sheet
- NYC DCWP home improvement contractor exam guide (solicits/obtains): https://www.nyc.gov/assets/dca/downloads/pdf/businesses/Home-Improvement-Business-Exam-Guide.pdf ; license page: https://www.nyc.gov/site/buildings/industry/home-improvement-contractor-license.page ; bond/licensing summary: https://suretybonds.com/blog/new-york-city-home-improvement-contractor-licensing-guide
- NJ Contractors' Registration Act: https://nj.gov/dep/exams/docs/contractor_reg_act.pdf ; NJ security tiers: https://www.suretybonds.com/blog/a-guide-to-new-jerseys-updated-home-improvement-contractor-laws/
- Money-transmitter bonds: https://www.bryantsuretybonds.com/surety-bonds-by-state/new-york/money-transmitter-bond ; https://suretyone.com/new-jersey-money-transmitter-surety-bond
- Stripe: holding funds / no escrow: https://docs.stripe.com/connect/account-balances ; https://docs.stripe.com/connect/manual-payouts ; marketplace licensing: https://docs.stripe.com/global-payouts/compare-with-connect
- Reverse auctions in construction: https://www.professionalroofing.net/articles/article/817 ; https://www.ecmag.com/section/systems/reverse-auctions-and-construction-online-bidding-has-promise-and-problems
- Upwork-style escrow (blog claim): https://www.earnifyhub.com/blog/upwork-escrow-how-it-works-complete-guide
