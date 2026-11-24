import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import nextEnv from '@next/env';
import { createClient } from '@insforge/sdk';

nextEnv.loadEnvConfig(process.cwd());
const [fixture] = JSON.parse(await readFile('.env.schema-fixtures.json', 'utf8'));
assert.equal(fixture.email, `nextrole-schema-${fixture.id}@example.invalid`);
const base = 'http://localhost:3108';
for (const path of ['generate', 'extract']) {
  const client = createClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY, isServerMode: true });
  const login = await client.auth.signInWithPassword({ email: fixture.email, password: fixture.password });
  assert.ok(!login.error && login.data?.refreshToken, 'mobile fixture refresh token');
  const response = await fetch(`${base}/api/resume/${path}`, { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json', Cookie: `insforge_refresh_token=${login.data.refreshToken}` }, body: JSON.stringify({ updatedAt: 'stale' }) });
  assert.equal(response.status, 409, 'request refreshes and reaches authenticated stale check');
  assert.ok(response.headers.getSetCookie().some((value) => value.startsWith('insforge_access_token=') && !value.startsWith('insforge_access_token=;')), 'access cookie renewed');
}
console.log('PASS generation and extraction refresh missing access cookies and forward the renewed session');
