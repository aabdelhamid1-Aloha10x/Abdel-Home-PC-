'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cfg = require('./config');
const { get, all, run, event, j } = require('./db');
const { tzParts, inServiceArea } = require('./util');
const { leadKey, firstName } = require('./leads');
const notify = require('./notify');

// ---- Voice agent dispatcher ------------------------------------------------
const inCallWindow = () => {
  const h = tzParts(new Date(), cfg.company.tz).h;
  return h >= cfg.voice.callHours[0] && h < cfg.voice.callHours[1];
};

async function placeCall(lead) {
  const v = cfg.voice;
  const dyn = {
    company_name: cfg.company.name, lead_name: firstName(lead), service: lead.service || 'a renovation project',
    property_type: lead.property_type || 'property', zip: lead.zip || '', service_area: cfg.company.state || 'your area',
    office_phone: cfg.company.phone, quote_turnaround: '48 hours', lead_id: String(lead.id),
  };
  if (!v.apiKey || !v.agentId || !v.phoneNumberId) {
    run("INSERT INTO calls (lead_id, mode, outcome) VALUES (?, 'dry_run', 'not_configured')", lead.id);
    event(lead.id, 'voice_call_dry_run', dyn);
    return;
  }
  const r = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
    method: 'POST', headers: { 'xi-api-key': v.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: v.agentId, agent_phone_number_id: v.phoneNumberId, to_number: lead.phone, conversation_initiation_client_data: { dynamic_variables: dyn } }),
  });
  const body = await r.json().catch(() => ({}));
  run('INSERT INTO calls (lead_id, provider_id, outcome) VALUES (?,?,?)', lead.id, body.conversation_id || null, r.ok ? 'dialing' : `error_${r.status}`);
  event(lead.id, 'voice_call_placed', { ok: r.ok, conversation_id: body.conversation_id });
}

// Runs every minute. Calls only consented, un-booked, reachable leads inside calling hours.
async function followUpTick() {
  const v = cfg.voice;
  const due = all(`
    SELECT l.* FROM leads l
    WHERE l.status='new' AND l.do_not_contact=0 AND l.phone<>'' AND l.created_at <= datetime('now', ?)
      AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.lead_id=l.id AND a.status='scheduled')
      AND (SELECT COUNT(*) FROM calls c WHERE c.lead_id=l.id) < ?
      AND NOT EXISTS (SELECT 1 FROM calls c WHERE c.lead_id=l.id AND c.created_at > datetime('now', ?))
    LIMIT 20`, `-${v.waitMinutes} minutes`, v.maxAttempts, `-${v.retryHours} hours`);
  for (const lead of due) {
    if (!lead.consent_contact) {
      // Ad-form leads haven't consented to automated calls: send the booking link once, flag for a human.
      if (!get("SELECT 1 FROM events WHERE lead_id=? AND type='needs_human_call'", lead.id)) event(lead.id, 'needs_human_call', { reason: 'no automated-call consent' });
      continue;
    }
    if (!inServiceArea(lead.zip)) continue;
    if (!inCallWindow()) continue;
    await placeCall(lead).catch((e) => event(lead.id, 'voice_call_error', { message: e.message }));
  }
}

// ---- Stripe deposit --------------------------------------------------------
async function createDepositCheckout(quote, contract, lead) {
  if (!cfg.stripe.secretKey) return null;
  const amount = Math.round(contract.deposit_amount * 100);
  const q = new URLSearchParams({
    mode: 'payment', 'payment_method_types[0]': 'us_bank_account', 'payment_method_types[1]': 'card',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(amount),
    'line_items[0][price_data][product_data][name]': `Phase 1: ${quote.title || 'Renovation'}`,
    'line_items[0][quantity]': '1',
    success_url: `${cfg.publicUrl}/quote.html?t=${quote.token}&paid=1`, cancel_url: `${cfg.publicUrl}/quote.html?t=${quote.token}`,
    client_reference_id: String(contract.id), 'metadata[contract_id]': String(contract.id),
  });
  if (lead.email) q.set('customer_email', lead.email);
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST', headers: { Authorization: `Bearer ${cfg.stripe.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: q,
  });
  const body = await r.json();
  if (!r.ok) throw new Error(body.error?.message || `stripe ${r.status}`);
  run('UPDATE contracts SET stripe_session=? WHERE id=?', body.id, contract.id);
  return body.url;
}

function markDepositPaid(contractId, via) {
  const c = get('SELECT * FROM contracts WHERE id=?', contractId);
  if (!c || c.deposit_status === 'paid') return c;
  run("UPDATE contracts SET deposit_status='paid', deposit_paid_at=datetime('now') WHERE id=?", contractId);
  const m1 = get('SELECT id FROM milestones WHERE job_id=(SELECT id FROM jobs WHERE quote_id=?) AND seq=1', c.quote_id);
  if (m1) require('./milestones').markFunded(m1.id, via);
  const quote = get('SELECT * FROM quotes WHERE id=?', c.quote_id);
  // Work cannot start until the cancellation window closes, even if the deposit is already in.
  run("UPDATE leads SET status='won' WHERE id=?", quote.lead_id);
  event(quote.lead_id, 'deposit_paid', { contract: contractId, amount: c.deposit_amount, via });
  // Phase 1 has CLEARED: only now do we go find a contractor (funded before committed).
  const job = get('SELECT id FROM jobs WHERE quote_id=?', c.quote_id);
  if (job) { try { require('./marketplace').createAuction(job.id); } catch (e) { event(quote.lead_id, 'auction_open_error', { message: e.message }); } }
  return get('SELECT * FROM contracts WHERE id=?', contractId);
}

function releaseRescissionTick() {
  const due = all(`SELECT j.id, j.lead_id FROM jobs j JOIN contracts c ON c.quote_id=j.quote_id
                   WHERE j.status='rescission_period' AND c.rescission_ends <= ?`, new Date().toISOString());
  for (const x of due) {
    run("UPDATE jobs SET status='ready' WHERE id=?", x.id); event(x.lead_id, 'job_ready', {});
  }
}

// ---- Subcontractor subscription + per-job fee (Stripe) ------------------------
const stripeForm = async (path, params) => {
  const r = await fetch('https://api.stripe.com/v1' + path, { method: 'POST', headers: { Authorization: `Bearer ${cfg.stripe.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params) });
  const body = await r.json();
  if (!r.ok) throw new Error(body.error?.message || `stripe ${r.status}`);
  return body;
};

async function createSubCheckout(sub) {
  if (!cfg.stripe.secretKey) return null;
  const params = {
    mode: 'subscription', 'payment_method_types[0]': 'card',
    'line_items[0][price_data][currency]': 'usd', 'line_items[0][price_data][unit_amount]': String(Math.round(cfg.marketplace.monthlyPrice * 100)),
    'line_items[0][price_data][recurring][interval]': 'month', 'line_items[0][price_data][product_data][name]': `${cfg.company.name} subcontractor network`,
    'line_items[0][quantity]': '1', customer_email: sub.email, client_reference_id: String(sub.id), 'metadata[sub_id]': String(sub.id),
    'subscription_data[metadata][sub_id]': String(sub.id),
    success_url: `${cfg.publicUrl}/sub.html?subscribed=1`, cancel_url: `${cfg.publicUrl}/sub.html`,
  };
  if (sub.stripe_customer_id) { delete params.customer_email; params.customer = sub.stripe_customer_id; }
  return (await stripeForm('/checkout/sessions', params)).url;
}

// Pay a released phase to the subcontractor's connected Stripe account.
async function payoutToSub(sub, ledgerRow) {
  if (!cfg.stripe.secretKey || !sub.stripe_account_id) return false;
  const t = await stripeForm('/transfers', { amount: String(Math.round(ledgerRow.amount * 100)), currency: 'usd', destination: sub.stripe_account_id, description: ledgerRow.note.slice(0, 200), 'metadata[ledger_id]': String(ledgerRow.id) });
  run("UPDATE ledger SET status='settled', note=note || ? WHERE id=?", ` [transfer ${t.id}]`, ledgerRow.id);
  return true;
}
async function payDueTransfers() {
  for (const row of all("SELECT * FROM ledger WHERE type='sub_payout' AND status='due'")) {
    const sub = get('SELECT * FROM subcontractors WHERE id=?', row.sub_id);
    try { await payoutToSub(sub, row); } catch (e) { event(null, 'payout_error', { ledger: row.id, message: e.message }); }
  }
}
async function connectOnboardingLink(sub) {
  if (!cfg.stripe.secretKey) return null;
  let id = sub.stripe_account_id;
  if (!id) {
    id = (await stripeForm('/accounts', { type: 'express', country: 'US', email: sub.email, 'capabilities[transfers][requested]': 'true', business_type: 'company', 'metadata[sub_id]': String(sub.id) })).id;
    run('UPDATE subcontractors SET stripe_account_id=? WHERE id=?', id, sub.id);
  }
  return (await stripeForm('/account_links', { account: id, type: 'account_onboarding', refresh_url: `${cfg.publicUrl}/sub.html`, return_url: `${cfg.publicUrl}/sub.html` })).url;
}

// Customer pays a milestone through the platform: ACH preferred (cheap on big amounts), card allowed.
async function createMilestoneCheckout(quote, milestone, lead) {
  if (!cfg.stripe.secretKey) return null;
  const q = new URLSearchParams({
    mode: 'payment', 'payment_method_types[0]': 'us_bank_account', 'payment_method_types[1]': 'card',
    'line_items[0][price_data][currency]': 'usd', 'line_items[0][price_data][unit_amount]': String(Math.round(milestone.customer_amount * 100)),
    'line_items[0][price_data][product_data][name]': `${quote.title || 'Renovation'}: ${milestone.name}`, 'line_items[0][quantity]': '1',
    success_url: `${cfg.publicUrl}/quote.html?t=${quote.token}&paid=1`, cancel_url: `${cfg.publicUrl}/quote.html?t=${quote.token}`,
    client_reference_id: `m${milestone.id}`, 'metadata[milestone_id]': String(milestone.id),
  });
  if (lead.email) q.set('customer_email', lead.email);
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${cfg.stripe.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: q });
  const body = await r.json();
  if (!r.ok) throw new Error(body.error?.message || `stripe ${r.status}`);
  run('UPDATE milestones SET stripe_session=? WHERE id=?', body.id, milestone.id);
  return body.url;
}

// ---- Site visit: transcription + scope extraction --------------------------
async function transcribe(filePath) {
  if (!cfg.voice.apiKey) return null;
  const fd = new FormData();
  fd.set('model_id', 'scribe_v1');
  fd.set('diarize', 'true');
  fd.set('file', await fs.openAsBlob(filePath), path.basename(filePath));
  const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': cfg.voice.apiKey }, body: fd });
  if (!r.ok) throw new Error(`transcription ${r.status}`);
  const body = await r.json();
  return body.text || null;
}

// Turns the recording + measurements into suggested quote lines drawn from the price book.
async function extractScope({ lead, transcript, rooms, preferences }) {
  if (!cfg.anthropic.apiKey) return null;
  const catalog = all('SELECT id, category, name, unit FROM catalog WHERE active=1');
  const prompt = `You assist a construction estimator. From the site-visit transcript, measurements and notes, produce a JSON scope.
Only use catalog_id values from the catalog. Quantities must come from the measurements or explicit statements; if a quantity is unknown, use null and add it to "open_questions". Never invent prices.

Customer request: ${lead.service} (${lead.property_type})
Measurements (rooms, feet): ${JSON.stringify(rooms)}
Estimator notes / preferences: ${preferences || ''}
Transcript:
${(transcript || '').slice(0, 60000)}

Catalog: ${JSON.stringify(catalog)}

Return ONLY JSON: {"summary": string, "style_preferences": string[], "budget_hint": string|null, "timeline": string|null, "red_flags": string[], "open_questions": string[], "suggested_items": [{"catalog_id": number, "qty": number|null, "reason": string}], "custom_items": [{"description": string, "qty": number|null, "unit": string}]}`;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'x-api-key': cfg.anthropic.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: cfg.anthropic.model, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!r.ok) throw new Error(`extraction ${r.status}`);
  const body = await r.json();
  const text = body.content?.map((c) => c.text || '').join('') || '';
  const m = text.match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : null;
}

module.exports = { createSubCheckout, payoutToSub, payDueTransfers, connectOnboardingLink, createMilestoneCheckout, followUpTick, placeCall, createDepositCheckout, markDepositPaid, releaseRescissionTick, transcribe, extractScope, inCallWindow };
