'use strict';
const crypto = require('node:crypto');
const cfg = require('./config');
const { db, get, all, run, event, j } = require('./db');
const { token, sha256, safeEq, normPhone, zipState } = require('./util');
const { splitJob, r2 } = require('./settlement');
const MS = require('./milestones');
const { httpErr } = require('./leads');
const notify = require('./notify');

const TRADES = ['roofing', 'siding', 'gutters', 'concrete', 'bathroom', 'kitchen', 'interior', 'exterior', 'demolition', 'general', 'electrical', 'plumbing', 'hvac', 'commercial'];
const CATEGORY_TO_TRADE = { bathroom: 'bathroom', kitchen: 'kitchen', interior: 'interior', roofing: 'roofing', siding: 'siding', gutters: 'gutters', concrete: 'concrete' };
const parse = (s, d = null) => { try { return s == null ? d : JSON.parse(s); } catch { return d; } };
const csv = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);

// ---- accounts ---------------------------------------------------------------
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
}
function checkPassword(pw, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  return safeEq(crypto.scryptSync(pw, salt, 64).toString('hex'), hash);
}

function signup(d) {
  const email = String(d.email || '').trim().toLowerCase();
  const need = (c, m) => { if (!c) throw httpErr(400, m); };
  need(d.company && String(d.company).trim().length >= 2, 'Company name is required.');
  need(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email), 'A valid email is required.');
  need(String(d.password || '').length >= 10, 'Password must be at least 10 characters.');
  need(normPhone(d.phone).length >= 11, 'A valid phone number is required.');
  need(d.accept_terms === true, 'You must accept the subcontractor terms.');
  need(d.license_number || d.license_exempt === true, 'Enter your license/registration number, or confirm your trade needs none.');
  need(d.insurance_expires && new Date(d.insurance_expires) > new Date(), 'Liability insurance must be current.');
  const trades = (Array.isArray(d.trades) ? d.trades : csv(d.trades)).map((t) => String(t).toLowerCase()).filter((t) => TRADES.includes(t));
  need(trades.length, 'Pick at least one trade.');
  const states = (Array.isArray(d.states) ? d.states : csv(d.states)).map((x) => String(x).toUpperCase()).filter((x) => ['NY', 'NJ'].includes(x));
  need(states.length, 'Pick New York and/or New Jersey.');
  if (get('SELECT 1 FROM subcontractors WHERE email=?', email)) throw httpErr(409, 'An account with this email already exists.');
  const prefixes = csv(d.zip_prefixes).filter((x) => /^\d{3}$/.test(x)).join(',');
  const id = Number(run(`INSERT INTO subcontractors (name, contact_name, trade, phone, email, license, license_state, insurance_expires, states, zip_prefixes, password_hash, status, terms_accepted_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?, 'pending', datetime('now'))`,
  String(d.company).trim(), String(d.contact_name || '').trim(), trades.join(','), normPhone(d.phone), email, String(d.license_number || 'EXEMPT'),
  String(d.license_state || '').toUpperCase().slice(0, 2), d.insurance_expires, states.join(','), prefixes, hashPassword(String(d.password))).lastInsertRowid);
  event(null, 'sub_signup', { sub: id, company: d.company });
  return id;
}

function login(email, password) {
  const s = get('SELECT * FROM subcontractors WHERE email=? AND active=1', String(email || '').trim().toLowerCase());
  // Same work either way so response time doesn't reveal whether the email exists.
  const ok = checkPassword(String(password || ''), s?.password_hash || 'x:y');
  if (!s || !ok) throw httpErr(401, 'Wrong email or password.');
  const t = token(24);
  run('INSERT INTO sub_sessions (token_hash, sub_id, expires_at) VALUES (?,?,?)', sha256(t), s.id, new Date(Date.now() + 30 * 86400000).toISOString());
  return t;
}
function subFromToken(t) {
  if (!t) return null;
  const s = get('SELECT sub_id, expires_at FROM sub_sessions WHERE token_hash=?', sha256(String(t)));
  if (!s || new Date(s.expires_at) < new Date()) return null;
  return get('SELECT * FROM subcontractors WHERE id=? AND active=1', s.sub_id);
}
const publicSub = (s) => ({
  id: s.id, company: s.name, contact_name: s.contact_name, email: s.email, phone: s.phone, trades: csv(s.trade), states: csv(s.states), zip_prefixes: csv(s.zip_prefixes),
  license: s.license, license_state: s.license_state, insurance_expires: s.insurance_expires, status: s.status, subscription_status: s.subscription_status,
  has_coi: !!s.coi_path, monthly_price: cfg.marketplace.monthlyPrice, flat_fee: cfg.marketplace.flatFee,
});

// ---- eligibility ------------------------------------------------------------
function eligibility(sub, post) {
  const why = [];
  if (post.status !== 'open') why.push('This job is no longer open.');
  if (sub.status !== 'approved') why.push('Your account is not approved yet.');
  if (sub.subscription_status !== 'active') why.push('An active subscription is required to claim jobs.');
  if (!sub.insurance_expires || new Date(sub.insurance_expires) < new Date(new Date().toISOString().slice(0, 10))) why.push('Your liability insurance has expired. Update it.');
  const states = csv(sub.states);
  if (states.length && post.state && !states.includes(post.state)) why.push(`You do not cover ${post.state}.`);
  const pre = csv(sub.zip_prefixes);
  if (pre.length && post.zip && !pre.includes(String(post.zip).slice(0, 3))) why.push('Outside your service ZIP prefixes.');
  const mine = csv(sub.trade), need = parse(post.trades, []);
  if (!mine.includes('general') && !need.some((t) => mine.includes(t))) why.push(`Needs ${need.join('/')}; your trades: ${mine.join('/')}.`);
  return why;
}

// ---- posting a job to the board ----------------------------------------------
function tradesFor(items) {
  const set = new Set((items || []).map((i) => CATEGORY_TO_TRADE[String(i.category || '').toLowerCase()] || 'general'));
  return [...set];
}

// Subs see scope and an area, never the customer's name, contact, street address or the contract price.
function createPost(jobId, opts = {}) {
  const existing = get('SELECT * FROM job_posts WHERE job_id=?', jobId);
  if (existing) return existing;
  const job = get('SELECT * FROM jobs WHERE id=?', jobId);
  if (!job) throw httpErr(404, 'job not found');
  const quote = get('SELECT * FROM quotes WHERE id=?', job.quote_id);
  const lead = get('SELECT zip FROM leads WHERE id=?', job.lead_id);
  const contract = get('SELECT * FROM contracts WHERE quote_id=?', job.quote_id);
  const result = parse(quote.result), items = parse(quote.items, []);
  const visit = quote.visit_id ? get('SELECT rooms, preferences FROM visits WHERE id=?', quote.visit_id) : null;
  const trades = tradesFor(items), state = zipState(lead.zip);
  const scope = {
    summary: quote.scope_summary || '',
    items: result.lines.map((l) => ({ description: l.description, qty: l.qty, unit: l.unit })),
    rooms: parse(visit?.rooms, []).map((r) => ({ name: r.name, length: r.length, width: r.width, height: r.height, notes: r.notes })),
    preferences: visit?.preferences || '',
  };
  // Default award price = our direct cost + contingency (before our overhead and margin). Admin can edit.
  const payout = opts.payout ?? Math.round((result.totals.direct + result.totals.contingency) * 100) / 100;
  const feePct = opts.fee_pct ?? cfg.marketplace.feePct;
  if (!(feePct >= 0 && feePct <= 30)) throw httpErr(400, 'fee_pct must be between 0 and 30');
  const fee = r2(payout * feePct / 100);
  const id = Number(run(`INSERT INTO job_posts (job_id, trades, state, zip, title, scope, payout, flat_fee, fee_pct, payment_mode, start_after)
    VALUES (?,?,?,?,?,?,?,?,?,'platform_collects',?)`, jobId, j(trades), state, lead.zip, `${trades.join(' / ')} · ${state || '??'} ${String(lead.zip || '').slice(0, 3)}xx`, j(scope),
  payout, fee, feePct, contract?.rescission_ends || null).lastInsertRowid);
  event(job.lead_id, 'job_posted', { post: id, payout, fee_pct: feePct });
  return get('SELECT * FROM job_posts WHERE id=?', id);
}

function autoPost(jobId) {
  if (!cfg.marketplace.autoPublish) return null;
  try { return createPost(jobId); } catch (e) { event(null, 'auto_post_error', { jobId, message: e.message }); return null; }
}

function economics(post) {
  const job = get('SELECT * FROM jobs WHERE id=?', post.job_id);
  const q = get('SELECT result FROM quotes WHERE id=?', job.quote_id), t = parse(q.result).totals;
  return splitJob({ total: t.total, tax: t.tax, permit: t.permit, payout: post.payout, fee_pct: post.fee_pct });
}

// What a subcontractor is allowed to see on the board.
function boardView(post, sub) {
  const why = sub ? eligibility(sub, post) : [];
  return {
    id: post.id, title: post.title, trades: parse(post.trades, []), state: post.state, area: `${String(post.zip || '').slice(0, 3)}xx`, status: post.status,
    scope: parse(post.scope), payout: post.payout, fee_pct: post.fee_pct, fee: post.flat_fee, net_to_you: r2(post.payout - post.flat_fee), earliest_start: post.start_after, posted_at: post.posted_at, eligible: why.length === 0, reasons: why,
  };
}

// ---- claim (atomic: two subs racing for one job => exactly one winner) -------
function claim(subId, postId) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const sub = get('SELECT * FROM subcontractors WHERE id=?', subId);
    const post = get('SELECT * FROM job_posts WHERE id=?', postId);
    if (!post) throw httpErr(404, 'Job not found.');
    const why = eligibility(sub, post);
    if (why.length) throw httpErr(post.status !== 'open' ? 409 : 403, why[0]);
    // FUNDED BEFORE COMMITTED: the platform only commits to a subcontractor once the customer's deposit has cleared.
    if (!get('SELECT funded_at FROM milestones WHERE job_id=? AND seq=1', post.job_id)?.funded_at) throw httpErr(409, 'Customer funds are not secured yet.');
    const r = run("UPDATE job_posts SET status='awarded', awarded_to=?, awarded_at=datetime('now') WHERE id=? AND status='open'", subId, postId);
    if (Number(r.changes) !== 1) throw httpErr(409, 'Another subcontractor just took this job.');
    run("UPDATE jobs SET assigned_type='subcontractor', subcontractor_id=?, sub_cost=? WHERE id=?", subId, post.payout, post.job_id);
    MS.allocateForJob(post.job_id, post.payout, post.fee_pct);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  const post = get('SELECT * FROM job_posts WHERE id=?', postId), job = get('SELECT * FROM jobs WHERE id=?', post.job_id);
  event(job.lead_id, 'job_awarded', { post: postId, sub: subId });
  const c0 = get('SELECT rescission_ends FROM contracts WHERE quote_id=?', job.quote_id);
  if (c0 && new Date(c0.rescission_ends) <= new Date()) { const m2 = get('SELECT * FROM milestones WHERE job_id=? AND seq=2', post.job_id); if (m2) MS.invoice(m2); }
  return post;
}

// Full details only after the job is theirs.
function awardedView(post) {
  const job = get('SELECT * FROM jobs WHERE id=?', post.job_id);
  const lead = get('SELECT name, phone, email, address, zip FROM leads WHERE id=?', job.lead_id);
  const contract = get('SELECT rescission_ends, deposit_status FROM contracts WHERE quote_id=?', job.quote_id);
  const eco = economics(post);
  return {
    ...boardView(post, null), job_id: job.id, job_status: job.status, start_date: job.start_date,
    customer: lead, rescission_ends: contract?.rescission_ends, deposit_status: contract?.deposit_status,
    can_start: contract?.deposit_status === 'paid' && new Date(contract.rescission_ends) <= new Date(),
    milestones: MS.forJob(job.id).filter((m) => m.seq > 1).map((m) => ({ id: m.id, seq: m.seq, name: m.name, status: m.status, funded: !!m.funded_at, gross: m.sub_gross, fee: m.fee_amount, net: m.sub_net, photos: m.evidence_photos.length, dispute_reason: m.dispute_reason })),
    money: { your_net: eco.sub_net, fee: eco.fee, how: 'The platform collects from the customer and pays you per approved phase. The fee is withheld from each payout.' },
  };
}

module.exports = { TRADES, signup, login, subFromToken, publicSub, eligibility, createPost, autoPost, boardView, claim, awardedView, economics, csv };
