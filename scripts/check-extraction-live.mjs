import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import nextEnv from '@next/env';
import { createClient } from '@insforge/sdk';
import rscClient from 'next/dist/compiled/react-server-dom-webpack/client.node.js';
import { resumePdf } from './fixtures/resume.mjs';

nextEnv.loadEnvConfig(process.cwd());
const base = 'http://localhost:3107';
const fixtures = JSON.parse(await readFile('.env.schema-fixtures.json', 'utf8'));
const manifest = JSON.parse(await readFile('.next/server/server-reference-manifest.json', 'utf8'));
const actionId = Object.entries(manifest.node).find(([, item]) => item.exportedName === 'saveResume')?.[0];
assert.ok(actionId);
const sessions = [];
let checks = 0;
const check = (value, label) => { assert.ok(value, label); checks++; };
for (const fixture of fixtures) {
  const auth = createClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY, isServerMode: true });
  const result = await auth.auth.signInWithPassword({ email: fixture.email, password: fixture.password });
  assert.ok(!result.error && result.data?.accessToken, 'fixture sign-in');
  sessions.push({ fixture, cookie: `insforge_access_token=${result.data.accessToken}`, client: createClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY, isServerMode: true, accessToken: result.data.accessToken }) });
}
const [a, b] = sessions;
async function extract(session, updatedAt) {
  const response = await fetch(base + '/api/resume/extract', { method: 'POST', headers: { Origin: base, Cookie: session.cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ updatedAt, userId: a.fixture.id, resume_pdf_key: `${a.fixture.id}/resume.pdf` }) });
  const result = await response.json();
  return { response, result };
}
async function getProfile(session) {
  const result = await session.client.database.from('profiles').select().eq('id', session.fixture.id).maybeSingle();
  assert.ok(!result.error); return result.data;
}
try {
  const anonymous = await fetch(base + '/api/resume/extract', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: '{}' });
  check(anonymous.status === 401, 'anonymous extraction denied');
  let result = await extract(b, '');
  check(result.response.status === 404, 'cannot extract another user resume');
  const data = new FormData();
  data.set('updatedAt', ''); data.set('resume', new File([resumePdf()], 'resume.pdf', { type: 'application/pdf' }));
  const saved = await fetch(base + '/profile', { method: 'POST', headers: { Origin: base, Cookie: a.cookie, 'Next-Action': actionId }, body: await rscClient.encodeReply([data]) });
  check(saved.ok && (await saved.text()).includes('"success":true'), 'independent Save Resume creates draft and uploads');
  const before = await getProfile(a);
  check(before.full_name === null && before.resume_pdf_key === `${a.fixture.id}/resume.pdf`, 'resume-only save does not fill profile');
  result = await extract(a, 'stale');
  check(result.response.status === 409, 'stale extraction rejected before model');
  result = await extract(a, before.updated_at);
  if (!result.result.success) console.log('Extraction failed:', result.response.status, result.result.error);
  check(result.response.status === 200 && result.result.success, 'live extraction endpoint succeeds');
  check(result.result.data.full_name === 'Jordan Example', 'actual Gemini extraction reads synthetic name');
  check(result.result.data.skills.some((skill) => skill.toLowerCase() === 'react'), 'actual model extracts skills');
  check(!('email' in result.result.data) && !('id' in result.result.data), 'protected fields absent');
  check(result.response.headers.get('cache-control').includes('no-store'), 'private model result not cached');
  const after = await getProfile(a);
  check(JSON.stringify(after) === JSON.stringify(before), 'extraction does not save profile fields or completion');
  const html = await (await fetch(base + '/profile', { headers: { Cookie: a.cookie } })).text();
  check(html.includes('Extract from Resume') && !html.includes('Jordan Example'), 'reload exposes extraction action but does not persist model details');
  console.log(`PASS ${checks} live resume-only save, parser, Gemini and ownership checks`);
} finally {
  for (const session of sessions) {
    const result = await session.client.storage.from('resumes').remove(`${session.fixture.id}/resume.pdf`);
    if (result.error && result.error.statusCode !== 404) console.log('Verify fixture PDF cleanup');
  }
}
