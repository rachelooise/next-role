# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

2026-10-31: Feature 04 database/storage foundation adds no UI components or visual patterns. Existing UI remains unchanged. Backend row types live in types/database.ts; verification is recorded in context/database-verification.md.

Analytics update (2026-10-27): `HomepageActionLink` now also wraps the navbar Start for free CTA with label `start_for_free` and placement `navbar`. Existing classes and appearance retained. CTA, OAuth-start, and sign-out events use immediate sendBeacon capture before navigation.

### Brand

File: `components/layout/Brand.tsx`. Shared by navbar, footer, and login page. Product name is **NextRole**; this user instruction supersedes the original reference screenshot's wordmark.

Last updated: 2026-10-27

| Property | Class |
| --- | --- |
| Background | None; inherits the parent surface |
| Border | None |
| Border radius | `rounded-md` on the link |
| Text — primary | `text-2xl font-bold tracking-tight text-text-darkest` |
| Text — secondary | None |
| Spacing | `gap-2` between icon and wordmark |
| Hover state | No explicit hover class |
| Focus | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent` |
| Shadow | No CSS shadow; supplied icon artwork includes its own shadow |
| Accent usage | Purple icon artwork; `focus-visible:outline-accent` |

**Pattern notes:** Brand owns the accessible `NextRole home` link. The icon is decorative (`aria-hidden`, empty image alt). The original image text is cropped out; the wordmark is real text. Do not display the original full logo bitmap in new components. Navbar, footer, and login must reuse Brand instead of duplicating the wordmark. Layout and icon dimensions remain component implementation details, not global design rules.

Global styling foundation: `app/globals.css` defines the project theme with Tailwind v4 `@theme`. Base styles use `--color-background`, `--color-text-primary`, `--color-border`, and `--font-sans`. `app/layout.tsx` loads Inter with the `--font-sans` variable; root classes are `${inter.variable} h-full antialiased`, and body classes are `min-h-full flex flex-col`.

## Homepage components

Design source: `context/designs/landing-page.png`. Composition notes: `context/homepage-design.md`.

- `Navbar`, `components/layout/Navbar.tsx`: `landing-frame mx-auto flex min-h-20 flex-wrap items-center justify-between gap-3 py-4 sm:py-0`. Logo uses the shared `Brand` component. Navigation uses `landing-link`; primary CTA uses `inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark`.
- `Footer`, `components/layout/Footer.tsx` (reuses shared `Brand`): `landing-frame mx-auto flex min-h-[132px] flex-col items-center justify-between gap-6 border-x border-t border-border px-8 py-10 sm:flex-row`.
- `HomepageActions`, `components/homepage/HomepageActions.tsx`: `flex flex-wrap items-center justify-center gap-4`. Primary link uses `inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark`; secondary uses `inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary`.
- `Hero`, `components/homepage/Hero.tsx`: `landing-glow flex min-h-[416px] flex-col items-center justify-center px-5 py-16 text-center`. Dashboard preview uses `h-auto w-full` and responsive image sizes.
- `Features`, `components/homepage/Features.tsx`: alternating `grid border-b border-border lg:grid-cols-2` sections. Headings use `landing-feature-heading`; rows use `landing-feature-copy` with `border-l-accent` or `border-l-success` for highlighted rows. Image panels use `bg-surface-muted`.
- `Testimonial`, `components/homepage/Testimonial.tsx`: `flex min-h-[352px] flex-col items-center justify-center px-6 py-14 text-center lg:px-32`. Semantic figure, blockquote, and figcaption with supplied portrait.
- `CallToAction`, `components/homepage/CallToAction.tsx`: `landing-glow flex min-h-[408px] flex-col items-center justify-center px-6 py-16 text-center`, reuses HomepageActions.

## Shared homepage classes

Defined in `app/globals.css` using project color tokens only:

- `landing-frame`: centered container, 1280px maximum, 20px mobile outer margins and 80px desktop outer margins.
- `landing-link`: `inline-flex min-h-11 items-center transition-colors hover:text-accent`.
- `landing-feature-heading`: `flex min-h-48 items-center border-b border-l border-border px-5 py-12 text-4xl font-semibold leading-[1.12] tracking-[-0.045em] text-text-slate lg:min-h-56 lg:text-[46px]`.
- `landing-feature-copy`: `min-h-36 border-b border-l px-6 py-7 last:border-b-0`.
- `landing-glow`: layered radial gradients derived from info and accent tokens on surface.
- `landing-stripe`: 80px decorative band with a repeating diagonal gradient using surface tokens.

Font loader uses `--font-inter`, referenced by the `--font-sans` theme token to avoid a circular font variable.

## Authentication components — 2026-10-27

Captured with `/imprint` after Feature 02. All colors use existing theme tokens.

| Component | Files | Patterns |
| --- | --- | --- |
| Login page | `app/(auth)/login/page.tsx` | Page `landing-glow` with `px-5 py-12`; card `rounded-xl border border-border bg-surface p-6 shadow-sm`; shared Brand above heading; heading `text-3xl font-semibold tracking-tight text-text-primary`; supporting text `text-sm leading-6 text-text-secondary`; home link `text-sm text-text-secondary hover:text-accent` |
| Login form | `components/auth/LoginForm.tsx` | `mt-8 flex flex-col gap-4`; provider buttons `min-h-12 rounded-md px-4 py-3 text-sm font-medium`; Google uses surface/border secondary pattern, GitHub uses accent primary pattern; focus `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`; pending `disabled:cursor-wait disabled:opacity-60` |
| Auth errors and status | `components/auth/LoginForm.tsx` | Status `min-h-5 text-center text-sm text-text-secondary`, `role=status`; errors `rounded-md border border-error p-3 text-sm text-text-primary`, `role=alert`; never render provider-supplied error strings |
| Login content | `components/auth/LoginContent.tsx` | Server-only session decisions; renders LoginForm inside page Suspense; fallback `py-8 text-center text-sm text-text-secondary` |
| Dashboard welcome | `components/auth/DashboardWelcome.tsx` | Minimal Feature 02 card `rounded-xl border border-border bg-surface p-6 shadow-sm`; heading `text-2xl font-semibold text-text-primary`; text `mt-3 text-sm text-text-secondary`; primary sign-out button matches accent button pattern |

Navbar now renders sign-out for authenticated users. HomepageActions chooses `/dashboard` or `/login` from the validated server session. Existing button appearance is preserved. Navbar and homepage actions stream inside Suspense so session reads do not block the static shell.
