import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const source = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: (id) => id in mocks ? mocks[id] : require(id), console, File, Blob, FormData, URL, Response }, { filename: path });
  return exports;
}
const helpers = load('lib/profile.ts');
let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; }
const blank = () => ({ skills: [], industries: [], work_experience: [], job_titles_seeking: [], preferred_locations: [] });
const complete = () => helpers.parseProfile({ ...blank(), full_name: 'Candidate', location: 'Perth', work_authorization: 'citizen', current_title: 'Developer', experience_level: 'junior', years_experience: 0, skills: ['React'], job_titles_seeking: ['Developer'], remote_preference: 'any' });
check(helpers.getCompletion(helpers.parseProfile(blank()), 'test@example.invalid').completion_percentage === 10, 'empty draft counts only account email');
check(helpers.getCompletion(complete(), 'test@example.invalid').is_complete, 'zero years, no resume/education/history is complete');
check(!helpers.getCompletion(complete(), '').is_complete, 'email is required');
check(helpers.parseProfile({ ...blank(), full_name: '   ' }).full_name === null, 'trim empty text');
check(helpers.parseProfile({ ...blank(), skills: [' React ', 'react'] }).skills.length === 1, 'deduplicate tags');
for (const bad of [{ years_experience: -1 }, { years_experience: 1.5 }, { years_experience: 101 }, { years_experience: '2' }, { experience_level: 'executive' }, { work_authorization: 'forged' }, { remote_preference: 'elsewhere' }, { portfolio_url: 'javascript:alert(1)' }, { skills: 'React' }, { work_experience: [{ is_current: true, start_date: '2024-13' }] }, { work_experience: [{ is_current: false, start_date: '2024-02', end_date: '2024-01' }] }, { work_experience: Array(4).fill({}) }, { education: { graduation_year: 42 } }]) {
  assert.throws(() => helpers.parseProfile({ ...blank(), ...bad })); checks++;
}
check(helpers.parseProfile({ ...blank(), work_experience: [{ is_current: true, start_date: '2024-01', end_date: '2023-01' }] }).work_experience[0].end_date === null, 'current role clears end date');
const pdf = () => new File(['%PDF-1.4\nfixture'], 'resume.pdf', { type: 'application/pdf' });
await helpers.validateResume(pdf()); checks++;
for (const file of [new File(['text'], 'resume.pdf', { type: 'application/pdf' }), new File(['%PDF-1.4'], 'resume.txt', { type: 'application/pdf' }), new File([], 'resume.pdf', { type: 'application/pdf' }), new File(['%PDF-', new Uint8Array(helpers.MAX_RESUME_SIZE)], 'resume.pdf', { type: 'application/pdf' })]) {
  await assert.rejects(helpers.validateResume(file)); checks++;
}
function harness(config = {}) {
  const writes = [], storage = [], revalidations = [];
  const existing = config.existing ?? null;
  let dbCount = 0;
  const client = {
    database: { from: () => {
      let operation = 'select', values;
      const query = {
        select() { return this; }, eq() { return this; },
        insert(input) { operation = 'insert'; values = input[0]; return this; },
        update(input) { operation = 'update'; values = input; return this; },
        async maybeSingle() {
          dbCount++;
          if (operation === 'select') return { data: existing, error: config.readError ? {} : null };
          writes.push({ operation, values });
          return { data: config.writeError ? null : { updated_at: 'new-version' }, error: config.writeError ? {} : null };
        },
        async single() { return this.maybeSingle(); },
      };
      return query;
    } },
    storage: { from: () => ({
      async download(key) { storage.push(['download', key]); return { data: config.backupError ? null : new Blob(['%PDF-old']), error: config.backupError ? {} : null }; },
      async upload(key, file) { storage.push(['upload', key, await file.text()]); return { data: { key, url: 'https://example.invalid/private' }, error: config.uploadError || config.recoveryError && storage.filter(([op]) => op === 'upload').length > 1 ? {} : null }; },
      async remove(key) { storage.push(['remove', key]); return { error: config.recoveryError ? {} : null }; },
    }) },
  };
  const actions = load('actions/profile.ts', {
    'next/cache': { revalidatePath: (path) => revalidations.push(path) },
    '@/lib/auth': { getAuthUser: async () => config.anonymous ? null : { id: 'owner', email: 'account@example.invalid' } },
    '@/lib/insforge-server': { createInsforgeServer: async () => client }, '@/lib/profile': helpers,
  });
  async function save(input = blank(), file = null, version = '') {
    const data = new FormData(); data.set('profile', JSON.stringify(input)); data.set('updatedAt', version);
    if (file) data.set('resume', file);
    return actions.saveProfile(data);
  }
  async function saveResume(file = null, version = '') { const data = new FormData(); data.set('updatedAt', version); if (file) data.set('resume', file); return actions.saveResume(data); }
  return { save, saveResume, writes, storage, revalidations, dbCount: () => dbCount };
}
let h = harness(); let result = await h.save({ ...blank(), id: 'foreign', email: 'forged', is_complete: true, resume_pdf_key: 'foreign/resume.pdf' });
check(result.success && !result.completion.is_complete, 'partial first save');
check(h.writes[0].values.id === 'owner' && h.writes[0].values.email === 'account@example.invalid', 'session determines owner/email');
check(!('resume_pdf_key' in h.writes[0].values), 'untrusted resume reference ignored');
check(h.revalidations.includes('/profile') && h.revalidations.includes('/dashboard'), 'save revalidates affected pages');
h = harness({ anonymous: true }); check(!(await h.save()).success && h.dbCount() === 0, 'anonymous save denied');
h = harness({ readError: true }); check(!(await h.save()).success && !h.writes.length, 'read errors never become new profiles');
h = harness({ existing: { updated_at: 'v1', resume_pdf_key: 'owner/resume.pdf', resume_pdf_url: 'old' } });
check(!(await h.save(blank(), pdf(), 'stale')).success && !h.storage.length, 'stale form rejected before upload');
result = await h.save(complete(), null, 'v1');
check(result.success && result.hasResume && h.storage.length === 0, 'ordinary save preserves current resume');
check(!('resume_pdf_key' in h.writes[0].values), 'ordinary save leaves references unchanged');
h = harness(); result = await h.save(complete(), pdf());
check(result.success && result.hasResume && h.storage[0][1] === 'owner/resume.pdf', 'PDF upload uses owner canonical key');
check(h.writes[0].values.resume_pdf_key === 'owner/resume.pdf', 'persist authoritative resume key');
h = harness({ uploadError: true }); check(!(await h.save(blank(), pdf())).success && !h.writes.length, 'upload failure prevents profile write');
h = harness({ writeError: true }); check(!(await h.save(blank(), pdf())).success && h.storage.some(([op]) => op === 'remove'), 'failed first save cleans new object');
h = harness({ existing: { updated_at: 'v1', resume_pdf_key: 'owner/resume.pdf' }, writeError: true });
check(!(await h.save(blank(), pdf(), 'v1')).success && h.storage.at(-1)[2] === '%PDF-old', 'failed replacement restores prior bytes');
h = harness({ existing: { updated_at: 'v1', resume_pdf_key: 'owner/resume.pdf' }, backupError: true });
check(!(await h.save(blank(), pdf(), 'v1')).success && !h.storage.some(([op]) => op === 'upload'), 'backup failure prevents replacement');
h = harness({ writeError: true, recoveryError: true });
check((await h.save(blank(), pdf())).error.includes('could not be undone'), 'recovery failure is disclosed');
h = harness({ existing: { updated_at: 'v1', full_name: 'Saved name', is_complete: true, completion_percentage: 100, missing_fields: [] } });
result = await h.saveResume(pdf(), 'v1');
check(result.success && result.completion.is_complete, 'standalone resume save preserves completion');
check(Object.keys(h.writes[0].values).sort().join(',') === 'resume_pdf_key,resume_pdf_url', 'standalone resume updates only file references');
check(result.updatedAt === 'new-version', 'standalone save returns new version for subsequent profile saves');
h = harness(); result = await h.saveResume(pdf());
check(result.success && h.writes[0].values.full_name === null && h.writes[0].values.completion_percentage === 10, 'first resume save creates only blank draft with account email');
h = harness(); check(!(await h.saveResume()).success && h.dbCount() === 0, 'standalone save requires a PDF');
h = harness({ anonymous: true }); check(!(await h.saveResume(pdf())).success && h.writes.length === 0, 'anonymous standalone resume save denied');
h = harness({ uploadError: true }); check(!(await h.saveResume(pdf())).success && h.writes.length === 0, 'standalone upload failure preserves saved fields');
const route = load('app/api/resume/download/route.ts', {
  '@/lib/auth': { getAuthUser: async () => null }, '@/lib/insforge-server': { createInsforgeServer: async () => { throw Error('must not read'); } }, 'next/server': { connection: async () => {} },
});
check((await route.GET()).status === 401, 'anonymous resume download denied');
console.log(`PASS ${checks} profile validation, save, failure recovery, and download checks`);
