import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import nextEnv from '@next/env';
import { createClient } from '@insforge/sdk';

nextEnv.loadEnvConfig(process.cwd());
const base = process.env.DISCOVERY_TEST_URL || 'http://localhost:3111';
const fixtures = JSON.parse(await fs.readFile('.env.discovery-fixtures.json', 'utf8'));
assert.ok(fixtures.every(f => f.email === `nextrole-discovery-${f.id}@example.invalid`));
const auth = createClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY, isServerMode: true });
const login = await auth.auth.signInWithPassword({ email: fixtures[0].email, password: fixtures[0].password });
assert.ok(!login.error && login.data?.accessToken, 'fixture authentication');
const target = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject) => { socket.addEventListener('open', resolve, {once:true}); socket.addEventListener('error', reject, {once:true}); });
let serial = 0;
const pending = new Map(), exceptions = [];
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
  const task = pending.get(message.id);
  if (task) { pending.delete(message.id); if (message.error) task.reject(new Error(message.error.message)); else task.resolve(message.result); }
});
function send(method, params = {}) { return new Promise((resolve,reject) => { const id=++serial; pending.set(id,{resolve,reject}); socket.send(JSON.stringify({id,method,params})); }); }
async function evaluate(expression) { const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}); if(result.exceptionDetails) throw new Error('Browser evaluation failed'); return result.result.value; }
async function waitFor(expression) { for(let i=0;i<600;i++) { if(await evaluate(expression)) return; if(await evaluate("location.pathname === '/login'")) throw new Error('Fixture session was not accepted by browser'); await new Promise(r=>setTimeout(r,250)); } throw new Error('Browser condition timed out'); }
async function input(selector, value) { await evaluate(`(() => { const element=document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(element,${JSON.stringify(value)}); element.dispatchEvent(new Event('input',{bubbles:true})); })()`); }
try {
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await send('Network.clearBrowserCookies');
  assert.ok((await send('Network.setCookie',{name:'insforge_access_token',value:login.data.accessToken,url:base,path:'/',httpOnly:false,sameSite:'Lax'})).success);
  assert.ok((await send('Network.setCookie',{name:'insforge_refresh_token',value:login.data.refreshToken,url:base,path:'/',httpOnly:true,sameSite:'Lax'})).success);
  await send('Page.navigate',{url:base+'/find-jobs'});
  await waitFor("document.querySelector('input[name=jobTitle]') && document.readyState === 'complete'");
  await new Promise(r=>setTimeout(r,800));
  assert.equal(await evaluate("document.querySelector('select[name=country]').value"),'us','default US');
  assert.equal(await evaluate("document.querySelectorAll('select[name=country] option').length"),4,'four countries');
  assert.equal(await evaluate("document.querySelector('input[name=location]').required"),false,'location optional');
  assert.equal(await evaluate("document.querySelectorAll('tbody tr').length"),6,'saved data and local pagination');
  await input('input[name=jobTitle]','Frontend Developer');
  await evaluate("document.querySelector('select[name=country]').value='au'; document.querySelector('select[name=country]').dispatchEvent(new Event('change',{bubbles:true}))");
  await evaluate("document.querySelector('section[aria-label=\"Job discovery\"] button[type=submit]').click()");
  await waitFor("document.querySelector('section[aria-label=\"Job discovery\"] button[type=submit]').textContent.includes('Finding')");
  assert.equal(await evaluate("document.querySelector('input[name=jobTitle]').matches(':disabled')"),true,'search controls disabled while busy');
  await waitFor("document.body.textContent.includes('already saved.') || document.querySelector('[role=alert]')");
  assert.equal(await evaluate("document.body.textContent.includes('already saved.')"),true,'real discovery displays duplicate counts');
  await waitFor("!document.querySelector('section[aria-label=\"Job discovery\"] button[type=submit]').matches(':disabled')");
  assert.equal(await evaluate("document.querySelector('input[name=jobTitle]').value"),'Frontend Developer','search retained after server refresh');
  await input('input[placeholder="Filter by company or role…"]','no-such-fixture-company-987654');
  await waitFor("document.body.textContent.includes('No jobs match these filters')");
  await input('input[placeholder="Filter by company or role…"]','');
  await waitFor("document.querySelectorAll('tbody tr').length > 0");
  for(const [width,height,label] of [[1440,1100,'desktop'],[390,844,'mobile']]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true,'no page overflow '+label);
    assert.equal(await evaluate("document.querySelector('input[name=jobTitle]').getBoundingClientRect().right <= innerWidth"),true,'search fits '+label);
    const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
    await fs.writeFile(`.next/discovery-${label}.png`,Buffer.from(shot.data,'base64'));
  }
  await send('Page.reload');
  await waitFor("performance.getEntriesByType('navigation')[0]?.type === 'reload' && document.readyState === 'complete' && document.querySelectorAll('tbody tr').length > 0 && !!document.querySelector('a[href=\"https://www.adzuna.com\"]')");
  assert.equal(await evaluate("document.querySelector('table caption').textContent"),'Your saved jobs from Adzuna','real listings survive reload');
  assert.deepEqual(exceptions,[],'no browser exceptions');
  console.log('PASS browser live search, country/optional location, loading, duplicate counts, refresh, filters, persistence and desktop/mobile layout');
} finally {
  await send('Network.clearBrowserCookies');
  socket.close();
  await fetch(`http://127.0.0.1:9224/json/close/${target.id}`);
}
