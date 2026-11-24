import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import nextEnv from '@next/env';
import { createClient } from '@insforge/sdk';

nextEnv.loadEnvConfig(process.cwd());
const base = process.env.DISCOVERY_TEST_URL || 'http://localhost:3111';
const fixtures = JSON.parse(await fs.readFile('.env.discovery-fixtures.json', 'utf8'));
assert.equal(fixtures.length, 2);
assert.ok(fixtures.every(f => f.email === `nextrole-discovery-${f.id}@example.invalid`));
const config = { baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY, isServerMode: true, retryCount: 0, timeout: 15000 };
const sessions = [];
let checks = 0;
const check = (value, label) => { assert.ok(value, label); checks++; };
for (const fixture of fixtures) {
  const login = await createClient(config).auth.signInWithPassword({ email: fixture.email, password: fixture.password });
  check(!login.error && login.data?.accessToken, 'disposable fixture login');
  sessions.push({ id: fixture.id, cookie: `insforge_access_token=${login.data.accessToken}`, refresh: login.data.refreshToken, client: createClient({ ...config, accessToken: login.data.accessToken }) });
}
const [a,b] = sessions;
async function search(session, payload = {}, origin = base, cookie) {
  const response = await fetch(base + '/api/agent/find', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...(session ? { Cookie: cookie || session.cookie } : {}) }, body: JSON.stringify({ jobTitle: 'Frontend Developer', location: '', country: 'au', ...payload }), signal: AbortSignal.timeout(185000) });
  const body = await response.json();
  return { response, body };
}
check((await search(null)).response.status === 401, 'anonymous search denied');
check((await search(a, {}, 'https://foreign.invalid')).response.status === 403, 'cross origin denied');
check((await search(a, { country: 'invalid' })).response.status === 400, 'country allowlist');
check((await search(b, { userId: a.id })).response.status === 422, 'cannot choose foreign profile');
const refresh = await search(b, {}, base, `insforge_refresh_token=${b.refresh}`);
check(refresh.response.status === 422 && refresh.response.headers.getSetCookie().some(value => value.startsWith('insforge_access_token=') && !value.startsWith('insforge_access_token=;')), 'missing access cookie refreshes at discovery endpoint');
const inserted = await a.client.database.from('profiles').insert([{ id: a.id, current_title: 'Frontend Developer', skills: ['React','TypeScript','JavaScript','HTML','CSS'], years_experience: 4, experience_level: 'mid' }]);
if (inserted.error) {
  const existing = await a.client.database.from('profiles').select('id').eq('id', a.id).maybeSingle();
  check(Boolean(existing.data), 'synthetic profile exists from a previous verification attempt');
}
const before = await a.client.database.from('profiles').select('*').eq('id', a.id).single();
check(!before.error && before.data, 'saved partial profile available');
const result = await search(a, { userId: b.id, profile: { skills: ['forged'] } });
if (!result.body.success) console.log('Discovery feedback:', result.response.status, result.body.error);
check(result.response.ok && result.body.success, 'production discovery endpoint succeeds');
const summary = result.body.data;
console.log('Live discovery counts:', JSON.stringify(summary));
check(summary.retrieved > 0 && summary.retrieved <= 10 && summary.saved + summary.failed + summary.duplicates === summary.retrieved && summary.finalized, 'live counts reconcile');
check(summary.saved > 0 || summary.duplicates > 0, 'live matching and saving produced listings');
check(result.response.headers.get('cache-control').includes('no-store'), 'private discovery response');
const own = await a.client.database.from('jobs').select('*').eq('user_id', a.id);
check(!own.error && own.data.length > 0 && own.data.every(job => job.source === 'search' && job.external_id && job.external_apply_url && Number.isInteger(job.match_score) && job.match_reason), 'complete owner records persisted');
const afterProfile = await a.client.database.from('profiles').select('*').eq('id', a.id).single();
assert.deepEqual(afterProfile.data, before.data); checks++;
const run = await a.client.database.from('agent_runs').select('*').eq('user_id', a.id).eq('id', summary.runId).single();
check(!run.error && run.data.jobs_found === summary.saved && run.data.status === 'completed' && run.data.completed_at, 'live run counts and final status');
const foreign = await b.client.database.from('jobs').select('*').eq('user_id', a.id);
check(!foreign.error && !foreign.data.length, 'RLS blocks foreign job reads');
const forbidden = await b.client.database.from('jobs').insert([{ ...own.data[0], id: undefined }]);
check(Boolean(forbidden.error), 'RLS blocks foreign job writes');
const research = { companyOverview: 'Synthetic research retained', techStack: [], culture: [], whyThisRole: '', yourEdge: [], gapsToAddress: [], smartQuestions: [], interviewPrep: [], sources: [] };
check(!(await a.client.database.from('jobs').update({ company_research: research }).eq('user_id', a.id).eq('id', own.data[0].id)).error, 'synthetic research marker saved');
const repeat = await search(a);
check(repeat.body.success && repeat.body.data.duplicates > 0, 'repeat search skips existing IDs');
const retained = await a.client.database.from('jobs').select('*').eq('user_id', a.id).eq('id', own.data[0].id).single();
check(retained.data.match_score === own.data[0].match_score && retained.data.company_research.companyOverview === research.companyOverview, 'repeat preserves scores and research');
const html = await (await fetch(base + '/find-jobs', { headers: { Cookie: a.cookie } })).text();
check(html.includes(own.data[0].title.replaceAll('&', '&amp;')) || html.includes('Your saved jobs from Adzuna'), 'saved jobs reload on server');
check(html.includes('Jobs by Adzuna') && !html.includes('Previewing 8 sample'), 'credit and real data replace preview');
const foreignHtml = await (await fetch(base + '/find-jobs', { headers: { Cookie: b.cookie } })).text();
check(foreignHtml.includes('No saved jobs yet') && foreignHtml.includes('Complete your profile'), 'other user sees empty state and readiness guidance');
console.log(`PASS ${checks} live discovery, refresh, persistence, deduplication, profile preservation and ownership checks`);
