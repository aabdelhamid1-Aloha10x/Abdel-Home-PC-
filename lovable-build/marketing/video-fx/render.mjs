import { chromium } from '/home/user/Abdel-Home-PC-/masar-browser-worker/node_modules/playwright/index.mjs';
const fps = 30, only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--allow-file-access-from-files'] });
const p = await b.newPage({ viewport:{width:1080,height:1920}, deviceScaleFactor:1 });
await p.goto('file://'+process.cwd()+'/index.html'); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(500);
const dur = await p.evaluate(()=>window.DUR); console.log('dur',dur);
const times = only ?? Array.from({length:Math.round(dur*fps)},(_,i)=>i/fps);
let n=0;
for (const t of times){ await p.evaluate(t=>window.seek(t),t); await p.screenshot({path: only?`frames/t${t}.png`:`frames/${String(n).padStart(4,'0')}.png`}); n++; }
await b.close();
