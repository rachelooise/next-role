import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import nextEnv from '@next/env';
import { createClient } from '@insforge/sdk';
import ts from 'typescript';

nextEnv.loadEnvConfig(process.cwd());
const fixtures = JSON.parse(await fs.readFile('.env.dashboard-fixtures.json', 'utf8'));
assert.equal(fixtures.length, 2);
assert.ok(fixtures.every(f => f.email === `nextrole-dashboard-${f.id}@example.invalid`));
const require = createRequire(import.meta.url);
function load(file, mocks) {
  const exports = {};
  const source = ts.transpileModule(sources.get(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { exports, require: id => id in mocks ? mocks[id] : require(id), console }, { filename: file });
  return exports;
}
const sources = new Map();
for (const file of ['lib/dashboard-activity.ts', 'lib/dashboard-activity-server.ts']) sources.set(file, await fs.readFile(file, 'utf8'));
const activity = load('lib/dashboard-activity.ts', {});
const config = { baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY, isServerMode: true, retryCount: 0, timeout: 15000 };
const sessions = [];
let checks = 0;
const check = (value, label) => { assert.ok(value, label); checks++; };
const ok = (result, label) => { check(!result.error, label); return result.data; };
const base = process.env.DASHBOARD_TEST_URL;
try {
  for (const fixture of fixtures) {
    const login = ok(await createClient(config).auth.signInWithPassword({ email: fixture.email, password: fixture.password }), 'fixture login');
    const client = createClient({ ...config, accessToken: login.accessToken });
    const { loadDashboardActivity } = load('lib/dashboard-activity-server.ts', { 'server-only': {}, '@/lib/insforge-server': { createInsforgeServer: async () => client }, '@/lib/dashboard-activity': activity });
    const session = { id: fixture.id, client, load: loadDashboardActivity, cookie: `insforge_access_token=${login.accessToken}` };
    sessions.push(session);
    const empty = await session.load(session.id);
    check(!empty.error && empty.entries.length === 0, 'no-profile activity is empty');
    ok(await client.database.from('profiles').insert([{ id: session.id }]), 'fixture profile');
  }
  const [a, b] = sessions;
  const now = Date.now(), minute = 60000, day = 86400000;
  const at = age => new Date(now - age).toISOString();
  const run = (session, title, age, jobs_found, status = 'completed') => ({ id: randomUUID(), user_id: session.id, job_title_searched: title, jobs_found, status, started_at: at(20 * day), completed_at: age === null ? null : at(age) });
  const late = run(a, 'Long-running search', 2 * minute, 3);
  const zero = run(a, 'Zero results search', 3 * minute, 0);
  const one = run(a, 'One result search', 4 * minute, 1);
  ok(await a.client.database.from('agent_runs').insert([
    late, zero, one, ...[5, 6, 7, 8, 9, 10].map(age => run(a, 'Older search', age * minute, 2)),
    run(a, 'Running search must be hidden', null, 0, 'running'),
    run(a, 'Failed search must be hidden', 1000, 99, 'failed'),
    run(a, 'Missing completion must be hidden', null, 2),
    run(a, 'Future completion must be hidden', -day, 2),
  ]), 'mixed completed/running/failed runs');
  const job = (company, age, dossier = {}) => ({ id: randomUUID(), user_id: a.id, run_id: late.id, external_id: randomUUID(), title: 'Synthetic role', company, source_url: 'https://example.invalid/job', external_apply_url: 'https://example.invalid/apply', match_score: 80, found_at: at(40 * day), company_research: dossier, company_researched_at: age === null ? null : at(age), company_research_status: 'failed' });
  const newest = job('Newest research fixture', minute), retained = job('Retained research fixture', 2.5 * minute);
  ok(await a.client.database.from('jobs').insert([
    newest, retained, job('No dossier must be hidden', 1000, null), job('Undated dossier must be hidden', null), job('Future research must be hidden', -day),
  ]), 'research fixtures including invalid event states');
  const result = await a.load(a.id);
  check(!result.error && result.entries.length === 5, 'five real entries');
  assert.deepEqual(Array.from(result.entries, entry => entry.id), [`research:${newest.id}`, `search:${late.id}`, `research:${retained.id}`, `search:${zero.id}`, `search:${one.id}`]); checks++;
  check(result.entries[0].message === 'Researched Newest research fixture' && result.entries[0].tone === 'info', 'research wording and blue tone');
  check(result.entries[1].message === 'Found 3 jobs for Long-running search' && result.entries[1].tone === 'success', 'completion order and green tone');
  check(result.entries[3].message === 'Found 0 jobs for Zero results search' && result.entries[4].message === 'Found 1 job for One result search', 'zero and singular grammar');
  check(result.entries.every(entry => entry.occurredAt && entry.time.includes('ago')), 'saved timestamps and relative labels');
  check((await b.load(b.id)).entries.length === 0, 'other user sees empty feed');
  const foreign = await b.load(a.id);
  check(!foreign.error && foreign.entries.length === 0, 'RLS denies foreign owner filter');
  const foreignRun = run(b, 'Second user private search', minute, 7);
  ok(await b.client.database.from('agent_runs').insert([foreignRun]), 'second owner activity');
  check((await b.load(b.id)).entries[0].message === 'Found 7 jobs for Second user private search', 'second owner gets own feed');
  const htmlActivity = html => html.match(/<section aria-labelledby="recent-activity-title"[\s\S]*?<\/section>/)?.[0] || '';
  if (base) {
    const response = await fetch(`${base}/dashboard`, { headers: { Cookie: a.cookie } });
    const html = await response.text(), section = htmlActivity(html);
    check(response.ok && (section.match(/<li /g) || []).length === 5, 'authenticated activity renders');
    check(section.includes('Newest research fixture') && section.includes('Found 0 jobs for Zero results search') && section.includes('Found 1 job for One result search'), 'real event labels in dashboard');
    check(!section.includes('must be hidden') && !section.includes('Second user private') && !section.includes('Researched Stripe'), 'no excluded, foreign or mock events');
    check(section.includes('<time dateTime=') && html.includes('Charts show sample data.'), 'semantic timestamps and chart-only preview disclosure');
    const other = htmlActivity(await (await fetch(`${base}/dashboard`, { headers: { Cookie: b.cookie } })).text());
    check(other.includes('Second user private search') && !other.includes('Newest research fixture'), 'HTTP owner isolation');
  }
  ok(await a.client.database.from('jobs').update({ company_researched_at: new Date().toISOString() }).eq('id', retained.id).eq('user_id', a.id), 'simulated successful research refresh');
  const refreshed = await a.load(a.id);
  check(refreshed.entries[0].id === `research:${retained.id}` && refreshed.entries.filter(entry => entry.id === `research:${retained.id}`).length === 1, 'refreshed dossier moves up without duplicate entries');
  if (base) {
    const section = htmlActivity(await (await fetch(`${base}/dashboard`, { headers: { Cookie: a.cookie } })).text());
    check(section.indexOf('Retained research fixture') < section.indexOf('Newest research fixture'), 'HTTP reload reflects research save');
    const anonymous = await fetch(`${base}/dashboard`, { redirect: 'manual' });
    check(anonymous.status === 307 && anonymous.headers.get('location').includes('/login'), 'anonymous dashboard denied');
  }
  console.log(`PASS ${checks} live activity SDK${base ? '/HTTP' : ''} checks`);
} finally {
  for (const session of sessions) check(!(await session.client.database.from('profiles').delete().eq('id', session.id)).error, 'fixture application data cleanup');
}
