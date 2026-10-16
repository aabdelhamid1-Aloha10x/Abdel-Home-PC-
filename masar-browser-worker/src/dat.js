// Drives the reseller's visible search form. No bypass of any security step: login problems, CAPTCHA, 2FA or an
// approval screen throw AuthPause, which pauses the account and asks the owner. A missing selector throws a plain
// error (job fails, never guessed).
import { scrapeRows } from "./rows.js";
import { enrichDetails } from "./details.js";

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

async function openFilters(page, sel) {
  const toggle = page.getByRole('button', { name: 'Edit Search ▾', exact: true });
  if (await toggle.isVisible()) await toggle.click();
  await page.locator(sel.origin).waitFor({ state: 'visible', timeout: 15000 });
}

/** Make sure the search form is on screen. Logs in once if needed; never retries a failed login (avoids lockout). */
export async function ensureSearchPage(page, cfg, creds) {
  const sel = cfg.selectors;
  const start = cfg.searchUrl || cfg.loginUrl;
  await page.goto(start, { waitUntil: "domcontentloaded", timeout: 30000 });
  if (await page.locator(sel.origin).count()) { await openFilters(page, sel); return; }
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
  if (await page.locator(sel.origin).count()) { await openFilters(page, sel); return; }
  const reason = await challengeReason(page);
  if (reason) throw new AuthPause(reason);
  if (await hasLoginForm(page)) throw new AuthPause("Login was not accepted (wrong or changed credentials?)");
  if (cfg.searchUrl) { await page.goto(cfg.searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 }); if (await page.locator(sel.origin).count()) { await openFilters(page, sel); return; } }
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

export function monthIndex(label) {
  const match = /^([A-Z]{3}) (\d{4})$/.exec(label.trim().toUpperCase());
  const month = match ? ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].indexOf(match[1]) : -1;
  if (month < 0) throw new Error('Unrecognized calendar month');
  return Number(match[2]) * 12 + month;
}

async function chooseDay(page, ymd) {
  const [year, month, day] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.toISOString().slice(0, 10) !== ymd) throw new Error('Invalid calendar date');
  const want = year * 12 + month - 1;
  for (let n = 0; n < 25; n++) {
    const current = monthIndex(await page.locator('#calMonthYearText').innerText());
    if (current === want) {
      const cell = page.locator('#calDaysGrid .cal-day-cell:not(.empty):not(.disabled)').filter({hasText:new RegExp(`^${day}$`)});
      await cell.click({timeout:5000});
      return;
    }
    const nav = page.getByRole('button',{name: current < want ? 'Next month' : 'Previous month',exact:true});
    if (!(await nav.isEnabled())) throw new Error('Requested calendar month is unavailable');
    await nav.click();
  }
  throw new Error('Requested calendar range exceeds navigation limit');
}

async function setDates(page, sel, start, end, format) {
  if (end < start) throw new Error('End date precedes start date');
  await page.getByRole('button',{name:'Open calendar',exact:true}).click();
  await chooseDay(page, start);
  await chooseDay(page, end);
  for (const [selector, date] of [[sel.startDate,start],[sel.endDate,end]]) {
    if (await page.locator(selector).inputValue() !== fmtDate(date,format)) throw new Error('Calendar did not accept requested range');
  }
  if (await page.locator('#calMonthYearText').isVisible()) await page.getByRole('button',{name:'Open calendar',exact:true}).click();
}

async function setCity(page, selector, city) {
  await page.locator(selector).fill(city ?? '');
  if (!city) return;
  const option = page.locator('.autocomplete-item').filter({hasText:new RegExp(`^${city.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?: \\(\\d{5}\\))?$`)});
  await option.waitFor({state:'visible',timeout:10000});
  await option.click();
  if (await page.locator(selector).inputValue() !== city) throw new Error('Location selection did not match requested city/state');
}

/** Reset every field, then fill from the job filters. */
export async function fillSearch(page, cfg, f) {
  const sel = cfg.selectors;
  await openFilters(page, sel);
  await requireAll(page, sel);
  await setCity(page, sel.origin, f.origin);
  await setText(page, sel.dho, f.dho);
  await setCity(page, sel.destination, f.destination ?? "");
  await setText(page, sel.dhd, f.dhd ?? "");
  await setText(page, sel.length, f.length ?? "");
  await setText(page, sel.weight, f.weight ?? "");
  await page.locator(sel.loadType).selectOption({ label: f.loadType });
  await page.locator('#equipSummaryView').click();
  const remove = page.locator('#equipExpandedChips .chip-remove-btn');
  while (await remove.count()) await remove.first().click();
  const normalize = (s) => s.replace(/\s/g,'').toLowerCase();
  const options = page.locator('#equipDropdownOptions .equip-chip-option-title');
  const names = await options.allTextContents();
  const index = names.findIndex(n => normalize(n) === normalize(f.equipment));
  if (index < 0) throw new Error(`Equipment option not offered: ${f.equipment}`);
  await options.nth(index).click();
  const chips = await page.locator('#equipExpandedChips .equip-chip-item').allTextContents();
  if (chips.length !== 1 || normalize(chips[0].replace('✕','')) !== normalize(f.equipment)) throw new Error(`Equipment selection was not exact: ${JSON.stringify(chips)}`);
  await page.getByRole('button',{name:'Hide Filters ▴',exact:true}).click();
  await openFilters(page, sel);
  await setDates(page, sel, f.startDate, f.endDate, cfg.dateFormat);
  await human();
}

export async function submitAndWait(page, searchSelector) {
  // Observed board lifecycle: active class appears during each search, then clears.
  // Existing rows/count may persist throughout. Missing the start signal fails closed.
  const active = page.locator('#searchProgressBar.active');
  await active.waitFor({state:'hidden',timeout:45000});
  const started = active.waitFor({state:'attached',timeout:10000});
  await Promise.all([started,page.locator(searchSelector).click()]);
  await active.waitFor({state:'detached',timeout:45000});
}

export async function runSearch(page, cfg, job) {
  const sel = cfg.selectors;
  await fillSearch(page, cfg, job.filters);
  await submitAndWait(page, sel.search);
  const reason = await challengeReason(page);
  if (reason) throw new AuthPause(reason);
  const body = await page.locator(sel.results).count();
  if (!body) return { rows: [], truncated: false };
  const result = await scrapeRows(page, sel.results);
  await enrichDetails(page, sel.results, result.rows, { check: async () => {
    const reason = await challengeReason(page);
    if (reason) throw new AuthPause(reason);
  } });
  return result;
}
