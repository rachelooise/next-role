import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';

const jobId = '33333333-3333-4333-8333-333333333333';
const dossier = { companyOverview: 'Example builds browser automation tools for software teams.', techStack: ['TypeScript', 'Node.js'], culture: ['The company describes a collaborative engineering culture.'], whyThisRole: 'Inference: this role likely supports the reliability of developer tools.', yourEdge: ['Connect your TypeScript API work to reliable browser workflows.'], gapsToAddress: ['Explain how you would learn browser automation without overstating your experience.'], smartQuestions: ['How does the team measure browser session reliability?'], interviewPrep: ['Prepare a concrete example of testing failure recovery.'], sources: ['https://example.com/engineering/' + 'a-long-public-source-path-'.repeat(8)], researchBasis: 'website', limitations: 'The saved job description is a preview. Role rationale and advice are inferences.' };
const blank = { status: 'idle', dossier: null, researchedAt: null, error: null };
let state = { ...blank }, statusFails = false, starts = 0, checks = 0;
const tick = ms => new Promise(resolve => setTimeout(resolve, ms));
function check(value, label) { assert.ok(value, label); checks++; }
const output = path.resolve('.next/research-browser');
fs.mkdirSync(output, { recursive: true });
await build({ stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {CompanyResearch} from './components/job-details/CompanyResearch'; createRoot(document.getElementById('root')!).render(<CompanyResearch company="Example" jobId="${jobId}" initialResearch={(window as any).__research} />);`, resolveDir: process.cwd(), sourcefile: 'research-browser-fixture.tsx', loader: 'tsx' }, outfile: path.join(output, 'app.js'), bundle: true, platform: 'browser', format: 'iife', define: { 'process.env.NODE_ENV': '"production"' } });
const css = fs.readdirSync('.next/static/chunks').filter(file => file.endsWith('.css')).map(file => fs.readFileSync(path.join('.next/static/chunks', file), 'utf8')).join('\n');
const fontClass = /\.([\w-]+)\{--font-inter:/.exec(css)?.[1] || '';
const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.url.startsWith('/api/agent/research')) {
    if (req.method === 'POST') { starts++; state = { ...state, status: 'queued', error: null }; }
    if (statusFails && req.method === 'GET') { res.writeHead(503, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ success: false, error: 'Synthetic failure' })); return; }
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ success: true, state })); return;
  }
  if (req.url === '/app.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(fs.readFileSync(path.join(output, 'app.js'))); return; }
  if (req.url === '/style.css') { res.setHeader('Content-Type', 'text/css'); res.end(css); return; }
  if (req.url.startsWith('/_next/static/media/')) {
    const asset = path.join('.next/static/media', path.basename(req.url));
    if (fs.existsSync(asset)) { res.end(fs.readFileSync(asset)); return; }
  }
  res.setHeader('Content-Type', 'text/html');
  res.end(`<!doctype html><html class="${fontClass}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><main class="mx-auto w-full max-w-[864px] px-4 py-8 sm:px-8"><div id="root"></div></main><script>window.__research=${JSON.stringify(state).replaceAll('<', '\\u003c')}</script><script src="/app.js"></script></body></html>`);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(file => fs.existsSync(file));
assert.ok(chrome, 'Chrome is required for this browser check');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'nextrole-research-'));
const debugPort = 9258;
const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket, sequence = 0;
const pending = new Map(), exceptions = [];
async function command(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error('Browser evaluation failed');
  return result.result.value;
}
async function waitFor(expression, label) {
  for (let attempt = 0; attempt < 140; attempt++) { if (await evaluate(expression)) { checks++; return; } await tick(100); }
  throw new Error(`Browser condition failed: ${label}`);
}
try {
  for (let attempt = 0; attempt < 100; attempt++) { try { if ((await fetch(`http://127.0.0.1:${debugPort}/json/version`)).ok) break; } catch {} await tick(100); }
  const target = await (await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params);
    const waiter = pending.get(message.id);
    if (waiter) { clearTimeout(waiter.timer); pending.delete(message.id); if (message.error) waiter.reject(new Error(message.error.message)); else waiter.resolve(message.result); }
  });
  await command('Runtime.enable'); await command('Page.enable');
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await command('Page.navigate', { url: origin });
  await waitFor(`document.body.innerText.includes('No research yet')`, 'empty research');
  await evaluate(`document.querySelector('button').click()`);
  await waitFor(`document.body.innerText.includes('Research is queued.')`, 'start queues research');
  check(starts === 1 && await evaluate(`document.querySelector('button').disabled`), 'active research disables repeat starts');
  state = { ...state, status: 'running' };
  await waitFor(`document.body.innerText.includes('Researching Example')`, 'poll updates running state');
  statusFails = true;
  await waitFor(`document.body.innerText.includes('retry the status check below')`, 'poll errors visible without losing active work');
  statusFails = false;
  await evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent==='Check status').click()`);
  await waitFor(`!document.querySelector('[role="alert"]')`, 'manual status recovery');
  await waitFor(`document.querySelector('[role="status"]').textContent.includes('Status checked at')`, 'successful check gives visible confirmation');
  await command('Page.navigate', { url: 'about:blank' });
  state = { status: 'completed', dossier, researchedAt: new Date().toISOString(), error: null };
  await command('Page.navigate', { url: origin });
  await waitFor(`document.body.innerText.includes('Research saved')`, 'return restores saved research');
  check((await evaluate(`document.querySelectorAll('h3').length`)) === 9, 'all nine dossier sections visible');
  check(await evaluate(`document.querySelector('a').rel==='noopener noreferrer'`), 'source links safe in browser');
  await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }).then(result => fs.writeFileSync('.next/research-desktop.png', Buffer.from(result.data, 'base64')));
  await evaluate(`document.querySelector('button').click()`);
  await waitFor(`document.body.innerText.includes('Research is queued.')`, 'refresh starts');
  check(await evaluate(`document.body.innerText.includes('Your Edge')`), 'old dossier remains visible during refresh');
  state = { ...state, status: 'failed', error: 'Research could not be completed. Please try again.' };
  await waitFor(`document.body.innerText.includes('Retry research')`, 'failed refresh offers retry');
  check(await evaluate(`document.body.innerText.includes('Your Edge')`), 'failed refresh retains old dossier');
  const startsBeforeCheck = starts;
  await evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent==='Check status').click()`);
  await waitFor(`document.querySelector('[role="status"]').textContent.includes('Status checked at') && document.body.innerText.includes('Select Retry research to start a new attempt.')`, 'unchanged failed status confirms check and explains retry');
  check(starts === startsBeforeCheck, 'checking a failed run does not start another paid research attempt');
  await evaluate(`document.querySelector('button').click()`);
  await waitFor(`document.body.innerText.includes('Research is queued.')`, 'retry queued');
  state = { status: 'completed', dossier: { ...dossier, sources: [], researchBasis: 'job_profile', limitations: 'No company website was verified. This briefing uses the saved job and profile only.' }, researchedAt: new Date().toISOString(), error: null };
  await waitFor(`document.body.innerText.includes('Limited briefing')`, 'fallback is explicit');
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await tick(300);
  check(await evaluate(`document.documentElement.scrollWidth===390 && innerWidth===390`), '390px layout has no horizontal overflow');
  const shot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync('.next/research-mobile.png', Buffer.from(shot.data, 'base64'));
  check(exceptions.length === 0, 'no browser runtime exceptions');
  console.log(`PASS ${checks} hydrated research UI checks: start, polling, status recovery, return, refresh, failure, retry, fallback and mobile layout (mock API, actual components)`);
} finally {
  try { await command('Browser.close'); } catch {}
  socket?.close(); browser.kill(); server.close();
  await tick(500);
  const resolvedProfile = path.resolve(profile), tempRoot = path.resolve(os.tmpdir()) + path.sep;
  if (!resolvedProfile.startsWith(tempRoot)) throw new Error('Unexpected browser profile path');
  try { fs.rmSync(resolvedProfile, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 }); } catch { console.error('Temporary browser profile cleanup could not finish.'); }
}
