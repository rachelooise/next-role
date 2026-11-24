import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import nextEnv from '@next/env';
import { resumePdf, detailedResumePdf } from './fixtures/resume.mjs';

nextEnv.loadEnvConfig(process.cwd());
const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const source = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: (id) => id in mocks ? mocks[id] : require(id), process, console, File, Blob, FormData, URL, Uint8Array }, { filename: path });
  return exports;
}
assert.ok(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY is required');
const profile = load('lib/profile.ts');
const helpers = load('lib/profile-extraction.ts', { '@/lib/profile': profile });
const gemini = load('lib/gemini.ts', { 'server-only': {} });
const extractor = load('agent/resume-extractor.ts', { 'server-only': {}, '@/lib/gemini': gemini, '@/lib/profile': profile, '@/lib/profile-extraction': helpers });
const detailed = process.argv.includes('--detailed');
const result = await extractor.extractResume(detailed ? detailedResumePdf() : resumePdf());
if (!result.success) {
  console.log(result.error);
  process.exitCode = 1;
} else {
  assert.equal(result.data.full_name, detailed ? 'Morgan Example' : 'Jordan Example');
  assert.ok(result.data.skills.some((skill) => skill.toLowerCase() === 'react'));
  assert.ok(!('email' in result.data) && !('id' in result.data));
  if (detailed) {
    assert.ok(result.data.linkedin_url?.startsWith('https://'));
    assert.ok(result.data.portfolio_url?.startsWith('https://'));
    assert.ok(result.data.work_experience.length > 0);
  }
  console.log(`PASS live ${gemini.GEMINI_EXTRACTION_MODEL} ${detailed ? 'detailed' : 'basic'} synthetic PDF extraction and output validation`);
}
