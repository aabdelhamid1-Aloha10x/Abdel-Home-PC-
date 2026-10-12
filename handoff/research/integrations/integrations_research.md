# Integrations research for the trucking TMS

Research date: 2026-10-10 (files finalised 2026-10-11). Method: web search summaries plus a few page fetches. No product code written.

## Summary

- 104 providers listed. Status counts: File or SFTP feed only: 4, NOT FOUND: 57, No public API found: 1, Partner program only: 16, Public docs with approval: 13, Public self-serve: 13.
- Honest limit: I fetched very few primary pages directly (Samsara auth page, Motive portal home). Most facts come from search-result excerpts of primary docs (Intuit, Geotab, Motive OAuth, FMCSA, Telnyx, HERE, Google) or from TMS/ELD vendors' help pages (secondhand). No entry is rated High. Treat "Medium" as "primary source seen only in excerpt, or several consistent secondhand sources".
- Clear public, self-serve with OAuth: Samsara, Motive (needs written consent to distribute), QuickBooks Online. Geotab, Netradyne and Lytx have public docs but need approval or a license.
- Fuel cards (Comdata, WEX/EFS, Pilot) have no public API found. The real path is a data-sharing partner agreement, where each customer enables our app as a partner at the card issuer. Relay Payments is the best-documented fuel API (via TMS vendor listings).
- Factoring: almost no public APIs. Triumph is SFTP; Apex and TruFunding have API integrations that need partner setup; most others NOT FOUND. Build email/portal-packet submission first.
- FMCSA QCMobile is free self-serve. The Drug and Alcohol Clearinghouse has no API found; it needs driver consent in FMCSA's portal.
- Legacy TMS (McLeod, TMW, Aljex, Alvys, Ascend, etc.): no export/API documentation found. Plan CSV import mapping.
- Rule for every connector: OAuth or a customer-generated, revocable token or a data-sharing partner enrollment at the provider. Never store customer passwords, never scrape.
- NOT FOUND does not mean no API exists. It means I did not find it in this session.

## Per-category tables


### ELD / telematics

| Name | Status | Auth | Customer connects by | Who applies | Evidence |
|---|---|---|---|---|---|
| Samsara | Public self-serve | API token (direct integrations) or OAuth 2.0 (recommended for marketplace apps); Bearer header, server-side... | OAuth Connect via Samsara Marketplace partner app (customer follows guided workflow in Samsara dashboard); ... | Us once (OAuth app / marketplace listing); each customer authorises | Medium |
| Motive (KeepTruckin) | Public docs with approval | OAuth 2.0 authorization code flow (app registered in developer portal, client id/secret, code TTL 10 min, p... | OAuth Connect; customer authorises app | Us once (developer account is free; distribution needs Motive written consent via techpartners@gomotive.com... | Medium |
| Geotab | Public docs with approval | MyGeotab API session credentials (database/user/password or session id); OAuth for Marketplace not verified... | Customer creates a dedicated API user and/or approves Marketplace add-in; exact OAuth path NOT FOUND | Us once (Geotab SDK/Marketplace partner program, criteria not read); each customer authorises | Medium |
| Omnitracs / Solera Fleet | Partner program only | Customer-provisioned API credentials (username/password style) per secondary source | Customer asks Omnitracs/Solera for integration credentials; partner agreement with Solera | Both | Low |
| Platform Science (incl. BigRoad) | Partner program only | NOT FOUND | Partner enrollment | Us (partner application); customers then enable | Low |
| BigRoad (Platform Science) | NOT FOUND | NOT FOUND | Ask via Platform Science partner program | NOT FOUND | Low |
| Verizon Connect (Reveal / Fleetmatics) | Partner program only | Integration Manager credentials plus per-customer Reveal REST credentials; OAuth 2.0 and sandbox mentioned ... | Customer requests credentials via Verizon Marketplace; TMS pastes them | Both | Low |
| Trimble / PeopleNet | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Garmin Fleet (FMI / Telematics API) | Partner program only | Fleet Management Program License Agreement to download developer kit | Partner agreement; customer uses Garmin device | Us | Medium |
| Isaac Instruments | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Rand McNally (ELD / TND) | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Gorilla Safety | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| EROAD | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| ClearPathGPS | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Hum (Verizon) | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Azuga (Bridgestone) | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Netradyne (Driver-i cameras) | Public docs with approval | API license required (confirm via support); details not read | Customer's license must include API; token issued by Netradyne | Both (customer license + our partner onboarding) | Medium |
| Lytx (cameras) | Public docs with approval | Bearer token (per third-party catalog; not verified) | Customer-issued credentials presumably; NOT FOUND exactly | Both | Medium |
| Spireon (FleetLocate) | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |

### Fuel cards and fuel data

| Name | Status | Auth | Customer connects by | Who applies | Evidence |
|---|---|---|---|---|---|
| Comdata | Partner program only | Web-services credentials plus FTP credentials issued by Comdata; customer-signed third-party data sharing a... | Customer asks their Comdata rep to enable data feed to us as partner / signs authorization form | Both (we sign with Comdata, each customer authorises) | Medium |
| WEX / EFS | Partner program only | Data Sharing Partner setup in EFS eManager (customer adds partner in Data Sharing Preferences); credentials... | Customer enables partner in EFS eManager (allow up to 5 business days per Fleetio); our app must be a regis... | Both: we get partner status once; each customer enables us | Medium |
| Fleetcor / Corpay (Fuelman etc.) | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Pilot Flying J (RoadRunner / fleet card) | File or SFTP feed only | Portal statement download or credentials-based pull (varies by vendor) | Manual statement upload, or credential connection where a vendor has an arrangement | Both (partner arrangement unclear) | Medium |
| TA / Petro (UltraONE) | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Love's (Fleet Card / QuickQ) | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Mudflap | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| T-Chek (Fleet One / Comdata-owned) | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| TCS Fuel | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Relay Payments | Public docs with approval | Relay open API (credentials from Relay; details NOT FOUND) | Customer enables via Relay partner connection | Us once (Relay partners directory), customer enables | Medium |
| Voyager (US Bank) | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Atlas (fuel card) | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Bank of America fleet card | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| EIA diesel price API | Public self-serve | Free API key, passed as api_key query parameter | None; app-level key only | Us once | Medium |
| OPIS | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| GasBuddy Business | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| TCS fuel price file | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |

### Accounting and payroll

| Name | Status | Auth | Customer connects by | Who applies | Evidence |
|---|---|---|---|---|---|
| QuickBooks Online | Public self-serve | OAuth 2.0 (Intuit) | OAuth Connect button | Us once (Intuit developer app; production keys need app assessment, details NOT FOUND); each customer autho... | Medium |
| QuickBooks Desktop | File or SFTP feed only | Windows Web Connector (.qwc) polling a SOAP endpoint, qbXML; or local SDK | Customer installs Web Connector and loads .qwc; or file export IIF/CSV | Both | Low |
| Xero | Public docs with approval | OAuth 2.0 (access token 30 min, refresh rotates, 60-day refresh expiry per Apideck) | OAuth Connect | Us once; each customer authorises | Medium |
| Sage (Business Cloud Accounting / Intacct) | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| FreshBooks | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Zoho Books | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| ADP | Partner program only | OAuth 2.0 with client certificates (secondary) | Partner marketplace | Both | Low |
| Gusto | Public docs with approval | OAuth style system/company access tokens | OAuth Connect for approved partners | Us once | Medium |
| Paychex Flex | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |

### Factoring

| Name | Status | Auth | Customer connects by | Who applies | Evidence |
|---|---|---|---|---|---|
| RTS Financial | Public docs with approval | Credentials from factor (API or FTP) per Truckpedia | Carrier gets credentials from RTS and enters in TMS settings | Both | Low |
| Triumph Business Capital / TriumphPay | File or SFTP feed only | FTP server credentials (Alvys flow) | Carrier opens account; TMS sends batches to FTP | Both | Medium |
| Apex Capital | Partner program only | API (credentials not described) | Carrier enables in TMS; partner connection with Apex | Both | Medium |
| TruFunding (extra, found) | Partner program only | API | Carrier connects | Both | Medium |
| Thunder Funding | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| OTR Solutions | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Riviera Finance | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Porter Freight Funding | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| eCapital | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Bobtail | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Denim | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |

### Tolls and compliance

| Name | Status | Auth | Customer connects by | Who applies | Evidence |
|---|---|---|---|---|---|
| PrePass | Partner program only | NOT FOUND | Partner enrollment | Both | Low |
| Bestpass (Fleetworthy) | Partner program only | Customer creates a 'Technical' user in Bestpass portal using TMS-supplied email; account number pasted into... | Customer creates technical user for us; APIsupport@bestpass.com for API | Both | Medium |
| E-ZPass fleet | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Drivewyze | Partner program only | NOT FOUND | Via ELD partner | Us (partner) | Low |
| FMCSA QCMobile API | Public self-serve | WebKey (query parameter) obtained with Login.gov account | Not customer-specific; our own key | Us once | Medium |
| FMCSA SAFER / Licensing & Insurance (bulk) | File or SFTP feed only | None / download | None | Us once | Low |
| FMCSA Drug & Alcohol Clearinghouse | No public API found | Clearinghouse account; driver consent for each query (limited or full); C/TPA role and assistants exist | Driver grants electronic consent in Clearinghouse; employer or C/TPA queries in FMCSA portal | Employer/C-TPA registers | Medium |
| PSP (Pre-Employment Screening Program) | NOT FOUND | NOT FOUND | Driver consent; ordered via vendors such as Tenstreet (12 USD per report incl. 2 USD fee per Tenstreet) | Vendor | Low |
| Tenstreet | Partner program only | Gated XML API; email integrations team; approval (secondary) | Partner enrollment | Both | Low |
| Checkr | Public docs with approval | NOT FOUND (API-first per reviews) | Our account or partner | Us once | Low |
| HireRight | Partner program only | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Sterling | Partner program only | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Foley (MVR) | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| J.J. Keller | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| ISN | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Motive Integrated MVR (note) | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |

### Communications

| Name | Status | Auth | Customer connects by | Who applies | Evidence |
|---|---|---|---|---|---|
| Twilio (SMS/voice) | Public self-serve | API key/account SID | Our account (ISV model); each customer registers own 10DLC brand/campaign | Both for 10DLC | Low |
| Telnyx (SMS/voice) | Public self-serve | API key | Brand + campaign + number assignment | Each customer (their brand), us as platform | Medium |
| Bandwidth | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Vonage | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Gmail API | Public docs with approval | OAuth 2.0 | OAuth Connect | Us once; restricted scopes need CASA security assessment (4-8 weeks, annual, fee varies) | Medium |
| Microsoft Graph (Outlook mail/calendar) | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Google Calendar API | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Resend | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Postmark | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| DocuSign eSignature | Public self-serve | OAuth (JWT/auth code); integration key | Customer OAuth consent or use our account | Us once (go-live promotion mostly automatic now; was 20 sandbox calls) | Low |
| Dropbox Sign API | Public self-serve | API key / OAuth | Our account | Us once | Medium |
| PandaDoc API | Public docs with approval | API key/OAuth | Our account | Us once | Low |

### Maps and routing

| Name | Status | Auth | Customer connects by | Who applies | Evidence |
|---|---|---|---|---|---|
| Trimble Maps (PC*MILER) | Public docs with approval | API key; free trial key | Our license (not per customer, unless resold) | Us once; sales contract | Medium |
| HERE Routing / Maps | Public self-serve | API key | Our key | Us once | Medium |
| Google Routes API | Public self-serve | API key | Our key | Us once | Medium |
| Mapbox Directions | Public self-serve | Access token | Our token | Us once | Low |
| Trucker Path | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| TruckParkingClub | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| National Weather Service alerts API | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |

### Insurance and documents

| Name | Status | Auth | Customer connects by | Who applies | Evidence |
|---|---|---|---|---|---|
| Google Document AI | Public self-serve | Google Cloud credentials | Our account | Us once | Medium |
| AWS Textract | Public self-serve | AWS IAM | Our account | Us once | Low |
| Insurance certificate (COI) APIs | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Next Insurance | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |

### Legacy TMS import sources

| Name | Status | Auth | Customer connects by | Who applies | Evidence |
|---|---|---|---|---|---|
| McLeod (LoadMaster / PowerBroker) | Partner program only | NOT FOUND | Customer export (CSV) or McLeod partner | Both | Low |
| Rose Rocket | Public docs with approval | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| TMW Suite (Trimble) | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Aljex | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Alvys | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| TruckLogics | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Axon | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| Trucking Office | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |
| AscendTMS | NOT FOUND | NOT FOUND | NOT FOUND | NOT FOUND | Low |

## Ranked list

### Build first (public, self-serve or easy approval, high usage)
1. Samsara: OAuth for marketplace apps, token fallback.
2. Motive: OAuth; apply to techpartners@gomotive.com for distribution at the same time.
3. QuickBooks Online: OAuth, documented limits (500/min per company).
4. FMCSA QCMobile: free WebKey; carrier lookup and authority/safety checks.
5. Geotab: public SDK (HOS objects documented); confirm customer auth route and Marketplace terms.
6. Telnyx or Twilio SMS with 10DLC registration flow per customer brand.
7. Google Routes or HERE (truck attributes) for mileage and ETA; PC*MILER if customers expect it (quote, contract).
8. EIA diesel price API (free key) for fuel surcharge.
9. Google Document AI or Textract for document OCR (evaluate on real BOLs first).
10. Email send (Gmail send scope or Resend/Postmark), e-signature (Dropbox Sign or DocuSign).
11. Netradyne and Lytx (public docs, license/approval needed) after ELD core.
12. Xero (low US trucking share; tiered fees from 2026-03-02).
13. Bestpass: customer creates a technical user for us (no password sharing); contact APIsupport@bestpass.com.
14. Relay Payments fuel (open API; apply via partners directory).
15. CSV/file import for legacy TMS and QuickBooks Desktop (IIF/CSV).

### Apply now, build when approved
Comdata and WEX/EFS data-sharing partner status; Pilot data feed; Verizon Connect Integration Manager; Platform Science/Omnitracs-Solera partner programs; Apex Capital and TruFunding factor APIs; RTS; Tenstreet; PrePass; Gusto and ADP; Gmail restricted-scope (CASA) only if inbox reading is needed; Garmin FMI licence.

### File-feed fallback
Triumph (SFTP), Pilot statements, Comdata FTP, WEX/EFS CSV, QuickBooks Desktop (Web Connector or IIF/CSV), factors by email packet, FMCSA bulk downloads, customers' fuel statements uploaded manually.

### Not available / not found (as of 2026-10-10)
Drug and Alcohol Clearinghouse API, PSP direct API, COI APIs, Trucker Path, TruckParkingClub, Mudflap, T-Chek, TCS, OPIS, GasBuddy, E-ZPass, and most factors (Thunder, OTR, Riviera, Porter, eCapital, Bobtail, Denim). Re-check before concluding none exist.

## What each connection gives the product
- ELD/telematics (Samsara, Motive, Geotab): truck location and ETA, HOS clocks and violations for dispatch planning, DVIR, odometer and engine hours for preventive maintenance, fault codes, IFTA miles, driver safety events.
- Cameras (Netradyne, Lytx): safety events on driver scorecards.
- Fuel cards: transactions matched to trucks, drivers and loads; IFTA fuel data; settlement deductions.
- Fuel price (EIA): fuel surcharge tables.
- QuickBooks/Xero: sync customers, invoices, bills, payments and expenses.
- Factoring: invoice packets submitted, status and remittance back to settle receivables.
- Tolls (Bestpass, PrePass): toll charges matched to units for cost per load.
- FMCSA: verify carrier authority, insurance, safety rating on onboarding.
- SMS/email/e-sign: load tenders, driver messages, document signing.
- Maps: practical truck miles, routes, rate-per-mile.
- OCR: BOL/POD/invoice data capture.
- Legacy import: onboarding customers from other TMS.

## Gaps and cautions
- Rate limits for Samsara, Motive, Verizon and fuel providers not found.
- Prices cited come from mixed sources; verify before budgeting (Xero, Dropbox Sign, PandaDoc, Textract conflict).
- Terms (retention, redistribution, resale) were not read for most providers; Motive's consent-to-distribute clause and Trimble's freight-under-management fees are the notable ones found.
