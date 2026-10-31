# Review: existing wizard setup and browser event tracking

Date: 2026-10-27 (Australia/Perth)

Benchmark: user requested useful events in the current application and confirmed PostHog was already initialized with its wizard. Preserve that initialization. Scope is browser CTA/auth tracking, not future job workflows or server analytics.

## Layer 1: Plan alignment — issues found

- Important: progress-tracker.md still presents PostHog initialization as entirely unstarted and the next task, despite the wizard integration already existing. The later note acknowledges browser setup but the main status remains stale. Do not run initialization again. Full server product-event capture is a separate pending part of the older build plan.
- Existing initialization was reused; navbar tracking extends the existing landing_cta_clicked contract. No duplicate initializer was added. Job-search/profile/research events cannot yet be exercised because those flows are unbuilt.

## Layer 2: System integrity — issues found

- Minor: components/auth/LoginForm.tsx exports LoginForm, PostHogIdentity, and PostHogSignOutButton, contrary to the project's one-component-per-file convention. This predates the latest change.
- Minor: context/code-standards.md still lists NEXT_PUBLIC_POSTHOG_KEY, while the wizard and .env.example use NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN. library-docs.md explains the legacy examples, but the standards table remains inconsistent.
- Existing token classes and appearance are retained. No database access was added to UI components.

## Layer 3: Production readiness — issues found

- Important: PostHogSignOutButton resets identity immediately on click, before actions/auth.ts confirms sign-out. If the server action fails, the session stays authenticated while analytics has become anonymous; the identification effect does not rerun automatically for unchanged props. The event is documented as intent, but the identity mismatch remains.
- Important verification gap: live browser delivery and ingestion into the intended PostHog project have not been demonstrated. Static checks cannot prove capture, ingestion, or cross-navigation identity behavior.
- Existing dependency advisory: Next.js 16.4.0 reports a known security vulnerability during build. No dependency upgrade performed.

## Validation and outcome

Prior turn: lint passed; production build and TypeScript passed on retry after Next.js's security reminder. No code changes since those checks. Review is static; no live PostHog data was queried and no synthetic events were injected.

Five findings across three layers, plus the existing dependency advisory. No fixes applied during review. Developer decides what to address.
