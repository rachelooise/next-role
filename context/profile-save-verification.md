# Feature 06 verification — 2026-10-31

## Implemented

- Server-rendered, owner-scoped profile reads, with a distinct error state for failed reads. First visits use blank fields plus trusted account email; reads do not create profiles.
- Explicit server-side saves allow partial drafts, validate nested payloads, derive owner/email from the session, and compute ten equally weighted completion requirements. Zero years counts; phone, links, work history, education and PDF are optional.
- Valid database enum values replace unsupported UI dropdown options. Tags, all optional fields, education and up to three roles round-trip through save data.
- Save stages a selected PDF locally until submission. Both browser/server enforce nonempty PDF MIME/extension, signature and 5 MiB limit. The action request limit is 6 MiB to allow multipart overhead.
- The private canonical resume key is server-derived. Ordinary saves omit storage fields, preserving the saved PDF. New uploads persist the SDK URL and key. Downloads use a same-origin authenticated route with private/no-store headers.
- Stale profile versions are rejected using updated_at comparisons and conditional writes. Pending controls prevent editing during submission; action/network errors retain the form and selected file.
- Before replacing a saved PDF, previous bytes are downloaded. Database failure attempts restoration (or deletion of a newly uploaded object). Recovery failures and interrupted operations produce explicit retry guidance.
- No migrations, dependency upgrades, AI extraction/generation, LinkedIn integration or new analytics events. Feature 03's server analytics work remains pending.

## Checks

- `npm run test:profile`: 41 checks passed against the real validation helpers/action/download handler with mocked SDK boundaries. Covers incomplete/complete profiles, zero experience, optional fields, normalization, invalid URLs/enums/numbers/dates/nested data, role limits, PDF signature/type/size, authentication, trusted ownership, stale versions, preserved resumes, upload errors, database failure and recovery failure.
- `npm run test:profile:live`: 22 checks passed against the production server on port 3106 and the connected InsForge backend, using two temporary non-admin accounts. Exercises real multipart Server Action dispatch via the installed React encoder; blank profile render; first partial save; full save; zero-year completeness; stale update rejection; invalid enum rejection; PDF upload and replacement; actual PDF response bytes; no-store; owner isolation; known foreign-key denial through the SDK; and reload HTML containing saved fields, completion and Open Resume.
- TypeScript and lint passed. Production build passed after the existing Next.js 16.4.0 security reminder. No upgrade was made; upgrading the affected Next.js version remains recommended.
- SDK networking and the production test server required network-enabled execution. The initial handmade multipart harness was replaced with React's installed encoder after diagnosis; application action dispatch uses React normally.
- Test objects were removed through authenticated SDK clients. Admin cleanup removed only the two generated fixture accounts. SQL confirmed zero matching accounts, profiles and resume objects afterward; the ignored local credential fixture file was removed.

## Remaining limitations

- No browser automation package/session was available. Real HTML, HTTP action dispatch and SDK state were verified; keyboard, drag/drop, visual layout and client hydration interactions still need browser verification.
- Storage and profile updates are not one transaction. Optimistic locking protects the profile row, but concurrent PDF replacements on multiple server instances can race at the canonical object key. Recovery is best effort; interruption can leave new bytes at the existing key. A distributed coordination/versioned storage design would be needed for stronger guarantees.
- First-ever profile_completed analytics delivery is not implemented in this feature; the planned server product-event client remains Feature 03 work. Existing auth and analytics initialization are preserved.

## Re-running live verification

This is an opt-in integration test. Follow the controlled fixture preparation and non-admin account provisioning procedure in database-verification.md using `scripts/check-database.mjs --prepare`; never print its generated credentials. Run a network-enabled production server on port 3106 after a build, then `npm run test:profile:live`. Its finally block removes fixture PDFs. Remove only the generated users via admin tooling afterward, verify fixture row/object cleanup, then run the fixture harness's --remove-local-fixtures command. Never use real user sessions.

## Resume-only save follow-up — 2026-10-31

User requested an independent Save Resume action in the resume card. This supersedes the requirement to scroll down to Save Profile for every upload. The existing combined profile/file save remains available. saveResume shares authenticated upload/recovery handling, but existing profile writes include only resume_pdf_key and resume_pdf_url; the saved completion metadata and all profile fields remain unchanged. The new timestamp is returned to the parent form so a subsequent profile save does not conflict with its own resume save. A missing profile receives a blank draft container with account email and computed incomplete status; local edits are not submitted by the resume action.

Expanded local verification: 48 checks passed, including resume-only field isolation, completion preservation, first-time draft creation, missing file rejection, anonymous denial, upload failure and updated timestamp. TypeScript/lint passed. The earlier 22 live checks cover the original combined save path; the independent button has not had a fresh browser/live run.
