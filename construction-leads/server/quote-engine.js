'use strict';
// Pure pricing logic. No I/O, so it is easy to test and safe to run for live previews.
//
// price = cost / (1 - margin)   <- margin is a share of the SELL price (gross margin),
// not a markup on cost. A "20% margin" quote therefore leaves 20c of every sell dollar as
// gross profit. Markup-on-cost would quietly under-earn by comparison.

const DEFAULTS = {
  labor_rate: 55,        // $/hr paid to in-house crew
  burden_pct: 0.25,      // payroll tax, workers comp, insurance on labor
  contingency_pct: 0.05, // of direct cost, for surprises behind walls
  overhead_pct: 0.10,    // office, vehicles, tools, software
  margin_pct: 0.25,      // gross margin on sell price
  tax_pct: 0,            // sales tax rate; applied to the material share of the price
  deposit_pct: 0.10,
  permit_fee: 0,         // pass-through, no margin
  fulfillment: 'in_house', // 'in_house' | 'subcontractor'
};

const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

// California B&P 7159: down payment on a home-improvement contract may not exceed
// the lesser of 10% or $1,000. Other states differ, so callers must confirm locally.
function depositCap(state, total) {
  if (String(state || '').toUpperCase() === 'CA') return Math.min(total * 0.10, 1000);
  return total;
}

function priceQuote(items, settingsIn = {}, opts = {}) {
  const s = { ...DEFAULTS, ...settingsIn };
  const warnings = [];
  if (s.margin_pct < 0 || s.margin_pct >= 0.9) throw new RangeError('margin_pct must be between 0 and 0.9');
  if (s.deposit_pct < 0 || s.deposit_pct > 1) throw new RangeError('deposit_pct must be between 0 and 1');

  const lines = (items || []).map((it, i) => {
    const qty = num(it.qty, 0);
    const waste = num(it.waste_pct, 0);
    const materials = qty * (1 + waste) * num(it.material_unit_cost, 0);
    const hours = qty * num(it.labor_hours_per_unit, 0);
    const laborRaw = hours * s.labor_rate * (1 + s.burden_pct);
    // For subcontracted fulfilment, a sub bid replaces our own labor on that line.
    const useSub = s.fulfillment === 'subcontractor' && it.sub_cost != null && it.sub_cost !== '';
    const labor = useSub ? 0 : laborRaw;
    const sub = useSub ? num(it.sub_cost) : 0;
    const other = num(it.other_cost, 0);
    if (s.fulfillment === 'subcontractor' && !useSub && hours > 0) {
      warnings.push(`Line ${i + 1} "${it.description || ''}" has no subcontractor bid; priced with in-house labor.`);
    }
    const direct = materials + (useSub ? 0 : laborRaw) + sub + other;
    return { ...it, qty, materials: r2(materials), hours: r2(hours), labor: r2(labor), sub: r2(sub), other: r2(other), direct: r2(direct), _direct: direct, _materials: materials };
  });

  const directTotal = lines.reduce((a, l) => a + l._direct, 0);
  const materialsTotal = lines.reduce((a, l) => a + l._materials, 0);
  const laborTotal = lines.reduce((a, l) => a + l.labor, 0);
  const subTotal = lines.reduce((a, l) => a + l.sub, 0);
  const hoursTotal = lines.reduce((a, l) => a + l.hours, 0);

  const contingency = directTotal * s.contingency_pct;
  const overhead = (directTotal + contingency) * s.overhead_pct;
  const cost = directTotal + contingency + overhead;
  const sell = cost / (1 - s.margin_pct);
  const grossProfit = sell - cost;
  const permit = num(s.permit_fee);
  const materialShare = directTotal > 0 ? materialsTotal / directTotal : 0;
  const tax = sell * materialShare * s.tax_pct;
  const total = sell + permit + tax;

  // Spread the sell price over lines in proportion to direct cost for the customer view.
  const factor = directTotal > 0 ? sell / directTotal : 0;
  const outLines = lines.map(({ _direct, _materials, ...l }) => ({ ...l, price: r2(_direct * factor) }));

  let deposit = total * s.deposit_pct;
  const cap = depositCap(opts.state, total);
  if (deposit > cap) {
    warnings.push(`Deposit reduced to the legal cap for ${String(opts.state).toUpperCase()} ($${r2(cap)}).`);
    deposit = cap;
  } else if (!opts.state) {
    warnings.push('Company state not set: confirm your state\'s cap on home-improvement down payments.');
  }
  if (s.margin_pct < 0.15) warnings.push('Margin is under 15%. Check that overhead and callbacks are covered.');

  return {
    settings: s,
    lines: outLines,
    totals: {
      materials: r2(materialsTotal), labor: r2(laborTotal), subcontractor: r2(subTotal), labor_hours: r2(hoursTotal),
      direct: r2(directTotal), contingency: r2(contingency), overhead: r2(overhead), cost: r2(cost),
      sell: r2(sell), gross_profit: r2(grossProfit), permit: r2(permit), tax: r2(tax), total: r2(total),
      deposit: r2(deposit), balance: r2(total - deposit),
      effective_margin: sell > 0 ? r2((grossProfit / sell) * 10000) / 10000 : 0,
    },
    warnings,
  };
}

module.exports = { priceQuote, DEFAULTS, depositCap };
