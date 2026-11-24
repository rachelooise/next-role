import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { resumePdf } from './fixtures/resume.mjs';

const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const source = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: (id) => id in mocks ? mocks[id] : require(id), console: { error() {} }, process: { env: { GEMINI_API_KEY: 'mock' } }, File, Blob, FormData, URL, Response, Request, Uint8Array }, { filename: path });
  return exports;
}
const profile = load('lib/profile.ts');
const helpers = load('lib/profile-extraction.ts', { '@/lib/profile': profile });
let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; }
let configuration;
const geminiClient = load('lib/gemini.ts', { 'server-only': {}, openai: { default: class { constructor(options) { configuration = options; } } } });
geminiClient.createGemini();
check(configuration.baseURL === 'https://generativelanguage.googleapis.com/v1beta/openai/', 'extraction client targets Google');
check(configuration.apiKey === 'mock', 'extraction client uses Gemini key');
check(geminiClient.GEMINI_EXTRACTION_MODEL === 'gemini-3.5-flash-lite', 'supported Gemini model configured');
const extracted = helpers.validateExtraction({ full_name: 'Jordan', skills: ['React'], years_experience: 0, education: { degree: "Bachelor's", institution: '', field_of_study: '', graduation_year: null }, email: 'untrusted', id: 'foreign', is_complete: true });
check(!('email' in extracted) && !('id' in extracted) && !('is_complete' in extracted), 'protected fields discarded');
const original = profile.parseProfile({ ...helpers.emptyProfile(), phone: 'local unsaved phone', skills: ['react', 'CSS'], education: { degree: '', institution: 'Original institution', field_of_study: 'Design', graduation_year: 2020 } });
const merged = helpers.mergeExtraction(original, extracted);
check(merged.full_name === 'Jordan' && merged.years_experience === 0, 'recognized values fill form including zero');
check(merged.phone === original.phone, 'unknown scalar preserves local edits');
check(merged.skills.join(',') === 'react,CSS', 'tags merge case-insensitively');
check(merged.education.institution === 'Original institution' && merged.education.degree === "Bachelor's", 'education merges known subfields');
check(original.full_name === null && original.skills.length === 2, 'merge does not mutate undo snapshot');
const bareLinks = helpers.validateExtraction({ full_name: 'Morgan Example', linkedin_url: 'linkedin.com/in/morgan-example', portfolio_url: 'github.com/morgan-example' });
check(bareLinks.linkedin_url === 'https://linkedin.com/in/morgan-example', 'resume LinkedIn link without protocol is normalized');
check(bareLinks.portfolio_url === 'https://github.com/morgan-example', 'resume portfolio link without protocol is normalized');
check(helpers.validateExtraction({ linkedin_url: ' https://www.linkedin.com/in/morgan-example ' }).linkedin_url === 'https://www.linkedin.com/in/morgan-example', 'existing HTTPS links preserved');
check(helpers.validateExtraction({ portfolio_url: 'http://example.com/work' }).portfolio_url === 'http://example.com/work', 'existing HTTP links preserved');
for (const unsafe of ['javascript:alert(1)', 'data:text/html,test', 'ftp://example.com/file', 'not a website', 'user@example.com']) {
  assert.throws(() => helpers.validateExtraction({ portfolio_url: unsafe })); checks++;
}
for (const bad of [null, [], {}, { email: 'only unknown field' }, { education: {} }, { years_experience: -1 }, { skills: 'React' }, { linkedin_url: 'javascript:bad' }, { experience_level: 'executive' }, { education: { degree: 'unmapped' } }, { work_experience: Array(4).fill({}) }]) {
  assert.throws(() => helpers.validateExtraction(bad)); checks++;
}
let calls = 0;
const model = { GEMINI_EXTRACTION_MODEL: 'gemini-3.5-flash-lite', createGemini: () => ({ chat: { completions: { async create(options) {
  calls++; check(options.model === 'gemini-3.5-flash-lite' && options.reasoning_effort === 'low' && options.max_tokens === 3000, 'model and nonstored response');
  check(options.messages[1].content.includes('Jordan Example'), 'real parsed PDF text reaches model');
  return { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ full_name: 'Jordan Example', skills: ['React'] }) } }] };
} } } }) };
const extractor = load('agent/resume-extractor.ts', { 'server-only': {}, '@/lib/gemini': model, '@/lib/profile-extraction': helpers, '@/lib/profile': profile });
let result = await extractor.extractResume(resumePdf());
check(result.success && result.data.full_name === 'Jordan Example', 'real PDF parser and validated result');
result = await extractor.extractResume(resumePdf(['Tiny']));
check(!result.success && calls === 1, 'short/image-only text rejected before model call');
result = await extractor.extractResume(new Blob(['%PDF-invalid']));
check(!result.success && calls === 1, 'corrupt PDF rejected');
const truncated = load('agent/resume-extractor.ts', { 'server-only': {}, '@/lib/gemini': { GEMINI_EXTRACTION_MODEL: 'gemini-3.5-flash-lite', createGemini: () => ({ chat: { completions: { create: async () => ({ choices: [{ finish_reason: 'length', message: { content: '{}' } }] }) } } }) }, '@/lib/profile-extraction': helpers, '@/lib/profile': profile });
check(!(await truncated.extractResume(resumePdf())).success, 'truncated model result rejected');
const invalid = load('agent/resume-extractor.ts', { 'server-only': {}, '@/lib/gemini': { GEMINI_EXTRACTION_MODEL: 'gemini-3.5-flash-lite', createGemini: () => ({ chat: { completions: { create: async () => ({ choices: [{ finish_reason: 'stop', message: { content: '{bad' } }] }) } } }) }, '@/lib/profile-extraction': helpers, '@/lib/profile': profile });
check(!(await invalid.extractResume(resumePdf())).success, 'malformed model JSON rejected');
check((await invalid.extractResume(resumePdf())).error.includes('unsupported format'), 'invalid model JSON has distinct feedback');
const exhausted = load('agent/resume-extractor.ts', { 'server-only': {}, '@/lib/gemini': { GEMINI_EXTRACTION_MODEL: 'gemini-3.5-flash-lite', createGemini: () => ({ chat: { completions: { create: async () => { throw { code: 'credit_balance_exhausted', status: 429 }; } } } }) }, '@/lib/profile-extraction': helpers, '@/lib/profile': profile });
check((await exhausted.extractResume(resumePdf())).error.includes('request limit or quota'), 'Gemini quota limit produces clear feedback');
const unavailable = load('agent/resume-extractor.ts', { 'server-only': {}, '@/lib/gemini': { GEMINI_EXTRACTION_MODEL: 'gemini-3.5-flash-lite', createGemini: () => ({ chat: { completions: { create: async () => { throw { status: 503 }; } } } }) }, '@/lib/profile-extraction': helpers, '@/lib/profile': profile });
check((await unavailable.extractResume(resumePdf())).error.includes('temporarily busy'), 'Gemini overload produces clear feedback');

function routeHarness({ anonymous = false, foreign = false, stale = false, downloadError = false, extractionError = false } = {}) {
  let modelCalls = 0, writes = 0;
  const route = load('app/api/resume/extract/route.ts', {
    '@/lib/auth': { getAuthUser: async () => anonymous ? null : { id: 'owner' } },
    '@/lib/insforge-server': { createInsforgeServer: async () => ({
      database: { from: (table) => ({ select() { return this; }, eq(column, value) { assert.equal(column, 'id'); assert.equal(value, 'owner'); return this; }, maybeSingle: async () => ({ data: { resume_pdf_key: foreign ? 'other/resume.pdf' : 'owner/resume.pdf', updated_at: stale ? 'different' : 'v1' } }), insert: async () => { assert.equal(table, 'agent_logs'); writes++; return {}; } }) },
      storage: { from: () => ({ download: async (key) => { assert.equal(key, 'owner/resume.pdf'); return { data: downloadError ? null : resumePdf(), error: downloadError ? {} : null }; } }) },
    }) },
    '@/agent/resume-extractor': { extractResume: async () => { modelCalls++; return extractionError ? { success: false, error: 'Could not read PDF.' } : { success: true, data: extracted }; } },
  });
  return { run: (options = {}) => route.POST(new Request('http://localhost/api/resume/extract', { method: 'POST', headers: { Origin: 'http://localhost', 'Content-Type': 'application/json', ...options.headers }, body: options.body ?? JSON.stringify({ updatedAt: 'v1', userId: 'foreign' }) })), calls: () => modelCalls, writes: () => writes };
}
for (const [config, status] of [[{ anonymous: true }, 401], [{ foreign: true }, 404], [{ stale: true }, 409], [{ downloadError: true }, 503]]) {
  const h = routeHarness(config); check((await h.run()).status === status && h.calls() === 0, 'invalid request never reaches model');
}
let h = routeHarness(); check((await h.run({ headers: { Origin: 'https://foreign.invalid' } })).status === 403, 'cross-origin rejected');
h = routeHarness(); check((await h.run({ body: '{broken' })).status === 400, 'malformed request rejected');
h = routeHarness(); check((await h.run()).status === 200 && h.calls() === 1 && h.writes() === 0, 'successful extraction does not mutate database');
h = routeHarness({ extractionError: true }); check((await h.run()).status === 422 && h.writes() === 1, 'generic failure logged without resume text');
console.log(`PASS ${checks} extraction/parser/merge/ownership checks`);


