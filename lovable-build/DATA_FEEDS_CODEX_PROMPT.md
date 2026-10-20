# Codex prompt · Masar Solo live data feeds (weather, traffic, fuel, fuel cards, parking, routing)

Paste everything below the line into Codex, working in the Masar OS repo.

---

## Goal

Masar Solo has screens that need live road data: Today "On your route", Drive mode (S17), Trip ETA (S20) and Empty truck (S18). Today those cards show honest empty lines. Connect real data providers, cheapest first, behind one server-side layer so we can swap vendors later without touching screens.

## What you can do, and what only the owner can do

- **You (Codex):** build the code, the server-side connectors, the database cache, tests and a setup checklist. Fully wire every provider that needs no account (marked NO KEY).
- **The owner (Abdel):** creates every vendor account, accepts terms, adds any payment method and pastes API keys into the Supabase secrets screen. Do not create accounts, accept terms, enter payment details or contact sales on the owner's behalf. Do not ask for keys in chat or commit them.
- For each provider that needs a key, write a step-by-step signup entry in `docs/data-feeds/SETUP.md` (signup link, which plan to pick, which secret name to paste the key into, how to test it). When a key is missing, the connector returns "not connected" and the screen keeps its honest empty line. Never show invented numbers.

## Hard rules

1. All provider calls run server-side (Supabase edge functions or server functions). No API key ever reaches the browser, the repo or logs.
2. Secrets live in Supabase secrets with the exact names listed below.
3. Cache every response in a `feed_cache` table (provider, request key, payload, fetched_at, expires_at) to stay inside free tiers. No company data in the cache key except coordinates.
4. Respect each provider's terms. Show the required attribution (OpenStreetMap: "© OpenStreetMap contributors"; NWS: "Source: National Weather Service"). Never scrape websites (no Pilot, TA or Love's page scraping).
5. Each connector has a per-provider daily call budget in config. When the budget is used up, return the cached value with its age, or "not connected".
6. Every value shown to the driver carries its source and age ("Updated 12 min ago · NWS").
7. Do not touch Stripe, billing, Office or Driver apps. Do not publish.

## Architecture

- `src/lib/feeds/` with one file per category: `weather.ts`, `traffic.ts`, `fuel-prices.ts`, `fuel-cards.ts`, `parking.ts`, `routing.ts`.
- Each category exposes one interface (e.g. `getRouteWeather(points[], etas[])`) and a provider list in priority order. The first provider that is connected and inside budget answers; the next one is the fallback.
- `feed_status` view for an owner-only admin page: which providers are connected, calls today vs budget, last error.
- Unit tests for every connector with recorded sample responses (no live calls in tests).

## Providers, ranked cheapest first (with an API)

Pricing and free tiers below come from vendor or third-party pages and may have changed. Confirm on the vendor's own pricing page during signup and note the date in SETUP.md.

### 1. Weather on route

| Rank | Provider | Cost | Secret name | Link |
|---|---|---|---|---|
| 1 | National Weather Service API (U.S.) · NO KEY | Free, public domain. Needs a User-Agent header with a contact email. | none (set `NWS_USER_AGENT`) | https://www.weather.gov/documentation/services-web-api |
| 2 | Tomorrow.io | Free plan: 500 requests/day, 25/hour. Route weather is paid. | `TOMORROW_API_KEY` | https://www.tomorrow.io/weather-api/ · limits: https://support.tomorrow.io/hc/en-us/articles/20273728362644-Free-API-Plan-Rate-Limits |
| 3 | Open-Meteo (commercial plan) | Free tier is non-commercial only; low-cost paid plans | `OPEN_METEO_API_KEY` | https://open-meteo.com/en/pricing |
| 4 | OpenWeather Road Risk | Paid. Adds road surface temperature and black ice risk. | `OPENWEATHER_API_KEY` | https://openweather.co.uk/products/road-risk |

Build now: NWS. Sample the route about every 50 miles. For each point, look up the forecast at the time the truck will be there (from the ETA), plus active alerts (`/alerts/active?point=`). Output: place, time, temperature, short condition, alert if any.

### 2. Traffic and road incidents

| Rank | Provider | Cost | Secret name | Link |
|---|---|---|---|---|
| 1 | State 511 feeds | Free. Most states need a one-time developer registration. Feed format varies by state. | `DOT511_<STATE>_KEY` per state | National list of state 511 sites: https://www.fhwa.dot.gov/trafficinfo/ |
| 2 | TomTom Traffic (Flow + Incidents) | Free allowance, then pay as you go. TomTom moved the allowance to monthly in July 2026; check the current number. | `TOMTOM_API_KEY` | https://developer.tomtom.com/pricing · https://docs.tomtom.com/pricing/price-announcement |
| 3 | HERE Traffic | Free monthly allowance, then pay as you go. Sources disagree on its size. | `HERE_API_KEY` | https://platform.here.com/ |
| 4 | Argus 511 Traffic Alerts API | Paid. One feed combining the state 511 feeds. | `ARGUS_API_KEY` | https://www.getargus.ai/developer/truck-parking-api (same developer program) |

Build now: the TomTom connector (incidents along a route bounding box) and a pluggable state-511 adapter. Start with the states on the sample lanes: TN, MS, AL, GA, AR, MO, OK, KS. Return closures, crashes and construction within 2 miles of the route, with the delay in minutes when given.

### 3. Fuel prices (station level)

| Rank | Provider | Cost | Secret name | Link |
|---|---|---|---|---|
| 1 | EIA Open Data (weekly diesel by region) | Free, key by email | `EIA_API_KEY` | https://www.eia.gov/opendata/ |
| 2 | OpenStreetMap Overpass (truck stop locations, brand, amenities; no prices) · NO KEY | Free. Show attribution. Use a polite request rate, or self-host. | none | https://wiki.openstreetmap.org/wiki/Overpass_API |
| 3 | Love's Store & Fuel Price API (official, Love's stores only) | Access through a Love's sales rep or the "Request Access" button. Cost not published. | `LOVES_CLIENT_ID`, `LOVES_CLIENT_SECRET` (OAuth client credentials) | https://developer.loves.com/ad47e8c2-fb2b-4eaf-9d61-099061f1cfaa/loves-store-fuel-price-exp-api/ |
| 4 | WEX Fleet API V3 (includes fuel site data with pricing, beta) | For WEX partners/customers; ask WEX | `WEX_CLIENT_ID`, `WEX_CLIENT_SECRET` | https://fleetapi.wexinc.com/fleet-management/fleet-management-api-beta |
| 5 | Bluedoor Gas Prices API (aggregator, includes Pilot diesel and DEF) | Paid. Check how fresh its data is first. | `BLUEDOOR_API_KEY` | https://bluedoor.sh/data/gas-prices/stations/gas_station_pilot-flying-j_1428 |
| 6 | OPIS Truckstop data (about 9,000 U.S. truck stops) | Enterprise contract. Email or file delivery, not a live API. | none (file import job) | https://www.opis.com/product/pricing/retail-fuel-prices/truckstop-spread-report/ |

Build now:
- EIA. Use it for cost-per-mile and profit math, labelled "regional average".
- Overpass. Truck stops within 3 miles of the route.
- The Love's connector, inactive until the keys exist.

Show a station price only when a station-level source answered. Otherwise show the stop with "Price not available".

### 4. Fuel cards (the driver's own card discount and transactions)

None of these publish a per-station discount price feed. Use the card APIs for the driver's fuel transactions (receipts, IFTA gallons by state, expense records), and for discounted pump prices where a card's API exposes them.

| Rank | Card | API status | Secret name | Link |
|---|---|---|---|---|
| 1 | WEX | Documented Fleet API V3 (OAuth client credentials, beta). Cards, drivers, transactions, fuel sites with pricing. | `WEX_CLIENT_ID`, `WEX_CLIENT_SECRET` | https://fleetapi.wexinc.com/fleet-management/fleet-management-api-beta |
| 2 | Shell Fleet (B2B mobility card) | Public developer portal with a card transaction data API | `SHELL_CLIENT_ID`, `SHELL_CLIENT_SECRET` | https://developer.shell.com/api-catalog/b2b-mobility-card-transaction-data/api-overview |
| 3 | AtoB | Private partner API (cards, drivers, vehicles, settled transactions); apply for partner access | `ATOB_API_KEY` | https://www.atob.com · partner info: https://apis.io/providers/atob/ |
| 4 | Mudflap | Partner OAuth only, no public docs; ask Mudflap | `MUDFLAP_CLIENT_ID`, `MUDFLAP_CLIENT_SECRET` | https://www.mudflapinc.com · https://apis.io/providers/mudflap/ |
| 5 | TCS Fuel | No API. CSV transaction export or FTP from a TCS rep. | `TCS_FTP_*` (only if FTP is granted) | https://www.tcsfuel.com · how others do it: https://docs.alvys.com/help/integrations/tcs-fuel-integration |

Build now:
1. A "Your fuel card" setting in Solo Rules: card brand plus "My usual discount (¢/gal)". Use it for "your price after card discount" until a card API answers.
2. The WEX connector, inactive until keys exist.
3. A CSV import for TCS and any other card. It parses transactions into fuel expenses and IFTA gallons, with an idempotent key per transaction id.

Do not use unofficial scraping tools for AtoB or any card.

### 5. Truck parking

| Rank | Provider | Cost | Secret name | Link |
|---|---|---|---|---|
| 1 | State TPIMS feeds: IA, IN, KS, KY, MI, MN, OH, WI, plus Florida TPAS | Free; some states require one-time registration to get the feed links. JSON, updated every 5 minutes. Indiana and Ohio may not be publishing right now. | `TPIMS_<STATE>_DYNAMIC_URL`, `TPIMS_<STATE>_STATIC_URL` | Spec: https://tpims.ksdot.gov/docs/TPIMS_TruckParking_Data_Interface_App_Developers.pdf · Wisconsin developer page: https://transportal.cee.wisc.edu/tpims/parking-data-devs.html |
| 2 | OpenStreetMap (static truck parking, rest areas) · NO KEY | Free | none | https://wiki.openstreetmap.org/wiki/Overpass_API |
| 3 | Argus Truck Parking Data API (combined feed, about 8,000 locations, parking ordered along a route) | Paid by volume; docs free | `ARGUS_API_KEY` | https://www.getargus.ai/developer/truck-parking-api |

Build now:
- The TPIMS adapter (static plus dynamic) and OSM static parking.
- A driver report button "Lot is full / has space" that stores time-of-day fill reports.
- "How fast it fills" comes from TPIMS history plus driver reports. Show it only after 5 or more data points.

### 6. Truck routing, miles and ETA

| Rank | Provider | Cost | Secret name | Link |
|---|---|---|---|---|
| 1 | Valhalla (self-hosted, truck costing: height, weight, hazmat) | Free software; you pay only for hosting | `VALHALLA_URL` | https://github.com/valhalla/valhalla |
| 2 | OpenRouteService (driving-hgv profile) | Free plan with daily limits; check commercial terms | `ORS_API_KEY` | https://openrouteservice.org/dev/#/signup |
| 3 | TomTom Routing (truck parameters) | Free allowance, then pay as you go | `TOMTOM_API_KEY` | https://developer.tomtom.com/pricing |
| 4 | HERE Routing (truck) | Free allowance, then about $2.75 per 1,000 truck routes (third-party figure) | `HERE_API_KEY` | https://platform.here.com/ |
| 5 | Trimble PC*MILER (the mileage brokers pay by) | Custom pricing; web version about $85/month per user | `PCMILER_API_KEY` | https://developer.trimblemaps.com/ |

Build now: ORS or TomTom for route miles and geometry, with the fallback straight-line × 1.2 labelled "approx". The ETA keeps the planner rules: 55 mph, a 30-minute break after 8 hours, 11/14-hour limits and 10 hours of rest. Position comes from the Motive ELD ping (already connected), else the last check-in.

## Order of work

1. NO KEY providers end to end (NWS weather, Overpass stops and parking), plus `feed_cache`, budgets, attribution and the source/age labels on S14, S17, S18 and S20.
2. Connectors for EIA, TomTom (traffic and routing), ORS, TPIMS, Tomorrow.io and WEX, each inactive until its secret exists.
3. Fuel card setting, CSV import, and the parking "full / has space" reports.
4. `docs/data-feeds/SETUP.md`. One section per provider, in the order the owner should sign up:
   1. EIA
   2. TomTom
   3. OpenRouteService
   4. Tomorrow.io
   5. State 511 and TPIMS registrations
   6. Love's ("Request Access")
   7. Argus (docs request)
   8. WEX / Shell / AtoB partner requests
   9. HERE
   10. OPIS / Bluedoor (only when paying users justify it)

   Each section lists: link, plan to choose, secret name(s), a test command, and what lights up in the app.
5. An owner-only "Data feeds" admin page showing each provider's status, calls today against budget, and last error.

## Done when

- With zero keys: weather on route, nearby truck stops and static parking show real data with source and age. Everything else shows "Not connected".
- Adding a key in Supabase secrets turns that provider on with no code change, and the admin page shows it green.
- Tests pass, build is clean, no key appears in the bundle (`grep` the build output for each secret name's value pattern), nothing is published.
- Final report: what is live, what waits on a signup, and the exact SETUP.md steps left for the owner.
