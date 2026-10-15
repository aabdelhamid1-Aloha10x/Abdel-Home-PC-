// Calls the Masar app's /api/public/hooks/browser-worker endpoint. Only lease, complete and fail exist.
export function makeApi(cfg, fetchImpl = fetch) {
  async function post(body) {
    const res = await fetchImpl(`${cfg.appUrl}/api/public/hooks/browser-worker`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cfg.secret}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(j?.error ?? `HTTP ${res.status}`); e.status = res.status; throw e; }
    return j;
  }
  return {
    lease: (accountId) => post({ action: "lease", accountId, workerId: cfg.workerId }).then((r) => r.job),
    complete: (job, rows, truncated) => post({ action: "complete", jobId: job.id, token: job.token, filtersHash: job.filtersHash, truncated, rows }),
    fail: (job, error, pause) => post({ action: "fail", jobId: job.id, token: job.token, error: String(error).slice(0, 300), pause }),
  };
}
