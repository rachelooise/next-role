# Memory — NextRole auth and branding

Last updated: 2026-10-27 Australia/Perth

## What was built

Feature 02 auth implementation: login at `app/(auth)/login/page.tsx`, server actions in `actions/auth.ts`, callback at `app/api/auth/callback/route.ts`, `proxy.ts`, server auth utilities in `lib/`, and minimal authenticated dashboard. Homepage CTAs now recognize the validated session.

Renamed app branding and internal auth naming to NextRole. Shared `components/layout/Brand.tsx` is used by navbar, footer, and login. `/imprint` updated `context/ui-registry.md`, including typography, spacing, focus states, and removal of stale full-logo instructions.

Detailed implementation and verification are in `context/auth-design.md`, `context/auth-verification.md`, and `context/progress-tracker.md`.

## Decisions made

User explicitly selected the connected AP Southeast InsForge backend instead of the older EU reference. Existing connection is retained. User confirmed NextRole branding everywhere, overriding the supplied reference wordmark. Hosted InsForge project and OAuth provider application display names were not renamed; the connected MCP exposes no rename capability.

## Problems solved

Use the installed SDK's SSR helpers rather than the stale library examples. Session checks explicitly wait for a real request to prevent SDK clock reads during Next.js Cache Components prerendering. The supplied icon is reused while the NextRole wordmark is real text.

Do not place a live headless-browser profile inside `.next/`: builds clean it and can fail on locked files. Use a temporary directory outside build output. Auth smoke scripts are ES modules.

## Current state

Production build and lint pass. HTTP checks passed for anonymous route protection, malformed/forged sessions, rejected refresh, failed callbacks, and provider initiation. Desktop/mobile browser checks passed; both buttons reached provider sign-in pages, with no browser runtime exceptions. Full provider consent and successful authenticated roundtrip remain unverified.

PostHog, database schema, and full dashboard/profile/jobs pages are not built. Homepage screenshot fidelity still lacks a full comparison. The old `context/session-handoff.md` describes the pre-auth session and is historical, not current status.

Next.js 16.4.0 reports a known security vulnerability; no upgrade was performed. Existing Tailwind v4 remains despite the older 3.4 instruction. The backend rejected a redirect-allowlist SQL update; no setting changed, and localhost OAuth initiation nevertheless passed. Production callback allowlisting remains a deployment requirement.

The workspace has substantial uncommitted changes, including preexisting work. Preserve them; no commit was created. A local production server was last started on port 3000; check current availability before starting another. Test browsers were closed.

## Next session starts with

Run `/remember restore`, then follow AGENTS.md's context reading order before implementation. Complete manual Google/GitHub sign-in at localhost:3000/login and verify successful callback, dashboard, reload persistence, authenticated homepage CTA destinations, session rotation, and logout. Then proceed to Feature 03 PostHog Initialization when requested.

Repeat automated checks using `npm run lint`, `npm run build`, and `npm run test:auth` against a running app. Browser checks use `scripts/check-auth-browser.mjs` with isolated Chrome debugging on port 9222. Backend checks and font downloads may require network approval. Local configuration is in ignored `.env.local`; no credentials are stored in this memory.

## Open questions

- Complete the real provider consent and authenticated-session verification.
- Arrange the Next.js security upgrade before deployment.
- Set the production app origin and callback allowlist before deployment.
- Rename hosted project/provider display names in their management consoles if still needed.
