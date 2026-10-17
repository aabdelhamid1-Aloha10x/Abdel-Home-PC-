'use strict';
// Starter data. Prices are PLACEHOLDERS: replace with your real supplier costs and crew productivity.
const { get, all, run } = require('./db');
const { token } = require('./util');

const STUDIO_CATALOG = [
  // category, name, unit, material $/unit, labor hrs/unit, waste   (PLACEHOLDERS: replace with your real supplier costs)
  ['Kitchen', 'Cabinets, stock shaker', 'linft', 140, 1.2, 0.05], ['Kitchen', 'Cabinets, custom inset', 'linft', 380, 2.2, 0.05],
  ['Kitchen', 'Countertop, laminate', 'sqft', 25, 0.25, 0.1], ['Kitchen', 'Countertop, granite', 'sqft', 85, 0.4, 0.1],
  ['Kitchen', 'Backsplash, ceramic subway', 'sqft', 6.5, 0.4, 0.12], ['Kitchen', 'Backsplash, glass mosaic', 'sqft', 18, 0.55, 0.15],
  ['Kitchen', 'Flooring, engineered hardwood', 'sqft', 7.5, 0.08, 0.1], ['Kitchen', 'Flooring, porcelain tile (kitchen)', 'sqft', 4.5, 0.18, 0.12],
  ['Bathroom', 'Floor tile, marble-look', 'sqft', 11, 0.2, 0.12], ['Bathroom', 'Shower wall tile, large format', 'sqft', 9, 0.28, 0.1],
  ['Bathroom', 'Vanity with top, 48in double', 'ea', 1100, 4, 0], ['Bathroom', 'Fixtures, premium matte black', 'ea', 520, 4, 0],
];
// room, group, label, blurb, swatch, catalog name
const STUDIO_OPTIONS = [
  ['kitchen', 'cabinets', 'Stock shaker, white', 'Clean, classic, best value', '#f2efe8', 'Cabinets, stock shaker'],
  ['kitchen', 'cabinets', 'Semi-custom shaker, navy', 'Upgraded boxes and finishes', '#223457', 'Cabinets, semi-custom'],
  ['kitchen', 'cabinets', 'Custom inset, natural oak', 'Furniture-grade, made to fit', '#b98d5b', 'Cabinets, custom inset'],
  ['kitchen', 'countertop', 'Laminate, stone look', 'Budget friendly, durable', '#cfcac0', 'Countertop, laminate'],
  ['kitchen', 'countertop', 'Quartz, white', 'Low maintenance, premium look', '#ece9e4', 'Countertop, quartz'],
  ['kitchen', 'countertop', 'Granite, charcoal', 'Natural stone, heat resistant', '#4a4b4f', 'Countertop, granite'],
  ['kitchen', 'backsplash', 'Ceramic subway, white', 'Timeless', '#f6f6f4', 'Backsplash, ceramic subway'],
  ['kitchen', 'backsplash', 'Porcelain tile, grey', 'Modern and easy to clean', '#9a9c9f', 'Backsplash tile'],
  ['kitchen', 'backsplash', 'Glass mosaic, sea green', 'A statement wall', '#6fa59c', 'Backsplash, glass mosaic'],
  ['kitchen', 'flooring', 'Luxury vinyl plank, oak', 'Waterproof, warm underfoot', '#c4a27a', 'Flooring, LVP'],
  ['kitchen', 'flooring', 'Porcelain tile', 'Hard-wearing', '#bdb9b1', 'Flooring, porcelain tile (kitchen)'],
  ['kitchen', 'flooring', 'Engineered hardwood', 'Real wood top layer', '#a9773f', 'Flooring, engineered hardwood'],
  ['bathroom', 'floor_tile', 'Porcelain, light grey', 'Practical and classic', '#c9c9c6', 'Floor tile, porcelain (installed)'],
  ['bathroom', 'floor_tile', 'Marble-look porcelain', 'Luxe look without upkeep', '#e7e4df', 'Floor tile, marble-look'],
  ['bathroom', 'shower_tile', 'White subway tile', 'Bright and timeless', '#f7f7f5', 'Shower wall tile (installed)'],
  ['bathroom', 'shower_tile', 'Large-format porcelain', 'Fewer grout lines, modern', '#b8bbbd', 'Shower wall tile, large format'],
  ['bathroom', 'vanity', 'Vanity 36in with top', 'Single sink', '#8c6b4a', 'Vanity with top, 36in'],
  ['bathroom', 'vanity', 'Vanity 48in double', 'Two sinks, more storage', '#5b4636', 'Vanity with top, 48in double'],
  ['bathroom', 'fixtures', 'Chrome', 'Standard valve and trim', '#cfd3d6', 'Tub/shower valve and trim'],
  ['bathroom', 'fixtures', 'Matte black', 'Premium finish', '#222222', 'Fixtures, premium matte black'],
];

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
  // Studio rows are added by name, so existing databases pick them up too.
  for (const r of STUDIO_CATALOG) if (!get('SELECT 1 FROM catalog WHERE name=?', r[1])) run('INSERT INTO catalog (category, name, unit, material_unit_cost, labor_hours_per_unit, waste_pct) VALUES (?,?,?,?,?,?)', ...r);
  if (!get('SELECT 1 FROM studio_options LIMIT 1')) STUDIO_OPTIONS.forEach((o, i) => run('INSERT INTO studio_options (room, grp, label, blurb, swatch, catalog_name, sort) VALUES (?,?,?,?,?,?,?)', o[0], o[1], o[2], o[3], o[4], o[5], i));
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
