'use strict';
// Online design studio: the customer picks a room, enters dimensions and chooses finishes, and gets an INSTANT fixed price
// plus a phase plan. Pure pricing logic (no I/O except reading the option catalog).
//
// The quantities come from simple, transparent rules of thumb for a standard rectangular room. The customer's price is
// therefore an ESTIMATE until we field-verify the measurements (the contract has a verification clause with a refund right).
const cfg = require('./config');
const { all } = require('./db');
const { priceQuote } = require('./quote-engine');
const { planPhases } = require('./phases');
const { httpErr } = require('./leads');

const ROOMS = {
  kitchen: {
    label: 'Kitchen', limits: { length: [6, 40], width: [5, 30], height: [7, 12] }, defaults: { length: 12, width: 10, height: 8 },
    groups: [['cabinets', 'Cabinets'], ['countertop', 'Countertops'], ['backsplash', 'Backsplash'], ['flooring', 'Flooring']],
    base: [{ name: 'Demo & haul-away (kitchen)', qty: () => 1, label: 'Demolition and haul-away' }, { name: 'Interior paint (walls and ceiling)', qty: (d) => 2 * (d.length + d.width) * d.height * 0.8, label: 'Paint walls and ceiling' }],
    qty: {
      cabinets: (d) => Math.round((d.length + d.width) * 0.9),              // linear feet of cabinet run
      countertop: (d) => Math.round((d.length + d.width) * 0.9 * 2.1),     // 25 inches deep
      backsplash: (d) => Math.round((d.length + d.width) * 0.9 * 1.5),
      flooring: (d) => Math.round(d.length * d.width),
    },
  },
  bathroom: {
    label: 'Bathroom', limits: { length: [4, 20], width: [4, 16], height: [7, 12] }, defaults: { length: 8, width: 5, height: 8 },
    groups: [['floor_tile', 'Floor tile'], ['shower_tile', 'Shower walls'], ['vanity', 'Vanity'], ['fixtures', 'Fixtures']],
    base: [{ name: 'Demo & haul-away (bathroom)', qty: () => 1, label: 'Demolition and haul-away' }, { name: 'Waterproofing membrane', qty: (d) => d.length * d.width + 2 * (d.length + d.width) * d.height * 0.45, label: 'Waterproofing' },
      { name: 'Toilet, standard', qty: () => 1, label: 'Toilet' }, { name: 'Interior paint (walls and ceiling)', qty: (d) => 2 * (d.length + d.width) * d.height * 0.5, label: 'Paint' }],
    qty: {
      floor_tile: (d) => Math.round(d.length * d.width),
      shower_tile: (d) => Math.round(2 * (d.length + d.width) * d.height * 0.45),
      vanity: () => 1, fixtures: () => 1,
    },
  },
};

function publicConfig() {
  const opts = all('SELECT id, room, grp, label, blurb, swatch FROM studio_options WHERE active=1 ORDER BY sort, id');
  return Object.entries(ROOMS).map(([key, r]) => ({
    key, label: r.label, limits: r.limits, defaults: r.defaults,
    groups: r.groups.map(([g, label]) => ({ key: g, label, options: opts.filter((o) => o.room === key && o.grp === g) })),
  }));
}

function validDims(room, dims) {
  const r = ROOMS[room]; if (!r) throw httpErr(400, 'Choose a kitchen or a bathroom.');
  const d = {};
  for (const k of ['length', 'width', 'height']) {
    const v = Number(dims?.[k]); const [lo, hi] = r.limits[k];
    if (!Number.isFinite(v) || v < lo || v > hi) throw httpErr(400, `${k[0].toUpperCase() + k.slice(1)} must be between ${lo} and ${hi} feet.`);
    d[k] = Math.round(v * 10) / 10;
  }
  return d;
}

// -> { price, groups[], phases[], total_days, items, result, selections_text, dims }
function buildStudioQuote({ room, dims, selections }) {
  const r = ROOMS[room], d = validDims(room, dims);
  const rows = all('SELECT o.*, c.category, c.name cname, c.unit, c.material_unit_cost, c.labor_hours_per_unit, c.waste_pct FROM studio_options o JOIN catalog c ON c.name=o.catalog_name AND c.active=1 WHERE o.active=1 AND o.room=?', room);
  const items = [], tags = [], chosen = [];
  for (const [g, label] of r.groups) {
    const opt = rows.find((o) => o.id === Number(selections?.[g]) && o.grp === g);
    if (!opt) throw httpErr(400, `Choose an option for: ${label}.`);
    const qty = r.qty[g](d);
    items.push({ category: opt.category, description: `${opt.label} (${label.toLowerCase()})`, unit: opt.unit, qty, material_unit_cost: opt.material_unit_cost, labor_hours_per_unit: opt.labor_hours_per_unit, waste_pct: opt.waste_pct });
    tags.push(label); chosen.push(`${label}: ${opt.label}`);
  }
  for (const b of r.base) {
    const c = all('SELECT * FROM catalog WHERE name=? AND active=1', b.name)[0];
    if (!c) throw httpErr(500, `Price book is missing "${b.name}".`);
    items.push({ category: c.category, description: b.label, unit: c.unit, qty: Math.round(b.qty(d) * 10) / 10, material_unit_cost: c.material_unit_cost, labor_hours_per_unit: c.labor_hours_per_unit, waste_pct: c.waste_pct });
    tags.push('Included');
  }
  const result = priceQuote(items, { margin_pct: cfg.studio.marginPct, tax_pct: 0 }, { state: cfg.company.state });
  result.totals.total = Math.round(result.totals.total);   // a clean whole-dollar fixed price, identical in the studio, the contract and the schedule
  const plan = planPhases(result.lines);
  const groups = r.groups.map(([, label]) => ({ label, price: Math.round(result.lines.reduce((a, l, i) => a + (tags[i] === label ? l.price : 0), 0)) }));
  groups.push({ label: 'Demolition, prep and finishing (included)', price: Math.round(result.lines.reduce((a, l, i) => a + (tags[i] === 'Included' ? l.price : 0), 0)) });
  const selections_text = `${r.label} ${d.length} x ${d.width} ft, ${d.height} ft ceiling. ${chosen.join('; ')}.`;
  return {
    price: result.totals.total, groups, items, result, dims: d, room, selections_text,
    phases: plan.phases.map((p) => ({ seq: p.seq, name: p.name, days: p.days, share_pct: Math.round(p.weight * 1000) / 10 })), phase_plan: plan, total_days: plan.total_days,
  };
}

module.exports = { ROOMS, publicConfig, buildStudioQuote, validDims };
