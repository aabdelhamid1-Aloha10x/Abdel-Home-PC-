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

test('quote: phase plan is built from the price book; customer sees plan and budget, never cost', async () => {
  const cat = (await api('GET', '/api/admin/catalog', null, A)).body;
  const cab = cat.find((c) => c.name.startsWith('Cabinets')), top = cat.find((c) => c.name.startsWith('Countertop')), flo = cat.find((c) => c.name.startsWith('Flooring'));
  const items = [cab, top, flo].map((c, i) => ({ category: c.category, description: c.name, unit: c.unit, qty: [60, 120, 600][i], material_unit_cost: c.material_unit_cost, labor_hours_per_unit: c.labor_hours_per_unit, waste_pct: c.waste_pct }));
  const settings = { margin_pct: 0.2, tax_pct: 0 };   // margin here is the market contractor margin that sets the budget ceiling
  const prev = await api('POST', '/api/admin/quotes/preview', { items, settings, phase_options: { maxPhaseDays: 5, maxPhasePct: 0.25 } }, A);
  assert.equal(prev.status, 200);
  assert.ok(prev.body.phase_plan.phases.length >= 4, 'several short phases');
  assert.ok(Math.abs(prev.body.phase_plan.phases.reduce((a, p) => a + p.weight, 0) - 1) < 1e-5);
  assert.equal((await api('POST', '/api/admin/quotes', { leadId, title: 'Kitchen', items: [], settings }, A)).status, 400, 'a quote needs lines to plan phases');
  const c = await api('POST', '/api/admin/quotes', { leadId, visitId: quote.visitId, title: 'Kitchen remodel', scope_summary: 'Cabinets, counters and flooring', items, settings, phase_options: { maxPhaseDays: 5, maxPhasePct: 0.25 } }, A);
  assert.equal(c.status, 201); quote = c.body; qtoken = quote.token;
  assert.equal((await api('GET', `/api/quote/${qtoken}`)).status, 404, 'drafts are not public');
  assert.equal((await api('POST', `/api/admin/quotes/${quote.id}/send`, {}, A)).status, 200);
  const pub = (await api('GET', `/api/quote/${qtoken}`)).body;
  assert.equal(pub.stage, 'plan');
  assert.ok(!/margin|gross_profit|material_unit_cost|labor_hours|"cost"|"price"/.test(JSON.stringify(pub)), 'no internal cost or per-line pricing reaches the customer');
  assert.equal(pub.budget, JSON.parse(quote.result).totals.total);
  assert.ok(pub.phases.every((p) => p.days > 0 && p.share_pct > 0) && pub.total_days > 0);
});

test('customer approves the plan: auction opens at the budget ceiling; no contract yet', async () => {
  assert.equal((await api('POST', `/api/quote/${qtoken}/approve-plan`, { name: 'J', agree: false })).status, 400);
  const r = await api('POST', `/api/quote/${qtoken}/approve-plan`, { name: 'Jane Smith', agree: true, hours: 48 });
  assert.equal(r.status, 201);
  const post = get('SELECT * FROM job_posts LIMIT 1'), job = get('SELECT * FROM jobs LIMIT 1');
  assert.equal(post.status, 'open'); assert.equal(job.status, 'bidding');
  assert.equal(post.ceiling, JSON.parse(quote.result).totals.total);
  assert.ok(new Date(post.closes_at) > new Date(Date.now() + 47 * 3600000));
  assert.equal(get('SELECT COUNT(*) c FROM contracts').c, 0, 'no contract exists until the customer accepts a winning bid');
  assert.equal((await api('POST', `/api/quote/${qtoken}/approve-plan`, { name: 'Jane Smith', agree: true })).status, 409);
  assert.equal((await api('PUT', `/api/admin/quotes/${quote.id}`, { items: [] }, A)).status, 409, 'approved plan is locked');
  assert.equal((await api('GET', `/api/quote/${qtoken}`)).body.stage, 'bidding');
});

const dbm = () => require('../server/db');
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


test('bidding board: no customer identity; ineligible subs are blocked with a reason', async () => {
  assert.equal((await api('POST', '/api/sub/signup', mkSub({ company: 'Bee Kitchens', email: 'bee@k.com' }))).status, 201);
  const HA = await subLogin('al@ace.com');
  const board = (await api('GET', '/api/sub/jobs', null, HA)).body;
  assert.equal(board.length, 1);
  assert.ok(!/Jane|Smith|jane@x|12 Main|5550134|415|deposit|margin/i.test(JSON.stringify(board)), 'board never leaks the customer');
  assert.match(JSON.stringify(board), /"area":"100xx"/);
  assert.equal(board[0].eligible, false, 'pending, unsubscribed sub cannot bid yet');
  assert.ok(board[0].reasons.some((r) => /not approved/.test(r)) && board[0].reasons.some((r) => /subscription/.test(r)));
  assert.equal((await api('POST', `/api/sub/jobs/${board[0].id}/bid`, { amount: 5000, days: 10 }, HA)).status, 403);
  await activate('al@ace.com'); await activate('bee@k.com');
  // wrong trade / lapsed insurance / wrong state
  await api('POST', '/api/sub/signup', mkSub({ company: 'Top Roofers', email: 'r@roof.com', trades: ['roofing'] })); await activate('r@roof.com');
  const rb = (await api('GET', '/api/sub/jobs', null, await subLogin('r@roof.com'))).body[0];
  assert.ok(rb.reasons.some((r) => /Needs kitchen/.test(r)));
  assert.equal((await api('POST', `/api/sub/jobs/${rb.id}/bid`, { amount: 5000, days: 10 }, await subLogin('r@roof.com'))).status, 403);
  await api('POST', '/api/sub/signup', mkSub({ company: 'Lapsed Co', email: 'l@lapsed.com' })); const lid = await activate('l@lapsed.com');
  dbm().run("UPDATE subcontractors SET insurance_expires='2021-01-01' WHERE id=?", lid);
  assert.ok((await api('GET', '/api/sub/jobs', null, await subLogin('l@lapsed.com'))).body[0].reasons.some((r) => /insurance has expired/.test(r)));
  await api('POST', '/api/sub/signup', mkSub({ company: 'Jersey Kitchens', email: 'nj@k.com', states: ['NJ'] })); await activate('nj@k.com');
  assert.ok((await api('GET', '/api/sub/jobs', null, await subLogin('nj@k.com'))).body[0].reasons.some((r) => /do not cover NY/.test(r)));
});

test('auction rules: ceiling, floor, must beat the best bid, own bids only go down, live view', async () => {
  const HA = await subLogin('al@ace.com'), HB = await subLogin('bee@k.com');
  const post = get('SELECT * FROM job_posts LIMIT 1'), bid = (H, b) => api('POST', `/api/sub/jobs/${post.id}/bid`, b, H);
  assert.equal((await bid(HA, { amount: post.ceiling + 1, days: 10 })).status, 400);
  assert.equal((await bid(HA, { amount: post.ceiling * 0.5, days: 10 })).status, 400, 'below the floor is rejected');
  assert.equal((await bid(HA, { amount: post.ceiling * 0.9, days: 0 })).status, 400);
  const a1 = Math.round(post.ceiling * 0.9 * 100) / 100;
  const r1 = await bid(HA, { amount: a1, days: 12, note: 'Licensed, 15 years' });
  assert.equal(r1.status, 200); assert.equal(r1.body.view.my_bid.leading, true); assert.equal(r1.body.view.bid_count, 1);
  const rb = await bid(HB, { amount: a1, days: 10 });
  assert.equal(rb.status, 400); assert.match(rb.body.error, /Beat the current best bid/);
  const view = (await api('GET', '/api/sub/jobs', null, HB)).body[0];
  assert.equal(view.current_low, a1); assert.equal(view.bid_count, 1); assert.equal(view.my_bid, null);
  assert.ok(view.min_next_bid < a1);
  const b1 = view.min_next_bid;
  assert.equal((await bid(HB, { amount: b1, days: 9 })).status, 200);
  assert.equal((await api('GET', '/api/sub/jobs', null, HA)).body[0].my_bid.leading, false, 'A has been outbid');
  assert.equal((await bid(HA, { amount: a1 + 10, days: 12 })).status, 400, 'a sub can only lower their own bid');
  assert.equal((await bid(HA, { amount: a1 - 1, days: 12 })).status, 400, 'a new bid must beat the leader by the minimum decrement');
  const a2 = (await api('GET', '/api/sub/jobs', null, HA)).body[0].min_next_bid;
  assert.equal((await bid(HA, { amount: a2, days: 11 })).status, 200);
  assert.equal(get('SELECT COUNT(*) c FROM bids').c, 2, 'one live bid per sub');
});

test('anti-sniping: a bid in the last minutes extends the clock, up to the limit', async () => {
  const HB = await subLogin('bee@k.com'), post = () => get('SELECT * FROM job_posts LIMIT 1');
  const soon = new Date(Date.now() + 5 * 60000).toISOString();
  dbm().run('UPDATE job_posts SET closes_at=? WHERE id=?', soon, post().id);
  const nb = (await api('GET', '/api/sub/jobs', null, HB)).body[0].min_next_bid;
  assert.equal((await api('POST', `/api/sub/jobs/${post().id}/bid`, { amount: nb, days: 8 }, HB)).status, 200);
  assert.equal(post().extensions, 1);
  assert.equal(new Date(post().closes_at).getTime(), new Date(soon).getTime() + 15 * 60000, 'clock moved out by 15 minutes');
  dbm().run('UPDATE job_posts SET extensions=4, closes_at=? WHERE id=?', soon, post().id);
  const nb2 = (await api('GET', '/api/sub/jobs', null, HB)).body[0].min_next_bid;
  await api('POST', `/api/sub/jobs/${post().id}/bid`, { amount: nb2, days: 8 }, HB);
  assert.equal(post().extensions, 4, 'no endless extensions'); assert.equal(post().closes_at, soon);
});

test('auction closes: lowest bid gets the offer; the sub is NOT committed until the customer signs and funds', async () => {
  const MP = require('../server/marketplace'), post = () => get('SELECT * FROM job_posts LIMIT 1');
  dbm().run("UPDATE job_posts SET closes_at=datetime('now','-1 minute') WHERE id=?", post().id);
  MP.auctionTick();
  const p = post(), low = get('SELECT * FROM bids ORDER BY amount ASC LIMIT 1');
  assert.equal(p.status, 'pending_acceptance'); assert.equal(p.winning_bid_id, low.id); assert.equal(p.payout, low.amount);
  assert.equal(get('SELECT assigned_type FROM jobs LIMIT 1').assigned_type, 'unassigned', 'not committed yet');
  const HW = await subLogin(get('SELECT email FROM subcontractors WHERE id=?', low.sub_id).email);
  assert.equal((await api('GET', '/api/sub/my-jobs', null, HW)).body.length, 0, 'winner sees no customer details yet');
  assert.equal((await api('GET', '/api/sub/my-bids', null, HW)).body[0].status, 'offered');
  assert.equal((await api('POST', `/api/sub/jobs/${p.id}/bid`, { amount: low.amount - 5, days: 5 }, HW)).status, 403, 'bidding is closed');
  const pub = (await api('GET', `/api/quote/${qtoken}`)).body;
  assert.equal(pub.stage, 'offer'); assert.equal(pub.offer.amount, low.amount);
  assert.ok(pub.offer.below_budget_pct > 0);
  assert.match(pub.contract_preview, new RegExp(get('SELECT name FROM subcontractors WHERE id=?', low.sub_id).name));
  assert.match(pub.contract_preview, /NOT authorized/);
  assert.ok(pub.offer.schedule.length >= 4);
});

test('customer declines: the runner-up gets the offer; each bid is binding', async () => {
  const before = get('SELECT * FROM job_posts LIMIT 1'), runnerUp = get("SELECT * FROM bids WHERE status='active' ORDER BY amount ASC LIMIT 1");
  assert.ok(runnerUp);
  const r = await api('POST', `/api/quote/${qtoken}/decline-award`, {});
  assert.equal(r.status, 200); assert.equal(r.body.next_offer, true);
  const after = get('SELECT * FROM job_posts LIMIT 1');
  assert.equal(after.winning_bid_id, runnerUp.id); assert.equal(after.payout, runnerUp.amount); assert.ok(after.payout > before.payout);
  assert.equal(get('SELECT status FROM bids WHERE id=?', before.winning_bid_id).status, 'declined');
});

test('customer accepts: contract is with the winning contractor; phase 1 funded BEFORE the sub is committed', async () => {
  const post = get('SELECT * FROM job_posts LIMIT 1'), sub = get('SELECT * FROM subcontractors WHERE id=?', get('SELECT sub_id FROM bids WHERE id=?', post.winning_bid_id).sub_id);
  const sig = 'data:image/png;base64,iVBORw0KGgo=';
  assert.equal((await api('POST', `/api/quote/${qtoken}/accept-award`, { name: 'Jane Smith', agree: true })).status, 400, 'needs a signature');
  const s = await api('POST', `/api/quote/${qtoken}/accept-award`, { name: 'Jane Smith', agree: true, signature: sig });
  assert.equal(s.status, 201);
  assert.equal((await api('POST', `/api/quote/${qtoken}/accept-award`, { name: 'Jane Smith', agree: true, signature: sig })).status, 409);
  const c = get('SELECT * FROM contracts'), ms = all('SELECT * FROM milestones ORDER BY seq');
  assert.equal(c.sub_id, sub.id); assert.match(c.text, new RegExp(sub.name)); assert.match(c.text, /RIGHT TO CANCEL/); assert.match(c.text, /marketplace and payment administrator/);
  assert.equal(c.deposit_amount, ms[0].customer_amount, 'the deposit is phase 1');
  assert.ok(Math.abs(ms.reduce((a, m) => a + m.customer_amount, 0) - post.payout) < 0.005, 'customer phases add up to the winning bid');
  assert.ok(Math.abs(ms.reduce((a, m) => a + m.sub_gross, 0) - post.payout) < 0.005);
  assert.equal(ms[0].status, 'invoiced'); assert.ok(ms.slice(1).every((m) => m.status === 'scheduled'));
  // FUNDED BEFORE COMMITTED
  assert.equal(get('SELECT assigned_type FROM jobs LIMIT 1').assigned_type, 'unassigned');
  assert.equal(get('SELECT status FROM job_posts LIMIT 1').status, 'pending_acceptance');
  assert.equal((await api('GET', `/api/quote/${qtoken}`)).body.stage, 'awaiting_funding');
  await api('POST', `/api/admin/milestones/${ms[0].id}/mark-funded`, {}, A);
  const p2 = get('SELECT * FROM job_posts LIMIT 1'), job = get('SELECT * FROM jobs LIMIT 1');
  assert.equal(p2.status, 'awarded'); assert.equal(p2.awarded_to, sub.id);
  assert.equal(job.assigned_type, 'subcontractor'); assert.equal(job.subcontractor_id, sub.id); assert.equal(job.status, 'rescission_period');
  assert.equal(get("SELECT COUNT(*) c FROM bids WHERE status='won'").c, 1);
  assert.equal(get("SELECT COUNT(*) c FROM bids WHERE status='declined'").c, 1, 'the bid the customer declined stays declined');
  assert.equal(get("SELECT sub_id FROM bids WHERE status='won'").sub_id, sub.id);
  assert.equal(get('SELECT status FROM leads WHERE id=?', leadId).status, 'won');
  const HW = await subLogin(sub.email);
  const mine = (await api('GET', '/api/sub/my-jobs', null, HW)).body;
  assert.equal(mine[0].customer.name, 'Jane Smith', 'customer details unlock only for the confirmed contractor');
  assert.equal(mine[0].can_start, false);
});

test('money flow: no-pay-no-work, proof + waiver, approval, fee withheld from each payout', async () => {
  const I = require('../server/integrations');
  const post = get('SELECT * FROM job_posts LIMIT 1'), job = get('SELECT * FROM jobs LIMIT 1');
  const HS = await subLogin(get('SELECT email FROM subcontractors WHERE id=?', post.awarded_to).email);
  const phases = () => all('SELECT * FROM milestones ORDER BY seq');
  const q = get('SELECT token FROM quotes LIMIT 1').token;
  const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
  // phase 1 is funded, but the customer's cancellation window is still open
  assert.equal(phases()[0].status, 'funded');
  assert.equal((await api('POST', `/api/sub/milestones/${phases()[0].id}/start`, {}, HS)).status, 409);
  dbm().run("UPDATE contracts SET rescission_ends=datetime('now','-1 day')");
  I.releaseRescissionTick();
  assert.equal(get('SELECT status FROM jobs LIMIT 1').status, 'ready');
  // NO PAY, NO WORK: phase 2 is not invoiced/funded; skipping ahead is refused
  let r = await api('POST', `/api/sub/milestones/${phases()[1].id}/start`, {}, HS);
  assert.equal(r.status, 409); assert.match(r.body.error, /not funded/);
  // phase 1: start, proof, waiver, submit
  assert.equal((await api('POST', `/api/sub/milestones/${phases()[0].id}/start`, { lat: 40.7, lng: -74 }, HS)).status, 200);
  assert.equal((await api('POST', `/api/sub/milestones/${phases()[0].id}/submit`, { waiver: true }, HS)).status, 400, 'photo required');
  assert.equal((await api('PUT', `/api/sub/milestones/${phases()[0].id}/photo`, null, { ...HS, 'Content-Type': 'image/jpeg' }, jpg)).status, 200);
  assert.equal((await api('PUT', `/api/sub/milestones/${phases()[0].id}/photo`, null, { ...HS, 'Content-Type': 'image/jpeg' }, Buffer.from('not an image'))).status, 400);
  assert.equal((await api('POST', `/api/sub/milestones/${phases()[0].id}/submit`, { waiver: false }, HS)).status, 400, 'lien waiver required');
  assert.equal((await api('POST', `/api/sub/milestones/${phases()[0].id}/submit`, { waiver: true, notes: 'Prep done' }, HS)).status, 200);
  assert.equal(phases()[1].status, 'invoiced', 'submitting a phase invoices the next one');
  assert.equal(all('SELECT * FROM ledger').length, 0, 'nothing is paid before the customer approves');
  const pub = (await api('GET', `/api/quote/${q}`)).body;
  assert.equal(pub.stage, 'contract'); assert.equal(pub.milestones[0].photos, 1);
  assert.equal((await api('GET', `/api/quote/${q}/milestones/${phases()[0].id}/photo/0`)).status, 200);
  assert.equal((await api('POST', `/api/quote/${q}/milestones/${phases()[0].id}/approve`, {})).status, 200);
  const m1 = phases()[0];
  assert.equal(m1.status, 'released');
  const payout1 = get("SELECT * FROM ledger WHERE type='sub_payout'"), fee1 = get("SELECT * FROM ledger WHERE type='platform_fee'");
  assert.equal(payout1.amount, m1.sub_net); assert.equal(fee1.amount, m1.fee_amount);
  assert.ok(Math.abs(m1.sub_net + m1.fee_amount - m1.sub_gross) < 0.005);
  assert.equal((await api('POST', `/api/quote/${q}/milestones/${phases()[0].id}/approve`, {})).status, 409, 'cannot double-pay');
  assert.equal((await api('POST', `/api/sub/milestones/${phases()[2].id}/start`, {}, HS)).status, 409, 'cannot skip ahead to an unfunded phase');
});

test('disputes freeze the payout; auto-approval after silence; the job completes after the final release', async () => {
  const MS = require('../server/milestones');
  const post = get('SELECT * FROM job_posts LIMIT 1');
  const HS = await subLogin(get('SELECT email FROM subcontractors WHERE id=?', post.awarded_to).email);
  const q = get('SELECT token FROM quotes LIMIT 1').token, phases = () => all('SELECT * FROM milestones ORDER BY seq');
  const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
  const doPhase = async (seq) => {
    const id = phases()[seq - 1].id;
    await api('POST', `/api/admin/milestones/${id}/mark-funded`, {}, A);   // the customer pays BEFORE the phase starts
    assert.equal((await api('POST', `/api/sub/milestones/${id}/start`, {}, HS)).status, 200);
    await api('PUT', `/api/sub/milestones/${id}/photo`, null, { ...HS, 'Content-Type': 'image/jpeg' }, jpg);
    assert.equal((await api('POST', `/api/sub/milestones/${id}/submit`, { waiver: true }, HS)).status, 200);
    return id;
  };
  const id2 = await doPhase(2);
  assert.equal((await api('POST', `/api/quote/${q}/milestones/${id2}/dispute`, { reason: 'x' })).status, 400);
  assert.equal((await api('POST', `/api/quote/${q}/milestones/${id2}/dispute`, { reason: 'Cabinet doors are misaligned' })).status, 200);
  dbm().run("UPDATE milestones SET submitted_at=datetime('now','-10 days') WHERE id=?", id2);
  MS.autoApproveTick();
  assert.equal(phases()[1].status, 'disputed', 'auto-approval never overrides a dispute');
  assert.equal(all("SELECT * FROM ledger WHERE type='sub_payout'").length, 1);
  await api('POST', `/api/admin/milestones/${id2}/resolve`, { action: 'rework' }, A);
  assert.equal(phases()[1].status, 'in_progress');
  await api('PUT', `/api/sub/milestones/${id2}/photo`, null, { ...HS, 'Content-Type': 'image/jpeg' }, jpg);
  assert.equal((await api('POST', `/api/sub/milestones/${id2}/submit`, { waiver: true }, HS)).status, 200);
  dbm().run("UPDATE milestones SET submitted_at=datetime('now','-4 days') WHERE id=?", id2);
  MS.autoApproveTick();
  assert.equal(phases()[1].status, 'released'); assert.equal(phases()[1].approved_by, 'auto');
  for (let seq = 3; seq <= phases().length; seq++) { const id = await doPhase(seq); await api('POST', `/api/quote/${q}/milestones/${id}/approve`, {}); }
  assert.equal(get('SELECT status FROM jobs LIMIT 1').status, 'complete');
  const net = all("SELECT amount FROM ledger WHERE type='sub_payout'").reduce((a, r) => a + r.amount, 0);
  const fee = all("SELECT amount FROM ledger WHERE type='platform_fee'").reduce((a, r) => a + r.amount, 0);
  assert.ok(Math.abs(net + fee - post.payout) < 0.02, 'sub net + fee withheld = the full winning bid, to the cent');
  assert.ok(Math.abs(fee - post.payout * 0.05) < 0.02, `fee withheld ${fee} = 5% of the bid`);
  assert.ok(all('SELECT * FROM milestones').every((m) => m.funded_at), 'every phase was funded before it was paid out');
});

test('auction edge cases: no bids, admin re-opens, expired offer moves on; customer fee is itemized and withheld', async () => {
  const MP = require('../server/marketplace'), HB = await subLogin('bee@k.com');
  const mkAuction = async (phone) => {
    const lead = (await api('POST', '/api/admin/leads', { name: 'Pat Q', phone, zip: '10002', service: 'Kitchen remodel', propertyType: 'Residential', consent: true }, A)).body;
    const cat = (await api('GET', '/api/admin/catalog', null, A)).body, cab = cat.find((c) => c.name.startsWith('Cabinets'));
    const items = [{ category: cab.category, description: cab.name, unit: cab.unit, qty: 30, material_unit_cost: cab.material_unit_cost, labor_hours_per_unit: cab.labor_hours_per_unit, waste_pct: 0 }];
    const quote = (await api('POST', '/api/admin/quotes', { leadId: lead.id, title: 'Kitchen', scope_summary: 'Cabinets', items, settings: { margin_pct: 0.2 } }, A)).body;
    await api('POST', `/api/admin/quotes/${quote.id}/send`, {}, A);
    await api('POST', `/api/quote/${quote.token}/approve-plan`, { name: 'Pat Quinn', agree: true, hours: 24 });
    return { token: quote.token, post: get('SELECT * FROM job_posts ORDER BY id DESC LIMIT 1') };
  };
  const { token: tk, post } = await mkAuction('6465550100');
  dbm().run("UPDATE job_posts SET closes_at=datetime('now','-1 minute') WHERE id=?", post.id);
  MP.auctionTick();
  assert.equal(get('SELECT status FROM job_posts WHERE id=?', post.id).status, 'no_bids');
  assert.equal((await api('GET', `/api/quote/${tk}`)).body.stage, 'no_bids');
  // admin tunes the auction (customer fee 3%, tighter ceiling) and re-opens it
  assert.equal((await api('PATCH', `/api/admin/posts/${post.id}`, { fee_pct: 40 }, A)).status, 400);
  assert.equal((await api('PATCH', `/api/admin/posts/${post.id}`, { customer_fee_pct: 3, extend_hours: 24 }, A)).status, 200);
  assert.equal(get('SELECT status FROM job_posts WHERE id=?', post.id).status, 'open');
  const bidAmount = Math.round(post.ceiling * 0.85 * 100) / 100;
  assert.equal((await api('POST', `/api/sub/jobs/${post.id}/bid`, { amount: bidAmount, days: 14 }, HB)).status, 200);
  dbm().run("UPDATE job_posts SET closes_at=datetime('now','-1 minute') WHERE id=?", post.id);
  MP.auctionTick();
  assert.equal(get('SELECT status FROM job_posts WHERE id=?', post.id).status, 'pending_acceptance');
  const offer = (await api('GET', `/api/quote/${tk}`)).body.offer;
  assert.ok(Math.abs(offer.platform_fee - bidAmount * 0.03) < 0.02, 'customer fee is shown as its own line');
  assert.ok(Math.abs(offer.customer_total - bidAmount * 1.03) < 0.02);
  // the customer lets the offer expire: it moves on and, with no other bidders, the auction has no winner
  dbm().run("UPDATE job_posts SET accept_deadline=datetime('now','-1 hour') WHERE id=?", post.id);
  MP.auctionTick();
  assert.equal(get('SELECT status FROM job_posts WHERE id=?', post.id).status, 'no_bids');
  assert.equal(get('SELECT status FROM bids WHERE post_id=?', post.id).status, 'expired');
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


test('service area: out-of-area leads are kept but not booked or called; NJ zip is accepted', async () => {
  const out = await api('POST', '/api/leads', { name: 'Cali Person', phone: '3105550188', zip: '94110', service: 'Roofing', propertyType: 'Residential', consent: true });
  assert.equal(out.body.outOfArea, true);
  assert.equal(get('SELECT status FROM leads WHERE id=?', out.body.leadId).status, 'out_of_area');
  assert.equal((await api('POST', '/api/book', { leadId: out.body.leadId, key: out.body.key, start: new Date(Date.now() + 5 * 86400000).toISOString() })).status, 409);
  const nj = await api('POST', '/api/leads', { name: 'Jersey Person', phone: '2015550177', zip: '07030', service: 'Siding', propertyType: 'Residential', consent: true });
  assert.equal(nj.body.outOfArea, false);
});
