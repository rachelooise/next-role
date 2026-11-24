# Architecture

## Feature 16 dashboard activity (2026-11-23)

app/dashboard/page.tsx authenticates, then loads statistics and activity concurrently. lib/dashboard-activity-server.ts uses the existing cookie-bound SDK to query agent_runs and jobs in parallel, each explicitly filtered by the authenticated user ID and protected by existing RLS. Each query returns at most five rows with only display fields, ordered by event timestamp and ID. No research JSON or profile/contact data enters the feed query result.

lib/dashboard-activity.ts validates selected fields, formats relative times, merges both event types and selects the newest five. components/dashboard/RecentActivity.tsx is presentation only, using semantic time elements and stable prefixed row IDs. Feed errors do not replace statistics or charts. No schema, dependency, background polling or historical event table is added. Research history is the latest saved dossier timestamp per job, not an audit log.

## Feature 15 dashboard statistics (2026-11-23)

app/dashboard/page.tsx authenticates before calling the server-only lib/dashboard-stats-server.ts loader. Its cookie-bound InsForge SDK invokes public.dashboard_stats() with no owner argument. The security-invoker SQL function filters jobs.user_id = auth.uid() in addition to existing RLS, has an empty search_path, and grants execution only to authenticated. It computes the four aggregates in one snapshot without returning job rows or being limited by listing pagination. Migration: insforge/migrations/202611230001_dashboard_stats.sql. No admin SDK is used in the request path.

lib/dashboard-stats.ts validates the response and formats serializable cards; components/dashboard remains presentation only. Request-time data stays behind Suspense and is not cached across users. Discovery invalidates /dashboard as well as /find-jobs. Existing profile banner handling stays independent; activity and charts remain fixtures until Features 16–17.

## Stack

| Layer                          | Tool                     | Purpose                                          |
| ------------------------------ | ------------------------ | ------------------------------------------------ |
| Framework                      | Next.js 16 (App Router)  | Full stack framework                             |
| Auth + DB + Storage + Realtime | InsForge                 | Entire backend                                   |
| Cloud browser                  | Browserbase              | Company research — browsing company public pages |
| AI browser control             | Stagehand                | Company page interaction and content extraction  |
| Job Discovery                  | Adzuna API               | Job search and discovery                         |
| AI model                       | OpenAI GPT-4o            | Matching, research synthesis, extraction         |
| Analytics                      | PostHog                  | Event tracking and dashboard charts              |
| PDF generation                 | @react-pdf/renderer      | Resume PDF rendering                             |
| Styling                        | Tailwind CSS + shadcn/ui | UI components and styling                        |
| Language                       | TypeScript strict        | Throughout                                       |

---

## Folder Structure

```
/
├── AGENTS.md
├── context/
│   ├── project-overview.md
│   ├── architecture.md
│   ├── ui-tokens.md
│   ├── ui-rules.md
│   ├── ui-registry.md
│   ├── code-standards.md
│   ├── library-docs.md
│   ├── build-plan.md
│   └── progress-tracker.md
├── app/
│   ├── layout.tsx                          → Root layout, PostHog provider
│   ├── page.tsx                            → Homepage
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx                   → Login page
│   │   └── callback/
│   │       └── page.tsx                   → OAuth callback handler
│   ├── dashboard/
│   │   └── page.tsx                       → Main dashboard
│   ├── profile/
│   │   └── page.tsx                       → Profile form + resume management
│   ├── find-jobs/
│   │   ├── page.tsx                       → Find Jobs page — search controls + jobs list
│   │   └── [id]/
│   │       └── page.tsx                   → Individual job details page
│   └── api/
│       ├── agent/
│       │   ├── find/route.ts              → Trigger Adzuna job discovery
│       │   └── research/route.ts          → Trigger company research agent
│       ├── resume/
│       │   ├── generate/route.ts          → Generate base resume PDF from profile
│       │   └── extract/route.ts           → Extract profile data from uploaded resume PDF
├── agent/
│   ├── adzuna.ts                          → Adzuna API job discovery + GPT-4o scoring
│   ├── research.ts                        → Company research — Browserbase + Stagehand + GPT-4o
│   ├── matcher.ts                         → GPT-4o job matching logic
│   ├── extractor.ts                       → GPT-4o job description extraction + structuring
│   └── types.ts                           → Agent-specific TypeScript types
├── actions/
│   ├── profile.ts                         → Profile save + update
│   └── jobs.ts                            → Job status updates
├── components/
│   ├── ui/                                → shadcn/ui components only
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── homepage/
│   │   ├── Hero.tsx
│   │   ├── HowItWorks.tsx
│   │   └── Features.tsx
│   ├── dashboard/
│   │   ├── StatsBar.tsx
│   │   ├── RecentActivity.tsx
│   │   └── AnalyticsCharts.tsx
│   ├── profile/
│   │   ├── ProfileForm.tsx
│   │   ├── ResumeUpload.tsx
│   │   ├── ResumePreview.tsx
│   │   └── CompletionIndicator.tsx
│   ├── find-jobs/
│   │   ├── SearchControls.tsx
│   │   ├── JobsTable.tsx
│   │   ├── JobFilters.tsx
│   │   └── JobsPagination.tsx
│   └── job-details/
│       ├── JobInfo.tsx
│       ├── MatchScore.tsx
│       ├── JobDescription.tsx
│       ├── CompanyResearch.tsx
│       └── JobActions.tsx
├── lib/
│   ├── insforge-client.ts                 → InsForge browser client instance
│   ├── insforge-server.ts                 → InsForge server client
│   ├── browserbase.ts                     → Browserbase session creation + management
│   ├── stagehand.ts                       → Stagehand initialisation with Browserbase session
│   ├── adzuna.ts                          → Adzuna API client
│   ├── posthog-client.ts                  → PostHog browser client
│   ├── posthog-server.ts                  → PostHog server client
│   └── utils.ts                           → Shared utility functions
└── types/
    └── index.ts                           → Global TypeScript types
```

---

## System Boundaries

| Folder        | Owns                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `app/`        | Pages and API routes only. No business logic.                                                          |
| `agent/`      | All agent logic. Adzuna discovery, company research, matching, extraction. Nothing here touches React. |
| `actions/`    | Server Actions for UI-triggered mutations only. Profile save, profile update.                          |
| `components/` | UI only. No data fetching logic. No direct DB calls.                                                   |
| `lib/`        | Third party client initialisation and shared utilities only.                                           |
| `types/`      | TypeScript types shared across the project.                                                            |

---

## Data Flow

### UI Mutations (Server Actions)

```
User interaction in component
        ↓
Server Action in actions/
        ↓
InsForge DB write
        ↓
Revalidate or redirect
```

### Agent Operations (API Routes)

```
User clicks Find Jobs
        ↓
API route in app/api/agent/find
        ↓
Calls agent/adzuna.ts
        ↓
Adzuna API returns job listings
        ↓
GPT-4o scores each job against user profile
        ↓
Agent writes results to InsForge DB
        ↓
Page data revalidated
```

### Company Research (API Routes)

```
User clicks Research Company on job details page
        ↓
API route in app/api/agent/research
        ↓
Calls agent/research.ts
        ↓
Single Browserbase session opens with Stagehand
        ↓
Navigates to company homepage + sub pages
        ↓
GPT-4o synthesizes dossier from extracted content
        ↓
Dossier saved to jobs.company_research
        ↓
Page data revalidated
```

### Resume Operations (API Routes)

```
User uploads resume or clicks Generate
        ↓
API route in app/api/resume/
        ↓
GPT-4o processes content
        ↓
@react-pdf/renderer renders PDF buffer
        ↓
New PDF uploaded to InsForge Storage
        ↓
URL saved to profiles table
```

---

## InsForge Database Schema

Feature 04 applied 2026-10-31. Source of truth: `insforge/migrations/`, `types/database.ts`, and `context/database-design.md`. Profiles are created on first save, never by OAuth; incomplete fields are allowed. Live two-user/anonymous SDK verification is recorded in `context/database-verification.md`.

RLS: `profiles.id = auth.uid()`; other tables use `user_id = auth.uid()`, for reads and write checks. All owner references cascade on profile deletion. Composite foreign keys keep job/run/log ownership consistent. Anonymous CRUD is denied. `nextrole_internal.schema_migrations` records applied versions outside the API schema.

### `profiles`

| Column              | Type        | Notes                                        |
| ------------------- | ----------- | -------------------------------------------- |
| id                  | uuid        | References auth.users                        |
| full_name           | text        |                                              |
| email               | text        | Pre-filled from auth                         |
| phone               | text        |                                              |
| location            | text        | City, country                                |
| current_title       | text        | Most recent job title                        |
| experience_level    | text        | junior / mid / senior / lead                 |
| years_experience    | integer     |                                              |
| skills              | text[]      | Array of skill tags                          |
| industries          | text[]      | Industries worked in                         |
| work_experience     | jsonb       | Array of up to 3 roles                       |
| education           | jsonb       | Degree, field, institution, year             |
| job_titles_seeking  | text[]      | Roles they want                              |
| remote_preference   | text        | remote / onsite / hybrid / any               |
| preferred_locations | text[]      | Optional preferred locations                 |
| salary_expectation  | text        | Optional                                     |
| linkedin_url        | text        |                                              |
| portfolio_url       | text        |                                              |
| work_authorization  | text        | citizen / permanent_resident / visa_required |
| resume_pdf_url      | text        | InsForge Storage URL of current resume       |
| resume_pdf_key      | text        | Authoritative private object key: {id}/resume.pdf |
| is_complete         | boolean     | True when all required fields filled         |
| completion_percentage | integer   | 0-100, default 0; computed by future save logic |
| missing_fields      | text[]      | Default empty; computed by future save logic |
| created_at          | timestamptz |                                              |
| updated_at          | timestamptz |                                              |

Profile arrays default empty; work_experience must be an array of at most three roles; education must be an object if present. updated_at is maintained by a database trigger. Nullable fields permit partial saves. Private resume URLs must not contain persisted expiring signed links; download using the stored key and an authenticated client.

### `agent_runs`

| Column             | Type        | Notes                        |
| ------------------ | ----------- | ---------------------------- |
| id                 | uuid        |                              |
| user_id            | uuid        | References profiles          |
| status             | text        | running / completed / failed |
| job_title_searched | text        |                              |
| location_searched  | text        |                              |
| jobs_found         | integer     | Total jobs discovered        |
| started_at         | timestamptz |                              |
| completed_at       | timestamptz |                              |

### `jobs`

| Column             | Type        | Notes                                          |
| ------------------ | ----------- | ---------------------------------------------- |
| id                 | uuid        |                                                |
| run_id             | uuid        | Required, references agent_runs with the same owner |
| user_id            | uuid        | References profiles                            |
| source             | text        | search only                                    |
| external_id        | text        | Adzuna identifier; unique per user/source       |
| source_url         | text        | Original job listing URL                       |
| external_apply_url | text        | Direct company apply URL                       |
| title              | text        |                                                |
| company            | text        |                                                |
| location           | text        |                                                |
| salary             | text        | If available                                   |
| job_type           | text        | fulltime / parttime / contract                 |
| about_role         | text        | 2-3 sentence summary                           |
| responsibilities   | text[]      | Bullet points                                  |
| requirements       | text[]      | Bullet points                                  |
| nice_to_have       | text[]      | Optional                                       |
| benefits           | text[]      | Optional                                       |
| about_company      | text        | Brief company description                      |
| match_score        | integer     | 0-100 scored against main profile              |
| match_reason       | text        | GPT-4o explanation                             |
| matched_skills     | text[]      | Skills user has that match                     |
| missing_skills     | text[]      | Skills user lacks                              |
| company_research   | jsonb       | Company dossier from research agent            |
| company_researched_at | timestamptz | Nullable, set when research is saved          |
| found_at           | timestamptz |                                                |

### `agent_logs`

| Column     | Type        | Notes                            |
| ---------- | ----------- | -------------------------------- |
| id         | uuid        |                                  |
| run_id     | uuid        | Nullable; references own run     |
| user_id    | uuid        | References profiles              |
| message    | text        | Human readable log entry         |
| level      | text        | info / success / warning / error |
| job_id     | uuid        | Optional — related job           |
| created_at | timestamptz |                                  |

---

## InsForge Storage

| Bucket  | Path                         | Contents                  |
| ------- | ---------------------------- | ------------------------- |
| resumes | {user_id}/resume.pdf | Current active resume PDF (key within bucket) |

Access: authenticated users only, own files only.

Bucket is private. Restrictive storage.objects policies intersect InsForge's uploaded_by policies and enforce the canonical key and uploader for this bucket. Known-key downloads, overwrites, deletes, and anonymous direct downloads were verified denied for nonowners. Future account deletion must explicitly remove storage bytes; database cascades do not do this.

---

## Authentication

- Provider: InsForge Auth
- Methods: Google OAuth, GitHub OAuth
- Protected routes: /dashboard, /profile, /find-jobs, /find-jobs/[id]
- Public routes: /, /login
- Middleware in middleware.ts checks session on every protected route
- On login → redirect to /dashboard

---

## InsForge Client Pattern

Two separate InsForge instances — never mix them:

```typescript
// lib/insforge-client.ts
// Browser-side — used in client components for auth state
import { createBrowserClient } from "@insforge/ssr";
export const insforge = createBrowserClient(
  process.env.NEXT_PUBLIC_INSFORGE_URL!,
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
);

// lib/insforge-server.ts
// Server-side — used in API routes, Server Actions, agent code
import { createServerClient } from "@insforge/ssr";
import { cookies } from "next/headers";

export const createInsforgeServer = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_INSFORGE_URL!,
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
};
```

---

## Browserbase Session Pattern

```typescript
// Company research session — single session, sequential page visits
const session = await bb.sessions.create({
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  timeout: 120, // 2 minute session — visits 3-4 pages max
});
```

---

## Job Discovery Pattern

**Adzuna API — job search**

```typescript
const response = await fetch(
  `https://api.adzuna.com/v1/api/jobs/us/search/1?` +
    `app_id=${process.env.ADZUNA_APP_ID}&` +
    `app_key=${process.env.ADZUNA_APP_KEY}&` +
    `what=${encodeURIComponent(jobTitle)}&` +
    `where=${encodeURIComponent(location)}&` +
    `category=it-jobs&` +
    `results_per_page=10&` +
    `content-type=application/json`,
);
const data = await response.json();
// data.results — array of job listings
// Each job: title, company.display_name, location.display_name,
//           salary_min, salary_max, description, redirect_url, created
```

---

## Company Research Pattern

```typescript
// Single session — visits company homepage and sub pages sequentially
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  apiKey: process.env.BROWSERBASE_API_KEY!,
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  browserbaseSessionID: session.id,
  modelName: "gpt-4o",
  modelClientOptions: { apiKey: process.env.OPENAI_API_KEY! },
});

await stagehand.init();
const page = stagehand.page;

// Clean company name and construct homepage URL
const cleanName = companyName
  .replace(/\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?).*$/i, "")
  .trim()
  .toLowerCase()
  .replace(/\s+/g, "");

const homepageUrl = `https://www.${cleanName}.com`;

// Navigate and extract — graceful fallback if page not found
try {
  await page.goto(homepageUrl);
  await page.waitForLoadState("networkidle");
  const content = await stagehand.extract({ instruction: "..." });
} catch (error) {
  // Log and continue — GPT-4o will synthesize from what was found
  await logAgentError(jobId, error);
}

// Always close session when done
await stagehand.close();
```

---

## Invariants

Rules the AI agent must never violate:

- API routes contain no UI logic. Components contain no DB logic.
- Agent code in `/agent` never imports from `/components` or `/actions`.
- Server Actions never call agent functions. Agent functions are only called from API routes.
- All InsForge server-side writes use `createInsforgeServer()` — never the browser client.
- No hardcoded hex values or raw Tailwind color classes in components — use CSS variables from ui-tokens.md.
- Every Stagehand action is wrapped in try/catch. Failures are logged to agent_logs, never thrown to crash the run.
- Company research always returns a dossier — even if browser research fails, GPT-4o synthesizes from company name and job description alone. Never return empty.
- Browserbase sessions are always closed with stagehand.close() when done — never leave sessions open.
- Always scope InsForge queries to the current user_id — never query without a user filter.
- Adzuna API always includes category=it-jobs — never search without this filter.
- jobs.source is always 'search'; URL imports are out of scope.

## Feature 07 provider override

Resume extraction uses Google Gemini (gemini-3.5-flash-lite) via lib/gemini.ts and server-only GEMINI_API_KEY, following the user's explicit provider-change request. Existing OpenAI SDK is used only as a compatible HTTP client for Google. Other planned AI operations retain their earlier design until separately implemented. See profile-extraction-verification.md for current external-service availability.

## Feature 08 implementation

Resume generation reuses Gemini gemini-3.5-flash-lite and the existing server credential as a recorded build assumption after the user requested implementation. This supersedes the older GPT-4o generation plan only for Feature 08. agent/resume-generator.ts produces validated content from saved professional facts. lib/resume-pdf.tsx owns the server PDF document and rendering utility, an explicit exception to the general no inline style rule for the PDF renderer's style API. lib/generated-resume.ts owns private storage replacement and optimistic profile reference updates, following Feature 06 recovery. No agent imports React, components or actions. The generate route orchestrates these helpers and validates the session and request. proxy.ts refreshes sessions on /api/resume/:path* while handlers retain final authorization.

## Feature 10 implementation

Approved 2026-11-02, recorded in context/job-discovery-design.md. Job matching now uses Gemini gemini-3.5-flash-lite on explicit user approval, superseding the older GPT-4o requirement for Feature 10. lib/adzuna.ts owns validated provider access; agent/matcher.ts owns matching; agent/adzuna.ts owns run lifecycle, duplicate checks and per-listing persistence. The API route authenticates and loads the saved profile before invoking discovery. lib/jobs.ts is a shared server data loader for the latest 20 owned rows; lib/job-discovery.ts owns shared pure validation/types. Components receive serialized rows and invoke network mutations through lib/job-discovery-client.ts, with no SDK/database imports. No background worker or schema migration. Explicit country selection replaces location-based inference. proxy.ts refreshes /api/agent/find sessions. Discovery server events use lib/posthog-server.ts and the existing configured project token. Feature 11 remains responsible for full database filtering, sorting and pagination.

## Feature 13 implementation

Approved 2026-11-05. Company research runs in Trigger.dev, with one task at a time per environment, rather than in a long Next.js request. The authenticated API reserves an owned job and dispatches identifier-only payloads. The worker claims the current request and uses an explicit owner filter on every admin SDK query. This background worker is an exception to the older rule that all agent work and server writes must use a cookie-bound Next.js client. No user session tokens are passed to the worker.

agent/research.ts owns the worker lifecycle, company-browser.ts collects website evidence and research-synthesis.ts produces validated Gemini dossiers. lib/stagehand-gemini.ts adapts the existing Gemini Flash-Lite model through Stagehand's documented callback. Both browser and Stagehand handles are closed. lib/research-server.ts owns queue/status services, and lib/research-client.ts owns client network requests and polling. Components have no SDK/database imports. Worker-safe modules intentionally have no Next.js server-only marker and are imported only from the task graph.

Migration 202611050001_company_research adds bookkeeping to jobs. Existing dossiers are preserved during refresh/failure. The UI restores saved results and status, and labels job/profile-only fallbacks. Setup and full live verification remain pending; see company-research-design.md and company-research-setup.md.
