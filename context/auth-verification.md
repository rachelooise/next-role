# Feature 02 verification

2026-10-27. Implemented against connected AP Southeast InsForge backend using `@insforge/sdk` 1.5.2. Fetched current auth docs through InsForge MCP before implementation and checked the installed SDK SSR reference.

## Verified

- Production build and lint pass.
- HTTP smoke checks: all four planned protected URL patterns redirect anonymous visitors to login; malformed and forged access tokens do not expose dashboard content; missing/error callbacks clear the PKCE cookie and return to a retry message.
- Both backend OAuth initiation calls return HTTPS provider URLs and PKCE verifiers.
- Expired access token with invalid refresh token redirects to login and clears refresh cookies. Rejected OAuth code exchange returns the retry error and clears the PKCE verifier.
- Headless Chrome: login renders at 1440×1000 and 390×844 without horizontal overflow. Both app buttons reach their respective Google/GitHub sign-in pages; PKCE cookie is httpOnly and SameSite=Lax. No browser runtime exceptions. Mobile screenshot visually inspected.
- Session-dependent rendering is behind Suspense and explicitly waits for a request (`connection()`), avoiding SDK clock reads during prerendering with Cache Components.

## Remaining verification and limitations

- Actual provider consent, successful callback, authenticated homepage CTAs, token rotation, and authenticated logout require a user-owned Google/GitHub account; these have not been exercised end to end.
- Dashboard is a minimal authenticated landing page. Profile and jobs pages remain future features; proxy already protects their URL patterns.
- Backend metadata showed an empty redirect allowlist. Adding the local callback via MCP SQL was denied; no settings were changed. Actual provider initiation and browser redirects worked for localhost. Before deployment, set `APP_URL` to the HTTPS app origin and configure its `/api/auth/callback` URL in backend auth settings.
- Installed Next.js 16.4.0 reports a known security vulnerability during build. Upgrade recommended before deployment; framework version was left unchanged in this feature.
- Existing Tailwind v4 foundation was retained. It predates this feature and differs from the Tailwind 3.4 instruction; this feature adds no styling packages or version changes.

## Repeat checks

1. Copy `.env.example` values into ignored `.env.local`, filling the selected backend's public anon key.
2. Run `npm run build`, then `npm run start` (localhost:3000).
3. Run `npm run test:auth` with network access.
4. Optional browser check: launch an isolated headless Chrome with remote debugging on port 9222, then run `node scripts/check-auth-browser.mjs`. Screenshots go into ignored `.next/`.
5. Finish each provider sign-in manually; confirm dashboard, reload persistence, homepage CTA destinations, and logout.

## Review

Plan alignment: implementation includes login, server-owned OAuth exchange, shared SSR cookies, refresh through proxy, validated current user on dashboard, sign-out, and session-aware CTAs. PostHog and database work remain in their planned phases.

System integrity: SDK calls live in auth actions/server utilities; UI uses existing surface, border, accent, and text tokens. PKCE verifier and refresh cookie stay server-owned. Callback destinations use configured `APP_URL`, never request-supplied redirects. Proxy cookie checks are optimistic; dashboard validates the user with InsForge.

Production readiness: implementation checks pass; manual provider roundtrip and the framework security upgrade remain release gates.
