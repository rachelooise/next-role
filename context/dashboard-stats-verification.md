# Feature 15 — Stats Bar Real Data

Implemented and verified 2026-11-23.

## Behavior

The four existing cards now read the signed-in user's entire saved jobs dataset. Total Jobs Found counts all owned rows; Avg. Match Rate averages all scores (including zero) and rounds to a whole percentage; Companies Researched counts owned jobs with non-null company_research, including repeated company names; Jobs This Week counts timestamps from the last 168 hours through the database statement timestamp, including the lower boundary and excluding future records.

No jobs shows counts of zero and a dash for the undefined average. Query errors or malformed responses show four dashes plus sanitized feedback and a reload link. Mock +12%/+3% trends are removed. Only recent activity and charts remain samples, labeled accordingly. No new dependency or change to card geometry.

## Implementation

- insforge/migrations/202611230001_dashboard_stats.sql is applied and recorded in the migration ledger. Adds public.dashboard_stats(), a STABLE SQL security-invoker function with empty search_path, explicit user_id = auth.uid(), and existing RLS. PUBLIC and anon cannot execute; authenticated can. No caller-selected owner or admin session.
- lib/dashboard-stats-server.ts invokes the function through the existing cookie-bound SDK, validates the response, and isolates failures.
- lib/dashboard-stats.ts owns shared types, bounds checks, empty behavior and number formatting. The page orchestrates authentication/data, and presentation components only receive serializable stats.
- Discovery also invalidates /dashboard. A fresh dashboard request reads fresh stats; there is no background polling or live push.

## Evidence

- Production build, TypeScript and scoped ESLint passed.
- node scripts/check-dashboard.mjs passed: whole-percentage rounding, grouping, zero scores, empty averages/counts, invalid data, error placeholders/retry, server RPC contract (no owner argument), sanitized returned/thrown errors, profile states, chart accessibility and existing activity rendering.
- node scripts/check-dashboard-stats-live.mjs passed 31 real SDK/HTTP checks using two disposable non-admin identities and the production server. Tested an account without a profile, more than 20 saved jobs, all-score average including zeros, researched jobs with repeated company names, recent/older/future timestamps, two-user isolation, anonymous function/page denial, rejected owner argument, actual dashboard values and refreshed values after insertion.
- Database introspection confirmed security-invoker mode, empty search_path, authenticated execution grant and anonymous denial.
- Cleanup confirmed zero fixture users, profiles, jobs and runs. Ephemeral local credentials were removed. No real user rows were changed.

The SQL tool rejected session-configuration changes in an initial rollback-only test harness. That harness was discarded; successful verification used real authenticated SDK sessions and HTTP requests instead. The first sandboxed network attempt could not log in, and the initial sandboxed app server could not validate backend sessions. Network-enabled test processes passed without application-code corrections. Both test servers were stopped.

Run the live harness only with newly generated fixtures (`--prepare`, consumed privately), provision those identities using admin tooling without sending email, set DASHBOARD_TEST_URL to the running production test server, then remove the marked auth identities and use --remove-local-fixtures. Never use real accounts or display generated credentials.

## Review

Plan alignment: all four Feature 15 definitions implemented; Features 16–17 remain pending.

System integrity: owner scoping and existing RLS retained, session-bound SDK used, presentation has no database calls, tokens/layout preserved. No broad refactor.

Readiness: local and authenticated integration checks passed; no blocking issue found. Existing Next.js security-upgrade advisory remains unresolved from prior sessions. Full browser navigation/back-cache behavior and worker-driven research completion were not exercised in this feature; fresh authenticated requests were verified.
