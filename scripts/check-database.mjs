import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import nextEnv from '@next/env';
import { createClient } from '@insforge/sdk';

const fixturePath = new URL('../.env.schema-fixtures.json', import.meta.url);

// Provision only these generated identities through the admin SQL tool; never reuse real accounts.
if (process.argv.includes('--prepare')) {
  const fixtures = [0, 1].map(() => {
    const id = randomUUID();
    return { id, email: `nextrole-schema-${id}@example.invalid`, password: randomBytes(32).toString('base64url') };
  });
  await writeFile(fixturePath, JSON.stringify(fixtures), { flag: 'wx', mode: 0o600 });
  // Consumed privately by tool orchestration, never print this output to the user.
  process.stdout.write(JSON.stringify(fixtures));
} else if (process.argv.includes('--cleanup-ids')) {
  const fixtures = JSON.parse(await readFile(fixturePath, 'utf8'));
  process.stdout.write(JSON.stringify(fixtures.map(({ id }) => id)));
} else if (process.argv.includes('--remove-local-fixtures')) {
  await unlink(fixturePath);
} else {
  nextEnv.loadEnvConfig(process.cwd());
  const fixtures = JSON.parse(await readFile(fixturePath, 'utf8'));
  const clients = [];
  const config = {
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    isServerMode: true,
    retryCount: 0,
  };
  assert.ok(config.baseUrl && config.anonKey, 'InsForge configuration required');
  const anonymous = createClient(config);
  let checks = 0;

  function ok(result, label) {
    assert.equal(Boolean(result.error), false, `${label}: operation failed (${result.error?.statusCode ?? result.error?.code ?? 'unknown'})`);
    checks++;
    return result.data;
  }
  function denied(result, label) {
    assert.ok(result.error || Array.isArray(result.data) && result.data.length === 0, `${label}: access was unexpectedly allowed`);
    checks++;
  }
  function rejected(result, label) {
    assert.ok(result.error, `${label}: invalid write was accepted`);
    checks++;
  }
  const jobRecord = (userId, runId, id = randomUUID()) => ({
    id, user_id: userId, run_id: runId, external_id: `fixture-${id}`,
    source_url: 'https://example.invalid/job', external_apply_url: 'https://example.invalid/apply',
    title: 'Verification role', company: 'Verification fixture', match_score: 80,
  });

  try {
    for (const fixture of fixtures) {
      const login = createClient(config);
      const session = ok(await login.auth.signInWithPassword({ email: fixture.email, password: fixture.password }), 'fixture login');
      assert.ok(session?.accessToken, 'fixture session required');
      clients.push(createClient({ ...config, accessToken: session.accessToken }));
    }
    const [a, b] = clients;
    const [userA, userB] = fixtures.map(({ id }) => id);
    const runA = randomUUID(), runB = randomUUID();
    const jobA = jobRecord(userA, runA), jobB = jobRecord(userB, runB);
    for (const client of clients) {
      assert.deepEqual(ok(await client.database.from('profiles').select(), 'no automatic profile'), []);
    }
    rejected(await a.database.from('agent_runs').insert([{ user_id: userA, job_title_searched: 'Missing profile' }]), 'run requires a profile');
    for (let i = 0; i < clients.length; i++) {
      const rows = ok(await clients[i].database.from('profiles').insert([{ id: fixtures[i].id }]).select(), 'partial profile insert');
      assert.equal(rows[0].is_complete, false);
      assert.equal(rows[0].completion_percentage, 0);
      ok(await clients[i].database.from('agent_runs').insert([{ id: i ? runB : runA, user_id: fixtures[i].id, job_title_searched: 'Verification' }]), 'own run insert');
      ok(await clients[i].database.from('jobs').insert([i ? jobB : jobA]), 'own job insert');
      ok(await clients[i].database.from('agent_logs').insert([{ user_id: fixtures[i].id, job_id: (i ? jobB : jobA).id, message: 'Verification', level: 'info' }]), 'own log insert without run');
    }
    for (const table of ['profiles', 'agent_runs', 'jobs', 'agent_logs']) {
      const ownerColumn = table === 'profiles' ? 'id' : 'user_id';
      const own = ok(await a.database.from(table).select(), `${table} own read`);
      assert.equal(own.length, 1);
      denied(await a.database.from(table).select().eq(ownerColumn, userB), `${table} cross-user read`);
      const patch = table === 'profiles' ? { full_name: 'Denied' } : table === 'agent_runs' ? { jobs_found: 4 } : table === 'jobs' ? { title: 'Denied' } : { message: 'Denied' };
      denied(await a.database.from(table).update(patch).eq(ownerColumn, userB).select(), `${table} cross-user update`);
      denied(await a.database.from(table).delete().eq(ownerColumn, userB).select(), `${table} cross-user delete`);
      denied(await anonymous.database.from(table).select(), `${table} anonymous read`);
      rejected(await anonymous.database.from(table).insert([table === 'profiles' ? { id: userA } : table === 'agent_runs' ? { user_id: userA, job_title_searched: 'Denied' } : table === 'jobs' ? jobRecord(userA, runA) : { user_id: userA, message: 'Denied' }]), `${table} anonymous insert`);
      denied(await anonymous.database.from(table).update(patch).eq(ownerColumn, userA).select(), `${table} anonymous update`);
      denied(await anonymous.database.from(table).delete().eq(ownerColumn, userA).select(), `${table} anonymous delete`);
      rejected(await a.database.from(table).update({ [ownerColumn]: userB }).eq(ownerColumn, userA).select(), `${table} ownership change`);
      const ownUpdate = ok(await a.database.from(table).update(patch).eq(ownerColumn, userA).select(), `${table} own update`);
      assert.equal(ownUpdate.length, 1);
    }
    rejected(await a.database.from('profiles').insert([{ id: userB }]), 'profile cross-user insert');
    rejected(await a.database.from('agent_runs').insert([{ user_id: userB, job_title_searched: 'Denied' }]), 'run cross-user insert');
    rejected(await a.database.from('jobs').insert([jobRecord(userB, runB)]), 'job cross-user insert');
    rejected(await a.database.from('agent_logs').insert([{ user_id: userB, message: 'Denied' }]), 'log cross-user insert');
    rejected(await a.database.from('jobs').insert([jobRecord(userA, runB)]), 'foreign run ownership');
    rejected(await a.database.from('agent_logs').insert([{ user_id: userA, run_id: runB, message: 'Denied' }]), 'log foreign run ownership');
    rejected(await a.database.from('agent_logs').insert([{ user_id: userA, job_id: jobB.id, message: 'Denied' }]), 'log foreign job ownership');
    rejected(await a.database.from('profiles').insert([{ id: userA }]), 'duplicate profile');
    rejected(await a.database.from('jobs').insert([{ ...jobA, id: randomUUID() }]), 'duplicate external job');
    for (const score of [-1, 101]) rejected(await a.database.from('jobs').insert([{ ...jobRecord(userA, runA), match_score: score }]), 'score bounds');
    for (const patch of [{ status: 'unknown' }, { jobs_found: -1 }, { completed_at: '2000-01-01T00:00:00Z' }]) {
      rejected(await a.database.from('agent_runs').update(patch).eq('id', runA), 'run constraints');
    }
    for (const patch of [{ years_experience: -1 }, { completion_percentage: 101 }, { work_experience: {} }, { work_experience: [{}, {}, {}, {}] }, { education: [] }, { resume_pdf_key: `${userB}/resume.pdf` }]) {
      rejected(await a.database.from('profiles').update(patch).eq('id', userA), 'profile constraints');
    }
    rejected(await a.database.from('jobs').update({ company_research: [] }).eq('id', jobA.id), 'research shape');
    rejected(await a.database.from('jobs').update({ source: 'url' }).eq('id', jobA.id), 'source scope');
    rejected(await a.database.from('agent_logs').insert([{ user_id: userA, message: 'Invalid level', level: 'unknown' }]), 'log level');
    const before = ok(await a.database.from('profiles').select('updated_at').eq('id', userA).single(), 'timestamp before');
    const after = ok(await a.database.from('profiles').update({ full_name: 'Verified' }).eq('id', userA).select('updated_at').single(), 'timestamp after');
    assert.ok(Date.parse(after.updated_at) > Date.parse(before.updated_at));

    const pdf = new Blob(['%PDF-1.4\n% Synthetic verification fixture\n%%EOF'], { type: 'application/pdf' });
    for (let i = 0; i < clients.length; i++) {
      const bucket = clients[i].storage.from('resumes');
      const key = `${fixtures[i].id}/resume.pdf`;
      ok(await bucket.upload(key, pdf), 'own resume upload');
      const blob = ok(await bucket.download(key), 'own resume download');
      assert.equal(await blob.text(), await pdf.text());
      ok(await bucket.upload(key, pdf), 'own resume overwrite');
      rejected(await bucket.upload(`${fixtures[1 - i].id}/resume.pdf`, pdf), 'cross-user resume overwrite');
      rejected(await bucket.upload(`${fixtures[i].id}/extra.pdf`, pdf), 'noncanonical resume key');
      rejected(await bucket.download(`${fixtures[1 - i].id}/resume.pdf`), 'cross-user resume download');
      rejected(await bucket.remove(`${fixtures[1 - i].id}/resume.pdf`), 'cross-user resume delete');
    }
    const keyA = `${userA}/resume.pdf`;
    rejected(await anonymous.storage.from('resumes').download(keyA), 'anonymous resume download');
    rejected(await anonymous.storage.from('resumes').upload(keyA, pdf), 'anonymous resume upload');
    rejected(await anonymous.storage.from('resumes').remove(keyA), 'anonymous resume delete');
    // Direct file URLs must enforce the same rule, even when someone knows the key.
    const direct = await fetch(`${config.baseUrl}/api/storage/buckets/resumes/objects/${encodeURIComponent(keyA)}`);
    assert.ok([401, 403, 404].includes(direct.status), 'anonymous direct URL denied');
    checks++;
    for (let i = 0; i < clients.length; i++) {
      ok(await clients[i].storage.from('resumes').remove(`${fixtures[i].id}/resume.pdf`), 'own resume delete');
    }
    ok(await a.database.from('agent_logs').delete().eq('user_id', userA).select(), 'own log delete');
    rejected(await a.database.from('agent_runs').delete().eq('id', runA), 'referenced run deletion');
    ok(await a.database.from('jobs').delete().eq('id', jobA.id).select(), 'own job delete');
    ok(await a.database.from('agent_runs').delete().eq('id', runA).select(), 'own run delete');
    ok(await a.database.from('profiles').delete().eq('id', userA).select(), 'own profile delete');
    ok(await b.database.from('profiles').delete().eq('id', userB), 'profile cascade delete');
    for (const table of ['agent_runs', 'jobs', 'agent_logs']) assert.deepEqual(ok(await b.database.from(table).select(), 'cascade empty'), []);
    console.log(`PASS ${checks} authenticated SDK/API checks: row isolation, ownership links, constraints, resume access, and cleanup.`);
  } finally {
    for (let i = 0; i < clients.length; i++) {
      const result = await clients[i].storage.from('resumes').remove(`${fixtures[i].id}/resume.pdf`);
      if (result.error && ![403, 404].includes(result.error.statusCode)) console.warn('Fixture storage cleanup needs admin verification.');
    }
  }
}
