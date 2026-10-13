'use strict';
const cfg = require('./config');
const { money } = require('./util');

// STARTER TEMPLATE ONLY. Have a licensed attorney in your state review and replace this before
// signing real customers: home-improvement contracts are heavily regulated (required notices,
// license display, deposit caps, cancellation rights, lien notices) and the rules differ by state.
function contractText({ quote, lead, result, rescissionNote }) {
  const t = result.totals;
  const lines = result.lines.map((l) => `  - ${l.description}${l.qty ? ` (${l.qty} ${l.unit || ''})` : ''}`).join('\n');
  return `HOME IMPROVEMENT CONTRACT

Contractor: ${cfg.company.name}, License ${cfg.company.license}, ${cfg.company.phone}
Customer: ${lead.name}, ${lead.address || ''} ZIP ${lead.zip || ''}
Project: ${quote.title || lead.service}

1. SCOPE OF WORK
${quote.scope_summary || ''}
${lines}
Work not listed above is excluded. Changes require a written change order signed by both parties and may change price and schedule.

2. PRICE AND PAYMENT
Contract price: ${money(t.total)}${t.tax ? ` (includes sales tax ${money(t.tax)})` : ''}${t.permit ? ` and permit fees ${money(t.permit)}` : ''}.
Deposit due at signing: ${money(t.deposit)}.
Balance: ${money(t.balance)}, due on substantial completion unless a milestone schedule is attached.

3. RIGHT TO CANCEL
${rescissionNote}

4. START AND COMPLETION
Work will not begin before the cancellation period ends. Contractor will give a start date after the deposit clears. Dates depend on permits, material availability, weather and customer decisions.

5. SUBCONTRACTORS
Contractor may use licensed, insured subcontractors for any part of the work and remains responsible to Customer for that work.

6. MATERIALS, SELECTIONS AND SITE CONDITIONS
Contractor will use the materials specified. Customer selections made after signing may change price. Hidden conditions (rot, mold, asbestos, wiring or plumbing defects, structural issues) discovered during work are not included and will be handled by change order.

7. WARRANTY
[Insert workmanship warranty terms, e.g. 1 year on labor. Manufacturer warranties pass through.]

8. INSURANCE AND LICENSE
Contractor carries general liability and workers' compensation insurance as required by law. [Insert state-required notices and lien disclosures.]

9. RECORDING
Customer was told in advance that the site visit may be audio-recorded to capture measurements and preferences, and consented before recording started. Recordings are used only to prepare the estimate and contract.

10. GENERAL
This agreement is the entire agreement. Governed by the laws of ${cfg.company.state || '[State]'}. [Dispute-resolution terms.]
`;
}

function addBusinessDays(from, n) {
  const d = new Date(from);
  let added = 0;
  while (added < n) { d.setUTCDate(d.getUTCDate() + 1); if (d.getUTCDay() !== 0) added++; } // Sundays don't count
  return d;
}

function rescission(signedAt) {
  const ends = addBusinessDays(signedAt, 3);
  ends.setUTCHours(23, 59, 59, 0);
  const note = 'You may cancel this contract, without penalty or obligation, within three (3) business days of signing by sending written notice to the Contractor. Your deposit will be refunded within 10 days of cancellation. A separate Notice of Cancellation form is provided with this contract. [Confirm wording and any longer period required in your state.]';
  return { ends, note };
}

module.exports = { contractText, rescission, addBusinessDays };
