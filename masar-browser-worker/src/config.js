// Worker configuration. Everything comes from the environment. Credentials are read only at login time and never logged.
export const SELECTORS = {
  origin: "#originInput", dho: "#dhoInput", destination: "#destInput", dhd: "#dhdInput",
  equipment: "#equipTextInput", loadType: "#typeSelect", length: "#lengthInput", weight: "#weightInput",
  startDate: "#startDateInput", endDate: "#endDateInput", search: "#searchBtn", results: "#loadsTableBody",
};

/** ACCOUNTS="<account uuid>=<SECRET_PREFIX>,<account uuid>=<SECRET_PREFIX>" (prefix as in browser_search_accounts.secret_prefix). */
export function parseAccounts(s) {
  return String(s ?? "").split(",").map((x) => x.trim()).filter(Boolean).map((x) => {
    const [id, prefix] = x.split("=").map((y) => y.trim());
    if (!/^[0-9a-f-]{36}$/i.test(id ?? "") || !/^[A-Z][A-Z0-9_]{2,40}$/.test(prefix ?? "")) throw new Error(`Bad ACCOUNTS entry: ${x.replace(/=.*/, "=…")}`);
    return { id, prefix };
  });
}

export function loadConfig(env = process.env) {
  const need = (k) => { if (!env[k]) throw new Error(`Missing env ${k}`); return env[k]; };
  const appUrl = need("APP_URL").replace(/\/+$/, "");
  return {
    appUrl,
    secret: need("BROWSER_WORKER_SECRET"),
    workerId: env.WORKER_ID ?? `worker-${Math.random().toString(36).slice(2, 8)}`,
    accounts: parseAccounts(need("ACCOUNTS")),
    loginUrl: env.DATEXPERT_LOGIN_URL ?? "https://datexpert.app/login",
    searchUrl: env.DATEXPERT_SEARCH_URL ?? "",          // optional: page that holds the search form
    dateFormat: env.DATE_FORMAT ?? "MM/DD/YYYY",        // format the site's readonly date inputs expect
    stateDir: env.STATE_DIR ?? "./state",               // saved browser sessions (cookies), mode 0600
    pollMs: Number(env.POLL_MS ?? 7000),
    minGapMs: Number(env.MIN_GAP_MS ?? 8000),           // minimum gap between two searches on one account
    jobTimeoutMs: Number(env.JOB_TIMEOUT_MS ?? 240000), // must stay under the 5 minute lease
    headless: env.HEADFUL !== "1",
    chromePath: env.CHROME_PATH || undefined,
    selectors: { ...SELECTORS },
  };
}

export const credentialsFor = (prefix, env = process.env) => {
  const username = env[`${prefix}_USERNAME`], password = env[`${prefix}_PASSWORD`];
  if (!username || !password) throw new Error(`Credentials for ${prefix} are not set on this host`);
  return { username, password };
};
