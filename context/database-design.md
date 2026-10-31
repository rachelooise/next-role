# Feature 04: Database schema — implementation plan

Date: 2026-10-31 (Australia/Perth)
Status: approved and implemented on 2026-10-31. Both migrations applied to the connected backend; 107 authenticated SDK/API checks passed. See database-verification.md.

## What we are building

Create the NextRole data foundation in the existing connected InsForge project: profiles, agent_runs, jobs, agent_logs, and a private resumes bucket. Include relationships, validation constraints, indexes, ownership policies, and versioned migration files. This feature creates infrastructure and shared data types; profile forms, save actions, job discovery, research agents, and analytics remain their later features.

## Language agreed on

- Schema: the four application tables, their relationships, constraints, and indexes.
- User isolation: each authenticated user can access only records and resume objects they own.
- Resume storage: one active PDF per user in the private resumes bucket.
- Profile creation: first explicit profile save, permitting incomplete fields; OAuth creates no application profile.

## Decisions made

- Use the existing connected InsForge backend. Read-only inspection found no application tables or buckets.
- Follow current product scope: no resume tailoring, URL imports, or cover-letter tone field. Jobs have source search only.
- profiles.id is both the primary key and a reference to auth.users(id). Other tables use user_id referencing profiles(id). No separate profiles.user_id column.
- Missing profile means onboarding is incomplete. Future searches require a complete profile; this gate belongs to the discovery feature, not an auth trigger or this migration.
- Ownership policies use auth.uid(): profiles checks id; other application tables check user_id. Apply both row visibility and write checks. Anonymous access is denied. Application operations retain the authenticated user's session rather than bypassing policies with admin credentials.
- Enforce ownership across related rows through composite foreign keys: a job cannot reference another user's run, and a log cannot reference another user's run or job even when its own user_id is valid.
- Keep nested work experience, education, and company dossier data in JSONB; common search and sort properties remain ordinary columns. Validate container shapes in the database; future application code validates full nested payloads.
- Save a storage key alongside the resume reference. Private download links are obtained on demand; do not persist expiring signed URLs as permanent resume references.
- Keep migrations in version control and apply database changes transactionally. Bucket provisioning is a separate step, verified independently. Never drop or replace existing data to resolve drift.

## Proposed tables

### profiles

- id UUID primary key, references auth.users(id), cascade on user deletion.
- Nullable text fields: full_name, email, phone, location, current_title, linkedin_url, portfolio_url, salary_expectation.
- Nullable constrained text: experience_level (junior/mid/senior/lead), remote_preference (remote/onsite/hybrid/any), work_authorization (citizen/permanent_resident/visa_required).
- years_experience nullable nonnegative integer.
- skills, industries, job_titles_seeking, preferred_locations: non-null text arrays, default empty.
- work_experience: JSONB array, default empty, at most three entries. education: nullable JSONB object.
- resume_pdf_key and resume_pdf_url: nullable text. Key is authoritative; URL must not make the object public or store an expiring signed link.
- is_complete boolean default false. completion_percentage integer default zero, bounded 0–100; missing_fields text array default empty. Future save code computes these together using the profile requirements.
- created_at and updated_at: non-null timestamps with defaults; database updates updated_at automatically.
- Completeness is not a database NOT NULL requirement on individual profile fields; partial saves must work.

### agent_runs

- id UUID primary key, user_id required reference to profiles, unique (user_id, id) for ownership-safe relationships.
- status required, constrained to running/completed/failed, default running.
- job_title_searched required text; location_searched nullable text.
- jobs_found nonnegative integer, default zero.
- started_at required timestamp default now; completed_at nullable timestamp, never earlier than started_at.
- This is the persisted search execution record; dashboard activity uses started_at/completed_at, not a nonexistent created_at field.

### jobs

- id UUID primary key, user_id required reference to profiles, run_id required ownership-safe reference to agent_runs.
- source constrained to search, default search. external_id required text (Adzuna identifier); unique (user_id, source, external_id) prevents repeated searches duplicating a user's job.
- Required text: source_url, external_apply_url, title, company. Nullable text: location, salary, job_type, about_role, about_company, match_reason. Leave job_type flexible because provider values vary.
- responsibilities, requirements, nice_to_have, benefits, matched_skills, missing_skills: non-null text arrays, default empty.
- match_score required integer, bounded 0–100. Future discovery inserts jobs only after scoring succeeds.
- company_research nullable JSONB object, using the nine-field dossier in the build plan; company_researched_at nullable timestamp supports accurate activity ordering.
- found_at timestamp default now. Subsequent discovery must preserve the original discovery time when handling a duplicate; no new record and no duplicate job_found event for an already saved job.
- Deleting a profile cascades to owned data; deleting a referenced run is restricted while jobs/logs depend on it. No run-delete workflow is introduced.

### agent_logs

- id UUID primary key, user_id required reference to profiles.
- run_id nullable ownership-safe reference to agent_runs; job_id nullable ownership-safe reference to jobs. Nullable run permits company research logs outside discovery runs.
- message required text; level constrained to info/success/warning/error; created_at timestamp default now.
- A log with both references must own both. Matching a log's job to its discovery run is not mandatory because research is a separate operation.
- Logs must not include credentials, raw resume contents, or provider authentication payloads.

## Indexes

- agent_runs (user_id, started_at descending).
- jobs (user_id, found_at descending), (user_id, match_score descending), and a partial (user_id, company_researched_at descending) for researched jobs.
- agent_logs (user_id, created_at descending), plus indexes for run/job references used to retrieve logs.
- Primary keys and ownership/deduplication unique constraints supply their own indexes. Avoid adding speculative full-text indexes before filtering behavior is implemented.

## Storage

- Bucket: resumes, private. Object key within it: {user_id}/resume.pdf (the bucket name is not repeated in the key).
- Read, upload, overwrite, and delete limited to the authenticated owner; authenticated access alone is insufficient.
- Verify the actual installed InsForge storage authorization model before implementing policies. Confirm that a different user cannot access a known key and anonymous requests cannot download it.
- PDF validation and upload size limits belong to the resume upload feature; use bucket restrictions too if supported by the live platform.
- Database user deletion does not itself delete storage bytes; object cleanup must be explicitly implemented with any future account-deletion flow.

## How to build it

1. Reinspect live schema and storage, load any available InsForge skills, and fetch current database/storage documentation. Check exact roles, auth.uid() support, grants, and storage policy mechanisms before writing SQL. Do not scaffold or reinitialize the existing app.
2. Add a versioned migration for tables, constraints, indexes, updated_at behavior, and RLS with explicit grants. Keep credentials out of files.
3. Apply the migration to the connected backend in a transaction; record migration application and verify introspected schema against the intended design.
4. Provision the private resumes bucket and owner policies using the supported platform mechanisms. If owner isolation cannot be verified, leave Feature 04 incomplete and report the exact limitation.
5. Add shared TypeScript row and nested JSON types aligned with SQL, without implementing future UI or application mutations.
6. Run the checks below, then reconcile architecture/build-plan schema descriptions and progress notes. Record that this feature adds no UI; leave existing wizard PostHog setup intact.

## Verification

- Inspect all four tables, foreign keys, indexes, grants, and RLS policies after migration.
- Using two controlled authenticated identities and an anonymous client, prove own-row CRUD works and cross-user select/insert/update/delete does not. Include changing ownership and attaching another user's run/job. Use ephemeral test fixtures and clean them up without touching real users' data.
- Confirm incomplete profile saves are allowed, duplicate profile IDs/jobs are rejected, bad scores/statuses/counts fail, and updated_at advances.
- Confirm a missing profile does not affect OAuth; downstream profile-required writes fail their FK constraints until a profile exists.
- Verify own PDF upload/read/overwrite/delete; deny the same operations against another user's known key and deny anonymous reads. Never publish real resume content in verification output.
- A privileged SQL connection alone does not prove RLS. If suitable user sessions are unavailable, report policy verification pending instead of claiming full isolation verified.
- Run TypeScript/lint/build if application type files change. Keep the known Next.js security advisory separate from this feature's acceptance.

## Assumptions

- The user approved the complete plan, including first-save profile creation and the exclusion of tailoring/URL import fields.
- Existing auth.users IDs are UUIDs and the live backend supports the required PostgreSQL constraints; confirm during implementation.
- Full profile completion rules will be settled with profile save logic. This feature supplies storage and defaults without inventing mandatory onboarding fields.
- No changes to authentication, PostHog, visual styles, or existing application data are part of Feature 04.
