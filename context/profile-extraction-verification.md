# Feature 07 verification — 2026-10-31

## Implemented

- Extract from Resume appears for the saved PDF. A selected replacement must be saved or cancelled first. The UI states that resume text goes to OpenAI and recognized values can replace current fields.
- POST /api/resume/extract validates same-origin requests, authenticated ownership and saved-profile version. It reads only the session-derived canonical private PDF; client-supplied IDs/keys are ignored.
- agent/resume-extractor.ts parses the PDF with pdf-parse 2.4.5 and calls GPT-4o via openai 7.47.0 using the existing server-only key. No credential changes or migrations.
- PDFs are limited to 5 MiB, 15 pages and 40,000 text characters. Very short/image-only, corrupt and encrypted PDFs fail with readable feedback. No OCR. Model timeout is 45 seconds, no automatic retries, maximum 3,000 output tokens and store:false. The output budget overrides the old 800-token example because nested roles and the complete field object need more space.
- All returned fields pass shared profile validation. Account email, ownership, completion and storage references cannot be populated from model output. The prompt treats resume instructions as untrusted text and disallows invented facts or inferred authorization/preferences.
- Auto-fill creates a local draft. Unknown values preserve current form entries, arrays merge/deduplicate, known education subfields merge, and nonempty extracted work history replaces up to three roles. Undo restores the pre-extraction draft. Extraction does not save profile fields, completion or the PDF. Save Profile remains explicit; independent Save Resume is retained.
- Fields and conflicting actions are disabled during extraction; failures leave the draft unchanged. Failures are logged as generic owner-scoped agent_logs messages without resume contents or provider payloads.

## Checks

- 33 extraction checks passed (`npm run test:extraction`). Includes real synthetic PDF parsing with mocked model, JSON validation, unknown/protected fields, zero experience, merge/deduplication, education preservation, undo-snapshot immutability, unreadable/corrupt PDFs, truncated/malformed model output, billing error feedback, auth, foreign-key rejection, stale versions, cross-origin requests, malformed requests, no writes on successful extraction and generic failure logging.
- All 48 existing profile-save regression checks passed (`npm run test:profile`). Lint and TypeScript passed; production build passed on retry after the existing Next.js security reminder. No Next.js upgrade was performed.
- Live production testing used synthetic Jordan Example resume bytes and two generated non-admin accounts, never a real user's resume/session. Anonymous, foreign-user and stale-version requests were rejected. The existing independent Save Resume successfully created a blank draft and stored the PDF.
- Initial production parsing failed because bundling moved PDF worker resolution. Added serverExternalPackages for pdf-parse and @napi-rs/canvas following the parser's official Next.js guidance. Production parsing then reached the OpenAI request.
- The OpenAI request failed. A minimal network-enabled diagnostic reported HTTP 429 with code credit_balance_exhausted. The existing key is present but no available API balance was reported. No successful live model output, form application or model-output persistence round-trip is claimed.
- Each live attempt removed its PDF through the authenticated SDK. Admin cleanup removed only generated fixture accounts; SQL confirmed zero matching accounts, profiles and objects afterward. The ignored local credential fixture was removed and the production test server stopped.

## Remaining verification

Add API credits and rerun `npm run test:extraction:live` with the controlled fixtures documented in database-verification.md and a network-enabled production server on port 3107. The harness exercises independent resume save, extraction, unchanged saved profile and return-visit HTML. Never print fixture credentials; remove fixture users/objects afterward. Fixture PDFs are generated in scripts/fixtures/resume.mjs.

Browser auto-fill, Undo, client hydration, keyboard and responsive visual checks remain pending. Local helper tests cover merge behavior; they do not substitute for browser interaction testing. The earlier canonical-key concurrent resume-replacement limitation in Feature 06 remains unchanged.

## Sources

OpenAI JSON mode requires application validation and handling of incomplete output: [official structured output guide](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat).

The parser's class-based API and Next.js external-package setup follow its [README](https://github.com/mehmet-kozan/pdf-parse) and [troubleshooting guidance](https://github.com/mehmet-kozan/pdf-parse/blob/main/docs/troubleshooting.md).

## Current provider — Gemini follow-up, 2026-10-31

User requested Gemini after configuring GEMINI_API_KEY. Resume extraction now calls Google through lib/gemini.ts using gemini-3.8-flash and the existing SDK's compatibility interface. This supersedes earlier provider descriptions above. No new dependency or secret write. Fields/validation/review/save/Undo behavior are unchanged; UI disclosure now names Google Gemini.

37 local extraction checks and all 48 profile-save checks pass. The Gemini key successfully listed available models. An actual generation call to 2.5 Flash returned 404 with Google's recommendation to use 3.8 Flash. Current 3.8 Flash and an alternate Flash-Lite diagnostic returned 503 UNAVAILABLE due to temporary high demand, including a native-endpoint check. This is a new external availability blocker, superseding the prior OpenAI credit blocker. The app now differentiates Gemini overload and quota limits. No successful live Gemini extraction or browser auto-fill verification is claimed. Retry npm run test:gemini:live with a synthetic PDF when Google is available. No database fixtures were created during this provider-change session.

Gemini provider-change final checks: lint and production build passed; 37 extraction checks and 48 profile-save checks passed. Existing Next.js security advisory remains unresolved.

## Gemini availability fix — 2026-10-31

Reproduced the user's busy error without sending a real resume: gemini-3.8-flash timed out on a minimal native request, while gemini-3.5-flash-lite returned HTTP 200/STOP with the same key. Changed GEMINI_EXTRACTION_MODEL to gemini-3.5-flash-lite, preserving the existing API interface, key, validation, draft merge and manual-save behavior. The complete parser-to-Gemini-to-output-validation check (npm run test:gemini:live) then passed with the synthetic Jordan Example PDF, verifying extracted name/skills and absence of protected fields. No user profile, real resume or credentials were changed. Earlier provider-unavailability notes are historical; successful live synthetic extraction is now verified. Browser auto-fill/Undo remains pending.

Flash-Lite fix final validation: live synthetic extraction, 37 local extraction checks, 48 profile-save checks, lint, TypeScript and production build passed. Browser interaction remains pending. The build's preexisting Next.js security advisory remains unresolved.

## Extraction URL validation fix — 2026-10-31

The user reported the generic extraction failure after the Flash-Lite switch. The basic synthetic resume still passed, so a more realistic synthetic PDF was tested. Its Gemini response failed validation specifically on linkedin_url and portfolio_url: printed links omitted http/https. Safe diagnostics reported only the failing field names and the application's fixed validation message, never resume text or model content. This reproduces the reported error, but the user's actual PDF was not inspected.

Added a failing regression case for linkedin.com/in/... and github.com/... without protocols. validateExtraction now adds https:// to ordinary domain-based links before applying existing strict profile validation. Existing HTTP(S) links remain unchanged; javascript, data, ftp, email strings and malformed links are still rejected. No profile-save validation was loosened. Model JSON/field-validation failures now have distinct generic feedback and content-free stage logs instead of masquerading as provider request failures.

Validation: 47 extraction checks, 48 profile-save checks, lint, TypeScript and production build passed. The same detailed synthetic PDF then passed real Gemini parsing/extraction/output validation via npm run test:gemini:live -- --detailed, including URLs and work history. No real resumes, profiles or credentials were accessed/modified. The existing Next.js security advisory remains unresolved; browser verification remains pending.
