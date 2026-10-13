'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Tiny .env loader (no dependency). Real environment variables win.
try {
  const f = path.join(__dirname, '..', '.env');
  if (fs.existsSync(f)) {
    for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch { /* ignore */ }

const e = process.env;
const crypto = require('node:crypto');
const adminToken = e.ADMIN_TOKEN || crypto.randomBytes(12).toString('hex');

module.exports = {
  port: Number(e.PORT || 3000),
  publicUrl: (e.PUBLIC_URL || `http://localhost:${e.PORT || 3000}`).replace(/\/$/, ''),
  dataDir: e.DATA_DIR || path.join(__dirname, '..', 'data'),
  adminToken,
  adminTokenGenerated: !e.ADMIN_TOKEN,
  company: {
    name: e.COMPANY_NAME || '[Company Name] Construction',
    phone: e.COMPANY_PHONE || '(000) 000-0000',
    tz: e.COMPANY_TZ || 'America/New_York',
    state: e.COMPANY_STATE || '',
    license: e.COMPANY_LICENSE || '[License #]',
  },
  // Booking: estimate visits are 90 minutes, on the hour grid, within these hours (company local time).
  booking: { openHour: 8, closeHour: 18, slotMinutes: 90, days: [1, 2, 3, 4, 5, 6], horizonDays: 14, minLeadHours: 4 },
  meta: { verifyToken: e.META_VERIFY_TOKEN || '', appSecret: e.META_APP_SECRET || '', pageToken: e.META_PAGE_TOKEN || '' },
  google: { leadKey: e.GOOGLE_LEAD_KEY || '' },
  voice: {
    apiKey: e.ELEVENLABS_API_KEY || '', agentId: e.ELEVENLABS_AGENT_ID || '',
    phoneNumberId: e.ELEVENLABS_PHONE_NUMBER_ID || '', toolSecret: e.VOICE_TOOL_SECRET || '',
    waitMinutes: Number(e.VOICE_WAIT_MINUTES || 5), maxAttempts: 3, retryHours: 4,
    callHours: [8, 20],
  },
  anthropic: { apiKey: e.ANTHROPIC_API_KEY || '', model: e.ANTHROPIC_MODEL || 'claude-sonnet-5-5' },
  stripe: { secretKey: e.STRIPE_SECRET_KEY || '', webhookSecret: e.STRIPE_WEBHOOK_SECRET || '' },
  twilio: { sid: e.TWILIO_ACCOUNT_SID || '', token: e.TWILIO_AUTH_TOKEN || '', from: e.TWILIO_FROM || '' },
  resend: { apiKey: e.RESEND_API_KEY || '', from: e.EMAIL_FROM || '' },
};
