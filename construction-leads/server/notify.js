'use strict';
// Every outbound message is recorded in `outbox`. It is actually sent only when the
// provider keys are configured, so development never texts a real customer by accident.
const cfg = require('./config');
const { run, get } = require('./db');

async function send({ leadId = null, channel, to, subject = null, body }) {
  if (!to) return null;
  const id = Number(run('INSERT INTO outbox (lead_id, channel, to_addr, subject, body) VALUES (?,?,?,?,?)', leadId, channel, to, subject, body).lastInsertRowid);
  try {
    if (channel === 'sms' && cfg.twilio.sid) {
      const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cfg.twilio.sid}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: 'Basic ' + Buffer.from(`${cfg.twilio.sid}:${cfg.twilio.token}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ To: to, From: cfg.twilio.from, Body: body }),
      });
      if (!r.ok) throw new Error(`twilio ${r.status}`);
      run("UPDATE outbox SET status='sent' WHERE id=?", id);
    } else if (channel === 'email' && cfg.resend.apiKey) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${cfg.resend.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: cfg.resend.from, to: [to], subject, text: body }),
      });
      if (!r.ok) throw new Error(`resend ${r.status}`);
      run("UPDATE outbox SET status='sent' WHERE id=?", id);
    } else {
      run("UPDATE outbox SET status='logged_only' WHERE id=?", id);
    }
  } catch (err) {
    run("UPDATE outbox SET status='error', error=? WHERE id=?", String(err.message), id);
  }
  return id;
}

// Respect opt-outs. Call this instead of send() for anything customer-facing.
async function toLead(leadId, { sms, email, subject }) {
  const l = get('SELECT * FROM leads WHERE id=?', leadId);
  if (!l || l.do_not_contact) return;
  if (sms && l.phone && l.consent_contact) await send({ leadId, channel: 'sms', to: l.phone, body: sms });
  if (email && l.email) await send({ leadId, channel: 'email', to: l.email, subject: subject || cfg.company.name, body: email });
}

module.exports = { send, toLead };
