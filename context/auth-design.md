# Feature 02: Authentication

Approved scope: Google and GitHub OAuth, callback handling, shared browser/server sessions, logout, protected app routes, and session-aware homepage actions.

Backend: connected MCP project at https://7uzyg528.ap-southeast.insforge.app (user selected on 2026-10-27). Credentials stay in ignored `.env.local`.

Use the installed SDK's `@insforge/sdk/ssr` helpers. Auth mutations run on the server; the PKCE verifier and refresh token use httpOnly cookies. Finish OAuth at `/api/auth/callback` and redirect to `/dashboard`. Use a fixed configured `APP_URL`, never an untrusted request host, to construct callback destinations.

Next.js 16 uses `proxy.ts` for session refresh and optimistic route protection. Server rendering validates the current user with InsForge; cookie presence alone never authorizes data access. Session-dependent UI sits behind Suspense because Cache Components is enabled.

Provide a minimal authenticated dashboard destination for testing login and logout; the complete dashboard remains Feature 14. Other protected route UIs remain in their planned phases. PostHog remains Feature 03; no database writes before Feature 04.

Verify build/lint, unauthenticated redirects, malformed/forged cookies, callback failures, provider initiation, refresh cookie behavior, and logout. Full provider login requires a human-owned provider account.
