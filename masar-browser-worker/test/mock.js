import http from "node:http";

/** Fake reseller site with the same element ids as the real one. mode: ok | captcha | badpass | nosel | twofa */
export function mockSite(mode = "ok") {
  const search = `<!doctype html><html><body><h1>Search</h1>
<input id="originInput"><input id="dhoInput"><input id="destInput"><input id="dhdInput">
<input id="equipTextInput" oninput="showOpts(this.value)"><div id="opts"></div>
<select id="typeSelect"><option>Full &amp; Partial</option><option>Full Only</option><option>Partial Only</option></select>
<input id="lengthInput"><input id="weightInput">
<input id="startDateInput" readonly placeholder="MM/DD/YYYY"><input id="endDateInput" readonly placeholder="MM/DD/YYYY">
${mode === "nosel" ? "" : '<button id="searchBtn" onclick="go()">Search</button>'}
<table><thead><tr><th>Origin</th><th>Dest</th><th>Pickup</th><th>Rate</th><th>Miles</th><th>DH-O</th><th>Weight</th><th>Company</th><th>MC#</th><th>Phone</th><th>Equip</th></tr></thead><tbody id="loadsTableBody"></tbody></table>
<script>
window.__sent = null;
function showOpts(v){ document.getElementById('opts').innerHTML = v ? '<div onclick="pickEq()">Vans(Standard)</div><div>Reefers</div>' : ''; }
function pickEq(){ document.getElementById('equipTextInput').value = 'Vans(Standard)'; document.getElementById('opts').innerHTML = ''; }
function go(){ window.__sent = ['originInput','dhoInput','destInput','dhdInput','equipTextInput','typeSelect','lengthInput','weightInput','startDateInput','endDateInput'].map(i=>document.getElementById(i).value);
 setTimeout(()=>{ document.getElementById('loadsTableBody').innerHTML =
 '<tr><td>Nashville, TN</td><td>Atlanta, GA</td><td>10/16 08:00</td><td>$1,200</td><td>250</td><td>12</td><td>40,000 lbs</td><td>Acme Logistics</td><td>MC 123456</td><td>(615) 555-0100</td><td>Van</td></tr>'+
 '<tr><td>Memphis, TN</td><td>Dallas, TX</td><td>10/16</td><td></td><td>450</td><td>-</td><td>35,000</td><td>SCAM ALERT Co</td><td></td><td></td><td>Van</td></tr>'; }, 300); }
</script></body></html>`;
  const login = `<!doctype html><body><form method="POST" action="/login"><input name="email" type="email"><input name="password" type="password"><button type="submit">Sign in</button></form></body>`;
  const server = http.createServer((req, res) => {
    const authed = /sid=ok/.test(req.headers.cookie ?? "");
    if (req.method === "POST" && req.url === "/login") {
      let b = ""; req.on("data", (d) => (b += d)); req.on("end", () => {
        if (mode === "badpass") { res.writeHead(200, { "content-type": "text/html" }); return res.end(login + "<p>Wrong password</p>"); }
        res.writeHead(302, { "set-cookie": "sid=ok; Path=/", location: "/search" }); res.end();
      }); return;
    }
    if (req.url === "/search" && authed) {
      if (mode === "captcha") { res.writeHead(200, { "content-type": "text/html" }); return res.end("<body>Please complete the CAPTCHA to continue</body>"); }
      if (mode === "twofa") { res.writeHead(200, { "content-type": "text/html" }); return res.end('<body>Enter code <input autocomplete="one-time-code"></body>'); }
      res.writeHead(200, { "content-type": "text/html" }); return res.end(search);
    }
    if (req.url === "/login" || req.url === "/" || req.url === "/search") { res.writeHead(200, { "content-type": "text/html" }); return res.end(login); }
    res.writeHead(404); res.end();
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r({ server, url: `http://127.0.0.1:${server.address().port}` })));
}

/** Fake Masar app queue: records lease/complete/fail calls. */
export function mockApp(job) {
  const calls = [];
  const server = http.createServer((req, res) => {
    let b = ""; req.on("data", (d) => (b += d)); req.on("end", () => {
      const j = JSON.parse(b || "{}");
      calls.push({ auth: req.headers.authorization, ...j });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(j.action === "lease" ? { job } : { ok: true }));
    });
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r({ server, calls, url: `http://127.0.0.1:${server.address().port}` })));
}
