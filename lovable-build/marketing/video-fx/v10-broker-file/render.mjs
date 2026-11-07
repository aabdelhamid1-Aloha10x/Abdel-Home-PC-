import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const fps = 30, only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
const b = await chromium.launch({ args:['--no-sandbox','--allow-file-access-from-files'] });
const p = await b.newPage({ viewport:{width:1080,height:1920}, deviceScaleFactor:1 });
p.on('pageerror', e=>console.log('ERR',e.message)); p.on('console', m=>console.log('LOG',m.text()));
await p.goto('file://'+process.cwd()+'/index.html'+(process.env.Q||'')); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(500);
const dur = await p.evaluate(()=>window.DUR);
const start=Number(process.env.START||0), OUT=process.env.OUT||'frames';
const times = only ?? Array.from({length:Math.round(dur*fps)},(_,i)=>i/fps).filter(t=>t>=start-1e-6);
let n=0;
for (const t of times){ await p.evaluate(t=>window.seek(t),t); await p.screenshot({path: only?`check/t${t}.jpg`:`${OUT}/${String(Math.round(t*fps)).padStart(4,'0')}.jpg`, type:'jpeg', quality:92}); n++; if(n%60==0) console.log(n); }
await b.close();
