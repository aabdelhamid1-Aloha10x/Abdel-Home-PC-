"""Tiny local web dashboard (stdlib only): http://localhost:8787 — refreshes every second."""
from __future__ import annotations

import asyncio
import json

PAGE = """<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>KC Signals</title><style>
:root{--bg:#0e1116;--fg:#e6e6e6;--mut:#8b949e;--card:#161b22;--g:#3fb950;--r:#f85149;--y:#d29922;--c:#58a6ff}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.45 ui-monospace,Menlo,monospace;padding:16px}
h1{font-size:18px;margin:0 0 12px}.row{display:flex;gap:12px;flex-wrap:wrap}
.card{background:var(--card);border-radius:8px;padding:12px;flex:1;min-width:260px}
.ev{white-space:pre-wrap;border-left:3px solid var(--mut);padding:6px 10px;margin:6px 0;background:var(--card)}
.ENTRY{border-color:var(--g)}.STOP{border-color:var(--r)}.TRIM,.TARGET_FINAL{border-color:var(--y)}
.mut{color:var(--mut)}table{border-collapse:collapse;width:100%}td,th{padding:3px 6px;text-align:right}
th:first-child,td:first-child{text-align:left}
</style></head><body><h1>KC Signals <span id="st" class="mut"></span></h1>
<div class="row"><div class="card" id="acct"></div><div class="card" id="open"></div></div>
<div class="card" style="margin-top:12px"><table id="lv"></table></div>
<h1 style="margin-top:16px">Signals &amp; exits</h1><div id="ev"></div>
<script>
async function tick(){try{const s=await (await fetch('/api')).json();
document.getElementById('st').textContent=s.day;
document.getElementById('acct').innerHTML=`Equity <b>$${s.equity.toLocaleString()}</b><br>Day P&L <b style="color:${s.day_pnl>=0?'var(--g)':'var(--r)'}">$${s.day_pnl.toLocaleString()}</b><br>Trades ${s.trades} · losers ${s.losers}`;
document.getElementById('open').innerHTML=s.open.length?s.open.map(p=>`<b>${p.contract}</b> x${p.remaining}<br>entry ${p.entry} · last ${p.last} · stop ${p.stop}<br>targets ${p.targets.join(' / ')}`).join('<hr>'):'<span class=mut>No open position</span>';
const f=x=>x==null?'—':(+x).toFixed(2);
document.getElementById('lv').innerHTML='<tr><th>Sym</th><th>Last</th><th>VWAP</th><th>NTZ</th><th>ORB</th></tr>'+Object.entries(s.symbols).map(([k,v])=>`<tr><td>${k}</td><td>${f(v.last)}</td><td>${f(v.vwap)}</td><td>${f(v.ntz[0])}–${f(v.ntz[1])}</td><td>${f(v.orb[0])}–${f(v.orb[1])}</td></tr>`).join('');
document.getElementById('ev').innerHTML=s.events.filter(e=>e.type!='INFO').reverse().map(e=>`<div class="ev ${e.type}"><span class=mut>${e.ts.slice(11,19)}</span> <b>${e.type} ${e.symbol}</b>\n${e.message.replace(/</g,'&lt;')}</div>`).join('');
}catch(e){}}setInterval(tick,1000);tick();
</script></body></html>"""


async def serve(engine, port: int) -> None:
    async def handle(reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        try:
            line = (await reader.readline()).decode()
            while (await reader.readline()) not in (b"\r\n", b"\n", b""):
                pass
            path = line.split(" ")[1] if " " in line else "/"
            if path.startswith("/api"):
                body, ctype = json.dumps(engine.snapshot(), default=str).encode(), "application/json"
            else:
                body, ctype = PAGE.encode(), "text/html; charset=utf-8"
            writer.write(f"HTTP/1.1 200 OK\r\nContent-Type: {ctype}\r\nContent-Length: {len(body)}\r\n"
                         f"Cache-Control: no-store\r\nConnection: close\r\n\r\n".encode() + body)
            await writer.drain()
        finally:
            writer.close()

    server = await asyncio.start_server(handle, "127.0.0.1", port)
    async with server:
        await server.serve_forever()
