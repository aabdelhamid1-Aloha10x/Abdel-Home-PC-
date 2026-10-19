'use strict';
// Spread-model economics for one job. Pure math, no I/O.
//
// The customer signs a FIXED PRICE with the platform (the contractor of record). The platform then finds a contractor
// by auction. What it earns on a job:
//   spread    = customer price - winning bid          (the difference it keeps for taking the price/delivery risk)
//   sub_fee   = fee_pct of the winning bid            (withheld from the contractor's payouts, never invoiced)
//   revenue   = spread + sub_fee
// The platform also carries the risks a contractor carries: cost overruns, change orders, warranty, callbacks.
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

function splitJob({ price, payout, fee_pct, acquisition_cost = null, risk_reserve_pct = 0 }) {
  if (![price, payout, fee_pct].every(Number.isFinite) || price < 0 || payout < 0 || fee_pct < 0) throw new RangeError('invalid amounts');
  if (fee_pct > 30) throw new RangeError('fee_pct above 30% is not allowed');
  const spread = r2(price - payout), subFee = r2(payout * fee_pct / 100), revenue = r2(spread + subFee);
  const reserve = r2(price * risk_reserve_pct / 100);
  const out = {
    price: r2(price), payout: r2(payout), spread, spread_pct: price > 0 ? Math.round(spread / price * 10000) / 100 : 0,
    sub_fee: subFee, sub_net: r2(payout - subFee), revenue, revenue_pct: price > 0 ? Math.round(revenue / price * 10000) / 100 : 0,
    after_reserve: r2(revenue - reserve), warnings: [],
  };
  if (spread < 0) out.warnings.push('The winning bid is ABOVE the customer price: this job loses money before any other cost.');
  else if (acquisition_cost != null && revenue - reserve < acquisition_cost) out.warnings.push(`Revenue after the risk reserve ($${r2(revenue - reserve)}) is below the estimated $${acquisition_cost} it costs to win a job (studio ads + verification visit). This job loses money.`);
  if (fee_pct > 10) out.warnings.push('Sub fee above 10%; BuildZoom, the closest commission model, charges 2.5-4.5% on jobs under $50K.');
  return out;
}

module.exports = { splitJob, r2 };
