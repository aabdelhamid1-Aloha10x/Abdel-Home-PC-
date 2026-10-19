'use strict';
// Unit economics of the SPREAD model: the customer signs a fixed price with the platform; contractors then bid for the
// work; the platform keeps (customer price - winning bid) + a % fee on the bid. Run: node docs/unit-economics.js
//
// SOURCED: NAHB (FY2024) remodelers average 29.9% gross margin and 6.3% net margin, operating expenses 23.6% of revenue;
//          ACH 0.8% capped at $5; Stripe Connect $2/active account/month and 0.25% + $0.25 per payout; ad cost per lead $90-$250.
// ASSUMPTIONS (mine, NOT data; replace after a test campaign): cost per completed studio quote, quote-to-signed rate,
//          verification-visit cost, support time per job, risk reserve (change orders/callbacks/warranty you absorb as contractor of record).
const { splitJob } = require('../server/settlement');

const A = {
  verifyVisit: 120,        // ASSUMPTION: one field-verification visit per signed job
  support: 250,            // ASSUMPTION: planner/admin time per job
  riskReservePct: 4,       // ASSUMPTION: % of price absorbed as the contractor of record
  achCap: 5, phases: 6, payouts: 6,
  feePct: 5,
};

function job({ price, spreadPct, quoteCost, closeRate, feePct = A.feePct }) {
  const payout = price * (1 - spreadPct / 100);
  const s = splitJob({ price, payout, fee_pct: feePct, risk_reserve_pct: A.riskReservePct });
  const acquisition = quoteCost / closeRate + A.verifyVisit;
  const payments = A.phases * A.achCap + A.payouts * (0.0025 * payout / A.payouts + 0.25);
  const contribution = s.after_reserve - acquisition - payments - A.support;
  return { ...s, acquisition, payments, contribution, opexPct: (acquisition + payments + A.support) / price * 100 };
}
const $ = (n) => Math.round(n).toLocaleString('en-US');

console.log('YOUR EXAMPLE: $10,000 price, $8,000 bid, 5% fee');
const ex = splitJob({ price: 10000, payout: 8000, fee_pct: 5, risk_reserve_pct: A.riskReservePct });
console.log(`  spread $${ex.spread} + fee $${ex.sub_fee} = revenue $${ex.revenue} (${ex.revenue_pct}% of the price); after a ${A.riskReservePct}% risk reserve: $${ex.after_reserve}\n`);

console.log('A) Contribution per signed job (after acquisition, verification visit, support, payments, risk reserve)');
console.log('   Studio funnel assumed: $100 per completed studio quote, 12% of quotes sign  =>  ~$953 to acquire a signed job\n');
const rowsA = [];
for (const price of [10000, 15000, 25000, 40000]) {
  const r = { 'customer price': price };
  for (const sp of [10, 15, 20, 25]) r[`spread ${sp}%`] = $(job({ price, spreadPct: sp, quoteCost: 100, closeRate: 0.12 }).contribution);
  rowsA.push(r);
}
console.table(rowsA);

console.log('B) Contribution at a 20% spread, by studio funnel quality (cost per completed quote / quote-to-signed rate)');
const rowsB = [];
for (const price of [10000, 25000, 40000]) {
  const r = { 'customer price': price };
  for (const [qc, cr] of [[50, 0.18], [100, 0.12], [165, 0.12], [165, 0.08]]) r[`$${qc} @ ${cr * 100}%`] = $(job({ price, spreadPct: 20, quoteCost: qc, closeRate: cr }).contribution);
  rowsB.push(r);
}
console.table(rowsB);

console.log('C) Break-even SPREAD % (with a 5% contractor fee) by price and funnel');
const be = (price, qc, cr) => { for (let sp = 0; sp <= 60; sp += 0.5) if (job({ price, spreadPct: sp, quoteCost: qc, closeRate: cr }).contribution >= 0) return sp + '%'; return '>60%'; };
const rowsC = [];
for (const price of [10000, 15000, 25000, 40000]) rowsC.push({ 'customer price': price, '$50 @ 18%': be(price, 50, 0.18), '$100 @ 12%': be(price, 100, 0.12), '$165 @ 12%': be(price, 165, 0.12), '$165 @ 8%': be(price, 165, 0.08) });
console.table(rowsC);

console.log('D) Operating cost as % of price (compare NAHB remodeler average: operating expenses 23.6% of revenue, net 6.3%)');
for (const price of [10000, 25000, 40000]) { const j = job({ price, spreadPct: 20, quoteCost: 100, closeRate: 0.12 }); console.log(`   $${$(price)} job: our modeled costs ${j.opexPct.toFixed(1)}% of price; revenue ${j.revenue_pct}%; net ${(j.contribution / price * 100).toFixed(1)}% (before fixed overhead: staff, software, insurance, bond)`); }

console.log('\nE) PRICE RISK: the spread only exists if contractors bid well below your fixed price. If bids land closer to your price:');
for (const sp of [20, 15, 10, 5, 0]) console.log(`   spread ${sp}%: contribution on a $25,000 job = $${$(job({ price: 25000, spreadPct: sp, quoteCost: 100, closeRate: 0.12 }).contribution)}`);
console.log('\nF) Fixed overhead break-even (insurance, bond, software, planner, ops; assumed $25,000/month) at a 20% spread, $100 @ 12% funnel:');
for (const price of [15000, 25000, 40000]) { const c = job({ price, spreadPct: 20, quoteCost: 100, closeRate: 0.12 }).contribution; console.log(`   $${$(price)} jobs: ${(25000 / c).toFixed(1)} signed jobs per month`); }
