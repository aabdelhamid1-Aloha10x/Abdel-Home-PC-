'use strict';
// Marketplace economics for one job. Pure math, no I/O.
//
// The customer contracts with the WINNING SUBCONTRACTOR at the bid price. The platform does not earn the spread between
// price and cost (it is not the contractor). It earns only:
//   sub_fee      fee_pct of the bid, withheld from the sub's payouts (never invoiced)
//   customer_fee optional % added on top of the bid for the customer, itemized as platform + payment-protection
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

function splitJob({ payout, fee_pct, customer_fee_pct = 0, acquisition_cost = null }) {
  if (![payout, fee_pct, customer_fee_pct].every(Number.isFinite) || payout < 0 || fee_pct < 0 || customer_fee_pct < 0) throw new RangeError('invalid amounts');
  if (fee_pct > 30 || customer_fee_pct > 30) throw new RangeError('fees above 30% are not allowed');
  const subFee = r2(payout * fee_pct / 100), custFee = r2(payout * customer_fee_pct / 100);
  const revenue = r2(subFee + custFee);
  const out = { customer_total: r2(payout + custFee), customer_fee: custFee, sub_fee: subFee, sub_net: r2(payout - subFee), platform_revenue: revenue, take_pct: payout > 0 ? Math.round(revenue / payout * 10000) / 100 : 0, warnings: [] };
  if (acquisition_cost != null && revenue < acquisition_cost) out.warnings.push(`Revenue $${revenue} is below the estimated $${acquisition_cost} it costs to win one job (ads + estimator). At this bid you lose money unless the lead was free.`);
  if (fee_pct > 10) out.warnings.push('Sub fee above 10%; BuildZoom, the closest model, charges 2.5-4.5% on jobs under $50K.');
  return out;
}

module.exports = { splitJob, r2 };
