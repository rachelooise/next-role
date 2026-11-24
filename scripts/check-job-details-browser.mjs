import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
let target;
for (let attempt = 0; attempt < 40; attempt++) {
 try { target = (await (await fetch('http://127.0.0.1:9226/json/list')).json())[0]; if (target) break; }
 catch { if (attempt === 39) throw new Error('Headless browser did not start on port 9226'); }
 await new Promise(resolve => setTimeout(resolve, 250));
}
const ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
let id=0;const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);const p=pending.get(m.id);if(p){pending.delete(m.id);if(m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result);}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
try {
 await send('Page.enable');await send('Runtime.enable');
 for(const width of [1440,390]) {
  await send('Emulation.setDeviceMetricsOverride',{width,height:2100,deviceScaleFactor:1,mobile:width<500});
  await send('Page.navigate',{url:'file:///C:/Users/rache/Projects/next-role/.next/job-details-preview.html'});
  await new Promise(r=>setTimeout(r,1000));
  const result=await send('Runtime.evaluate',{expression:'({width:innerWidth,scroll:document.documentElement.scrollWidth,header:document.querySelector("section[aria-label=\\"Job summary\\"]").getBoundingClientRect().width,title:document.querySelector("h1").getBoundingClientRect().width})',returnByValue:true});
  assert.equal(result.result.value.width,width);assert.ok(result.result.value.scroll<=width);
  if(width===390) assert.ok(result.result.value.title>200,'mobile title uses full summary width');
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await fs.writeFile(`.next/job-details-${width<500?'mobile':'desktop'}.png`,Buffer.from(shot.data,'base64'));
 }
 console.log('PASS desktop and 390px mobile width, title layout and screenshots');
} finally { await send('Browser.close');ws.close(); }
