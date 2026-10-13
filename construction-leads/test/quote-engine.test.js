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

test('platform split: fee is a percentage of the payout, margin is separate, tax is pass-through', () => {
  const { splitJob } = require('../server/settlement');
  const s = splitJob({ total: 21000, tax: 500, permit: 500, payout: 14000, fee_pct: 5 });
  assert.equal(s.fee, 700);
  assert.equal(s.sub_net, 13300);
  assert.equal(s.pass_through, 1000);
  assert.equal(s.platform_margin, 6000);          // 21000 - 1000 - 14000
  assert.equal(s.platform_revenue, 6700);         // margin + fee
  assert.equal(splitJob({ total: 10000, payout: 10000, fee_pct: 5 }).fee, 500, '5% of a $10,000 award is $500');
  assert.ok(splitJob({ total: 10000, payout: 11000, fee_pct: 5 }).warnings.some((w) => /loses money/.test(w)));
  assert.ok(splitJob({ total: 20000, payout: 10000, fee_pct: 12 }).warnings.some((w) => /BuildZoom/.test(w)));
  assert.throws(() => splitJob({ total: 100, payout: 50, fee_pct: 31 }), RangeError);
  assert.throws(() => splitJob({ total: 100, payout: -1, fee_pct: 5 }), RangeError);
});

test('milestones: customer schedule sums exactly; sub payouts and fee conserve to the cent', () => {
  const { planSchedule, allocatePayout, cashSafe } = require('../server/milestones');
  for (const [total, deposit, payout, pct] of [[20000, 1000, 14000, 5], [33333.33, 1666.67, 22222.22, 7.5], [9999.99, 999.99, 7000.01, 5], [100, 0, 70, 5]]) {
    const sched = planSchedule({ total, deposit });
    const sum = sched.reduce((a, m) => a + m.customer_amount, 0);
    assert.ok(Math.abs(sum - total) < 0.005, `customer sum ${sum} vs ${total}`);
    const alloc = allocatePayout(sched, payout, pct);
    const gross = alloc.reduce((a, m) => a + m.sub_gross, 0), fee = alloc.reduce((a, m) => a + m.fee_amount, 0), net = alloc.reduce((a, m) => a + m.sub_net, 0);
    assert.ok(Math.abs(gross - payout) < 0.005, `gross ${gross} vs ${payout}`);
    assert.ok(Math.abs(fee - Math.round(payout * pct) / 100) < 0.011, `fee ${fee}`);
    assert.ok(Math.abs(net + fee - payout) < 0.011);
    assert.equal(cashSafe(alloc), true);
    assert.equal(alloc[0].sub_gross, 0, 'the deposit never pays the sub');
  }
});

test('milestones: cash safety detects a schedule that would pay out money not yet collected', () => {
  const { cashSafe } = require('../server/milestones');
  assert.equal(cashSafe([{ customer_amount: 100, sub_gross: 0 }, { customer_amount: 100, sub_gross: 250 }]), false);
  assert.equal(cashSafe([{ customer_amount: 100, sub_gross: 0 }, { customer_amount: 100, sub_gross: 150 }]), true);
});
