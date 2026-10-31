import assert from 'node:assert/strict';
import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

async function main() {
  const { createServerClient } = await import('@insforge/sdk/ssr');
  const base = 'http://localhost:3000';
  for (const path of ['/dashboard', '/profile', '/find-jobs', '/find-jobs/example']) {
    const response = await fetch(base + path, { redirect: 'manual' });
    assert.equal(response.status, 307, path);
    assert.equal(new URL(response.headers.get('location'), base).pathname, '/login');
    console.log('PASS anonymous protection:', path);
  }
  const home = await (await fetch(base)).text();
  assert.match(home, /Get Started/);
  assert.match(home, /href="\/login"/);
  const login = await (await fetch(base + '/login')).text();
  assert.match(login, /Continue with Google/);
  assert.match(login, /Continue with GitHub/);
  console.log('PASS homepage and login render');

  for (const query of ['', '?insforge_code=fake', '?error=denied']) {
    const response = await fetch(base + '/api/auth/callback' + query, { redirect: 'manual' });
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get('location'), base).searchParams.get('error'), 'oauth');
    assert.match(response.headers.get('set-cookie'), /nextrole_oauth_verifier=;/);
  }
  console.log('PASS invalid OAuth callbacks');

  const malformed = await fetch(base + '/dashboard', { redirect: 'manual', headers: { cookie: 'insforge_access_token=invalid' } });
  assert.equal(malformed.status, 307);
  assert.match(malformed.headers.get('set-cookie'), /insforge_access_token=;/);
  // A plausible unexpired JWT must still fail server validation.
  const forged = [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: 'fake-user', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'invalid'].join('.');
  const rejected = await fetch(base + '/dashboard', { redirect: 'manual', headers: { cookie: 'insforge_access_token=' + forged } });
  const body = await rejected.text();
  assert.ok((rejected.status === 307 && rejected.headers.get('location')?.includes('/login')) || body.includes('NEXT_REDIRECT') && body.includes('/login'));
  assert.ok(!body.includes('You’re signed in as'));
  console.log('PASS malformed and forged sessions rejected');

  const expiredPayload = Buffer.from(JSON.stringify({ sub: 'fake-user', exp: 1 })).toString('base64url');
  const expired = await fetch(base + '/dashboard', { redirect: 'manual', headers: { cookie: 'insforge_access_token=e30.' + expiredPayload + '.invalid; insforge_refresh_token=invalid' } });
  assert.equal(expired.status, 307);
  assert.match(expired.headers.get('set-cookie'), /insforge_refresh_token=;/);
  console.log('PASS expired session with rejected refresh returns to login');

  const invalidExchange = await fetch(base + '/api/auth/callback?insforge_code=invalid', { redirect: 'manual', headers: { cookie: 'nextrole_oauth_verifier=invalid' } });
  assert.equal(new URL(invalidExchange.headers.get('location'), base).searchParams.get('error'), 'oauth');
  assert.match(invalidExchange.headers.get('set-cookie'), /nextrole_oauth_verifier=;/);
  console.log('PASS rejected code exchange clears PKCE cookie');

  const client = createServerClient({ timeout: 10000, retryCount: 0 });
  let providerFailures = 0;
  for (const provider of ['google', 'github']) {
    const { data, error } = await client.auth.signInWithOAuth(provider, { redirectTo: base + '/api/auth/callback', skipBrowserRedirect: true });
    if (error) {
      providerFailures++;
      console.log('BLOCKED provider initiation:', provider, 'status:', error.statusCode, 'code:', error.error, 'message:', error.message);
    } else {
      assert.ok(data.url && data.codeVerifier);
      assert.equal(new URL(data.url).protocol, 'https:');
      console.log('PASS provider initiation:', provider);
    }
  }
  if (providerFailures) process.exitCode = 2;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
