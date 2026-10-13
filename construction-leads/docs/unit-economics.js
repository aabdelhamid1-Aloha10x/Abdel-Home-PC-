'use strict';
// Unit economics of the MARKETPLACE model (customer contracts with the winning sub; the platform earns only fees).
// Run: node docs/unit-economics.js
//
// SOURCED: cost per lead $90-$250 for remodeling on Google; ACH 0.8% capped at $5; Stripe Connect $2/active account/month
//          and 0.25% + $0.25 per payout; BuildZoom charges 2.5-4.5% on contracts under $50K; Handy ~20% (2015 reporting).
// ASSUMPTIONS (mine, not data; replace with your own numbers after a test campaign): funnel rates, estimator cost per visit,
//          auction discount, dispute reserve, job sizes.
const { priceQuote } = require('../server/quote-engine');
const { splitJob } = require('../server/settlement');

const A = {
  leadToBooked: 0.35, bookedToVisit: 0.75, visitToSigned: 0.25,   // ASSUMPTION. "Signed" here = a customer who approves the plan AND accepts an offer
  visitCost: 120,                                                // ASSUMPTION: ~2.5h loaded estimator time incl. travel
  auctionDiscount: 0.10,                                         // ASSUMPTION: winning bid vs the budget ceiling
  disputeReservePct: 0.005,                                      // ASSUMPTION: chargebacks / mediation cost, % of award
  phases: 5, achCap: 5, payouts: 5,
  marketMargin: 0.25,
};

function scenario(directCost, cpl, subPct, custPct) {
  const q = priceQuote([{ description: 'x', qty: 1, material_unit_cost: directCost }], { margin_pct: A.marketMargin }, { state: 'NY' });
  const budget = q.totals.total, award = budget * (1 - A.auctionDiscount);
  const s = splitJob({ payout: award, fee_pct: subPct, customer_fee_pct: custPct });
  const signedPerLead = A.leadToBooked * A.bookedToVisit * A.visitToSigned;
  const acquisition = cpl / signedPerLead + A.visitCost / A.visitToSigned;
  const payments = A.phases * A.achCap + A.payouts * (0.0025 * award / A.payouts + 0.25);
  const reserve = award * A.disputeReservePct;
  const fixedCost = acquisition + payments + reserve;
  return { budget: Math.round(budget), award: Math.round(award), revenue: Math.round(s.platform_revenue), take: s.take_pct, acquisition: Math.round(acquisition), contribution: Math.round(s.platform_revenue - fixedCost), breakevenTakePct: Math.round((fixedCost / (award * (1 - 0)) * 100) * 10) / 10 };
}

console.log('A) Contribution per signed job at $165 cost per lead, by fee structure (sub fee % / customer fee %)');
const rows = [];
for (const cost of [6000, 12000, 20000]) {
  const base = scenario(cost, 165, 5, 0);
  const row = { 'budget': base.budget, 'winning bid': base.award };
  for (const [sp, cp] of [[5, 0], [5, 5], [8, 5], [10, 8]]) row[`${sp}% + ${cp}%`] = scenario(cost, 165, sp, cp).contribution;
  rows.push(row);
}
console.table(rows);

console.log('B) Total take rate (sub fee + customer fee, as % of the winning bid) needed to BREAK EVEN on one job, by cost per lead');
const be = [];
for (const cost of [6000, 12000, 20000]) {
  const row = { 'winning bid': scenario(cost, 165, 5, 0).award };
  for (const cpl of [0, 40, 100, 165, 250]) row[`CPL $${cpl}`] = scenario(cost, cpl, 5, 0).breakevenTakePct + '%';
  be.push(row);
}
console.table(be);
console.log('   (CPL $0 = leads that cost nothing; the estimator visit cost remains. CPL $40 ~ strong organic/referral mix.)\n');

console.log('C) What the subscription adds');
console.log(`   1 sub x $55/month = $660/year. 15 subs = $825/month. Not material.\n`);

const signedPerLead = A.leadToBooked * A.bookedToVisit * A.visitToSigned;
console.log(`D) Funnel check: ${(1 / signedPerLead).toFixed(1)} leads and ${(1 / A.visitToSigned).toFixed(0)} estimator visits per signed job (assumed rates).`);
console.log(`   Card fee on a $10,000 phase: $${(10000 * 0.029 + 0.30).toFixed(2)}; ACH: $${Math.min(10000 * 0.008, 5).toFixed(2)}.`);
