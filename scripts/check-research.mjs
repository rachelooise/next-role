import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { makeLoader } from './research-test-loader.mjs';

let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; }
async function rejects(fn, label) { await assert.rejects(fn); checks++; console.log(`  ${label}`); }
const owner = '11111111-1111-4111-8111-111111111111', other = '22222222-2222-4222-8222-222222222222';
const jobId = '33333333-3333-4333-8333-333333333333', requestId = '44444444-4444-4444-8444-444444444444';
const dossier = { companyOverview: 'A company building developer tools.', techStack: ['TypeScript'], culture: [], whyThisRole: 'Inference: the role supports the product.', yourEdge: ['Your TypeScript experience matches the role.'], gapsToAddress: ['Prepare an honest example of learning browser automation.'], smartQuestions: ['How does the team test browser reliability?'], interviewPrep: ['Prepare an example of handling retries.'], sources: ['https://example.com/about'], researchBasis: 'website', limitations: 'The saved job description may be a preview.' };
const job = () => ({ id: jobId, user_id: owner, company: 'Example', title: 'Engineer', source_url: 'https://example.com/jobs', about_role: 'A synthetic TypeScript role.', about_company: null, responsibilities: [], requirements: [], nice_to_have: [], benefits: [], matched_skills: ['TypeScript'], missing_skills: ['Browser automation'], company_research: null, company_researched_at: null, company_research_status: 'idle', company_research_request_id: null, company_research_run_id: null, company_research_requested_at: null });
const profile = { id: owner, email: 'private@example.invalid', phone: 'PRIVATE', current_title: 'Engineer', experience_level: 'mid', years_experience: 3, skills: ['TypeScript'], industries: ['Software'], work_experience: [] };

function database(rows = [job()]) {
  const state = { jobs: rows, profiles: [profile], agent_logs: [], operations: [], fail: null };
  class Query {
    constructor(table) { this.table = table; this.filters = []; this.mode = 'read'; this.returning = false; }
    select(columns) { this.columns = columns; this.returning = true; return this; }
    eq(key, value) { this.filters.push(row => row[key] === value); state.operations.push([this.table, 'eq', key, value]); return this; }
    in(key, values) { this.filters.push(row => values.includes(row[key])); return this; }
    update(values) { this.mode = 'update'; this.values = values; return this; }
    insert(values) { this.mode = 'insert'; this.values = values; return this; }
    async execute(single = false) {
      if (state.fail?.(this)) return { data: null, error: { message: 'PRIVATE_PROVIDER_DETAIL' } };
      const rows = state[this.table].filter(row => this.filters.every(matches => matches(row)));
      if (this.mode === 'update') rows.forEach(row => Object.assign(row, this.values));
      if (this.mode === 'insert') state[this.table].push(...this.values);
      const result = this.mode === 'insert' ? this.values : rows;
      return { data: this.returning ? single ? result[0] || null : result : null, error: null };
    }
    maybeSingle() { return this.execute(true); }
    then(resolve, reject) { return this.execute().then(resolve, reject); }
  }
  return { state, client: { database: { from: table => new Query(table) } } };
}

const pure = makeLoader()('lib/company-research.ts');
check(pure.dossierSchema.safeParse(dossier).success, 'complete dossier accepted');
check(!pure.dossierSchema.safeParse({ ...dossier, yourEdge: [] }).success, 'personalized advice required');
check(!pure.dossierSchema.safeParse({ ...dossier, sources: ['javascript:alert(1)'] }).success, 'script source rejected');
check(!pure.dossierSchema.safeParse({ ...dossier, sources: ['https://user:pass@example.com'] }).success, 'credential source rejected');
check(!pure.researchRequestSchema.safeParse({ jobId, userId: other }).success, 'client supplied owner rejected');
check(pure.publicResearchState({}).status === 'idle', 'empty jobs start idle');
check(pure.publicResearchState({ company_research: dossier }).status === 'completed', 'existing dossiers restored');
check(pure.publicResearchState({ company_research: dossier, company_research_status: 'failed' }).dossier, 'failed refresh retains old dossier');

let requests = [], destroyed = 0, redirects = [], dns = [{ address: '93.184.215.14', family: 4 }], lookupHook;
const urlLoad = makeLoader({
  'node:dns/promises': { lookup: async () => dns },
  undici: { Agent: class { constructor(options) { lookupHook = options.connect.lookup; } async destroy() { destroyed++; } }, fetch: async url => { requests.push(url.href); const next = redirects.shift() || { status: 200 }; return { status: next.status, ok: next.status === 200, body: { cancel: async () => {} }, headers: new Headers(next.location ? { location: next.location } : {}) }; } },
});
const urls = urlLoad('lib/research-urls.ts');
for (const value of ['http://example.com', 'https://127.0.0.1', 'https://localhost', 'https://example.com:8443', 'https://x:y@example.com', 'https://example.com./']) {
  assert.throws(() => urls.researchUrl(value)); checks++;
}
for (const value of ['0.0.0.0', '10.0.0.1', '100.64.0.1', '127.0.0.1', '169.254.169.254', '172.16.0.1', '192.168.1.1', '198.18.0.1', '::1', '::ffff:127.0.0.1', 'fc00::1', 'fe80::1']) check(!urls.publicAddress(value), `nonpublic address ${value} rejected`);
check(urls.publicAddress('8.8.8.8') && urls.publicAddress('2606:4700:4700::1111'), 'public addresses allowed');
check(urls.companyDomain('https://jobs.example.co.uk/a') === 'example.co.uk', 'public suffix aware domain matching');
check(urls.isJobHost('https://boards.greenhouse.io/example') && !urls.isJobHost('https://example.com'), 'ATS distinguished from employer');
redirects = [{ status: 302, location: 'https://employer.com/jobs' }, { status: 200 }];
check((await urls.resolveResearchRedirect('https://example.com/a')).hostname === 'employer.com' && destroyed === 1, 'redirect validated and dispatcher closed');
redirects = [{ status: 302, location: 'https://127.0.0.1/admin' }];
await rejects(() => urls.resolveResearchRedirect('https://example.com/a'), 'private redirect rejected');
check(destroyed === 2, 'dispatcher closed on redirect failure');
dns = [{ address: '10.0.0.1', family: 4 }];
await rejects(() => urls.assertPublicHost(new URL('https://example.com')), 'private DNS rejected');
await new Promise(resolve => lookupHook('example.com', {}, error => { check(Boolean(error), 'connection DNS checks prevent rebinding'); resolve(); }));

const priorKey = process.env.TRIGGER_SECRET_KEY;
process.env.TRIGGER_SECRET_KEY = 'synthetic-test-value';
let triggered = [], runStatus = 'QUEUED', triggerFails = false;
const db = database();
const server = makeLoader({ '@trigger.dev/sdk': { tasks: { trigger: async (id, payload, options) => { triggered.push({ id, payload, options }); if (triggerFails) throw new Error('PRIVATE'); return { id: 'run_synthetic' }; } }, runs: { retrieve: async () => ({ status: runStatus }) } } })('lib/research-server.ts');
check(await server.readResearch(db.client, other, jobId) === null, 'foreign research inaccessible');
const start = await Promise.all([server.queueResearch(db.client, owner, jobId), server.queueResearch(db.client, owner, jobId)]);
check(start.every(item => item.status === 'queued') && triggered.length === 1, 'concurrent starts dispatch only once');
check(Object.keys(triggered[0].payload).sort().join(',') === 'jobId,requestId,userId', 'task payload contains identifiers only');
check(triggered[0].options.idempotencyKey === triggered[0].payload.requestId && triggered[0].options.ttl === '1h', 'dispatch has idempotency and bounded queue');
await server.queueResearch(db.client, owner, jobId);
check(triggered.length === 1, 'repeat clicks reuse active task');
db.state.jobs[0].company_research = dossier;
runStatus = 'FAILED';
const stopped = await server.readResearch(db.client, owner, jobId);
check(stopped.status === 'failed' && stopped.dossier, 'terminal task failure recovers state without losing dossier');
triggerFails = true;
await rejects(() => server.queueResearch(db.client, owner, jobId), 'dispatch failure reported');
check(db.state.jobs[0].company_research_status === 'failed', 'dispatch failure is retryable');
db.state.jobs[0].company_research_status = 'running';
db.state.jobs[0].company_research_run_id = null;
db.state.jobs[0].company_research_requested_at = new Date(Date.now() - 71 * 60000).toISOString();
check((await server.readResearch(db.client, owner, jobId)).status === 'failed', 'orphaned tasks eventually become retryable');

let browsed = 0, synthesized = 0, synthesisFails = false, analyticsFails = false, analytics = 0;
const work = database([{ ...job(), company_research_status: 'queued', company_research_request_id: requestId }]);
const worker = makeLoader({
  '@/lib/research-clients': { researchDatabase: () => work.client },
  '@/agent/company-browser': { browseCompany: async () => { browsed++; return { pages: [], limitations: 'No website verified.' }; } },
  '@/agent/research-synthesis': { loadResearchInputs: async () => ({ job: job(), profile }), synthesizeResearch: async () => { synthesized++; if (synthesisFails) throw new Error('PRIVATE'); return { ...dossier, sources: [], researchBasis: 'job_profile' }; } },
  '@/lib/research-analytics': { captureCompanyResearched: async () => { analytics++; if (analyticsFails) throw new Error('PRIVATE'); } },
})('agent/research.ts');
const payload = { userId: owner, jobId, requestId };
check((await worker.researchCompany({ ...payload, userId: other }, work.client)).skipped && browsed === 0, 'foreign worker payload does no provider work');
check((await worker.researchCompany({ ...payload, requestId: jobId }, work.client)).skipped && browsed === 0, 'superseded worker does no provider work');
analyticsFails = true;
check((await worker.researchCompany(payload, work.client)).success, 'analytics failure does not fail successful research');
check(work.state.jobs[0].company_research_status === 'completed' && work.state.jobs[0].company_research.researchBasis === 'job_profile', 'fallback dossier saved with timestamp and completed state');
check(work.state.jobs[0].company_researched_at && analytics === 1 && synthesized === 1, 'successful save emits one event');
check((await worker.researchCompany(payload, work.client)).skipped && browsed === 1, 'task replay has no provider cost or duplicate event');
work.state.jobs[0].company_research_status = 'queued'; synthesisFails = true;
check(!(await worker.researchCompany(payload, work.client)).success && work.state.jobs[0].company_research_status === 'failed', 'model failure saves retryable state');
check(work.state.jobs[0].company_research && analytics === 1, 'failed refresh preserves dossier without success event');
check(work.state.agent_logs.some(row => row.level === 'error' && row.message.includes('at synthesis (unavailable)')) && !JSON.stringify(work.state.agent_logs).includes('PRIVATE'), 'failure activity identifies phase without leaking provider details');

let modelInput;
const synthesizer = makeLoader({ '@/lib/research-clients': { RESEARCH_MODEL: 'synthetic', researchGemini: () => ({ chat: { completions: { create: async input => { modelInput = input; return { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(dossier) } }] }; } } } }) } })('agent/research-synthesis.ts');
const evidence = { pages: [{ url: 'https://example.com/about', content: { product: 'developer tools' } }], limitations: 'A preview.' };
const actualInputs = await synthesizer.loadResearchInputs(work.client, owner, jobId);
check(!('email' in actualInputs.profile) && !('phone' in actualInputs.profile), 'professional input strips contact fields');
await synthesizer.synthesizeResearch(actualInputs.job, actualInputs.profile, evidence);
check(!modelInput.messages[1].content.includes('private@example.invalid') && !modelInput.messages[1].content.includes('source_url'), 'model receives no contact details or tracking URL');
await rejects(() => synthesizer.synthesizeResearch(actualInputs.job, actualInputs.profile, { pages: [], limitations: 'Fallback' }), 'invented source rejected in fallback');

let synthesisCalls = 0, retryDelays = [], synthesisResults = [];
const retrySynthesis = makeLoader({
  'node:timers/promises': { setTimeout: async ms => { retryDelays.push(ms); } },
  '@/lib/research-clients': { RESEARCH_MODEL: 'synthetic', researchGemini: () => ({ chat: { completions: { create: async () => {
    synthesisCalls++;
    const next = synthesisResults.shift();
    if (next instanceof Error) throw next;
    return { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(next ?? dossier) } }] };
  } } } }) },
})('agent/research-synthesis.ts');
const unavailable = () => Object.assign(new Error('PRIVATE_PROVIDER_DETAIL'), { status: 503 });
synthesisResults = [unavailable(), dossier];
check((await retrySynthesis.synthesizeResearch(actualInputs.job, actualInputs.profile, evidence)).companyOverview === dossier.companyOverview && synthesisCalls === 2 && retryDelays.join() === '2000', '503 recovers with exactly one delayed synthesis retry');
synthesisCalls = 0; retryDelays = []; synthesisResults = [unavailable(), unavailable(), dossier];
await rejects(() => retrySynthesis.synthesizeResearch(actualInputs.job, actualInputs.profile, evidence), 'second 503 remains retryable by the user');
check(synthesisCalls === 2 && retryDelays.length === 1 && synthesisResults.length === 1, 'persistent outage never makes a third request');
for (const status of [400, 401, 403, 429, 500]) {
  synthesisCalls = 0; retryDelays = []; synthesisResults = [Object.assign(new Error('PRIVATE'), { status })];
  await rejects(() => retrySynthesis.synthesizeResearch(actualInputs.job, actualInputs.profile, evidence), `HTTP ${status} is not retried`);
  check(synthesisCalls === 1 && retryDelays.length === 0, `HTTP ${status} makes one request`);
}
synthesisCalls = 0; retryDelays = []; synthesisResults = [{ ...dossier, yourEdge: [] }];
await rejects(() => retrySynthesis.synthesizeResearch(actualInputs.job, actualInputs.profile, evidence), 'invalid model output is not retried');
check(synthesisCalls === 1 && retryDelays.length === 0, 'validation failure makes one request');

let authUser = { id: owner };
const apiDb = database();
const route = makeLoader({ '@/lib/auth': { getAuthUser: async () => authUser }, '@/lib/insforge-server': { createInsforgeServer: async () => apiDb.client }, '@/lib/research-server': { readResearch: async (_client, userId) => userId === owner ? pure.publicResearchState(apiDb.state.jobs[0]) : null, queueResearch: async () => ({ status: 'queued', dossier: null, researchedAt: null, error: null }) } })('app/api/agent/research/route.ts');
const request = (body, origin = 'http://localhost:3000') => new Request('http://localhost:3000/api/agent/research', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
check((await route.POST(request({ jobId }, 'https://evil.example'))).status === 403, 'cross origin mutation denied');
authUser = null;
check((await route.POST(request({ jobId }))).status === 401 && (await route.GET(new Request(`http://localhost:3000/api/agent/research?jobId=${jobId}`))).status === 401, 'anonymous research denied');
authUser = { id: other };
check((await route.POST(request({ jobId }))).status === 404, 'foreign job uses same not found response');
authUser = { id: owner };
check((await route.POST(request({ jobId, userId: other }))).status === 400, 'owner injection denied');
const priorRef = process.env.TRIGGER_PROJECT_REF;
delete process.env.TRIGGER_PROJECT_REF;
const missingConfig = await route.POST(request({ jobId }));
check(missingConfig.status === 503 && !(await missingConfig.text()).includes('PRIVATE'), 'unconfigured service has safe feedback');
process.env.TRIGGER_PROJECT_REF = 'proj_synthetic';
check((await route.POST(request({ jobId }))).status === 202, 'valid owned start accepted');
apiDb.state.profiles[0] = { ...profile, skills: [] };
check((await route.POST(request({ jobId }))).status === 422, 'saved professional data required');
check((await route.GET(new Request(`http://localhost:3000/api/agent/research?jobId=${jobId}`))).headers.get('Cache-Control') === 'private, no-store', 'private status never cached');
if (priorKey === undefined) delete process.env.TRIGGER_SECRET_KEY; else process.env.TRIGGER_SECRET_KEY = priorKey;
if (priorRef === undefined) delete process.env.TRIGGER_PROJECT_REF; else process.env.TRIGGER_PROJECT_REF = priorRef;

const { ResearchDossier } = makeLoader()('components/job-details/ResearchDossier.tsx');
const html = renderToStaticMarkup(React.createElement(ResearchDossier, { dossier }));
for (const label of ['Company Overview', 'Tech Stack', 'Culture', 'Why This Role', 'Your Edge', 'Gaps to Address', 'Smart Questions', 'Interview Prep', 'Sources']) check(html.includes(label), `dossier renders ${label}`);
check(html.includes('rel="noopener noreferrer"') && html.includes('opens in a new tab'), 'sources have safe accessible links');
const fallbackHtml = renderToStaticMarkup(React.createElement(ResearchDossier, { dossier: { ...dossier, researchBasis: 'job_profile', sources: [] } }));
check(fallbackHtml.includes('Limited briefing') && fallbackHtml.includes('No company website sources'), 'fallback clearly labeled');
check(!renderToStaticMarkup(React.createElement(ResearchDossier, { dossier: { ...dossier, companyOverview: '<script>evil()</script>' } })).includes('<script>'), 'model output rendered as escaped text');

const browserEnv = Object.fromEntries(['BROWSERBASE_API_KEY', 'BROWSERBASE_PROJECT_ID', 'GEMINI_API_KEY'].map(key => [key, process.env[key]]));
for (const key of Object.keys(browserEnv)) process.env[key] = 'synthetic';
let closed = 0, extractorClosed = 0, visits = [], extractionCount = 0, launchOptions, official = true, initFails = false, closeFails = false;
let currentUrl = 'about:blank';
const browserMock = { context: { activePage: async () => ({ goto: async url => { currentUrl = url; visits.push(url); }, url: async () => currentUrl }), setDomainPolicy: async () => {} }, close: async () => { closed++; } };
const browse = makeLoader({
  '@browserbasehq/sdk/shims/node': {},
  '@/lib/stagehand-gemini': { generateBrowserResearch: async () => {} },
  '@browserbasehq/stagehand': {
    browserbase: { launch: async options => { launchOptions = options; return browserMock; } },
    Stagehand: { create: async () => { if (initFails) throw new Error('Synthetic initialization failure'); return { close: async () => { extractorClosed++; if (closeFails) throw new Error('Synthetic close failure'); }, extract: async () => {
      extractionCount++;
      return { data: extractionCount === 1 ? { isOfficialCompanySite: official, identityEvidence: 'Example is named on its own site.', oneLiner: 'Builds tools.', productSummary: 'Tools for developers.', signals: [], pageLinks: [{ url: 'https://evil.com/about', kind: 'about' }, ...['about','engineering','blog','product','team'].map(kind => ({ url: `https://example.com/${kind}`, kind }))] } : { keyPoints: ['A supported fact.'], technologies: [], valuesOrCulture: [], notable: [] } };
    } }; } },
  },
  '@/lib/research-urls': { researchUrl: urls.researchUrl, companyDomain: urls.companyDomain, isJobHost: urls.isJobHost, assertPublicHost: async () => {}, resolveResearchRedirect: async () => new URL('https://example.com/jobs/1') },
})('agent/company-browser.ts').browseCompany;
let evidenceResult = await browse({ company: 'Example', title: 'Engineer', sourceUrl: 'https://example.com/jobs/1' }, async () => {});
check(evidenceResult.pages.length === 4 && visits.length === 4 && !visits.some(url => url.includes('evil')), 'browser visits homepage and at most three same company subpages');
check(closed === 1 && extractorClosed === 1 && launchOptions.api_timeout === 120, 'browser and extractor close with bounded cloud expiry');
official = false; extractionCount = 0; visits = [];
evidenceResult = await browse({ company: 'Example', title: 'Engineer', sourceUrl: 'https://example.com/jobs/1' }, async () => {});
check(evidenceResult.pages.length === 0 && visits.length === 1 && closed === 2, 'unverified employer identity produces fallback and closes session');
initFails = true;
await browse({ company: 'Example', title: 'Engineer', sourceUrl: 'https://example.com/jobs/1' }, async () => {});
check(closed === 3, 'browser closes when extractor initialization fails');
initFails = false; official = true; extractionCount = 0; closeFails = true;
await browse({ company: 'Example', title: 'Engineer', sourceUrl: 'https://example.com/jobs/1' }, async () => {});
check(closed === 4, 'browser closes even when Stagehand close fails');
for (const [key, value] of Object.entries(browserEnv)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }

let browserModelRequest, providerRejects = false;
const adapter = makeLoader({ '@/lib/research-clients': { RESEARCH_MODEL: 'synthetic-model', researchGemini: () => ({ chat: { completions: { create: async (input, options) => {
  browserModelRequest = { input, options };
  if (providerRejects) { const error = new Error('PRIVATE_PROVIDER_DETAIL'); error.status = 503; throw error; }
  return { choices: [{ finish_reason: 'stop', message: { content: '{"company":"Example"}' } }] };
} } } }) } })('lib/stagehand-gemini.ts');
const generation = { messages: [{ role: 'user', content: { type: 'text', text: 'Synthetic page content' } }], systemPrompt: 'Use evidence only.', responseFormat: { type: 'json_schema', name: 'company', schema: { type: 'object', properties: { company: { type: 'string' } } } } };
const generated = await adapter.generateBrowserResearch(generation);
check(generated.outputFormat === 'json_schema' && generated.structuredContent.company === 'Example', 'Gemini callback returns Stagehand structured result');
check(browserModelRequest.input.model === 'synthetic-model' && browserModelRequest.options.timeout === 20000, 'browser model uses selected Gemini and bounded timeout');
check(browserModelRequest.input.messages[0].content.includes('schema') && !('apiKey' in generated), 'schema is supplied and credentials stay out of callback result');
await rejects(() => adapter.generateBrowserResearch({ ...generation, responseFormat: { type: 'text' } }), 'unstructured browser generation rejected');
providerRejects = true;
try { await adapter.generateBrowserResearch(generation); assert.fail('provider failure expected'); }
catch (error) { check(error.message.includes('HTTP 503') && !error.message.includes('PRIVATE_PROVIDER_DETAIL'), 'browser provider errors sanitized with useful status'); }

check(fs.readFileSync('proxy.ts', 'utf8').includes('"/api/agent/research"'), 'research API participates in session refresh');
console.log(`PASS ${checks} company research validation, URL safety, ownership, concurrency, worker, API and dossier checks`);
