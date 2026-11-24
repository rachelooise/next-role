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
  vm.runInNewContext(source, { exports, require: resolve, console: { error() {} } }, { filename: file });
  return exports;
}
const { DashboardView } = load('components/dashboard/DashboardView.tsx');
const statsResult = { stats: { totalJobs: 284, averageMatchRate: 82, companiesResearched: 35, jobsThisWeek: 28 }, error: null };
const { mergeDashboardActivity, activityTime } = load('lib/dashboard-activity.ts');
const now = Date.UTC(2026, 10, 23, 12);
const run = (id, age, count = 8, title = 'Frontend Engineer') => ({ id, completed_at: new Date(now - age).toISOString(), jobs_found: count, job_title_searched: title });
const research = (id, age, company = 'Synthetic company') => ({ id, company_researched_at: new Date(now - age).toISOString(), company });
const activityResult = { entries: mergeDashboardActivity([run('a', 600000), run('b', 7200000, 12), run('c', 86400000, 10)], [research('d', 3600000, 'Stripe'), research('e', 80000000, 'Vercel')], now), error: null };
const render = (profileState) => renderToStaticMarkup(React.createElement(DashboardView, { profileState, statsResult, activityResult }));
const complete = render('complete'), incomplete = render('incomplete'), unavailable = render('unavailable');
assert.ok(!complete.includes('Complete Profile'));
assert.ok(incomplete.includes('Complete Profile') && incomplete.includes('href="/profile"'));
assert.ok(unavailable.includes('Profile completion is unavailable') && !unavailable.includes('Complete Profile'));
assert.equal((complete.match(/role="img"/g) || []).length, 3);
assert.equal((complete.match(/<article/g) || []).length, 4);
assert.equal((complete.match(/<li /g) || []).length, 5);
assert.ok(complete.includes('Charts show sample data.'));
const ids = [...complete.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length);
for (const match of complete.matchAll(/aria-labelledby="([^"]+)"/g)) assert.ok(ids.includes(match[1]));
const { RecentActivity } = load('components/dashboard/RecentActivity.tsx');
assert.ok(renderToStaticMarkup(React.createElement(RecentActivity, { entries: [], error: null })).includes('will appear here'));
assert.ok(!complete.includes('NaN') && !complete.includes('Infinity'));
const { parseDashboardStats, formatDashboardStats } = load('lib/dashboard-stats.ts');
const emptyStats = { totalJobs: 0, averageMatchRate: null, companiesResearched: 0, jobsThisWeek: 0 };
const emptyCards = formatDashboardStats(parseDashboardStats(emptyStats));
assert.equal(emptyCards[0].value, '0'); assert.equal(emptyCards[1].value, '—');
assert.equal(emptyCards[1].subtitle, 'No scored jobs yet');
assert.equal(formatDashboardStats({ totalJobs: 1, averageMatchRate: 0, companiesResearched: 0, jobsThisWeek: 1 })[1].value, '0%');
assert.equal(formatDashboardStats({ totalJobs: 1234, averageMatchRate: 82.5, companiesResearched: 2, jobsThisWeek: 1 })[0].value, '1,234');
assert.equal(formatDashboardStats({ totalJobs: 1234, averageMatchRate: 82.5, companiesResearched: 2, jobsThisWeek: 1 })[1].value, '83%');
for (const invalid of [null, [], {}, { ...emptyStats, totalJobs: -1 }, { ...emptyStats, averageMatchRate: 0 }, { ...emptyStats, totalJobs: 1 }, { ...emptyStats, jobsThisWeek: 1 }, { ...emptyStats, companiesResearched: 1 }, { ...statsResult.stats, averageMatchRate: NaN }, { ...statsResult.stats, averageMatchRate: 101 }, { ...statsResult.stats, totalJobs: '284' }]) assert.throws(() => parseDashboardStats(invalid));
const failureHtml = renderToStaticMarkup(React.createElement(DashboardView, { profileState: 'complete', activityResult, statsResult: { stats: null, error: 'Could not load your job statistics.' } }));
assert.ok(failureHtml.includes('role="alert"') && failureHtml.includes('Reload dashboard'));
assert.equal((failureHtml.match(/>—<\/p>/g) || []).length, 4);
assert.ok(!failureHtml.includes('>284<') && !complete.includes('+12%'));
let response = { data: statsResult.stats, error: null }, reject = false, rpcCalls = [];
const { loadDashboardStats } = load('lib/dashboard-stats-server.ts', {
  'server-only': {}, '@/lib/insforge-server': { createInsforgeServer: async () => ({ database: { rpc: async (...args) => { rpcCalls.push(args); if (reject) throw new Error('credential-like private error'); return response; } } }) },
});
assert.equal((await loadDashboardStats()).stats.totalJobs, 284);
assert.deepEqual(rpcCalls[0], ['dashboard_stats']);
response = { data: null, error: { message: 'private backend details' } };
let failed = await loadDashboardStats();
assert.equal(failed.stats, null); assert.ok(failed.error && !failed.error.includes('private'));
response = { data: { totalJobs: 2 }, error: null };
assert.equal((await loadDashboardStats()).stats, null);
reject = true; failed = await loadDashboardStats();
assert.equal(failed.stats, null); assert.ok(!failed.error.includes('credential'));
for (const [age, expected] of [[0, 'Just now'], [59999, 'Just now'], [60000, '1 minute ago'], [120000, '2 minutes ago'], [3600000, '1 hour ago'], [7200000, '2 hours ago'], [86400000, '1 day ago'], [8 * 86400000, '8 days ago']]) assert.equal(activityTime(new Date(now - age).toISOString(), now), expected);
const merged = mergeDashboardActivity([run('a', 60000, 0), run('b', 180000, 1)], [research('a', 0), research('b', 120000), research('c', 240000), research('d', 300000)], now);
assert.equal(merged.length, 5); assert.equal(merged[0].id, 'research:a');
assert.equal(merged[1].message, 'Found 0 jobs for Frontend Engineer'); assert.equal(merged[3].message, 'Found 1 job for Frontend Engineer');
assert.equal(merged[0].tone, 'info'); assert.equal(merged[1].tone, 'success');
assert.equal(mergeDashboardActivity([], [], now).length, 0);
assert.equal(mergeDashboardActivity([run('future', -60000)], [], now).length, 0);
assert.equal(mergeDashboardActivity([run('a', 0), run('b', 0)], [], now)[0].id, 'search:b');
for (const bad of [run('', 0), { ...run('a', 0), jobs_found: -1 }, { ...run('a', 0), completed_at: null }]) assert.throws(() => mergeDashboardActivity([bad], [], now));
assert.throws(() => mergeDashboardActivity([], [{ ...research('a', 0), company_researched_at: 'invalid' }], now));
const escapedActivity = renderToStaticMarkup(React.createElement(RecentActivity, { entries: mergeDashboardActivity([run('a', 0, 1, '<script>bad</script>')], [], now), error: null }));
assert.ok(escapedActivity.includes('&lt;script&gt;') && !escapedActivity.includes('<script>'));
assert.ok(escapedActivity.includes('<time dateTime='));
const activityFailure = renderToStaticMarkup(React.createElement(RecentActivity, { entries: [], error: 'Could not load recent activity.' }));
assert.ok(activityFailure.includes('role="alert"') && activityFailure.includes('Reload dashboard') && !activityFailure.includes('will appear here'));
let activityResponses = { agent_runs: { data: [{ ...run('a', 60000), completed_at: new Date(Date.now() - 60000).toISOString() }], error: null }, jobs: { data: [{ ...research('b', 120000), company_researched_at: new Date(Date.now() - 120000).toISOString() }], error: null } }, queryCalls = [], throwActivity = false;
const activityClient = { database: { from(table) {
  const query = {};
  for (const method of ['select', 'eq', 'not', 'lte', 'order', 'limit']) query[method] = (...args) => { queryCalls.push([table, method, ...args]); return query; };
  query.then = (resolve, reject) => throwActivity ? Promise.reject(new Error('private transport details')).then(resolve, reject) : Promise.resolve(activityResponses[table]).then(resolve, reject);
  return query;
} } };
const { loadDashboardActivity } = load('lib/dashboard-activity-server.ts', { 'server-only': {}, '@/lib/insforge-server': { createInsforgeServer: async () => activityClient } });
assert.equal((await loadDashboardActivity('owner')).entries.length, 2);
for (const table of ['agent_runs', 'jobs']) {
  assert.ok(queryCalls.some(call => call[0] === table && call[1] === 'eq' && call[2] === 'user_id' && call[3] === 'owner'));
  assert.ok(queryCalls.some(call => call[0] === table && call[1] === 'limit' && call[2] === 5));
}
assert.ok(queryCalls.some(call => call[0] === 'agent_runs' && call[1] === 'eq' && call[2] === 'status' && call[3] === 'completed'));
assert.ok(queryCalls.some(call => call[0] === 'jobs' && call[1] === 'not' && call[2] === 'company_research'));
activityResponses.jobs = { data: null, error: { message: 'private details' } };
let activityFailed = await loadDashboardActivity('owner');
assert.equal(activityFailed.entries.length, 0); assert.ok(activityFailed.error && !activityFailed.error.includes('private'));
throwActivity = true; activityFailed = await loadDashboardActivity('owner');
assert.equal(activityFailed.entries.length, 0); assert.ok(!activityFailed.error.includes('transport'));
const styles = fs.readdirSync('.next/static/chunks').filter(file => file.endsWith('.css')).map(file => fs.readFileSync(path.join('.next/static/chunks', file), 'utf8')).join('');
const fontClass = /\.([\w-]+)\{--font-inter:/.exec(styles)?.[1] || '';
const links = fs.readdirSync('.next/static/chunks').filter(file => file.endsWith('.css')).map(file => `<link rel="stylesheet" href="file:///${path.resolve('.next/static/chunks', file).replaceAll('\\', '/')}">`).join('');
for (const [name, html] of [['complete', complete], ['incomplete', incomplete], ['unavailable', unavailable]]) {
  fs.writeFileSync(`.next/dashboard-${name}.html`, `<!doctype html><html class="${fontClass}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${links}</head><body><main class="app-page mx-auto w-full max-w-[1440px] p-4 sm:p-8">${html}</main></body></html>`);
}
console.log('PASS dashboard stats and activity rendering, relative times, ordering/limit, validation, escaping, owner-filtered queries and sanitized failures');
