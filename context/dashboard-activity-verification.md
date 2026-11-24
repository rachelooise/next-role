# Feature 16 — Recent Activity Real Data

Implemented and verified 2026-11-23.

## Behavior

The dashboard shows the newest five completed job searches and saved company research entries owned by the signed-in user. Searches read agent_runs.jobs_found/job_title_searched and use completed_at; research reads jobs.company and company_researched_at, only when company_research is non-null. These are the actual event timestamps; neither source has a generic event created_at column. Results sort newest first, with stable source-prefixed ID tie-breaking, then take five overall.

Search dots are green, research dots blue. Zero-result completed searches remain visible, singular jobs use correct grammar, and each timestamp has a semantic time element plus a relative label. Running/failed searches, missing timestamps, missing dossiers and future events are excluded. A saved dossier remains a valid event during a failed/pending refresh; a subsequent successful save moves the same job event up, without fabricating an audit history.

No activity gives the existing empty message. Any query/validation failure gives a sanitized error and reload link instead of an incomplete or sample feed. Stats and charts stay visible. Only charts now carry a sample-data disclosure. Layout and semantic tokens are retained; long names/titles wrap.

## Implementation

- lib/dashboard-activity-server.ts runs two cookie-bound InsForge SDK queries concurrently, both explicitly filtered by authenticated user ID. Existing RLS adds isolation. Each query orders and limits to five; at most ten display rows transfer. No dossier JSON is downloaded.
- lib/dashboard-activity.ts validates, formats and merges. UI components have no SDK/database calls. Page-level authentication and Suspense remain; stats/activity load in parallel.
- No schema migration, dependency or provider call. No polling/live-push requirement was added; a fresh dashboard request reads current data. Discovery already invalidates /dashboard.

## Validation

- Production build, TypeScript and scoped ESLint passed.
- node scripts/check-dashboard.mjs passed stats regressions plus activity ordering, five-item cap, ID ties, zero/singular grammar, relative-time boundaries, future exclusion, invalid data, escaped text, semantic timestamps, empty/error rendering, explicit owner filters, query limits and sanitized returned/thrown failures.
- node scripts/check-dashboard-activity-live.mjs passed 27 real SDK/HTTP checks with two disposable non-admin accounts. The test executes the actual server loader using real session-bound SDK clients, then verifies the authenticated production dashboard.
- Live scenarios: empty account without a profile, more than five searches, merging both sources, search completion order despite an old start time, research-save order despite an old job-found time, running/failed/undated/future exclusions, retained dossier during failed refresh, zero/singular counts, owner filtering plus RLS, actual dashboard labels, removal of mock entries, refreshed research reordering without duplicate events, second-user isolation and anonymous dashboard denial.
- Temporary profiles/jobs/runs were removed through their owner sessions. Admin cleanup removed only the two marked fixture auth identities; a follow-up query confirmed zero fixture users, profiles, jobs and runs. Local fixture credentials were removed and the test server stopped. No real user data changed.

The feed's reference layout was already checked at desktop/mobile in Feature 14; this feature's content/state changes were checked through real authenticated HTTP rendering and local component rendering. No new hydrated browser or external provider/worker run is claimed.

## Review

Plan alignment: all Feature 16 requirements implemented; five events chosen within the specified 5–10 range to preserve the reference card composition.

System integrity: authenticated owner filters/RLS, no component data fetching, no unnecessary provider integration or schema change, and existing card/token patterns retained.

Readiness: build, local and authenticated integration checks passed. No blocking issue found for this feature. Charts remain mock data until Feature 17; earlier Next.js advisory and unrelated research-worker acceptance follow-ups remain unresolved.

To repeat live verification, generate disposable credentials with scripts/check-dashboard-stats-live.mjs --prepare and consume the output privately, provision those marked accounts without email, set DASHBOARD_TEST_URL to the running test app, then run scripts/check-dashboard-activity-live.mjs. Remove the marked auth identities, verify cleanup and remove local fixtures afterward. Never use real accounts or print credentials.
