import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(file, mocks = {}, globals = {}) {
  const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: id => id in mocks ? mocks[id] : require(id), process, console, URL, URLSearchParams, Response, Request, AbortSignal, fetch, ...globals }, { filename: file });
  return exports;
}
let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; }
function rejects(fn, label) { assert.throws(fn, undefined, label); checks++; }
const helpers = load('lib/job-discovery.ts');
const profiles = load('lib/profile.ts');
const profile = profiles.parseProfile({ current_title: 'Developer', skills: ['React', 'TypeScript'], job_titles_seeking: [], industries: [], preferred_locations: [], work_experience: [], education: null });
check(helpers.canDiscover(profile), 'partial profile allowed');
check(helpers.canDiscover({ ...profile, current_title: null, job_titles_seeking: ['Engineer'] }), 'desired title suffices');
for (const p of [null, { ...profile, skills: [] }, { ...profile, current_title: null }]) check(!helpers.canDiscover(p), 'insufficient profile denied');
for (const country of ['us','gb','au','ca']) check(helpers.parseJobSearch({ jobTitle: ' Developer ', location: ' ', country }).country === country, 'supported country');
check(helpers.parseJobSearch({ jobTitle: 'Developer' }).country === 'us', 'default US');
check(helpers.parseJobSearch({ jobTitle: 'Developer', location: ' Perth ' }).location === 'Perth', 'trimmed location');
for (const body of [null, [], {}, { jobTitle: ' ' }, { jobTitle: 'a'.repeat(151) }, { jobTitle: 'dev', location: 4 }, { jobTitle: 'dev', location: 'a'.repeat(201) }, { jobTitle: 'dev', country: '../xx' }]) rejects(() => helpers.parseJobSearch(body), 'bad search rejected');
const match = { matchScore: 70, matchReason: 'React fits; only a snippet was available.', matchedSkills: ['React'], missingSkills: ['Python'] };
check(helpers.validateJobMatch(match, profile).matchScore === 70, 'valid threshold score');
for (const value of [null, {}, { ...match, matchScore: -1 }, { ...match, matchScore: 101 }, { ...match, matchScore: 70.5 }, { ...match, matchReason: '' }, { ...match, matchedSkills: ['Python'] }, { ...match, missingSkills: ['React'] }, { ...match, missingSkills: [2] }]) rejects(() => helpers.validateJobMatch(value, profile), 'invalid model output rejected');
const provider = { id: 'adz-1', title: 'Developer', company: { display_name: 'Example Company' }, location: { display_name: 'Perth' }, description: 'React developer. Python beneficial.', redirect_url: 'https://www.adzuna.com/land/1', salary_min: 100000, salary_max: 120000, salary_is_predicted: 1, contract_type: 'permanent', contract_time: 'full_time' };
const adzunaMocks = { 'server-only': {}, '@/lib/job-discovery': helpers };
const adzuna = load('lib/adzuna.ts', adzunaMocks);
check(adzuna.parseAdzunaJob(provider, 'au').salary === 'AUD 100,000 – AUD 120,000 (estimated)', 'AUD and numeric estimated flag');
check(adzuna.parseAdzunaJob({ ...provider, salary_is_predicted: '1' }, 'ca').salary.includes('CAD') && adzuna.parseAdzunaJob(provider, 'gb').salary.includes('GBP'), 'country currencies');
check(adzuna.parseAdzunaJob({ ...provider, salary_max: undefined }, 'us').salary === 'USD 100,000+ (estimated)', 'minimum salary only');
check(adzuna.parseAdzunaJob({ ...provider, salary_min: undefined }, 'us').salary === 'Up to USD 120,000 (estimated)', 'maximum salary only');
check(adzuna.parseAdzunaJob({ ...provider, salary_min: undefined, salary_max: undefined, contract_type: undefined, contract_time: undefined }, 'us').salary === null, 'missing salary not fabricated');
check(adzuna.parseAdzunaJob({ ...provider, contract_type: undefined, contract_time: undefined }, 'us').jobType === null, 'missing employment type not fabricated');
for (const value of [{ ...provider, redirect_url: 'javascript:alert(1)' }, { ...provider, description: '' }, { ...provider, company: null }]) rejects(() => adzuna.parseAdzunaJob(value, 'us'), 'invalid provider listing rejected');

const originalEnv = { ...process.env };
process.env.ADZUNA_APP_ID = 'fixture-id'; process.env.ADZUNA_APP_KEY = 'fixture-key'; process.env.GEMINI_API_KEY = 'fixture-gemini';
try {
  for (const country of ['us','gb','au','ca']) {
    let called;
    const api = load('lib/adzuna.ts', adzunaMocks, { fetch: async (url, options) => { called = new URL(url); check(options.cache === 'no-store', 'provider response uncached'); return Response.json({ results: [provider, { ...provider, id: '' }] }); } });
    const result = await api.searchJobs({ jobTitle: 'React Developer', location: '', country });
    check(called.pathname === `/v1/api/jobs/${country}/search/1` && !called.searchParams.has('where'), 'country endpoint and omitted blank location');
    check(called.searchParams.get('category') === 'it-jobs' && called.searchParams.get('results_per_page') === '10', 'IT filter and ten result cap');
    check(result.retrieved === 2 && result.invalid === 1 && result.jobs.length === 1, 'invalid listing isolated');
  }
  const api = load('lib/adzuna.ts', adzunaMocks, { fetch: async url => { check(new URL(url).searchParams.get('where') === 'Perth', 'provided location sent'); return Response.json({ results: [] }); } });
  await api.searchJobs({ jobTitle: 'Developer', location: 'Perth', country: 'au' });
  for (const reply of [new Response('unavailable', { status: 503 }), Response.json({}), Response.json({ results: null })]) {
    const api = load('lib/adzuna.ts', adzunaMocks, { fetch: async () => reply });
    await assert.rejects(() => api.searchJobs({ jobTitle: 'Developer', location: '', country: 'us' }), /Adzuna could not/); checks++;
  }
  delete process.env.ADZUNA_APP_ID; delete process.env.ADZUNA_APP_KEY;
  process.env.AZUNA_API_ID = 'alias-id'; process.env.AZUNA_API_KEY = 'alias-key';
  check(adzuna.adzunaCredentials().appId === 'alias-id', 'existing local key aliases supported');
  process.env.ADZUNA_APP_ID = 'fixture-id'; process.env.ADZUNA_APP_KEY = 'fixture-key';

  function matcher(reply, failure) {
    return load('agent/matcher.ts', { 'server-only': {}, '@/lib/job-discovery': helpers, '@/lib/gemini': { GEMINI_EXTRACTION_MODEL: 'gemini-3.5-flash-lite', createGemini: () => ({ chat: { completions: { create: async (request, options) => {
      const input = JSON.parse(request.messages[1].content);
      check(!('email' in input.candidate) && !('phone' in input.candidate) && !('full_name' in input.candidate), 'model excludes contacts');
      check(options.timeout === 20000 && options.signal && request.messages[0].content.includes('SNIPPET'), 'bounded matching with snippet limitation');
      if (failure) throw new Error('provider error'); return reply;
    } } } }) } });
  }
  const valid = { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(match) } }] };
  check((await matcher(valid).matchJob(adzuna.parseAdzunaJob(provider, 'au'), profile, AbortSignal.timeout(1000))).success, 'model result accepted');
  for (const value of [{ choices: [] }, { choices: [{ finish_reason: 'length', message: { content: '{}' } }] }, { choices: [{ finish_reason: 'stop', message: { content: '{broken' } }] }, { choices: [{ finish_reason: 'stop', message: { content: '{}', refusal: 'refused' } }] }]) check(!(await matcher(value).matchJob(adzuna.parseAdzunaJob(provider, 'au'), profile, AbortSignal.timeout(1000))).success, 'malformed model reply denied');

  function harness(options = {}) {
    const records = [], updates = [], events = [], filters = [], scored = [];
    const existing = new Set(options.existing ?? []);
    let active = 0, peak = 0;
    const jobs = Array.from({ length: options.count ?? 5 }, (_, i) => ({ ...adzuna.parseAdzunaJob(provider, 'us'), id: String(i) }));
    const client = { database: { from(table) {
      let op = 'select', payload, eq = [], ids;
      const q = {
        select() { return q; }, insert(value) { op = 'insert'; payload = value; return q; }, update(value) { op = 'update'; payload = value; return q; },
        eq(key, value) { eq.push([key, value]); return q; }, in(key, value) { ids = value; return q; },
        single() { return execute(); }, maybeSingle() { return execute(); }, then(resolve, reject) { return execute().then(resolve, reject); },
      };
      async function execute() {
        filters.push({ table, op, eq });
        if (op !== 'insert') assert.ok(eq.some(([key,value]) => key === 'user_id' && value === 'owner'), 'every read/update owner scoped');
        if (table === 'agent_runs' && op === 'insert') return { data: { id: 'run' } };
        if (table === 'agent_runs' && op === 'update') { updates.push(payload); return { data: options.finalizeFailure ? null : { id: 'run' }, error: options.finalizeFailure ? {} : null }; }
        if (table === 'agent_logs') return {};
        if (table === 'jobs' && op === 'select') {
          if (options.readFailure) return { error: {} };
          return ids ? { data: ids.filter(id => existing.has(id)).map(external_id => ({ external_id })) } : { data: options.race ? { id: 'concurrent' } : null };
        }
        if (table === 'jobs' && op === 'insert') {
          assert.equal(payload[0].user_id, 'owner'); assert.equal(payload[0].run_id, 'run'); assert.equal(payload[0].source, 'search');
          if (options.saveFailure || options.race) return { error: {} };
          records.push(payload[0]); return { data: { id: 'saved-' + payload[0].external_id } };
        }
        throw new Error('unexpected query');
      }
      return q;
    } } };
    const agent = load('agent/adzuna.ts', {
      'server-only': {}, '@/lib/adzuna': { searchJobs: async () => { if (options.providerFailure) throw new Error('Adzuna could not complete this search. Please try again shortly.'); return { jobs: options.repeat ? [...jobs, jobs[0]] : jobs, retrieved: jobs.length + (options.invalid ?? 0) + (options.repeat ? 1 : 0), invalid: options.invalid ?? 0 }; } },
      '@/agent/matcher': { matchJob: async job => { active++; peak = Math.max(peak, active); scored.push(job.id); await new Promise(resolve => setTimeout(resolve, 2)); active--; return options.modelFailure || job.id === options.failId ? { success: false } : { success: true, data: { ...match, matchScore: job.id === '0' ? 69 : 70 } }; } },
      '@/lib/utils': { MATCH_THRESHOLD: 70 }, '@/lib/posthog-server': { captureDiscoveryEvents: async (owner, value) => { assert.equal(owner, 'owner'); events.push(...value); } },
    });
    return { run: () => agent.discoverJobs(client, 'owner', { jobTitle: 'Developer', location: '', country: 'us' }, profile), records, updates, events, scored, peak: () => peak };
  }
  let h = harness(); let result = await h.run();
  check(result.success && result.data.saved === 5 && result.data.strong === 4, 'all scores saved and threshold applied');
  check(h.peak() === 3, 'scoring concurrency limited to three');
  check(h.events.filter(e => e.event === 'job_found').length === 5 && h.events[0].event === 'job_search_started', 'events only for new saved jobs');
  check(h.updates[0].status === 'completed' && h.updates[0].jobs_found === 5 && h.updates[0].completed_at, 'run finalized with saved count');
  check(h.records.every(row => row.about_role === provider.description && !('responsibilities' in row) && !('company_research' in row)), 'snippet preserved without fabricated structure');
  h = harness({ existing: ['0','1'], failId: '2', invalid: 1 }); result = await h.run();
  check(result.data.saved === 2 && result.data.duplicates === 2 && result.data.failed === 2 && result.data.retrieved === 6, 'partial counts reconcile');
  check(!h.scored.includes('0') && !h.scored.includes('1'), 'duplicates not rescored');
  h = harness({ existing: ['0','1','2','3','4'] }); result = await h.run();
  check(result.data.saved === 0 && result.data.duplicates === 5 && h.scored.length === 0 && h.updates[0].status === 'completed', 'repeat search preserves saved jobs');
  h = harness({ repeat: true }); result = await h.run(); check(result.data.saved === 5 && result.data.duplicates === 1, 'duplicate within response skipped');
  h = harness({ race: true }); result = await h.run(); check(result.data.duplicates === 5 && result.data.failed === 0 && h.events.length === 1, 'concurrent duplicate classified safely');
  for (const options of [{ modelFailure: true }, { saveFailure: true }]) { h = harness(options); result = await h.run(); check(result.data.failed === 5 && result.data.saved === 0 && h.updates[0].status === 'failed', 'total failure finalizes as failed'); }
  h = harness({ count: 0 }); result = await h.run(); check(result.success && !result.data.retrieved && h.updates[0].status === 'completed', 'empty search completes');
  h = harness({ providerFailure: true }); result = await h.run(); check(!result.success && h.updates[0].status === 'failed', 'provider failure finalizes run');
  h = harness({ finalizeFailure: true }); result = await h.run(); check(result.success && result.data.saved === 5 && !result.data.finalized, 'finalization failure retains saved results and warns');
  h = harness({ readFailure: true }); result = await h.run(); check(!result.success && !h.scored.length, 'duplicate read failure prevents scoring');

  function routeHarness(options = {}) {
    let calls = 0;
    const route = load('app/api/agent/find/route.ts', {
      'next/cache': { revalidatePath() {} }, '@/lib/auth': { getAuthUser: async () => options.anonymous ? null : { id: 'owner' } }, '@/lib/job-discovery': helpers, '@/lib/profile': profiles,
      '@/lib/adzuna': { adzunaCredentials: () => options.unconfigured ? null : {} },
      '@/lib/insforge-server': { createInsforgeServer: async () => ({ database: { from: () => ({ select() { return this; }, eq(key, value) { assert.equal(key, 'id'); assert.equal(value, 'owner'); return this; }, maybeSingle: async () => ({ data: options.missing ? null : { ...profile, skills: options.incomplete ? [] : profile.skills }, error: options.dbFailure ? {} : null }) }) } }) },
      '@/agent/adzuna': { discoverJobs: async (client, owner, search, saved) => { assert.equal(owner, 'owner'); assert.equal(saved.current_title, 'Developer'); assert.equal(search.country, 'au'); calls++; return { success: true, data: { saved: 1 } }; } },
    });
    return { calls: () => calls, run: (body = JSON.stringify({ jobTitle: 'Developer', location: '', country: 'au', userId: 'foreign', profile: { current_title: 'forged' } }), origin = 'http://localhost') => route.POST(new Request('http://localhost/api/agent/find', { method: 'POST', headers: { Origin: origin }, body })) };
  }
  for (const [options, status] of [[{ anonymous: true }, 401], [{ missing: true }, 422], [{ incomplete: true }, 422], [{ dbFailure: true }, 503], [{ unconfigured: true }, 503]]) { const r = routeHarness(options); check((await r.run()).status === status && !r.calls(), 'invalid caller/profile/config rejected before discovery'); }
  for (const body of ['{broken', '{}', 'x'.repeat(2049), JSON.stringify({ jobTitle: 'dev', country: 'bad' })]) { const r = routeHarness(); check((await r.run(body)).status === 400 && !r.calls(), 'invalid payload denied'); }
  let r = routeHarness(); check((await r.run(undefined, 'https://foreign.invalid')).status === 403 && !r.calls(), 'cross origin denied');
  r = routeHarness(); const response = await r.run(); check(response.ok && r.calls() === 1 && response.headers.get('cache-control').includes('no-store'), 'server uses saved owner profile and private response');
  const client = load('lib/job-discovery-client.ts', { '@/lib/job-discovery': helpers }, { fetch: async () => Response.json({ success: true, data: { retrieved: 3, saved: 1, strong: 1, duplicates: 1, failed: 1, finalized: true, runId: 'run' } }) });
  const feedback = await client.requestJobDiscovery({ jobTitle: 'Developer', location: '', country: 'us' });
  check(feedback.warning && feedback.message.includes('1 already saved') && feedback.message.includes('1 could not'), 'partial UI feedback');
  const delivered = [];
  let shutdown = false;
  class PostHog {
    constructor(token, options) { check(token === process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && options.flushAt === 1 && options.flushInterval === 0 && options.fetchRetryCount === 0, 'analytics config uses existing project and immediate capture'); }
    on() {}
    capture(event) { delivered.push(event); }
    async shutdown() { shutdown = true; }
  }
  const oldToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, oldHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = 'fixture-token'; process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://analytics.example.invalid';
  try {
    const analytics = load('lib/posthog-server.ts', { 'server-only': {}, 'posthog-node': { PostHog } });
    await analytics.captureDiscoveryEvents('owner', [{ event: 'job_found', timestamp: new Date(), properties: { source: 'search', matchScore: 70 } }]);
    check(shutdown && delivered[0].distinctId === 'owner' && delivered[0].properties.userId === 'owner', 'analytics flushed with authenticated identity');
    class BrokenPostHog { constructor() { throw new Error('unavailable'); } }
    const failing = load('lib/posthog-server.ts', { 'server-only': {}, 'posthog-node': { PostHog: BrokenPostHog } });
    await failing.captureDiscoveryEvents('owner', []); check(true, 'analytics failure isolated from search');
  } finally {
    if (oldToken === undefined) delete process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN; else process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = oldToken;
    if (oldHost === undefined) delete process.env.NEXT_PUBLIC_POSTHOG_HOST; else process.env.NEXT_PUBLIC_POSTHOG_HOST = oldHost;
  }
} finally {
  for (const name of ['ADZUNA_APP_ID','ADZUNA_APP_KEY','AZUNA_API_ID','AZUNA_API_KEY','GEMINI_API_KEY']) { if (originalEnv[name] === undefined) delete process.env[name]; else process.env[name] = originalEnv[name]; }
}
console.log(`PASS ${checks} discovery validation, provider, model, ownership, duplicate, concurrency, failure and route checks`);
