# Company research setup

The code and database migration are present. A Trigger.dev account/project and a worker database credential must be configured before background research can run.

## 1. Create the task project

Open https://cloud.trigger.dev and create a project for NextRole. Copy its project reference (`proj_...`) and the Development secret key from the project API Keys page.

Set these in the local `.env.local` file, without pasting secrets into chat or committing them:

```dotenv
TRIGGER_PROJECT_REF=your_project_reference
TRIGGER_SECRET_KEY=your_development_secret_key
INSFORGE_API_KEY=your_insforge_project_admin_key
```

The InsForge admin key is a server credential, distinct from the public anonymous key. Obtain it through your InsForge dashboard. It is used only by the worker and must never receive a NEXT_PUBLIC_ prefix.

The existing local GEMINI_API_KEY, BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID and NEXT_PUBLIC_INSFORGE_URL are reused. Optional PostHog settings are also reused. No secret values are generated or copied automatically by this feature.

## 2. Check local settings

```powershell
npm.cmd run research:setup
```

The check prints missing variable names only, never values. The Next.js API reports that research is not configured until the Trigger settings exist.

## 3. Run the development worker

```powershell
npx.cmd trigger.dev@4.8.3 login
npm.cmd run trigger:dev
```

Keep the development worker process running while testing locally. Start Next.js in another terminal. Clicking Research Company should create a Trigger run, then update the saved job as it progresses. Closing the web tab does not stop the development worker; stopping its terminal does. Use a hosted worker for production.

## 4. Deploy the hosted worker

In the Trigger.dev Production environment, configure:

- NEXT_PUBLIC_INSFORGE_URL
- INSFORGE_API_KEY
- GEMINI_API_KEY
- BROWSERBASE_API_KEY
- BROWSERBASE_PROJECT_ID
- NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN and NEXT_PUBLIC_POSTHOG_HOST, if server analytics are enabled

The worker does not need user cookies, refresh tokens or the InsForge anonymous key.

```powershell
npm.cmd run trigger:deploy
```

Set TRIGGER_PROJECT_REF and the Production TRIGGER_SECRET_KEY in the deployed Next.js app. App and worker must target the same Trigger project/environment. Worker packages are pinned; Stagehand and Browserbase are externalized so Stagehand's packaged browser extension remains available.

Use one active Trigger environment per Browserbase project when its plan allows one session. Queue concurrency is one within an environment; it does not coordinate separate development and production environments.

## 5. Verify a complete run

Use a synthetic account/profile and saved job:

1. Start research, then navigate away or close the tab.
2. Confirm a task is running in Trigger.dev.
3. Return to the job page and confirm its dossier and timestamp were persisted.
4. Refresh the dossier and verify that the old result remains visible.
5. Verify a missing/foreign job cannot be researched.
6. Verify a website failure produces a labeled limited briefing, and a Gemini failure produces a retry action.

Gemini returned HTTP 503 during the live synthetic synthesis check on 2026-11-05. Do not treat a provider outage as successful verification. Temporary diagnostic Browserbase sessions and extensions were released/deleted.

## Local checks

```powershell
npm.cmd run test:research
npm.cmd run test:research:browser
npm.cmd run test:research:providers
```

The browser check uses real components with synthetic data and a local mock API. The provider check contacts Browserbase and Gemini with public website content and a synthetic professional profile, without writing a dossier to the real database. It logs no credentials or model/page content. A production build must exist before running the UI check because it uses the app's compiled CSS.

Official references: https://trigger.dev/docs/manual-setup, https://trigger.dev/docs/triggering, https://docs.stagehand.dev/v4/configuration/browser, https://docs.stagehand.dev/v4/configuration/models.
