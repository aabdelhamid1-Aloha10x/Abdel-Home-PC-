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
    state: e.COMPANY_STATE || 'NY',
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
  marketplace: {
    monthlyPrice: Number(e.SUB_MONTHLY_PRICE || 55),       // subscription, $/month
    feePct: Number(e.SUB_FEE_PCT || 5),                    // % of the sub's award price, withheld from each payout; adjustable per job
    autoApproveHours: Number(e.AUTO_APPROVE_HOURS || 72),  // customer silence after a submitted phase = approval
    customerFeePct: Number(e.CUSTOMER_FEE_PCT || 0),       // optional fee ADDED to the customer's price (itemized as platform + payment protection)
    acqCostEstimate: Number(e.ACQ_COST_ESTIMATE || 3000),  // PLACEHOLDER: your real ad + estimator cost per signed job; used only to flag unprofitable fee settings
    auctionHours: Number(e.AUCTION_HOURS || 48),           // default bidding window
    acceptHours: Number(e.ACCEPT_HOURS || 72),             // customer time to accept the winning bid before it moves to the next bidder
    antiSnipeMinutes: 15, maxExtensions: 4,                // a bid in the last 15 minutes extends the auction, up to 4 times
    sealed: e.AUCTION_SEALED === '1',                      // sealed = bidders can't see the current best bid
    autoPublish: e.AUTO_PUBLISH_JOBS !== '0',              // post to the board as soon as the deposit clears
  },
  stripe: { secretKey: e.STRIPE_SECRET_KEY || '', webhookSecret: e.STRIPE_WEBHOOK_SECRET || '' },
  twilio: { sid: e.TWILIO_ACCOUNT_SID || '', token: e.TWILIO_AUTH_TOKEN || '', from: e.TWILIO_FROM || '' },
  resend: { apiKey: e.RESEND_API_KEY || '', from: e.EMAIL_FROM || '' },
};
