# Feature 13 verification

Date: 2026-11-05, Australia/Perth.

## Passed

- 85 local checks cover dossier/source validation, public URL checks, DNS validation at connection time, redirect cleanup, owned API access, cross-origin rejection, duplicate and concurrent starts, identifier-only task payloads, dispatch failure, terminal/orphaned runs, stale worker rejection, fallback persistence, failed refresh preservation, event isolation, professional data minimization, safe text rendering, page limits, browser cleanup and the Gemini callback's structured result/timeout/sanitized-error contract.
- 17 hydrated Chrome checks exercise actual components with a synthetic local API: empty state, start, queued/running polling, status failure/recovery, navigation away and persisted return, all nine fields, safe source links, refresh preservation, failed refresh/retry, limited briefing, 390px overflow and no runtime exceptions.
- Desktop and mobile screenshots were generated in ignored .next/research-desktop.png and .next/research-mobile.png. The mobile screenshot was visually inspected.
- 33 existing job-details checks and 105 discovery regression checks passed.
- A native Node worker bundle imported and registered the Trigger task without a Next.js request context. This verifies module compatibility, not a hosted task deployment.
- TypeScript and scoped lint passed before final documentation updates. The production build passed after the existing Next.js security reminder was acknowledged through a normal rerun.
- Migration 202611050001_company_research was applied through InsForge MCP after checking the migration ledger. It adds only research status bookkeeping and an active-state index; existing dossier fields, profile data and scores are preserved.
- Direct Browserbase session creation and extension-backed session creation passed. All direct diagnostic sessions were released and extensions deleted.
- Real Stagehand browsing extracted verified company evidence with the existing Browserbase credentials and the Gemini callback. The end-to-end provider check then reached Gemini synthesis and received HTTP 503. Another extraction attempt also encountered model unavailability. No complete live provider run is claimed.

## Pending

- Trigger.dev project reference, secret key and worker deployment.
- INSFORGE_API_KEY in the worker environment; user session tokens are deliberately not reused.
- A complete live Gemini dossier synthesis after provider availability recovers.
- Live authenticated API/worker/database roundtrip, owner isolation with two real users, tab closure while a real task runs, failure reconciliation against real Trigger statuses, and independent PostHog ingestion verification.

Feature 13 is implemented locally but remains unchecked in the progress tracker until setup and the full live workflow pass. Existing Feature 12 authenticated checks are not implicitly completed by the synthetic UI harness.

## Compatibility findings

Installed Stagehand 4.4.0 replaces the old constructor/init pattern with browserbase.launch plus Stagehand.create. Structured extract returns data. Both Stagehand and its browser handle need closing. Browserbase SDK 2.25.0 names the timeout parameter api_timeout and maps it to the HTTP timeout field. The Node transport shim resolves startup failures seen with automatic transport selection.

Stagehand's built-in model selection rejected the attempted model configuration during live extraction. Its documented client model callback now uses the same Gemini Flash-Lite model as the rest of the app, with validated JSON and a bounded provider timeout. Model keys remain in the worker instead of being passed in browser configuration.

## Remaining limits

The current checkout retains its known Next.js security advisory. No framework security upgrade was included in this feature. Dependency installation reports audit findings; no broad automatic audit fix was applied. Trigger queue concurrency is per environment, so development and production must not share a single-session Browserbase project concurrently. Employer discovery is conservative and can fall back when an intermediary has no verified employer link. Browser domain policies govern top-level navigation; third-party subresources are still handled by the cloud browser platform.
