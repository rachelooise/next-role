import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

async function main() {
  const target = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let serial = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    const task = pending.get(message.id);
    if (task) {
      pending.delete(message.id);
      if (message.error) task.reject(new Error(message.error.message));
      else task.resolve(message.result);
    }
  });
  function send(method, params = {}) {
    return new Promise((resolve, reject) => { const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  }
  async function evaluate(expression) { return (await send('Runtime.evaluate', { expression, returnByValue: true })).result.value; }
  async function waitFor(expression) {
    for (let attempt = 0; attempt < 80; attempt++) {
      if (await evaluate(expression)) return;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    throw new Error('Browser condition timed out: ' + expression);
  }
  try {
    await send('Page.enable');
    await send('Runtime.enable');
    for (const [width, height, label] of [[1440, 1000, 'desktop'], [390, 844, 'mobile']]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 500 });
      await send('Page.navigate', { url: 'http://localhost:3000/login' });
      await waitFor("document.querySelector('button[name=provider]') && document.readyState === 'complete'");
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
      assert.equal(await evaluate("document.querySelectorAll('button[name=provider]').length"), 2);
      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      await fs.writeFile('.next/login-' + label + '.png', Buffer.from(screenshot.data, 'base64'));
      console.log('PASS login layout:', label);
    }
    for (const [provider, hostname] of [['google', 'accounts.google.com'], ['github', 'github.com']]) {
      await send('Page.navigate', { url: 'http://localhost:3000/login' });
      await waitFor("document.querySelector('button[name=provider]') && document.readyState === 'complete'");
      await evaluate(`document.querySelector('button[value=${provider}]').click()`);
      await waitFor(`location.hostname === '${hostname}'`);
      const cookies = await send('Network.getCookies', { urls: ['http://localhost:3000/'] });
      const verifier = cookies.cookies.find(cookie => cookie.name === 'nextrole_oauth_verifier');
      assert.ok(verifier?.httpOnly);
      assert.equal(verifier.sameSite, 'Lax');
      console.log('PASS app OAuth form and httpOnly PKCE:', provider);
    }
    assert.deepEqual(errors, []);
    console.log('PASS no browser runtime exceptions');
  } finally {
    socket.close();
    await fetch('http://127.0.0.1:9222/json/close/' + target.id);
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
