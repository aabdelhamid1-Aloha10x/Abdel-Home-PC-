'use strict';
const cfg = require('./config');
const { money } = require('./util');

// STARTER TEMPLATE ONLY. Have a NY/NJ construction attorney replace it before signing real customers: home-improvement
// contracts are heavily regulated (required notices, license display, cancellation, escrow/bond notice, lien rights).
//
// The contract is between the CUSTOMER and the winning CONTRACTOR (the subcontractor). The platform is the marketplace
// and payment administrator, not the contractor.
function contractText({ quote, lead, sub, award, schedule, rescissionNote }) {
  const total = schedule.reduce((a, m) => a + m.customer_amount, 0);
  const platformFee = Math.round((total - award) * 100) / 100;
  const hours = cfg.marketplace.autoApproveHours;
  const sched = schedule.map((m) => `  ${m.seq}. ${m.name} (about ${m.days} working day${m.days === 1 ? '' : 's'}): ${money(m.customer_amount)}`).join('\n');
  const scope = (quote.scope_summary || '') + '\n' + schedule.map((m) => `  Phase ${m.seq}: ${m.name}`).join('\n');
  return `HOME IMPROVEMENT CONTRACT

Customer: ${lead.name}, ${lead.address || ''} ZIP ${lead.zip || ''}
Contractor: ${sub.name}, License/Registration ${sub.license || '[none on file]'}${sub.license_state ? ' (' + sub.license_state + ')' : ''}, ${sub.phone || ''}
Payment administrator and marketplace: ${cfg.company.name} ("Platform"), ${cfg.company.phone}
Project: ${quote.title || lead.service}

1. SCOPE OF WORK
${scope}
Work not listed is excluded. Changes require a written change order, signed by both parties through the project page and funded before the extra work starts.

2. PRICE AND PAYMENT
Contract price for the work: ${money(award)}.${platformFee > 0 ? `\nPlatform and payment-protection fee (itemized): ${money(platformFee)}.` : ''}
Total you pay: ${money(total)}.
Payment schedule (each amount is due when requested, BEFORE that phase begins; phase 1 is due at signing):
${sched}

2A. PAYMENT RULES
a) All payments must be made only through the payment links the Platform sends you or shows on your project page.
b) The Contractor's crew and subcontractors are NOT authorized to accept cash, checks, transfers or any other payment. A payment made to anyone else does not count toward the price, is not covered by the warranty or the Platform's dispute process, and does not release your obligation to pay.
c) The Contractor may suspend work, without liability, while any payment is overdue. Dates move day for day.
d) When a phase is reported complete you will be notified and may approve it or report a defect through the project page. If you do neither within ${hours} hours, the phase is treated as approved. A reported defect pauses payment of that phase's amount only until it is corrected or resolved.
e) The final phase (retainage) is released after the final walkthrough and punch list.
f) The Contractor authorizes the Platform to collect all payments under this contract and to pay the Contractor per approved phase.

3. RIGHT TO CANCEL
${rescissionNote}

4. HOW YOUR MONEY IS HELD
Payments received before a phase is approved are held by the Platform's payment partner until the phase is approved, then released to the Contractor. [Attorney: insert the NY General Business Law 771 / Lien Law 71-a notice describing the trust account or bond that secures pre-completion payments, and the NJ equivalent.]

5. THE PLATFORM'S ROLE
The Platform is a marketplace and payment administrator. It is not the contractor, does not perform or supervise the work, and does not guarantee it. The Platform offers a non-binding dispute-mediation process. [Attorney: confirm this allocation of roles and any licensing consequence in NY and NJ.]

6. CONTRACTOR'S OBLIGATIONS
The Contractor is solely responsible for the work, permits, licensing, insurance, its employees and subcontractors, and compliance with law. The Contractor carries general liability and workers' compensation insurance as required, will provide lien waivers with each payment, and will pay its subcontractors and suppliers from payments received.

7. START AND COMPLETION
Work will not begin before the cancellation period ends and phase 1 has cleared. The Contractor estimates ${schedule.reduce((a, m) => a + m.days, 0)} working days in total. Dates depend on permits, materials, weather and customer decisions.

8. WARRANTY
[Insert Contractor workmanship warranty, e.g. 1 year. Manufacturer warranties pass through.]

9. HIDDEN CONDITIONS
Hidden conditions (rot, mold, asbestos, wiring or plumbing defects, structural issues) are not included and will be handled by change order.

10. RECORDING
Customer was told in advance that the site visit may be audio-recorded to capture measurements and preferences, and consented before recording started.

11. GENERAL
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
  const note = 'You may cancel this contract, without penalty or obligation, within three (3) business days of signing by sending written notice to the Contractor and the Platform. Your payments will be refunded within 10 days of cancellation. A separate Notice of Cancellation form is provided with this contract. [Confirm wording and any longer period required in your state.]';
  return { ends, note };
}

module.exports = { contractText, rescission, addBusinessDays };
