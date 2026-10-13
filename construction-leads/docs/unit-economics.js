'use strict';
// Unit economics for one signed job. Run: node docs/unit-economics.js
//
// SOURCED inputs (see feasibility-study.md): cost per lead $90-$250 for remodeling on Google; ACH 0.8% capped $5;
// card 2.9% + 30c; Stripe Connect $2/active account/month and 0.25% + 25c per payout.
// ASSUMPTIONS (not data, replace with your own numbers once you have run ads): the funnel rates, estimator cost per visit,
// warranty reserve and the job sizes.
const { priceQuote } = require('../server/quote-engine');
const { splitJob } = require('../server/settlement');

const A = {
  leadToBooked: 0.35, bookedToVisit: 0.75, visitToSigned: 0.25,  // ASSUMPTIONS
  visitCost: 120,                                               // ASSUMPTION: ~2.5h loaded estimator time incl. travel
  warrantyReservePct: 0.02,                                     // ASSUMPTION: callbacks / warranty work, % of price
  achCapped: 5, milestones: 5, subPayouts: 4,
  quoteSettings: { margin_pct: 0.25, overhead_pct: 0.10, contingency_pct: 0.05, deposit_pct: 0.10 }, // the app's defaults
  feePct: 5,
};

function scenario(directCost, cpl) {
  // Build a quote whose direct cost (materials + labor) is `directCost`, using the app's own pricing engine.
  const q = priceQuote([{ description: 'x', qty: 1, material_unit_cost: directCost }], A.quoteSettings, { state: 'NY' });
  const price = q.totals.total;
  const payout = q.totals.direct + q.totals.contingency;             // the app's default award price
  const s = splitJob({ total: price, payout, fee_pct: A.feePct });
  const signedPerLead = A.leadToBooked * A.bookedToVisit * A.visitToSigned;
  const leadsPerSale = 1 / signedPerLead, visitsPerSale = 1 / A.visitToSigned;
  const adCost = leadsPerSale * cpl, visits = visitsPerSale * A.visitCost;
  const payments = A.milestones * A.achCapped + A.subPayouts * (0.0025 * (payout / A.subPayouts) + 0.25);
  const warranty = price * A.warrantyReservePct;
  const acquisition = adCost + visits;
  const contribution = s.platform_revenue - acquisition - payments - warranty;
  return { price: Math.round(price), payout: Math.round(payout), fee: Math.round(s.fee), revenue: Math.round(s.platform_revenue), leadsPerSale: +leadsPerSale.toFixed(1), adCost: Math.round(adCost), visits: Math.round(visits), payments: Math.round(payments), warranty: Math.round(warranty), contribution: Math.round(contribution), cpl };
}

const rows = [];
for (const cost of [6000, 12000, 20000]) for (const cpl of [100, 165, 250]) rows.push({ direct_cost: cost, ...scenario(cost, cpl) });
console.table(rows.map((r) => ({ 'customer price': r.price, 'sub award': r.payout, 'platform margin+fee': r.revenue, 'CPL': r.cpl, 'leads/sale': r.leadsPerSale, 'ad $/sale': r.adCost, 'estimator $': r.visits, 'pay fees': r.payments, 'warranty': r.warranty, 'CONTRIBUTION': r.contribution })));

// What does the subscription add? Compare one sub's yearly value from each revenue line.
const subs = 15, jobsPerSubPerYear = 6, avgPayout = 14000;
const mid0 = scenario(12000, 165);
console.log(`\nSubscription: 1 sub pays $55 x 12 = $660/year. The 5% fee on ${jobsPerSubPerYear} jobs of $${avgPayout} = $${Math.round(jobsPerSubPerYear * avgPayout * 0.05)}/year.`);
console.log(`Per job, the 5% fee is only ${(mid0.fee / mid0.revenue * 100).toFixed(0)}% of platform revenue; the rest is the margin between the customer price and the sub award.`);
console.log(`${subs} subs on subscription alone = $${subs * 55}/month. The business is a general contractor with a sub network, not a subscription product.`);

// Break-even jobs per month against a fixed-cost base
const fixed = 30000; // ASSUMPTION: salaries, software, insurance, bonds, office per month
const mid = scenario(12000, 165);
console.log(`\nBreak-even at $${fixed}/month of fixed cost, mid case (price $${mid.price}, CPL $165): ${(fixed / mid.contribution).toFixed(1)} signed jobs/month.`);
const big = scenario(20000, 165);
console.log(`Break-even at $${fixed}/month, larger jobs (price $${big.price}): ${(fixed / big.contribution).toFixed(1)} signed jobs/month.`);

// Card vs ACH on a milestone
const card = (amt) => (amt * 0.029 + 0.30), ach = (amt) => Math.min(amt * 0.008, 5);
console.log(`\n$10,000 payment: card fee $${card(10000).toFixed(2)} vs ACH $${ach(10000).toFixed(2)}.`);
