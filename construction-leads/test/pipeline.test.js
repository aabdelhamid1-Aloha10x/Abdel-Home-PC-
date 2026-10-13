'use strict';
// End-to-end: ad lead -> booking -> site visit with consent -> quote -> signature -> deposit -> job.
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cl-'));
process.env.DB_FILE = ':memory:';
process.env.ADMIN_TOKEN = 'adm';
process.env.NO_RATE_LIMIT = '1';
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
  const r = await api('POST', '/api/leads', { name: 'Jane Smith', phone: '(415) 555-0134', email: 'jane@x.com', zip: '10001', service: 'Kitchen remodel', propertyType: 'Residential', consent: true, consentText: 'I agree...', utm: { gclid: 'g1' } });
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
  const g = await api('POST', '/webhooks/google-leads', { google_key: 'gk', lead_id: 'L1', gcl_id: 'abc', user_column_data: [{ column_id: 'FULL_NAME', string_value: 'Bob Roofer' }, { column_id: 'PHONE_NUMBER', string_value: '+13105550111' }, { column_id: 'POSTAL_CODE', string_value: '10002' }] });
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
    { category: cab.category, description: cab.name, unit: cab.unit, qty: 24, material_unit_cost: cab.material_unit_cost, labor_hours_per_unit: cab.labor_hours_per_unit, waste_pct: cab.waste_pct },
    { category: top.category, description: top.name, unit: top.unit, qty: 40, material_unit_cost: top.material_unit_cost, labor_hours_per_unit: top.labor_hours_per_unit, waste_pct: top.waste_pct },
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
  const post = get('SELECT * FROM job_posts WHERE job_id=?', job.id);
  assert.ok(post, 'job is auto-posted to the subcontractor board when the deposit clears');
  assert.equal(post.status, 'open');
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


// ===========================================================================
// Subcontractor marketplace
// ===========================================================================
const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
const mkSub = (o = {}) => ({ company: 'Ace Kitchens LLC', contact_name: 'Al', email: 'al@ace.com', password: 'correct-horse-9', phone: '9145550111', trades: ['kitchen'], states: ['NY'], license_number: 'NYC-123', insurance_expires: nextYear, accept_terms: true, ...o });
const subLogin = async (email) => ({ 'x-sub-token': (await api('POST', '/api/sub/login', { email, password: 'correct-horse-9' })).body.token });
const activate = async (email) => { const id = get('SELECT id FROM subcontractors WHERE email=?', email).id; await api('PATCH', `/api/admin/subs/${id}`, { status: 'approved', subscription_status: 'active' }, A); return id; };

test('sub signup validates input and rejects duplicates', async () => {
  assert.equal((await api('POST', '/api/sub/signup', mkSub({ password: 'short' }))).status, 400);
  assert.equal((await api('POST', '/api/sub/signup', mkSub({ insurance_expires: '2020-01-01' }))).status, 400);
  assert.equal((await api('POST', '/api/sub/signup', mkSub({ accept_terms: false }))).status, 400);
  assert.equal((await api('POST', '/api/sub/signup', mkSub({ states: ['CA'] }))).status, 400);
  assert.equal((await api('POST', '/api/sub/signup', mkSub())).status, 201);
  assert.equal((await api('POST', '/api/sub/signup', mkSub())).status, 409);
  assert.equal((await api('POST', '/api/sub/login', { email: 'al@ace.com', password: 'nope-nope-nope' })).status, 401);
  assert.equal((await api('GET', '/api/sub/jobs')).status, 401);
});

test('pending / unsubscribed subs can browse but cannot claim', async () => {
  const H = await subLogin('al@ace.com');
  const board = (await api('GET', '/api/sub/jobs', null, H)).body;
  assert.equal(board.length, 1); assert.equal(board[0].eligible, false);
  assert.ok(board[0].reasons.some((r) => /not approved/.test(r)) && board[0].reasons.some((r) => /subscription/.test(r)));
  assert.equal((await api('POST', `/api/sub/jobs/${board[0].id}/claim`, {}, H)).status, 403);
  assert.equal((await api('POST', '/api/sub/subscribe', {}, H)).status, 403, 'cannot subscribe before approval');
});

test('the board never leaks customer identity, address or contract price', async () => {
  const H = await subLogin('al@ace.com');
  const raw = JSON.stringify((await api('GET', '/api/sub/jobs', null, H)).body);
  assert.ok(!/Jane|Smith|jane@x|12 Main|5550134|415|"total"|deposit|margin|gross/i.test(raw), raw.slice(0, 300));
  assert.match(raw, /"area":"100xx"/);
  const post = (await api('GET', '/api/sub/jobs', null, H)).body[0];
  assert.ok(post.payout > 0 && post.fee_pct === 5);
  assert.equal(post.fee, Math.round(post.payout * 5) / 100);
  assert.equal(post.net_to_you, Math.round((post.payout - post.fee) * 100) / 100);
  assert.deepEqual(post.trades, ['kitchen']);
});

test('eligibility: wrong trade, expired insurance and wrong area are blocked', async () => {
  await api('POST', '/api/sub/signup', mkSub({ company: 'Top Roofers', email: 'r@roof.com', trades: ['roofing'] }));
  await activate('r@roof.com');
  const board = (await api('GET', '/api/sub/jobs', null, await subLogin('r@roof.com'))).body;
  assert.ok(board[0].reasons.some((r) => /Needs kitchen/.test(r)));
  await api('POST', '/api/sub/signup', mkSub({ company: 'Lapsed Co', email: 'l@lapsed.com' }));
  const lid = await activate('l@lapsed.com');
  require('../server/db').run("UPDATE subcontractors SET insurance_expires='2021-01-01' WHERE id=?", lid);
  const lb = (await api('GET', '/api/sub/jobs', null, await subLogin('l@lapsed.com'))).body;
  assert.ok(lb[0].reasons.some((r) => /insurance has expired/.test(r)));
  await api('POST', '/api/sub/signup', mkSub({ company: 'Jersey Kitchens', email: 'nj@k.com', states: ['NJ'] }));
  await activate('nj@k.com');
  assert.ok((await api('GET', '/api/sub/jobs', null, await subLogin('nj@k.com'))).body[0].reasons.some((r) => /do not cover NY/.test(r)));
});

test('two eligible subs race for one job: exactly one wins, details unlock only for the winner', async () => {
  await activate('al@ace.com');
  await api('POST', '/api/sub/signup', mkSub({ company: 'Bee Kitchens', email: 'bee@k.com' }));
  await activate('bee@k.com');
  const HA = await subLogin('al@ace.com'), HB = await subLogin('bee@k.com');
  const postId = (await api('GET', '/api/sub/jobs', null, HA)).body[0].id;
  // FUNDED BEFORE COMMITTED: if the deposit has not cleared, nobody can take the job.
  const dbm = require('../server/db');
  dbm.run('UPDATE milestones SET funded_at=NULL WHERE seq=1');
  const early = await api('POST', `/api/sub/jobs/${postId}/claim`, {}, HA);
  assert.equal(early.status, 409); assert.match(early.body.error, /funds are not secured/);
  dbm.run("UPDATE milestones SET funded_at=datetime('now') WHERE seq=1");
  const [ra, rb] = await Promise.all([api('POST', `/api/sub/jobs/${postId}/claim`, {}, HA), api('POST', `/api/sub/jobs/${postId}/claim`, {}, HB)]);
  const codes = [ra.status, rb.status].sort();
  assert.deepEqual(codes, [200, 409]);
  const win = ra.status === 200 ? { H: HA, r: ra } : { H: HB, r: rb };
  assert.equal(win.r.body.customer.name, 'Jane Smith');
  assert.equal(win.r.body.customer.address, '12 Main St');
  assert.equal(get('SELECT assigned_type FROM jobs WHERE id=?', win.r.body.job_id).assigned_type, 'subcontractor');
  const ms = all('SELECT * FROM milestones ORDER BY seq');
  const p0 = get('SELECT * FROM job_posts LIMIT 1');
  assert.equal(ms[0].sub_gross, 0);
  assert.ok(Math.abs(ms.reduce((a, m) => a + m.sub_gross, 0) - p0.payout) < 0.005, 'sub phases add up to the award');
  assert.ok(Math.abs(ms.reduce((a, m) => a + m.fee_amount, 0) - p0.flat_fee) < 0.011, 'fees add up to fee_pct of the award');
  assert.equal(get("SELECT COUNT(*) c FROM ledger").c, 0, 'nothing is charged or paid at award time: the fee is withheld from payouts later');
  assert.equal((await api('GET', '/api/sub/jobs', null, win.H)).body.length, 0, 'awarded job leaves the open board');
  assert.equal((await api('GET', '/api/sub/my-jobs', null, win.H)).body.length, 1);
  const loser = win.H === HA ? HB : HA;
  assert.equal((await api('GET', '/api/sub/my-jobs', null, loser)).body.length, 0);
  assert.equal(win.r.body.can_start, false, 'cannot start during the customer cancellation period');
  // admin can't re-price or re-assign an awarded post
  assert.equal((await api('PATCH', `/api/admin/posts/${postId}`, { payout: 1 }, A)).status, 409);
});

test('money flow: no-pay-no-work, proof + waiver, approval, fee withheld from each payout', async () => {
  const dbm = require('../server/db'), I = require('../server/integrations');
  const post = get('SELECT * FROM job_posts LIMIT 1'), job = get('SELECT * FROM jobs WHERE id=?', post.job_id);
  const HS = await subLogin(get('SELECT email FROM subcontractors WHERE id=?', post.awarded_to).email);
  const phases = () => all('SELECT * FROM milestones ORDER BY seq');
  const q = get('SELECT token FROM quotes LIMIT 1').token;
  // phase 2 is not invoiced during the customer's cancellation window, and the sub cannot start
  assert.equal(phases()[1].status, 'scheduled');
  assert.equal((await api('POST', `/api/sub/milestones/${phases()[1].id}/start`, {}, HS)).status, 409);
  // window closes -> tick invoices the next payment
  dbm.run("UPDATE contracts SET rescission_ends=datetime('now','-1 day') WHERE quote_id=?", job.quote_id);
  I.releaseRescissionTick();
  assert.equal(phases()[1].status, 'invoiced');
  // NO PAY, NO WORK: invoiced but unpaid
  let r = await api('POST', `/api/sub/milestones/${phases()[1].id}/start`, {}, HS);
  assert.equal(r.status, 409); assert.match(r.body.error, /not funded/);
  // customer pays (admin marks funded in the absence of Stripe)
  await api('POST', `/api/admin/milestones/${phases()[1].id}/mark-funded`, {}, A);
  assert.equal((await api('POST', `/api/sub/milestones/${phases()[2].id}/start`, {}, HS)).status, 409, 'cannot skip ahead to a later, unfunded phase');
  assert.equal((await api('POST', `/api/sub/milestones/${phases()[1].id}/start`, { lat: 40.7, lng: -74 }, HS)).status, 200);
  // cannot submit without a photo or without the lien waiver
  assert.equal((await api('POST', `/api/sub/milestones/${phases()[1].id}/submit`, { waiver: true }, HS)).status, 400);
  const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
  assert.equal((await api('PUT', `/api/sub/milestones/${phases()[1].id}/photo`, null, { ...HS, 'Content-Type': 'image/jpeg' }, jpg)).status, 200);
  assert.equal((await api('PUT', `/api/sub/milestones/${phases()[1].id}/photo`, null, { ...HS, 'Content-Type': 'image/jpeg' }, Buffer.from('not an image'))).status, 400);
  assert.equal((await api('POST', `/api/sub/milestones/${phases()[1].id}/submit`, { waiver: false }, HS)).status, 400);
  assert.equal((await api('POST', `/api/sub/milestones/${phases()[1].id}/submit`, { waiver: true, notes: 'Demo done' }, HS)).status, 200);
  assert.equal(phases()[2].status, 'invoiced', 'submitting a phase invoices the next payment');
  assert.equal(all('SELECT * FROM ledger').length, 0, 'nothing is paid before the customer approves');
  // customer sees the evidence, then approves -> payout created with the % fee withheld
  const pub = (await api('GET', `/api/quote/${q}`)).body;
  assert.equal(pub.milestones.find((m) => m.seq === 2).photos, 1);
  assert.equal((await api('GET', `/api/quote/${q}/milestones/${phases()[1].id}/photo/0`)).status, 200);
  assert.equal((await api('POST', `/api/quote/${q}/milestones/${phases()[1].id}/approve`, {})).status, 200);
  const m2 = phases()[1];
  assert.equal(m2.status, 'released');
  const payout2 = get("SELECT * FROM ledger WHERE type='sub_payout'"), fee2 = get("SELECT * FROM ledger WHERE type='platform_fee'");
  assert.equal(payout2.amount, m2.sub_net); assert.equal(fee2.amount, m2.fee_amount);
  assert.ok(Math.abs(m2.sub_net + m2.fee_amount - m2.sub_gross) < 0.005);
  assert.equal(payout2.status, 'due', 'no Stripe Connect account yet: payout waits, but is recorded');
  assert.equal((await api('POST', `/api/quote/${q}/milestones/${phases()[1].id}/approve`, {})).status, 409, 'cannot approve (or pay out) twice');
});

test('disputes freeze the payout; auto-approval after silence; job completes after the final release', async () => {
  const dbm = require('../server/db'), MS = require('../server/milestones');
  const post = get('SELECT * FROM job_posts LIMIT 1');
  const HS = await subLogin(get('SELECT email FROM subcontractors WHERE id=?', post.awarded_to).email);
  const q = get('SELECT token FROM quotes LIMIT 1').token;
  const phases = () => all('SELECT * FROM milestones ORDER BY seq');
  const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
  const doPhase = async (seq) => {
    const id = phases()[seq - 1].id;
    await api('POST', `/api/admin/milestones/${id}/mark-funded`, {}, A);
    assert.equal((await api('POST', `/api/sub/milestones/${id}/start`, {}, HS)).status, 200);
    await api('PUT', `/api/sub/milestones/${id}/photo`, null, { ...HS, 'Content-Type': 'image/jpeg' }, jpg);
    assert.equal((await api('POST', `/api/sub/milestones/${id}/submit`, { waiver: true }, HS)).status, 200);
    return id;
  };
  // phase 3: customer disputes -> nothing is paid, and auto-approval does not override a dispute
  const id3 = await doPhase(3);
  assert.equal((await api('POST', `/api/quote/${q}/milestones/${id3}/dispute`, { reason: 'x' })).status, 400);
  assert.equal((await api('POST', `/api/quote/${q}/milestones/${id3}/dispute`, { reason: 'Tile is cracked in two places' })).status, 200);
  dbm.run("UPDATE milestones SET submitted_at=datetime('now','-10 days') WHERE id=?", id3);
  MS.autoApproveTick();
  assert.equal(phases()[2].status, 'disputed');
  assert.equal(all("SELECT * FROM ledger WHERE type='sub_payout'").length, 1);
  await api('POST', `/api/admin/milestones/${id3}/resolve`, { action: 'rework' }, A);
  assert.equal(phases()[2].status, 'in_progress');
  await api('PUT', `/api/sub/milestones/${id3}/photo`, null, { ...HS, 'Content-Type': 'image/jpeg' }, jpg);
  assert.equal((await api('POST', `/api/sub/milestones/${id3}/submit`, { waiver: true }, HS)).status, 200);
  // customer stays silent -> auto-approved after AUTO_APPROVE_HOURS
  dbm.run("UPDATE milestones SET submitted_at=datetime('now','-4 days') WHERE id=?", id3);
  MS.autoApproveTick();
  assert.equal(phases()[2].status, 'released'); assert.equal(phases()[2].approved_by, 'auto');
  // phases 4 and 5 (final retainage) -> job completes
  for (const seq of [4, 5]) { const id = await doPhase(seq); await api('POST', `/api/quote/${q}/milestones/${id}/approve`, {}); }
  assert.equal(get('SELECT status FROM jobs LIMIT 1').status, 'complete');
  const net = all("SELECT amount FROM ledger WHERE type='sub_payout'").reduce((a, r) => a + r.amount, 0);
  const fee = all("SELECT amount FROM ledger WHERE type='platform_fee'").reduce((a, r) => a + r.amount, 0);
  assert.ok(Math.abs(net + fee - post.payout) < 0.02, 'sub net + fee withheld = the full award, to the cent');
  assert.ok(Math.abs(fee - post.flat_fee) < 0.02, `fee withheld ${fee} = ${post.fee_pct}% of award`);
  const total = JSON.parse(get('SELECT result FROM quotes LIMIT 1').result).totals.total;
  assert.ok(all('SELECT * FROM milestones').every((m) => m.funded_at), 'every phase was funded before it was paid out');
  assert.ok(Math.abs(all('SELECT customer_amount c FROM milestones').reduce((a, m) => a + m.c, 0) - total) < 0.005, 'customer milestones sum to the contract price');
});

test('service area: out-of-area leads are kept but not booked or called; NJ zip is accepted', async () => {
  const out = await api('POST', '/api/leads', { name: 'Cali Person', phone: '3105550188', zip: '94110', service: 'Roofing', propertyType: 'Residential', consent: true });
  assert.equal(out.body.outOfArea, true);
  assert.equal(get('SELECT status FROM leads WHERE id=?', out.body.leadId).status, 'out_of_area');
  assert.equal((await api('POST', '/api/book', { leadId: out.body.leadId, key: out.body.key, start: new Date(Date.now() + 5 * 86400000).toISOString() })).status, 409);
  const nj = await api('POST', '/api/leads', { name: 'Jersey Person', phone: '2015550177', zip: '07030', service: 'Siding', propertyType: 'Residential', consent: true });
  assert.equal(nj.body.outOfArea, false);
});
