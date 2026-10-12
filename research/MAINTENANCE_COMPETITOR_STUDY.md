# Over-the-road maintenance competitors: how they work and make money
Prepared for Masar OS (automated maintenance). Facts marked [S] have a public source (list at the end). Items marked [EST] are my estimates, not facts. Items marked [GAP] could not be found publicly.

## 1. FleetNet America (now Cox Fleet) - the reference model
**What it is:** a third-party vendor-management and breakdown-coordination company. It owns almost no repair capacity. It runs a 24/7 call center (Cherryville, NC) and a network of 60,000-65,000+ independent tow companies, mobile mechanics, tire and repair shops across the US, Canada and Puerto Rico [S]. Handles 800,000+ events a year [S]. Breakdown service since 1993 [S].
**Ownership:** ArcBest bought it in 1995 (via WorldWay) and sold it to Cox Automotive for $100M cash in Feb 2023 [S]. Cox merged FleetNet into "Cox Fleet" effective Jan 1, 2026 [S].
**Services:** emergency roadside (diagnosis by phone, dispatch, tow, tires, mobile repair), preventive maintenance scheduling, repair-shop vendor management, a driver mobile app, ELD/telematics fault-code triggered dispatch, repair data coded to VMRS with reporting (miles between breakdowns etc.), national-account/vendor billing, cost-reduction reports [S].
**Operating flow:** driver (or telematics) triggers a call > coordinator troubleshoots by phone (average 20 years mechanical experience) > picks a vetted vendor > vendor dispatched > estimate approved per the customer's authorization rules > vendor repairs > vendor sends invoice > FleetNet audits it, pays the vendor, and sends the customer ONE invoice [S].
**How the customer is billed (from FleetNet's Terms, Dec 2024) [S]:**
- Customer pays (i) FleetNet fees as set in a customer-specific "Service Document", (ii) the GROSS amount of vendor invoices, and (iii) a "Terms Fee".
- Net 15 days. If the customer pays by check/wire within 15 days it may deduct 2.5% (the Terms Fee). Card payments never get the 2.5% discount. So the 2.5% is effectively a surcharge on slow or card payers.
- FleetNet pays vendors when the work is done (vendors get a payment guarantee) and keeps early-pay discounts and rebates from vendors under its purchasing arrangements; the Terms say these offset its admin cost, the cost of guaranteeing payment and the cost of money. It can refuse to pay a vendor and demand payment up front.
- Customer must authorize pre-invoice; if no answer by the 10th day, FleetNet bills anyway.
- Sales tax is included unless the customer gives an exemption certificate.
- Liability: FleetNet disclaims all warranty and liability for work quality; liability sits with the vendor that did the work. Disputes must be raised within 12 days. Venue North Carolina.
- No enrollment fee [S]. The per-event fee schedule is not public [GAP].
**The money (ArcBest 2022 numbers) [S]:** revenue $343.1M (about $300M external), adjusted operating income about $5.9M (about 1.7% margin), adjusted EBITDA $7.7M (about 2.2%). Sold at roughly 13x EBITDA. Meaning: most revenue is vendor invoices passed through (gross billing). The real profit pool is small and comes from fees, the 2.5% terms spread, and vendor discounts/rebates, paying for a large human call center.
**FleetNet's real moat:** (1) a huge pre-vetted vendor network, (2) payment guarantee that vendors want, (3) one invoice for the customer, (4) 24/7 humans, (5) data and integrations.

## 2. The six business models in this market
| Model | Examples | How they charge | How they make money | Fit for Masar |
|---|---|---|---|---|
| Vendor-management broker | FleetNet/Cox Fleet | Service Document fee + gross vendor cost + terms fee; no enrollment fee | Fees, terms spread, vendor early-pay discounts/rebates | Direct competitor on large fleets |
| Travel-center networks | TA RoadSquad, Love's Truck Care/Speedco (400+ locations) | No membership or contract; pay per job; central billing; often no call-out fee when their own tech responds [S] | Repair/parts/tire margin, fuel and traffic to stops | Competes on convenience; Masar can use them as vendors |
| Tire OEM programs | Michelin ONCall/Advantage, Goodyear FleetHQ | Free or low-cost 24/7 emergency service for program fleets, negotiated tire prices [S] | Tire sales lock-in | Vendors/partners, not rivals |
| Memberships / insurance add-ons | Coach-Net, Best Roadside, Roadside Masters, insurer add-ons, Verizon Connect | Roughly $150-$900 per truck per year, or $35-$60 per truck per month; pay-per-call $300-$1,000+; some plans exclude Class 8 [S, mixed quality] | Membership float (most never claim) | Substitutes for owner-operators |
| Outsourced maintenance management | Third-party maintenance managers | About $49 per truck per month for management + pass-through repairs, bundled plans up to about $999 per truck per month; performance fee models (example: $279 on a $3,500 repair) [S, single vendor claims] | Management fee, parts markup (reported 20-40%), labor rate spread | Closest to "automated maintenance" pricing |
| Fleet-card programs | Comdata/FleetCor | National-account tire pricing for card customers [S] | Card interchange and fees | Possible partner |

## 3. What this means for Masar's "automated maintenance"
**Where FleetNet is strong:** vendor network, payment guarantee, 24/7 humans, scale. A new company cannot copy 65,000 vendors quickly.
**Where Masar can win:**
1. Small and mid fleets that FleetNet treats as low priority and pays humans to serve at a cost.
2. Cost: AI + Vapi voice is roughly $1-$3 of cost per case [EST] vs a human coordinator. Software gross margin can be 80-90% [EST].
3. Ownership: the AI follows the whole case, timers, relays, re-sourcing, and records it in the TMS (load, dispatch, PM, DVIR, cost per mile). FleetNet is a separate system.
4. The customer's OWN preferred shops and rates (no forced network), with transparent all-in quotes.
**Where Masar is weak, and the answer:**
- Cold start on vendors: start with each customer's own shops + shops the AI finds (Google Places/directories), + travel-center and tire-OEM programs as vendors. Build a Masar vendor scorecard from real cases.
- Payment guarantee: shops accept discounts and take hard jobs from FleetNet because they are guaranteed payment. Masar's model (owner pays, record-only) gives shops no guarantee. Options later: a per-company funded virtual-card (Stripe Issuing) or paying through the customer's fleet card. This is the single most important product decision for negotiating power.
- 24/7 humans: Needs-you escalation plus an on-call human option for the "unusual" cases.

## 4. Possible Masar pricing models for maintenance (decide after validation) [EST]
| Option | How | Pros | Cons |
|---|---|---|---|
| A. Included in plan | Growth plan includes Autopilot maintenance; usage via credits | Simple, sells the result | Heavy users cost more |
| B. Per-case fee | e.g. $19-$49 per breakdown case coordinated | Aligned with value, clear ROI vs 5-10% negotiated savings on a $600 event ($30-$60) | Customers watch usage |
| C. Per-truck monthly | e.g. $9-$19 per truck for always-on maintenance coordination | Predictable revenue | Pays even with no events |
| D. Savings share | e.g. 20% of verified savings (FleetNet-like competitors use performance fees) | Zero risk to customer | Needs honest baselines |
A sensible start: A for Growth (bundled, credits) + B or D as an add-on for Core.
Illustrative case math [EST]: average event $600; AI saves 5-10% = $30-$60; Masar cost per case $1-$3; at a $29 per-case fee the gross margin is about 90% and the customer still nets $1-$31 ahead before counting the saved human time.

## 5. Gaps and how to close them
- FleetNet's actual fee schedule [GAP]: call as a fleet buyer, ask for the Service Document.
- Penske, Fleet Response and other regional brokers [GAP]: not found in public sources; check directly.
- Real vendor experience: interview 5 shops that work with FleetNet about discounts demanded and payment speed.
- Interview 5 small fleets: what they pay per event today, how long a breakdown takes to resolve, what they hate.

## Sources
- FleetNet/Cox Fleet how it works: https://coxfleet.com/resources/how-truck-repair-works-with-fleetnet-america/ and https://fleetnetamerica.com/blog/post/how-truck-repair-works-with-fleetnet-america/
- FleetNet Terms and Conditions (Dec 2024 PDF): https://fleetnetamerica.com/wp-content/uploads/sites/2/2024/12/FNA-Terms-and-Conditions-12_24.pdf
- Cox acquisition and merger: https://www.fleetowner.com/operations/article/21261003/cox-automotive-acquires-fleetnet-america and https://www.coxautoinc.com/press-releases/cox-automotive-unites-fleet-services-and-fleetnet-america-into-one-fleet-team-organization/
- ArcBest sale, financials: https://www.freightwaves.com/news/arcbest-trims-product-offering-with-100m-sale-of-fleetnet , https://www.truckingdive.com/news/arcbest-fleet-maintenance-cox-enterprises-automotive/643860/ , SEC 8-K https://www.sec.gov/Archives/edgar/data/894405/000155837023002401/arcb-20230228xex99d1.htm
- TA RoadSquad: https://ta-petro.com/professional-drivers/ta-truck-service/emergency-roadside-assistance
- Love's roadside: https://loves.com/truck-services/loves-emergency-roadside-assistance
- Roadside costs: https://www.logrock.com/commercial-truck-insurance/commercial-roadside-assistance-plans/ and https://renegadeinsurance.com/blog/truck-insurance/roadside-assistance-cost-breakdown-for-truckers/
- Fleet maintenance outsourcing pricing: https://routemate.us/blog/outsourced-maintenance-for-trucks/ and https://millennialsmaintenance.com/blog/fleet-maintenance-coordination-cost
- Michelin/Goodyear programs: https://www.truckinginfo.com/157938/how-fleets-can-get-the-most-from-a-national-tire-account
