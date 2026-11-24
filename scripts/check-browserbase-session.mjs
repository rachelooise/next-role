import Browserbase from '@browserbasehq/sdk';
import nextEnv from '@next/env';
import { createReadStream } from 'node:fs';

nextEnv.loadEnvConfig(process.cwd());
const client = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY, maxRetries: 0, timeout: 20000 });
let session;
let extension;
try {
  if (process.argv.includes('--extension')) {
    extension = await client.extensions.create({ file: createReadStream('node_modules/@browserbasehq/stagehand/dist/assets/stagehand-extension.zip') });
    console.log('PASS diagnostic extension uploaded');
  }
  session = await client.sessions.create({ projectId: process.env.BROWSERBASE_PROJECT_ID, api_timeout: 120, ...(extension ? { extensionId: extension.id } : {}), browserSettings: { recordSession: false, logSession: false }, ...(process.argv.includes('--stagehand-metadata') ? { userMetadata: { stagehand: 'true', stagehand_sdk_language: 'typescript', stagehand_sdk_version: '4.4.0' } } : {}) });
  console.log('PASS direct Browserbase session creation');
  console.log('Session response has string id/connectUrl:', typeof session.id === 'string', typeof session.connectUrl === 'string');
} catch (error) {
  console.error('Browserbase session failed, HTTP status:', typeof error?.status === 'number' ? error.status : 'none');
  const text = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
  for (const category of ['project', 'extension', 'timeout', 'limit', 'quota', 'plan', 'payment', 'credit', 'concurrent', 'unauthorized', 'forbidden', 'invalid', 'unknown', 'required', 'browser', 'api key']) {
    if (text.includes(category)) console.error('Provider error category:', category);
  }
  const errorBody = error?.error;
  if (errorBody && typeof errorBody === 'object') console.error('Provider response fields:', ['message','error','errors','details','statusCode','code'].filter(key => key in errorBody).join(','));
  process.exitCode = 1;
} finally {
  if (session) {
    try { await client.sessions.update(session.id, { status: 'REQUEST_RELEASE' }); console.log('PASS diagnostic session released'); }
    catch { console.error('Diagnostic session cleanup failed; session has a 120 second expiry.'); process.exitCode = 1; }
  }
  if (extension) {
    try { await client.extensions.delete(extension.id, { headers: { 'Content-Type': null } }); console.log('PASS diagnostic extension removed'); }
    catch { console.error('Diagnostic extension cleanup failed.'); process.exitCode = 1; }
  }
}
