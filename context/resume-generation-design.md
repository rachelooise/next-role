# Feature 08 Resume PDF Generation

Date: 2026-10-31 Australia/Perth
Authorization: user confirmed the feature definitions and requested implementation.

Generate from the authenticated owner's saved profile, never unsaved form entries. Produce a factual professional summary and polished work bullets. Preserve names, dates, employers, skills and education from the database. Do not send contact details or job preferences to the model. Do not change profile fields or completion.

Implementation assumptions for the requested build: reuse working Gemini gemini-3.5-flash-lite and GEMINI_API_KEY instead of the older GPT-4o plan. No new credential or OpenAI service call. Render with the approved @react-pdf/renderer on the server, using embedded Noto Sans fonts. Fit one readable A4 page, retrying at 10pt if needed. Reject overflow rather than clip or silently omit sections. Require a saved name plus a title, skills or experience. Optional sections stay absent when empty.

The existing Generate Resume action discloses that it uses saved data, sends professional details to Google Gemini and replaces the active PDF. Disable it while another operation runs or a replacement is staged. POST /api/resume/generate accepts only the saved profile timestamp. Validate origin, session, body and version before model use. Check version again after generation. Upload only a validated PDF. Save only private resume references under owner and version filters. Back up existing bytes before replacement and restore on failed database update, following Feature 06 recovery. Concurrent writes to the canonical key across servers retain Feature 06's known race limitation.

Return the new timestamp and file size so local unsaved form edits survive and later saves remain current. View Resume opens the authenticated download route. Refresh sessions for all resume API paths in proxy.ts without redirecting API errors to HTML.

Steps: validate and minimize input, generate and validate bounded JSON, render and verify one page, safely persist PDF references, wire loading/success/error states, verify failure paths and real synthetic generation, update registry and progress.

Acceptance: saved facts retained; malformed, refused and truncated model responses rejected; no model call for invalid/stale/anonymous requests; failures before upload preserve current PDF; failed persistence attempts recovery; no profile content mutations; real PDF text and page count checked; existing extraction and save checks pass.
