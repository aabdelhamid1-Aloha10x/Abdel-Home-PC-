import http from "node:http";

/** Fake reseller site with the same element ids as the real one. mode: ok | captcha | badpass | nosel | twofa */
export function mockSite(mode = "ok") {
  const search = `<!doctype html><html><body><h1>Search</h1>
<button onclick="toggleFilters()" id="filterToggle">Hide Filters ▴</button><section id="filters">
<input id="originInput" oninput="cities(this)"><input id="dhoInput"><input id="destInput" oninput="cities(this)"><input id="dhdInput"><div id="cities"></div>
<div id="equipSummaryView" onclick="document.getElementById('equipDropdownOptions').style.display='block'">Equipment</div>
<div id="equipExpandedChips"><input id="equipTextInput"></div>
<div id="equipDropdownOptions" style="display:none"><span class="equip-chip-option-title" onclick="pickEq()">Vans (Standard)</span></div>
<select id="typeSelect" aria-label="Load Type"><option>Full &amp; Partial</option><option>Full Only</option><option>Partial Only</option></select>
<input id="lengthInput"><input id="weightInput">
<input id="startDateInput" readonly placeholder="MM/DD/YYYY"><input id="endDateInput" readonly placeholder="MM/DD/YYYY">
<button onclick="toggleCalendar()">Open calendar</button><div id="calendar" style="display:none"><span id="calMonthYearText">OCT 2026</span><div id="calDaysGrid">${Array.from({length:31},(_,i)=>`<div class="cal-day-cell" onclick="pickDay(${i+1})">${i+1}</div>`).join('')}</div></div>
${mode === "nosel" ? "" : '<button id="searchBtn" onclick="go()">Search</button>'}
</section><div id="searchProgressBar"></div>
<table><thead><tr><th>Origin</th><th>Dest</th><th>Pickup</th><th>Rate</th><th>Miles</th><th>DH-O</th><th>Weight</th><th>Company</th><th>MC#</th><th>Phone</th><th>Equip</th></tr></thead><tbody id="loadsTableBody"></tbody></table>
<script>
window.__sent = null;
if (${JSON.stringify(mode)} === 'stale') document.getElementById('loadsTableBody').innerHTML='<tr><td>Old City, TX</td><td>Wrong City, CA</td><td>10/15</td><td>$9,999</td><td>900</td><td>10</td><td>40,000</td><td>Demo Old Broker</td><td></td><td></td><td>Van</td></tr>';
function toggleFilters(){const f=document.getElementById('filters'); const closed=f.style.display==='none'; f.style.display=closed?'block':'none';document.getElementById('filterToggle').textContent=closed?'Hide Filters ▴':'Edit Search ▾';document.getElementById('equipDropdownOptions').style.display='none';}
function cities(input){ const box=document.getElementById('cities');box.replaceChildren();if(!input.value)return;const item=document.createElement('div');item.className='autocomplete-item';item.textContent=input.value;item.onclick=()=>{input.value=item.textContent;box.replaceChildren();};box.append(item);}
function pickEq(){ const chip=document.createElement('div');chip.className='equip-chip-item';chip.textContent='Vans (Standard)';const remove=document.createElement('span');remove.className='chip-remove-btn';remove.textContent='✕';remove.onclick=()=>chip.remove();chip.append(remove);document.getElementById('equipExpandedChips').prepend(chip);document.getElementById('equipTextInput').value='Vans(Standard)';}
let startDay=null;
function toggleCalendar(){const c=document.getElementById('calendar');c.style.display=c.style.display==='none'?'block':'none';startDay=null;}
function pickDay(day){const value='10/'+String(day).padStart(2,'0')+'/2026';if(startDay===null){startDay=day;document.getElementById('startDateInput').value=value;}document.getElementById('endDateInput').value=value;}
function go(){ window.__sent = ['originInput','dhoInput','destInput','dhdInput','equipTextInput','typeSelect','lengthInput','weightInput','startDateInput','endDateInput'].map(i=>document.getElementById(i).value);
 document.getElementById('searchProgressBar').classList.add('active');
 setTimeout(()=>{ document.getElementById('loadsTableBody').innerHTML =
 '<tr><td>Nashville, TN</td><td>Atlanta, GA</td><td>10/16 08:00</td><td>$1,200</td><td>250</td><td>12</td><td>40,000 lbs</td><td>Acme Logistics</td><td>MC 123456</td><td>(615) 555-0100</td><td>Van</td></tr>'+
 '<tr><td>Memphis, TN</td><td>Dallas, TX</td><td>10/16</td><td></td><td>450</td><td>-</td><td>35,000</td><td>SCAM ALERT Co</td><td></td><td></td><td>Van</td></tr>';
 if (${JSON.stringify(mode)} === 'empty') document.getElementById('loadsTableBody').innerHTML='<tr><td colspan="11">No results found</td></tr>';
 document.getElementById('searchProgressBar').classList.remove('active'); }, ${mode === 'stale' ? 1500 : 300}); }
</script></body></html>`;
  const login = `<!doctype html><body><form method="POST" action="/login"><input name="email" type="email"><input name="password" type="password"><button type="submit">Sign in</button></form></body>`;
  const server = http.createServer((req, res) => {
    const authed = /sid=ok/.test(req.headers.cookie ?? "");
    if (req.method === "POST" && req.url === "/login") {
      let b = ""; req.on("data", (d) => (b += d)); req.on("end", () => {
        if (mode === "badpass") { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return res.end(login + "<p>Wrong password</p>"); }
        res.writeHead(302, { "set-cookie": "sid=ok; Path=/", location: "/search" }); res.end();
      }); return;
    }
    if (req.url === "/search" && authed) {
      if (mode === "captcha") { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return res.end("<body>Please complete the CAPTCHA to continue</body>"); }
      if (mode === "twofa") { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return res.end('<body>Enter code <input autocomplete="one-time-code"></body>'); }
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return res.end(search);
    }
    if (req.url === "/login" || req.url === "/" || req.url === "/search") { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return res.end(login); }
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
