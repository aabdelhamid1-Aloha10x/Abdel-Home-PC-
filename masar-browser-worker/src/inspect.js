// Read-only check of the reseller site: logs in, confirms every selector exists, prints header names, date input
// attributes and which row fields would be mapped. Run it ONCE on the worker host before real use:
//   ACCOUNT_PREFIX=DATEXPERT_1 DATEXPERT_1_USERNAME=... DATEXPERT_1_PASSWORD=... node src/inspect.js
// Prints no credentials and no load rows. A screenshot goes to ./inspect-out (may show account details: keep it local).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { loadConfig, credentialsFor } from "./config.js";
import { ensureSearchPage, AuthPause } from "./dat.js";
import { mapHeaders } from "./rows.js";

const env = { ACCOUNTS: "00000000-0000-0000-0000-000000000000=" + (process.env.ACCOUNT_PREFIX ?? "DATEXPERT_1"), APP_URL: "http://unused", BROWSER_WORKER_SECRET: "x", ...process.env };
const cfg = loadConfig(env);
const creds = credentialsFor(cfg.accounts[0].prefix, env);
const browser = await chromium.launch({ headless: cfg.headless, executablePath: cfg.chromePath });
const page = await (await browser.newContext()).newPage();
let code = 0;
try {
  await ensureSearchPage(page, cfg, creds);
  const missing = [];
  for (const [k, s] of Object.entries(cfg.selectors)) if (!(await page.locator(s).count())) missing.push(k);
  console.log(missing.length ? `MISSING selectors: ${missing.join(", ")}` : "All selectors present");
  for (const k of ["startDate", "endDate"]) {
    const a = await page.locator(cfg.selectors[k]).evaluate((el) => ({ readonly: el.hasAttribute("readonly"), placeholder: el.placeholder, sample: el.value }));
    console.log(`${k}: readonly=${a.readonly} placeholder="${a.placeholder}" value="${a.sample}"  (set DATE_FORMAT to match)`);
  }
  const heads = await page.evaluate((s) => { const b = document.querySelector(s); const t = b?.closest("table"); return t ? [...t.querySelectorAll("thead th, thead td")].map((x) => x.innerText.trim()) : []; }, cfg.selectors.results);
  console.log("Table headers:", JSON.stringify(heads));
  console.log("Mapped fields:", JSON.stringify(mapHeaders(heads)));
  mkdirSync("inspect-out", { recursive: true });
  await page.screenshot({ path: "inspect-out/search-page.png" });
  code = missing.length ? 2 : 0;
} catch (e) {
  console.log(e instanceof AuthPause ? `PAUSE: ${e.message}` : `ERROR: ${e.message}`);
  code = 1;
}
await browser.close();
process.exit(code);
