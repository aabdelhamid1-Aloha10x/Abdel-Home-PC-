'use strict';
const crypto = require('node:crypto');

const normPhone = (p) => {
  const d = String(p || '').replace(/\D/g, '');
  if (d.length === 10) return '+1' + d;
  if (d.length === 11 && d[0] === '1') return '+' + d;
  return d ? '+' + d : '';
};
const token = (n = 24) => crypto.randomBytes(n).toString('hex');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const safeEq = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Local wall-clock parts for a Date in a given IANA timezone.
function tzParts(date, tz) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' });
  const o = {};
  for (const p of f.formatToParts(date)) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, min: +o.minute, wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday) };
}
// UTC instant for a local wall-clock time in tz (handles DST by iterating once).
function zonedToUtc(y, m, d, h, min, tz) {
  let guess = Date.UTC(y, m - 1, d, h, min);
  for (let i = 0; i < 2; i++) {
    const p = tzParts(new Date(guess), tz);
    const shown = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min);
    guess += Date.UTC(y, m - 1, d, h, min) - shown;
  }
  return new Date(guess);
}

// ZIP3 ranges: NJ 070-089, NY 100-149. (Good enough to route leads; not a USPS lookup.)
function zipState(zip) {
  const z = String(zip || '').replace(/\D/g, '').padStart(5, '0').slice(0, 5);
  if (String(zip || '').replace(/\D/g, '').length < 5) return '';
  const n = Number(z.slice(0, 3));
  if (n >= 70 && n <= 89) return 'NJ';
  if (n >= 100 && n <= 149) return 'NY';
  return '';
}
const inServiceArea = (zip) => !String(zip || '').trim() || ['NY', 'NJ'].includes(zipState(zip));

module.exports = { zipState, inServiceArea, normPhone, token, sha256, safeEq, esc, money, tzParts, zonedToUtc };
