# Feature 07 — Resume profile extraction

Status: implementation authorized by the user, 2026-10-31.

Extract from Resume appears for an existing saved PDF. A selected replacement must be saved or cancelled before extraction, making the source unambiguous. Extraction reads only the authenticated owner's canonical private PDF, parses text server-side, and calls GPT-4o using the existing server-only OPENAI_API_KEY. Keep JSON mode per project guidance and validate the entire model output before displaying it. No automatic profile or storage writes.

Populate a reviewable local form draft with recognized nonempty values. Preserve existing/unsaved values when information is absent; keep account email unchanged. Skills/industries merge and deduplicate. Extracted work roles replace the work section only when present, limited to three most recent roles. Education merges by known subfields. Explain that recognized fields can replace current entries before the user explicitly clicks Extract from Resume. Allow Undo extraction until the next form save/change of extraction. A successful extraction does not change saved completion until Save Profile.

Use POST /api/resume/extract for authenticated request orchestration, agent/resume-extractor.ts for parsing/model work, lib/openai.ts for client initialization and lib/profile-extraction.ts for pure validation/merge helpers. Preserve current profile saving and independent Save Resume. Reject unsupported/corrupt/encrypted/image-only PDFs with clear errors; no OCR. Bound PDF size/page count/text length/model duration/output. Reject stale saved-profile versions and disable conflicting editing/saving while extraction runs. Do not log resume content or provider error payloads. Log generic agent failures scoped to the owning profile.

Install only the already-approved openai and pdf-parse packages. Read their current APIs; installed pdf-parse supersedes the older default-import example in library-docs. Verify pure helpers, auth/ownership/errors, actual parser extraction, model output validation, save regressions, TypeScript/lint/build and a synthetic live model extraction where available. Document any browser/live gaps. No migrations, AI PDF generation or other-feature work.

## Approved provider change — Gemini

The user replaced provider configuration with GEMINI_API_KEY and requested Gemini calls. Use lib/gemini.ts and Google's compatibility endpoint with gemini-3.8-flash, reasoning_effort low and max_tokens 3000. Existing parser, validated merge, protected fields and explicit Save Profile remain unchanged. Google identified 2.5 Flash as unavailable to new users. Live generation currently returns 503 UNAVAILABLE; see verification notes.
