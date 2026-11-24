# Feature 10: Adzuna discovery

Approved 2026-11-02 in the architect conversation. Implementation authorized.

## Contract

POST /api/agent/find accepts jobTitle (required, at most 150 characters), location (optional, at most 200 characters) and country (us, gb, au, ca, default us). Same origin and validated backend authentication are required. Owner and saved profile always come from the server. A saved profile must contain at least one skill and a current or desired job title. No full completion requirement.

Fetch the first 10 IT listings, omitting where for blank location. Validate provider records, retaining the description snippet and tracking URL. Never fabricate structured details or employment type. Salaries retain country currency and estimated status. Match new listings with Gemini gemini-3.5-flash-lite, returning integer 0 to 100, explanation, matched skills and missing skills. Send professional facts only, with no contact details. A score of at least MATCH_THRESHOLD (70) is strong.

Existing per-user/source/external_id uniqueness is authoritative. Skip duplicates without rescoring or replacing research. Save every successfully scored new job. Isolate individual failures and report retrieved, saved, strong, duplicate and failed counts. A run is completed after all candidates are handled, or failed when all new candidates fail or a fatal error occurs. jobs_found is the number newly saved. Finalization failure must be disclosed, with saved jobs retained. Log sanitized summaries only.

Use server SDK with owner filters and RLS. No schema migration. Three scoring workers, bounded provider requests, no automatic model retries. Run within the request; route duration metadata 180 seconds. Abrupt process termination can leave a running record; no background scheduler is introduced.

Replace sample UI with persisted listings. Load the latest 20 owner listings on the server, disclosing the window when more exist. Existing local controls operate on that window until Feature 11 introduces full database filtering/sorting/pagination. Refresh server data after search, preserve input, and retain saved rows on failure. Profile guidance, loading, empty, complete and partial result states are required. Link listings directly to Adzuna until Feature 12 creates detail pages. Include Jobs by Adzuna credit.

Capture job_search_started and job_found using the configured PostHog project token and server SDK; shutdown each client. Analytics failure cannot invalidate saved jobs. No unrelated analytics/dashboard work.

## Configuration

Server secrets: ADZUNA_APP_ID and ADZUNA_APP_KEY. Existing local AZUNA_API_ID and AZUNA_API_KEY names are accepted as fallback aliases. Reuse GEMINI_API_KEY and the existing Gemini client. Reuse NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN and NEXT_PUBLIC_POSTHOG_HOST. Never persist credentials in documentation or logs.

## Verification

Exercise country/optional location, invalid payloads, profile readiness, model validation, duplicate and concurrent duplicate handling, partial/total failures, run finalization, safe salary/type mapping, owner isolation and persisted reloads. Use synthetic profiles for live checks. Check browser search/loading/results and desktop/mobile layout. Run lint, TypeScript and production build; record evidence and any unverified areas separately.
