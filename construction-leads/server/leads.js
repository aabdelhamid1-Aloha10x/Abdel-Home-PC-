'use strict';
const cfg = require('./config');
const { get, all, run, event, j } = require('./db');
const { normPhone, tzParts, zonedToUtc } = require('./util');
const notify = require('./notify');

// ---- lead intake -----------------------------------------------------------
function createLead(d, source) {
  const phone = normPhone(d.phone);
  const email = String(d.email || '').trim().toLowerCase();
  // Same person submitting twice (or from two ad platforms) = one lead, not two phone calls.
  const dup = phone && get("SELECT * FROM leads WHERE phone=? AND status IN ('new','booked') AND created_at > datetime('now','-30 days')", phone);
  if (dup) {
    run('UPDATE leads SET details = COALESCE(details,\'\') || ?, email = COALESCE(NULLIF(email,\'\'), ?) WHERE id=?',
      d.details ? `\n[${source}] ${d.details}` : '', email, dup.id);
    event(dup.id, 'duplicate_submission', { source });
    return { lead: get('SELECT * FROM leads WHERE id=?', dup.id), duplicate: true };
  }
  const consent = d.consent ? 1 : 0;
  const info = run(
    `INSERT INTO leads (name, phone, email, zip, address, service, property_type, timeline, details, source, external_id, utm, consent_contact, consent_text, consent_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    d.name || '', phone, email, d.zip || '', d.address || '', d.service || '', d.propertyType || d.property_type || '', d.timeline || '', d.details || '',
    source, d.externalId || null, j(d.utm || {}), consent, d.consentText || null, consent ? new Date().toISOString() : null);
  const id = Number(info.lastInsertRowid);
  event(id, 'lead_created', { source, service: d.service, consent: !!consent });
  const lead = get('SELECT * FROM leads WHERE id=?', id);
  afterCreate(lead).catch(() => {});
  return { lead, duplicate: false };
}

async function afterCreate(lead) {
  const link = `${cfg.publicUrl}/book.html?lead=${lead.id}&k=${leadKey(lead)}`;
  await notify.toLead(lead.id, {
    sms: `Hi ${firstName(lead)}, thanks for requesting a free estimate from ${cfg.company.name}. Pick a time here: ${link} Reply STOP to opt out.`,
    email: `Hi ${firstName(lead)},\n\nThanks for requesting a free estimate (${lead.service || 'your project'}). Pick a time that works for you:\n${link}\n\n${cfg.company.name} ${cfg.company.phone}`,
    subject: 'Book your free estimate',
  });
}

const firstName = (l) => String(l.name || 'there').split(' ')[0];
// Lightweight capability token so the public booking page can only touch its own lead.
const leadKey = (l) => require('./util').sha256(`${l.id}:${l.created_at}:${cfg.adminToken}`).slice(0, 16);

// ---- availability & booking ------------------------------------------------
function slotsForDay(y, m, d) {
  const b = cfg.booking, out = [];
  const step = b.slotMinutes;
  for (let mins = b.openHour * 60; mins + step <= b.closeHour * 60; mins += step) {
    const start = zonedToUtc(y, m, d, Math.floor(mins / 60), mins % 60, cfg.company.tz);
    out.push({ start, end: new Date(start.getTime() + step * 60000) });
  }
  return out;
}

function availability(fromDate = new Date()) {
  const b = cfg.booking;
  const techs = all("SELECT id FROM staff WHERE role='tech' AND active=1");
  if (!techs.length) return [];
  const earliest = Date.now() + b.minLeadHours * 3600000;
  const booked = all("SELECT staff_id, starts_at, ends_at FROM appointments WHERE status='scheduled' AND ends_at > ?", new Date().toISOString());
  const days = [];
  for (let i = 0; i < b.horizonDays; i++) {
    const t = new Date(fromDate.getTime() + i * 86400000);
    const p = tzParts(t, cfg.company.tz);
    if (!b.days.includes(p.wd)) continue;
    const slots = [];
    for (const s of slotsForDay(p.y, p.m, p.d)) {
      if (s.start.getTime() < earliest) continue;
      const free = techs.filter((tc) => !booked.some((a) => a.staff_id === tc.id && a.starts_at < s.end.toISOString() && a.ends_at > s.start.toISOString()));
      if (free.length) slots.push({ start: s.start.toISOString(), end: s.end.toISOString(), techs: free.map((f) => f.id) });
    }
    if (slots.length) days.push({ date: `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`, slots });
  }
  return days;
}

function bookAppointment(leadId, startIso) {
  const lead = get('SELECT * FROM leads WHERE id=?', leadId);
  if (!lead) throw httpErr(404, 'lead not found');
  const slot = availability().flatMap((d) => d.slots).find((s) => s.start === new Date(startIso).toISOString());
  if (!slot) throw httpErr(409, 'That time is no longer available.');
  // Least-loaded tech among the free ones keeps the schedule balanced.
  const load = (id) => get("SELECT COUNT(*) c FROM appointments WHERE staff_id=? AND status='scheduled'", id).c;
  const techId = slot.techs.slice().sort((a, b) => load(a) - load(b))[0];
  // A lead has one live appointment: rebooking cancels the previous one.
  run("UPDATE appointments SET status='cancelled' WHERE lead_id=? AND status='scheduled'", leadId);
  const id = Number(run('INSERT INTO appointments (lead_id, staff_id, starts_at, ends_at, recording_notice_sent) VALUES (?,?,?,?,1)', leadId, techId, slot.start, slot.end).lastInsertRowid);
  if (lead.status === 'new') run("UPDATE leads SET status='booked' WHERE id=?", leadId);
  event(leadId, 'appointment_booked', { appointment: id, starts_at: slot.start, staff: techId });
  const when = new Intl.DateTimeFormat('en-US', { timeZone: cfg.company.tz, dateStyle: 'full', timeStyle: 'short' }).format(new Date(slot.start));
  // The recording heads-up goes out with every confirmation, before the visit.
  const notice = 'For accuracy, our estimator records the visit (audio) to capture measurements and your preferences. You can decline at the door and we will take notes by hand instead.';
  notify.toLead(leadId, {
    sms: `Confirmed: free estimate ${when}. ${notice} ${cfg.company.name}. Reply STOP to opt out.`,
    email: `Your free estimate is confirmed for ${when}.\n\n${notice}\n\nNeed to change it? Call ${cfg.company.phone}.`,
    subject: 'Your free estimate is confirmed',
  }).catch(() => {});
  return get('SELECT * FROM appointments WHERE id=?', id);
}

function httpErr(status, message) { const e = new Error(message); e.status = status; return e; }

module.exports = { createLead, availability, bookAppointment, leadKey, httpErr, firstName };
