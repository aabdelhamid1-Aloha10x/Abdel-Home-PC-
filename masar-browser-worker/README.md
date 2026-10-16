# Masar browser worker (DAT Expert reseller search)

Runs on its own small host (the Masar app is a Cloudflare Worker and cannot run a browser). It leases search jobs from
the app, fills the reseller's visible search form, reads the result table and hands the rows back. The app does the
ranking, flagging, de-duplication and company isolation.

**Not an official DAT integration.** Use only with the reseller's written permission recorded in the app
(`bse_set(company, account, true, approval_ref)`).

## What it does
1. `POST /api/public/hooks/browser-worker` `lease` for each account in `ACCOUNTS` (this also is the heartbeat the app shows as "worker online").
2. Logs in with the host's secrets (reuses the saved session in `state/`), resets every field, fills the filters, clicks Search.
3. Reads the table, maps columns by header name, returns rows with `complete` (`truncated=true` when the site shows a results limit).
4. One search at a time per account, at least `MIN_GAP_MS` apart. A job is abandoned after `JOB_TIMEOUT_MS` (under the 5 minute lease).

## Safety rules built in
- Credentials come only from this host's environment. They are never logged, never sent to the app, never stored in the repo.
- Login problem, CAPTCHA, 2FA, "verify it's you", lockout text: `fail` with `pause:true` (account pauses, owner is told). **No bypass, no retry.**
- Any missing form element fails the job (`Selector missing: x`), never guessed.
- Unknown cells stay unknown (empty), never turned into 0.

## Setup (once)
1. In the app: set secret `BROWSER_WORKER_SECRET`; a platform admin creates one `browser_search_accounts` row (status `active`) and, for each company, `bse_set(...)` with the reseller approval reference.
2. On the host: copy `.env.example` to `.env`, fill it (account id, secret prefix, `DATEXPERT_1_USERNAME`, `DATEXPERT_1_PASSWORD`).
3. **Run `npm run inspect` first.** It logs in and checks that every selector exists, prints table headers, date-field format and which row fields map. Fix `DATE_FORMAT`/`DATEXPERT_SEARCH_URL` from what it prints. The selectors in `src/config.js` were copied from the app contract and have not been verified by this code against the live site.
4. Start: `docker build -t masar-worker . && docker run -d --restart=always --env-file .env -v masar-state:/app/state masar-worker`, or `npm start`.
5. In the app, the Find a load screen shows "ready" once the worker's heartbeat is fresh (within 10 minutes).

## Tests
`npm test` (needs Chromium; set `CHROME_PATH` if not the default). Runs against a fake reseller site and fake app queue:
full job, CAPTCHA, 2FA, wrong password (all pause), missing selector (fails, no pause), no credentials leave the host.

## Known unknowns (need the real site)
- Exact selectors, the date format of the read-only date fields, how the equipment dropdown is picked, and the results table headers.
- Whether the reseller limits simultaneous tabs/sessions per login (ask them before running more than one account worker).
- bsj_complete in the app stores a missing deadhead as 0 (app-side fix requested separately).

## October 16 verified board behavior

The live board uses exact city autocomplete, equipment chips, readonly calendar selection and a search progress lifecycle. The worker now waits for a new search lifecycle before reading rows. Hidden padding rows are ignored; nested posted rates are separated from RPM.

Broker MC numbers appear in the expanded load row's Company section. After scraping, the worker opens up to 50 detail rows within a 60-second budget, matches posting reference and company, and reads only the explicit MC# identity. Missing or ambiguous identities remain unknown. It never treats the board's authority badge as independent verification; Masar's existing FMCSA/booking checks remain authoritative. This detail extraction has isolated browser tests; the deployed worker still requires a real end-to-end run.
