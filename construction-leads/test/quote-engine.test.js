'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { priceQuote, depositCap } = require('../server/quote-engine');

const base = { labor_rate: 50, burden_pct: 0, contingency_pct: 0, overhead_pct: 0, margin_pct: 0.2, tax_pct: 0, deposit_pct: 0.1 };

test('margin is applied to sell price, not cost', () => {
  const q = priceQuote([{ description: 'x', qty: 1, material_unit_cost: 800 }], base, { state: 'TX' });
  assert.equal(q.totals.cost, 800);
  assert.equal(q.totals.sell, 1000);          // 800 / 0.8
  assert.equal(q.totals.gross_profit, 200);
  assert.equal(q.totals.effective_margin, 0.2);
});

test('materials include waste, labor includes burden', () => {
  const q = priceQuote(
    [{ description: 'tile', qty: 100, waste_pct: 0.1, material_unit_cost: 5, labor_hours_per_unit: 0.2 }],
    { ...base, burden_pct: 0.25, margin_pct: 0 }, { state: 'TX' });
  assert.equal(q.totals.materials, 550);        // 100 * 1.1 * 5
  assert.equal(q.totals.labor_hours, 20);
  assert.equal(q.totals.labor, 1250);           // 20h * 50 * 1.25
  assert.equal(q.totals.sell, 1800);
});

test('overhead and contingency stack on direct cost', () => {
  const q = priceQuote([{ qty: 1, material_unit_cost: 1000 }],
    { ...base, contingency_pct: 0.05, overhead_pct: 0.10, margin_pct: 0 }, { state: 'TX' });
  assert.equal(q.totals.contingency, 50);
  assert.equal(q.totals.overhead, 105);         // (1000+50) * 10%
  assert.equal(q.totals.cost, 1155);
});

test('subcontractor bid replaces in-house labor on that line', () => {
  const items = [{ description: 'roof', qty: 10, material_unit_cost: 100, labor_hours_per_unit: 2, sub_cost: 3000 }];
  const inHouse = priceQuote(items, { ...base, margin_pct: 0 }, { state: 'TX' });
  const sub = priceQuote(items, { ...base, margin_pct: 0, fulfillment: 'subcontractor' }, { state: 'TX' });
  assert.equal(inHouse.totals.labor, 1000);
  assert.equal(sub.totals.labor, 0);
  assert.equal(sub.totals.subcontractor, 3000);
  assert.equal(sub.totals.direct, 4000);
});

test('sub fulfilment without a bid warns and falls back to own labor', () => {
  const q = priceQuote([{ description: 'paint', qty: 1, labor_hours_per_unit: 4 }],
    { ...base, fulfillment: 'subcontractor' }, { state: 'TX' });
  assert.equal(q.totals.labor, 200);
  assert.match(q.warnings[0], /no subcontractor bid/);
});

test('tax applies only to the material share; permit passes through untaxed', () => {
  const q = priceQuote([{ qty: 1, material_unit_cost: 500, labor_hours_per_unit: 10 }],
    { ...base, margin_pct: 0, tax_pct: 0.1, permit_fee: 200 }, { state: 'TX' });
  // direct 1000 (500 mat + 500 labor) -> sell 1000, material share 50% -> tax 50
  assert.equal(q.totals.tax, 50);
  assert.equal(q.totals.total, 1250);
});

test('line prices sum to the sell price (within rounding)', () => {
  const q = priceQuote([
    { qty: 3, material_unit_cost: 33.33 }, { qty: 7, material_unit_cost: 12.1, labor_hours_per_unit: 1.5 },
  ], base, { state: 'TX' });
  const sum = q.lines.reduce((a, l) => a + l.price, 0);
  assert.ok(Math.abs(sum - q.totals.sell) < 0.02);
});

test('California deposit is capped at lesser of 10% or $1,000', () => {
  assert.equal(depositCap('CA', 50000), 1000);
  assert.equal(depositCap('ca', 5000), 500);
  assert.equal(depositCap('TX', 50000), 50000);
  const q = priceQuote([{ qty: 1, material_unit_cost: 40000 }], { ...base, deposit_pct: 0.15 }, { state: 'CA' });
  assert.equal(q.totals.deposit, 1000);
  assert.ok(q.warnings.some((w) => /legal cap/.test(w)));
});

test('rejects nonsense margins and empty quotes are zero', () => {
  assert.throws(() => priceQuote([], { margin_pct: 0.95 }), RangeError);
  assert.equal(priceQuote([], base, { state: 'TX' }).totals.total, 0);
});

test('marketplace split: fee is a percentage of the bid; customer fee is optional and itemized', () => {
  const { splitJob } = require('../server/settlement');
  const s = splitJob({ payout: 14000, fee_pct: 5, customer_fee_pct: 3 });
  assert.equal(s.sub_fee, 700); assert.equal(s.sub_net, 13300);
  assert.equal(s.customer_fee, 420); assert.equal(s.customer_total, 14420);
  assert.equal(s.platform_revenue, 1120); assert.equal(s.take_pct, 8);
  assert.equal(splitJob({ payout: 10000, fee_pct: 5 }).sub_fee, 500, '5% of a $10,000 award is $500');
  assert.ok(splitJob({ payout: 10000, fee_pct: 5, acquisition_cost: 3000 }).warnings.some((w) => /below the estimated/.test(w)), 'warns when fees cannot cover the cost of winning the job');
  assert.equal(splitJob({ payout: 30000, fee_pct: 5, customer_fee_pct: 5, acquisition_cost: 3000 }).warnings.length, 0);
  assert.ok(splitJob({ payout: 20000, fee_pct: 12 }).warnings.some((w) => /BuildZoom/.test(w)));
  assert.throws(() => splitJob({ payout: 100, fee_pct: 31 }), RangeError);
  assert.throws(() => splitJob({ payout: -1, fee_pct: 5 }), RangeError);
});

test('payment schedule: every phase is cents-exact and the sub is never paid ahead of the customer', () => {
  const { planPhases } = require('../server/phases');
  const { buildSchedule, cashSafe } = require('../server/milestones');
  const lines = [{ description: 'Demo', direct: 500, hours: 20, qty: 1 }, { description: 'Tile', direct: 4000, hours: 60, qty: 300 }, { description: 'Paint', direct: 600, hours: 12, qty: 900 }];
  for (const [award, fee, cust] of [[12000, 5, 0], [12000, 5, 3], [9999.99, 7.5, 2.5], [33333.33, 5, 0]]) {
    const phases = planPhases(lines, { maxPhaseDays: 3 }).phases;
    const sched = buildSchedule({ phases, award, feePct: fee, customerFeePct: cust });
    const sum = (k) => sched.reduce((a, m) => a + m[k], 0);
    assert.ok(Math.abs(sum('sub_gross') - award) < 0.005, `gross ${sum('sub_gross')}`);
    assert.ok(Math.abs(sum('customer_amount') - Math.round(award * (1 + cust / 100) * 100) / 100) < 0.005);
    assert.ok(Math.abs(sum('fee_amount') - Math.round(award * fee) / 100) < 0.011);
    assert.ok(Math.abs(sum('sub_net') + sum('fee_amount') - award) < 0.011);
    assert.equal(cashSafe(sched), true);
  }
  assert.equal(cashSafe([{ customer_amount: 100, sub_gross: 150 }]), false, 'paying more than was collected is detected');
});

test('phase planner: short phases, stage order, weights sum to 1, big lines are split', () => {
  const { planPhases } = require('../server/phases');
  const lines = priceQuote([
    { description: 'Demo & haul-away (bathroom)', qty: 1, material_unit_cost: 150, labor_hours_per_unit: 10, category: 'Bathroom' },
    { description: 'Floor tile, porcelain (installed)', qty: 300, material_unit_cost: 4.5, labor_hours_per_unit: 0.18, waste_pct: 0.12 },
    { description: 'Waterproofing membrane', qty: 300, material_unit_cost: 1.8, labor_hours_per_unit: 0.05 },
    { description: 'Vanity with top, 36in', qty: 1, material_unit_cost: 650, labor_hours_per_unit: 3 },
    { description: 'Interior paint (walls and ceiling)', qty: 900, material_unit_cost: 0.45, labor_hours_per_unit: 0.025 },
  ], { margin_pct: 0.2 }, { state: 'NY' }).lines;
  const p = planPhases(lines, { maxPhaseDays: 3, maxPhasePct: 0.25 });
  assert.ok(p.phases.length >= 4, 'several short phases');
  assert.ok(Math.abs(p.phases.reduce((a, x) => a + x.weight, 0) - 1) < 1e-5, 'weights sum to 1');
  for (const ph of p.phases.slice(0, -1)) { assert.ok(ph.weight <= 0.25 + 1e-4, `phase ${ph.seq} weight ${ph.weight}`); assert.ok(ph.days <= 3.05, `phase ${ph.seq} days ${ph.days}`); }
  assert.ok(p.phases[0].weight <= 0.10 + 1e-4, `first payment is small (${p.phases[0].weight})`);
  const last = p.phases[p.phases.length - 1];
  assert.match(last.name, /retainage/); assert.equal(last.weight, 0.1);
  assert.match(p.phases[0].name, /Demolition/, 'demolition comes first');
  const tileQty = p.phases.flatMap((x) => x.lines).filter((l) => /Floor tile/.test(l.description)).reduce((a, l) => a + l.qty, 0);
  assert.ok(Math.abs(tileQty - 300) < 0.1, `split lines keep their total quantity (${tileQty})`);
  assert.throws(() => planPhases([]), RangeError);
  assert.throws(() => planPhases(lines, { maxPhasePct: 0 }), RangeError);
});
