'use strict';
// Platform-collects economics for a subcontracted job. Pure math, no I/O.
//
//   total     contract price the customer pays the platform (incl. tax and permit)
//   payout    the award price: what the subcontractor earns for the work (gross)
//   fee_pct   platform fee as a % of the payout, withheld from each payout (never invoiced, so no collection risk)
//
// The platform keeps: (total - tax - permit - payout)  [its margin on the customer price]  +  fee.
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

function splitJob({ total, tax = 0, permit = 0, payout, fee_pct }) {
  if (![total, payout, fee_pct].every(Number.isFinite) || total < 0 || payout < 0 || fee_pct < 0) throw new RangeError('invalid amounts');
  if (fee_pct > 30) throw new RangeError('fee_pct above 30% is not allowed');
  const fee = r2(payout * fee_pct / 100);
  const passThrough = tax + permit;
  const margin = total - passThrough - payout;
  const out = { fee, sub_net: r2(payout - fee), pass_through: r2(passThrough), platform_margin: r2(margin), platform_revenue: r2(margin + fee), warnings: [] };
  if (margin < 0) out.warnings.push('The award price is above what the customer pays (after tax/permit). The job loses money before the fee.');
  if (out.platform_revenue < 0) out.warnings.push('Platform revenue on this job is negative.');
  if (fee_pct > 10) out.warnings.push('Fee is above 10%; BuildZoom, the closest model, charges 2.5-4.5% on jobs under $50K.');
  return out;
}

module.exports = { splitJob, r2 };
