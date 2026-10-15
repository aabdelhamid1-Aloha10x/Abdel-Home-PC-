import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" });
const p = await ctx.newPage();
const logs = [];
p.on("console", (m) => { if (["error","warning"].includes(m.type())) logs.push(m.type()+": "+m.text().slice(0,160)); });
p.on("pageerror", (e) => logs.push("pageerror: "+String(e).slice(0,160)));
let status = null;
try {
  const r = await p.goto("https://app.masar10x.io", { waitUntil: "networkidle", timeout: 45000 });
  status = r?.status();
} catch (e) { console.log("GOTO ERROR", String(e).slice(0,300)); }
console.log("status", status, "url", p.url(), "title", await p.title().catch(()=>null));
await p.screenshot({ path: "home-390.png", fullPage: false }).catch(e=>console.log("shot err", String(e).slice(0,200)));
const info = await p.evaluate(() => ({ w: innerWidth, h: innerHeight, scrollW: document.documentElement.scrollWidth, buttons: [...document.querySelectorAll("button,a")].slice(0,12).map(x=>x.innerText.trim().slice(0,30)), inputs: [...document.querySelectorAll("input")].map(i=>i.type+":"+(i.name||i.placeholder||"")) })).catch(()=>null);
console.log(JSON.stringify(info));
console.log(logs.slice(0,8).join("\n"));
await b.close();
