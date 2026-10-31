# Memory — NextRole Feature 04

Last updated: 2026-10-31 Australia/Perth

## What was built

Feature 04 is implemented on the connected InsForge backend: profiles, agent_runs, jobs, agent_logs, and a private resumes bucket. Versioned migrations are in insforge/migrations/, shared types in types/database.ts, and the live integration harness in scripts/check-database.mjs. Project architecture, library guidance, build plan, progress tracker, and UI registry were updated. See context/database-design.md and context/database-verification.md for the approved design and evidence.

## Decisions made

The user approved the complete Feature 04 plan. Profiles are created on first explicit save and may be incomplete; OAuth does not create them. Current scope excludes tailoring, URL imports, and cover-letter tone. Preserve the existing wizard-created PostHog initialization.

## Problems solved

InsForge MCP rejects explicit transaction commands; migrations were applied as single atomic PostgreSQL DO blocks and recorded in nextrole_internal.schema_migrations. Do not replay them. Restrictive resume policies supplement existing uploader ownership rules. Details are in the design and verification documents.

## Current state

107 live SDK/API checks passed with two temporary non-admin accounts, covering ownership, anonymous denial, constraints, and private resume operations. Lint and production build passed. Test accounts, data, storage objects, and local credential material were cleaned up. No commit was created; preserve the preexisting uncommitted workspace changes.

Auth implementation and wizard browser analytics already exist. Full provider consent and live PostHog ingestion remain unverified. Feature 03's planned server product-event client remains pending. The earlier PostHog review identified premature identity reset if sign-out fails and minor conventions/documentation issues; those were not fixed in Feature 04. Review notes are in context/posthog-review.md; progress status was reconciled during Feature 04.

Next.js 16.4.0 still reports a security advisory; no upgrade was performed. No UI was added in Feature 04. Profile save, resume UI, job discovery, and company research remain later features.

## Next session starts with

Run /remember restore. After the user confirms continuation, follow AGENTS.md's context reading order and plan Feature 05: Profile Page Full UI. It is the UI slice with mock data; persistence belongs to Feature 06. Preserve the deployed schema and existing auth/PostHog setup. Do not recreate tables or rerun applied migrations.

## Open questions

Full profile completion rules belong to Feature 06. OAuth consent verification, PostHog ingestion/server product-event setup, remaining review findings, and the Next.js security upgrade remain open. Future account deletion must explicitly clean up private storage bytes in addition to database cascades.
