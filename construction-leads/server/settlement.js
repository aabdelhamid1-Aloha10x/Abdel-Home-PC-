'use strict';
// Who owes whom on a subcontracted job. Pure math, no I/O.
//
//   total    contract price the customer owes (incl. tax and permit)
//   deposit  collected by the platform at signing
//   payout   the award price: what the subcontractor earns for the work
//   fee      flat platform fee charged to the subcontractor for taking the job
//
// Mode 'platform_collects':  customer pays everything to the platform; platform pays sub (payout - fee).
// Mode 'direct_balance':     customer pays the deposit to the platform and the balance straight to the sub.
//                            The sub therefore holds our margin and must remit it. That is CREDIT RISK on the platform.
const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

function settle({ total, tax = 0, permit = 0, deposit, payout, fee, mode }) {
  if (![total, deposit, payout, fee].every(Number.isFinite) || total < 0 || deposit < 0 || payout < 0 || fee < 0) throw new RangeError('invalid amounts');
  if (deposit > total) throw new RangeError('deposit exceeds total');
  if (fee > payout) throw new RangeError('fee exceeds payout');
  if (!['platform_collects', 'direct_balance'].includes(mode)) throw new RangeError('unknown payment mode');

  const subNet = payout - fee;                       // what the sub keeps after our fee
  const passThrough = tax + permit;                  // held for the state / permit office, not profit
  const platformProfit = total - passThrough - payout + fee; // before our overhead already baked into the quote
  const out = { mode, sub_net: subNet, platform_profit: platformProfit, pass_through: passThrough, warnings: [] };

  if (mode === 'platform_collects') {
    Object.assign(out, { customer_pays_platform: total, customer_pays_sub: 0, platform_owes_sub: subNet, sub_owes_platform: 0 });
  } else {
    const collectedBySub = total - deposit;
    const diff = collectedBySub - subNet;
    Object.assign(out, {
      customer_pays_platform: deposit, customer_pays_sub: collectedBySub,
      platform_owes_sub: diff < 0 ? -diff : 0, sub_owes_platform: diff > 0 ? diff : 0,
    });
    if (diff > 0) out.warnings.push(`The sub collects ${r2(collectedBySub)} from the customer but only earns ${r2(subNet)}, so it must remit ${r2(diff)} to the platform. That is unsecured credit exposure.`);
    out.warnings.push('The sub will see the full contract price when they collect the balance, so your margin is visible to them.');
  }
  if (platformProfit < 0) out.warnings.push('Platform profit is negative at this payout and fee.');
  if (fee > payout * 0.25) out.warnings.push('Fee is over 25% of the payout; subs will balk.');
  for (const k of ['sub_net', 'platform_profit', 'pass_through', 'customer_pays_platform', 'customer_pays_sub', 'platform_owes_sub', 'sub_owes_platform']) out[k] = r2(out[k]);
  return out;
}

module.exports = { settle };
