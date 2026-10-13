'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const cfg = require('./config');

fs.mkdirSync(path.join(cfg.dataDir, 'recordings'), { recursive: true });
fs.mkdirSync(path.join(cfg.dataDir, 'photos'), { recursive: true });

const db = new DatabaseSync(process.env.DB_FILE || path.join(cfg.dataDir, 'app.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY, created_at TEXT NOT NULL DEFAULT (datetime('now')),
  name TEXT, phone TEXT, email TEXT, zip TEXT, address TEXT,
  service TEXT, property_type TEXT, timeline TEXT, details TEXT,
  source TEXT NOT NULL DEFAULT 'website',          -- website | meta | google | voice | manual
  external_id TEXT, utm TEXT,
  consent_contact INTEGER NOT NULL DEFAULT 0, consent_text TEXT, consent_at TEXT,
  status TEXT NOT NULL DEFAULT 'new',              -- new|booked|visited|quoted|won|lost|dnc
  do_not_contact INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS leads_ext ON leads(source, external_id) WHERE external_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT, role TEXT NOT NULL DEFAULT 'tech', token TEXT UNIQUE NOT NULL, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY, lead_id INTEGER NOT NULL REFERENCES leads(id), staff_id INTEGER REFERENCES staff(id),
  starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled|done|cancelled|no_show
  recording_notice_sent INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY, lead_id INTEGER NOT NULL REFERENCES leads(id), appointment_id INTEGER REFERENCES appointments(id),
  staff_id INTEGER REFERENCES staff(id), created_at TEXT NOT NULL DEFAULT (datetime('now')),
  recording_consent INTEGER NOT NULL DEFAULT 0, consent_at TEXT, consent_by TEXT,
  audio_path TEXT, transcript TEXT, rooms TEXT NOT NULL DEFAULT '[]', preferences TEXT, photos TEXT NOT NULL DEFAULT '[]',
  scope TEXT, status TEXT NOT NULL DEFAULT 'open'   -- open|submitted
);
CREATE TABLE IF NOT EXISTS catalog (
  id INTEGER PRIMARY KEY, category TEXT NOT NULL, name TEXT NOT NULL, unit TEXT NOT NULL,
  material_unit_cost REAL NOT NULL DEFAULT 0, labor_hours_per_unit REAL NOT NULL DEFAULT 0, waste_pct REAL NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY, lead_id INTEGER NOT NULL REFERENCES leads(id), visit_id INTEGER REFERENCES visits(id),
  token TEXT UNIQUE NOT NULL, status TEXT NOT NULL DEFAULT 'draft', -- draft|sent|approved|declined|expired
  title TEXT, scope_summary TEXT, settings TEXT NOT NULL, items TEXT NOT NULL, result TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), sent_at TEXT, valid_until TEXT, approved_at TEXT
);
CREATE TABLE IF NOT EXISTS contracts (
  id INTEGER PRIMARY KEY, quote_id INTEGER UNIQUE NOT NULL REFERENCES quotes(id),
  text TEXT NOT NULL, text_sha256 TEXT NOT NULL, signer_name TEXT, signature TEXT, signed_at TEXT, signed_ip TEXT,
  deposit_amount REAL NOT NULL, deposit_status TEXT NOT NULL DEFAULT 'unpaid', stripe_session TEXT, deposit_paid_at TEXT,
  rescission_ends TEXT
);
CREATE TABLE IF NOT EXISTS subcontractors (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, trade TEXT, phone TEXT, email TEXT, license TEXT, insurance_expires TEXT, notes TEXT, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY, quote_id INTEGER UNIQUE NOT NULL REFERENCES quotes(id), lead_id INTEGER NOT NULL REFERENCES leads(id),
  assigned_type TEXT NOT NULL DEFAULT 'unassigned', subcontractor_id INTEGER REFERENCES subcontractors(id), sub_cost REAL,
  status TEXT NOT NULL DEFAULT 'awaiting_deposit', -- awaiting_deposit|rescission_period|ready|scheduled|in_progress|punch_list|complete
  start_date TEXT, notes TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS calls (
  id INTEGER PRIMARY KEY, lead_id INTEGER NOT NULL REFERENCES leads(id), created_at TEXT NOT NULL DEFAULT (datetime('now')),
  provider_id TEXT, outcome TEXT, summary TEXT, mode TEXT NOT NULL DEFAULT 'live'
);
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY, created_at TEXT NOT NULL DEFAULT (datetime('now')), lead_id INTEGER, channel TEXT NOT NULL,
  to_addr TEXT, subject TEXT, body TEXT, status TEXT NOT NULL DEFAULT 'queued', error TEXT
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY, ts TEXT NOT NULL DEFAULT (datetime('now')), lead_id INTEGER, type TEXT NOT NULL, data TEXT
);
CREATE INDEX IF NOT EXISTS events_lead ON events(lead_id);
`);

function addCol(table, col, def) {
  if (!db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
}
// Subcontractor marketplace: subs become self-serve platform accounts.
[['password_hash', 'TEXT'], ['contact_name', 'TEXT'], ['states', "TEXT NOT NULL DEFAULT ''"], ['zip_prefixes', "TEXT NOT NULL DEFAULT ''"],
 ['license_state', 'TEXT'], ['status', "TEXT NOT NULL DEFAULT 'approved'"], ['subscription_status', "TEXT NOT NULL DEFAULT 'none'"],
 ['stripe_customer_id', 'TEXT'], ['stripe_subscription_id', 'TEXT'], ['coi_path', 'TEXT'], ['terms_accepted_at', 'TEXT'],
 ['created_at', "TEXT NOT NULL DEFAULT (datetime('now'))"]].forEach(([c, d]) => addCol('subcontractors', c, d));
db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS subs_email ON subcontractors(email) WHERE email <> '';
CREATE TABLE IF NOT EXISTS sub_sessions (token_hash TEXT PRIMARY KEY, sub_id INTEGER NOT NULL REFERENCES subcontractors(id), expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS job_posts (
  id INTEGER PRIMARY KEY, job_id INTEGER UNIQUE NOT NULL REFERENCES jobs(id), status TEXT NOT NULL DEFAULT 'open', -- open|awarded|closed
  trades TEXT NOT NULL, state TEXT, zip TEXT, title TEXT, scope TEXT NOT NULL,
  payout REAL NOT NULL, flat_fee REAL NOT NULL, payment_mode TEXT NOT NULL, start_after TEXT,
  posted_at TEXT NOT NULL DEFAULT (datetime('now')), awarded_to INTEGER REFERENCES subcontractors(id), awarded_at TEXT
);
CREATE TABLE IF NOT EXISTS ledger (
  id INTEGER PRIMARY KEY, ts TEXT NOT NULL DEFAULT (datetime('now')), sub_id INTEGER REFERENCES subcontractors(id), job_id INTEGER REFERENCES jobs(id),
  type TEXT NOT NULL,   -- job_fee | sub_remittance_due (sub owes us) | sub_payout_due (we owe sub)
  amount REAL NOT NULL, status TEXT NOT NULL DEFAULT 'due', note TEXT   -- due|billed|settled|void
);
`);

const j = (v) => JSON.stringify(v ?? null);
function event(leadId, type, data) {
  db.prepare('INSERT INTO events (lead_id, type, data) VALUES (?,?,?)').run(leadId ?? null, type, j(data));
}
const get = (sql, ...p) => db.prepare(sql).get(...p);
const all = (sql, ...p) => db.prepare(sql).all(...p);
const run = (sql, ...p) => db.prepare(sql).run(...p);

module.exports = { db, get, all, run, event, j };
