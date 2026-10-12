# Pricing research: self-serve automation-first TMS (as of 2026-10-10)

Tags: [vendor page] = fetched from vendor site this session; [third party] = review/aggregator/competitor; [unverified] = single weak source, conflicting, or my inference. Nothing below is invented; gaps are marked "not found".

## 1. Taxonomy of pricing models

| Model | Trucking examples (with price) | Pros for SMB trucking | Cons / risks |
|---|---|---|---|
| Per power unit / truck | TruckLogics 1-2 trucks $39.95/mo ($35.96 yearly), 3-7 $79.95, 8-14 $199.96, 15-24 $249.95, 25+ quote [vendor page http://www.trucklogics.com/pricing]; TruckingOffice Basic $25 (1-2), $55 (3-7), $90 (8+) [vendor page https://www.truckingoffice.com/pricing]; Rigbooks $19-$149 + per extra truck [vendor page https://rigbooks.com/pricing]; Datatruck $99/$299/$499 by truck band [vendor page-ish, Datatruck blog, competitor-authored]; Fleetio $4-$10/vehicle [third party snippet of vendor page] | Predictable, scales with the customer's revenue capacity, easy to explain. Matches founder's "no per-load meter". | Owner-ops with 1 truck are low ARPA; trucks vs drivers gap (team drivers, seasonal); "idle truck" disputes -> define "active truck". |
| Per user / seat | Tailwind Pro $99/Ent $149/Unl $199 per user/mo [third party Capterra; older review $135/$195/$265]; Axon ~$65/user est. [third party/unverified]; DAT One $54-$339/user [third party]; McLeod per-module + per-user [third party] | Familiar to B2B buyers | Punishes adding dispatchers/drivers; owner-ops share logins; bad fit for automation-first (fewer humans = less revenue). |
| Per load | Alvys "Foundations" $3.95/load, no per-truck fee, month-to-month [vendor page https://alvys.com/free-trial]; Truckbase offers per-load option [vendor page]; Alvys "~$1,500/mo at ~3,000 loads" is the founder's own number | Low entry, aligns with usage | Founder rejects: meter anxiety, punishes growth, busy months spike, customers game load counts. |
| Flat tiered by fleet size | Truckbase min $290/mo billed annually [vendor page https://www.truckbase.com/pricing]; Truckpedia $299.99 flat [third party Capterra]; Five Star TMS $39.99 flat [third party]; Revenova from ~$2,500/mo [third party G2]; Rose Rocket from ~$2,080/mo unlimited users [third party Numeo/Toolradar] | Simple, budgetable | Overcharges small, undercharges large (Datatruck blog, biased); cliff effects at band edges. |
| Freemium | Many "free TMS" listings (AscendTMS, EnvioHQ, UROUTE, Trucking365 per SelectHub) [third party]; AscendTMS free plan reportedly gone, floor $69/user [third party Numeo, competitor-authored, unverified]; Trucker Path app free + paid Gold $14.99/Diamond $29.99 [third party] | Lowest switching barrier, viral among owner-ops | Support cost of non-payers; low freemium-to-paid (see sec. 3); needs a monetizable upgrade or embedded revenue. |
| Free trial | TruckingOffice 30 days, no card [vendor page]; Rigbooks 30 days, no card, refund guarantee [vendor page]; TruckLogics 7 days (card status not stated) [vendor page]; Tailwind 30-day trial [third party; sources conflict, TrustRadius says none]; Fleetio 14 days no card [third party snippet]; Alvys "Try for free", length not stated [vendor page]; Axon/McLeod demo only [third party] | Fast qualification, urgency | Setup effort is the real barrier in TMS (data import), so a 7-day trial can expire before value. |
| Usage / credit based | Datatruck add-ons (EDI $499/connection, AI Dispatcher $399/mo) [vendor-authored blog]; IFTA per report TruckLogics $19.95-24.95 [vendor page] | Fits AI/automation cost (OCR, calls) | Unpredictable bills; low-tech buyers dislike meters. |
| Hybrid (base + modules / usage) | McLeod per-module licensing [third party]; Datatruck base + add-ons; TruckingOffice base + PC*MILER add-on $5/$15/$25 [vendor page] | Land cheap, expand | Complexity; "nickel and dime" perception. |
| Outcome / take-rate / rev-share | TriumphPay (payments, interchange ~1.9% on LoadPay debit per Q4 call [third party transcript]; rev-share with brokers on quick pay [third party FreightWaves]); Trucker Path flat commission per load on factoring [third party 2017]; fuel card rebates ($0.03-$0.08/gal Comdata/WEX per Oxmaint, conflicting [third party]); Love's gave AscendTMS free to factoring customers [third party FreightWaves]; Axle gives a year of Ascend TMS free with funding [third party] | Software can be free; aligned with carrier cash flow | Conflicts of interest (steering to factor), regulatory/KYC load, revenue depends on credit risk; carriers see "free" as a catch. |
| Annual prepay discount | TruckLogics ~10% [vendor page]; Truckbase $290 requires annual billing [vendor page]; Samsara 3-yr contracts [third party] | Cash up front, retention | Contradicts "lowest barrier"; offer as optional only. |
| Setup / implementation fee | Rose Rocket white-glove ~90 days (included in $2,080 per Toolradar [third party]); Axon implementation anecdotes $25k+ [third party competitor blog]; Truckbase onboarding free [vendor page]; Alvys none stated [vendor page]; Tailwind "no set-up fees" [third party] | Funds services | The exact pain the founder dislikes. |
| Hardware margin | Samsara hardware $99-$548/vehicle est., 3-yr term [third party]; Motive ~$150 device est., 12-month min [third party]; EZLOGZ ELD/dashcam/GPS devices, no prices listed [vendor page] | Real margin | Capital intensive; out of scope for software-only MVP. |

## 2. Competitor pricing detail

- **Tailwind TMS**: per-user Pro $99 / Enterprise $149 / Unlimited $199 [third party Capterra https://www.capterra.com/p/275384/Tailwind-TMS/pricing/]; older $135/$195/$265 [third party fitsmallbusiness]; 30-day trial [third party; conflicts]; no setup fees/contracts [third party]. Vendor pricing page redirects to a CargoWise page with no prices (Tailwind now owned by the CargoWise/WiseTech family, per redirect) [vendor page]. Factoring mention not confirmed.
- **TruckLogics**: see table; 7-day trial CTA; billed monthly, no refunds, no auto charge language odd [vendor page http://www.trucklogics.com/pricing]. Broker $99.95. Yearly saves 10%.
- **TruckingOffice**: Basic $25/$55/$90, Broker $45; Pro $35/$75/$130; no per-user fees; 30-day no-card trial; monthly, no contract [vendor page https://www.truckingoffice.com/pricing]. Closest existing model to the "low barrier" ideal.
- **Rigbooks**: Basic Entry $19, Leased O/O $29, Independent O/O $49, Small Fleet $149 (5 trucks) + $29/extra; 30-day trial no card [vendor page https://rigbooks.com/pricing]. Bookkeeping-oriented, not a full TMS.
- **Truckbase**: min $290/mo billed annually; per truck/driver/load/flat/custom; free onboarding; trial terms not stated [vendor page https://www.truckbase.com/pricing]. Capterra shows $490 [third party].
- **Alvys**: Foundations $3.95/load, no per-truck fee, no contract, "try for free", comparison claim that cloud TMS "typically $1-5 per load" [vendor page https://alvys.com/free-trial]. Search snippet hinted at a struck-through price ($3.95 vs $2.95) [unverified]. G2 shows $292 for 50 loads [third party, ~$5.84/load]. The founder's ~$1,500/mo / sales-led / setup fee experience conflicts with "no setup fee" marketing for Foundations; likely different tier [unverified - ask founder what plan]. Sacra speculates Alvys monetizes fuel cards/interchange [third party analysis, not disclosed].
- **Axon**: no list price; est. ~$65/user [unverified]; demo-only; implementation $25k+ anecdotes [third party competitor Toro/Tracx blogs]. (Do not confuse with Axis TMS, from $99/mo [third party Capterra].)
- **Rose Rocket**: from ~$2,080/mo, unlimited users, ~90-day white glove [third party Toolradar/Numeo]; Sacra cites much higher custom range $12-40k/mo [third party, conflicting]. Pricing not fetched from vendor.
- **McLeod**: quote only, per-module + implementation; needs IT staff [third party]. No dollar figures verified.
- **Revenova**: G2 "starting at $2,500/month per company", annual subscription [third party G2].
- **Trimble TMW / Descartes**: no public pricing found [third party G2 "not provided"]. Aljex/3G contact-sales.
- **Motive / Samsara**: neither publishes price lists. Samsara ~$27-33 base up to $50/vehicle/mo, 3-year term, hardware extra [third party Tech.co/CostBench]. Motive ~$25-50/vehicle/mo, 12-month min, hardware ~$150 [third party, conflicting].
- **Trucker Path**: Gold $14.99/mo, Diamond $29.99/mo (annual $249.99), fleet seats 5 for $99.99 [third party; fleet figure unverified]. Financial products (factoring, fuel advances) launched 2016 [third party 2017 article].
- **Truckstop**: Basic $42, Advanced $135, Pro $159 + $42 application fee [third party summar/otrucking, affiliate-style]. **DAT One**: Standard $54-59, Enhanced $119-149, Pro $169, Select $239-259, Office $329-339 per user [third party, conflicting].
- **Fleetio**: Essential $4 (annual)/$5 monthly, Professional $7, Premium $10 per vehicle/mo, assumes 5 assets, 5-vehicle minimum; 14-day trial no card [third party summary of vendor page https://www.fleetio.com/pricing; vendor page returned 403 to me, so unverified firsthand].
- **EZLOGZ**: no prices published, demo not trial, hardware sold, referral $5 off per device [vendor page https://ezlogz.com/pricing].
- **Free / near-free TMS**: UROUTE (vendor blog claims free) [vendor-authored, Oct 2025]; Axele TMS (Optym) "free or small fee" with Apex/Triumph factoring links [third party 2021-22, stale]; AscendTMS free tier status disputed; Five Star TMS $39.99 flat with trial [third party]. Free tools funded by factoring: Love's/AscendTMS [third party]; RTS and OTR offer apps to factoring clients (RTS Pro: factoring, fuel discounts, credit reports) [third party]; no confirmation that RTS/OTR TMS software is free.

## 3. Trial vs freemium evidence

- ChartMogul / Kyle Poyar SaaS Conversion Report 2026 (n=200 B2B, self-reported; fetched) [third party https://chartmogul.com/reports/saas-conversion-report/]:
  - 57% of products use free trial as primary; 26% freemium; 7% reverse trial. Trial length: 14 days 62%, 7 days 14%, 30 days 14%. 20% of trials require a card.
  - Conversion good/great: free trial no card 4-6% / 10-15%; card required 25-35% / 50-60%; freemium gated 3-5% / 8-12%; ungated 7-9%; reverse trial 4-6% / 8-12% (small sample, not significant).
  - Per 1,000 visitors: freemium 90 signups -> 5 paying; no-card trial 45 -> 3.6; card-required trial 35 -> 10.5. So card-on-file yields most paying customers per visitor but fewest signups.
  - No benchmark on time-to-value or SMB-only splits.
- Visionary Marketing 2026 (84,200 signups, 38 accounts; single vendor dataset; not opened) via search snippet: opt-out (card) 60.4%, opt-in 25.2%, freemium 4.7%, reverse 38.4% [third party, unverified]. First Page Sage (via secondary blogs): opt-out 48.8% vs opt-in 18.2%; freemium visitor->free 13.3%, free->paid 2.6% [third party, unverified]. Conflicts with ChartMogul figures on opt-in (they define conversion differently), so treat as direction only.
- Implication for trucking: incumbents already use 30-day no-card (TruckingOffice, Rigbooks), so "7-day trial" would be shorter than the cheapest competitors; a card-less long trial is table stakes and not a differentiator. Differentiate on time-to-first-value (import from Alvys/spreadsheet/email in minutes) rather than trial length. [my inference]
- Reverse trial (full premium for N days, then downgrade to free tier) is supported only by weak evidence here; no trucking example found.

## 4. Embedded-services-subsidised software

- Documented: Love's gives AscendTMS free to factoring customers [third party]; Axle gives Ascend TMS free for a year with funding [third party]; Trucker Path earns flat commission per load on factoring and fuel advances (2017) [third party]; TriumphPay earns payments fees, ~1.9% interchange on LoadPay debit, rev-share with brokers; ~$35 revenue per small-carrier invoice (~$1,600 avg) [third party earnings transcript]; Axele integrates Apex/Triumph factoring [third party]; RTS Pro bundles factoring, fuel discounts, credit reports [third party].
- Alvys fuel-card/interchange monetization is Sacra's speculation, not disclosed [third party].
- Not found: published rev-share terms for TMS-to-factor or TMS-to-fuel-card referrals; Tailwind/Truckstop embedded-finance economics; insurance referral economics. Fuel rebates $0.03-$0.08/gal (Comdata/WEX) are marketing-grade and conflicting [third party].
- Conflicts: factor-owned software locks the carrier to one factor; recourse/credit risk; cash-flow data used for underwriting raises privacy concerns; "free" software with mandatory finance product can be seen as predatory; regulated activity (money transmission) means partner-bank/BaaS dependence (e.g. Triumph, Relay, Comdata). [my inference]

## 5. Candidate pricing designs (not per delivered load)

All price points below are proposals to test, not market facts.

**A. Free forever (core ledger/dispatch for owner-ops)**
- Free: 1-2 active trucks, unlimited loads, AI doc intake (rate cons, BOLs), invoicing, basic settlements. Paid "Pro" $29/mo adds IFTA, e-sign/auto-invoice to factor, integrations. Monetise via optional factoring/fuel card referral.
- Fits: owner-ops, new authorities. Breaks: support cost, abuse by brokers/dispatch services running many free accounts; AI cost (cap docs/mo, e.g. 50). Test first: free->paid at 90 days, doc cap sensitivity. Benchmark: ungated freemium 7-9% good [ChartMogul].

**B. Trial + per active truck**
- $19/active truck/mo (1-5), $15 (6-25), $12 (26+); unlimited users and loads; 14-day trial, no card, white-glove import included; month-to-month; annual -15% optional. "Active" = truck with a dispatched load that month; idle trucks free.
- Fits: 2-100 truck fleets. Breaks: seasonality, gaming "active" definition, Alvys-size accounts: 20 trucks = ~$300/mo vs founder's $1,500 paid. Test first: 14d vs 30d no-card vs card-required (ChartMogul suggests card gives ~3x paying per visitor but fewer signups).

**C. Hybrid base + modules**
- Base $49/mo per company (unlimited users, up to 5 trucks), +$9/truck beyond. Modules: AI dispatcher/email-to-load $99, EDI $49/connection, driver pay/settlements $29, IFTA $19, API/accounting sync $29.
- Fits: 10-100+ fleets that want to pay only for automation. Breaks: pricing complexity, module bloat. Test first: which module is the attach-rate leader; bundle into 2 tiers if attach is low.

**D. Embedded-finance subsidised**
- Software $0 when carrier uses our factoring/pay/fuel-card partner (rev-share from partner); $39/truck if they opt out. Possibly rev-share on ACH/instant-pay interchange.
- Fits: cash-strapped owner-ops/small fleets that already factor (many do). Breaks: partner dependency, conflicts of interest, regulatory, revenue lag (months), lock-in perception. Test first: demand for "free software if you factor" vs concern about switching factors; partner rev-share terms (not found publicly, must negotiate).

**E. Creative: "Pay what you save" / success cap plus public price ceiling (or "pay when it works")**
- Free until it has demonstrably automated X hours (e.g. first 100 auto-processed documents), then flat $X per truck with a monthly cap at 1% of billing or $250, whichever lower; refund if they cancel in 60 days ("switch guarantee": we import your data, we pay your first month at old TMS up to $500 if you leave).
- Alternative E2: reverse trial: 30 days all features, then drop to free tier automatically (no card).
- Fits: switchers from Alvys/McLeod. Breaks: cap erodes revenue at high fleet counts; guarantee abuse. Test first: switch-credit vs trial length impact on activation.

Recommended first experiments: (1) no-card 14 vs 30 day trial with automated import; (2) free tier vs reverse trial for owner-ops; (3) per-active-truck price anchor $15 vs $25 vs $35 for 5-25 truck fleets (incumbents: TruckLogics $50/truck at 3-7 trucks band, TruckingOffice ~$18/truck at 3-7, Tailwind per user $99+).

## Caveats
Most third-party prices are inconsistent or affiliate-driven. Vendor-verified this session: TruckLogics, TruckingOffice, Rigbooks, Truckbase (partial), Alvys (partial), EZLOGZ, ChartMogul report. Everything else is third party or unverified. Rose Rocket, McLeod, Revenova, Trimble, Descartes, Samsara, Motive, Fleetio, Trucker Path, Truckstop, DAT vendor pages not read directly.
