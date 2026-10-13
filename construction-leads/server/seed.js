'use strict';
// Starter data. Prices are PLACEHOLDERS: replace with your real supplier costs and crew productivity.
const { get, all, run } = require('./db');
const { token } = require('./util');

function seed() {
  if (!get('SELECT 1 FROM catalog LIMIT 1')) {
    // category, name, unit, material $/unit, labor hrs/unit, waste
    const rows = [
      ['Bathroom', 'Demo & haul-away (bathroom)', 'ea', 150, 10, 0],
      ['Bathroom', 'Floor tile, porcelain (installed)', 'sqft', 4.5, 0.18, 0.12],
      ['Bathroom', 'Shower wall tile (installed)', 'sqft', 6, 0.3, 0.12],
      ['Bathroom', 'Waterproofing membrane', 'sqft', 1.8, 0.05, 0.05],
      ['Bathroom', 'Vanity with top, 36in', 'ea', 650, 3, 0],
      ['Bathroom', 'Toilet, standard', 'ea', 260, 1.5, 0],
      ['Bathroom', 'Tub/shower valve and trim', 'ea', 280, 4, 0],
      ['Kitchen', 'Demo & haul-away (kitchen)', 'ea', 250, 16, 0],
      ['Kitchen', 'Cabinets, semi-custom', 'linft', 220, 1.5, 0.05],
      ['Kitchen', 'Countertop, quartz', 'sqft', 70, 0.35, 0.1],
      ['Kitchen', 'Backsplash tile', 'sqft', 9, 0.4, 0.12],
      ['Kitchen', 'Flooring, LVP', 'sqft', 3.2, 0.05, 0.1],
      ['Interior', 'Drywall hang, tape, finish', 'sqft', 0.9, 0.06, 0.1],
      ['Interior', 'Interior paint (walls and ceiling)', 'sqft', 0.45, 0.025, 0.05],
      ['Interior', 'Full gut demo (per room)', 'ea', 100, 14, 0],
      ['Roofing', 'Asphalt shingle roof, tear-off and install', 'sq', 135, 3.2, 0.1],
      ['Roofing', 'Underlayment and ice/water shield', 'sq', 30, 0.5, 0.05],
      ['Roofing', 'Flashing and vents allowance', 'ea', 180, 3, 0],
      ['Siding', 'Vinyl siding install', 'sq', 120, 3.5, 0.1],
      ['Siding', 'Fiber-cement siding install', 'sq', 210, 5, 0.1],
      ['Siding', 'Trim and soffit/fascia', 'linft', 3.5, 0.08, 0.08],
      ['Gutters', 'Seamless aluminum gutters', 'linft', 5.5, 0.07, 0.05],
      ['Gutters', 'Gutter guards', 'linft', 4, 0.04, 0.03],
      ['Concrete', 'Driveway, 4in broom finish', 'sqft', 5.2, 0.07, 0.05],
      ['Concrete', 'Walkway/patio slab', 'sqft', 5.8, 0.09, 0.05],
      ['Concrete', 'Demo and haul existing concrete', 'sqft', 0.8, 0.05, 0],
    ];
    for (const r of rows) run('INSERT INTO catalog (category, name, unit, material_unit_cost, labor_hours_per_unit, waste_pct) VALUES (?,?,?,?,?,?)', ...r);
  }
  if (!get('SELECT 1 FROM staff LIMIT 1')) {
    run("INSERT INTO staff (name, role, token) VALUES ('Estimator 1','tech',?)", token(16));
    run("INSERT INTO staff (name, role, token) VALUES ('Estimator 2','tech',?)", token(16));
  }
}

module.exports = { seed };
if (require.main === module) {
  seed();
  console.log('Seeded. Estimator links:');
  for (const s of all("SELECT name, token FROM staff WHERE role='tech'")) console.log(` ${s.name}: ${require('./config').publicUrl}/tech.html#${s.token}`);
}
