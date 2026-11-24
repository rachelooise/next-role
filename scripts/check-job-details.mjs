import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url), cache = new Map();
function load(file, mocks = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  function resolve(id) {
    if (id in mocks) return mocks[id];
    if (id === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
    if (id.startsWith('@/')) {
      if (!cache.has(id)) { const base = id.slice(2); cache.set(id, load(fs.existsSync(base + '.tsx') ? base + '.tsx' : base + '.ts')); }
      return cache.get(id);
    }
    return require(id);
  }
  vm.runInNewContext(source, { exports, require: resolve, console: { error() {} }, URL, Date, Intl, process }, { filename: file });
  return exports;
}
let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; }
const helpers = load('lib/job-details.ts');
const now = Date.UTC(2026,10,5,12);
const fixture = { id: '11111111-1111-4111-8111-111111111111', title: 'Backend Developer', company: 'Insight Global', salary: '$101k – $101k', location: 'Newark, Essex', match_score: 85, found_at: new Date(now - 3600000).toISOString(), external_apply_url: 'https://example.invalid/apply', match_reason: 'The candidate possesses a strong background in backend development with over 10 years of experience, which exceeds the job’s requirement of 5–8 years. They have expertise in Node.js, RESTful APIs, and AWS, aligning well with the job’s technical requirements. However, a lack of explicit experience in Java (Spring Boot) represents a gap in the job’s demands.', matched_skills: ['Node.js', 'RESTful APIs', 'AWS', 'Problem-solving', 'Backend development'], missing_skills: ['Java (Spring Boot)'], about_role: 'Job Description - 5–8 years of backend development experience - Strong proficiency in Node.js and/or Java (Spring Boot) - Experience building and consuming RESTful APIs - Exposure to cloud-based development in AWS (deployments, monitoring, logging) - Ability to work across multiple technologies and systems - Strong problem-solving skills and attention to detail - Effective communication skills and willingness to collaborate across teams.' };
const job = helpers.parseJobDetails(fixture);
check(job.job_type === null && job.responsibilities.length === 0, 'missing data stays missing');
check(helpers.dateFoundLabel(fixture.found_at, now) === '1 hour ago', 'relative hour from saved timestamp');
for (const [offset, expected] of [[0,'Just now'],[60000,'1 minute ago'],[120000,'2 minutes ago'],[7200000,'2 hours ago'],[86400000,'1 day ago']]) check(helpers.dateFoundLabel(new Date(now-offset).toISOString(),now) === expected, 'relative date boundary');
assert.throws(() => helpers.parseJobDetails({ ...fixture, external_apply_url: 'javascript:alert(1)' })); checks++;
const { JobDetailsView } = load('components/job-details/JobDetailsView.tsx');
const html = renderToStaticMarkup(React.createElement(JobDetailsView, { job, now }));
for (const text of ['Back to Jobs','View Job Post','Salary est.','Location','Job type','Date found','AI Match Reasoning','Required Skills vs Your Profile','Job Description','Company Research','No research yet','Apply Now at Insight Global','85% Match Score','Java (Spring Boot)','Jobs by Adzuna']) check(html.includes(text), 'required section ' + text);
check((html.match(/href="https:\/\/example.invalid\/apply"/g) || []).length === 3, 'post, full description and apply links');
check(html.includes('Read full job description') && html.includes('Adzuna supplies a description preview.'), 'preview limitation and full description action are explicit');
const longDescription = 'Long description paragraph. '.repeat(300) + 'Final sentence is visible in full.';
const longHtml = renderToStaticMarkup(React.createElement(JobDetailsView, { job: { ...job, about_role: longDescription }, now }));
check(longHtml.includes(longDescription), 'long saved descriptions render through the final sentence');
check(!html.includes('dangerouslySetInnerHTML'), 'plain text descriptions');
const escaped = renderToStaticMarkup(React.createElement(JobDetailsView, { job: { ...job, about_role: '<script>alert(1)</script>' }, now }));
check(escaped.includes('&lt;script&gt;') && !escaped.includes('<script>'), 'stored content escaped');
let calls = [], data = fixture, error = null;
const builder = { select() { return builder; }, eq(key, value) { calls.push([key,value]); return builder; }, async maybeSingle() { return { data, error }; } };
const server = load('lib/job-details-server.ts', { 'server-only': {}, '@/lib/insforge-server': { createInsforgeServer: async () => ({ database: { from: () => builder } }) } });
check((await server.loadJobDetails('owner', fixture.id)).job?.id === fixture.id, 'saved job loads');
check(calls.some(([k,v]) => k === 'user_id' && v === 'owner') && calls.some(([k,v]) => k === 'id' && v === fixture.id), 'owner and id filters');
const before = calls.length;
check(!(await server.loadJobDetails('owner', 'invalid')).job && calls.length === before, 'invalid id avoids database');
data = null;
check(!(await server.loadJobDetails('owner', fixture.id)).job, 'missing or foreign record stays absent');
error = { message: 'secret backend detail' };
const failure = await server.loadJobDetails('owner', fixture.id);
check(failure.error && !failure.error.includes('secret'), 'database failures sanitized');
const css = fs.existsSync('.next/static/chunks') ? fs.readdirSync('.next/static/chunks').filter(f => f.endsWith('.css')).map(f => `<link rel="stylesheet" href="file:///${path.resolve('.next/static/chunks',f).replaceAll('\\','/')}">`).join('') : '';
fs.mkdirSync('.next', { recursive: true });
const styles = fs.readdirSync('.next/static/chunks').filter(f => f.endsWith('.css')).map(f => fs.readFileSync(path.join('.next/static/chunks', f), 'utf8')).join('');
const fontClass = /\.([\w-]+)\{--font-inter:/.exec(styles)?.[1] || '';
fs.writeFileSync('.next/job-details-preview.html', `<!doctype html><html class="${fontClass}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${css}</head><body><main class="mx-auto w-full max-w-[864px] px-4 py-8 sm:px-8">${html}</main><script>addEventListener('load',()=>{document.body.dataset.overflow=String(document.documentElement.scrollWidth>innerWidth)})</script></body></html>`);
console.log(`PASS ${checks} job details data, rendering, ownership and failure checks`);
