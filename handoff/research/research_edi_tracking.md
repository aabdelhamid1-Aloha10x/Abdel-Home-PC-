# EDI + tracking research for carrier TMS (2026-10-10)
Tags: [V]=vendor page, [3P]=third party, [U]=unverified/my inference. Searches were "standard" mode, one pass; many gaps remain.

## 1. EDI for carriers
- Sets: 204 tender (in), 990 tender response (out; must arrive by must-respond-by time or load may be reassigned) [3P stacksync/Ryder guide], 214 status (out), 210 invoice (out), 997 ack (both) [3P: geekwire.com/sponsor-post/trucking-edi-overview, dashdoc.com blog]. 211 not covered by any source found; treat as niche [U].
- Loadsmart carrier EDI: 990, 214 (tracking + appointment). AS2 "preferred", SFTP also; via VANs; specs by emailing edi@loadsmart.com; no onboarding timeline published [V developer.loadsmart.com/docs/shipperguide/for-carriers/carrier-edis/].
- C.H. Robinson accepts carrier EDI (request via rep/EDI form), plus free API, ELD links, and app tracking [V chrobinson.com/en-us/technology/carrier-technology/carrier-tracking/]. So big brokers offer non-EDI alternatives.
- Shipper-specific implementation guides differ per partner [3P xylity/geekwire]. A 30-minute 990 expectation is a single vendor claim [U].
- Share of small carriers using EDI: NOT FOUND. Founder's "few TMSs offer EDI" claim unverified; Tracx markets native EDI, Rose Rocket and McLeod are known larger TMSs [3P tracxtms.com/tracx-vs-rose-rocket].
- Timeline/onboarding steps: no sourced number. Typical practice (my knowledge, [U]): get partner's spec/guide, set up connection, test with partner, certify, go live; weeks per partner.
- TMS must do: parse 204 into loads, auto/manual accept-reject -> 990, emit 214 at stop events (AT7 status codes, location), 210 invoice, 997 handling, per-partner mapping/config, retries/audit log, SCAC/ISA ID per carrier.

## 2. Build vs buy (published prices)
- Stedi: public pricing is healthcare; EDI platform listed with ~$500/mo minimum by 3P listings; transportation (214 etc.) "contact sales" [3P fitgap, apis.io; stedi.com/pricing]. Embedded/multi-tenant not confirmed.
- Orderful: says flat per active trading-partner connection, unlimited transactions, free 997s [V orderful.com/blog/edi-transaction-fees-explained]. Dollar amounts conflict/unpublished; ToolRadar lists $99-$399/mo tiers, $189/mo web EDI per partner [3P, unverified].
- Tracx: from $22/truck/mo; onboarding from $2,500; no per-transaction EDI fee [vendor comparison page]. Rose Rocket from $2,080/mo [same page].
- Cleo: per-transaction/variable [Orderful's claim about competitor, biased]. SPS Commerce, TrueCommerce, Cargoson, McLeod, DAT/Truckstop EDI: NOT researched/no pricing found.
- Reseller/embedded multi-tenant rights: none confirmed for any vendor; must ask.
- Recommendation [U, my judgement]: MVP = do not build EDI first; use broker non-EDI paths (CHR API/ELD links). If EDI needed, start with one or two real partners using Stedi or Orderful (API-first, JSON<->X12), after getting quotes confirming multi-tenant/per-carrier ISA IDs. Scale = own X12 engine on a vendor translator + AS2/SFTP, or reseller deal.

## 3. Tracking
- Broker requirements: C.H. Robinson accepts ELD link (Geotab, Motive, Omnitracs, PeopleNet, Samsara, Verizon, 150+ via MacroPoint), free API, EDI, or Navisphere app via SMS link, no login [V]. Methods require carrier to share credentials/token per broker.
- MacroPoint: issuer (broker/shipper) pays, carrier free [3P G2 user comment, low confidence]. Trucker Tools pricing: not found.
- project44: free for carriers; mobile app for owner-ops, telematics for 10+ assets, API/EDI for large [V project44.com/for-carriers; FreightWaves comment disputes free for API, anecdotal]. FourKites Connect: carrier self-onboard multi-ELD [V]; carrier cost not stated currently.
- Practical model: TMS becomes the carrier's single tracking source: pull ELD location via API, post to broker's API (project44/FourKites/MacroPoint/CHR) or expose a tokenized public link page. Public link: signed random token per load, shows ETA/last ping, expires after delivery. [U design]
- ELD APIs:
  - Samsara: OAuth 2.0 recommended for marketplace apps; must join Technology Partner Program; sandbox limited; server-side only; app certification optional but uncertified apps show a banner and still work; separate NA/EU [V developers.samsara.com/docs/oauth-20; Terminal docs].
  - Motive: OAuth 2.0 + API keys; marketplace TMS integrations install-based; some integrations tied to Enterprise package; partner approval process not found [V gomotive.com blog, helpcenter articles]. Contact apisupport@gomotive.com.
  - Geotab: public SDK/API, marketplace [V geotab.com]. Verizon Connect, Omnitracs, EROAD, Rand McNally, Garmin: no developer docs found; Omnitracs/Geotab/PeopleNet have broker-side authorization flows per CHR page.
- Unified API Terminal (withterminal.com): 290-316 providers incl. Geotab, Samsara, Motive, Verizon, Eroad, Zonar, Webfleet; white-label consent flow; pricing not published ("book demo") [V]. Per Terminal's Samsara doc you still create your own Samsara OAuth app, partner form up to 7 business days, admin role required to authorize [V docs.withterminal.com/configuration/samsara.md]. Vehicle API/others: not researched.
- Phone-GPS fallback: Navisphere and MacroPoint-style SMS links prove brokers accept it (V for CHR). Limitations [U]: iOS/Android background location, battery, driver opt-in, gaps; brokers may prefer ELD.
- Cost of ELDs themselves (context, 3P): Samsara ~$27-45/veh/mo, Motive from ~$25/veh/mo; unofficial.

## 4. Revenue ranking (my judgement [U], grounded in above)
1. Tracking via ELD link/API/app to major brokers (CHR, etc.): unlocks freight from large brokers, low-medium complexity, free for carriers at many brokers.
2. Shareable tracking link for any broker: reduces check calls; low complexity (phone GPS first).
3. EDI 204/990/214/210 with specific shippers/large brokers: high value but per-partner onboarding, high complexity; only after a customer names a partner.
4. 210 invoicing/997: follow with EDI.
Staged: Stage 0 phone-GPS link + manual; Stage 1 Samsara/Motive via Terminal or direct OAuth; Stage 2 push to CHR API/project44/FourKites/MacroPoint; Stage 3 EDI pilot with 1-2 partners via Stedi/Orderful; Stage 4 scale.

## 5. Standards / compliance
- FMCSA: ELD rule doesn't require real-time tracking but carriers may track for business, without harassment; roadside data transfer goes only to officials, general location precision [V fmcsa.dot.gov ELD pages, govinfo 2024-10811]. No FMCSA rule on third-party API sharing found; consent is contract/state-law territory (CCPA etc.) [U]. Get driver notice + consent, limit tracking to active loads, per-load link expiry.

## Gaps
No data on SMB EDI adoption; no per-transaction prices for SPS, TrueCommerce, Cleo; Truckstop/DAT/Trucker Tools not researched; Verizon/Omnitracs/Rand/Garmin/EROAD API details; Terminal price; Stedi/Orderful reseller terms.
