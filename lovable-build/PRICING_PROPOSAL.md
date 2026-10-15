# Pricing and credits proposal (premium positioning). DRAFT for owner decision. Nothing sent to Lovable.
Owner direction Oct 15: premium, not cheap-TMS; credits sized so a full-tier customer at max trucks and max usage lasts at least half the month; extra credits bought as packs after that.

## 1. Facts from the repo (docs/reports/credits-vs-cost.md, Oct 12)
- Only test traffic exists. Built-in AI cost per action is tiny (Masar message ~$0.0006, doc read ~$0.0008, voice note ~$0.0003). Phone calls are the real cost: ~$0.112 per minute (list prices, NOT verified against a Vapi/Twilio invoice). Current rate 10 credits/min.
- Today's plans: Solo $39/300 credits, Core $97/1,000, Growth $249/4,000. Packs $25/1,000, $110/5,000, $400/20,000. Rule: never show a per-action credit price in the UI; included credits expire monthly, packs never expire.

## 2. "Maxed usage" model (MY ASSUMPTIONS, unverified, to be replaced with real data after 30 days)
Per truck per day, heavy: 25 Masar messages (50 cr) + 6 doc reads (12) + 10 voice notes (10) = 72 credits; with voice plans add 5 phone minutes (50) = 122.
Included credits = that heavy day x 15 days (half a month) x max trucks in the tier:
| Plan (max trucks) | Voice | Heavy credits/truck/day | Included credits (50% of month) | Est. real cost at that usage |
|---|---|---|---|---|
| Solo (1) | no | 72 | 1,100 | ~$0.5 |
| Core (3) | no | 72 | 3,300 -> 3,500 | ~$1.5 |
| Growth (10) | yes | 122 | 18,300 -> 18,500 | ~$90 (about 750 call minutes) |
| Scale (25) | yes | 122 | 45,750 -> 46,000 | ~$220 (about 1,900 call minutes) |
Not included in cost: hosting, database, the browser worker VM, web lookups (Perplexity), SMS, Stripe fees (~2.9% + $0.30), support. After the half month the customer buys packs; keep packs at current prices or raise them to match premium (decision).

## 3. Price options (per month)
| Plan | Trucks | Option A "premium" | Per truck at max | Option B "premium-lite" | Per truck at max |
|---|---|---|---|---|---|
| Solo | 1 | $79 | $79 | $59 | $59 |
| Core | 2-3 | $199 | $66 | $149 | $50 |
| Growth | 4-10 | $499 | $50 | $397 | $40 |
| Scale | 11-25 | $999 | $40 | $797 | $32 |
| Enterprise | 26+ | quote | | quote | |
Edge jumps (A): 3->4 trucks $199 -> $499; 10->11 $499 -> $999. (B): $149 -> $397; $397 -> $797.
Annual: pay for 10 months (about 17% off) keeps monthly list price premium.

## 4. My view (for the owner to challenge)
- Premium fits fleets (Growth/Scale) well: a 10-truck fleet pays a dispatcher or office staff thousands per month; $499 is a small share. Rose Rocket starts at $2,080, TruckingOffice at $25, TruckLogics $36-$250, so $499-$999 sits in a clear gap.
- Solo owner-operators are the most price-sensitive (Reddit: "TMS expensive af", "1 truck? just drive"). A high Solo price may cut sign-ups; keep Solo as a strong, low-friction entry (A: $79 or B: $59) and make the premium case on Core and up. I have no data on willingness to pay: test with the first customers, keep price changes easy, and grandfather early users.
- Premium also needs the product to feel premium: onboarding help, support response time, uptime, no cheap-looking copy. The site must show it.
- Wait for real usage before locking credit numbers; start with the allowances above (generous), review after 30 days.

## 5. Owner decisions
1. Option A, B, or your own numbers?
2. Heavy-usage profile OK (72/122 credits per truck per day, half month)?
3. Phone minutes included in Growth/Scale only, or Core too?
4. Credit pack prices: keep $25/1,000, $110/5,000, $400/20,000 or raise?
5. Existing customers on $249 Growth: grandfather or move?
6. Annual: 2 months free OK?

## 6. Build work when approved (new Lovable round, needs the owner's go)
Stripe products/prices, plan truck limits, monthly credit grants per plan, pack prices, downgrade/upgrade credit rules, site pricing copy (single source of truth), Terms update, usage screen (balance only, never per-action price), tests.
