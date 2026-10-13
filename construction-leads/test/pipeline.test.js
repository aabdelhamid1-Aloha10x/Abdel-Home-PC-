'use strict';
// End-to-end: ad lead -> booking -> site visit with consent -> quote -> signature -> deposit -> job.
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cl-'));
process.env.DB_FILE = ':memory:';
process.env.ADMIN_TOKEN = 'adm';
process.env.COMPANY_STATE = 'CA';
process.env.META_VERIFY_TOKEN = 'vt';
process.env.GOOGLE_LEAD_KEY = 'gk';
process.env.VOICE_TOOL_SECRET = 'vs';
process.env.COMPANY_TZ = 'America/Los_Angeles';

const test = require('node:test');
const assert = require('node:assert/strict');
const { start } = require('../server/index');
const { all, get } = require('../server/db');

let server, base;
test.before(async () => { server = start(0); await new Promise((r) => server.once('listening', r)); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => server.close());

const api = async (m, p, body, headers = {}, raw) => {
  const r = await fetch(base + p, { method: m, headers: { ...(raw ? {} : { 'Content-Type': 'application/json' }), ...headers }, body: raw ?? (body ? JSON.stringify(body) : undefined) });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  return { status: r.status, body: j };
};
const A = { 'x-admin-token': 'adm' };
let leadId, key, quote, qtoken, techTok;

test('admin endpoints reject missing token', async () => {
  assert.equal((await api('GET', '/api/admin/pipeline')).status, 401);
});

test('website form creates a lead; honeypot is ignored; duplicate phone merges', async () => {
  const r = await api('POST', '/api/leads', { name: 'Jane Smith', phone: '(415) 555-0134', email: 'jane@x.com', zip: '94110', service: 'Kitchen remodel', propertyType: 'Residential', consent: true, consentText: 'I agree...', utm: { gclid: 'g1' } });
  assert.equal(r.status, 201); leadId = r.body.leadId; key = r.body.key;
  assert.equal(get('SELECT phone FROM leads WHERE id=?', leadId).phone, '+14155550134');
  const bot = await api('POST', '/api/leads', { name: 'Bot', phone: '4155550999', website: 'spam.com' });
  assert.equal(all("SELECT * FROM leads WHERE name='Bot'").length, 0); assert.equal(bot.status, 200);
  const dup = await api('POST', '/api/leads', { name: 'Jane S', phone: '415-555-0134', consent: true });
  assert.equal(dup.body.duplicate, true);
  assert.equal(all('SELECT * FROM leads').length, 1);
});

test('Google and Meta webhooks: auth enforced, leads land WITHOUT automated-call consent', async () => {
  assert.equal((await api('POST', '/webhooks/google-leads', { google_key: 'nope' })).status, 401);
  const g = await api('POST', '/webhooks/google-leads', { google_key: 'gk', lead_id: 'L1', gcl_id: 'abc', user_column_data: [{ column_id: 'FULL_NAME', string_value: 'Bob Roofer' }, { column_id: 'PHONE_NUMBER', string_value: '+13105550111' }, { column_id: 'POSTAL_CODE', string_value: '90001' }] });
  assert.equal(g.status, 200);
  const l = get("SELECT * FROM leads WHERE source='google'");
  assert.equal(l.name, 'Bob Roofer'); assert.equal(l.consent_contact, 0);
  // same Google lead id replayed must not double-insert
  await api('POST', '/webhooks/google-leads', { google_key: 'gk', lead_id: 'L1', user_column_data: [{ column_id: 'PHONE_NUMBER', string_value: '+13105550111' }] });
  assert.equal(all("SELECT * FROM leads WHERE source='google'").length, 1);
  assert.equal((await api('GET', '/webhooks/meta?hub.mode=subscribe&hub.verify_token=bad&hub.challenge=1')).status, 403);
  const v = await api('GET', '/webhooks/meta?hub.mode=subscribe&hub.verify_token=vt&hub.challenge=12345');
  assert.equal(String(v.body), '12345');
});

test('booking: needs valid key, picks a real slot, rejects double booking', async () => {
  const av = await api('GET', '/api/availability');
  const slot = av.body.days[0].slots[0];
  assert.equal((await api('POST', '/api/book', { leadId, key: 'wrong', start: slot })).status, 403);
  const ok = await api('POST', '/api/book', { leadId, key, start: slot, address: '12 Main St' });
  assert.equal(ok.status, 201);
  assert.equal(get('SELECT status FROM leads WHERE id=?', leadId).status, 'booked');
  // 2 estimators -> second lead can take the same slot, third cannot
  const g = get("SELECT id FROM leads WHERE source='google'").id;
  const gkey = require('../server/leads').leadKey(get('SELECT * FROM leads WHERE id=?', g));
  assert.equal((await api('POST', '/api/book', { leadId: g, key: gkey, start: slot })).status, 201);
  const l3 = await api('POST', '/api/leads', { name: 'Third', phone: '2125550100', consent: true });
  const k3 = l3.body.key;
  assert.equal((await api('POST', '/api/book', { leadId: l3.body.leadId, key: k3, start: slot })).status, 409);
  const sent = all("SELECT * FROM outbox WHERE body LIKE '%record%'");
  assert.ok(sent.length >= 1, 'recording notice is sent with the confirmation');
});

test('voice agent tools require the secret and can book + record DNC', async () => {
  assert.equal((await api('GET', '/api/voice/availability')).status, 401);
  const slots = (await api('GET', '/api/voice/availability', null, { 'x-tool-secret': 'vs' })).body.slots;
  assert.ok(slots.length > 0);
  const l = await api('POST', '/api/leads', { name: 'Call Me', phone: '6505550123', consent: true });
  const b = await api('POST', '/api/voice/book', { lead_id: l.body.leadId, start: slots[slots.length - 1], address: '9 Oak' }, { 'x-tool-secret': 'vs' });
  assert.equal(b.status, 201);
  const dn = await api('POST', '/api/leads', { name: 'No Calls', phone: '7075550123', consent: true });
  await api('POST', '/api/voice/outcome', { lead_id: dn.body.leadId, outcome: 'do_not_call' }, { 'x-tool-secret': 'vs' });
  assert.equal(get('SELECT do_not_contact FROM leads WHERE id=?', dn.body.leadId).do_not_contact, 1);
});

test('technician: audio is refused until consent is granted', async () => {
  techTok = get("SELECT token FROM staff WHERE id=(SELECT staff_id FROM appointments WHERE lead_id=? AND status='scheduled')", leadId).token;
  const T = { 'x-staff-token': techTok };
  const appts = await api('GET', '/api/tech/appointments', null, T);
  assert.equal(appts.body.length >= 1, true);
  const apt = appts.body.find((a) => a.lead_id === leadId);
  const visit = (await api('POST', '/api/tech/visits', { appointmentId: apt.id }, T)).body;
  const noConsent = await api('PUT', `/api/tech/visits/${visit.id}/audio`, null, { ...T, 'Content-Type': 'audio/webm' }, Buffer.from('xx'));
  assert.equal(noConsent.status, 403);
  await api('POST', `/api/tech/visits/${visit.id}/consent`, { granted: true, by: 'Jane Smith, verbal' }, T);
  const withConsent = await api('PUT', `/api/tech/visits/${visit.id}/audio`, null, { ...T, 'Content-Type': 'audio/webm' }, Buffer.from('fake-audio'));
  assert.equal(withConsent.status, 200);
  // another technician cannot touch this visit
  const other = get('SELECT token FROM staff WHERE token<>?', techTok).token;
  assert.equal((await api('POST', `/api/tech/visits/${visit.id}/consent`, { granted: true }, { 'x-staff-token': other })).status, 404);
  const sub = await api('POST', `/api/tech/visits/${visit.id}/submit`, { rooms: [{ name: 'Kitchen', length: 14, width: 11, height: 8 }], preferences: 'White shaker cabinets, quartz' }, T);
  assert.equal(sub.status, 200);
  assert.equal(get('SELECT status FROM leads WHERE id=?', leadId).status, 'visited');
  quote = { visitId: visit.id };
});

test('quote: build from catalog, margin math, customer view hides cost', async () => {
  const cat = (await api('GET', '/api/admin/catalog', null, A)).body;
  const cab = cat.find((c) => c.name.startsWith('Cabinets')), top = cat.find((c) => c.name.startsWith('Countertop'));
  const items = [
    { description: cab.name, unit: cab.unit, qty: 24, material_unit_cost: cab.material_unit_cost, labor_hours_per_unit: cab.labor_hours_per_unit, waste_pct: cab.waste_pct },
    { description: top.name, unit: top.unit, qty: 40, material_unit_cost: top.material_unit_cost, labor_hours_per_unit: top.labor_hours_per_unit, waste_pct: top.waste_pct },
  ];
  const settings = { margin_pct: 0.3, deposit_pct: 0.15, tax_pct: 0.0875 };
  const prev = await api('POST', '/api/admin/quotes/preview', { items, settings }, A);
  assert.equal(prev.status, 200);
  assert.ok(Math.abs(prev.body.totals.effective_margin - 0.3) < 0.001);
  assert.ok(prev.body.warnings.some((w) => /legal cap/.test(w)), 'CA deposit cap applies');
  const c = await api('POST', '/api/admin/quotes', { leadId, visitId: quote.visitId, title: 'Kitchen remodel', scope_summary: 'Cabinets and counters', items, settings }, A);
  assert.equal(c.status, 201); quote = c.body; qtoken = quote.token;
  assert.equal((await api('GET', `/api/quote/${qtoken}`)).status, 404, 'drafts are not public');
  assert.equal((await api('POST', `/api/admin/quotes/${quote.id}/send`, {}, A)).status, 200);
  const pub = (await api('GET', `/api/quote/${qtoken}`)).body;
  const dump = JSON.stringify(pub);
  assert.ok(!/margin|gross_profit|material_unit_cost|labor_hours|"cost"/.test(dump), 'no internal cost data leaks to the customer');
  assert.equal(pub.totals.deposit, Math.min(pub.totals.total * 0.1, 1000));
});

test('signing: validates input, creates contract + job, locks the quote', async () => {
  assert.equal((await api('POST', `/api/quote/${qtoken}/sign`, { name: 'J', agree: false })).status, 400);
  const sig = 'data:image/png;base64,iVBORw0KGgo=';
  const s = await api('POST', `/api/quote/${qtoken}/sign`, { name: 'Jane Smith', agree: true, signature: sig });
  assert.equal(s.status, 201);
  assert.equal((await api('POST', `/api/quote/${qtoken}/sign`, { name: 'Jane Smith', agree: true, signature: sig })).status, 409);
  const c = get('SELECT * FROM contracts WHERE quote_id=?', quote.id);
  assert.match(c.text, /RIGHT TO CANCEL/); assert.equal(c.text_sha256.length, 64);
  assert.ok(new Date(c.rescission_ends) > new Date(Date.now() + 2 * 86400000));
  assert.equal((await api('PUT', `/api/admin/quotes/${quote.id}`, { items: [] }, A)).status, 409, 'signed quote is locked');
  assert.equal(get('SELECT status FROM jobs WHERE quote_id=?', quote.id).status, 'awaiting_deposit');
});

test('deposit paid -> job waits out the cancellation period; cannot be scheduled early', async () => {
  const paid = await api('POST', `/api/admin/quotes/${quote.id}/mark-deposit-paid`, {}, A);
  assert.equal(paid.body.deposit_status, 'paid');
  const job = get('SELECT * FROM jobs WHERE quote_id=?', quote.id);
  assert.equal(job.status, 'rescission_period');
  assert.equal(get('SELECT status FROM leads WHERE id=?', leadId).status, 'won');
  const early = await api('PATCH', `/api/admin/jobs/${job.id}`, { status: 'in_progress' }, A);
  assert.equal(early.status, 409);
  const sub = get('SELECT id FROM subcontractors LIMIT 1').id;
  const assign = await api('PATCH', `/api/admin/jobs/${job.id}`, { assigned_type: 'subcontractor', subcontractor_id: sub, sub_cost: 9000 }, A);
  assert.equal(assign.status, 200);
  const pipe = (await api('GET', '/api/admin/pipeline', null, A)).body;
  assert.equal(pipe.stats.won, 1); assert.ok(pipe.stats.won_value > 0);
});

test('follow-up dispatcher: only consented, un-booked, due leads are called; others flagged for a human', async () => {
  const { followUpTick, inCallWindow } = require('../server/integrations');
  const { run } = require('../server/db');
  run("UPDATE leads SET created_at=datetime('now','-1 hour') WHERE status='new'");
  const before = all('SELECT * FROM calls').length;
  await followUpTick();
  const calls = all('SELECT * FROM calls');
  if (inCallWindow()) assert.ok(calls.length > before); else assert.equal(calls.length, before);
  for (const c of calls) assert.equal(get('SELECT consent_contact, do_not_contact FROM leads WHERE id=?', c.lead_id).do_not_contact, 0);
  // ad-form lead with no consent was never dialed
  const g = get("SELECT id FROM leads WHERE source='google'").id;
  assert.equal(all('SELECT * FROM calls WHERE lead_id=?', g).length, 0);
});
