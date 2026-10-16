import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mockSite, mockApp } from "./mock.js";
import { loadConfig, parseAccounts } from "../src/config.js";
import { makeApi } from "../src/api.js";
import { handleJob, openAccount } from "../src/run.js";
import { mapHeaders } from "../src/rows.js";
import { fmtDate } from "../src/dat.js";

const CHROME = process.env.CHROME_PATH ?? chromium.executablePath();
const JOB = { id: "11111111-1111-4111-8111-111111111111", token: "22222222-2222-4222-8222-222222222222", filtersHash: "a".repeat(32),
  filters: { origin: "Nashville, TN", dho: 75, destination: "Atlanta, GA", dhd: 50, equipment: "Vans(Standard)", loadType: "Full Only", length: 53, weight: 45000, startDate: "2026-10-16", endDate: "2026-10-18", tz: "America/Chicago" } };
const ACCT = { id: "33333333-3333-4333-8333-333333333333", prefix: "TEST_ACCT" };
const CREDS = { username: "u@example.com", password: "secret-pass-123" };

async function setup(mode) {
  const site = await mockSite(mode), app = await mockApp(JOB);
  const cfg = loadConfig({ APP_URL: app.url, BROWSER_WORKER_SECRET: "shh", ACCOUNTS: `${ACCT.id}=${ACCT.prefix}`, DATEXPERT_LOGIN_URL: `${site.url}/login`, DATEXPERT_SEARCH_URL: `${site.url}/search`, STATE_DIR: `/tmp/mbw-test-state-${Math.random().toString(36).slice(2)}`, CHROME_PATH: CHROME, JOB_TIMEOUT_MS: "60000" });
  let browser;
  try { browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] }); }
  catch (error) { site.server.close(); app.server.close(); throw error; }
  const session = await openAccount(browser, cfg, ACCT);
  const done = async () => { await browser.close(); site.server.close(); app.server.close(); };
  return { site, app, cfg, session, api: makeApi(cfg), done };
}

test("parseAccounts and header mapping", () => {
  assert.deepEqual(parseAccounts(`${ACCT.id}=DATEXPERT_1`), [{ id: ACCT.id, prefix: "DATEXPERT_1" }]);
  assert.throws(() => parseAccounts("nope=bad"));
  assert.deepEqual(mapHeaders(["Origin", "Dest", "Pickup", "Rate", "Miles", "DH-O", "Company", "MC#", "Zzz"]),
    ["origin", "destination", "pickup", "rate", "miles", "deadhead", "broker", "mc", null]);
  assert.equal(fmtDate("2026-10-16", "MM/DD/YYYY"), "10/16/2026");
});

test("full job: login, fill, search, scrape, complete (no credentials sent to app)", async () => {
  const t = await setup("ok");
  try {
    const job = await t.api.lease(ACCT.id);
    assert.equal(job.id, JOB.id);
    const out = await handleJob(t.api, t.cfg, ACCT, job, t.session, CREDS);
    assert.equal(out, "done");
    const complete = t.app.calls.find((c) => c.action === "complete");
    assert.ok(complete); assert.equal(complete.filtersHash, JOB.filtersHash); assert.equal(complete.auth, "Bearer shh");
    assert.equal(complete.rows.length, 2);
    assert.equal(complete.rows[0].origin, "Nashville, TN"); assert.equal(complete.rows[0].mc, "MC 123456"); assert.equal(complete.rows[0].deadhead, "12");
    assert.equal(complete.rows[1].rate, undefined);         // empty cell stays unknown, never 0
    assert.match(complete.rows[1].broker, /SCAM ALERT/);    // app flags it
    const sent = await t.session.page.evaluate(() => window.__sent);
    assert.deepEqual(sent, ["Nashville, TN", "75", "Atlanta, GA", "50", "Vans(Standard)", "Full Only", "53", "45000", "10/16/2026", "10/18/2026"]);
    assert.ok(!JSON.stringify(t.app.calls).includes(CREDS.password));
    assert.ok(!JSON.stringify(t.app.calls).includes(CREDS.username));
  } finally { await t.done(); }
});

for (const [mode, why] of [["captcha", /CAPTCHA/i], ["twofa", /verification code/i], ["badpass", /not accepted/i]]) {
  test(`${mode} pauses the account (no bypass, no retry)`, async () => {
    const t = await setup(mode);
    try {
      const job = await t.api.lease(ACCT.id);
      const out = await handleJob(t.api, t.cfg, ACCT, job, t.session, CREDS);
      assert.equal(out, "paused");
      const fail = t.app.calls.find((c) => c.action === "fail");
      assert.equal(fail.pause, true); assert.match(fail.error, why);
      assert.equal(t.app.calls.filter((c) => c.action === "complete").length, 0);
    } finally { await t.done(); }
  });
}

test("missing selector fails the job without pausing (never guesses)", async () => {
  const t = await setup("nosel");
  try {
    const job = await t.api.lease(ACCT.id);
    const out = await handleJob(t.api, t.cfg, ACCT, job, t.session, CREDS);
    assert.equal(out, "failed");
    const fail = t.app.calls.find((c) => c.action === "fail");
    assert.equal(fail.pause, false); assert.match(fail.error, /Selector missing: search/);
  } finally { await t.done(); }
});

for (const mode of ['stale','empty']) {
  test(`${mode}: completion uses the finished query, not pre-existing rows`, async()=>{
    const t=await setup(mode);
    try {
      const job=await t.api.lease(ACCT.id);
      assert.equal(await handleJob(t.api,t.cfg,ACCT,job,t.session,CREDS),'done');
      const complete=t.app.calls.find(c=>c.action==='complete');
      assert.ok(complete);
      assert.equal(complete.rows.length,mode==='empty'?0:2);
      assert.equal(complete.rows.some(r=>r.origin==='Old City, TX'),false);
      if(mode==='stale') assert.equal(complete.rows[0].origin,'Nashville, TN');
    } finally {await t.done();}
  });
}
