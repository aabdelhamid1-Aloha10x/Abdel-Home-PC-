# Research: zero-input TMS / true-economics onboarding (as of 2026-10-10)
Tags: [vendor page] [third party] [unverified]. Searches were "standard" mode; many pages returned summaries only. Gaps are stated explicitly.

## 1. Cost per mile, tools, benchmarks

### ATRI Operational Costs of Trucking, 2026 edition (2025 data, released 2026-07-15) [third party: trade press; ATRI primary page NOT fetched - guessed URL 404]
Sources: https://www.fleetowner.com/operations/article/55392569/atri-report-breaks-down-class-8-truck-operating-costs-by-region-and-expense-category ; https://www.ttnews.com/articles/atri-truck-costs-2025 ; https://www.truckersnews.com/news/article/15830055/truckings-operational-costs-reached-new-high-of-2336-per-mile-in-2025 ; Overdrive (403 on fetch, snippet only) https://www.overdriveonline.com/business/article/15830180/2025-trucking-costs-surge-to-alltime-high-will-rates-keep-up
- Total: $2.336/mi (2024: $2.260, +3.4%). Ex-fuel $1.854 (2024 $1.779, +4.2%).
- Fuel ~$0.482 (7.43 mpg). Driver wages $0.818 (+2.5%), benefits $0.210 (+6.6%), combined $1.028 (first time over $1).
- Truck+trailer procurement ~$0.40 (truck ~$0.28, trailer ~$0.12). Insurance ~$0.11 (+3.9%). Tires $0.05 (+6.4%). Tolls $0.043 (+13.2%). Permits/licences ~$0.008 (only category to fall).
- CONFLICT: Repair and maintenance is $0.22/mi in FleetOwner but "40.4 cents (2024: 39.0)" in TT News. Do not quote R&M until checked against the ATRI PDF. (Components in the FleetOwner table sum to well under $2.336, so some categories are missing/unclear.)
- Regional: Northeast highest $2.52, South-Central lowest $2.23 [FleetOwner]. Avg annual miles 85,991; truck age 3.6 yrs.
- Segment cost/mi: truckload $2.21, LTL $2.58 [TT News]. Operating margins 2025: LTL 11.6%, tank 4%, truckload 0.4%, reefer 0.6%, flatbed -0.5%; most segments under 1% [TT News].
- Caveat: ATRI is a fleet average that includes W-2 driver wages and benefits; owner-operators replace these with an owner draw, so do not apply it directly [third party, Bobtail summary].

### Owner-operator benchmarks [third party, vendor blogs - directional only]
- Typical O/O cost $1.45-1.85/mi (Bobtail https://www.bobtail.com/blog/cost-per-mile-in-trucking/); O Trucking: $1.50-1.85 financed truck, $1.20-1.45 paid-off (https://otrucking.com/resources/guides/owner-operator-cost-per-mile-breakdown/). Fuel 35-40% of cost.
- Fixed: truck payment, insurance, permits, software. Variable: fuel, maintenance, tires, tolls. Example split $0.35 fixed / $0.95 variable per mile (one guide's sample, not a measured benchmark).
- Net income claim ~$64,500/yr average O/O (unverified, vendor blog). No credible net-profit-per-mile benchmark found. Guides suggest a target margin of $0.50-0.75/mi over break-even (practitioner advice).
- Spot rate figure "$2.00-2.20 dry van early 2026" is from a calculator blog, not DAT. DAT/Truckstop/OOIDA calculator pages did NOT surface: unverified.

### Existing tools and input burden
- Rigbooks: from $19/mo, per truck; trip logging, cost/mile, fuel/maintenance tracking, invoices, IFTA; bank import and 1099 settlements via sales [third party: fitgap/toolradar; https://www.rigbooks.com/ not read]. Input is mostly manual trip logging.
- TruckLogics: Owner-op ~$39.95/mo, small fleet ~$79.95, mid ~$199.96, 15-day trial [third party rfp.wiki]. Profit estimator per load uses MPG and fuel price as an ESTIMATE, i.e. not actual receipts [vendor: https://support.trucklogics.com/art/15841/trucklogics-profit-estimator-explained].
- Truckbase: quote-based; min ~$290/mo annual per one comparison, ~$490 per directories; free virtual onboarding; driver-app and annual-billing complaints [third party rfp.wiki].
- Truckers Edge, spreadsheets, QuickBooks: not researched (unverified). Hypothesis: spreadsheets/QBO rely on manual categorisation and have no load-level link.
- Gap to exploit: existing tools estimate or require manual expense entry; none found that computes actual per-load profit from ingested receipts + ELD miles + bank feeds (absence of evidence only, one search).

## 2. Zero/low-input onboarding patterns
- Rate-con AI intake from email: Datatruck TruckGPT (claims ~90% field accuracy, vendor), Vektor TMS (40+ fields, 99.2% claim, vendor), Lido (human-review queue before import), Nanonets/LlamaParse generic OCR [all vendor claims, unverified accuracy]. https://www.datatruck.io/blog/how-truckgpt-turns-a-rate-confirmation-into-a-booked-load ; https://vektortms.com/products/ai-automations. Design implication: confidence-scored review queue.
- ELD: Motive API is OAuth 2.0 with scopes; production credentials/endpoints need Motive review (third party: supergood.ai). Samsara: OAuth 2.0 for marketplace apps, token for single-org; Vehicle stats/odometer, IFTA jurisdiction mileage API, Fuel Purchase API [vendor: https://developers.samsara.com/docs/fuel-card-integration]. Marketplace approval timelines not verified.
- Fuel cards: Samsara says WEX, FLEETCOR, EFS have turnkey integrations; Samsara fuel-purchase records carry quantity, price, station, reference ID, timestamp [vendor]. WEX EFS integration pushes Samsara GPS/odometer to EFS, not card transactions into Samsara [vendor marketplace]. Comdata/WEX Fleet One APIs/file formats: NOT found. Fallback: statement CSV/PDF upload via LLM, plus email-forward of statements.
- QBO + Plaid: pattern is Plaid feed -> categorise -> write via QBO Accounting API, OAuth 2.0 [third party consultancy fintegrationfs; their 60-80% reconciliation claim unverified]. Plaid/Intuit partner requirements not checked.
- Ramp/Brex/Pilot onboarding time-to-value: NOT found (search returned nothing). Treat as unverified.
- TMS migration: Alvys says "days not weeks", free data migration, ~3 weeks go-live for LoadOps migration, customer time ~30 min-1 hr chunks [vendor: https://alvys.com/features/easy-onboarding ; https://alvys.com/blog/effortless-onboarding-for-small-to-medium-sized-companies-with-alvys]. Datatruck claims 3-5 business days [vendor: datatruck.io blog]. Tailwind/Truckbase: free virtual onboarding only, no timelines found. Rose Rocket white-glove: not found.
- Suggested time-to-first-value targets (our proposal, not sourced): connect email + fuel card in <10 min; first parsed load and first profit number same session; first true cost/mile within 24-72h of historical backfill.

## 3. Barrier-to-switch
- Independent research not found. Only data: InMotion/AscendTMS survey (old, ~2015-era): 33% of carriers under 10 trucks use a TMS, 17% under 5 trucks, 7% single-truck O/Os [third party via FleetOwner https://www.fleetowner.com/technology/article/21701771/survey-tms-becoming-must-have-technology-in-the-freight-market; date uncertain].
- Barriers named by vendors (biased): fear of missed loads/lost billing history, dispatchers unable to work while learning, migration errors, training, ROI doubt (datatruck, PCS, AMCS blogs).
- Factoring/broker integration, SMS driver links, WhatsApp, multilingual: no sourced evidence found. Tactics below are design hypotheses [unverified]: read-only "shadow mode" alongside current system (zero risk), import 12-24 months history first, keep existing invoicing/factoring workflow (export in factor's format), driver SMS link without install, Spanish/Russian/other languages.

## 4. Free tier design (hypotheses + benchmarks)
- Benchmarks [third party, secondary, Userpilot summarising 2026 ChartMogul/Poyar data - indicative]: reverse trial free-to-paid 4-6% good / 8-12% great; freemium 3-5% good / 8-12% great; card-required trial 25-35% good / 50-60% great. Nalpeiron separate study: freemium 2.6-2.8%. Reverse trial suggested 14-21 days. https://userpilot.com/blog/free-trial-conversion-rate/ ; https://userpilot.com/blog/saas-average-conversion-rate. OpenView not located.
- Proposal: free forever = connect email + fuel card/bank -> profit/load, cost/mile, break-even dashboard, doc vault, 1-truck tracking link. Paid = multi-truck, driver pay/settlements, IFTA, compliance alerts, invoicing/factoring export, bulk history. Reverse trial of full product 14-21 days then fall back to free tier. Anti-abuse: USDOT/MC verification, per-DOT single free account, OCR volume caps, rate limits on parse.
- Metrics: activation = connected source + first parsed load + first profit figure; time-to-first-load; week-1 retention; % loads auto-ingested without edit (accuracy proxy).
- Specific SMB SaaS examples (activation-based pricing) not researched: unverified.

## 5. Compliance documents
Verified from 49 CFR 391.51 (https://www.law.cornell.edu/cfr/text/49/391.51) [primary regulation text]: DQF contents: employment application; initial MVR; road test cert or equivalent; annual MVR; note on annual driving-record review; medical examiner's certificate (CDLIS MVR for CDL holders), variances; SPE cert/medical exemption; National Registry verification note. Retention: employment + 3 years; annual MVRs, review notes, med cards may be discarded 3 years after execution.
Other items:
- MCS-150 biennial update: every 2 years, due month by last digit of USDOT number, year parity by second-to-last digit; free via FMCSA portal [third party: foleyservices, simplexgroup; 49 CFR 390.19]. Penalty figures conflict ($10k vs $16k/day) - unverified; deactivation is the main risk.
- UCR: annual, registration season opens ~Oct 1, pay by Dec 31 [third party, J.J. Keller/WCS]. Fee tables conflict between sources; check ucr.gov. (Per task today = Oct 2026, so 2027 season is opening now; 2027 dates unconfirmed.)
- Drug and Alcohol Clearinghouse annual limited query (49 CFR 382.701), BOC-3, IFTA/IRP, insurance certificates, annual vehicle inspection (396.17), drug test records: NOT verified in this session (Clearinghouse FAQ URL 404). Stated from general knowledge only [unverified].
- Top automation candidates (our recommendation): med-card expiry (OCR expiry date + alert), CDL expiry, annual MVR due-date (12 months) and review note, Clearinghouse annual query reminder, insurance COI expiry (parse from email), UCR season reminder, MCS-150 due month calc from USDOT number, IFTA quarterly from ELD miles + fuel receipts, IRP/plate/registration expiry, annual inspection due, DOT number/authority status check via FMCSA data.

## Biggest unverified areas to follow up
ATRI PDF (R&M conflict, full table); Comdata/Fleet One data formats; Ramp/Pilot onboarding data; Truckers Edge; DAT/OOIDA/Truckstop calculators; any independent small-carrier switching survey; Clearinghouse/BOC-3/IFTA/IRP primary sources.
