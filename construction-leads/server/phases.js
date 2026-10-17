'use strict';
// Splits a quote into SHORT work phases so cash keeps flowing: the customer funds each phase before it starts and
// the subcontractor is paid when it is approved. Pure function: same lines in, same phases out.
//
//   maxPhaseDays   a phase never needs more than this many working days of crew time
//   maxPhasePct    a phase never carries more than this share of the price
//   firstPhasePct  the FIRST payment (due at contract signing, before any work) is kept small, default 10% of the price
//   retainagePct   held back until the final walkthrough (its own last phase)
//
// Lines are ordered by construction stage (demo -> rough-in -> main install -> finishes), packed greedily, and a
// line too big for one phase is split across phases by quantity.
const { r2 } = require('./settlement');

const STAGES = { 1: 'Demolition & prep', 2: 'Rough-in & substrate', 3: 'Main installation', 4: 'Finishes & fixtures' };
function stageOf(line) {
  const t = `${line.description || ''} ${line.category || ''}`.toLowerCase();
  if (/demo|tear.?off|haul|remov|strip|\bgut\b/.test(t)) return 1;
  if (/waterproof|underlayment|ice\/water|rough|plumb|electr|fram|drywall|substrate|sheath|flashing/.test(t)) return 2;
  if (/paint|trim|fixture|vanity|toilet|backsplash|valve|guard|hardware|finish|punch/.test(t)) return 4;
  return 3;
}

function planPhases(lines, opts = {}) {
  const o = { crew: 2, hoursPerDay: 8, maxPhaseDays: 5, maxPhasePct: 0.25, firstPhasePct: 0.10, retainagePct: 0.10, ...opts };
  o.firstPhasePct = Math.min(o.firstPhasePct, o.maxPhasePct);
  if (!Array.isArray(lines) || !lines.length) throw new RangeError('no lines to plan');
  if (!(o.maxPhasePct > 0 && o.maxPhasePct <= 1) || !(o.retainagePct >= 0 && o.retainagePct < 0.5) || !(o.maxPhaseDays > 0)) throw new RangeError('bad phase options');

  const items = lines.map((l, i) => ({
    i, description: l.description || `Line ${i + 1}`, unit: l.unit || '', qty: Number(l.qty) || 0,
    cost: Math.max(Number(l.direct) || 0, 0.01),
    days: Math.max((Number(l.hours) || 0) / (o.crew * o.hoursPerDay), 0.25), stage: stageOf(l),
  })).sort((a, b) => a.stage - b.stage || a.i - b.i);

  const totalCost = items.reduce((a, x) => a + x.cost, 0);
  const costLimit = (pct) => (pct / (1 - o.retainagePct)) * totalCost;   // as a share of work cost, so a phase's % of PRICE stays <= pct
  const phases = []; let cur = null;
  const fresh = () => ({ items: [], days: 0, cost: 0, stages: new Set() });
  const flush = () => { if (cur && cur.items.length) phases.push(cur); cur = fresh(); };
  cur = fresh();

  for (const it of items) {
    let remaining = 1;
    while (remaining > 1e-9) {
      const roomDays = o.maxPhaseDays - cur.days, roomCost = costLimit(phases.length === 0 ? o.firstPhasePct : o.maxPhasePct) - cur.cost;
      const portion = Math.min(remaining, roomDays / it.days, roomCost / it.cost);
      if (portion < 1e-6) { flush(); continue; }
      cur.items.push({ description: it.description, unit: it.unit, qty: r2(it.qty * portion) });
      cur.days += it.days * portion; cur.cost += it.cost * portion; cur.stages.add(it.stage);
      remaining -= portion;
    }
  }
  flush();

  const workShare = 1 - o.retainagePct, seen = {};
  const out = phases.map((p, k) => {
    let name = [...p.stages].sort().map((s) => STAGES[s]).slice(0, 2).join(' + ');
    seen[name] = (seen[name] || 0) + 1; if (seen[name] > 1) name += ` (${seen[name]})`;
    return { seq: k + 1, name, days: Math.max(1, Math.round(p.days * 10) / 10), weight: (p.cost / totalCost) * workShare, lines: p.items };
  });
  if (o.retainagePct > 0) out.push({ seq: out.length + 1, name: 'Final walkthrough & punch list (retainage)', days: 1, weight: o.retainagePct, lines: [{ description: 'Final walkthrough, punch list and cleanup', unit: '', qty: 0 }] });
  // weights must sum to exactly 1
  const sum = out.reduce((a, p) => a + p.weight, 0);
  out[out.length - 2 >= 0 && o.retainagePct > 0 ? out.length - 2 : out.length - 1].weight += 1 - sum;
  for (const p of out) p.weight = Math.round(p.weight * 1e6) / 1e6;
  const drift = r2(1 - out.reduce((a, p) => a + p.weight, 0));
  if (drift) out[out.length - 1].weight = Math.round((out[out.length - 1].weight + drift) * 1e6) / 1e6;

  const warnings = [];
  if (out.length > 12) warnings.push(`${out.length} phases is a lot of paperwork; consider raising maxPhaseDays or maxPhasePct.`);
  return { phases: out, total_days: Math.round(out.reduce((a, p) => a + p.days, 0) * 10) / 10, warnings, options: o };
}

module.exports = { planPhases, stageOf, STAGES };
