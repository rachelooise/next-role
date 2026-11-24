import assert from 'node:assert/strict';
import { build } from 'esbuild';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

await build({ entryPoints: ['trigger/company-research.ts'], outfile: '.next/research-worker-check.mjs', bundle: true, packages: 'external', platform: 'node', target: 'node22', format: 'esm' });
const { companyResearchTask } = await import(pathToFileURL(path.resolve('.next/research-worker-check.mjs')));
assert.equal(companyResearchTask.id, 'nextrole-company-research');
assert.equal(typeof companyResearchTask.trigger, 'function');
console.log('PASS native Node worker bundle imports and registers the research task without Next.js request context');
