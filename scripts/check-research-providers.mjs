import assert from 'node:assert/strict';
import nextEnv from '@next/env';
import { build } from 'esbuild';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

nextEnv.loadEnvConfig(process.cwd());
for (const name of ['GEMINI_API_KEY', 'BROWSERBASE_API_KEY', 'BROWSERBASE_PROJECT_ID']) {
  if (!process.env[name]) throw new Error(`${name} is required for this synthetic provider check`);
}
await build({ entryPoints: ['agent/company-browser.ts', 'agent/research-synthesis.ts'], outdir: '.next/research-provider-check', outExtension: { '.js': '.mjs' }, bundle: true, packages: 'external', platform: 'node', format: 'esm' });
const { browseCompany } = await import(pathToFileURL(path.resolve('.next/research-provider-check/company-browser.mjs')));
const { synthesizeResearch } = await import(pathToFileURL(path.resolve('.next/research-provider-check/research-synthesis.mjs')));
const logs = [];
let phase = 'browser extraction';
try {
  const evidence = await browseCompany({ company: 'Browserbase', title: 'Software Engineer', sourceUrl: 'https://www.browserbase.com/' }, async message => { logs.push(message); });
  assert.ok(evidence.pages.length > 0, `Browser extraction returned no verified evidence (${logs.join(' ')})`);
  const job = { title: 'Software Engineer', company: 'Browserbase', source_url: 'https://www.browserbase.com/', about_role: 'Synthetic test role building browser automation with TypeScript.', about_company: null, responsibilities: [], requirements: ['TypeScript'], nice_to_have: [], benefits: [], matched_skills: ['TypeScript'], missing_skills: ['Browser automation'] };
  const profile = { current_title: 'Software Engineer', experience_level: 'mid', years_experience: 3, skills: ['TypeScript', 'Node.js'], industries: ['Software'], work_experience: [] };
  phase = 'dossier synthesis';
  const dossier = await synthesizeResearch(job, profile, evidence);
  assert.equal(dossier.researchBasis, 'website');
  assert.ok(dossier.yourEdge.length && dossier.smartQuestions.length && dossier.sources.length);
  console.log(`PASS real Browserbase/Stagehand extraction (${evidence.pages.length} pages), Gemini synthesis and validated sources; synthetic professional data only`);
} catch (error) {
  console.error(`FAIL research provider check at ${phase}. No credentials, page content or model output logged.`);
  if (typeof error?.status === 'number') console.error('Provider HTTP status:', error.status);
  if (Array.isArray(error?.issues)) console.error('Invalid dossier fields:', error.issues.map(issue => issue.path?.filter(part => typeof part === 'string').join('.')).filter(Boolean).join(','));
  if (['Unverified research sources', 'Incomplete research synthesis'].includes(error?.message)) console.error(error.message);
  for (const entry of logs) console.error(entry);
  process.exitCode = 1;
}
