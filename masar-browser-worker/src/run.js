// Worker loop: lease -> search -> complete/fail. One search at a time per account, one browser context per account.
import { chromium } from "playwright";
import { mkdirSync, existsSync, writeFileSync, chmodSync } from "node:fs";
import { loadConfig, credentialsFor } from "./config.js";
import { makeApi } from "./api.js";
import { ensureSearchPage, runSearch, AuthPause, pause } from "./dat.js";

const log = (...a) => console.log(new Date().toISOString(), ...a);

export async function openAccount(browser, cfg, acct) {
  mkdirSync(cfg.stateDir, { recursive: true, mode: 0o700 });
  const file = `${cfg.stateDir}/${acct.prefix}.json`;
  const ctx = await browser.newContext(existsSync(file) ? { storageState: file } : {});
  ctx.setDefaultTimeout(20000);
  return { ctx, file, page: await ctx.newPage() };
}

export async function handleJob(api, cfg, acct, job, session, creds, now = Date.now) {
  const started = now();
  try {
    let timer;
    const result = await Promise.race([
      (async () => { await ensureSearchPage(session.page, cfg, creds); return runSearch(session.page, cfg, job); })(),
      new Promise((_, rej) => { timer = setTimeout(() => rej(new Error("Job timed out")), cfg.jobTimeoutMs); }),
    ]).finally(() => clearTimeout(timer));
    await api.complete(job, result.rows, result.truncated);
    log(`job ${job.id} done rows=${result.rows.length} truncated=${result.truncated} ms=${now() - started}`);
    try { const st = await session.ctx.storageState(); writeFileSync(session.file, JSON.stringify(st), { mode: 0o600 }); chmodSync(session.file, 0o600); } catch {}
    return "done";
  } catch (e) {
    const paused = e instanceof AuthPause;
    log(`job ${job.id} ${paused ? "PAUSED" : "failed"}: ${String(e.message).slice(0, 120)}`);
    await api.fail(job, e.message, paused).catch((x) => log(`fail report rejected: ${x.message}`));
    return paused ? "paused" : "failed";
  }
}

export async function main(env = process.env) {
  const cfg = loadConfig(env);
  const api = makeApi(cfg);
  const browser = await chromium.launch({ headless: cfg.headless, executablePath: cfg.chromePath });
  const sessions = new Map(), last = new Map();
  let stop = false;
  for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => { stop = true; });
  log(`worker ${cfg.workerId} up, accounts=${cfg.accounts.length}`);
  while (!stop) {
    for (const acct of cfg.accounts) {
      if ((last.get(acct.id) && Date.now() - last.get(acct.id) < cfg.minGapMs)) continue;
      let job = null;
      try { job = await api.lease(acct.id); } catch (e) { log(`lease error: ${e.message}`); continue; }
      if (!job) continue;
      let creds;
      try { creds = credentialsFor(acct.prefix, env); } catch (e) { await api.fail(job, e.message, true).catch(() => {}); log(e.message); continue; }
      if (!sessions.has(acct.id)) sessions.set(acct.id, await openAccount(browser, cfg, acct));
      const out = await handleJob(api, cfg, acct, job, sessions.get(acct.id), creds);
      last.set(acct.id, Date.now());
      if (out === "paused") { await sessions.get(acct.id).ctx.close().catch(() => {}); sessions.delete(acct.id); }
      else if (out === "failed") { await sessions.get(acct.id).page.reload().catch(() => {}); }
    }
    await pause(cfg.pollMs);
  }
  await browser.close();
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message); process.exit(1); });
