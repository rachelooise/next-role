import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const app = ['TRIGGER_PROJECT_REF', 'TRIGGER_SECRET_KEY'];
const worker = ['NEXT_PUBLIC_INSFORGE_URL', 'INSFORGE_API_KEY', 'GEMINI_API_KEY', 'BROWSERBASE_API_KEY', 'BROWSERBASE_PROJECT_ID'];
for (const [group, keys] of [['Next.js', app], ['Local worker', worker]]) {
  const missing = keys.filter(key => !process.env[key]?.trim());
  console.log(`${group}: ${missing.length ? `missing ${missing.join(', ')}` : 'required settings are present'}`);
  if (missing.length) process.exitCode = 1;
}
console.log('Secret values are never displayed. Production worker settings must also be configured in Trigger.dev.');
