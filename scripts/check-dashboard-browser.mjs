import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
let target;
for (let attempt = 0; attempt < 40; attempt++) {
  try { target = (await (await fetch('http://127.0.0.1:9227/json/list')).json()).find(tab => tab.type === 'page'); if (target) break; }
  catch { if (attempt === 39) throw new Error('Start Chrome with remote debugging port 9227'); }
  await new Promise(resolve => setTimeout(resolve, 250));
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
let id = 0;
const pending = new Map();
ws.addEventListener('message', event => { const message = JSON.parse(event.data), request = pending.get(message.id); if (request) { pending.delete(message.id); message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result); } });
const send = (method, params = {}) => new Promise((resolve, reject) => { const current = ++id; pending.set(current, { resolve, reject }); ws.send(JSON.stringify({ id: current, method, params })); });
try {
  await send('Page.enable'); await send('Runtime.enable');
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1200, deviceScaleFactor: 1, mobile: width < 500 });
    for (const state of ['complete', 'incomplete', 'unavailable']) {
      await send('Page.navigate', { url: `file:///${path.resolve(`.next/dashboard-${state}.html`).replaceAll('\\', '/')}` });
      await new Promise(resolve => setTimeout(resolve, 600));
      const { result } = await send('Runtime.evaluate', { expression: `JSON.stringify({width:innerWidth,scroll:document.documentElement.scrollWidth,stats:[...document.querySelectorAll('article')].map(el=>({x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y})),charts:[...document.querySelectorAll('svg[role=img]')].map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})),banner:!!document.querySelector('[aria-label="Complete your profile"]')})`, returnByValue: true });
      const metrics = JSON.parse(result.value);
      assert.equal(metrics.width, width); assert.ok(metrics.scroll <= width, `${width} ${state} overflow`);
      assert.equal(metrics.banner, state === 'incomplete');
      assert.equal(metrics.stats.length, 4); assert.equal(metrics.charts.length, 3);
      assert.ok(metrics.charts.every(chart => chart.w > 250 && chart.h >= 250));
      if (width === 1440) assert.equal(metrics.stats[0].y, metrics.stats[3].y);
      else assert.ok(metrics.stats[3].y > metrics.stats[0].y);
      if (state === 'complete') { const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); await fs.writeFile(`.next/dashboard-${width}.png`, Buffer.from(shot.data, 'base64')); }
    }
  }
  console.log('PASS desktop/mobile layout, no overflow, all banner states, stat stacking, chart dimensions; screenshots saved');
} finally { await send('Browser.close'); ws.close(); }

