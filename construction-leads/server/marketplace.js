'use strict';
const crypto = require('node:crypto');
const cfg = require('./config');
const { db, get, all, run, event, j } = require('./db');
const { token, sha256, safeEq, normPhone, zipState } = require('./util');
const { splitJob, r2 } = require('./settlement');
const { planPhases } = require('./phases');
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
  has_coi: !!s.coi_path, monthly_price: cfg.marketplace.monthlyPrice, fee_pct: cfg.marketplace.feePct,
});

// ---- eligibility ------------------------------------------------------------
function eligibility(sub, post) {
  const why = [];
  if (post.status !== 'open' || new Date(post.closes_at) <= new Date()) why.push('Bidding on this job has closed.');
  if (sub.status !== 'approved') why.push('Your account is not approved yet.');
  if (sub.subscription_status !== 'active') why.push('An active subscription is required to bid.');
  if (!sub.insurance_expires || new Date(sub.insurance_expires) < new Date(new Date().toISOString().slice(0, 10))) why.push('Your liability insurance has expired. Update it.');
  const states = csv(sub.states);
  if (states.length && post.state && !states.includes(post.state)) why.push(`You do not cover ${post.state}.`);
  const pre = csv(sub.zip_prefixes);
  if (pre.length && post.zip && !pre.includes(String(post.zip).slice(0, 3))) why.push('Outside your service ZIP prefixes.');
  const mine = csv(sub.trade), need = parse(post.trades, []);
  if (!mine.includes('general') && !need.some((t) => mine.includes(t))) why.push(`Needs ${need.join('/')}; your trades: ${mine.join('/')}.`);
  return why;
}

// ---- opening the auction (after the customer signed and phase 1 CLEARED) -----------
function tradesFor(items) {
  const set = new Set((items || []).map((i) => CATEGORY_TO_TRADE[String(i.category || '').toLowerCase()] || 'general'));
  return [...set];
}

// Contractors see scope, phases and an area, never the customer's name, contact, street address OR the price they pay us.
// The ceiling they bid under is our customer price minus the minimum spread; they never see the customer price.
function createAuction(jobId, opts = {}) {
  const existing = get('SELECT * FROM job_posts WHERE job_id=?', jobId);
  if (existing) return existing;
  const job = get('SELECT * FROM jobs WHERE id=?', jobId);
  if (!job) throw httpErr(404, 'job not found');
  const quote = get('SELECT * FROM quotes WHERE id=?', job.quote_id);
  const lead = get('SELECT zip FROM leads WHERE id=?', job.lead_id);
  const result = parse(quote.result), items = parse(quote.items, []);
  const visit = quote.visit_id ? get('SELECT rooms, preferences FROM visits WHERE id=?', quote.visit_id) : null;
  const phases = parse(quote.phases) || planPhases(result.lines).phases;
  const trades = tradesFor(items), state = zipState(lead.zip);
  const studio = parse(quote.studio);
  const scope = {
    summary: quote.scope_summary || '',
    items: result.lines.map((l) => ({ description: l.description, qty: l.qty, unit: l.unit })),
    phases: phases.map((p) => ({ seq: p.seq, name: p.name, days: p.days, share_pct: Math.round(p.weight * 1000) / 10, lines: p.lines })),
    rooms: parse(visit?.rooms, []).map((r) => ({ name: r.name, length: r.length, width: r.width, height: r.height, notes: r.notes })),
    preferences: visit?.preferences || '',
    selections: studio?.selections_text || null,
  };
  const minSpread = opts.min_spread_pct ?? cfg.marketplace.minSpreadPct;
  if (!(minSpread >= 0 && minSpread <= 60)) throw httpErr(400, 'min_spread_pct must be between 0 and 60');
  const ceiling = r2(result.totals.total * (1 - minSpread / 100));
  const hours = Math.min(Math.max(Number(opts.hours) || cfg.marketplace.auctionHours, 12), 120);
  const closes = new Date(Date.now() + hours * 3600000).toISOString();
  const feePct = opts.fee_pct ?? cfg.marketplace.feePct;
  if (!(feePct >= 0 && feePct <= 30)) throw httpErr(400, 'fee_pct must be between 0 and 30');
  const id = Number(run(`INSERT INTO job_posts (job_id, trades, state, zip, title, scope, payout, flat_fee, fee_pct, customer_fee_pct, payment_mode, ceiling, opens_at, closes_at, sealed, status)
    VALUES (?,?,?,?,?,?,?,0,?,0,'platform_collects',?,?,?,?, 'open')`, jobId, j(trades), state, lead.zip, `${trades.join(' / ')} · ${state || '??'} ${String(lead.zip || '').slice(0, 3)}xx`, j(scope),
  ceiling, feePct, ceiling, new Date().toISOString(), closes, cfg.marketplace.sealed ? 1 : 0).lastInsertRowid);
  run("UPDATE jobs SET status='bidding' WHERE id=?", jobId);
  event(job.lead_id, 'auction_opened', { post: id, ceiling, closes_at: closes });
  return get('SELECT * FROM job_posts WHERE id=?', id);
}

// ---- bids -----------------------------------------------------------------------
const bidsOf = (postId) => all("SELECT * FROM bids WHERE post_id=? AND status='active' ORDER BY amount ASC, updated_at ASC, id ASC", postId);
const lowest = (postId) => bidsOf(postId)[0] || null;
const minNext = (post, low) => (low && !post.sealed ? Math.floor(low.amount * (1 - post.min_decrement_pct / 100) * 100) / 100 : post.ceiling);

function placeBid(subId, postId, { amount, days, note }) {
  db.exec('BEGIN IMMEDIATE');
  let post, bid;
  try {
    const sub = get('SELECT * FROM subcontractors WHERE id=?', subId);
    post = get('SELECT * FROM job_posts WHERE id=?', postId);
    if (!post) throw httpErr(404, 'Job not found.');
    const why = eligibility(sub, post);
    if (why.length) throw httpErr(403, why[0]);
    amount = r2(Number(amount)); days = Math.round(Number(days));
    if (!(amount > 0)) throw httpErr(400, 'Enter your bid amount.');
    if (!(days >= 1 && days <= 365)) throw httpErr(400, 'Enter how many working days you need (1-365).');
    if (amount > post.ceiling) throw httpErr(400, `Bids must be at or below the job budget of $${post.ceiling}.`);
    const floor = r2(post.ceiling * post.floor_pct / 100);
    if (amount < floor) throw httpErr(400, `Bids below $${floor} are rejected to protect quality and avoid change-order games.`);
    const mine = get('SELECT * FROM bids WHERE post_id=? AND sub_id=?', postId, subId);
    if (mine && amount >= mine.amount) throw httpErr(400, `A new bid must be lower than your current bid of $${mine.amount}.`);
    const low = lowest(postId);
    if (low && !post.sealed && amount > minNext(post, low)) throw httpErr(400, `Beat the current best bid: bid $${minNext(post, low)} or less.`);
    const n = String(note || '').slice(0, 500);
    if (mine) run("UPDATE bids SET amount=?, days=?, note=?, updated_at=datetime('now') WHERE id=?", amount, days, n, mine.id);
    else run('INSERT INTO bids (post_id, sub_id, amount, days, note) VALUES (?,?,?,?,?)', postId, subId, amount, days, n);
    // Anti-sniping: a bid in the final minutes extends the clock, so nobody wins by bidding at the last second.
    const left = new Date(post.closes_at).getTime() - Date.now();
    if (left <= cfg.marketplace.antiSnipeMinutes * 60000 && post.extensions < cfg.marketplace.maxExtensions) {
      run('UPDATE job_posts SET closes_at=?, extensions=extensions+1 WHERE id=?', new Date(new Date(post.closes_at).getTime() + cfg.marketplace.antiSnipeMinutes * 60000).toISOString(), postId);
    }
    bid = get('SELECT * FROM bids WHERE post_id=? AND sub_id=?', postId, subId);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  event(get('SELECT lead_id FROM jobs WHERE id=?', post.job_id).lead_id, 'bid_placed', { post: postId, sub: subId, amount });
  return { bid, post: get('SELECT * FROM job_posts WHERE id=?', postId) };
}

// What a contractor may see on the board. Identities of other bidders are never shown.
function boardView(post, sub) {
  const why = sub ? eligibility(sub, post) : [];
  const bids = bidsOf(post.id), low = bids[0] || null, mine = sub ? bids.find((b) => b.sub_id === sub.id) || null : null;
  return {
    id: post.id, title: post.title, trades: parse(post.trades, []), state: post.state, area: `${String(post.zip || '').slice(0, 3)}xx`, status: post.status,
    scope: parse(post.scope), ceiling: post.ceiling, fee_pct: post.fee_pct, closes_at: post.closes_at, extensions: post.extensions, sealed: !!post.sealed,
    bid_count: bids.length, current_low: post.sealed ? null : low?.amount ?? null,
    my_bid: mine ? { amount: mine.amount, days: mine.days, leading: !!low && low.id === mine.id && !post.sealed } : null,
    min_next_bid: minNext(post, low), floor: r2(post.ceiling * post.floor_pct / 100),
    eligible: why.length === 0, reasons: why, posted_at: post.opens_at,
  };
}

// ---- closing and AWARDING --------------------------------------------------------
// The customer already signed with the platform and paid phase 1 before bidding opened, so there is no customer acceptance
// step: the lowest eligible bid wins. The contractor's phase payouts are fixed against the customer's schedule right now.
function awardBid(post, bid) {
  const job = get('SELECT * FROM jobs WHERE id=?', post.job_id), contract = get('SELECT * FROM contracts WHERE quote_id=?', job.quote_id);
  const funded = get('SELECT funded_at FROM milestones WHERE job_id=? AND seq=1', post.job_id)?.funded_at;
  if (!funded) throw httpErr(409, 'Customer funds are not secured yet.');   // funded before committed
  db.exec('BEGIN IMMEDIATE');
  try {
    const r = run("UPDATE job_posts SET status='awarded', winning_bid_id=?, awarded_to=?, awarded_at=datetime('now'), payout=?, flat_fee=? WHERE id=? AND status IN ('open','no_bids')", bid.id, bid.sub_id, bid.amount, r2(bid.amount * post.fee_pct / 100), post.id);
    if (Number(r.changes) !== 1) throw httpErr(409, 'This auction has already been awarded.');
    run("UPDATE bids SET status='won' WHERE id=?", bid.id);
    run("UPDATE bids SET status='lost' WHERE post_id=? AND id<>? AND status='active'", post.id, bid.id);
    run("UPDATE jobs SET assigned_type='subcontractor', subcontractor_id=?, sub_cost=?, status=? WHERE id=?", bid.sub_id, bid.amount, contract && new Date(contract.rescission_ends) > new Date() ? 'rescission_period' : 'ready', post.job_id);
    MS.allocateForJob(post.job_id, bid.amount, post.fee_pct);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  const sub = get('SELECT * FROM subcontractors WHERE id=?', bid.sub_id);
  event(job.lead_id, 'job_awarded', { post: post.id, sub: bid.sub_id, amount: bid.amount });
  notify.send({ channel: 'email', to: sub.email, subject: 'You won the job', body: `Your bid of $${bid.amount.toFixed(2)} won. The customer has already funded phase 1. Open your portal for details. Do not start until the cancellation window closes.` }).catch(() => {});
  const q = get('SELECT token FROM quotes WHERE id=?', job.quote_id);
  notify.toLead(job.lead_id, {
    sms: `Good news: a licensed, insured contractor has been assigned to your project. See details and next steps: ${cfg.publicUrl}/quote.html?t=${q.token}`,
    email: `A licensed, insured contractor has been assigned to your project.\nSee who they are, the schedule and your payment steps: ${cfg.publicUrl}/quote.html?t=${q.token}`, subject: 'Your contractor is assigned',
  }).catch(() => {});
  return get('SELECT * FROM job_posts WHERE id=?', post.id);
}

function closeAuction(postId) {
  const post = get('SELECT * FROM job_posts WHERE id=?', postId);
  if (!post || post.status !== 'open') return post;
  const low = lowest(postId);
  if (!low) { run("UPDATE job_posts SET status='no_bids' WHERE id=?", postId); event(get('SELECT lead_id FROM jobs WHERE id=?', post.job_id).lead_id, 'auction_no_bids', { post: postId }); return get('SELECT * FROM job_posts WHERE id=?', postId); }
  return awardBid(post, low);
}

// Admin override: award a specific bidder instead of the lowest (e.g. better record at +2%).
function awardSpecific(postId, bidId) {
  const post = get('SELECT * FROM job_posts WHERE id=?', postId), bid = get("SELECT * FROM bids WHERE id=? AND post_id=? AND status='active'", bidId, postId);
  if (!post || !bid) throw httpErr(404, 'not found');
  if (!['open', 'no_bids'].includes(post.status)) throw httpErr(409, 'This auction cannot be awarded now.');
  return awardBid(post, bid);
}

function auctionTick() {
  for (const p of all("SELECT id FROM job_posts WHERE status='open' AND closes_at <= ?", new Date().toISOString())) {
    try { closeAuction(p.id); } catch (e) { event(null, 'auction_tick_error', { post: p.id, message: e.message }); }
  }
}

// ---- views for admin and the winning contractor ---------------------------------------
// Customer price for a job (what the customer pays us) and the profit estimate for a given payout.
const customerPrice = (post) => parse(get('SELECT q.result FROM job_posts p JOIN jobs j ON j.id=p.job_id JOIN quotes q ON q.id=j.quote_id WHERE p.id=?', post.id).result).totals.total;
function economics(post, payoutOverride) {
  return splitJob({ price: customerPrice(post), payout: payoutOverride ?? post.payout, fee_pct: post.fee_pct, acquisition_cost: cfg.marketplace.acqCostEstimate, risk_reserve_pct: cfg.marketplace.riskReservePct });
}

function awardedView(post) {
  const job = get('SELECT * FROM jobs WHERE id=?', post.job_id);
  const lead = get('SELECT name, phone, email, address, zip FROM leads WHERE id=?', job.lead_id);
  const contract = get('SELECT rescission_ends, deposit_status FROM contracts WHERE quote_id=?', job.quote_id);
  const fee = r2(post.payout * post.fee_pct / 100);
  return {
    id: post.id, title: post.title, trades: parse(post.trades, []), scope: parse(post.scope), payout: post.payout, fee_pct: post.fee_pct, fee,
    job_id: job.id, job_status: job.status, start_date: job.start_date,
    customer: lead, rescission_ends: contract?.rescission_ends, deposit_status: contract?.deposit_status,
    can_start: contract?.deposit_status === 'paid' && new Date(contract.rescission_ends) <= new Date(),
    milestones: MS.forJob(job.id).map((m) => ({ id: m.id, seq: m.seq, name: m.name, status: m.status, funded: !!m.funded_at, gross: m.sub_gross, fee: m.fee_amount, net: m.sub_net, photos: m.evidence_photos.length, dispute_reason: m.dispute_reason })),
    money: { your_net: r2(post.payout - fee), fee, how: 'The customer funds each phase through the platform before it starts. The platform pays you per approved phase, with the fee withheld.' },
  };
}

function myBids(subId) {
  return all('SELECT b.*, p.title, p.status post_status, p.closes_at, p.ceiling FROM bids b JOIN job_posts p ON p.id=b.post_id WHERE b.sub_id=? ORDER BY b.id DESC', subId)
    .map((b) => ({ id: b.id, post_id: b.post_id, title: b.title, amount: b.amount, days: b.days, status: b.status, post_status: b.post_status, closes_at: b.closes_at }));
}

module.exports = { TRADES, signup, login, subFromToken, publicSub, eligibility, createAuction, placeBid, boardView, closeAuction, awardSpecific, auctionTick, awardedView, economics, customerPrice, myBids, bidsOf, lowest, csv };
