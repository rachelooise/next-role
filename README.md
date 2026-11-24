# NextRole

NextRole is an AI-powered job search assistant that helps you discover relevant roles, see how they match your profile, and research companies before applying.

## Features

- **Profile and resume:** Save your skills and experience, upload a PDF resume, extract profile details, and generate a resume from your profile.
- **Job discovery:** Search Adzuna for IT roles by title, location, and country. Gemini scores new jobs against your saved profile.
- **Saved jobs:** Search by company or role, filter by match score, sort results, and browse saved jobs.
- **Company research:** Generate a company briefing with website evidence and interview preparation. Research runs in a background worker.
- **Dashboard:** View saved-job statistics, recent activity, and PostHog analytics charts.
- **Apply:** Open the original job listing in a new tab. NextRole does not submit applications on your behalf.

## Tech stack

Next.js and TypeScript power the app. InsForge provides authentication, PostgreSQL, and file storage. Job discovery uses Adzuna and Google Gemini; company research uses Trigger.dev, Browserbase, Stagehand, and Gemini. PostHog provides event tracking and analytics. Resume PDFs are rendered with React PDF.

## Getting started

### Prerequisites

- Node.js and npm. Use a recent Node.js release compatible with the dependencies in `package.json`.
- An InsForge project with the schema and storage setup described in the project migrations and context documentation.
- Google and/or GitHub OAuth configured in InsForge for sign-in.
- Adzuna and Gemini credentials for job discovery and AI features.
- Trigger.dev and Browserbase accounts for company research.
- A PostHog project for event tracking and dashboard analytics.

### Install and configure

```bash
npm install
```

Copy `.env.example` to `.env.local` and fill in the values for your services. Keep `.env.local` private and never commit credentials. The template documents all supported variables, including:

| Service | Variables |
| --- | --- |
| InsForge | `NEXT_PUBLIC_INSFORGE_URL`, `NEXT_PUBLIC_INSFORGE_ANON_KEY` |
| App URL | `APP_URL` |
| Adzuna | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` |
| Gemini | `GEMINI_API_KEY` |
| Company research | `TRIGGER_PROJECT_REF`, `TRIGGER_SECRET_KEY`, `INSFORGE_API_KEY`, `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID` |
| PostHog event capture | `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST` |
| PostHog dashboard queries | `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST` |

The PostHog personal API key needs Query Read access and must remain server-side. The InsForge admin key is used by the research worker and must also remain private.

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, and complete your profile before searching for jobs.

### Run company research locally

In another terminal, check the worker configuration and start the development worker:

```bash
npm run research:setup
npx trigger.dev@4.8.3 login
npm run trigger:dev
```

Keep the worker running while testing research. If the Trigger.dev CLI rejects the dependency version ranges even though the installed SDK and build package match version 4.8.3, the local worker can be started with:

```bash
npx trigger.dev@4.8.3 dev --env-file .env.local --skip-update-check
```

See [company research setup](context/company-research-setup.md) for worker credentials, production configuration, and deployment details.

## Checks

```bash
npm run build
npm run lint
npm run test:discovery
npm run test:research
```

Additional profile, resume, research, and live-provider checks are listed in `package.json`. Live checks can use external services and credentials; read the relevant script and verification notes before running them.

## Project status

The main user flows are implemented. Search has been confirmed in the app; live verification of all filter, sort, and multi-page pagination combinations remains a follow-up. Company research has completed a live run, while hosted worker deployment and additional acceptance checks remain pending. Dashboard charts have been seen with data; independent cross-user isolation checks remain pending.

See [the progress tracker](context/progress-tracker.md) for current status and verification notes. The installed Next.js version has a known security advisory; a security upgrade was started separately and has not yet been merged.
