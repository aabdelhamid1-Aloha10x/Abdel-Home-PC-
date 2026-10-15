// Drives the reseller's visible search form. No bypass of any security step: login problems, CAPTCHA, 2FA or an
// approval screen throw AuthPause, which pauses the account and asks the owner. A missing selector throws a plain
// error (job fails, never guessed).
import { scrapeRows } from "./rows.js";

export class AuthPause extends Error {}
const CHALLENGE_TEXT = /captcha|verification code|two-?factor|2fa|verify (that )?it'?s you|approve (this )?(sign.?in|login|device)|unusual (activity|sign.?in)|account (locked|suspended)|too many attempts/i;
const rnd = (a, b) => a + Math.random() * (b - a);
export const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const human = () => pause(rnd(300, 900));

export async function challengeReason(page) {
  const frames = page.frames().map((f) => f.url()).join(" ");
  if (/recaptcha|hcaptcha|turnstile|challenges\.cloudflare/i.test(frames)) return "CAPTCHA on the reseller site";
  if (await page.locator('input[autocomplete="one-time-code"], input[name*="otp" i], input[name*="code" i][type="text"]').count()) return "Reseller site asks for a verification code";
  const t = await page.evaluate(() => document.body?.innerText?.slice(0, 5000) ?? "").catch(() => "");
  const m = t.match(CHALLENGE_TEXT);
  return m ? `Reseller site security step: "${m[0]}"` : null;
}

const hasLoginForm = (page) => page.locator('input[type="password"]').count().then((n) => n > 0);

/** Make sure the search form is on screen. Logs in once if needed; never retries a failed login (avoids lockout). */
export async function ensureSearchPage(page, cfg, creds) {
  const sel = cfg.selectors;
  const start = cfg.searchUrl || cfg.loginUrl;
  await page.goto(start, { waitUntil: "domcontentloaded", timeout: 30000 });
  if (await page.locator(sel.origin).count()) return;
  const reason0 = await challengeReason(page);
  if (reason0) throw new AuthPause(reason0);
  if (!(await hasLoginForm(page))) {
    if (cfg.searchUrl) throw new Error("Search form not found on the search page");
    throw new AuthPause("Login page not recognized; owner needs to check the account");
  }
  const user = page.locator('input[type="email"], input[name*="user" i], input[name*="email" i], input[id*="user" i], input[id*="email" i], input[type="text"]').first();
  await user.fill(creds.username);
  await human();
  await page.locator('input[type="password"]').first().fill(creds.password);
  await human();
  const submit = page.locator('button[type="submit"], input[type="submit"]').first();
  if (await submit.count()) await submit.click(); else await page.keyboard.press("Enter");
  await page.waitForLoadState("domcontentloaded").catch(() => null);
  await page.locator(sel.origin).waitFor({ timeout: 15000 }).catch(() => null);
  if (await page.locator(sel.origin).count()) return;
  const reason = await challengeReason(page);
  if (reason) throw new AuthPause(reason);
  if (await hasLoginForm(page)) throw new AuthPause("Login was not accepted (wrong or changed credentials?)");
  if (cfg.searchUrl) { await page.goto(cfg.searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 }); if (await page.locator(sel.origin).count()) return; }
  throw new Error("Search form not found after login");
}

export function fmtDate(ymd, format) {
  const [y, m, d] = ymd.split("-");
  return format.replace("YYYY", y).replace("MM", m).replace("DD", d);
}

async function requireAll(page, sel) {
  for (const [k, s] of Object.entries(sel)) if (!(await page.locator(s).count())) throw new Error(`Selector missing: ${k}`);
}

async function setText(page, s, v) {
  const el = page.locator(s);
  await el.click(); await el.fill(""); if (v != null && v !== "") { await el.fill(String(v)); await el.blur(); }
  await pause(rnd(100, 300));
}

// Readonly date inputs: try the picker-free route (clear readonly, set value, fire events) and verify the field shows it.
async function setDate(page, s, ymd, format) {
  const want = fmtDate(ymd, format);
  await page.locator(s).evaluate((el, v) => {
    el.removeAttribute("readonly");
    el.value = v;
    for (const t of ["input", "change", "blur"]) el.dispatchEvent(new Event(t, { bubbles: true }));
  }, want);
  const got = await page.locator(s).inputValue();
  if (got !== want) throw new Error(`Date field did not accept ${want}`);
}

/** Reset every field, then fill from the job filters. */
export async function fillSearch(page, cfg, f) {
  const sel = cfg.selectors;
  await requireAll(page, sel);
  await setText(page, sel.origin, f.origin);
  await setText(page, sel.dho, f.dho);
  await setText(page, sel.destination, f.destination ?? "");
  await setText(page, sel.dhd, f.dhd ?? "");
  await setText(page, sel.length, f.length ?? "");
  await setText(page, sel.weight, f.weight ?? "");
  await page.locator(sel.loadType).selectOption({ label: f.loadType });
  const eq = page.locator(sel.equipment);
  await eq.click(); await eq.fill(""); await eq.fill(f.equipment.slice(0, 5));
  const opt = page.getByText(f.equipment, { exact: true }).first();
  await opt.waitFor({ state: "visible", timeout: 8000 }).catch(() => { throw new Error(`Equipment option not offered: ${f.equipment}`); });
  await opt.click();
  await setDate(page, sel.startDate, f.startDate, cfg.dateFormat);
  await setDate(page, sel.endDate, f.endDate, cfg.dateFormat);
  await human();
}

export async function runSearch(page, cfg, job) {
  const sel = cfg.selectors;
  await fillSearch(page, cfg, job.filters);
  await page.locator(sel.search).click();
  await page.waitForFunction(
    (s) => { const b = document.querySelector(s); return (b && b.querySelectorAll("tr").length > 0) || /no (loads|results)( found)?/i.test(document.body.innerText); },
    sel.results, { timeout: 45000 });
  await pause(800);
  const reason = await challengeReason(page);
  if (reason) throw new AuthPause(reason);
  const body = await page.locator(sel.results).count();
  if (!body) return { rows: [], truncated: false };
  return scrapeRows(page, sel.results);
}
