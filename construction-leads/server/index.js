'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cfg = require('./config');
const { db, get, all, run, event, j } = require('./db');
const { priceQuote, DEFAULTS } = require('./quote-engine');
const { planPhases } = require('./phases');
const { token, safeEq, normPhone, sha256, esc, inServiceArea } = require('./util');
const L = require('./leads');
const I = require('./integrations');
const { contractText, rescission } = require('./contract');
const notify = require('./notify');
const { seed } = require('./seed');
const M = require('./marketplace');
const MS = require('./milestones');

const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const parse = (s, d = null) => { try { return s == null ? d : JSON.parse(s); } catch { return d; } };

// ---- tiny router -----------------------------------------------------------
const routes = [];
const route = (method, pattern, auth, handler) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), auth, handler });

function readBody(req, limit = 1_000_000, raw = false) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', (c) => { n += c.length; if (n > limit) { reject(Object.assign(new Error('payload too large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      if (raw) return resolve(buf);
      if (!buf.length) return resolve({});
      try { resolve(JSON.parse(buf.toString('utf8'))); } catch { reject(Object.assign(new Error('invalid JSON'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

const send = (res, status, body, headers = {}) => {
  const isStr = typeof body === 'string';
  res.writeHead(status, { 'Content-Type': isStr ? 'text/plain; charset=utf-8' : 'application/json', 'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(isStr ? body : JSON.stringify(body));
};

const isAdmin = (req) => safeEq(req.headers['x-admin-token'] || '', cfg.adminToken);
const staffFrom = (req) => { const t = req.headers['x-staff-token']; return t ? get('SELECT * FROM staff WHERE token=? AND active=1', t) : null; };

// ===========================================================================
// PUBLIC: lead capture (website form), booking
// ===========================================================================
const rate = new Map();
function limited(ip, max = 20, windowMs = 60_000) {
  if (process.env.NO_RATE_LIMIT === '1') return false; // test suite only
  const now = Date.now(); const a = (rate.get(ip) || []).filter((t) => now - t < windowMs);
  a.push(now); rate.set(ip, a); return a.length > max;
}

route('POST', '/api/leads', 'public', async (req, res, { body, ip }) => {
  if (limited(ip, 10)) return send(res, 429, { error: 'Too many requests' });
  if (body.website) return send(res, 200, { ok: true }); // honeypot: pretend success
  if (!body.name || !normPhone(body.phone)) return send(res, 400, { error: 'name and phone are required' });
  const { lead, duplicate, outOfArea } = L.createLead({ ...body, consent: body.consent === true }, 'website');
  send(res, 201, { ok: true, leadId: lead.id, key: L.leadKey(lead), duplicate, outOfArea: !!outOfArea });
});

route('GET', '/api/availability', 'public', (req, res) => send(res, 200, { timezone: cfg.company.tz, days: L.availability().map((d) => ({ date: d.date, slots: d.slots.map((s) => s.start) })) }));

route('POST', '/api/book', 'public', (req, res, { body, ip }) => {
  if (limited(ip, 10)) return send(res, 429, { error: 'Too many requests' });
  const lead = get('SELECT * FROM leads WHERE id=?', Number(body.leadId));
  if (!lead || !safeEq(body.key || '', L.leadKey(lead))) return send(res, 403, { error: 'Invalid booking link' });
  if (lead.status === 'out_of_area') return send(res, 409, { error: 'We do not serve your area yet.' });
  if (body.address) run('UPDATE leads SET address=? WHERE id=?', String(body.address).slice(0, 200), lead.id);
  const a = L.bookAppointment(lead.id, body.start);
  send(res, 201, { ok: true, appointment: { id: a.id, starts_at: a.starts_at } });
});

route('GET', '/api/public-config', 'public', (req, res) => send(res, 200, { company: { name: cfg.company.name, phone: cfg.company.phone, license: cfg.company.license, state: cfg.company.state }, timezone: cfg.company.tz }));

// ===========================================================================
// AD PLATFORMS: Meta Lead Ads, Google Ads lead form extensions
// ===========================================================================
route('GET', '/webhooks/meta', 'public', (req, res, { url }) => {
  const ok = cfg.meta.verifyToken && url.searchParams.get('hub.mode') === 'subscribe' && safeEq(url.searchParams.get('hub.verify_token') || '', cfg.meta.verifyToken);
  ok ? send(res, 200, url.searchParams.get('hub.challenge') || '') : send(res, 403, 'forbidden');
});

route('POST', '/webhooks/meta', 'public', async (req, res, { raw }) => {
  if (cfg.meta.appSecret) {
    const sig = String(req.headers['x-hub-signature-256'] || '');
    const want = 'sha256=' + crypto.createHmac('sha256', cfg.meta.appSecret).update(raw).digest('hex');
    if (!safeEq(sig, want)) return send(res, 401, 'bad signature');
  }
  send(res, 200, 'ok'); // ack fast; Meta retries on slow responses
  let payload; try { payload = JSON.parse(raw.toString('utf8')); } catch { return; }
  for (const entry of payload.entry || []) for (const ch of entry.changes || []) {
    if (ch.field !== 'leadgen' || !ch.value?.leadgen_id) continue;
    const id = String(ch.value.leadgen_id);
    try {
      if (!cfg.meta.pageToken) { event(null, 'meta_lead_unfetched', { leadgen_id: id, reason: 'META_PAGE_TOKEN not set' }); continue; }
      const r = await fetch(`https://graph.facebook.com/v21.0/${id}?access_token=${encodeURIComponent(cfg.meta.pageToken)}`);
      const lead = await r.json();
      if (!r.ok) throw new Error(lead.error?.message || r.status);
      const f = {}; for (const x of lead.field_data || []) f[x.name] = (x.values || [])[0];
      L.createLead({
        name: f.full_name || [f.first_name, f.last_name].filter(Boolean).join(' '), phone: f.phone_number || f.phone, email: f.email,
        zip: f.zip_code || f.post_code, service: f.what_service_do_you_need || f.service || '', details: f.project_details || '',
        externalId: id, utm: { utm_source: 'meta', campaign: lead.campaign_name, ad: lead.ad_name, form: lead.form_id },
        consent: false, // platform form disclosures are not our automated-call consent
      }, 'meta');
    } catch (err) { event(null, 'meta_lead_error', { leadgen_id: id, message: err.message }); }
  }
});

route('POST', '/webhooks/google-leads', 'public', (req, res, { body }) => {
  if (!cfg.google.leadKey || !safeEq(body.google_key || '', cfg.google.leadKey)) return send(res, 401, { error: 'bad key' });
  const f = {}; for (const c of body.user_column_data || []) f[c.column_id] = c.string_value;
  L.createLead({
    name: f.FULL_NAME || [f.FIRST_NAME, f.LAST_NAME].filter(Boolean).join(' '), phone: f.PHONE_NUMBER, email: f.EMAIL, zip: f.POSTAL_CODE,
    service: f.SERVICE_TYPE || f.JOB_TYPE || '', externalId: body.lead_id, consent: false,
    utm: { utm_source: 'google', campaign_id: body.campaign_id, gclid: body.gcl_id, form_id: body.form_id },
  }, 'google');
  send(res, 200, { ok: true });
});

// ===========================================================================
// VOICE AGENT: tools the ElevenLabs agent calls + post-call webhook
// ===========================================================================
const voiceAuth = (req) => cfg.voice.toolSecret && safeEq(req.headers['x-tool-secret'] || '', cfg.voice.toolSecret);
route('GET', '/api/voice/availability', 'voice', (req, res) => send(res, 200, { slots: L.availability().flatMap((d) => d.slots.map((s) => s.start)).slice(0, 12) }));
route('POST', '/api/voice/book', 'voice', (req, res, { body }) => {
  if (body.address) run('UPDATE leads SET address=? WHERE id=?', String(body.address).slice(0, 200), Number(body.lead_id));
  if (body.email) run("UPDATE leads SET email=? WHERE id=? AND (email IS NULL OR email='')", String(body.email).toLowerCase(), Number(body.lead_id));
  const a = L.bookAppointment(Number(body.lead_id), body.start);
  send(res, 201, { ok: true, appointment_id: a.id, starts_at: a.starts_at });
});
route('POST', '/api/voice/update-lead', 'voice', (req, res, { body }) => {
  const id = Number(body.lead_id);
  const notes = ['scope', 'ownership', 'timeline', 'budget', 'other_quotes'].filter((k) => body[k]).map((k) => `${k}: ${body[k]}`).join('; ');
  if (notes) run("UPDATE leads SET details = COALESCE(details,'') || ? WHERE id=?", `\n[voice] ${notes}`, id);
  event(id, 'voice_lead_updated', body);
  send(res, 200, { ok: true });
});
route('POST', '/api/voice/outcome', 'voice', (req, res, { body }) => {
  const id = Number(body.lead_id);
  if (body.outcome === 'do_not_call') { run("UPDATE leads SET do_not_contact=1, status='dnc' WHERE id=?", id); }
  run("UPDATE calls SET outcome=? WHERE id=(SELECT id FROM calls WHERE lead_id=? ORDER BY id DESC LIMIT 1)", String(body.outcome || ''), id);
  event(id, 'voice_outcome', body);
  send(res, 200, { ok: true });
});

// ===========================================================================
// TECHNICIAN: site visit with consent, measurements, recording
// ===========================================================================
route('GET', '/api/tech/appointments', 'staff', (req, res, { staff }) => {
  const rows = all(`SELECT a.*, l.name, l.phone, l.address, l.zip, l.service, l.property_type, l.details,
                    (SELECT id FROM visits v WHERE v.appointment_id=a.id) visit_id
                    FROM appointments a JOIN leads l ON l.id=a.lead_id
                    WHERE a.staff_id=? AND a.status='scheduled' ORDER BY a.starts_at`, staff.id);
  send(res, 200, rows);
});

route('POST', '/api/tech/visits', 'staff', (req, res, { staff, body }) => {
  const a = get('SELECT * FROM appointments WHERE id=? AND staff_id=?', Number(body.appointmentId), staff.id);
  if (!a) return send(res, 404, { error: 'appointment not found' });
  const existing = get('SELECT * FROM visits WHERE appointment_id=?', a.id);
  if (existing) return send(res, 200, existing);
  const id = Number(run('INSERT INTO visits (lead_id, appointment_id, staff_id) VALUES (?,?,?)', a.lead_id, a.id, staff.id).lastInsertRowid);
  event(a.lead_id, 'visit_started', { visit: id, staff: staff.id });
  send(res, 201, get('SELECT * FROM visits WHERE id=?', id));
});

const ownVisit = (id, staff) => get('SELECT * FROM visits WHERE id=? AND staff_id=?', Number(id), staff.id);

// Consent must be captured BEFORE any audio is accepted. This is enforced server-side.
route('POST', '/api/tech/visits/:id/consent', 'staff', (req, res, { staff, body, params }) => {
  const v = ownVisit(params.id, staff); if (!v) return send(res, 404, { error: 'not found' });
  const granted = body.granted === true;
  run('UPDATE visits SET recording_consent=?, consent_at=datetime(\'now\'), consent_by=? WHERE id=?', granted ? 1 : 0, String(body.by || 'customer verbal consent').slice(0, 200), v.id);
  event(v.lead_id, granted ? 'recording_consent_granted' : 'recording_consent_declined', { visit: v.id });
  send(res, 200, { ok: true, granted });
});

route('PUT', '/api/tech/visits/:id/audio', 'staff', async (req, res, { staff, params }) => {
  const v = ownVisit(params.id, staff); if (!v) return send(res, 404, { error: 'not found' });
  if (!v.recording_consent) return send(res, 403, { error: 'Recording consent has not been granted for this visit.' });
  const buf = await readBody(req, 200_000_000, true);
  const ext = String(req.headers['content-type'] || '').includes('mp4') ? 'm4a' : 'webm';
  const file = path.join(cfg.dataDir, 'recordings', `visit-${v.id}.${ext}`);
  fs.writeFileSync(file, buf);
  run('UPDATE visits SET audio_path=? WHERE id=?', file, v.id);
  send(res, 200, { ok: true, bytes: buf.length });
});

route('POST', '/api/tech/visits/:id/photo', 'staff', async (req, res, { staff, params }) => {
  const v = ownVisit(params.id, staff); if (!v) return send(res, 404, { error: 'not found' });
  const buf = await readBody(req, 15_000_000, true);
  const photos = parse(v.photos, []);
  const name = `visit-${v.id}-${photos.length + 1}.jpg`;
  fs.writeFileSync(path.join(cfg.dataDir, 'photos', name), buf);
  photos.push(name);
  run('UPDATE visits SET photos=? WHERE id=?', j(photos), v.id);
  send(res, 200, { ok: true, name });
});

// Submit: save measurements/preferences, transcribe the audio, extract a draft scope.
route('POST', '/api/tech/visits/:id/submit', 'staff', async (req, res, { staff, body, params }) => {
  const v = ownVisit(params.id, staff); if (!v) return send(res, 404, { error: 'not found' });
  const rooms = (body.rooms || []).map((r) => ({
    name: String(r.name || '').slice(0, 80), length: Number(r.length) || 0, width: Number(r.width) || 0, height: Number(r.height) || 0,
    notes: String(r.notes || '').slice(0, 1000),
  }));
  run("UPDATE visits SET rooms=?, preferences=?, status='submitted' WHERE id=?", j(rooms), String(body.preferences || '').slice(0, 10000), v.id);
  run("UPDATE appointments SET status='done' WHERE id=?", v.appointment_id);
  run("UPDATE leads SET status='visited' WHERE id=? AND status IN ('new','booked')", v.lead_id);
  event(v.lead_id, 'visit_submitted', { visit: v.id, rooms: rooms.length });
  send(res, 200, { ok: true });
  processVisit(v.id).catch((e) => event(v.lead_id, 'visit_processing_error', { message: e.message }));
});

async function processVisit(id) {
  const v = get('SELECT * FROM visits WHERE id=?', id);
  const lead = get('SELECT * FROM leads WHERE id=?', v.lead_id);
  let transcript = v.transcript;
  if (v.audio_path && !transcript) {
    transcript = await I.transcribe(v.audio_path).catch((e) => { event(lead.id, 'transcription_error', { message: e.message }); return null; });
    if (transcript) run('UPDATE visits SET transcript=? WHERE id=?', transcript, id);
  }
  const scope = await I.extractScope({ lead, transcript, rooms: parse(v.rooms, []), preferences: v.preferences })
    .catch((e) => { event(lead.id, 'extraction_error', { message: e.message }); return null; });
  if (scope) run('UPDATE visits SET scope=? WHERE id=?', j(scope), id);
  event(lead.id, 'visit_processed', { transcript: !!transcript, scope: !!scope });
}

// ===========================================================================
// ADMIN: pipeline, catalog, quotes, subs, jobs
// ===========================================================================
route('GET', '/api/admin/pipeline', 'admin', (req, res) => {
  const leads = all(`SELECT l.*, (SELECT starts_at FROM appointments a WHERE a.lead_id=l.id AND a.status='scheduled' ORDER BY starts_at LIMIT 1) appt,
      (SELECT result FROM quotes q WHERE q.lead_id=l.id ORDER BY q.id DESC LIMIT 1) qresult,
      (SELECT status FROM quotes q WHERE q.lead_id=l.id ORDER BY q.id DESC LIMIT 1) qstatus
      FROM leads l ORDER BY l.id DESC LIMIT 500`).map((l) => ({ ...l, utm: parse(l.utm, {}), quote_total: parse(l.qresult)?.totals?.total ?? null, qresult: undefined }));
  const stats = {
    leads: leads.length, booked: leads.filter((l) => l.appt).length,
    quoted: leads.filter((l) => l.qstatus).length, won: leads.filter((l) => l.status === 'won').length,
    won_value: leads.filter((l) => l.status === 'won').reduce((a, l) => a + (l.quote_total || 0), 0),
  };
  const bySource = all("SELECT source, COUNT(*) leads, SUM(status='won') won FROM leads GROUP BY source");
  send(res, 200, { leads, stats, bySource });
});

route('GET', '/api/admin/leads/:id', 'admin', (req, res, { params }) => {
  const lead = get('SELECT * FROM leads WHERE id=?', Number(params.id)); if (!lead) return send(res, 404, { error: 'not found' });
  const visits = all('SELECT * FROM visits WHERE lead_id=? ORDER BY id DESC', lead.id).map((v) => ({ ...v, rooms: parse(v.rooms, []), photos: parse(v.photos, []), scope: parse(v.scope), audio_path: undefined, has_audio: !!v.audio_path }));
  const quotes = all('SELECT id, token, status, title, created_at, sent_at, approved_at, result FROM quotes WHERE lead_id=? ORDER BY id DESC', lead.id).map((q) => ({ ...q, total: parse(q.result)?.totals?.total, result: undefined }));
  send(res, 200, {
    lead: { ...lead, utm: parse(lead.utm, {}) }, visits, quotes,
    appointments: all('SELECT a.*, s.name tech FROM appointments a LEFT JOIN staff s ON s.id=a.staff_id WHERE a.lead_id=? ORDER BY a.starts_at DESC', lead.id),
    events: all('SELECT * FROM events WHERE lead_id=? ORDER BY id DESC LIMIT 100', lead.id).map((e) => ({ ...e, data: parse(e.data) })),
    calls: all('SELECT * FROM calls WHERE lead_id=? ORDER BY id DESC', lead.id),
  });
});

route('POST', '/api/admin/leads', 'admin', (req, res, { body }) => {
  const { lead } = L.createLead({ ...body, consent: !!body.consent }, body.source || 'manual');
  send(res, 201, lead);
});
route('PATCH', '/api/admin/leads/:id', 'admin', (req, res, { body, params }) => {
  const allowed = ['status', 'name', 'email', 'address', 'service', 'details', 'do_not_contact'];
  for (const k of allowed) if (k in body) run(`UPDATE leads SET ${k}=? WHERE id=?`, body[k], Number(params.id));
  event(Number(params.id), 'lead_updated', body);
  send(res, 200, get('SELECT * FROM leads WHERE id=?', Number(params.id)));
});

// Staff & catalog
route('GET', '/api/admin/staff', 'admin', (req, res) => send(res, 200, all('SELECT * FROM staff ORDER BY id')));
route('POST', '/api/admin/staff', 'admin', (req, res, { body }) => {
  const id = Number(run('INSERT INTO staff (name, phone, role, token) VALUES (?,?,?,?)', body.name, body.phone || '', body.role || 'tech', token(16)).lastInsertRowid);
  send(res, 201, get('SELECT * FROM staff WHERE id=?', id));
});
route('GET', '/api/admin/catalog', 'admin', (req, res) => send(res, 200, all('SELECT * FROM catalog WHERE active=1 ORDER BY category, name')));
route('POST', '/api/admin/catalog', 'admin', (req, res, { body }) => {
  const id = Number(run('INSERT INTO catalog (category, name, unit, material_unit_cost, labor_hours_per_unit, waste_pct) VALUES (?,?,?,?,?,?)', body.category, body.name, body.unit, +body.material_unit_cost || 0, +body.labor_hours_per_unit || 0, +body.waste_pct || 0).lastInsertRowid);
  send(res, 201, get('SELECT * FROM catalog WHERE id=?', id));
});
route('PUT', '/api/admin/catalog/:id', 'admin', (req, res, { body, params }) => {
  run('UPDATE catalog SET category=?, name=?, unit=?, material_unit_cost=?, labor_hours_per_unit=?, waste_pct=? WHERE id=?', body.category, body.name, body.unit, +body.material_unit_cost || 0, +body.labor_hours_per_unit || 0, +body.waste_pct || 0, Number(params.id));
  send(res, 200, get('SELECT * FROM catalog WHERE id=?', Number(params.id)));
});
route('DELETE', '/api/admin/catalog/:id', 'admin', (req, res, { params }) => { run('UPDATE catalog SET active=0 WHERE id=?', Number(params.id)); send(res, 200, { ok: true }); });

// Quotes
const quoteSettings = (s) => ({ ...DEFAULTS, ...(s || {}) });
// Every quote carries a phase plan: short phases keep cash flowing (customer funds each one before it starts).
const phasePlan = (result, opts) => { try { return planPhases(result.lines, opts || {}); } catch { return null; } };
route('GET', '/api/admin/defaults', 'admin', (req, res) => send(res, 200, { ...DEFAULTS, tax_pct: 0 }));
route('POST', '/api/admin/quotes/preview', 'admin', (req, res, { body }) => {
  try { const r = priceQuote(body.items, quoteSettings(body.settings), { state: cfg.company.state }); send(res, 200, { ...r, phase_plan: phasePlan(r, body.phase_options) }); } catch (e) { send(res, 400, { error: e.message }); }
});
route('POST', '/api/admin/quotes', 'admin', (req, res, { body }) => {
  const lead = get('SELECT * FROM leads WHERE id=?', Number(body.leadId)); if (!lead) return send(res, 404, { error: 'lead not found' });
  let result; try { result = priceQuote(body.items, quoteSettings(body.settings), { state: cfg.company.state }); } catch (e) { return send(res, 400, { error: e.message }); }
  const plan = phasePlan(result, body.phase_options);
  if (!plan) return send(res, 400, { error: 'Add at least one line item to build the phase plan.' });
  const id = Number(run('INSERT INTO quotes (lead_id, visit_id, token, title, scope_summary, settings, items, result, phases) VALUES (?,?,?,?,?,?,?,?,?)',
    lead.id, body.visitId || null, token(16), body.title || lead.service, body.scope_summary || '', j(result.settings), j(body.items || []), j(result), j(plan.phases)).lastInsertRowid);
  event(lead.id, 'quote_created', { quote: id, total: result.totals.total });
  send(res, 201, get('SELECT * FROM quotes WHERE id=?', id));
});
route('GET', '/api/admin/quotes/:id', 'admin', (req, res, { params }) => {
  const q = get('SELECT * FROM quotes WHERE id=?', Number(params.id)); if (!q) return send(res, 404, { error: 'not found' });
  send(res, 200, { ...q, settings: parse(q.settings), items: parse(q.items, []), result: parse(q.result), phase_plan: parse(q.phases), link: `${cfg.publicUrl}/quote.html?t=${q.token}`, contract: get('SELECT id, signer_name, signed_at, deposit_amount, deposit_status, rescission_ends FROM contracts WHERE quote_id=?', q.id) });
});
route('PUT', '/api/admin/quotes/:id', 'admin', (req, res, { body, params }) => {
  const q = get('SELECT * FROM quotes WHERE id=?', Number(params.id)); if (!q) return send(res, 404, { error: 'not found' });
  if (q.status === 'approved') return send(res, 409, { error: 'Approved quotes are locked. Create a new quote or a change order.' });
  let result; try { result = priceQuote(body.items, quoteSettings(body.settings), { state: cfg.company.state }); } catch (e) { return send(res, 400, { error: e.message }); }
  const plan = phasePlan(result, body.phase_options);
  if (!plan) return send(res, 400, { error: 'Add at least one line item to build the phase plan.' });
  run("UPDATE quotes SET title=?, scope_summary=?, settings=?, items=?, result=?, phases=?, status=CASE WHEN status='sent' THEN 'draft' ELSE status END WHERE id=?",
    body.title || q.title, body.scope_summary ?? q.scope_summary, j(result.settings), j(body.items || []), j(result), j(plan.phases), q.id);
  send(res, 200, { ok: true, result, phase_plan: plan.phases });
});
route('POST', '/api/admin/quotes/:id/send', 'admin', async (req, res, { params }) => {
  const q = get('SELECT * FROM quotes WHERE id=?', Number(params.id)); if (!q) return send(res, 404, { error: 'not found' });
  const link = `${cfg.publicUrl}/quote.html?t=${q.token}`;
  run("UPDATE quotes SET status='sent', sent_at=datetime('now'), valid_until=datetime('now','+30 days') WHERE id=?", q.id);
  run("UPDATE leads SET status='quoted' WHERE id=? AND status IN ('new','booked','visited')", q.lead_id);
  event(q.lead_id, 'quote_sent', { quote: q.id, link });
  await notify.toLead(q.lead_id, { sms: `Your project plan from ${cfg.company.name} is ready: ${link}`, email: `Your project plan and budget are ready.\nReview the phases, then approve to open competitive bidding from vetted contractors:\n${link}\n\nValid for 30 days. Questions? ${cfg.company.phone}`, subject: 'Your project plan is ready' });
  send(res, 200, { ok: true, link });
});
route('POST', '/api/admin/quotes/:id/mark-deposit-paid', 'admin', (req, res, { params }) => {
  const c = get('SELECT * FROM contracts WHERE quote_id=?', Number(params.id)); if (!c) return send(res, 404, { error: 'not signed yet' });
  send(res, 200, I.markDepositPaid(c.id, 'manual'));
});

// Subcontractors & jobs
route('POST', '/api/admin/subs', 'admin', (req, res, { body }) => {
  // Admin-created subs are pre-approved (your own existing crews). They have no portal login until they sign up.
  const id = Number(run("INSERT INTO subcontractors (name, trade, phone, email, license, insurance_expires, notes, status) VALUES (?,?,?,?,?,?,?, 'approved')", body.name, body.trade || '', body.phone || '', body.email || '', body.license || '', body.insurance_expires || '', body.notes || '').lastInsertRowid);
  send(res, 201, get('SELECT * FROM subcontractors WHERE id=?', id));
});
route('GET', '/api/admin/jobs', 'admin', (req, res) => send(res, 200, all(`
  SELECT j.*, l.name customer, l.address, q.title, s.name sub_name, c.rescission_ends, c.deposit_status, p.id post_id, p.status post_status, p.payout post_payout, p.flat_fee post_fee,
         json_extract(q.result,'$.totals.total') total, p.payout award
  FROM jobs j JOIN leads l ON l.id=j.lead_id JOIN quotes q ON q.id=j.quote_id LEFT JOIN contracts c ON c.quote_id=q.id
  LEFT JOIN subcontractors s ON s.id=j.subcontractor_id LEFT JOIN job_posts p ON p.job_id=j.id ORDER BY j.id DESC`)));
route('PATCH', '/api/admin/jobs/:id', 'admin', (req, res, { body, params }) => {
  const job = get('SELECT j.*, c.rescission_ends, c.deposit_status FROM jobs j LEFT JOIN contracts c ON c.quote_id=j.quote_id WHERE j.id=?', Number(params.id));
  if (!job) return send(res, 404, { error: 'not found' });
  const advancing = ['scheduled', 'in_progress', 'punch_list', 'complete'].includes(body.status) || body.start_date;
  if (advancing && (!job.deposit_status || job.deposit_status !== 'paid' || new Date(job.rescission_ends) > new Date())) {
    return send(res, 409, { error: 'Cannot schedule or start: deposit unpaid or the customer\'s cancellation period is still open.' });
  }
  if (body.assigned_type === 'subcontractor' && !body.subcontractor_id && !job.subcontractor_id) return send(res, 400, { error: 'pick a subcontractor' });
  const post0 = get('SELECT * FROM job_posts WHERE job_id=?', job.id);
  if (post0?.status === 'awarded' && ('assigned_type' in body || 'subcontractor_id' in body)) return send(res, 409, { error: 'This job was awarded through the board. Close or re-open it from Marketplace.' });
  for (const k of ['assigned_type', 'subcontractor_id', 'sub_cost', 'status', 'start_date', 'notes']) if (k in body) run(`UPDATE jobs SET ${k}=? WHERE id=?`, body[k], job.id);
  if (['in_house', 'subcontractor'].includes(body.assigned_type) && post0?.status === 'open') run("UPDATE job_posts SET status='closed' WHERE id=?", post0.id);
  event(job.lead_id, 'job_updated', body);
  send(res, 200, get('SELECT * FROM jobs WHERE id=?', job.id));
});

route('GET', '/api/admin/outbox', 'admin', (req, res) => send(res, 200, all('SELECT * FROM outbox ORDER BY id DESC LIMIT 100')));
route('GET', '/api/admin/recording/:id', 'admin', (req, res, { params }) => {
  const v = get('SELECT audio_path FROM visits WHERE id=?', Number(params.id));
  if (!v?.audio_path || !fs.existsSync(v.audio_path)) return send(res, 404, { error: 'no recording' });
  res.writeHead(200, { 'Content-Type': v.audio_path.endsWith('m4a') ? 'audio/mp4' : 'audio/webm' });
  fs.createReadStream(v.audio_path).pipe(res);
});
route('GET', '/api/admin/photo/:name', 'admin', (req, res, { params }) => {
  const f = path.join(cfg.dataDir, 'photos', path.basename(params.name));
  if (!fs.existsSync(f)) return send(res, 404, { error: 'not found' });
  res.writeHead(200, { 'Content-Type': 'image/jpeg' }); fs.createReadStream(f).pipe(res);
});

// ===========================================================================
// CUSTOMER: view / approve / sign / pay a quote
// ===========================================================================
const customerQuote = (t) => get('SELECT * FROM quotes WHERE token=?', t);
const publicQuote = (q) => {
  const lead = get('SELECT name, address, zip FROM leads WHERE id=?', q.lead_id);
  const r = parse(q.result), phases = parse(q.phases, []);
  const job = get('SELECT * FROM jobs WHERE quote_id=?', q.id);
  const post = job && get('SELECT * FROM job_posts WHERE job_id=?', job.id);
  const c = get('SELECT * FROM contracts WHERE quote_id=?', q.id);
  const budget = r.totals.total;
  let stage = 'plan';
  if (post) stage = post.status === 'open' ? 'bidding' : post.status === 'no_bids' ? 'no_bids' : post.status === 'awarded' ? 'contract' : c ? 'awaiting_funding' : post.status === 'pending_acceptance' ? 'offer' : 'closed';
  const out = {
    stage, title: q.title, scope_summary: q.scope_summary, status: q.status, valid_until: q.valid_until, customer: lead.name, company: cfg.company,
    // Customers see scope and the phase plan, never internal cost, margin or hours.
    budget, scope: r.lines.map((l) => ({ description: l.description, qty: l.qty, unit: l.unit })),
    phases: phases.map((p) => ({ seq: p.seq, name: p.name, days: p.days, share_pct: Math.round(p.weight * 1000) / 10, est_amount: Math.round(budget * p.weight) })),
    total_days: Math.round(phases.reduce((a, p) => a + p.days, 0) * 10) / 10,
    auction_hours: cfg.marketplace.auctionHours, stripe_enabled: !!cfg.stripe.secretKey,
  };
  if (post && post.status === 'open') { const low = M.lowest(post.id); out.bidding = { closes_at: post.closes_at, bid_count: M.bidsOf(post.id).length, best_bid: low?.amount ?? null, extensions: post.extensions }; }
  if (post && ['pending_acceptance', 'awarded'].includes(post.status) && post.winning_bid_id) {
    const bid = get('SELECT * FROM bids WHERE id=?', post.winning_bid_id), sub = get('SELECT * FROM subcontractors WHERE id=?', bid.sub_id);
    const schedule = MS.buildSchedule({ phases, award: post.payout, feePct: post.fee_pct, customerFeePct: post.customer_fee_pct });
    out.offer = {
      amount: post.payout, days: bid.days, note: bid.note, below_budget_pct: Math.round((1 - post.payout / budget) * 1000) / 10, accept_deadline: post.accept_deadline,
      customer_total: schedule.reduce((a, m) => a + m.customer_amount, 0), platform_fee: Math.round((schedule.reduce((a, m) => a + m.customer_amount, 0) - post.payout) * 100) / 100,
      contractor: { company: sub.name, license: sub.license, license_state: sub.license_state, trades: sub.trade, insurance_expires: sub.insurance_expires },
      schedule: schedule.map((m) => ({ seq: m.seq, name: m.name, days: m.days, amount: m.customer_amount })),
    };
    if (!c) out.contract_preview = contractText({ quote: q, lead: { name: lead.name, address: lead.address, zip: lead.zip, service: q.title }, sub, award: post.payout, schedule, rescissionNote: rescission(new Date()).note });
  }
  if (c) {
    out.contract = { text: c.text, signed_at: c.signed_at, signer_name: c.signer_name, deposit_status: c.deposit_status, rescission_ends: c.rescission_ends };
    out.milestones = MS.forJob(job.id).map((m) => ({ id: m.id, seq: m.seq, name: m.name, amount: m.customer_amount, status: m.status, funded: !!m.funded_at, notes: m.evidence_notes, photos: m.evidence_photos.length, submitted_at: m.submitted_at, auto_approve_hours: cfg.marketplace.autoApproveHours, dispute_reason: m.dispute_reason }));
  }
  return out;
};

route('GET', '/api/quote/:token', 'public', (req, res, { params }) => {
  const q = customerQuote(params.token);
  if (!q || q.status === 'draft') return send(res, 404, { error: 'Quote not found' });
  event(q.lead_id, 'quote_viewed', { quote: q.id });
  send(res, 200, publicQuote(q));
});

// 1) Customer approves the project plan: this opens the auction. No contract yet.
route('POST', '/api/quote/:token/approve-plan', 'public', (req, res, { params, body, ip }) => {
  const q = customerQuote(params.token);
  if (!q || q.status !== 'sent') return send(res, q?.status === 'approved' ? 409 : 404, { error: q?.status === 'approved' ? 'Already approved.' : 'Quote not found' });
  if (q.valid_until && new Date(q.valid_until.replace(' ', 'T') + 'Z') < new Date()) return send(res, 410, { error: 'This plan has expired. Please contact us for an updated one.' });
  if (String(body.name || '').trim().length < 3 || body.agree !== true) return send(res, 400, { error: 'Type your full name and tick the box to approve the plan.' });
  if (!parse(q.phases)) return send(res, 409, { error: 'This plan has no phases yet.' });
  run("UPDATE quotes SET status='approved', approved_at=datetime('now') WHERE id=?", q.id);
  const jobId = Number(run("INSERT INTO jobs (quote_id, lead_id, status) VALUES (?,?, 'bidding')", q.id, q.lead_id).lastInsertRowid);
  const post = M.createAuction(jobId, { hours: Number(body.hours) });
  event(q.lead_id, 'plan_approved', { quote: q.id, by: String(body.name).trim(), ip });
  send(res, 201, { ok: true, closes_at: post.closes_at });
});

// 2) Customer accepts the winning bid: contract is between the customer and the winning contractor; phase 1 is due now.
route('POST', '/api/quote/:token/accept-award', 'public', async (req, res, { params, body, ip }) => {
  const q = customerQuote(params.token); const job = q && get('SELECT * FROM jobs WHERE quote_id=?', q.id);
  const post = job && get("SELECT * FROM job_posts WHERE job_id=? AND status='pending_acceptance'", job.id);
  if (!post) return send(res, 404, { error: 'There is no offer to accept.' });
  if (get('SELECT 1 FROM contracts WHERE quote_id=?', q.id)) return send(res, 409, { error: 'Already accepted.' });
  if (new Date(post.accept_deadline) < new Date()) return send(res, 410, { error: 'This offer has expired.' });
  const name = String(body.name || '').trim();
  if (name.length < 3 || body.agree !== true || !String(body.signature || '').startsWith('data:image/png;base64,')) return send(res, 400, { error: 'Type your full name, draw your signature and tick the agreement box.' });
  if (String(body.signature).length > 400_000) return send(res, 413, { error: 'signature too large' });
  const bid = get('SELECT * FROM bids WHERE id=?', post.winning_bid_id), sub = get('SELECT * FROM subcontractors WHERE id=?', bid.sub_id), lead = get('SELECT * FROM leads WHERE id=?', q.lead_id);
  const schedule = MS.buildSchedule({ phases: parse(q.phases), award: post.payout, feePct: post.fee_pct, customerFeePct: post.customer_fee_pct });
  const now = new Date(), resc = rescission(now);
  const text = contractText({ quote: q, lead, sub, award: post.payout, schedule, rescissionNote: resc.note });
  const cid = Number(run(`INSERT INTO contracts (quote_id, text, text_sha256, signer_name, signature, signed_at, signed_ip, deposit_amount, rescission_ends, sub_id)
    VALUES (?,?,?,?,?,?,?,?,?,?)`, q.id, text, sha256(text), name, body.signature, now.toISOString(), ip, schedule[0].customer_amount, resc.ends.toISOString(), sub.id).lastInsertRowid);
  MS.insertSchedule(job.id, schedule);
  run("UPDATE jobs SET status='awaiting_deposit' WHERE id=?", job.id);
  event(q.lead_id, 'contract_signed', { quote: q.id, contract: cid, sub: sub.id, ip });
  let checkoutUrl = null;
  try { checkoutUrl = await I.createDepositCheckout(q, get('SELECT * FROM contracts WHERE id=?', cid), lead); } catch (e) { event(q.lead_id, 'stripe_error', { message: e.message }); }
  send(res, 201, { ok: true, checkoutUrl, rescission_ends: resc.ends.toISOString() });
});

// 3) Customer declines: the next-best bidder gets the offer.
route('POST', '/api/quote/:token/decline-award', 'public', (req, res, { params }) => {
  const q = customerQuote(params.token); const job = q && get('SELECT * FROM jobs WHERE quote_id=?', q.id);
  const post = job && get("SELECT * FROM job_posts WHERE job_id=? AND status='pending_acceptance'", job.id);
  if (!post || get('SELECT 1 FROM contracts WHERE quote_id=?', q.id)) return send(res, 404, { error: 'There is no offer to decline.' });
  const next = M.offerNext(post.id, 'declined');
  send(res, 200, { ok: true, next_offer: next.status === 'pending_acceptance' });
});

route('POST', '/webhooks/stripe', 'public', (req, res, { raw }) => {
  const secret = cfg.stripe.webhookSecret; if (!secret) return send(res, 503, 'not configured');
  const header = String(req.headers['stripe-signature'] || '');
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')));
  const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.${raw.toString('utf8')}`).digest('hex');
  const fresh = Math.abs(Date.now() / 1000 - Number(parts.t)) < 300;
  if (!parts.v1 || !safeEq(parts.v1, expected) || !fresh) return send(res, 400, 'bad signature');
  const ev = JSON.parse(raw.toString('utf8')), o = ev.data.object;
  if (ev.type === 'checkout.session.completed' && o.mode === 'subscription') {
    const sid = Number(o.metadata?.sub_id || o.client_reference_id);
    if (sid) { run("UPDATE subcontractors SET subscription_status='active', stripe_customer_id=?, stripe_subscription_id=? WHERE id=?", o.customer, o.subscription, sid); event(null, 'sub_subscribed', { sub: sid }); }
  } else if ((ev.type === 'checkout.session.completed' && o.payment_status === 'paid') || ev.type === 'checkout.session.async_payment_succeeded') {
    // Card: paid immediately. ACH: only counts once the bank debit has actually settled (async_payment_succeeded).
    if (o.metadata?.milestone_id) { const id = Number(o.metadata.milestone_id); MS.markFunded(id, 'stripe'); }
    else { const cid = Number(o.metadata?.contract_id || o.client_reference_id); if (cid) I.markDepositPaid(cid, 'stripe'); }
  } else if (ev.type === 'checkout.session.async_payment_failed') {
    event(null, 'payment_failed', { session: o.id, milestone: o.metadata?.milestone_id || null, contract: o.metadata?.contract_id || null });
  } else if (ev.type === 'invoice.payment_failed') {
    run("UPDATE subcontractors SET subscription_status='past_due' WHERE stripe_customer_id=?", o.customer);
  } else if (ev.type === 'invoice.paid') {
    run("UPDATE subcontractors SET subscription_status='active' WHERE stripe_customer_id=? AND subscription_status='past_due'", o.customer);
  } else if (ev.type === 'customer.subscription.deleted') {
    run("UPDATE subcontractors SET subscription_status='canceled' WHERE stripe_customer_id=?", o.customer);
  }
  send(res, 200, 'ok');
});


// ===========================================================================
// SUBCONTRACTOR PLATFORM: signup, board, claim, my jobs
// ===========================================================================
const fs2 = fs;
route('POST', '/api/sub/signup', 'public', (req, res, { body, ip }) => {
  if (limited(ip, 5, 600_000)) return send(res, 429, { error: 'Too many attempts. Try again later.' });
  const id = M.signup(body);
  send(res, 201, { ok: true, id, message: 'Application received. We review license and insurance before approving.' });
});
route('POST', '/api/sub/login', 'public', (req, res, { body, ip }) => {
  if (limited(ip, 10, 600_000)) return send(res, 429, { error: 'Too many attempts. Try again later.' });
  send(res, 200, { token: M.login(body.email, body.password) });
});
route('GET', '/api/sub/me', 'sub', (req, res, { sub }) => send(res, 200, M.publicSub(sub)));
route('PUT', '/api/sub/profile', 'sub', (req, res, { sub, body }) => {
  const exp = String(body.insurance_expires || sub.insurance_expires || '');
  const prefixes = M.csv(body.zip_prefixes ?? sub.zip_prefixes).filter((x) => /^\d{3}$/.test(x)).join(',');
  const trades = (Array.isArray(body.trades) ? body.trades : M.csv(sub.trade)).filter((t) => M.TRADES.includes(t)).join(',') || sub.trade;
  // Material changes after approval put the account back in review so a bad license can't sneak in.
  const licenseChanged = body.license_number && body.license_number !== sub.license;
  run('UPDATE subcontractors SET insurance_expires=?, zip_prefixes=?, trade=?, phone=COALESCE(?,phone), license=COALESCE(?,license), status=CASE WHEN ? THEN \'pending\' ELSE status END WHERE id=?',
    exp, prefixes, trades, body.phone ? normPhone(body.phone) : null, body.license_number || null, licenseChanged ? 1 : 0, sub.id);
  event(null, 'sub_profile_updated', { sub: sub.id });
  send(res, 200, M.publicSub(get('SELECT * FROM subcontractors WHERE id=?', sub.id)));
});
route('PUT', '/api/sub/coi', 'sub', async (req, res, { sub }) => {
  const buf = await readBody(req, 10_000_000, true);
  const ext = buf.slice(0, 4).toString() === '%PDF' ? 'pdf' : buf[0] === 0xff && buf[1] === 0xd8 ? 'jpg' : buf.slice(1, 4).toString() === 'PNG' ? 'png' : null;
  if (!ext) return send(res, 400, { error: 'Upload a PDF, JPG or PNG certificate of insurance.' });
  fs2.mkdirSync(path.join(cfg.dataDir, 'docs'), { recursive: true });
  const file = path.join(cfg.dataDir, 'docs', `coi-${sub.id}.${ext}`);
  fs2.writeFileSync(file, buf);
  run('UPDATE subcontractors SET coi_path=? WHERE id=?', file, sub.id);
  send(res, 200, { ok: true });
});
route('POST', '/api/sub/subscribe', 'sub', async (req, res, { sub }) => {
  if (sub.status !== 'approved') return send(res, 403, { error: 'Your account must be approved before you can subscribe.' });
  if (sub.subscription_status === 'active') return send(res, 409, { error: 'Already subscribed.' });
  const url = await I.createSubCheckout(sub);
  if (!url) return send(res, 503, { error: 'Online payments are not set up yet. Contact us to activate your subscription.' });
  send(res, 200, { checkoutUrl: url });
});
route('GET', '/api/sub/jobs', 'sub', (req, res, { sub }) => {
  const posts = all("SELECT * FROM job_posts WHERE status='open' AND closes_at > ? ORDER BY closes_at ASC LIMIT 100", new Date().toISOString());
  send(res, 200, posts.map((p) => M.boardView(p, sub)));
});
route('POST', '/api/sub/jobs/:id/bid', 'sub', (req, res, { sub, params, body, ip }) => {
  if (limited(ip + 'bid', 60)) return send(res, 429, { error: 'Slow down.' });
  const { bid, post } = M.placeBid(sub.id, Number(params.id), body);
  send(res, 200, { ok: true, bid: { amount: bid.amount, days: bid.days }, view: M.boardView(post, sub) });
});
route('GET', '/api/sub/my-bids', 'sub', (req, res, { sub }) => send(res, 200, M.myBids(sub.id)));
route('GET', '/api/sub/my-jobs', 'sub', (req, res, { sub }) => send(res, 200, all("SELECT * FROM job_posts WHERE awarded_to=? ORDER BY awarded_at DESC", sub.id).map(M.awardedView)));
route('GET', '/api/sub/ledger', 'sub', (req, res, { sub }) => send(res, 200, all('SELECT * FROM ledger WHERE sub_id=? ORDER BY id DESC', sub.id)));


// ---- subcontractor: phases (start / evidence / submit) and payouts
route('POST', '/api/sub/milestones/:id/start', 'sub', (req, res, { sub, params, body }) => {
  const geo = body.lat != null && body.lng != null ? { lat: Number(body.lat), lng: Number(body.lng), at: new Date().toISOString() } : null;
  MS.startPhase(sub.id, Number(params.id), geo); send(res, 200, { ok: true });
});
route('PUT', '/api/sub/milestones/:id/photo', 'sub', async (req, res, { sub, params }) => {
  const id = Number(params.id);
  const buf = await readBody(req, 15_000_000, true);
  if (!(buf[0] === 0xff && buf[1] === 0xd8) && buf.slice(1, 4).toString() !== 'PNG') return send(res, 400, { error: 'Upload a JPG or PNG photo.' });
  const n = MS.addPhoto(sub.id, id, (name) => fs.writeFileSync(path.join(cfg.dataDir, 'photos', name), buf));
  send(res, 200, { ok: true, photos: n });
});
route('POST', '/api/sub/milestones/:id/submit', 'sub', (req, res, { sub, params, body }) => { MS.submitPhase(sub.id, Number(params.id), { notes: body.notes, waiver: body.waiver === true }); send(res, 200, { ok: true }); });
route('POST', '/api/sub/payouts/setup', 'sub', async (req, res, { sub }) => {
  const url = await I.connectOnboardingLink(sub);
  if (!url) return send(res, 503, { error: 'Payouts are not set up on the platform yet. Contact us.' });
  send(res, 200, { url });
});

// ---- customer: pay a milestone, approve or dispute completed work (authorized by the private quote link)
const quoteMilestone = (token, id) => {
  const q = customerQuote(token); if (!q) return {};
  const job = get('SELECT * FROM jobs WHERE quote_id=?', q.id);
  const m = job && get('SELECT * FROM milestones WHERE id=? AND job_id=?', Number(id), job.id);
  return { q, job, m };
};
route('POST', '/api/quote/:token/milestones/:id/pay', 'public', async (req, res, { params }) => {
  const { q, m } = quoteMilestone(params.token, params.id);
  if (!m) return send(res, 404, { error: 'not found' });
  if (m.funded_at) return send(res, 409, { error: 'Already paid.' });
  if (!['invoiced', 'funded'].includes(m.status) && m.seq > 1) return send(res, 409, { error: 'This payment is not due yet.' });
  const url = await I.createMilestoneCheckout(q, m, get('SELECT * FROM leads WHERE id=?', q.lead_id));
  if (!url) return send(res, 503, { error: 'Online payment is not configured. Please call us to pay by bank transfer.' });
  send(res, 200, { checkoutUrl: url });
});
route('POST', '/api/quote/:token/milestones/:id/approve', 'public', (req, res, { params }) => {
  const { m } = quoteMilestone(params.token, params.id); if (!m) return send(res, 404, { error: 'not found' });
  MS.approve(m.id, 'customer'); send(res, 200, { ok: true });
});
route('POST', '/api/quote/:token/milestones/:id/dispute', 'public', (req, res, { params, body }) => {
  const { m } = quoteMilestone(params.token, params.id); if (!m) return send(res, 404, { error: 'not found' });
  if (String(body.reason || '').trim().length < 5) return send(res, 400, { error: 'Please describe the problem.' });
  MS.dispute(m.id, body.reason); send(res, 200, { ok: true });
});
route('GET', '/api/quote/:token/milestones/:id/photo/:n', 'public', (req, res, { params }) => {
  const { m } = quoteMilestone(params.token, params.id); if (!m) return send(res, 404, { error: 'not found' });
  const name = JSON.parse(m.evidence_photos || '[]')[Number(params.n)];
  const f = name && path.join(cfg.dataDir, 'photos', path.basename(name));
  if (!f || !fs.existsSync(f)) return send(res, 404, { error: 'not found' });
  res.writeHead(200, { 'Content-Type': 'image/jpeg', 'X-Content-Type-Options': 'nosniff' }); fs.createReadStream(f).pipe(res);
});

// ---- admin: milestones
route('GET', '/api/admin/jobs/:id/milestones', 'admin', (req, res, { params }) => send(res, 200, MS.forJob(Number(params.id))));
route('POST', '/api/admin/milestones/:id/mark-funded', 'admin', (req, res, { params }) => {
  const m = MS.mget(Number(params.id)); if (!m) return send(res, 404, { error: 'not found' });
  if (m.seq === 1) { const c = get('SELECT c.id FROM contracts c JOIN jobs j ON j.quote_id=c.quote_id WHERE j.id=?', m.job_id); I.markDepositPaid(c.id, 'manual'); }
  else MS.markFunded(m.id, 'manual');
  send(res, 200, MS.mget(m.id));
});
route('POST', '/api/admin/milestones/:id/resolve', 'admin', (req, res, { params, body }) => { MS.resolveDispute(Number(params.id), body.action); send(res, 200, { ok: true }); });
route('POST', '/api/admin/milestones/:id/invoice', 'admin', (req, res, { params }) => { const m = MS.mget(Number(params.id)); if (!m) return send(res, 404, { error: 'not found' }); MS.invoice(m); send(res, 200, MS.mget(m.id)); });

// ---- admin side of the marketplace
route('GET', '/api/admin/subs', 'admin', (req, res) => send(res, 200, all('SELECT * FROM subcontractors WHERE active=1 ORDER BY (status=\'pending\') DESC, id DESC').map((s) => ({ ...M.publicSub(s), password_hash: undefined }))));
route('PATCH', '/api/admin/subs/:id', 'admin', (req, res, { body, params }) => {
  const id = Number(params.id);
  if ('status' in body) { if (!['pending', 'approved', 'suspended'].includes(body.status)) return send(res, 400, { error: 'bad status' }); run('UPDATE subcontractors SET status=? WHERE id=?', body.status, id); }
  if ('subscription_status' in body) { if (!['none', 'active', 'past_due', 'canceled'].includes(body.subscription_status)) return send(res, 400, { error: 'bad status' }); run('UPDATE subcontractors SET subscription_status=? WHERE id=?', body.subscription_status, id); }
  event(null, 'sub_admin_update', { sub: id, ...body });
  send(res, 200, M.publicSub(get('SELECT * FROM subcontractors WHERE id=?', id)));
});
route('GET', '/api/admin/subs/:id/coi', 'admin', (req, res, { params }) => {
  const s = get('SELECT coi_path FROM subcontractors WHERE id=?', Number(params.id));
  if (!s?.coi_path || !fs.existsSync(s.coi_path)) return send(res, 404, { error: 'no certificate on file' });
  const t = { pdf: 'application/pdf', jpg: 'image/jpeg', png: 'image/png' }[s.coi_path.split('.').pop()];
  res.writeHead(200, { 'Content-Type': t }); fs.createReadStream(s.coi_path).pipe(res);
});
route('GET', '/api/admin/posts', 'admin', (req, res) => send(res, 200, all(`SELECT p.*, s.name sub_name FROM job_posts p LEFT JOIN subcontractors s ON s.id=p.awarded_to ORDER BY p.id DESC`).map((p) => {
  const bids = all("SELECT b.*, s.name company FROM bids b JOIN subcontractors s ON s.id=b.sub_id WHERE b.post_id=? ORDER BY b.amount ASC, b.updated_at ASC", p.id);
  let eco = null; try { eco = M.economics({ ...p, payout: p.payout || p.ceiling }); } catch { /* ignore */ }
  return { ...p, scope: undefined, trades: JSON.parse(p.trades), bids, economics: eco };
})));
// Admin may tune an auction that has not been awarded: budget ceiling, floor, fees. Fees lock at award.
route('PATCH', '/api/admin/posts/:id', 'admin', (req, res, { params, body }) => {
  const p = get('SELECT * FROM job_posts WHERE id=?', Number(params.id)); if (!p) return send(res, 404, { error: 'not found' });
  if (p.status === 'awarded') return send(res, 409, { error: 'Already awarded: terms are locked.' });
  const pick = (k, d) => (body[k] != null ? Number(body[k]) : d);
  const fee = pick('fee_pct', p.fee_pct), cust = pick('customer_fee_pct', p.customer_fee_pct), ceiling = pick('ceiling', p.ceiling), floor = pick('floor_pct', p.floor_pct), dec = pick('min_decrement_pct', p.min_decrement_pct);
  if (!(fee >= 0 && fee <= 30 && cust >= 0 && cust <= 30 && ceiling > 0 && floor >= 10 && floor <= 100 && dec >= 0 && dec <= 10)) return send(res, 400, { error: 'invalid auction settings' });
  run('UPDATE job_posts SET fee_pct=?, customer_fee_pct=?, ceiling=?, floor_pct=?, min_decrement_pct=? WHERE id=?', fee, cust, ceiling, floor, dec, p.id);
  if (body.status === 'closed' && ['open', 'no_bids'].includes(p.status)) run("UPDATE job_posts SET status='closed' WHERE id=?", p.id);
  if (body.extend_hours && ['open', 'no_bids', 'closed'].includes(p.status)) run("UPDATE job_posts SET status='open', closes_at=? WHERE id=?", new Date(Date.now() + Math.min(Number(body.extend_hours), 120) * 3600000).toISOString(), p.id);
  send(res, 200, get('SELECT * FROM job_posts WHERE id=?', p.id));
});
route('POST', '/api/admin/posts/:id/close-now', 'admin', (req, res, { params }) => send(res, 200, M.closeAuction(Number(params.id))));
// Admin override: offer the job to a specific bidder instead of the lowest (e.g. better reviews at +2%).
route('POST', '/api/admin/posts/:id/offer/:bidId', 'admin', (req, res, { params }) => {
  const post = get('SELECT * FROM job_posts WHERE id=?', Number(params.id)), bid = get('SELECT * FROM bids WHERE id=? AND post_id=?', Number(params.bidId), Number(params.id));
  if (!post || !bid) return send(res, 404, { error: 'not found' });
  if (!['open', 'no_bids', 'pending_acceptance'].includes(post.status)) return send(res, 409, { error: 'This auction cannot be re-offered.' });
  if (get('SELECT 1 FROM contracts c JOIN jobs j ON j.quote_id=c.quote_id WHERE j.id=?', post.job_id)) return send(res, 409, { error: 'The customer already signed with the current winner.' });
  run("UPDATE bids SET status='active' WHERE post_id=? AND status='offered'", post.id);
  run("UPDATE job_posts SET status='open' WHERE id=?", post.id);
  M.closeAuction(post.id); // reuse the standard path, then point it at the chosen bid
  const fresh = get('SELECT * FROM job_posts WHERE id=?', post.id);
  if (fresh.winning_bid_id !== bid.id) { run("UPDATE bids SET status='active' WHERE id=?", fresh.winning_bid_id); run("UPDATE job_posts SET status='open' WHERE id=?", post.id); M.offerSpecific(post.id, bid.id); }
  send(res, 200, get('SELECT * FROM job_posts WHERE id=?', post.id));
});
route('GET', '/api/admin/ledger', 'admin', (req, res) => send(res, 200, all('SELECT l.*, s.name sub_name FROM ledger l LEFT JOIN subcontractors s ON s.id=l.sub_id ORDER BY l.id DESC LIMIT 300')));
route('POST', '/api/admin/ledger/:id/settle', 'admin', (req, res, { params }) => { run("UPDATE ledger SET status='settled' WHERE id=?", Number(params.id)); send(res, 200, { ok: true }); });

// ===========================================================================
// server
// ===========================================================================
async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  try {
    const r = routes.find((x) => x.method === req.method && x.re.test(url.pathname));
    if (r) {
      const params = url.pathname.match(r.re).groups || {};
      const ctx = { url, params, ip };
      if (r.auth === 'admin' && !isAdmin(req)) return send(res, 401, { error: 'unauthorized' });
      if (r.auth === 'staff') { ctx.staff = staffFrom(req); if (!ctx.staff) return send(res, 401, { error: 'unauthorized' }); }
      if (r.auth === 'voice' && !voiceAuth(req)) return send(res, 401, { error: 'unauthorized' });
      if (r.auth === 'sub') { ctx.sub = M.subFromToken(req.headers['x-sub-token']); if (!ctx.sub) return send(res, 401, { error: 'Please sign in.' }); }
      const rawRoute = url.pathname.startsWith('/webhooks/meta') || url.pathname === '/webhooks/stripe';
      const binary = (req.method === 'PUT' && (url.pathname.endsWith('/audio') || url.pathname === '/api/sub/coi' || /^\/api\/sub\/milestones\/\d+\/photo$/.test(url.pathname))) || (req.method === 'POST' && url.pathname.endsWith('/photo'));
      if (!binary) {
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
          if (rawRoute) ctx.raw = await readBody(req, 1_000_000, true); else ctx.body = await readBody(req);
        } else ctx.body = {};
      }
      return await r.handler(req, res, ctx);
    }
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/webhooks/')) return send(res, 404, { error: 'not found' });

    // static files: landing page at root, app pages in /public
    let rel = url.pathname === '/' ? '/index.html' : url.pathname;
    const cands = [path.join(ROOT, 'public', rel), path.join(ROOT, rel)];
    const allowedRoot = ['/index.html', '/styles.css', '/app.js'];
    for (const f of cands) {
      const inside = f.startsWith(path.join(ROOT, 'public') + path.sep) || (f.startsWith(ROOT + path.sep) && allowedRoot.includes(rel));
      if (inside && fs.existsSync(f) && fs.statSync(f).isFile()) {
        res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
        return fs.createReadStream(f).pipe(res);
      }
    }
    if (url.pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
    if (url.pathname === '/config.js') {
      res.writeHead(200, { 'Content-Type': MIME['.js'] });
      return res.end(`window.SITE_CONFIG=${JSON.stringify({ companyName: cfg.company.name, phone: cfg.company.phone, serviceArea: 'New York & New Jersey', leadWebhookUrl: '/api/leads', bookingUrl: '' })};`);
    }
    send(res, 404, 'Not found');
  } catch (err) {
    if (!err.status) console.error(err);
    send(res, err.status || 500, { error: err.status ? err.message : 'internal error' });
  }
}

function start(port = cfg.port) {
  seed();
  const server = http.createServer(handle);
  server.listen(port);
  const timers = [
    setInterval(() => I.followUpTick().catch((e) => console.error('followUp', e.message)), 60_000),
    setInterval(() => { try { M.auctionTick(); } catch (e) { console.error('auction', e.message); } }, 30_000),
    setInterval(() => { try { I.releaseRescissionTick(); MS.autoApproveTick(); } catch (e) { console.error(e.message); } I.payDueTransfers().catch(() => {}); }, 5 * 60_000),
  ];
  server.on('close', () => timers.forEach(clearInterval));
  return server;
}

if (require.main === module) {
  start();
  console.log(`Construction pipeline running on ${cfg.publicUrl}`);
  if (cfg.adminTokenGenerated) console.log(`ADMIN_TOKEN not set. Temporary token for this run: ${cfg.adminToken}`);
}
module.exports = { start };
