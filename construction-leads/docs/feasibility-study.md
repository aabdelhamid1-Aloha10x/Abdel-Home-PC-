# Feasibility study: NY / NJ renovation platform with a subcontractor network

Prepared October 2026. **Facts** below come from sources linked at the end; **assumptions** are labeled and are mine, not data.
Where I could not verify something I say so in section 8 rather than guess.

## 1. Verdict

**Feasible, but it is a general-contractor business, not a software marketplace, and it only works above a minimum job size.**

- The money is in the margin between what the homeowner pays you and what the subcontractor earns (about 32% of price at the app's default pricing), not in the subscription ($55/month) and not in the 5% fee (about 10% of per-job platform revenue).
- With paid leads, a job under ~$10K roughly breaks even; at $18K+ it clears about $3-4K contribution per signed job; at $30K about $7K. Set a **minimum job size of $15K** or route small jobs elsewhere.
- Your own legal exposure is the real cost of this model: you are the contractor of record in NY/NJ (license, bonds, escrow-style handling of deposits, liability for subs' work). That is also what makes "platform collects" possible.
- The competitor record is a warning on the lead-gen side (Angi's network lead revenue collapsed) and a mixed signal on the managed side (Block Renovation raised roughly $94-118M and has since bought BuildZoom's marketplace; I could not confirm it is profitable).

**Recommendation:** start as a *licensed GC with a small vetted bench of subs* in one metro (e.g. NJ north / NYC outer boroughs / one upstate county), prove the funnel and margin on 20-30 jobs, then open the sub board more widely. Do not build a large sub marketplace before you have a steady stream of signed jobs to give them.

## 2. Market

| Fact | Figure | Source |
|---|---|---|
| US homeowner improvement spending, end of 2026 (forecast) | ~$518B, growth easing to 1.6% | Harvard JCHS LIRA, April 2026 |
| New York metro remodeling | ~$12.5B/yr, largest US metro (older figure) | Industry Council via Brownstoner; JCHS cites $12.2B for 2017 |
| NY state remodeling industry | $16.1B, 73,829 businesses (broad definition incl. GCs, design-build) | IBISWorld 2026 |
| NJ remodeling industry | $4.7B, 21,783 businesses | IBISWorld 2026 |

Read: a very large, fragmented market with slowing growth. Fragmentation is the opportunity (many small contractors, little brand trust) and the constraint (price competition, many unlicensed or informal players).

## 3. Competitors and exactly how they connect customers and workers

There are four structural archetypes. The structure that matters is **who signs with the homeowner, who holds the money, and how the platform gets paid.**

### 3.1 Lead marketplaces: Angi (HomeAdvisor), Thumbtack, Porch, Fixr
```
Homeowner ──request──► Platform ──sells lead / contact──► Pro
Homeowner ◄───────── contract + payment, direct ─────────► Pro      (platform is not a party)
Platform revenue: pro pays per lead and/or membership
```
- **Angi:** pros pay an annual membership (~$288-300) plus per-lead fees ($15-85, third-party figures; Angi publishes no rate card). Since January 2025 "homeowner choice" means homeowners pick which pros contact them. Angi's FY2024 10-K shows Ads & Leads revenue down $162.3M (-14%); in Q3 2025, Network Service Requests fell 67% and Leads 81% on that change, while proprietary-channel requests rose 11%. Angi also runs **Angi Services**, where Angi books and completes the project and the homeowner sees an upfront price (that is the managed model in 3.3); I could not find its take rate.
- **Thumbtack:** pros buy credits (~$1.42-1.50 each) and spend them to unlock a lead; reported lead cost $10 to $100+; paid whether or not the job is won. Reported ~$400M ARR in 2024 (second-hand).
- **Porch:** per-lead, skews to smaller jobs. **Fixr:** says generating your own leads via Google/Meta costs ~ $100 per lead for an experienced buyer.
- **Weakness they all share:** pros resent paying for leads shared with several competitors; the platform never controls quality or payment.

### 3.2 Success-fee marketplace: BuildZoom
```
Homeowner ──project──► Platform ──introduces──► Contractor
Homeowner ◄─── contract + payment, direct ───► Contractor
Contractor pays Platform a % of contract value when the contract is signed
```
- BuildZoom's own help page: fee is a **percentage of the contract value, typically 2.5%-4.5% for contracts under $50K**, due after the contract is signed. This is the closest published analogue to your 5% (you are slightly above it).
- Fee is collected at signing, so it does not depend on policing the whole job, but it also relies on the contractor reporting the win honestly.
- Block Renovation acquired BuildZoom's marketplace (listing dated January 2025), i.e. a managed GC bought a lead/matching marketplace.

### 3.3 Managed GC / "platform is the contractor": Block Renovation, Homebound, Angi Services, Handy, Home Depot/Lowe's installation
```
Homeowner ◄─── ONE contract + ONE price ───► Platform (contractor of record)
Platform ──subcontract + payment──► Vetted subs / installers
Homeowner pays Platform. Platform pays subs. Platform revenue = price - sub cost.
```
- **Block Renovation** (Brooklyn; bathrooms then kitchens; all-inclusive price before commitment; pre-vetted contractor network). $50M Series C Nov 2021 led by SoftBank Vision Fund 2; funding totals reported $94-118M. Current profitability unknown.
- **Homebound:** tech-enabled builder; $75M Series C 2022; Fortune (Dec 2025) reports $400M raised in total ($100M operating, $300M real-estate capital).
- **Handy:** the customer pays Handy and the pro is paid by Handy; commonly cited commission ~20% (2015 reporting; Handy does not publish it).
- **Home Depot / Lowe's:** homeowner buys materials and installation from the retailer; the retailer arranges installers. Both started by subcontracting and have been pulling more in-house. A WCVB investigation found Home Depot misled customers about using subcontractors and led it to change background checks. **Lesson: disclose subs up front** (the contract template does).
- **This is your model.** It needs capital, licensing and operations, which is why the funded players are venture-backed.

### 3.4 Payment and escrow rails (neutral infrastructure)
- **Procore Pay / Levelset:** GC-to-sub payments with lien-waiver collection, using a bank partner (Goldman Sachs Transaction Banking). A Procore-sponsored survey says more than two-thirds of sub payments arrive >30 days after invoicing (treat as vendor-sponsored). Fast, certain payment is the thing subs value most.
- **PayKeeper** (construction/solar escrow; claims next-day disbursement after milestone verification), **RateDeed** (Stripe-based milestone escrow with photo verification), **ContractorsNest** (US; license/insurance checks; funds held until both parties confirm), **Renopay** (UK, FCA-authorised). These show demand for protected milestone payments; I could not verify their scale.

### 3.5 Where your plan sits
| | Lead marketplace | Success fee | **Your plan** | Managed GC |
|---|---|---|---|---|
| Customer's contract is with | the pro | the pro | **you (GC of record)** | the platform |
| Who holds the money | pro | pro | **you (milestones)** | platform |
| Sub revenue to platform | per lead / sub | % at signing | **monthly sub + 5% withheld from payouts** | none (margin only) |
| Customer revenue to platform | none | none | **price - sub award** | price - sub cost |
| Leakage risk | high | high | **low (you hold the money)** | low |
| Capital / compliance burden | low | low | **high** | high |

Your plan is the managed-GC model plus a subscription and a fee on the supply side. The extra sub-side revenue is small (section 5) but the sub subscription and fee do usefully filter for committed subs.

## 4. Acquisition cost
Reported cost per lead for remodeling on Google ranges **$90-$250** (kitchens), with Google Local Services call leads $49-$112 (a 2026 vendor report across 15 US markets, not NY-specific). No New York-specific benchmark was found: **pull real CPC and conversion data from a small test campaign before trusting any model.**

## 5. Unit economics (reproducible: `node docs/unit-economics.js`)
Inputs that are sourced: cost per lead, Stripe fees. **Assumptions (mine):** lead to booked 35%, booked to visit held 75%, visit to signed 25% (so ~15 leads per signed job), $120 estimator cost per visit, 2% warranty reserve, the app's default pricing (25% margin, 10% overhead, 5% contingency), sub award = direct cost + contingency (about 68% of price), 5% fee on the award.

| Customer price | Sub award | Platform margin + fee | Cost per lead | Ad cost per sale | Estimator cost | **Contribution per signed job** |
|---|---|---|---|---|---|---|
| $9,240 | $6,300 | $3,255 | $100 | $1,524 | $480 | **$1,025** |
| $9,240 | $6,300 | $3,255 | $165 | $2,514 | $480 | **$34** |
| $9,240 | $6,300 | $3,255 | $250 | $3,810 | $480 | **-$1,261** |
| $18,480 | $12,600 | $6,510 | $100 | $1,524 | $480 | **$4,079** |
| $18,480 | $12,600 | $6,510 | $165 | $2,514 | $480 | **$3,089** |
| $18,480 | $12,600 | $6,510 | $250 | $3,810 | $480 | **$1,793** |
| $30,800 | $21,000 | $10,850 | $100 | $1,524 | $480 | **$8,152** |
| $30,800 | $21,000 | $10,850 | $165 | $2,514 | $480 | **$7,161** |
| $30,800 | $21,000 | $10,850 | $250 | $3,810 | $480 | **$5,866** |

- **Break-even** (assuming $30K/month fixed cost: staff, software, insurance, bond): ~10 signed jobs/month at $18K, ~4 at $31K.
- **The 5% fee is small:** $700 on a $14K award vs ~$5,800 of margin. **The subscription is negligible:** 15 subs = $825/month.
- **Sensitivity that matters most:** visit-to-signed rate and cost per lead. Halving the close rate doubles acquisition cost per sale. Estimate quality and speed are your real levers, which is why the voice agent and fast quoting exist.
- **Payment costs are small if you use ACH:** a $10,000 milestone costs ~$290 by card vs $5 by ACH (Stripe: 0.8% capped at $5). Stripe Connect adds $2/active sub/month + 0.25% + $0.25 per payout. Defaulting customers to ACH is worth tens of thousands per year.

## 6. Risks (ranked)
1. **Regulation and licensing** (section 7): you need to be a properly licensed/registered contractor where you operate, and handle deposits under NY rules.
2. **Customer acquisition cost** overruns on small jobs.
3. **Sub quality and warranty:** you own the customer's outcome. One bad sub can cost more than the fee income of ten jobs. Vet COI, license, references; hold retainage (10% of the job is held to the final walkthrough in the app).
4. **Working capital and disputes:** milestone design keeps cash positive, but chargebacks/ACH returns and disputes need a reserve.
5. **Disintermediation:** subs and customers going around you. Mitigations in `payment-enforcement.md`.
6. **Concentration and seasonality** (roofing/exterior is seasonal in the Northeast).
7. **Capital intensity of the managed model:** the venture-funded competitors raised tens to hundreds of millions.

## 7. Regulatory facts and open items (NY / NJ)
Confirmed from primary or near-primary sources:
- **NY Attorney General, home improvement fact sheet:** written contract required; customers have an unconditional right to cancel until midnight of the third business day; pre-completion payments "must be put into a trust (escrow) account in a bank located in New York State within five business days" (alternative: a bond delivered within ten business days of receiving the money); progress payments must bear a "reasonable relationship" to the work done; licenses required in NYC and Suffolk, Nassau, Westchester, Putnam and Rockland counties.
- **NJ:** contracts over $500 and all change orders must be written and signed; contractors register annually with Consumer Affairs; registrants must post security ($10K/$25K/$50K tiers by size, reported since 2025); the contractor may not demand final payment before the job is complete. A 2023 law moves NJ toward licensing; the effective date is unclear.
- **NJ Prompt Payment Act:** prime contractors pay subs within 10 days of being paid for accepted work (unless agreed otherwise in writing). **NY GBL Art. 35-E** applies to contracts of $150,000 and up (so rarely to your jobs).
- **NY Lien Law Art. 3-A:** payments a contractor receives for an improvement are trust funds for the subs, laborers and suppliers on it. Design consequence: pay subs first from those funds; never treat deposits as general cash.
- **Stripe:** "doesn't provide escrow services or support escrow accounts"; recommends holding funds only with a clear purpose and speaking to a legal advisor; manual payouts must be paid within 2 years (US).

**Not verified (take to a lawyer, do not rely on me):** whether any NY/NJ percentage cap on deposits exists (none found); how NY/NJ money-transmitter law treats a GC holding customer funds and paying its own subs (my reasoning: because the customer owes the money to you, the contractor of record, and you pay your own vendors, it is ordinary commerce rather than transmission on behalf of others, but this is not a legal opinion and the escrow-style handling may still bring regulation); NJ card-surcharge rules (NY's GBL 518 requires disclosed total pricing and caps the surcharge at your actual card cost); NY GBL 756's residential carve-out; NJ licensing start date.

## 8. Things I could not find
Angi Services and Handy current take rates; Block Renovation's current status and profitability; any NY-specific cost per lead; a count of residential remodelers in the NY/NJ metro; BuildZoom's current fee (their help page may have changed).

## 9. Plan
1. **Weeks 0-4:** licensing/registration, general liability + workers' comp, NY bond or segregated trust account, attorney-reviewed contract and sub agreement.
2. **Weeks 2-8:** $3-5K test ad spend to measure real cost per lead and close rate; run estimates with 2 estimators; recruit 5-10 vetted subs by hand.
3. **Months 2-4:** first 20-30 jobs using platform-collects milestones; measure gross margin per job, dispute rate, on-time rate.
4. **Only then:** open the sub board publicly, raise the minimum job size if CPL is high, and consider a second metro.

## Sources
- Angi 10-K FY2024: https://www.sec.gov/Archives/edgar/data/1705110/000170511025000018/angi-20241231.htm
- Angi FAQ (payments): https://www.angi.com/faq/payment/
- Phonely, Angi lead economics: https://www.phonely.ai/blogs/is-angi-leads-worth-it--what-contractors-really-need-to-know
- Thumbtack model: https://thinkinsights.net/digital-transformation/thumbtacks-two-sided-marketplace ; https://fourweekmba.com/how-does-thumbtack-make-money-thumbtack-business-model
- BuildZoom fee: https://www.buildzoom.com/answers/6971/what-does-buildzoom-charge-for-this-service
- Block Renovation: https://techcrunch.com/2021/11/09/block-renovation-gears-up-for-national-expansion-following-50m-round/ ; https://www.cbinsights.com/investor/lyra-technologies ; https://www.brickunderground.com/improve/block-renovation-reinventing-home-renovation-in-new-york-city
- Homebound: https://www.fortune.com/2025/12/15/this-thrive-backed-startup-says-it-aspires-to-be-the-amazon-of-homes/
- Handy: https://www.bostonglobe.com/business/2015/11/24/tipping-feature-added-demand-app/OWLZJmAFfXeFjjXiuK9bcL/story.html
- Home Depot / Lowe's installers: https://ilsr.org/?p=1856 ; https://www.ewweb.com/news/article/20918919/home-depot-building-new-installation-services-business
- Procore Pay / Levelset: https://www.enr.com/articles/55278-new-procore-payment-service-aims-to-cut-down-on-delays
- Escrow startups: https://www.upsilonit.com/cases/fintech-mvp ; https://www.producthunt.com/products/ratedeed ; https://www.mychesco.com/?p=655518
- Harvard JCHS: https://www.jchs.harvard.edu/press-releases/remodeling-growth-set-downshift-late-2026
- IBISWorld: https://www.ibisworld.com/united-states/industry/new-york/remodeling/15018/ ; https://www.ibisworld.com/united-states/industry/new-jersey/remodeling/13217/
- NY market: https://www.brownstoner.com/brooklyn-life/closing-bell-the-nyc-home-renovation-report ; https://www.jchs.harvard.edu/blog/new-yorks-12-billion-remodeling-market-is-the-largest-among-major-metro-areas
- NY AG home improvement fact sheet: https://ag.ny.gov/home-improvement-fact-sheet
- NY Lien Law Art. 3-A: https://blogs.duanemorris.com/constructionlaw/2025/12/22/under-article-3%E2%80%91a-of-the-ny-lien-law-settlement-proceeds-are-trust-assets-not-a-source-of-contractor-reimbursement/
- NJ home improvement: https://norrismclaughlin.com/general-firm-blog/homeowner-warranty/navigating-regulations-new-jersey-residential-home-improvement-contracts/ ; https://www.suretybonds.com/blog/a-guide-to-new-jerseys-updated-home-improvement-contractor-laws/ ; https://www.njconsumeraffairs.gov/Documents/HIC-HEC-Regarding-Changes-To-The-Law-New-Requirements-For-Registration.pdf
- Prompt payment: https://www.bressler.com/news-Refresher-on-New-Jerseys-Prompt-Payment-Act
- Stripe: https://docs.stripe.com/connect/account-balances ; https://docs.stripe.com/connect/manual-payouts ; https://stripe.com/connect/pricing
- NY surcharge: https://newyork.public.law/laws/n.y._general_business_law_section_518
- Lead costs: https://www.leadgen-economy.com/blog/kitchen-bathroom-remodeling-leads-complete-guide/ ; https://www.fixr.com/pros/kitchen-remodeling-leads
