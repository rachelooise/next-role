# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 1, Foundation
**Last completed:** 04 Database Schema. Both migrations and the private resumes bucket are applied; 107 live two-user/anonymous SDK/API checks, lint, and production build passed. See database-verification.md.
**Next:** 05 Profile Page UI. Existing OAuth consent and live PostHog ingestion verification remain open; preserve the wizard's existing PostHog initialization. Feature 03's planned server product-event client remains pending.

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage UI (session aware navigation deferred to 02 Auth)
- [x] 02 Auth (implementation verified; full provider consent roundtrip pending)
- [ ] 03 PostHog Initialization (wizard browser setup exists; planned server product-event client and live ingestion verification pending)
- [x] 04 Database Schema (live SDK/API access checks, lint, and production build passed)

### Phase 2 — Profile Page

- [ ] 05 Profile Page — Full UI
- [ ] 06 Profile Save Logic
- [ ] 07 AI Profile Extraction from Resume
- [ ] 08 Resume PDF Generation from Profile

### Phase 3 — Find Jobs Page

- [ ] 09 Find Jobs Page — Full UI
- [ ] 10 Adzuna Job Discovery
- [ ] 11 Filter + Sort + Pagination

### Phase 4 — Job Details Page

- [ ] 12 Job Details Page — Full UI
- [ ] 13 Company Research Agent

### Phase 5 — Dashboard

- [ ] 14 Dashboard Page — Full UI
- [ ] 15 Stats Bar — Real Data
- [ ] 16 Recent Activity — Real Data
- [ ] 17 Analytics Charts — PostHog Data

---

## Decisions Made During Build

- 2026-10-31: Feature 04 plan approved and implemented. First-save profile creation; partial profiles allowed; no auth-trigger writes; omit URL imports, tailoring, and cover-letter tone. Use search-only jobs with per-user external ID uniqueness, ownership-safe composite links, and a private owner-only resumes bucket. Migrations are atomic DO blocks due to MCP transaction-control restrictions; ledger is in nextrole_internal. All temporary verification accounts/files/data were cleaned up. Next.js security advisory remains unresolved.

- 2026-10-27: User confirmed product branding is NextRole everywhere. Updated page metadata, visible copy, shared Brand in navbar/footer/login, internal OAuth PKCE cookie (`nextrole_oauth_verifier`), smoke checks, and context. Existing InsForge connection and user sessions are retained. Any OAuth flow started before the cookie rename must be restarted. Connected MCP has no project-display-name rename tool; hosted dashboard/provider application display names are not changed by the code rename.

_Add decisions here as they are made during implementation._

---

## Notes

- 2026-10-27: Extended existing PostHog browser tracking to the navbar Start for free CTA. `landing_cta_clicked` includes cta_label, destination, and placement (hero/call_to_action/navbar); `oauth_sign_in_started` includes provider; `user_signed_out` records intent. Navigation events use immediate sendBeacon transport. Browser initialization already exists in instrumentation-client.ts with NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN and NEXT_PUBLIC_POSTHOG_HOST. Full feature 03 server capture remains pending; live ingestion has not been verified.

- Homepage built with the supplied NextRole branding and all five public image assets. See `context/homepage-design.md`. Feature 02 adds login and a minimal authenticated dashboard; jobs, profile, privacy, and terms content remain pending. Homepage CTAs now use the validated session. The installed Next.js 16.4.0 emits a security upgrade advisory. Build succeeds after its reminder.
- Homepage primary and secondary CTAs now follow the button styles in `ui-rules.md`, using the project’s accent/surface tokens with explicit padding, rounded corners, and typography. The navbar primary CTA uses the same primary button styling.

 - Styling foundation configured: `app/globals.css` contains the complete `ui-tokens.md` theme and token-based page defaults. Root layout loads Inter via `next/font/google`. Existing Tailwind v4 Turbopack integration retained. Feature 01 is complete; see the current status above.

_Add notes here as the build progresses — workarounds, patterns, anything that differs from the context files._

- Feature 02: user selected the connected AP Southeast InsForge backend. Added SDK 1.5.2, server-owned PKCE OAuth, callback at `/api/auth/callback`, proxy refresh/protection, current-user validation, logout, session-aware homepage CTAs, and a minimal dashboard destination. No profile/database writes or PostHog setup in this feature. See `context/auth-design.md` and `context/auth-verification.md`.
- Login browser checks passed at desktop/mobile sizes; Google and GitHub buttons reached provider sign-in pages. Finish provider consent manually to verify the success callback, authenticated CTAs, persistence/rotation, and logout. Backend redirect update via SQL was denied; localhost initiation nevertheless works. Configure production callback allowlist before deployment.
