import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import nextEnv from '@next/env';
import { createClient } from '@insforge/sdk';

const fixturePath = '.env.dashboard-fixtures.json';
if (process.argv.includes('--prepare')) {
  const fixtures = [0, 1].map(() => { const id = randomUUID(); return { id, email: `nextrole-dashboard-${id}@example.invalid`, password: randomBytes(32).toString('base64url') }; });
  await fs.writeFile(fixturePath, JSON.stringify(fixtures), { flag: 'wx', mode: 0o600 });
  // Private orchestration consumes this output; never display these credentials.
  process.stdout.write(JSON.stringify(fixtures));
} else if (process.argv.includes('--remove-local-fixtures')) {
  await fs.unlink(fixturePath);
} else {
  nextEnv.loadEnvConfig(process.cwd());
  const fixtures = JSON.parse(await fs.readFile(fixturePath, 'utf8'));
  assert.equal(fixtures.length, 2);
  assert.ok(fixtures.every(f => f.email === `nextrole-dashboard-${f.id}@example.invalid`));
  const config = { baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY, isServerMode: true, retryCount: 0, timeout: 15000 };
  const sessions = [];
  let checks = 0;
  const check = (value, label) => { assert.ok(value, label); checks++; };
  const ok = (result, label) => { check(!result.error, label); return result.data; };
  const empty = { totalJobs: 0, averageMatchRate: null, companiesResearched: 0, jobsThisWeek: 0 };
  try {
    const anonymous = createClient(config);
    check(Boolean((await anonymous.database.rpc('dashboard_stats')).error), 'anonymous aggregate denied');
    for (const fixture of fixtures) {
      const login = ok(await createClient(config).auth.signInWithPassword({ email: fixture.email, password: fixture.password }), 'fixture login');
      check(Boolean(login?.accessToken), 'fixture access token');
      sessions.push({ id: fixture.id, cookie: `insforge_access_token=${login.accessToken}`, client: createClient({ ...config, accessToken: login.accessToken }) });
    }
    const [a, b] = sessions;
    for (const session of sessions) {
      assert.deepEqual(ok(await session.client.database.rpc('dashboard_stats'), 'empty without profile'), empty); checks++;
      ok(await session.client.database.from('profiles').insert([{ id: session.id }]), 'fixture profile');
      session.runId = randomUUID();
      ok(await session.client.database.from('agent_runs').insert([{ id: session.runId, user_id: session.id, job_title_searched: 'Dashboard fixture' }]), 'fixture run');
    }
    const now = Date.now(), day = 86400000;
    const job = (session, score, age, researched = false) => ({ user_id: session.id, run_id: session.runId, external_id: randomUUID(), title: 'Dashboard verification role', company: 'Repeated synthetic company', source_url: 'https://example.invalid/job', external_apply_url: 'https://example.invalid/apply', match_score: score, found_at: new Date(now - age).toISOString(), company_research: researched ? {} : null });
    ok(await a.client.database.from('jobs').insert([
      ...Array.from({ length: 22 }, () => job(a, 100, 8 * day)),
      job(a, 0, 3600000, true), job(a, 50, 7 * day - 3600000, true),
      job(a, 100, 7 * day + 3600000), job(a, 100, -day), job(a, 0, 0),
    ]), 'more than 20 mixed-age jobs');
    const first = ok(await a.client.database.rpc('dashboard_stats'), 'owner stats');
    check(first.totalJobs === 27 && Math.abs(first.averageMatchRate - 2450 / 27) < 0.000001, 'full dataset and zero scores included in average');
    check(first.companiesResearched === 2 && first.jobsThisWeek === 3, 'research per saved job and rolling week excluding future');
    assert.deepEqual(ok(await b.client.database.rpc('dashboard_stats'), 'other owner empty'), empty); checks++;
    ok(await b.client.database.from('jobs').insert([job(b, 10, 0)]), 'second owner job');
    assert.deepEqual(ok(await b.client.database.rpc('dashboard_stats'), 'second owner stats'), { totalJobs: 1, averageMatchRate: 10, companiesResearched: 0, jobsThisWeek: 1 }); checks++;
    check(Boolean((await b.client.database.rpc('dashboard_stats', { user_id: a.id })).error), 'caller cannot select another owner');
    const base = process.env.DASHBOARD_TEST_URL;
    if (base) {
      const anonymousPage = await fetch(`${base}/dashboard`, { redirect: 'manual' });
      check(anonymousPage.status === 307 && anonymousPage.headers.get('location').includes('/login'), 'anonymous dashboard protected');
      const page = await fetch(`${base}/dashboard`, { headers: { Cookie: a.cookie } });
      const html = await page.text();
      const statsHtml = html.match(/<section aria-label="Job search statistics"[\s\S]*?<\/section>/)?.[0] || '';
      check(page.ok && statsHtml.includes('>27<') && statsHtml.includes('>91%<') && statsHtml.includes('>2<') && statsHtml.includes('>3<'), 'authenticated dashboard renders actual stats');
      check(!statsHtml.includes('+12%') && !statsHtml.includes('>284<'), 'no fixture numbers or invented trends');
      const other = await (await fetch(`${base}/dashboard`, { headers: { Cookie: b.cookie } })).text();
      const otherStats = other.match(/<section aria-label="Job search statistics"[\s\S]*?<\/section>/)?.[0] || '';
      check(otherStats.includes('>10%<') && !otherStats.includes('>91%<'), 'HTTP owner isolation');
    }
    ok(await a.client.database.from('jobs').insert([job(a, 100, 0, true)]), 'new saved job');
    const refreshed = ok(await a.client.database.rpc('dashboard_stats'), 'refreshed stats');
    check(refreshed.totalJobs === 28 && refreshed.companiesResearched === 3 && refreshed.jobsThisWeek === 4, 'new writes reflected without cached stats');
    if (base) {
      const html = await (await fetch(`${base}/dashboard`, { headers: { Cookie: a.cookie } })).text();
      check(html.includes('>28<') && html.includes('>4<'), 'HTTP reload shows updated data');
    }
    console.log(`PASS ${checks} live SDK${base ? '/HTTP' : ''} dashboard stats checks`);
  } finally {
    for (const session of sessions) check(!(await session.client.database.from('profiles').delete().eq('id', session.id)).error, 'fixture application data cleanup');
  }
}
