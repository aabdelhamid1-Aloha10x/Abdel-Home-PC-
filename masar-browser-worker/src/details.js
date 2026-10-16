// Read only observed expanded-row identity. Never trust reseller authority badges as verification.
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
export function detailIdentity(data, expected) {
  if (!expected.ref || data.ref !== expected.ref || !expected.broker) return null;
  const company = clean(data.company);
  if (!company.toLowerCase().includes(clean(expected.broker).toLowerCase())) return null;
  const matches = [...company.matchAll(/\bMC\s*#\s*(\d{4,8})\b/gi)].map(m => m[1]);
  if (new Set(matches).size !== 1) return null;
  return { mc: matches[0] };
}

/** Bounded enrichment; missing details stay unknown. Uses only row expansion, never contact/action buttons. */
export async function enrichDetails(page, resultsSel, rows, { limit = 50, budgetMs = 60000, check = async () => {} } = {}) {
  const until = Date.now() + budgetMs;
  let attempted = 0;
  for (const row of rows) {
    if (row.mc || !row.ref || !row.broker) continue;
    if (attempted >= limit || Date.now() >= until) break;
    await check();
    const selector = `${resultsSel} tr.load-row[data-posting-id=${JSON.stringify(row.ref)}]`;
    const source = page.locator(selector);
    if (await source.count() !== 1) continue;
    const link = source.locator('.company-link');
    if (await link.count() !== 1) continue;
    attempted++;
    try {
      if (!(await source.getAttribute('class') ?? '').split(/\s+/).includes('expanded')) await link.click({ timeout: 1500 });
      await page.waitForFunction((sel) => {
        const source = document.querySelector(sel), detail = source?.nextElementSibling;
        return detail?.matches('tr.expand-row') && /\bMC\s*#\s*\d{4,8}\b/i.test(detail.querySelector('dat-company')?.innerText ?? '');
      }, selector, { timeout: 1500 });
      const data = await source.evaluate(el => ({
        ref: el.getAttribute('data-posting-id'),
        company: el.nextElementSibling?.matches('tr.expand-row') ? el.nextElementSibling.querySelector('dat-company')?.innerText : '',
      }));
      const identity = detailIdentity(data, row);
      if (identity) row.mc = identity.mc;
    } catch { /* Optional details unavailable: do not guess or lose the base row. */ }
    await check();
  }
  return rows;
}
