'use strict';
const cfg = require('./config');
const { money } = require('./util');

// STARTER TEMPLATE ONLY. Have a NY/NJ construction attorney replace it before signing real customers. Because the platform
// contracts with the customer as CONTRACTOR OF RECORD, it must carry the required home-improvement terms: contractor identity
// and license, description of work and materials, approximate start/completion dates with contingencies, price, the
// mechanic's-lien notice, the cancellation right, and (NY) the pre-completion payment trust/bond notice.
function contractText({ quote, lead, schedule, rescissionNote }) {
  const total = Math.round(schedule.reduce((a, m) => a + m.customer_amount, 0) * 100) / 100;
  const hours = cfg.marketplace.autoApproveHours, days = Math.round(schedule.reduce((a, m) => a + m.days, 0) * 10) / 10;
  const sched = schedule.map((m) => `  ${m.seq}. ${m.name} (about ${m.days} working day${m.days === 1 ? '' : 's'}): ${money(m.customer_amount)}`).join('\n');
  const studio = quote.studio ? JSON.parse(quote.studio) : null;
  const scope = [quote.scope_summary || '', studio?.selections_text || ''].filter(Boolean).join('\n') + '\n' + schedule.map((m) => `  Phase ${m.seq}: ${m.name}`).join('\n');
  return `HOME IMPROVEMENT CONTRACT

Customer: ${lead.name}, ${lead.address || ''} ZIP ${lead.zip || ''}
Contractor: ${cfg.company.name}, License/Registration ${cfg.company.license}, ${cfg.company.phone} [Attorney: add business address]
Project: ${quote.title || lead.service}

1. SCOPE OF WORK AND MATERIALS
${scope}
Materials are the products named above [Attorney: list make/model or identifying information for each material, as required]. Work not listed is excluded. Changes require a written change order, signed by both parties through the project page and funded before the extra work starts.

2. PRICE AND PAYMENT
Fixed contract price: ${money(total)}, subject only to section 3.
Payment schedule (each amount is due when requested, BEFORE that phase begins; phase 1 is due at signing):
${sched}

2A. PAYMENT RULES
a) All payments must be made to Contractor only through the payment links Contractor sends you or shows on your project page.
b) Contractor's crews and subcontractors are NOT authorized to accept cash, checks, transfers or any other payment. A payment made to anyone else does not count toward the price, is not covered by the warranty, and does not release your obligation to pay.
c) Contractor may suspend work, without liability, while any payment is overdue. Dates move day for day.
d) When a phase is reported complete you will be notified and may approve it or report a defect through the project page. If you do neither within ${hours} hours, the phase is treated as approved. A reported defect pauses payment of that phase's amount only until it is corrected or resolved.
e) The final phase (retainage) is released after the final walkthrough and punch list.

3. FIELD VERIFICATION AND PRICE ADJUSTMENT
This price is based on the dimensions and selections you provided. Within 7 days after signing, Contractor will verify measurements and conditions. If that changes the price by more than 5%, Contractor will send a written change order. You may accept it, or cancel this contract and receive a full refund of all payments made.

4. RIGHT TO CANCEL
${rescissionNote}

5. ASSIGNING THE WORK
Contractor will assign a licensed, insured contractor or subcontractor to perform the work and remains fully responsible to you for it. If Contractor cannot assign one at this price within 30 days after signing, either party may cancel and all payments will be refunded in full.

6. DATES
Work is expected to begin within about 2-4 weeks after the cancellation period ends and a crew is assigned, and to be substantially completed about ${days} working days after it begins, plus material lead times. Contingencies that may materially change these dates: permits and inspections, material availability, weather, hidden conditions, building or board approvals, and your decisions. Time is not of the essence unless both parties agree in writing.

7. HIDDEN CONDITIONS
Hidden conditions (rot, mold, asbestos, wiring or plumbing defects, structural issues) are not included and will be handled by change order.

8. WARRANTY
[Insert Contractor workmanship warranty, e.g. 1 year. Manufacturer warranties pass through.]

9. HOW YOUR MONEY IS HELD
[Attorney: insert the NY General Business Law 771 / Lien Law 71-a notice describing the trust account or bond that secures payments received before completion, and the NJ equivalent.]

10. MECHANIC'S LIEN NOTICE
[Attorney: insert the exact bold-face statutory notice.] In substance: a contractor, subcontractor or material supplier who performs work or supplies goods under this contract and is not paid may have a claim against your property. Contractor will pay its subcontractors and suppliers from payments received and will provide lien waivers with each payment.

11. INSURANCE AND LICENSE
Contractor carries general liability and workers' compensation insurance as required by law. Contractor's license/registration is shown above.

12. RECORDING
Customer was told in advance that any site visit may be audio-recorded to capture measurements and preferences, and consented before recording started.

13. GENERAL
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
  const note = 'You may cancel this contract, without penalty or obligation, within three (3) business days of signing by sending written notice to the Contractor. Your payments will be refunded within 10 days of cancellation. A separate Notice of Cancellation form is provided with this contract. [Confirm wording and any longer period required in your state.]';
  return { ends, note };
}

module.exports = { contractText, rescission, addBusinessDays };
