import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import nextEnv from '@next/env';
import { createClient } from '@insforge/sdk';

nextEnv.loadEnvConfig(process.cwd());
const [fixture] = JSON.parse(await fs.readFile('.env.schema-fixtures.json', 'utf8'));
assert.equal(fixture.email, `nextrole-schema-${fixture.id}@example.invalid`);
const config = { baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY, isServerMode: true };
const login = await createClient(config).auth.signInWithPassword({ email: fixture.email, password: fixture.password });
assert.ok(!login.error && login.data?.accessToken);
const client = createClient({ ...config, accessToken: login.data.accessToken });
assert.ok(!(await client.database.from('profiles').update({ resume_pdf_key: null, resume_pdf_url: null }).eq('id', fixture.id)).error);
const target = await (await fetch('http://127.0.0.1:9223/json/new?about:blank', { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let serial = 0;
const pending = new Map(), exceptions = [];
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
  const task = pending.get(message.id);
  if (task) { pending.delete(message.id); if (message.error) task.reject(new Error(message.error.message)); else task.resolve(message.result); }
});
function send(method, params = {}) { return new Promise((resolve, reject) => { const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); }); }
async function evaluate(expression) { const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error('Browser evaluation failed'); return result.result.value; }
async function waitFor(expression) { for (let i = 0; i < 260; i++) { if (await evaluate(expression)) return; await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error('Browser condition timed out'); }
try {
  await send('Page.enable'); await send('Runtime.enable');
  await send('Network.setCookie', { name: 'insforge_access_token', value: login.data.accessToken, url: 'http://localhost:3108', httpOnly: true, sameSite: 'Lax' });
  await send('Page.navigate', { url: 'http://localhost:3108/profile' });
  await waitFor("document.querySelector('input[name=full_name]') && document.readyState === 'complete'");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await evaluate("document.querySelector('input[name=full_name]').value = 'Unsaved Browser Draft'; document.querySelector('input[name=full_name]').dispatchEvent(new Event('input', {bubbles:true}))");
  await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Generate Resume').click()");
  await waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.includes('Generating'))");
  assert.equal(await evaluate("document.querySelector('form.app-card button[type=submit]').matches(':disabled')"), true, 'save disabled during generation');
  await waitFor("[...document.querySelectorAll('[role=status],[role=alert]')].some(e => e.textContent.includes('Resume generated and saved') || e.textContent.includes('Could not') || e.textContent.includes('interrupted'))");
  assert.equal(await evaluate("document.body.textContent.includes('Resume generated and saved')"), true, 'real button generation succeeds');
  assert.equal(await evaluate("document.querySelector('input[name=full_name]').value"), 'Unsaved Browser Draft', 'unsaved draft preserved');
  assert.equal(await evaluate("document.body.textContent.includes('Generated Resume.pdf') && !!document.querySelector('a[href=\"/api/resume/download\"]')"), true, 'new PDF metadata and View Resume shown');
  for (const [width, height, label] of [[1440, 1100, 'desktop'], [390, 844, 'mobile']]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 500 });
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'no horizontal overflow');
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    await fs.writeFile(`.next/generation-${label}.png`, Buffer.from(screenshot.data, 'base64'));
  }
  await evaluate("document.querySelector('form.app-card button[type=submit]').click()");
  await waitFor("[...document.querySelectorAll('[role=status]')].some(e => e.textContent === 'Profile saved.')");
  const saved = await client.database.from('profiles').select('full_name').eq('id', fixture.id).single();
  assert.equal(saved.data?.full_name, 'Unsaved Browser Draft', 'subsequent save uses returned timestamp');
  assert.deepEqual(exceptions, [], 'no browser runtime exceptions');
  console.log('PASS browser generation, loading state, unsaved edits, subsequent save, desktop/mobile layout and runtime checks');
} finally {
  await client.storage.from('resumes').remove(`${fixture.id}/resume.pdf`);
  socket.close();
  await fetch(`http://127.0.0.1:9223/json/close/${target.id}`);
}
