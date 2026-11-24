# Feature 08 verification

Verified 2026-10-31 Australia/Perth.

## Local checks

npm run test:generation passed 60 checks covering bounded model output, sparse profiles, malformed/refused/truncated replies, quota and overload, origin/auth/version gates, owner scoping, failure before replacement, backup/restoration/cleanup, recovery disclosure and actual PDF rendering. The real PDF contains saved names with Latin accents, email, employer, dates, skills and education, and has exactly one page. Excessive content fails instead of clipping. Desired roles are not printed as current roles.

48 profile validation/save/recovery/download checks and 47 extraction/parser/merge/ownership checks passed. TypeScript, lint and production build passed. The first build stopped at the existing Next.js 16.4.0 security reminder; the repeated build succeeded. Upgrade remains recommended and was not performed.

## Live checks

npm run test:generation:live passed the same 60 checks with real Gemini content from a synthetic profile and real PDF rendering. No actual user resume or profile was used.

scripts/check-generation-live.mjs passed 15 authenticated production HTTP/SDK checks. Covered anonymous/cross-origin denial, foreign-owner selection denial, stale versions, actual Gemini generation, replacing a baseline PDF in private InsForge storage, new timestamps, unchanged profile content/completion, authenticated download and parsed one-page content, foreign storage denial and profile reload.

scripts/check-generation-browser.mjs passed against production at localhost:3108 in a separate headless Chrome profile. Clicked Generate Resume, observed loading and disabled Profile Save, verified success and file metadata, preserved an unsaved name edit, then saved that edit successfully using the returned timestamp. Desktop/mobile layouts had no horizontal overflow; no runtime exceptions. Screenshots .next/generation-desktop.png and .next/generation-mobile.png were inspected. The first two harness attempts selected navbar Sign Out instead of Profile Save; recover diagnosed the selector, which was scoped to form.app-card. No app change was needed for that harness error.

scripts/check-resume-refresh.mjs verified refresh-token-only requests to generation and extraction. Both renewed the missing access cookie and reached their authenticated version checks, rather than falsely returning 401. No model call in this check.

## Cleanup and reruns

Two marked temporary accounts were provisioned without email or admin privileges and deleted after verification. Their objects were removed and storage query confirmed no fixture PDFs before account deletion. The ignored .env.schema-fixtures.json credential file and temporary Chrome profile were removed. Test server and headless browser were stopped. No real sessions, profiles or resumes were modified.

Live HTTP/browser/refresh harnesses require fresh disposable identities prepared under the existing database verification procedure, normal user sessions, a production server on port 3108, and a separate Chrome debugging port 9223 for browser checks. Never reuse real accounts. Always remove storage bytes before deleting fixture users, verify cleanup, and remove local fixture credentials. Browser and HTTP harnesses are opt-in and are not build hooks.
