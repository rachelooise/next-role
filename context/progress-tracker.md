# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 5, Dashboard
**Session status (2026-11-24):** Feature 17 charts are implemented but show “Analytics unavailable” in the authenticated dashboard. Direct PostHog queries using a synthetic user ID returned HTTP 200; the app-side cause is still unknown. Safe server-side diagnostics were added, and a dashboard reload is needed to capture the failure. Do not mark Feature 17 complete until the charts and user isolation are verified. A later user screenshot showed a successfully saved VGW research result. A previously queued research attempt expired while the local Trigger.dev worker was stopped; restarting it required bypassing the CLI version-range check even though installed packages matched 4.8.3. Worker readiness and hosted deployment remain unverified. The production build, scoped lint and TypeScript passed for Feature 17; the existing Next.js security advisory remains open.
**Last implemented:** 16 Recent Activity — Real Data (2026-11-23). The newest five completed searches and saved company research events now load through owner-filtered SDK queries, merge by completion/research timestamps and render with green/blue dots and relative times. Preserves the dashboard layout, adds distinct empty/error states, and labels only charts as sample data. Production build, TypeScript, scoped lint, local render/loader checks and 27 live SDK/HTTP checks passed. Temporary accounts and records were removed. Next planned: Feature 17 Analytics Charts — PostHog Data. See context/dashboard-activity-verification.md. Feature 15 remains complete.
**In progress:** Feature 13 Company Research Agent is implemented with Gemini, verified website evidence, a Trigger.dev background task, durable status and a responsive dossier card grid matching the user's reference. Local credentials are configured and the development worker is registered and running. One user-triggered live run succeeded and the user confirmed the result; another company's synthesis failure was reproduced as Gemini HTTP 503. Added one synthesis-only retry after two seconds for HTTP 503, safe failure diagnostics and visible manual status-check feedback. Latest validation: 101 research checks, 20 hydrated mock-API browser checks, native worker registration, scoped lint, TypeScript and production build passed; desktop/mobile previews inspected. Earlier 33 job-details checks and 105 discovery regressions passed. Post-fix live retry recovery, the remaining live acceptance scenarios and hosted worker deployment remain pending. See company-research-design.md, company-research-setup.md and company-research-verification.md. Feature 11 remains reverted and pending. Inherited OAuth, extraction browser and independent analytics checks remain open.

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage UI (session aware navigation deferred to 02 Auth)
- [x] 02 Auth (implementation verified; full provider consent roundtrip pending)
- [ ] 03 PostHog Initialization (wizard browser setup exists; planned server product-event client and live ingestion verification pending)
- [x] 04 Database Schema (live SDK/API access checks, lint, and production build passed)

### Phase 2 — Profile Page

- [x] 05 Profile Page — Full UI (local preview; authenticated visual verification pending)
- [x] 06 Profile Save Logic (41 local and 22 live checks; browser interactions and concurrent-storage limitations documented)
- [x] 07 AI Profile Extraction from Resume (implementation complete; 47 extraction checks, 48 save checks and live detailed Flash-Lite synthetic extraction passed; session refresh fixed/live verified in 08; browser auto-fill/Undo verification remains a follow-up)
- [x] 08 Resume PDF Generation from Profile (local, live authenticated and browser checks passed; inherited storage concurrency limit documented)

### Phase 3 — Find Jobs Page

- [x] 09 Find Jobs Page — Full UI (sample data; authenticated visual verification pending)
- [x] 10 Adzuna Job Discovery (105 local checks, 23 live authenticated checks, live browser search/reload and desktop/mobile screenshots; Gemini matching, country dropdown, owner deduplication and partial results)
- [ ] 11 Filter + Sort + Pagination

### Phase 4 — Job Details Page

- [x] 12 Job Details Page — Full UI (reference UI implemented; local checks and build passed; authenticated live verification pending)
- [ ] 13 Company Research Agent (implemented; local Trigger.dev setup and one live run verified; reference card layout and bounded 503 retry added; remaining live acceptance checks and hosted deployment pending)

### Phase 5 — Dashboard

- [x] 14 Dashboard Page — Full UI (dashboard.png mock UI, owner-scoped profile banner, responsive SVG charts; production build, scoped lint, render checks and 1440px/390px static browser checks passed; authenticated profile-banner verification remains pending)
- [x] 15 Stats Bar — Real Data (authenticated aggregate over all saved jobs, rolling 7-day count, empty/error states; local checks, build/lint and 31 live SDK/HTTP checks passed)
- [x] 16 Recent Activity — Real Data (newest five owner-scoped completed searches/research saves; empty/error handling, relative times; build, lint, local checks and 27 live SDK/HTTP checks passed)
- [ ] 17 Analytics Charts — PostHog Data (implemented; dashboard currently reports analytics unavailable; app-side cause, event ingestion and authenticated isolation verification pending)

---

## Decisions Made During Build

- 2026-11-02: Feature 10 approved through architect and implemented. Explicit US/UK/Australia/Canada dropdown defaults to US; location optional. Match up to 10 IT snippets with Gemini Flash-Lite. Saved profile requires skills plus current/desired title. Save all scored new listings; strong threshold remains 70. Skip duplicates without changing research/scores, isolate failures, and display reconciled counts. Existing local AZUNA_API_ID/AZUNA_API_KEY names are supported as aliases for documented ADZUNA_APP_ID/ADZUNA_APP_KEY. No migration. Latest 20 saved jobs load on the server; current local controls apply to that window until Feature 11. See job-discovery-design.md and job-discovery-verification.md. Existing uncommitted work is preserved.

- 2026-10-31: Feature 04 plan approved and implemented. First-save profile creation; partial profiles allowed; no auth-trigger writes; omit URL imports, tailoring, and cover-letter tone. Use search-only jobs with per-user external ID uniqueness, ownership-safe composite links, and a private owner-only resumes bucket. Migrations are atomic DO blocks due to MCP transaction-control restrictions; ledger is in nextrole_internal. All temporary verification accounts/files/data were cleaned up. Next.js security advisory remains unresolved.

- 2026-10-27: User confirmed product branding is NextRole everywhere. Updated page metadata, visible copy, shared Brand in navbar/footer/login, internal OAuth PKCE cookie (`nextrole_oauth_verifier`), smoke checks, and context. Existing InsForge connection and user sessions are retained. Any OAuth flow started before the cookie rename must be restarted. Connected MCP has no project-display-name rename tool; hosted dashboard/provider application display names are not changed by the code rename.

_Add decisions here as they are made during implementation._

- 2026-10-31: Feature 08 implemented after user confirmed saved-profile generation, factual polishing, one active resume and one-page PDF, then requested implementation. Reuses working Gemini as a recorded build assumption. Uses @react-pdf/renderer 4.3.2 with bundled licensed fonts, strict model output validation, one-page verification and Feature 06 backup/recovery semantics. 60 local generation checks, 15 live HTTP/SDK checks and authenticated browser generation/edit-preservation/subsequent-save checks passed; existing 48 profile and 47 extraction checks, lint, TypeScript and production build passed. Resume API session refresh is fixed and live verified for generation/extraction. Temporary users, profile/log rows, storage files, local credentials and browser state were cleaned up. See resume-generation-design.md, resume-generation-verification.md and resume-generation-review.md. Concurrent canonical object writes and the existing Next.js advisory remain documented limitations.

---

## Notes

- 2026-11-16: Matched the additional research reference: Company Overview now uses a light rounded bordered card with a purple compass icon, and Tech Stack uses wrapping soft-purple pills with code icons. Updated UI registry through imprint. Scoped lint, production build and 20 hydrated mock-API browser checks passed; desktop preview inspected. Existing Next.js security advisory remains unresolved.

- 2026-11-16: Updated research dossier to the user's supplied card reference: Culture/Your Edge and Gaps/Smart Questions in paired columns, Interview Prep below, light rounded panels, colored line icons and purple bullets; mobile stacks all panels. Updated imprint and design. Production build, scoped lint and 20 hydrated mock-API browser checks passed; desktop/mobile previews inspected. Existing Next.js security advisory remains unresolved.

- 2026-11-16: After one successful live worker run, reproduced another company's synthesis failure as Gemini HTTP 503 using its valid saved inputs. User approved one synthesis-only retry after two seconds for HTTP 503 and safe failure stage/category logging. Passed 101 research checks; full task retries remain disabled, and persistent provider outages can still fail research.

- 2026-11-16: Fixed silent manual research status checks: show checking feedback and the successful check time even when status is unchanged, with explicit Retry research guidance for failed runs. Passed 20 hydrated browser checks against a mock API and scoped ESLint. This verifies status feedback, not successful live research; the prior live run failed, provider extraction returned HTTP 503, and a separate synthetic Gemini synthesis succeeded.

- 2026-11-16: Fixed Trigger CLI configuration loading by using a namespace import for @next/env. User supplied local credentials; corrected INFORGE_API_KEY to INSFORGE_API_KEY without exposing its value. Setup validation passed, a read-only worker database check succeeded, and nextrole-company-research registered in the development worker. Subsequent live success and provider failures are recorded above. Hosted deployment remains pending.

- 2026-10-31: Find Jobs location is optional at the user's request. Removed native required validation and labeled the field Location (optional). Job title remains required; discovery still uses the existing sample preview.

- 2026-10-31: Fixed generated PDF contact-header overlap by setting explicit name/title line heights and vertical spacing. Work dates now display named months, e.g. June 2020 - Sept 2023, and remain right aligned in a 145pt column. Latest 59 local generation checks, TypeScript and scoped lint passed; a synthetic rendered PDF confirmed header separation, exact date format and long-title wrapping. Existing PDFs require regeneration to use the updated template. Live model/storage/browser checks were performed before these final template refinements, not repeated afterward.

- 2026-10-31: Aligned generated resume work-experience dates to the right edge beside the role/company heading, per user screenshot. Long role headings wrap in the left column. Regenerate the resume to apply the updated PDF template to an existing saved file.

- 2026-10-31: Built `/profile` and `/find-jobs` to remove missing navigation destinations, following the existing reference images and UI-first build plan. Profile includes five editable sections, removable tags, three-role limit, and PDF selection/drop validation. Jobs includes eight clearly labeled samples, local text/match filtering, sorting, six-row preview pagination, and empty states. Save, generation, upload, and discovery explicitly disclose that backend operations are not connected; Features 06–08 and 10–11 remain pending. Both routes use existing server authentication and Suspense; active navigation uses the accent token. Lint and TypeScript passed; anonymous route smoke checks returned 307 to login. Authenticated browser interaction and screenshot verification have not been performed. The installed Next.js version still reports its pre-existing security advisory.

- 2026-10-27: Extended existing PostHog browser tracking to the navbar Start for free CTA. `landing_cta_clicked` includes cta_label, destination, and placement (hero/call_to_action/navbar); `oauth_sign_in_started` includes provider; `user_signed_out` records intent. Navigation events use immediate sendBeacon transport. Browser initialization already exists in instrumentation-client.ts with NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN and NEXT_PUBLIC_POSTHOG_HOST. Full feature 03 server capture remains pending; live ingestion has not been verified.

- Homepage built with the supplied NextRole branding and all five public image assets. See `context/homepage-design.md`. Feature 02 adds login and a minimal authenticated dashboard; jobs, profile, privacy, and terms content remain pending. Homepage CTAs now use the validated session. The installed Next.js 16.4.0 emits a security upgrade advisory. Build succeeds after its reminder.
- Homepage primary and secondary CTAs now follow the button styles in `ui-rules.md`, using the project’s accent/surface tokens with explicit padding, rounded corners, and typography. The navbar primary CTA uses the same primary button styling.

 - Styling foundation configured: `app/globals.css` contains the complete `ui-tokens.md` theme and token-based page defaults. Root layout loads Inter via `next/font/google`. Existing Tailwind v4 Turbopack integration retained. Feature 01 is complete; see the current status above.

_Add notes here as the build progresses — workarounds, patterns, anything that differs from the context files._

- Feature 02: user selected the connected AP Southeast InsForge backend. Added SDK 1.5.2, server-owned PKCE OAuth, callback at `/api/auth/callback`, proxy refresh/protection, current-user validation, logout, session-aware homepage CTAs, and a minimal dashboard destination. No profile/database writes or PostHog setup in this feature. See `context/auth-design.md` and `context/auth-verification.md`.
- Login browser checks passed at desktop/mobile sizes; Google and GitHub buttons reached provider sign-in pages. Finish provider consent manually to verify the success callback, authenticated CTAs, persistence/rotation, and logout. Backend redirect update via SQL was denied; localhost initiation nevertheless works. Configure production callback allowlist before deployment.

- 2026-10-31: User requested strict ui-rules.md alignment for Profile and Find Jobs. Corrected page widths/padding, header geometry, 16px white cards with exact shadow, heading/body/muted typography, pill tags, input focus rings, and 4px match meters. Existing local preview interactions retained. Browser visual verification remains pending.

- 2026-10-31: Added the requested Connected Accounts card above Resume on Profile, with LinkedIn identity, Not connected status, and Connect LinkedIn action. Uses existing UI rules and LinkedIn color tokens. This is UI only: LinkedIn OAuth is not configured; the button gives honest coming-soon feedback.

- 2026-10-31: Corrected the profile completion ring: 70% now renders a 70% SVG arc with a visible remaining track instead of a full circular border. User requested orange for both the progress arc and missing-field pills; applied warning tokens with darker orange label text. The value remains a UI fixture until profile persistence/completion logic is implemented.

- 2026-10-31: Refined profile attention card to the latest user screenshot: compact layout, orange attention icon, solid orange rectangular field labels, and smaller purple 70% ring over neutral track. Extracted ProfileAttention component; existing completion semantics retained.

- 2026-10-31: Feature 06 implemented under context/profile-save-design.md. Profiles save only on explicit submission; authenticated owner/email are server-derived. Completion uses ten equal requirements: full name, account email, location, work authorization, current title, experience level, years (zero valid), skills, desired titles and remote preference. Phone, URLs, education, work history and PDF are optional. PDF selection uploads on Save Profile; cancelling selection preserves the saved resume. Private Open Resume, stale-form checks and best-effort upload recovery are implemented. 41 local and 22 live authenticated HTTP/SDK checks passed; fixture accounts/data/objects were cleaned up. See profile-save-verification.md and profile-save-review.md for evidence and remaining browser/concurrency limits. Analytics delivery and AI operations remain later work.

- 2026-10-31: Corrected ProfileAttention status icon: completed profiles show a green checkmark; incomplete profiles retain the orange exclamation icon.

- 2026-10-31: Added Save Resume within the resume section at the user's request. A dedicated authenticated action saves only PDF references on an existing profile, preserving saved profile fields/completion and local unsaved edits. First-time resume saves create the required blank profile container with account email. The returned timestamp keeps subsequent Save Profile submissions current. Original Save Profile can still upload a staged PDF. 48 local checks, TypeScript and lint passed; live/browser verification of this additional button has not been performed.

- 2026-10-31: Feature 07 code implemented: saved private PDF extraction, GPT-4o JSON validation, local field merge/review and Undo. Reused the existing OPENAI_API_KEY without displaying/changing it. Installed exact openai 7.47.0 and pdf-parse 2.4.5; parser packages externalized per official Next.js guidance. 33 extraction checks and 48 profile-save checks plus lint/TypeScript passed. Live production parsing reached OpenAI, but successful model verification is blocked by 429 credit_balance_exhausted. All temporary fixture accounts/profiles/files were cleaned up. Feature remains unchecked pending successful live verification and browser auto-fill checks. See profile-extraction-design.md, profile-extraction-verification.md and profile-extraction-review.md.

- 2026-10-31: Switched Feature 07 extraction to Google Gemini on explicit user request. Reused GEMINI_API_KEY and installed SDK; UI disclosure names Gemini. Key/model listing verified. Use gemini-3.8-flash because Google rejects 2.5 Flash for new users. Live generation currently returns 503 UNAVAILABLE; app has distinct overload/quota feedback. 37 extraction checks and 48 save regression checks passed. Retry test:gemini:live when the external service recovers; no database/secret changes were made.

- Gemini provider-change final validation: lint, TypeScript and production build passed; existing Next.js security advisory remains unresolved. Live generation remains subject to Google's temporary 503 availability blocker.

- 2026-10-31: Fixed the reported Gemini busy failure by using the responsive gemini-3.5-flash-lite model. Real synthetic PDF extraction and validation passed with the existing Gemini key; no real resume or profile data was used. The previous 3.8 model timed out in the same diagnostic. Existing form review/manual-save behavior is preserved.

- Flash-Lite availability fix: live synthetic extraction, 85 local checks, lint/TypeScript and production build passed; the preexisting Next.js security advisory remains unresolved.

- 2026-10-31: Reproduced the generic extraction error on a realistic synthetic PDF: Gemini returned protocol-free LinkedIn/GitHub links and strict profile validation rejected them. Added extraction-only HTTPS normalization for ordinary website links; unsafe schemes remain rejected. Model-format failures now have separate readable feedback and safe stage logs. 47 extraction checks, 48 profile-save checks, live detailed synthetic extraction, lint/TypeScript and production build passed. The user's actual resume was not inspected.

- 2026-10-31: Updated resume card per user request: View Resume (renamed from Open Resume) and purple Extract from Resume now sit at the bottom right below the generation row. Successful extraction is green and reads Profile fields filled in. Review and save below. Error styles and save behavior are retained. Scoped ESLint and TypeScript checks passed.

- 2026-10-31: Followed annotated resume screenshot: moved extraction feedback into the Resume card above the divider, removed the crossed-out generic processing helper, and retained the requested green success copy. Scoped lint and TypeScript passed.

- 2026-10-31: Redesigned Resume to the latest reference: compact saved-file row with View Resume/Replace, separate Extract to Profile row, green success banner with inline Undo, and outlined generation footer. Empty and replacement states retain independent Save Resume. Newly saved uploads show actual session filename/size; older saved files use generic metadata because the original filename was not persisted. Static desktop and mobile-content previews, scoped lint, TypeScript and production build passed. Authenticated browser interaction remains unverified; the existing Next.js security advisory remains unresolved.

- 2026-10-31: Corrected Resume typography to ui-rules.md after user feedback: 16px section headings, 14px primary text and 12px muted supporting text. Restored standard 24px card padding and section gaps while preserving the redesigned layout. Scoped ESLint and TypeScript passed.

- 2026-10-31: Refined Resume sizing to match adjacent controls: removed custom button height/padding overrides and reduced extraction/generation subsection labels to 14px medium. Scoped ESLint and TypeScript passed.

- 2026-10-31: Added a light grey semantic surface background to read-only ProfileField inputs so the account email is visually distinct from editable fields. Scoped ESLint passed.

- 2026-10-31: Session wrap-up: user accepted the revised Resume layout, standard button sizing, 14px subsection labels and light grey read-only email field. Review found extraction requests bypass session refresh because proxy.ts does not match /api/resume/extract; getAuthUser returns null when the access cookie is absent/expired. Refreshing /profile renews the session, consistent with the reported behavior. This is a code-path finding, not a reproduced browser session; no auth fix was applied. Prior scoped lint/TypeScript passed.

- 2026-11-05: Feature 12 implemented from designs/job-details.png. Added authenticated /find-jobs/[id], owner scoped single job loader, missing/error states, reference summary and info cards, saved match reasoning/skills/description, company research placeholder and external apply actions. Saved job title links open details and nested Find Jobs navigation remains active. Feature 11 remains reverted and pending. Passed 31 local data/render/ownership/error checks, 105 discovery regressions, scoped lint and production build. Static desktop/mobile rendering checked separately; authenticated live database/browser interaction remains unverified. Research execution belongs to Feature 13. No migration, provider calls or dependency changes.

## Feature 12 verification, 2026-11-05

The page uses existing saved jobs and the supplied job-details.png layout. 31 local data, render, owner-filter and error checks passed in node scripts/check-job-details.mjs. All 105 discovery regression checks passed. Scoped ESLint and the production build passed, including TypeScript. Synthetic static desktop rendering was inspected at 1440px. Chrome mobile emulation confirmed innerWidth and document scrollWidth are both 390px, and the mobile screenshot was inspected. Preview artifacts live in ignored .next/job-details-desktop.png and .next/job-details-mobile.png.

These visual checks render the actual components with synthetic data and compiled application CSS. They do not prove authenticated database reads or hydrated browser interactions. Verify a real saved job, missing/foreign job, original job post and Apply links, Back to Jobs, and the research placeholder feedback in an authenticated session. No real user data was changed. Feature 11 remains reverted. The previously documented Next.js advisory remains unresolved.

- 2026-11-05: Reviewed the reported mid-sentence job description. JobDescription has no line clamp, height cap or text slicing; discovery persists the Adzuna search snippet as about_role. Official Adzuna search docs confirm responses contain only a description snippet (https://developer.adzuna.com/docs/search). Added an explicit preview notice and Read full job description action inside the card, using the saved original post URL in a safe new tab. Saved longer descriptions still render completely. 33 local job details checks passed, including a long description through its final sentence. No scraping, generated continuation, provider or database changes.
