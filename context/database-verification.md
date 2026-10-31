# Feature 04 verification

Verified 2026-10-31 (Australia/Perth) against the connected NextRole InsForge backend.

## Implemented

- Applied versioned application-schema and resume-ownership migrations. Each uses a single atomic DO block because the InsForge SQL tool rejects explicit BEGIN/COMMIT statements. The internal schema_migrations ledger records both versions; do not rerun an applied migration.
- Created profiles, agent_runs, jobs, and agent_logs with constraints, indexes, authenticated owner RLS and explicit grants. No application profile creation during signup/login.
- Provisioned resumes with isPublic false. Existing uploaded_by ownership policies are intersected with restrictive canonical-key and anonymous-denial policies.
- Added shared row/nested data types in types/database.ts. Nested payloads still require application validation before use.

## Live verification

scripts/check-database.mjs passed 107 SDK/API checks, plus its explicit content/count assertions. Two temporary non-admin, verified-email accounts were provisioned through admin SQL, then signed in through the normal SDK password-session API. No real account credentials or sessions were used; no emails were sent.

- Both users initially had no application profile. An agent run without a profile failed. Partial profile inserts succeeded and remained incomplete.
- All four tables allowed own reads/writes, denied cross-user reads/writes and ownership transfers, and denied anonymous CRUD.
- Foreign-run/job links failed even with a valid own user_id. Duplicate profiles and per-user external job IDs failed.
- Invalid scores, negative counts/experience, invalid states/levels, out-of-order run timestamps, invalid JSON containers, too many work roles, foreign resume keys, and URL-import source failed.
- updated_at advanced on profile update. Referenced-run deletion failed. Deleting a profile cascaded through its owned rows.
- Both users could upload, download, overwrite, and delete their own PDF. Foreign-key downloads/overwrites/deletes and noncanonical keys were denied. Anonymous storage upload/download/delete and unauthenticated direct URL download were denied.
- Cleanup query confirmed zero temporary fixture accounts, zero resume objects, and zero rows in all four application tables. Existing real auth users were not modified. Temporary local credential material was removed by the production build's .next cleanup; the reusable harness now uses the ignored .env.schema-fixtures.json path to avoid that race.

The initial local SDK test could not reach the network under sandbox restrictions. The approved network-enabled retry passed.

## Application checks

Lint passed. Production compilation and TypeScript passed; the initial build stopped at the existing Next.js 16.4.0 security advisory. Final build result recorded in progress-tracker.md. No dependency upgrade performed.

## Re-running safely

This is an opt-in integration harness, not an automatic build step. It requires two freshly generated, explicitly marked test identities. Its --prepare output contains ephemeral fixture credentials: capture privately in orchestration, never paste into logs, reports, or commits. Provision only the generated IDs as non-admin auth.users with verified emails and bcrypt password hashes, without sending emails; do not disable global email verification. Normal script execution uses user sessions and the public anon key. Afterward remove those marked users through admin tooling, verify no fixture storage objects remain, and use --remove-local-fixtures. Do not run it against real accounts. No secrets belong in migration files or project memory.

## Boundaries

Profile save/completion rules, resume upload UI/size validation, job agents, and automatic storage cleanup on future account deletion remain later work. Resume URLs must stay authenticated; use the stored key for download. OAuth provider consent and live PostHog ingestion were not part of this verification.
