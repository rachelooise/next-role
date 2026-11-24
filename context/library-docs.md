# Library Docs

## Feature 16 activity queries (2026-11-23)

InsForge database SDK documentation was fetched through MCP. The activity loader uses client.database.from(...).select(...).eq("user_id", userId), then completion/dossier filters, timestamp upper bound, descending timestamp and id orders, and limit(5). agent_runs uses status=completed and completed_at; jobs uses non-null company_research and company_researched_at. .not(column, "is", null) is supported by the installed SDK and passed real backend checks. Both queries use the authenticated session, never an admin client. Merge after both successful results to preserve correct overall recency. No new database function or migration.

## Feature 15 database aggregate (2026-11-23)

InsForge instructions/database SDK docs were fetched through MCP. Use the existing session-bound client and client.database.rpc("dashboard_stats") with no arguments. The deployed PostgreSQL function returns one JSON object, not an array: totalJobs, averageMatchRate (null for no jobs), companiesResearched, jobsThisWeek. Validate before formatting. Aggregation executes as the authenticated caller, preserves jobs RLS and additionally filters auth.uid(); execution is revoked from PUBLIC and anon. No client-selected user ID or server admin credential. This avoids fetching all scores or using the latest-20 listing window for totals.

## Feature 13 overrides, 2026-11-05

The user approved Gemini synthesis, verified employer website links and Trigger.dev background execution. These rules supersede the older synchronous Browserbase/GPT-4o examples below for Feature 13 only. See company-research-design.md, company-research-setup.md and company-research-verification.md.

- Exact runtime packages: @trigger.dev/sdk 4.8.3, @browserbasehq/stagehand 4.4.0, @browserbasehq/sdk 2.25.0, zod 4.6.6 (matches Stagehand), tldts 7.4.19 and undici 8.12.4. Development packages: @trigger.dev/build 4.8.3, esbuild 0.28.2 and @next/env 16.4.0. Keep the existing framework/Tailwind versions unchanged in this feature.
- Stagehand v4 uses browserbase.launch and Stagehand.create, not new Stagehand/init. Structured extract takes instruction, Zod schema and options, and returns data. Both stagehand.close and browser.close are required in finally. Browserbase SDK timeout is named api_timeout, mapped by the SDK to the HTTP timeout field. Use 120 seconds, no retained context and no session recording/logging.
- Import @browserbasehq/sdk/shims/node before Stagehand for this Node worker. Automatic transport selection failed cloud-session startup locally; the documented explicit Node transport worked. Stagehand's package assets must remain available, so its package and Browserbase SDK are externalized in trigger.config.ts.
- Stagehand's documented client generate callback adapts the existing Gemini Flash-Lite client. Do not pass Gemini credentials into the browser configuration or use an implicit Model Gateway/provider fallback. Callback output is structured JSON and Stagehand validates it against its requested schema. Each extraction model call has a 20 second timeout and no automatic retries.
- Dossier synthesis uses gemini-3.5-flash-lite, temperature 0.4, low reasoning, JSON mode, 4500 output tokens and a 45 second timeout per request. On HTTP 503 only, retry synthesis once after two seconds (approved 2026-11-16); SDK retries remain disabled and other failures are not retried. Validate all fields and ensure sources belong to actual extracted pages. Empty factual lists are allowed; advice sections remain useful. A website failure is labeled job/profile-only evidence. Model failure is a retryable failure, not a fabricated complete result.
- Trigger task payloads contain only owner, job and request IDs. Conditional owned reservation plus idempotency keys deduplicate starts. Queue concurrency is one per environment, queue TTL one hour, task duration four minutes, and full task retries are disabled. Terminal status checks and an orphan deadline recover abandoned states. No fire-and-forget Next.js work or after callback is used.
- Only the worker uses createAdminClient({baseUrl, apiKey}) with INSFORGE_API_KEY. Every query still filters its explicit owner and writes match the current request. Next.js routes continue to use the cookie-bound server client. Worker modules omit Next's server-only marker and are not part of a client import graph.
- Server redirect resolution validates HTTPS URLs, ports, credentials and all redirect destinations. Undici's connection DNS lookup rejects nonpublic addresses, avoiding a separate validation/request lookup. Domain comparison uses tldts instead of taking the last two hostname labels. Browser navigation has an allowed-domain policy. Never guess company.com.
- company_researched is emitted only after a successful current-request save. Optional PostHog failure is isolated. Saved profile and match data are unchanged.

Official references checked: https://docs.stagehand.dev/v4/reference/stagehand, https://docs.stagehand.dev/v4/configuration/browser, https://docs.stagehand.dev/v4/configuration/models, https://docs.stagehand.dev/v4/reference/context, https://trigger.dev/docs/manual-setup, https://trigger.dev/docs/triggering and https://trigger.dev/docs/concurrency. Installed SDK types were checked; InsForge instructions and database docs were fetched through MCP.

Live evidence: Browserbase direct and extension-backed sessions passed and were cleaned up. Stagehand extracted real verified company content. Gemini synthesis returned HTTP 503, so no complete live provider run is claimed. Trigger.dev account configuration/deployment and authenticated worker verification remain pending.

Project-specific usage patterns for every third party library in this project. This file only covers how we use each library in this specific project — rules, patterns, and constraints specific to NextRole.

Read the relevant section before implementing any feature that touches these libraries.

---

## Before Using Any Library

Before implementing any feature that uses a third party library:

1. **Check AGENTS.md** at the project root — it lists every skill installed for this project and how to use them. Skills contain up-to-date API documentation, usage patterns, and best practices specific to this codebase.

2. **Check if an MCP server is configured** for that library. Some tools have MCP servers that give the AI agent direct access to documentation, logs, and debugging tools. If an MCP server is available — use it before falling back to general knowledge.

3. **Read this file** for project-specific patterns that override general library knowledge.

The order of authority is:

```
MCP server (real-time docs) → Skills via AGENTS.md → This file (project rules) → General training knowledge
```

Never rely on general training knowledge alone for library APIs — they change frequently and training data may be outdated.

---

## InsForge

### Database and private storage (verified 2026-10-31)

- Feature 04 migrations are in `insforge/migrations/`; row types in `types/database.ts`. See database-design.md and database-verification.md for constraints and live two-user access evidence.
- SDK database operations use `client.database.from(...)`; inserts use arrays. Profiles filter by `id`, while runs/jobs/logs filter by `user_id`; owner RLS additionally enforces isolation.
- SQL MCP rejects explicit transaction commands. Each versioned migration is a single atomic `DO $migration$ ... $migration$` statement, recorded in the internal migration ledger. Do not replay applied migrations.
- Private bucket `resumes` uses object key `{userId}/resume.pdf`. Installed SDK 1.5.2 `upload(key, blob)` replaces an existing key; do not pass the legacy upsert options shown below. Save returned key and authenticated URL; use `download(key)` for private access and never persist expiring signed URLs.
- `remove(key)` takes a single key. InsForge's existing uploaded_by policies plus NextRole's restrictive policies deny foreign paths and anonymous access. These behaviors passed live SDK/API verification.
- The older database/storage examples below are legacy illustrations, not the current API or authorization contract. The API rules above take precedence.

**Check first:** Check AGENTS.md for an installed InsForge skill. If an InsForge MCP server is configured — use it. The skill/MCP will have the latest API patterns.

### Auth and SSR (verified 2026-10-27)

Use `@insforge/sdk/ssr` from installed `@insforge/sdk` 1.5.2, not the older `@insforge/ssr` examples. Official auth docs were fetched through InsForge MCP. SSR-specific reference: `node_modules/@insforge/sdk/README.md`, SSR / Next.js section.

- Server client: `createServerClient({ cookies: await cookies() })`; project wrapper is `lib/insforge-server.ts`.
- Current user: `client.auth.getCurrentUser()`, not `getUser()`. Reuse `getAuthUser()` / `requireAuthUser()` from `lib/auth.ts`. They validate with the backend and return narrow user fields.
- Auth mutations: `createAuthActions({ cookies: await cookies() })` in `actions/auth.ts`. Never send raw session tokens to Client Components.
- OAuth: `auth.signInWithOAuth(provider, { redirectTo, skipBrowserRedirect: true })`; store returned `codeVerifier` in a short-lived httpOnly cookie. Exchange `insforge_code` on the server at `/api/auth/callback` with `auth.exchangeOAuthCode(code, verifier)`.
- SDK writes `insforge_access_token` (browser-readable) and `insforge_refresh_token` (httpOnly). No localStorage token copies.
- Refresh: `updateSession` from `@insforge/sdk/ssr/middleware` in `proxy.ts`. Forward updated request cookies and copy refreshed response cookies onto redirects as well as normal responses.
- Browser client, when needed by a later feature: `createBrowserClient({ baseUrl, anonKey })` from `@insforge/sdk/ssr`. It consumes existing SSR sessions; auth mutations stay on the server. Add the documented same-origin refresh endpoint when introducing a browser SDK consumer.
- Cache Components is enabled. Read sessions behind Suspense and wait for a real request with `connection()` before SDK clock reads. Do not cache user sessions across requests.
- Use `APP_URL` for trusted callback origin; set production HTTPS origin and backend redirect allowlist before deployment.

Selected backend: `https://7uzyg528.ap-southeast.insforge.app` (explicit user choice). Configuration lives in `.env.local`; `.env.example` documents the required names without credentials.

The older database and storage examples below require re-verification through MCP before those features are implemented. In particular, SDK inserts require arrays and database queries use `client.database.from(...)`.

---
### DB Queries

```typescript
// Read
const { data, error } = await insforge
  .from("jobs")
  .select("*")
  .eq("user_id", user.id)
  .order("found_at", { ascending: false });

// Insert
const { data, error } = await insforge
  .from("jobs")
  .insert({ user_id: user.id, title, company, match_score })
  .select()
  .single();

// Update
const { error } = await insforge
  .from("jobs")
  .update({ company_research: dossier })
  .eq("id", jobId)
  .eq("user_id", user.id); // always scope to user
```

**Rules:**

- Always scope queries to `user_id` — never query without user filter
- Always handle the `error` return — never assume success
- Use `.single()` when expecting exactly one row

---

### Storage

```typescript
// Upload file
const { data, error } = await insforge.storage
  .from("resumes")
  .upload(`${userId}/resume.pdf`, fileBuffer, {
    contentType: "application/pdf",
    upsert: true, // overwrites existing file
  });

// Get public URL
const { data } = insforge.storage
  .from("resumes")
  .getPublicUrl(`${userId}/resume.pdf`);

const url = data.publicUrl;
```

**Storage paths:**

- Base resume: `resumes/{user_id}/resume.pdf`

**Rules:**

- Always use `upsert: true` for base resume uploads — overwrites existing file
- Always save the public URL back to the DB after upload
- Never write files to disk — always upload buffer directly to storage

---

## Adzuna API

### Feature 10 implementation, verified 2026-11-02

- lib/adzuna.ts uses native server fetch with no-store, a 12 second timeout and safe response validation. Exactly one page, at most 10 results; category=it-jobs is mandatory. Omit where for blank location. Country is explicitly chosen from us/gb/au/ca (default us), superseding automatic detection in the older build plan.
- Prefer ADZUNA_APP_ID and ADZUNA_APP_KEY; accept existing local AZUNA_API_ID and AZUNA_API_KEY as fallbacks. Never log credential-bearing request URLs or raw provider/SDK errors.
- Adzuna description is only a snippet. Preserve it in about_role, keep unavailable structured fields empty, and do not infer employment type when provider fields are absent. contract_time and contract_type are distinct; preserve both if present. Salary formatting supports missing endpoints, currency codes USD/GBP/AUD/CAD, and both numeric/string salary_is_predicted flags. This supersedes the unsafe legacy salary/job-type mapping below.
- Gemini gemini-3.5-flash-lite performs matching through the existing client. JSON output is validated; matched skills must exist in the saved skill list, missing skills must be absent. Professional facts and preferences only; omit contact details. Each model call has a 20 second timeout and no automatic retries. Three workers share a bounded scoring window.
- Skip existing user/source/external IDs before scoring; the database unique constraint handles concurrent inserts. Never upsert a previously saved job. User queries and run updates are owner scoped. Per-listing failures retain successful saves; summary/run jobs_found counts newly saved rows. No schema migration.
- POST /api/agent/find uses same-origin validation, bounded input, backend authentication and saved-profile readiness. proxy.ts refreshes this API session as well as protected pages. Client network mutations live in lib/job-discovery-client.ts; saved reads live in the server loader lib/jobs.ts.
- Official sources checked: https://developer.adzuna.com/docs/search and https://developer.adzuna.com/overview . Live Australian search, Gemini scoring, owner persistence, duplicate preservation and session refresh passed. No real profile was sent to providers during verification.

**Check first:** Check AGENTS.md for an installed Adzuna skill. If none exists — use this file and the official Adzuna API docs.

### Job Search

```typescript
// lib/adzuna.ts
export async function searchJobs(
  jobTitle: string,
  location: string,
  country: string = "us",
): Promise<AdzunaJob[]> {
  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID!,
    app_key: process.env.ADZUNA_APP_KEY!,
    what: jobTitle,
    category: "it-jobs", // always filter to IT jobs
    results_per_page: "10",
    "content-type": "application/json",
  });

  // Only add where if location is provided
  if (location) {
    params.set("where", location);
  }

  const response = await fetch(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`,
  );

  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}
```

### Response Shape

Each Adzuna job result contains:

```typescript
type AdzunaJob = {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string; // snippet only — not full description
  redirect_url: string; // Adzuna tracking URL → redirects to actual job
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted: "0" | "1"; // "1" means salary is estimated
  contract_type?: string;
  created: string; // ISO date string
  category: { tag: string; label: string };
};
```

### Saving Jobs to DB

```typescript
// Map Adzuna result to jobs table
const jobRecord = {
  user_id: userId,
  run_id: runId,
  source: "search", // always 'search' for Adzuna jobs
  source_url: job.redirect_url,
  external_apply_url: job.redirect_url,
  title: job.title,
  company: job.company.display_name,
  location: job.location.display_name,
  salary: job.salary_min
    ? `$${Math.round(job.salary_min / 1000)}k - $${Math.round(job.salary_max! / 1000)}k`
    : null,
  job_type: job.contract_type || "fulltime",
  about_role: job.description, // Adzuna returns snippet — used as description
  match_score: scoredJob.matchScore,
  match_reason: scoredJob.matchReason,
  matched_skills: scoredJob.matchedSkills,
  missing_skills: scoredJob.missingSkills,
  found_at: new Date().toISOString(),
};
```

**Rules:**

- Always include `category=it-jobs` — never search Adzuna without this filter
- Never pass `where` if location is empty — omit the parameter entirely
- `source` is always `'search'` for Adzuna jobs — never any other value
- `salary_is_predicted: "1"` means Adzuna estimated the salary — this is normal
- Adzuna description is a snippet — GPT-4o scores from it, not a full description
- Default country to `'us'` — support `gb`, `au`, `ca` as alternatives

---

## Browserbase

**Check first:** Check AGENTS.md for an installed Browserbase skill. If a Browserbase MCP server is configured — use it. The skill/MCP will have the latest session management and API patterns.

### Session Creation — Company Research

```typescript
import Browserbase from "@browserbasehq/sdk";

const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });

// Single session for company research — sequential page visits
const session = await bb.sessions.create({
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  timeout: 120, // 2 minute session — visits 3-4 pages max
});
```

**Important — Browserbase runs independently from your Next.js server:**
Browserbase sessions run on Browserbase's cloud infrastructure, not inside your Next.js API route. The API route triggers the Browserbase session and returns a response while the session continues running independently on Browserbase's platform. Do not add `maxDuration` or any timeout configuration to Next.js API routes to accommodate Browserbase session length.

**Rules:**

- Always use single sessions — never parallel sessions (free plan limit)
- Session timeout is 120 seconds — sufficient for 3-4 page visits
- Always end sessions cleanly — call stagehand.close() when done
- Project ID always from `process.env.BROWSERBASE_PROJECT_ID` — never hardcode
- Browserbase client lives in `lib/browserbase.ts` — always import from there

---

## Stagehand

**Check first:** Check AGENTS.md for an installed Stagehand skill. If a Stagehand MCP server is configured — use it. The skill/MCP will have the latest act() and extract() patterns.

### Initialisation

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

const stagehand = new Stagehand({
  env: "BROWSERBASE",
  apiKey: process.env.BROWSERBASE_API_KEY!,
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  browserbaseSessionID: session.id,
  model: { modelName: "openai/gpt-4o", apiKey: process.env.OPENAI_API_KEY! },
  disablePino: true,
});

await stagehand.init();
const page = stagehand.context.activePage()!;
```

### extract()

```typescript
import { z } from "zod";

const result = await stagehand.extract({
  instruction:
    "Extract the company overview, main product description, and any technology mentions from this page.",
  schema: z.object({
    companyOverview: z.string().optional(),
    mainProduct: z.string().optional(),
    techMentions: z.array(z.string()).optional(),
    navLinks: z
      .array(
        z.object({
          label: z.string(),
          url: z.string(),
        }),
      )
      .optional(),
  }),
});
```

### act()

```typescript
// Always wrap in try/catch
try {
  await stagehand.act({
    action: "Click the About link in the navigation",
  });
} catch (error) {
  await logAgentError(jobId, null, error);
}
```

## Company Research Section

Replace the existing Stagehand "Company Research Pattern" section in library-docs.md with this:

---

### Company Research Pattern

Three-step process: homepage extraction → sub-page extraction → GPT-4o synthesis.
Job description and user profile come from DB — never re-fetch what you already have.
Browser's only job is the company website.

```typescript
// Step 1 — Homepage extraction
const homepageData = await stagehand.extract({
  instruction:
    "This is a company's homepage. Capture what the company actually does, who it's for, and any concrete signals (funding, customers, scale, mission, recent launches). Then find the internal links most worth visiting to research them as an employer.",
  schema: z.object({
    oneLiner: z.string().describe("What the company does in one sentence"),
    productSummary: z
      .string()
      .describe("What they build/sell and who it's for"),
    signals: z
      .array(z.string())
      .describe("Funding, notable customers, scale, mission, recent news"),
    pageLinks: z
      .array(
        z.object({
          url: z.string(),
          kind: z.enum([
            "about",
            "careers",
            "blog",
            "engineering",
            "product",
            "team",
            "other",
          ]),
        }),
      )
      .describe("Internal links worth visiting"),
  }),
});

// If oneLiner and productSummary are empty — wrong site or parked domain
// Skip to synthesis with job description and profile only
if (!homepageData.oneLiner && !homepageData.productSummary) {
  await stagehand.close();
  // proceed to synthesis with empty companyResearch
}

// Step 2 — Sub-page extraction (max 3, prefer about/blog/engineering/product over careers)
const subPageData = await stagehand.extract({
  instruction:
    "Extract substance that helps a candidate understand this company before applying: what they do, their values and how they work, the specific technologies and tools they use, notable projects or customers, and how the team operates. Ignore nav, footers, cookie banners, and generic marketing copy.",
  schema: z.object({
    keyPoints: z.array(z.string()),
    technologies: z
      .array(z.string())
      .describe("Specific languages, frameworks, tools, platforms"),
    valuesOrCulture: z
      .array(z.string())
      .describe("Stated values, working style, team norms"),
    notable: z
      .array(z.string())
      .describe("Customers, funding, scale, projects, awards"),
  }),
});

// Step 3 — GPT-4o synthesis (after browser closes)
// Feed three data sources: company research + job from DB + profile from DB
const systemPrompt = `You are a sharp career strategist preparing a candidate to apply for a specific role. You are given (a) research collected from the company's own website, (b) the job posting, and (c) the candidate's profile. Produce a concise, concrete briefing that gives this specific candidate an edge for this specific role.

Rules:
- Ground every company claim in the provided research or job posting. Never invent funding, customers, headcount, or facts. If research was thin, infer carefully from the job posting and say what's inferred.
- Be specific to THIS candidate. Connect their actual skills and past work to this company's stack, product, and values. No generic advice that would apply to anyone.
- Turn the candidate's missing skills into a strategy: how to frame the gap honestly and what adjacent experience to lean on.
- Talking points and questions must reference real things from the research, the kind of detail that signals the candidate did their homework.
- Keep every item tight: one or two sentences. No fluff.

Return ONLY valid JSON matching this shape:
{
  "companyOverview": string,
  "techStack": string[],
  "culture": string[],
  "whyThisRole": string,
  "yourEdge": string[],
  "gapsToAddress": string[],
  "smartQuestions": string[],
  "interviewPrep": string[],
  "sources": string[]
}`;

const userPrompt = `COMPANY RESEARCH (from their website):
${JSON.stringify(companyResearch)}

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Matched skills (already computed): ${job.matched_skills.join(", ")}
Missing skills (already computed): ${job.missing_skills.join(", ")}

CANDIDATE PROFILE:
Current title: ${profile.current_title}
Experience: ${profile.years_experience} years, level ${profile.experience_level}
Skills: ${profile.skills.join(", ")}
Work history: ${JSON.stringify(profile.work_experience)}`;

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  response_format: { type: "json_object" },
  temperature: 0.4,
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ],
});
```

**Dossier fields:**

| Field           | Type     | Purpose                                             |
| --------------- | -------- | --------------------------------------------------- |
| companyOverview | string   | What the company does                               |
| techStack       | string[] | Technologies they use                               |
| culture         | string[] | Values and working style                            |
| whyThisRole     | string   | Why this role exists                                |
| yourEdge        | string[] | Specific links between THIS candidate and this role |
| gapsToAddress   | string[] | Missing skills reframed as strategy                 |
| smartQuestions  | string[] | Questions that show real research                   |
| interviewPrep   | string[] | Topics to prepare for this role                     |
| sources         | string[] | Pages the company info came from                    |

**Rules:**

- Always use `extract()` with a Zod schema — never parse raw HTML or use regex
- Always wrap every `act()` and `extract()` in try/catch
- Always call `await stagehand.close()` when done — ends the Browserbase session
- Model is always `gpt-4o` — never use other models
- Temperature is `0.4` for synthesis — grounded but flexible enough to make real connections
- Max 3 sub-pages — never exceed this on free plan
- Always close session in finally block — never leave sessions open even if research fails
- Job description and profile always come from DB — never re-fetch via browser
- If browser research returns empty — still run synthesis with job + profile only
- yourEdge, gapsToAddress, and smartQuestions are the most valuable fields — never skip them

## OpenAI GPT-4o

**Check first:** Check AGENTS.md for an installed OpenAI skill. The skill will have the latest API patterns and model capabilities.

### Structured JSON Response

```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  response_format: { type: "json_object" },
  temperature: 0.3,
  messages: [
    {
      role: "system",
      content: "You are a job matching assistant. Return only valid JSON.",
    },
    {
      role: "user",
      content: `Your prompt here`,
    },
  ],
});

const result = JSON.parse(response.choices[0].message.content!);
```

**Temperature settings:**

- `0.3` — matching, scoring, extraction, research synthesis — deterministic results
- `0.7` — resume generation — natural variation

**Max tokens:**

- Job matching + scoring: `300`
- Company research synthesis: `800`
- Resume generation: `1000`
- Profile extraction from resume: `800`

**Rules:**

- Model string is always `'gpt-4o'` — never use other model names
- Always use `response_format: { type: 'json_object' }` for structured data
- Always parse `response.choices[0].message.content` as string — even with json_object it returns a string
- Always validate parsed JSON before using — wrap in try/catch
- Match threshold is always `MATCH_THRESHOLD` from `lib/utils.ts` — never hardcode 70
- Company research synthesis must always return a complete dossier — never return empty even if browser research failed

---

## PostHog

Feature 17: dashboard queries use the server-only Query API with POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID and POSTHOG_API_HOST. The Query Read key must never reach the browser. The dashboard filters events by the authenticated distinct ID, uses UTC calendar days and isolates chart failures. Live query and ingestion verification remain pending.

Feature 10 server events (2026-11-02): lib/posthog-server.ts uses exact posthog-node 5.61.1 with the existing NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN/NEXT_PUBLIC_POSTHOG_HOST, flushAt=1, flushInterval=0, bounded requests and shutdown. Authenticated user ID supplies distinctId and userId. job_search_started includes title, location and country; job_found fires only for new saved rows with source and matchScore. Analytics failure is isolated from discovery. Tests verify capture/shutdown/error isolation; independent ingestion querying remains pending. Official Node SDK guidance: https://posthog.com/docs/libraries/node . The older NEXT_PUBLIC_POSTHOG_KEY example below is not the current configuration.

Current browser integration (2026-10-27): initialized in root `instrumentation-client.ts`, before hydration, using `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`. Existing legacy KEY examples below do not describe the current browser configuration. Navigation-bound captures pass `{ transport: "sendBeacon", send_instantly: true }` as the third argument. See `code-standards.md` for the implemented browser event contract. Server SDK setup remains pending.

**Check first:** Check AGENTS.md for an installed PostHog skill. If a PostHog MCP server is configured — use it. The skill/MCP will have the latest client and server patterns.

### Client Setup (Browser)

```typescript
// lib/posthog-client.ts
import posthog from "posthog-js";

export function initPostHog() {
  if (typeof window !== "undefined") {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
      capture_pageview: false, // manual pageview tracking
    });
  }
}

// Capture event client-side
posthog.capture("job_found", {
  userId,
  source: "search",
  matchScore: score,
});
```

### Server Setup

```typescript
// lib/posthog-server.ts
import { PostHog } from "posthog-node";

export const createPostHogServer = () =>
  new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
    flushAt: 1, // send immediately
    flushInterval: 0, // no batching — Next.js functions are short-lived
  });

// Always use and shutdown in the same function
const posthog = createPostHogServer();
posthog.capture({
  distinctId: userId,
  event: "company_researched",
  properties: { userId, jobId, company },
});
await posthog.shutdown(); // required — ensures event is sent
```

**Rules:**

- Always call `await posthog.shutdown()` in server-side functions — events are lost without it
- `flushAt: 1` and `flushInterval: 0` always set on server client
- Event names must match exactly the list in `code-standards.md`
- Always include `userId` as a property on every server-side event
- Call `posthog.identify(userId)` after login on client side
- Call `posthog.reset()` on logout on client side

---

## @react-pdf/renderer

**Check first:** Check AGENTS.md for an installed react-pdf skill. PDF generation APIs can differ from general training knowledge.

### Resume PDF Generation

```typescript
import { renderToBuffer } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  section: { marginBottom: 10 },
  heading: { fontSize: 14, fontWeight: 'bold' },
  text: { fontSize: 10 },
})

const ResumePDF = ({ profile }: { profile: Profile }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.heading}>{profile.fullName}</Text>
        <Text style={styles.text}>{profile.email}</Text>
      </View>
    </Page>
  </Document>
)

// Generate buffer
const buffer = await renderToBuffer(<ResumePDF profile={profile} />)

// Upload directly to InsForge Storage
await insforge.storage
  .from('resumes')
  .upload(`${userId}/resume.pdf`, buffer, {
    contentType: 'application/pdf',
    upsert: true
  })
```

**Supported CSS properties:**
Only use these — others are silently ignored:
`padding, margin, fontSize, color, fontFamily, flexDirection, alignItems, justifyContent, borderRadius, width, height, fontWeight, textAlign, lineHeight`

**Rules:**

- Server-side only — never import in client components
- Always use `renderToBuffer` — not `renderToStream` or `PDFDownloadLink`
- PDF generation only in `app/api/resume/` routes
- Generated buffer uploaded directly to InsForge Storage — never written to disk
- Always save public URL to DB after upload

---

## pdf-parse

**Check first:** Check AGENTS.md for an installed pdf-parse skill.

### Extract Text from Uploaded Resume

```typescript
import pdf from "pdf-parse";

// In API route handling resume upload
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("resume") as File;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const pdfData = await pdf(buffer);
  const extractedText = pdfData.text; // raw text content

  // Send to GPT-4o for structured extraction
}
```

**Rules:**

- Server-side only — never import in client components
- `pdfData.text` is raw unformatted text — GPT-4o handles the structure extraction
- Always handle parse errors — some PDFs are image-based and return empty text
- If `pdfData.text` is empty or very short — return error to user: "Could not extract text from this PDF. Please try a different file."

## Feature 07 library overrides — 2026-10-31

- Direct OpenAI is authorized for resume extraction using the existing server-only OPENAI_API_KEY. No new key or OpenRouter configuration is required for this feature. Model remains gpt-4o; JSON mode is validated by lib/profile-extraction.ts. The extraction output budget is 3000 tokens rather than the older 800-token example, to accommodate up to three work roles and all profile fields. Client timeout 45 seconds, maxRetries 0, store:false.
- Installed openai 7.47.0 requires Node 22+. The local runtime is Node 22.23.1. Keep deployment Node compatible.
- Installed pdf-parse 2.4.5 uses PDFParse({data: Uint8Array}), getInfo(), getText() and destroy(); the earlier default-import/function example is obsolete. Server-only. Keep pdf-parse and @napi-rs/canvas in next.config.ts serverExternalPackages so worker resolution works in production. See the official parser troubleshooting guide linked in profile-extraction-verification.md.
- Current Next.js Cache Components rejects an explicit runtime export in this route; leave the default Node runtime. maxDuration=60 is platform metadata; the model client has its own bounded timeout.

## Gemini provider change — 2026-10-31

User explicitly requested switching resume extraction to the Gemini key already present in .env.local. This supersedes Feature 07's earlier OpenAI/GPT-4o requirement only for extraction. lib/gemini.ts initializes the existing SDK with Google's documented OpenAI-compatible base URL and GEMINI_API_KEY; no OpenAI service call or fallback key is used. Missing GEMINI_API_KEY throws before SDK initialization. Other planned AI features have not been migrated.

Current model: gemini-3.5-flash-lite, reasoning_effort low, JSON mode, max_tokens 3000, 45-second timeout, no automatic retries. The OpenAI-only store option is omitted; Google data-handling rules apply. The UI identifies Google Gemini. Quota/rate limits (429) and temporary overload (503) have separate readable feedback.

Verification: 37 extraction checks and 48 save checks passed, including client endpoint/key/model configuration and overload/quota errors. Key validation via Google's model-list endpoint succeeded. Gemini 2.5 Flash appears in the list but its generation endpoint returns 404 saying it is unavailable to new users and recommending 3.8 Flash. Both 3.8 Flash via compatibility API and 3.1 Flash-Lite via compatibility/native APIs returned 503 UNAVAILABLE due to high demand; no successful live extraction is claimed. Stopped repeated requests after confirming the provider condition. A synthetic, database-free live check is available as npm run test:gemini:live. No real resumes or user profiles were accessed or changed by these diagnostics.

Reference: https://ai.google.dev/gemini-api/docs/openai . This provider override supersedes the earlier direct OpenAI/model requirements for Feature 07. Do not route Gemini keys to OpenAI or fall back to OPENAI_API_KEY.

- Availability follow-up: gemini-3.5-flash-lite is now the extraction model. A live synthetic PDF extraction passed after the previous 3.8 model timed out. Same Gemini endpoint/key, low reasoning, parser/validation, and explicit save behavior. Historical 503 notes above do not describe the latest successful check.

- Resume extraction validation: Gemini may return printed LinkedIn/portfolio links without their protocol. lib/profile-extraction.ts adds HTTPS only to ordinary domain-style links before strict validation. Do not weaken shared profile-save URL validation. Use test:gemini:live -- --detailed for the realistic synthetic regression; never log model output or resume content.

## Feature 08 generation overrides, 2026-10-31

Generation uses the existing Gemini client and gemini-3.5-flash-lite, 0.3 temperature, 2200 output tokens, low reasoning and validated JSON. It never falls back to the OpenAI service. Model input contains only saved professional facts, not contact details, account metadata or job preferences. The renderer reads contact details directly from validated saved data.

Installed exact @react-pdf/renderer 4.3.2. Use server renderToBuffer only, with embedded Noto Sans regular and bold from public/fonts, licensed under OFL. No font request at runtime. next.config.ts traces these fonts for the generation route. PDF font and point sizing are document specific and use the renderer's style API, not web CSS tokens. Default 11pt, retry 10pt; pdf-parse validates one page before persistence. Oversized content returns guidance without upload. No content is clipped to force a page.

InsForge upload(key, Blob) replaces the canonical private object; no upsert option or public bucket. Save both the returned URL and canonical key, serve only through authenticated View Resume. Back up bytes and attempt restoration on database failure. The inherited cross-server canonical-key race is documented in resume-generation-review.md.

Official references checked: https://react-pdf.org/docs/v4/node , https://react-pdf.org/docs/v4/advanced , https://ai.google.dev/gemini-api/docs/openai . Installed Next.js route handler, proxy and output tracing guides were read before implementation. InsForge storage and auth docs were fetched through MCP.
