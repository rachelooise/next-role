import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import nextEnv from '@next/env';
import rscClient from 'next/dist/compiled/react-server-dom-webpack/client.node.js';
import { createClient } from '@insforge/sdk';

nextEnv.loadEnvConfig(process.cwd());
const fixtures = JSON.parse(await readFile('.env.schema-fixtures.json', 'utf8'));
// Uses React?s encoder so the HTTP harness matches real Server Action multipart ordering.
const manifest = JSON.parse(await readFile('.next/server/server-reference-manifest.json', 'utf8'));
const actionId = Object.entries(manifest.node).find(([, item]) => item.exportedName === 'saveProfile')?.[0];
assert.ok(actionId);
const base = 'http://localhost:3106';
const sessions = [];
let checks = 0;
const check = (condition, label) => { assert.ok(condition, label); checks++; };
const blank = { skills: [], industries: [], work_experience: [], education: null, job_titles_seeking: [], preferred_locations: [] };
const complete = { ...blank, full_name: 'Profile verification fixture', location: 'Perth', work_authorization: 'citizen', current_title: 'Developer', experience_level: 'junior', years_experience: 0, skills: ['React'], job_titles_seeking: ['Developer'], remote_preference: 'any' };
for (const fixture of fixtures) {
  const auth = createClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY, isServerMode: true });
  const { data, error } = await auth.auth.signInWithPassword({ email: fixture.email, password: fixture.password });
  assert.ok(!error && data?.accessToken, 'fixture session');
  sessions.push({ client: createClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY, accessToken: data.accessToken, isServerMode: true }), cookie: `insforge_access_token=${data.accessToken}`, fixture });
}
const [a,b] = sessions;
async function profile(session) {
  const result = await session.client.database.from('profiles').select().eq('id', session.fixture.id).maybeSingle();
  assert.ok(!result.error, 'read own fixture'); return result.data;
}
async function save(session, payload, version = '', file) {
  const body = new FormData();
  body.set('profile', JSON.stringify(payload)); body.set('updatedAt', version);
  if (file) body.set('resume', file);
  const response = await fetch(base + '/profile', { method: 'POST', headers: { 'Next-Action': actionId, Origin: base, Cookie: session.cookie }, body: await rscClient.encodeReply([body]) });
  const text = await response.text();
  assert.equal(response.status, 200, 'action HTTP result');
  return text;
}
try {
  check((await fetch(base + '/api/resume/download')).status === 401, 'anonymous download denied');
  let html = await (await fetch(base + '/profile', { headers: { Cookie: a.cookie } })).text();
  check(html.includes('Your profile') && !html.includes('Faizan'), 'authenticated blank profile page renders');
  check((await profile(a)) === null, 'render does not create a profile');
  check((await save(a, { ...blank, id: b.fixture.id, email: b.fixture.email, is_complete: true })).includes('"success":true'), 'first partial action succeeds');
  let row = await profile(a);
  check(row.email === a.fixture.email && row.is_complete === false && row.completion_percentage === 10, 'session ownership and partial completion persisted');
  check((await profile(b)) === null, 'cannot create other user profile');
  check((await save(a, complete, row.updated_at)).includes('"success":true'), 'complete profile save succeeds');
  let next = await profile(a);
  check(next.is_complete && next.completion_percentage === 100 && next.years_experience === 0 && next.missing_fields.length === 0, 'zero experience complete profile persisted');
  check((await save(a, { ...complete, full_name: 'stale overwrite' }, row.updated_at)).includes('another tab'), 'stale action returns conflict');
  check((await profile(a)).full_name === complete.full_name, 'conflict preserves data');
  check((await save(a, { ...complete, experience_level: 'executive' }, next.updated_at)).includes('"success":false'), 'invalid enum action rejected');
  const file = new File(['%PDF-1.4\nprofile-fixture'], 'resume.pdf', { type: 'application/pdf' });
  check((await save(a, complete, next.updated_at, file)).includes('"success":true'), 'multipart upload action succeeds');
  row = await profile(a);
  check(row.resume_pdf_key === `${a.fixture.id}/resume.pdf` && row.resume_pdf_url, 'private resume references persisted');
  let response = await fetch(base + '/api/resume/download', { headers: { Cookie: a.cookie } });
  check(response.status === 200 && (await response.text()).includes('profile-fixture'), 'owner downloads saved bytes');
  check(response.headers.get('cache-control').includes('no-store'), 'resume response is not cached');
  check((await fetch(base + '/api/resume/download', { headers: { Cookie: b.cookie } })).status === 404, 'other user cannot download owner PDF');
  const foreign = await b.client.storage.from('resumes').download(row.resume_pdf_key);
  check(Boolean(foreign.error), 'storage RLS denies known foreign key');
  html = await (await fetch(base + '/profile', { headers: { Cookie: a.cookie } })).text();
  check(html.includes('Profile verification fixture') && html.includes('Profile complete') && html.includes('Open Resume'), 'reload hydrates saved fields/completion/resume');
  check((await save(a, { ...complete, phone: '123' }, row.updated_at)).includes('"success":true'), 'save without new file succeeds');
  check((await profile(a)).resume_pdf_key === row.resume_pdf_key, 'save preserves saved reference');
  next = await profile(a);
  const replacement = new File(['%PDF-1.4\nreplacement'], 'new.pdf', { type: 'application/pdf' });
  check((await save(a, complete, next.updated_at, replacement)).includes('"success":true'), 'replace PDF succeeds');
  response = await fetch(base + '/api/resume/download', { headers: { Cookie: a.cookie } });
  check((await response.text()).includes('replacement'), 'replacement bytes downloaded');
  console.log(`PASS ${checks} live authenticated HTTP/SDK profile checks`);
} finally {
  for (const session of sessions) {
    const result = await session.client.storage.from('resumes').remove(`${session.fixture.id}/resume.pdf`);
    if (result.error && result.error.statusCode !== 404) console.log('Storage cleanup requires verification');
  }
}

