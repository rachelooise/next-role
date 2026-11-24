# Feature 13: Company Research Agent

Approved in chat on 2026-11-05. Implementation is present; live Trigger.dev deployment and an authenticated worker run remain pending setup.

## Confirmed behavior

Research uses Browserbase and Stagehand to inspect a verified company website, then Gemini to write a briefing tailored to the saved job and professional profile. Trigger.dev runs the operation independently of the browser tab. Leaving the page does not cancel the task. Returning restores saved status and results.

The user approved Gemini instead of the older GPT-4o requirement, verified employer links instead of guessing a company domain, and Trigger.dev for durable background execution. These decisions supersede the older synchronous research examples in build-plan.md and library-docs.md.

## Data and ownership

Migration `202611050001_company_research` adds status, request ID, Trigger run ID and request timestamp to jobs. It was applied through InsForge MCP. Existing company_research and company_researched_at hold the result. No new profile fields are written.

The authenticated API derives the owner from the validated session. It checks job ownership and requires at least one saved skill. Conditional database updates reserve only an inactive owned job. Trigger receives only user ID, job ID and request ID. A stable request ID is its idempotency key. Concurrent clicks reuse the same active request.

The worker uses createAdminClient with a server credential because a user session can expire while work is queued. Every worker read and write additionally filters the explicit owner. Updates also match the request ID and expected state, so old tasks cannot overwrite a replacement request. No user access or refresh tokens are sent to Trigger.

The queue allows one task at a time per Trigger environment. Use one active worker environment for a Browserbase project with a single-session limit. A second environment using the same Browserbase project is not covered by that environment's concurrency limit.

## Research flow

1. Resolve the saved posting through at most six HTTPS requests, with a ten second total deadline. Validate each redirect. DNS is checked at connection time and only public addresses are used by the server HTTP transport.
2. For recognized applicant tracking hosts or careers subdomains, inspect the posting for a visible employer website link. Never manufacture a domain. Unresolved Adzuna links use the fallback.
3. Open a single Browserbase session with a 120 second expiry. Verify the homepage identity using structured extraction. Browse at most three useful internal subpages, prioritizing About, Engineering, Blog and Product. An optional employer-link lookup is an additional posting visit, not a company subpage.
4. Enforce a domain policy during browser navigation. Reject nonpublic navigation hosts and cross-company destinations. Job and profile information come from the database, not from browser extraction.
5. Close Stagehand and the cloud browser separately in finally blocks. Stagehand v4 does not close the browser handle it was given.
6. Synthesize with Gemini Flash-Lite. Include only professional profile fields. Never send contact details, account data or tracking URLs to the model. Treat all page content and saved text as untrusted evidence.
7. Validate all nine dossier fields, bounds and source URLs. Sources must come from actual extracted pages. Save evidence basis and limitations alongside the original dossier fields.
8. Atomically save the dossier, timestamp and completed state for the still-current request, then record activity and capture company_researched. Analytics failures do not fail research.

## Failures and refresh

Website failure or uncertain company identity produces a labeled briefing from the saved job and profile. Unsupported facts may remain absent; no facts are invented to fill a section. Gemini failure produces a retryable failed state, not a fabricated dossier.

Refresh preserves the old dossier while queued or running and after failure. The API reconciles terminal Trigger runs and recovers orphaned active states after 70 minutes. Queue TTL is one hour; task maximum duration is four minutes. Full task retries are disabled to avoid repeating browser/model costs. A user can explicitly retry after failure.

Approved 2026-11-16: synthesis retries HTTP 503 exactly once after two seconds, reusing the same inputs and browser evidence. Each request retains its 45-second timeout; SDK retries remain disabled. Authentication, quota, validation and other errors are not retried. Persistent failure still preserves an old dossier and permits manual retry. Worker failure logs record only a fixed stage and safe HTTP/validation category, never raw provider errors or model/profile content.

## UI

The existing Company Research card shows queued/running states, saved results, safe failure text and retry/status actions. All nine fields render: overview, stack, culture, role rationale, your edge, gaps, smart questions, preparation and sources. User reference update (2026-11-16): Culture, Your Edge, Gaps to Address, Smart Questions and Interview Prep use a two-column grid of light rounded cards, colored line icons and purple bullet markers; mobile stacks the cards. This supersedes Your Edge's earlier purple left rule. Empty factual lists have explicit missing-evidence text. Source links open safely in a new tab.

## Files and boundaries

- API: app/api/agent/research/route.ts, with session refresh in proxy.ts.
- Queue/status services: lib/research-server.ts. Client network requests: lib/research-client.ts.
- Shared validation: lib/company-research.ts. URL checks: lib/research-urls.ts.
- Worker clients: lib/research-clients.ts. Stagehand callback: lib/stagehand-gemini.ts.
- Agent: agent/research.ts, company-browser.ts and research-synthesis.ts.
- Trigger entry: trigger/company-research.ts and trigger.config.ts.
- UI: CompanyResearch.tsx and ResearchDossier.tsx, integrated through the existing job details loader/view.

Worker modules intentionally omit the Next.js server-only marker. They run in a separate Node process and are imported only by the task entry. This is the confirmed background-worker exception to the older request-bound client rule. Next.js request services retain server-only markers.

## Setup and verification

See company-research-setup.md and company-research-verification.md. Feature 11 stays reverted and pending. Existing unrelated work is preserved.
