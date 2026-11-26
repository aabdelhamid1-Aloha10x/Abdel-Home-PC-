"""Local web dashboard with live charts (stdlib server): http://localhost:8787

Candles (2m/5m/10m/1m) with VWAP, EMA 8/21, SMA 200, the day's levels (NTZ, ORB,
PM/PD high-low, hourly levels) and entry/exit markers; account panel; alert feed.
Charts use TradingView's open-source lightweight-charts library (loaded from unpkg).
"""
from __future__ import annotations

import asyncio
import json
from urllib.parse import parse_qs, urlparse

PAGE = r"""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>KC Signals</title>
<script src="https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js"></script>
<style>
:root{--bg:#0e1116;--fg:#e6e6e6;--mut:#8b949e;--card:#161b22;--line:#30363d;--g:#3fb950;--r:#f85149;--y:#d29922;--c:#58a6ff}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:13px/1.45 ui-monospace,Menlo,Consolas,monospace;padding:12px 16px}
h1{font-size:16px;margin:0}.top{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
.pill{padding:2px 8px;border-radius:10px;background:var(--card);border:1px solid var(--line)}
button{background:var(--card);color:var(--fg);border:1px solid var(--line);border-radius:6px;padding:4px 10px;cursor:pointer;font:inherit}
button.on{border-color:var(--c);color:var(--c)}
.grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:12px}
@media (max-width:900px){.grid{grid-template-columns:1fr}}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px}
#chart{height:520px}@media (max-width:600px){#chart{height:360px}}
.ev{white-space:pre-wrap;border-left:3px solid var(--mut);padding:6px 8px;margin:6px 0;background:#0b0e13;font-size:12px}
.ENTRY,.ADD{border-color:var(--g)}.STOP{border-color:var(--r)}.TRIM,.TARGET_FINAL,.TIME_EXIT,.BREAKEVEN_EXIT{border-color:var(--y)}.ORDER{border-color:#bc8cff}.NEWS,.CALENDAR{border-color:var(--c)}
.mut{color:var(--mut)}.legend span{margin-right:10px}#syms button{margin:0 4px 4px 0}
</style></head><body>
<div class="top"><h1>KC Signals</h1><span class="pill" id="day"></span><span class="pill" id="mode"></span>
<span class="pill" id="acct"></span></div>
<div id="syms"></div>
<div class="top" id="tfs"></div>
<div class="grid"><div class="card"><div id="chart"></div>
<div class="legend mut"><span style="color:#ffffff">━ VWAP</span><span style="color:#58a6ff">━ EMA 8</span><span style="color:#bc8cff">━ EMA 21</span><span style="color:#d29922">━ SMA 200</span><span style="color:#f0883e">┅ NTZ</span><span style="color:#39c5cf">┅ ORB</span><span style="color:#8b949e">┄ levels</span></div></div>
<div><div class="card" id="open"></div><div class="card" id="today" style="margin-top:12px"></div><div class="card" style="margin-top:12px;max-height:470px;overflow:auto"><b>Signals &amp; exits</b><div id="ev"></div></div></div></div>
<script>
let sym=null, tf=300, chart, candles, vol, lines={}, priceLines=[];
const TFS=[[60,'1m'],[120,'2m'],[300,'5m'],[600,'10m']];
function mk(){
  chart=LightweightCharts.createChart(document.getElementById('chart'),{layout:{background:{color:'#161b22'},textColor:'#c9d1d9'},
    grid:{vertLines:{color:'#21262d'},horzLines:{color:'#21262d'}},timeScale:{timeVisible:true,secondsVisible:false},
    rightPriceScale:{borderColor:'#30363d'},crosshair:{mode:0},autoSize:true});
  candles=chart.addCandlestickSeries({upColor:'#3fb950',downColor:'#f85149',borderVisible:false,wickUpColor:'#3fb950',wickDownColor:'#f85149'});
  vol=chart.addHistogramSeries({priceFormat:{type:'volume'},priceScaleId:'v',color:'#30363d'});
  chart.priceScale('v').applyOptions({scaleMargins:{top:0.82,bottom:0}});
  for(const [k,c,w] of [['vwap','#ffffff',2],['ema8','#58a6ff',1],['ema21','#bc8cff',1],['sma200','#d29922',2]])
    lines[k]=chart.addLineSeries({color:c,lineWidth:w,priceLineVisible:false,lastValueVisible:false});
}
function pl(price,color,title,style){ if(price==null)return; priceLines.push(candles.createPriceLine({price,color,lineWidth:1,lineStyle:style,axisLabelVisible:true,title})); }
let lastKey='';
async function loadChart(fit){
  if(!sym)return;
  const d=await (await fetch(`/api/chart?symbol=${sym}&tf=${tf}`)).json();
  candles.setData(d.bars); vol.setData(d.bars.map(b=>({time:b.time,value:b.volume,color:b.close>=b.open?'#23863666':'#da363366'})));
  for(const k in lines) lines[k].setData(d[k]||[]);
  candles.setMarkers(d.markers||[]);
  priceLines.forEach(p=>candles.removePriceLine(p)); priceLines=[];
  const L=d.levels||{}, S=LightweightCharts.LineStyle;
  if(L.ntz){pl(L.ntz[1],'#f0883e','NTZ',S.Dashed);pl(L.ntz[0],'#f0883e','NTZ',S.Dashed);}
  if(L.orb){pl(L.orb[1],'#39c5cf','ORB H',S.Dashed);pl(L.orb[0],'#39c5cf','ORB L',S.Dashed);}
  pl(L.pm_high,'#a371f7','PMH',S.Dotted);pl(L.pm_low,'#a371f7','PML',S.Dotted);
  pl(L.y_high,'#8b949e','PDH',S.Dotted);pl(L.y_low,'#8b949e','PDL',S.Dotted);
  pl(L.hourly_sma200,'#d29922','1H 200',S.Dotted);
  (L.hourly||[]).forEach(x=>pl(x,'#6e7681','',S.SparseDotted));
  (L.intraday||[]).forEach(x=>pl(x,'#484f58','',S.SparseDotted));
  if(fit) chart.timeScale().fitContent();
}
function buttons(syms){
  const box=document.getElementById('syms'); const key=syms.join(',');
  if(key!==lastKey){ lastKey=key; box.innerHTML='';
    syms.forEach(s=>{const b=document.createElement('button');b.textContent=s;b.onclick=()=>{sym=s;render();loadChart(true)};b.id='s_'+s;box.appendChild(b)}); }
  syms.forEach(s=>document.getElementById('s_'+s).className=(s===sym?'on':''));
  const t=document.getElementById('tfs'); if(!t.childElementCount) TFS.forEach(([v,n])=>{const b=document.createElement('button');b.textContent=n;b.onclick=()=>{tf=v;render();loadChart(true)};b.dataset.v=v;t.appendChild(b)});
  [...t.children].forEach(b=>b.className=(+b.dataset.v===tf?'on':''));
}
let snap=null;
function render(){ if(snap) buttons(Object.keys(snap.symbols)); }
async function tick(){ try{
  snap=await (await fetch('/api')).json();
  const syms=Object.keys(snap.symbols); if(!sym&&syms.length){sym=syms[0]; render(); await loadChart(true);} render();
  document.getElementById('day').textContent=snap.day;
  document.getElementById('mode').textContent='orders: '+snap.mode.toUpperCase();
  document.getElementById('acct').innerHTML=`equity $${snap.equity.toLocaleString()} · day <b style="color:${snap.day_pnl>=0?'var(--g)':'var(--r)'}">$${snap.day_pnl.toLocaleString()}</b> · trades ${snap.trades} · size rung ${snap.rung+1}`;
  document.getElementById('open').innerHTML=snap.open.length?snap.open.map(p=>`<b>${p.contract}</b> ×${p.remaining}<br>entry ${p.entry} · last ${p.last} · stop ${p.stop}<br>targets ${p.targets.join(' / ')}`).join('<hr>'):'<span class=mut>No open position</span>';
  const R=snap.restrictions||{}, B=snap.blackouts||[];
  document.getElementById('today').innerHTML='<b>Today</b><br>'+((B.length||Object.keys(R).length)?
    B.map(b=>`⛔ no entries ${b.slice(11)} ET`).join('<br>')+(B.length?'<br>':'')+
    Object.entries(R).map(([k,v])=>`<b>${k}</b>: ${v.block?'BLOCKED — ':''}${(v.notes||[]).join('; ')}`).join('<br>')
    :'<span class=mut>No calendar or news restrictions</span>');
  document.getElementById('ev').innerHTML=snap.events.filter(e=>e.type!=='INFO').reverse().map(e=>`<div class="ev ${e.type}"><span class=mut>${e.ts.slice(11,19)}</span> <b>${e.type} ${e.symbol}</b>\n${e.message.replace(/</g,'&lt;')}</div>`).join('');
}catch(e){} }
mk(); tick(); setInterval(tick,1000); setInterval(()=>loadChart(false),2000);
</script></body></html>"""


async def serve(engine, port: int, host: str = "127.0.0.1") -> None:
    async def handle(reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        try:
            line = (await reader.readline()).decode()
            while (await reader.readline()) not in (b"\r\n", b"\n", b""):
                pass
            url = urlparse(line.split(" ")[1] if " " in line else "/")
            if url.path == "/api":
                body, ctype = json.dumps(engine.snapshot(), default=str).encode(), "application/json"
            elif url.path == "/api/chart":
                q = parse_qs(url.query)
                sym = q.get("symbol", [""])[0].upper()
                tf = int(q.get("tf", ["300"])[0])
                tf = tf if tf in (60, 120, 300, 600) else 300
                body, ctype = json.dumps(engine.chart(sym, tf), default=str).encode(), "application/json"
            else:
                body, ctype = PAGE.encode(), "text/html; charset=utf-8"
            writer.write(f"HTTP/1.1 200 OK\r\nContent-Type: {ctype}\r\nContent-Length: {len(body)}\r\n"
                         f"Cache-Control: no-store\r\nConnection: close\r\n\r\n".encode() + body)
            await writer.drain()
        except Exception:  # noqa: BLE001 - a bad request must never touch the engine
            pass
        finally:
            writer.close()

    server = await asyncio.start_server(handle, host, port)
    async with server:
        await server.serve_forever()
