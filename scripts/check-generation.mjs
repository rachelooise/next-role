import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { PDFParse } from 'pdf-parse';

const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: (id) => id in mocks ? mocks[id] : require(id), process, console, File, Blob, FormData, URL, Response, Request, Buffer, Uint8Array, AbortSignal, fetch }, { filename: file });
  return exports;
}
let checks = 0;
function check(condition, label) { assert.ok(condition, label); checks++; }
const profileHelpers = load('lib/profile.ts');
const helpers = load('lib/resume-generation.ts');
const fixture = profileHelpers.parseProfile({ full_name: 'Morgan García', current_title: 'Software Engineer', years_experience: 4, skills: ['React', 'TypeScript', 'PostgreSQL'], industries: [], job_titles_seeking: ['Lead Developer'], preferred_locations: [], education: { degree: "Bachelor's", field_of_study: 'Computer Science', institution: 'Example University', graduation_year: 2020 }, work_experience: [{ company: 'Example Company', job_title: 'Software Engineer', start_date: '2022-01', is_current: true, responsibilities: 'Built React interfaces. Maintained PostgreSQL queries.' }] });
const content = { summary: 'Software engineer with four years of experience building React interfaces with TypeScript and PostgreSQL.', roles: [{ bullets: ['Built React interfaces.', 'Maintained PostgreSQL queries.'] }] };
const source = helpers.resumeSource(fixture);
check(!('email' in source) && !('full_name' in source) && !('job_titles_seeking' in source) && !('phone' in source), 'model input excludes contact and preferences');
check(helpers.validateResumeContent(content, source).summary === content.summary, 'valid content accepted');
for (const invalid of [null, {}, { ...content, summary: '' }, { ...content, summary: 'x'.repeat(651) }, { ...content, roles: [] }, { ...content, roles: [{ bullets: [] }] }, { ...content, roles: [{ bullets: Array(4).fill('text') }] }, { ...content, roles: [{ bullets: [23] }] }, { ...content, roles: [{ bullets: ['x'.repeat(231)] }] }]) {
  assert.throws(() => helpers.validateResumeContent(invalid, source)); checks++;
}
assert.throws(() => helpers.validateResumeContent(content, { ...source, work_experience: [{ ...fixture.work_experience[0], responsibilities: '' }] })); checks++;

const originalKey = process.env.GEMINI_API_KEY;
process.env.GEMINI_API_KEY = 'synthetic-test-placeholder';
function generator(reply, error) {
  return load('agent/resume-generator.ts', { 'server-only': {}, '@/lib/resume-generation': helpers, '@/lib/gemini': { GEMINI_EXTRACTION_MODEL: 'gemini-3.5-flash-lite', createGemini: () => ({ chat: { completions: { create: async (request) => {
    check(!request.messages[1].content.includes('Morgan'), 'name not sent to model');
    if (error) throw error;
    return reply;
  } } } }) } });
}
const validReply = { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(content) } }] };
check((await generator(validReply).generateResumeContent(fixture)).success, 'model output accepted');
for (const reply of [{ choices: [] }, { choices: [{ finish_reason: 'length', message: { content: JSON.stringify(content) } }] }, { choices: [{ finish_reason: 'stop', message: { refusal: 'refused', content: '{}' } }] }, { choices: [{ finish_reason: 'stop', message: { content: '{broken' } }] }]) check(!(await generator(reply).generateResumeContent(fixture)).success, 'bad model output rejected');
check((await generator(null, { status: 429 }).generateResumeContent(fixture)).error.includes('quota'), 'quota feedback');
check((await generator(null, { status: 503 }).generateResumeContent(fixture)).error.includes('busy'), 'overload feedback');
if (originalKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalKey;

function routeHarness({ anonymous, stale, missing, incomplete, modelFailure, renderFailure } = {}) {
  let modelCalls = 0, writes = 0;
  const route = load('app/api/resume/generate/route.ts', {
    'next/cache': { revalidatePath() {} }, '@/lib/auth': { getAuthUser: async () => anonymous ? null : { id: 'owner', email: 'morgan@example.invalid' } },
    '@/lib/profile': profileHelpers,
    '@/lib/insforge-server': { createInsforgeServer: async () => ({ database: { from: () => ({ select() { return this; }, eq(column, value) { assert.equal(column, 'id'); assert.equal(value, 'owner'); return this; }, maybeSingle: async () => ({ data: missing ? null : { ...fixture, full_name: incomplete ? null : fixture.full_name, updated_at: stale ? 'other' : 'v1' } }), insert: async () => ({}) }) } }) },
    '@/agent/resume-generator': { generateResumeContent: async () => { modelCalls++; return modelFailure ? { success: false, error: 'Model failed' } : { success: true, data: content }; } },
    '@/lib/resume-pdf': { renderResumePdf: async () => { if (renderFailure) throw new Error('overflow'); return Buffer.from('%PDF-test'); } },
    '@/lib/generated-resume': { persistGeneratedResume: async (client, owner, version) => { assert.equal(owner, 'owner'); assert.equal(version, 'v1'); writes++; return { success: true, updatedAt: 'v2', size: 123 }; } },
  });
  return { calls: () => modelCalls, writes: () => writes, run: (options = {}) => route.POST(new Request('http://localhost/api/resume/generate', { method: 'POST', headers: { Origin: 'http://localhost', ...options.headers }, body: options.body ?? JSON.stringify({ updatedAt: 'v1', userId: 'foreign', profile: { full_name: 'forged' } }) })) };
}
for (const [config, status] of [[{ anonymous: true }, 401], [{ stale: true }, 409], [{ missing: true }, 404], [{ incomplete: true }, 422]]) {
  const h = routeHarness(config); check((await h.run()).status === status && h.calls() === 0 && h.writes() === 0, 'invalid request never generates or saves');
}
for (const options of [{ headers: { Origin: 'https://other.invalid' } }, { body: '{broken' }, { body: 'x'.repeat(2049) }, { body: '{}' }]) {
  const h = routeHarness(); check(!(await h.run(options)).ok && h.calls() === 0, 'invalid request denied before model');
}
for (const config of [{ modelFailure: true }, { renderFailure: true }]) { const h = routeHarness(config); check(!(await h.run()).ok && h.writes() === 0, 'generation failure never replaces resume'); }
const h = routeHarness(); const response = await h.run();
check(response.ok && h.calls() === 1 && h.writes() === 1, 'valid request saves generated PDF');
check((await response.json()).data.updatedAt === 'v2' && response.headers.get('cache-control').includes('no-store'), 'new timestamp and private response');

const persist = load('lib/generated-resume.ts', { 'server-only': {} });
async function persistence({ existing = true, stale = false, backupFailure = false, uploadFailure = false, saveFailure = false, recoveryFailure = false, saveThrow = false } = {}) {
  const operations = [], patches = [];
  let uploads = 0;
  const backup = new Blob(['old resume']);
  const client = {
    database: { from: () => { let updating = false; return {
      select() { return this; }, eq(name, value) { assert.ok((name === 'id' && value === 'owner') || (name === 'updated_at' && value === 'v1')); return this; },
      update(value) { updating = true; patches.push(value); return this; },
      maybeSingle: async () => { if (!updating) return { data: { updated_at: stale ? 'other' : 'v1', resume_pdf_key: existing ? 'owner/resume.pdf' : null } }; if (saveThrow) throw new Error('connection'); return { data: saveFailure ? null : { updated_at: 'v2' }, error: saveFailure ? {} : null }; },
    }; } },
    storage: { from: () => ({ download: async (key) => { assert.equal(key, 'owner/resume.pdf'); operations.push('backup'); return { data: backupFailure ? null : backup }; }, upload: async (key, blob) => { assert.equal(key, 'owner/resume.pdf'); assert.ok(blob instanceof Blob); operations.push(uploads++ ? 'restore' : 'upload'); return { data: { url: 'private-url' }, error: uploads > 1 ? recoveryFailure ? {} : null : uploadFailure ? {} : null }; }, remove: async () => { operations.push('remove'); return { error: recoveryFailure ? {} : null }; } }) },
  };
  const result = await persist.persistGeneratedResume(client, 'owner', 'v1', Buffer.from('%PDF-test'));
  return { result, operations, patches };
}
let p = await persistence(); check(p.result.success && p.operations.join(',') === 'backup,upload', 'successful replacement backs up old bytes');
check(Object.keys(p.patches[0]).sort().join(',') === 'resume_pdf_key,resume_pdf_url', 'generation never updates profile content/completion');
p = await persistence({ stale: true }); check(!p.result.success && p.operations.length === 0, 'concurrent edit after generation avoids upload');
p = await persistence({ backupFailure: true }); check(!p.result.success && !p.operations.includes('upload'), 'backup failure preserves old PDF');
p = await persistence({ uploadFailure: true }); check(!p.result.success && !p.patches.length, 'upload failure never updates profile references');
p = await persistence({ saveFailure: true }); check(!p.result.success && p.operations.includes('restore'), 'database conflict restores previous PDF');
p = await persistence({ saveThrow: true }); check(!p.result.success && p.operations.includes('restore'), 'thrown database failure restores old PDF');
p = await persistence({ existing: false, saveFailure: true }); check(!p.result.success && p.operations.includes('remove'), 'new object cleaned up on persistence failure');
p = await persistence({ saveFailure: true, recoveryFailure: true }); check(p.result.error.includes('recovery could not be confirmed'), 'recovery failure disclosed');

const renderer = await import('@react-pdf/renderer');
const pdf = load('lib/resume-pdf.tsx', { 'server-only': {}, '@react-pdf/renderer': renderer });
let generatedContent = content;
if (process.argv.includes('--live')) {
  const nextEnv = await import('@next/env'); nextEnv.default.loadEnvConfig(process.cwd());
  const gemini = load('lib/gemini.ts', { 'server-only': {} });
  const live = load('agent/resume-generator.ts', { 'server-only': {}, '@/lib/gemini': gemini, '@/lib/resume-generation': helpers });
  const result = await live.generateResumeContent(fixture);
  assert.ok(result.success, result.error); generatedContent = result.data;
}
const buffer = await pdf.renderResumePdf(fixture, 'morgan@example.invalid', generatedContent);
check(buffer.subarray(0, 5).toString() === '%PDF-', 'real PDF buffer');
const parser = new PDFParse({ data: new Uint8Array(buffer) });
try {
  check((await parser.getInfo()).total === 1, 'exactly one A4 page');
  const text = (await parser.getText()).text;
  for (const expected of ['Morgan García', 'morgan@example.invalid', 'Example Company', 'Jan 2022 - Present', 'React', 'Example University', '2020']) check(text.includes(expected), `saved fact retained: ${expected}`);
  check(!text.includes('Lead Developer'), 'desired title never presented as current position');
} finally { await parser.destroy(); }
const sparse = { ...fixture, education: null, work_experience: [], skills: [] };
check((await pdf.renderResumePdf(sparse, 'morgan@example.invalid', { summary: 'Software engineer.', roles: [] })).length > 1000, 'optional sections omitted safely');
await assert.rejects(pdf.renderResumePdf({ ...fixture, skills: Array(100).fill('A very long skill or technology label '.repeat(2)) }, 'morgan@example.invalid', content), /more than one page/); checks++;
console.log(`PASS ${checks} generation validation, request, recovery and real PDF checks${process.argv.includes('--live') ? ' including live Gemini' : ''}`);
