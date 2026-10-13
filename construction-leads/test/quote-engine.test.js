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
