# Codex research prompt: freight load sources with public APIs

Copy everything below the line into Codex.

---

## Role
You are a research analyst for a trucking software company. Do web research and produce a verified, sourced integration guide. Do not write product code. Do not guess. Every claim needs a source URL and a confidence tag.

## Context
We are building a mobile app for owner-operators (1 truck) and small fleets (up to 25 trucks). Its main feature is a **load hub**: the driver connects the places they get freight from, and the app shows every available load in one list, ranked by profit, with the option to book or reply to the broker from inside the app.

The app is multi-tenant software. Each driver (our customer) has their own relationship with each load board or broker. We need to know, for every freight source, **how a third-party app like ours can legally and technically get loads and book them on the driver's behalf.**

## Hard rules
1. **Never recommend storing a driver's username and password, and never recommend scraping.** Only count methods that are official: a public API, an OAuth connection, a partner or developer program, an EDI or webhook feed, an official email or text feed, or a licensed data aggregator.
2. Separate **"documented publicly"** from **"claimed on a marketing page only"** from **"requires applying or a signed agreement."** Do not blur them.
3. If you cannot find something, write **NOT FOUND**. Do not fill gaps with assumptions. Do not invent endpoints, field names, prices or rate limits.
4. Prefer primary sources (the company's own developer portal, API docs, partner pages, terms of service). Use third-party sources (TMS vendors' help pages, press releases) only to show that an integration exists, and label them as secondhand.
5. Record the date you checked each source.

## What I already know (verify it, correct it, extend it)
- **DAT:** developer portal exists. API access needs a license that covers REST API use. Credentials are issued by DAT support using a company MC number and a dedicated integration email.
- **Truckstop:** Technology Partner Program, signed Systems Integration Agreement, OAuth 2.0, load search API for carriers.
- **123Loadboard:** developer page lists search loads, check rates, post loads, post trucks. Partner status is required.
- **C.H. Robinson (Navisphere Carrier):** marketing page claims a free API for carriers to find, book and auto-create loads. Needs a contracted carrier. No public docs found.
- **Uber Freight:** carrier-side TMS integration exists (seen in AscendTMS). Described as reach-out, not self-serve. No current docs found.
- **TQL (Total Quality Logistics):** no carrier API found. Its loads appear inside some TMS products.

## Sources to research
Cover at least these, then add everything else you find.

**A. Load boards**
DAT One, Truckstop (including Truckstop Go), 123Loadboard, Direct Freight, Trucker Path (load board and Trucker Tools), Loadlink / Landstar-style boards, NextLoad, FreightFinder, TruckLoads (truckloads.com), UShip (if relevant), Convoy-successor and any other digital load boards active in 2026.

**B. Digital freight networks and broker marketplaces**
Uber Freight, Amazon Relay, Coyote Go (and Coyote Logistics carrier tools), RXO (Carrier portal, formerly Coyote/Echo/XPO brokerage), Transfix / any successor, Loadsmart (carrier platform), Convoy successor platforms, Flock Freight, Emerge, Pallet-style networks, and any other digital brokerage with a carrier app or API.

**C. Large traditional brokers (carrier portals and APIs)**
C.H. Robinson (Navisphere Carrier), TQL, Echo Global Logistics, Landstar, Schneider (Schneider Freight Power), J.B. Hunt 360 (Carrier 360), Werner (Werner Edge), Arrive Logistics, Worldwide Express / GlobalTranz, Allen Lund, Hub Group, Mode Transportation, XPO (carrier side), Armstrong, Kenco, and the other top 40 US freight brokerages by revenue.

**D. Aggregators and middleware that already connect many sources**
Truckstop's integration partners, Trucker Tools / Trucker Path, McLeod, Alvys, Rose Rocket, Ascend TMS, Axon, Samsara, Motive, Descartes, project44, FourKites, MacroPoint, Highway, and any "load board aggregator" or "load board API" provider that licenses access to multiple boards at once. For each aggregator, find: which boards and brokers it covers, how a third-party app licenses it, and approximate pricing if public.

**E. Rate and data sources the app could use alongside**
DAT RateView, Truckstop rate check, Greenscreens.ai, FreightWaves SONAR, Chart.io. For each: public API yes/no, access path.

**F. Broker risk and authority data**
FMCSA (QCMobile / SAFER / L&I data), Highway, Carrier411, Truckstop Risk Assessment / Carrier Assure, RMIS, Transport Risk-style tools. Which have APIs a third-party app can use.

**G. Standard channels that need no partnership**
Email parsing of load offers, text/SMS offers, EDI 204/990/214 for brokers that support it, and webhooks. Note which brokers send load tenders by EDI or API to carriers who are set up as customers.

## For each source, fill in this record
```
Name:
Category: load board | digital brokerage | traditional broker | aggregator | rate data | risk data
Official developer/API page URL:
API exists publicly? yes (documented) | claimed only | partner-gated | none | NOT FOUND
What the API can do for a carrier: search loads | view load details | book/accept | post truck | get rates | tender acceptance | status updates | documents | payment status
Auth method: OAuth 2.0 (which flow) | API key | username+password token | EDI/VAN | other
Who can get access: any carrier | contracted carriers only | licensed customers only | approved technology partners only | enterprise only
How to get access (step by step, with the form or contact URL):
Cost / licensing (price if public; else NOT FOUND):
Per-user or per-company credentials? (does each of OUR customers have to connect their own account?)
Rate limits and sandbox/test environment (or NOT FOUND):
Terms-of-service points relevant to a third-party app (redistribution, caching, display of loads, booking on behalf of users):
Data returned: key fields (origin, destination, pickup window, equipment, weight, rate, broker name, MC number, contact, load id)
Can we book from inside our app? yes via API | handoff to their portal | no
Secondhand evidence an integration exists (links to TMS vendors etc.):
Confidence: High (primary docs read) | Medium (partial) | Low (marketing/secondhand)
Sources checked (URL + date):
Recommended connection method for us: official API | partner API | aggregator | email parsing | EDI | share-to-app | deep link only
```

## Deliverables
1. **A master table** (CSV and Markdown) with one row per source and these columns: name, category, API status, who can access, how to apply, cost, auth, can we book, confidence, link to docs.
2. **One record per source** in the format above.
3. **A ranked shortlist: the 10 best sources to connect first**, ranked by (a) how many owner-operators use it daily, (b) how easy and cheap the access is, (c) whether we can book in-app. Explain the ranking.
4. **Aggregator analysis:** can one license cover many boards? Name the best candidates, coverage, access path, cost if public, and risks (outages, terms, lock-in).
5. **Step-by-step connection guide** for the top 10: what to apply for, in what order, what to send them, expected lead time if stated anywhere, and what we can build while waiting.
6. **Partner outreach pack:** for each gated source, a short email we could send (who it goes to, what we ask for, what we offer). Our pitch: we bring owner-operators who book freight through their platform, we are a multi-tenant carrier app, drivers connect their own accounts with OAuth, we never store passwords, we show their loads accurately with attribution and send bookings to them.
7. **Legal and risk notes:** any source whose terms forbid third-party apps, caching, or automated booking. Any known lawsuits or enforcement about scraping or unauthorized access in this space.
8. **Open questions** we must answer by phone or email with each company, because the web cannot answer them.

## Method
- Start with each company's own developer, API, partner, integrations or carrier-technology pages. Then search for "<company> API documentation", "<company> carrier API", "<company> integration partner", "<company> EDI carriers".
- Read terms of service and developer terms for the ones you shortlist.
- Use TMS vendors' help-center pages (Alvys, AscendTMS, McLeod, Rose Rocket, Axon, Samsara, Motive, etc.) to learn how existing carrier apps connect to each source. These often describe the exact steps and requirements.
- Use pages dated 2025 or 2026 when available. Flag anything older than 2024.
- If a login or paywall blocks a page, say so and note what you could see.

## Output format
Write everything to Markdown files in a folder called `load-sources-research/`:
- `00_summary.md` (top findings, ranked shortlist, recommended strategy, in one page)
- `01_master_table.csv` and `01_master_table.md`
- `02_source_records.md`
- `03_aggregators.md`
- `04_connection_guide_top10.md`
- `05_outreach_emails.md`
- `06_legal_and_risk.md`
- `07_open_questions.md`
- `sources.md` (every URL with the date checked)

End with a one-paragraph recommendation: which 3 connections to pursue first, and which to defer.
