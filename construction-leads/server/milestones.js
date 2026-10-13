'use strict';
// Phase payments: the mechanism that makes "funded before committed" enforceable.
//
//   The customer contracts with the winning subcontractor, but pays ONLY through the platform, one short phase at a time.
//   The sub is paid by the platform per phase, only after
//     (1) the customer's money for that phase is in (funded) BEFORE the phase starts,
//     (2) the sub submitted proof of completion + a signed lien waiver,
//     (3) the customer approved (or stayed silent for AUTO_APPROVE_HOURS) and did not dispute.
//   Phase 1 is paid at contract signing (it is the deposit). The platform's fee is withheld from each payout.
const cfg = require('./config');
const { db, get, all, run, event, j } = require('./db');
const { r2 } = require('./settlement');
const { httpErr } = require('./leads');
const notify = require('./notify');

// Pure: money for every phase, cents-exact. weights come from the quote's phase plan.
function buildSchedule({ phases, award, feePct, customerFeePct = 0 }) {
  if (!phases?.length) throw new RangeError('no phases');
  const totalFee = r2(award * feePct / 100), customerTotal = r2(award * (1 + customerFeePct / 100));
  let g = 0, f = 0, c = 0;
  return phases.map((p, i) => {
    const last = i === phases.length - 1;
    const gross = last ? r2(award - g) : r2(award * p.weight);
    const fee = last ? r2(totalFee - f) : r2(gross * feePct / 100);
    const cust = last ? r2(customerTotal - c) : r2(gross * (1 + customerFeePct / 100));
    g = r2(g + gross); f = r2(f + fee); c = r2(c + cust);
    return { seq: p.seq, name: p.name, days: p.days, weight: p.weight, customer_amount: cust, sub_gross: gross, fee_amount: fee, sub_net: r2(gross - fee) };
  });
}

// Pure: at every phase, has the customer paid in at least as much as the sub has been paid out?
function cashSafe(schedule) {
  let funded = 0, paid = 0;
  for (const m of schedule) { funded += m.customer_amount; paid += m.sub_gross; if (paid > funded + 0.005) return false; }
  return true;
}

// ---- persistence ------------------------------------------------------------
function insertSchedule(jobId, rows) {
  if (!cashSafe(rows)) throw httpErr(409, 'Payment schedule would pay the subcontractor before the customer has funded it.');
  for (const m of rows) {
    run(`INSERT INTO milestones (job_id, seq, name, customer_amount, sub_gross, fee_amount, sub_net, status) VALUES (?,?,?,?,?,?,?,?)`,
      jobId, m.seq, m.name, m.customer_amount, m.sub_gross, m.fee_amount, m.sub_net, m.seq === 1 ? 'invoiced' : 'scheduled');
  }
}

function forJob(jobId) { return all('SELECT * FROM milestones WHERE job_id=? ORDER BY seq', jobId).map((m) => ({ ...m, evidence_photos: JSON.parse(m.evidence_photos || '[]') })); }

const mget = (id) => get('SELECT * FROM milestones WHERE id=?', id);
const jobOf = (m) => get('SELECT * FROM jobs WHERE id=?', m.job_id);
function linkFor(job) { return `${cfg.publicUrl}/quote.html?t=${get('SELECT token FROM quotes WHERE id=?', job.quote_id).token}`; }

function invoice(m) {
  if (m.status !== 'scheduled') return;
  run("UPDATE milestones SET status='invoiced', invoiced_at=datetime('now') WHERE id=?", m.id);
  const job = jobOf(m), link = linkFor(job);
  event(job.lead_id, 'milestone_invoiced', { milestone: m.id, amount: m.customer_amount });
  notify.toLead(job.lead_id, {
    sms: `Next payment for your project: ${m.name}, $${m.customer_amount.toFixed(2)}. Pay securely here: ${link}`,
    email: `Your next project payment is ready: ${m.name}, $${m.customer_amount.toFixed(2)}.\nPay or review progress: ${link}\n\nPlease pay only through this link. Never pay crew members directly.`, subject: 'Next project payment',
  }).catch(() => {});
}

// Funding confirmed (card success, or ACH settled). Idempotent.
function markFunded(id, via) {
  const m = mget(id);
  if (!m || m.funded_at) return m;
  run("UPDATE milestones SET funded_at=datetime('now'), funded_via=?, status=CASE WHEN status IN ('scheduled','invoiced') THEN 'funded' ELSE status END WHERE id=?", via, id);
  event(jobOf(m).lead_id, 'milestone_funded', { milestone: id, amount: m.customer_amount, via });
  return mget(id);
}

// ---- subcontractor actions ------------------------------------------------------
function ownedMilestone(subId, id) {
  const m = mget(id); if (!m) throw httpErr(404, 'not found');
  const post = get("SELECT * FROM job_posts WHERE job_id=? AND awarded_to=?", m.job_id, subId);
  if (!post) throw httpErr(404, 'not found');
  return { m, post, job: jobOf(m) };
}

function startPhase(subId, id, geo) {
  const { m, job } = ownedMilestone(subId, id);
  if (!m.funded_at) throw httpErr(409, 'The customer has not funded this phase yet. Do not start work.');
  if (m.status !== 'funded') throw httpErr(409, `Phase is ${m.status}.`);
  const c = get('SELECT * FROM contracts WHERE quote_id=?', job.quote_id);
  if (c.deposit_status !== 'paid' || new Date(c.rescission_ends) > new Date()) throw httpErr(409, 'The customer cancellation period is still open.');
  const prev = m.seq > 1 && get('SELECT * FROM milestones WHERE job_id=? AND seq=?', m.job_id, m.seq - 1);
  if (prev && !['approved', 'released'].includes(prev.status)) throw httpErr(409, 'The previous phase has not been approved yet.');
  run("UPDATE milestones SET status='in_progress', started_at=datetime('now'), start_geo=? WHERE id=?", geo ? j(geo) : null, id);
  run("UPDATE jobs SET status='in_progress' WHERE id=? AND status IN ('ready','scheduled')", m.job_id);
  event(job.lead_id, 'phase_started', { milestone: id, geo: !!geo });
}

function submitPhase(subId, id, { notes, waiver }) {
  const { m, job } = ownedMilestone(subId, id);
  if (m.status !== 'in_progress') throw httpErr(409, 'Start the phase before submitting it.');
  if (JSON.parse(m.evidence_photos || '[]').length < 1) throw httpErr(400, 'Upload at least one photo of the completed work.');
  if (waiver !== true) throw httpErr(400, 'You must sign the lien waiver for this payment.');
  run("UPDATE milestones SET status='submitted', submitted_at=datetime('now'), evidence_notes=?, waiver_signed_at=datetime('now') WHERE id=?", String(notes || '').slice(0, 2000), id);
  const next = get('SELECT * FROM milestones WHERE job_id=? AND seq=?', m.job_id, m.seq + 1);
  if (next) invoice(next);
  event(job.lead_id, 'phase_submitted', { milestone: id });
  notify.toLead(job.lead_id, {
    sms: `Work on "${m.name}" is complete. Please review and approve: ${linkFor(job)}`,
    email: `The crew marked "${m.name}" complete.\nReview the photos and approve (or report a problem) here: ${linkFor(job)}\nIf we do not hear from you in ${cfg.marketplace.autoApproveHours} hours the phase is treated as approved.`, subject: 'Please review completed work',
  }).catch(() => {});
}

// Validates ownership/state, lets the caller write the file under the generated name, then records it.
function addPhoto(subId, id, write) {
  const { m } = ownedMilestone(subId, id);
  if (m.status !== 'in_progress') throw httpErr(409, 'Photos can only be added while the phase is in progress.');
  const photos = JSON.parse(m.evidence_photos || '[]');
  if (photos.length >= 20) throw httpErr(400, 'Photo limit reached.');
  const name = `phase-${id}-${photos.length + 1}.jpg`;
  write(name);
  photos.push(name);
  run('UPDATE milestones SET evidence_photos=? WHERE id=?', j(photos), id);
  return photos.length;
}

// ---- customer / admin actions --------------------------------------------------
function approve(id, by) {
  const m = mget(id);
  if (!m || m.status !== 'submitted') throw httpErr(409, 'Nothing to approve.');
  run("UPDATE milestones SET status='approved', approved_at=datetime('now'), approved_by=? WHERE id=?", by, id);
  event(jobOf(m).lead_id, 'phase_approved', { milestone: id, by });
  return release(id);
}

function dispute(id, reason) {
  const m = mget(id);
  if (!m || !['submitted', 'approved'].includes(m.status)) throw httpErr(409, 'This phase cannot be disputed now.');
  if (m.released_at) throw httpErr(409, 'Already paid out.');
  run("UPDATE milestones SET status='disputed', disputed_from=?, dispute_reason=? WHERE id=?", m.status, String(reason || '').slice(0, 2000), id);
  event(jobOf(m).lead_id, 'phase_disputed', { milestone: id });
}

function resolveDispute(id, action) {
  const m = mget(id);
  if (!m || m.status !== 'disputed') throw httpErr(409, 'Not in dispute.');
  if (action === 'rework') { run("UPDATE milestones SET status='in_progress', dispute_reason=NULL, submitted_at=NULL, waiver_signed_at=NULL WHERE id=?", id); return null; }
  if (action === 'release') { run("UPDATE milestones SET status='approved', approved_at=datetime('now'), approved_by='admin' WHERE id=?", id); return release(id); }
  throw httpErr(400, 'action must be rework or release');
}

// The only place a sub payout is created. Every precondition is re-checked here.
function release(id) {
  const m = mget(id);
  if (!m || m.status !== 'approved') return null;
  if (m.released_at) return m;
  const post = get("SELECT * FROM job_posts WHERE job_id=? AND status='awarded'", m.job_id);
  if (!post) throw httpErr(409, 'No awarded subcontractor on this job.');
  if (!m.funded_at) throw httpErr(409, 'Customer funds for this phase have not cleared.');
  if (!m.waiver_signed_at) throw httpErr(409, 'Lien waiver missing.');
  const custFee = r2(m.customer_amount - m.sub_gross);
  db.exec('BEGIN IMMEDIATE');
  try {
    run("UPDATE milestones SET status='released', released_at=datetime('now') WHERE id=? AND status='approved'", id);
    run("INSERT INTO ledger (sub_id, job_id, type, amount, status, note) VALUES (?,?, 'sub_payout', ?, 'due', ?)", post.awarded_to, m.job_id, m.sub_net, `Phase ${m.seq}: ${m.name} (gross ${m.sub_gross}, fee ${m.fee_amount} withheld)`);
    if (m.fee_amount > 0) run("INSERT INTO ledger (sub_id, job_id, type, amount, status, note) VALUES (?,?, 'platform_fee', ?, 'settled', ?)", post.awarded_to, m.job_id, m.fee_amount, `${post.fee_pct}% sub fee withheld, phase ${m.seq}`);
    if (custFee > 0) run("INSERT INTO ledger (sub_id, job_id, type, amount, status, note) VALUES (?,?, 'customer_fee', ?, 'settled', ?)", post.awarded_to, m.job_id, custFee, `${post.customer_fee_pct}% customer fee, phase ${m.seq}`);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  event(jobOf(m).lead_id, 'phase_released', { milestone: id, sub_net: m.sub_net, fee: m.fee_amount });
  if (!get("SELECT 1 FROM milestones WHERE job_id=? AND status<>'released'", m.job_id)) run("UPDATE jobs SET status='complete' WHERE id=?", m.job_id);
  return mget(id);
}

// Silence is approval after AUTO_APPROVE_HOURS (stated in the contract). Disputed phases never auto-approve.
function autoApproveTick() {
  const due = all(`SELECT id FROM milestones WHERE status='submitted' AND submitted_at <= datetime('now', ?)`, `-${cfg.marketplace.autoApproveHours} hours`);
  for (const d of due) { try { approve(d.id, 'auto'); } catch (e) { event(null, 'auto_approve_error', { milestone: d.id, message: e.message }); } }
}

module.exports = { buildSchedule, cashSafe, insertSchedule, forJob, invoice, markFunded, startPhase, submitPhase, addPhoto, approve, dispute, resolveDispute, release, autoApproveTick, mget };
