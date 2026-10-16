// Turns the visible results table into RawRow objects (strings only; the app normalizes them).
const SYN = {
  origin: [/^origin$/i, /^from$/i, /^pick.?up (city|location)$/i, /^origin city/i],
  destination: [/^dest(ination)?$/i, /^to$/i, /^drop.?off/i, /^dest(ination)? city/i],
  pickup: [/^pick.?up( date)?$/i, /^avail(able)?$/i, /^date$/i, /^ready/i],
  rate: [/^rate$/i, /^pay$/i, /^price$/i, /^\$/i, /^total/i],
  miles: [/^miles$/i, /^trip$/i, /^distance$/i, /^mi$/i],
  deadhead: [/^dh-?o$/i, /^dho$/i, /^deadhead/i, /^empty/i, /^dh$/i],
  weight: [/^weight$/i, /^wt$/i, /^lbs?$/i],
  length: [/^length$/i, /^len$/i, /^ft$/i],
  equipment: [/^equip(ment)?$/i, /^trailer$/i, /^type$/i, /^eq$/i],
  broker: [/^company$/i, /^broker$/i, /^posted by$/i, /^contact name$/i, /^carrier$/i],
  mc: [/^mc( ?#| number)?$/i, /^docket/i],
  phone: [/^phone$/i, /^tel/i, /^contact (phone|number)$/i],
  email: [/^e-?mail$/i, /^contact e-?mail$/i],
  ref: [/^ref(erence)?( ?#| id)?$/i, /^load ?(id|#|number)$/i, /^id$/i, /^posting/i],
};

/** Map header texts to RawRow field names. First match wins; unmapped columns are ignored. */
export function mapHeaders(headers) {
  const used = new Set(), out = [];
  for (const h of headers) {
    const t = h.replace(/[▾▴↓↑]/g, "").replace(/\s+/g, " ").trim();
    let hit = null;
    for (const [field, pats] of Object.entries(SYN)) if (!used.has(field) && pats.some((p) => p.test(t))) { hit = field; break; }
    if (hit) used.add(hit);
    out.push(hit);
  }
  return out;
}

const TRUNC = /showing\s+(the\s+)?(first|top)\s+\d+|results?\s+(are\s+)?limited|max(imum)?\s+(of\s+)?\d+\s+(results|loads)|more\s+results\s+available/i;

/** Normalize a visible table capture. A malformed/decorative row is never an offer. */
export function parseTableCapture(data, max = 500) {
  const map = mapHeaders(data.headers);
  if (!map.includes("origin") || !map.includes("destination")) throw new Error("Unrecognized result table headers");
  const raw = [];
  for (const r of data.rows) {
    if (r.hidden || r.cells.length !== data.headers.length) continue;
    const o = { text: r.text };
    r.cells.forEach((c, i) => { const f = map[i]; if (f && c) o[f] = c.slice(0, 500); });
    // The board nests RPM below the posted rate, and contact links inside one cell.
    // Prefer observed, field-specific elements over the combined cell text.
    for (const [field, value] of Object.entries(r.fields ?? {})) {
      if (value != null && String(value).trim()) o[field] = String(value).trim().slice(0, 500);
    }
    if (!o.origin || !o.destination) continue;
    raw.push(o);
  }
  return { rows: raw.slice(0, max), truncated: raw.length > max || TRUNC.test(data.page), mappedFields: map.filter(Boolean) };
}

/** Read the table in the page. Throws if the results body is missing (never guesses). */
export async function scrapeRows(page, resultsSel, max = 500) {
  const data = await page.evaluate((sel) => {
    const body = document.querySelector(sel);
    if (!body) return null;
    const table = body.closest("table");
    const headers = table ? [...table.querySelectorAll("thead th, thead td")].map((x) => x.innerText) : [];
    const rows = [...body.querySelectorAll("tr")].map((tr) => {
      const css = getComputedStyle(tr), box = tr.getBoundingClientRect();
      const text = (s) => tr.querySelector(s)?.innerText?.trim();
      const href = (s, prefix) => tr.querySelector(s)?.getAttribute("href")?.slice(prefix.length).split("?")[0];
      return {
        hidden: tr.hidden || css.display === "none" || css.visibility === "hidden" || Number(css.opacity) === 0 || box.height < 2 || box.width < 2,
        cells: [...tr.querySelectorAll(":scope > td")].map((c) => c.innerText.trim()),
        text: tr.innerText.replace(/\s+/g, " ").trim().slice(0, 500),
        fields: { rate: text(".rate-main"), miles: text(".trip-miles"), broker: text(".company-link"),
          ref: tr.getAttribute("data-posting-id"), phone: href('a[href^="tel:"]', "tel:"), email: href('a[href^="mailto:"]', "mailto:") },
      };
    });
    return { headers, rows, page: document.body.innerText.slice(0, 20000) };
  }, resultsSel);
  if (!data) throw new Error("Results table not found");
  return parseTableCapture(data, max);
}
