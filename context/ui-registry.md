# UI Registry

### Feature 16 Recent Activity data states — 2026-11-23

Files: components/dashboard/{RecentActivity,DashboardView}.tsx and lib/dashboard-activity.ts. Captured with imprint; retains Feature 14 card spacing, heading, shadow and timeline.

| Property | Pattern |
| --- | --- |
| Search dots | border-success-light bg-success-alt, rounded-full border-[3px] |
| Research dots | border-info-light bg-info, rounded-full border-[3px] |
| Activity message | text-sm font-medium leading-5 text-text-primary; min-w-0 break-words wrapper for long names/titles |
| Timestamp | Semantic time dateTime, app-muted mt-1 block; relative minute/hour/day labels |
| Empty state | Existing app-muted p-6: Your job searches and company research will appear here |
| Failure state | p-6 text-sm text-error, role=alert; underlined Reload dashboard link with underline-offset-2 |
| Preview disclosure | app-muted text-center: Charts show sample data |

Five newest actual events, keyed by prefixed source IDs. No mock rows, accent activity dots or error-as-empty fallback. Timestamp labels update on a fresh request. Both card padding and section spacing remain the existing 24px patterns.

### Feature 15 stats data states — 2026-11-23

Files: components/dashboard/{DashboardView,StatsBar}.tsx, lib/dashboard-stats.ts. Captured with imprint; preserves Feature 14 cards, grid, number sizes and semantic tokens.

| Property | Pattern |
| --- | --- |
| Stat cards | Existing app-card, text-sm font-medium text-text-secondary labels, text-[30px] font-semibold leading-9 text-text-primary values |
| Subtitles | Existing app-muted; All saved jobs, Across all saved jobs, Total researched, Last 7 days |
| Empty account | Zero counts; average dash and No scored jobs yet subtitle |
| Load failure | All four values are dashes; text-sm text-error alert above cards; underlined Reload dashboard link with underline-offset-2 |
| Preview disclosure | app-muted text-center, scoped to Recent activity and charts show sample data |

Stats have no mock numbers or trend badges. A genuine zero score renders 0%; an unavailable average renders a dash. Number formatting uses comma grouping and whole percentages. Feature 14 trend styling remains available in StatsBar, but Feature 15 supplies no uncomputed trends. No new UI surface, color token or responsive layout was introduced.

### Feature 14 dashboard — 2026-11-23

Files: components/dashboard/{DashboardView,StatsBar,RecentActivity,BarChart,JobsLineChart}.tsx. Captured with imprint from the built components; design source designs/dashboard.png.

| Property | Pattern |
| --- | --- |
| Card surfaces | app-card: rounded-2xl border border-border bg-surface p-6 shadow-app-card |
| Activity card | overflow-hidden rounded-2xl border border-border bg-surface shadow-app-card; heading border-b px-6 py-5; entries px-6 py-6 space-y-6 |
| Section headings | app-heading: text-base font-semibold leading-6 text-text-primary |
| Stat labels | text-sm font-medium leading-5 text-text-secondary |
| Stat values | text-[30px] font-semibold leading-9 text-text-primary; mt-1 |
| Trends | rounded-sm bg-success-lightest px-2 py-0.5 text-xs font-medium leading-4 text-success-darker |
| Supporting copy | app-muted; mt-1 below activity text, mt-2 stat subtitle row |
| Activity text | text-sm font-medium leading-5 text-text-primary; gap-4 to timeline |
| Timeline dots | rounded-full border-[3px]; accent/accent-light, info/info-light, success-alt/success-light; border-colored vertical track |
| Charts | fill-info research bars; fill-success distribution bars; stroke-accent 3px line, accent fill fading from 0.2 to 0 opacity; dashed stroke-border grid; fill-text-muted text-xs font-normal labels |
| Profile action | app-primary; existing hover:bg-accent-dark and accent focus outline |
| Section spacing | space-y-6 and gap-6; main p-4 (mobile), standard p-8 above mobile |

Chart SVG text does not scale with plot width. Accessible SVG titles include all values. Mock-data disclosure uses app-muted below the grid. Profile status failure uses neutral app-muted feedback and an underlined accent profile link. No new color tokens or shared navbar changes.

### Feature 13 company research, 2026-11-05

Files: components/job-details/CompanyResearch.tsx and ResearchDossier.tsx. Captured with the imprint skill. This replaces Feature 12's coming-soon research placeholder patterns.

| Property | Pattern |
| --- | --- |
| Card | overflow-hidden rounded-2xl border border-border bg-surface shadow-app-card |
| Header | flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4 |
| Heading and icon | app-heading, gap-3; size-7 rounded-xl bg-accent-muted text-accent icon surface |
| Action | app-primary inline-flex items-center gap-2; disabled while starting, queued or running |
| Content | px-6 py-5; dossier mt-5 space-y-6 break-words |
| Progress | text-sm leading-5 text-text-secondary, role=status and aria-live=polite; manual checks show Checking research status, then a local check time; failed status explicitly points to Retry research (2026-11-16) |
| Errors | text-sm text-error, role=alert; app-secondary status check action |
| Evidence note | rounded-lg border border-border bg-surface-secondary p-3 text-xs leading-5 text-text-secondary |
| Dossier headings | text-sm font-semibold text-text-primary |
| Paragraphs | mt-2 whitespace-pre-line text-sm leading-6 text-text-primary |
| Advice cards (2026-11-16 reference update) | rounded-2xl border border-border bg-surface-secondary p-4; gap-4; two columns from sm and one on mobile |
| Advice headings | flex items-center gap-2 text-sm font-semibold text-text-primary; size-4 line icons using text-info, text-success or text-accent |
| Lists | mt-3 list-disc space-y-2 pl-3 text-sm leading-6 text-text-primary marker:text-accent; li pl-1 |
| Company Overview (2026-11-16 reference update) | rounded-2xl border border-border bg-surface-secondary p-4; heading with size-4 text-accent compass icon; body mt-3 text-sm leading-6 |
| Tech pills | inline-flex max-w-full items-center gap-1.5 rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent-dark; size-3 code icon; wrapping list with mt-3 gap-2 |
| Your Edge | Same light surface and border as peer advice cards; shield icon in text-success. User reference supersedes previous accent left rule. |
| Sources | border-t border-border pt-4; break-all text-xs text-accent underline underline-offset-2 |
| Supporting text | app-muted; Gemini disclosure and missing-evidence text |

Progress explicitly says the user may leave and return later. Refresh keeps the previous dossier visible; failure offers retry. A job/profile-only result has an explicit Limited briefing label and no invented sources. All external sources use safe new-tab attributes and accessible announcements. Header action wraps naturally on narrow screens. Seventeen hydrated Chrome checks with a synthetic API passed, including 390px overflow, failure/retry, polling and saved return. Desktop/mobile artifacts are in ignored .next; the mobile image was inspected. These are real component checks, not authenticated Trigger.dev verification.

Find Jobs location field (2026-10-31): JobsExplorer labels it Location (optional) and allows blank submission. Reuses existing app-input and label styles; job title remains required.

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

### Feature 10 JobsExplorer and JobsTable, 2026-11-02

Files: components/find-jobs/JobsExplorer.tsx and JobsTable.tsx. Captured with imprint. Supersedes preview/sample notes for Find Jobs.

| Property | Pattern |
| --- | --- |
| Cards | app-card, white bg-surface, border-border, rounded-2xl, p-6, shadow-app-card |
| Headings and copy | app-heading, app-page and app-muted |
| Inputs and country select | app-input; existing accent focus ring and 8px corners |
| Buttons | app-primary and app-secondary; fieldset disabled during search/refresh; Finding jobs… and Refreshing… |
| Success | rounded-lg border-success-light bg-success-lightest p-3 text-sm text-success-foreground; role=status |
| Partial results | rounded-lg border-warning bg-surface-secondary p-3 text-sm text-text-primary; role=status |
| Errors | border-error text-error with role=alert; saved rows remain visible |
| Table | rounded-2xl border-border bg-surface shadow-app-card; white rows, border-t border-border, hover:bg-surface-secondary; horizontal scroll contained in card |
| Score and source | Existing 4px meter with success/info/warning tokens; Search pill rounded-full bg-surface-muted px-2 py-0.5 |

Location stays optional; country is explicit with US default. Missing profile data displays a Complete your profile link. Empty and filtered-empty states use app-muted. Real provider links open a new tab with an accessible announcement and safe rel attributes. The latest-20 window and snippet-based score limits are disclosed. Browser search, loading, duplicate counts, filters, server refresh and persisted reload passed. Desktop 1440px and mobile 390px layouts passed overflow checks; the mobile screenshot was visually inspected. No browser exceptions. Existing six-row local pagination remains until Feature 11.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### Profile and Find Jobs UI — 2026-10-31

Captured with the imprint skill. Reference images: `context/designs/profile.png` and `context/designs/find-jobs.png`; NextRole branding retained.

| Component | Files | Pattern |
| --- | --- | --- |
| Active navigation | `components/layout/AppNavigation.tsx` | Existing `landing-link`, `font-medium`; active `text-accent` with `aria-current`, inactive `text-text-dark`. |
| Profile form | `components/profile/ProfileForm.tsx`, `ProfileField.tsx`, `WorkRole.tsx`, `TagInput.tsx` | Cards `app-card`; heading `text-lg font-semibold`; field labels `text-xs font-medium text-text-secondary`, uppercase; fields `app-input`; section dividers `border-t border-border`; tags `rounded-md border bg-surface-muted px-3 py-1 text-xs text-text-dark hover:text-accent`. |
| Resume selection | `components/profile/ResumeUpload.tsx` | Drop zone `rounded-xl border border-dashed bg-surface-secondary px-5 py-8 text-center`; helper text `text-xs text-text-secondary`; buttons use shared primary/secondary classes. |
| Jobs explorer | `components/find-jobs/JobsExplorer.tsx` | White table, `border-t` rows, `hover:bg-surface-secondary`; headings `text-xs uppercase text-text-secondary`; score meters use `text-success`, `text-info`, `text-warning`; status `rounded-lg border border-info-light bg-info-lightest p-3 text-sm text-info-foreground`. |

Shared classes in `app/globals.css`: `app-card` uses `rounded-2xl border border-border bg-surface p-6 shadow-app-card`. `app-input` uses `min-h-11 rounded-md border border-border bg-surface px-3 py-2 text-sm`, accent focus and muted placeholders. `app-primary` uses `rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-dark`; `app-secondary` uses `rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary`. Both button variants include accent focus outlines and disabled opacity.

Profile desktop fields use two columns, collapsing on mobile. Job tables scroll horizontally within their card. All page states disclose preview data and unconnected backend operations.

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
| Login page | `app/(auth)/login/page.tsx` | Page `landing-glow` with `px-5 py-12`; card `rounded-2xl border border-border bg-surface p-6 shadow-app-card`; shared Brand above heading; heading `text-3xl font-semibold tracking-tight text-text-primary`; supporting text `text-sm leading-6 text-text-secondary`; home link `text-sm text-text-secondary hover:text-accent` |
| Login form | `components/auth/LoginForm.tsx` | `mt-8 flex flex-col gap-4`; provider buttons `min-h-12 rounded-md px-4 py-3 text-sm font-medium`; Google uses surface/border secondary pattern, GitHub uses accent primary pattern; focus `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`; pending `disabled:cursor-wait disabled:opacity-60` |
| Auth errors and status | `components/auth/LoginForm.tsx` | Status `min-h-5 text-center text-sm text-text-secondary`, `role=status`; errors `rounded-md border border-error p-3 text-sm text-text-primary`, `role=alert`; never render provider-supplied error strings |
| Login content | `components/auth/LoginContent.tsx` | Server-only session decisions; renders LoginForm inside page Suspense; fallback `py-8 text-center text-sm text-text-secondary` |
| Dashboard welcome | `components/auth/DashboardWelcome.tsx` | Minimal Feature 02 card `rounded-2xl border border-border bg-surface p-6 shadow-app-card`; heading `text-2xl font-semibold text-text-primary`; text `mt-3 text-sm text-text-secondary`; primary sign-out button matches accent button pattern |

Navbar now renders sign-out for authenticated users. HomepageActions chooses `/dashboard` or `/login` from the validated server session. Existing button appearance is preserved. Navbar and homepage actions stream inside Suspense so session reads do not block the static shell.

### UI rules alignment ? 2026-10-31

Profile and Find Jobs now follow ui-rules.md over the earlier screenshot exceptions. Both page containers use `max-w-[1440px] p-8`, with `space-y-6` between sections. Header uses `min-h-16`, `sm:h-16`, and `px-6`; mobile navigation can wrap. Cards use `rounded-2xl border border-border bg-surface p-6 shadow-app-card`, including the exact documented two-layer shadow. The jobs table uses the same surface, radius, and shadow with padding on cells.

Shared typography: `app-heading` is `text-base font-semibold leading-6 text-text-primary`; `app-page` is `text-sm font-medium leading-5 text-text-primary`; `app-muted` is `text-xs font-normal leading-4 text-text-muted`. Inputs use 8px corners and `focus:ring-1 focus:ring-accent focus:border-accent`. Tags use pill corners and `px-2 py-0.5`. Match meters are 4px tall. Inactive navigation uses the `navigation` token; active links retain accent text and no underline. These patterns supersede earlier entries for these components.

### Connected Accounts ? 2026-10-31

File: `components/profile/ConnectedAccounts.tsx`. Captured with imprint. Profile card uses `app-card space-y-6`, `app-heading`, and `app-muted`. LinkedIn mark uses `rounded-lg bg-linkedin-light text-linkedin`; the Connect LinkedIn button uses `app-primary`. Account row wraps on mobile with `gap-4`. The disconnected state and coming-soon note are explicit; clicking the button announces that integration is unavailable without claiming connection.

### CompletionIndicator

File: components/profile/CompletionIndicator.tsx.
Last updated: 2026-10-31

| Property | Class or value |
| --- | --- |
| Background | None; inherits the card surface |
| Border | None; SVG track uses text-border |
| Border radius | Rounded SVG arc ends via strokeLinecap=round |
| Text - primary | text-base font-semibold text-text-primary |
| Text - secondary | None |
| Spacing | No internal padding |
| Hover state | None; informational display |
| Shadow | None |
| Accent usage | text-accent on the progress arc |

**Pattern notes:** Use a purple arc and neutral track. The displayed percentage and SVG dash length derive from the same clamped value. SVG pathLength=100 normalizes the progress calculation; strokeWidth=10 gives consistent stroke weight. Expose progressbar semantics with minimum, maximum, and current value. The current profile value is a 70% preview fixture. This replaces the earlier red border and orange arc treatments.

### ProfileAttention

File: components/profile/ProfileAttention.tsx.
Last updated: 2026-10-31

| Property | Class |
| --- | --- |
| Background | bg-surface through app-card |
| Border | border border-border through app-card |
| Border radius | rounded-2xl on card; rounded-full on attention icon; rounded-sm on labels |
| Text - primary | text-sm font-semibold text-text-primary |
| Text - secondary | app-muted: text-xs font-normal leading-4 text-text-muted |
| Spacing | p-6 through app-card; gap-4; heading and label gaps gap-2; copy mt-2; labels mt-3 |
| Hover state | None; informational card |
| Shadow | shadow-app-card |
| Accent usage | bg-warning text-warning-foreground on attention icon and labels; purple ring through CompletionIndicator |

**Pattern notes:** Follow the user's latest compact reference. Missing-field labels use solid orange backgrounds, white uppercase text, text-xs font-medium, and px-2 py-0.5. Rectangular labels are an explicit reference-based exception to the general pill badge rule. Keep the card white and reuse CompletionIndicator for proportional progress. Avoid red for this incomplete-profile notice. This entry supersedes earlier profile attention styles.

### Feature 06 profile persistence — 2026-10-31

Files: components/profile/ProfileForm.tsx, ProfileField.tsx, TagInput.tsx, WorkRole.tsx, ResumeUpload.tsx, ProfileAttention.tsx and CompletionIndicator.tsx.

Captured with the imprint skill. Existing profile visual patterns remain the baseline:

| Property | Class |
| --- | --- |
| Cards | app-card: rounded-2xl border border-border bg-surface p-6 shadow-app-card |
| Primary text | app-heading and app-page |
| Supporting copy | app-muted |
| Inputs | app-input; existing accent focus ring and 8px corners |
| Primary action | app-primary; disabled during save; Saving profile… text |
| Secondary action | app-secondary, including the authenticated Open Resume link |
| Status | mt-4 text-sm text-text-secondary with role=status |
| Errors | mt-4 text-sm text-error with role=alert |
| Tags | rounded-full border bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-primary hover:text-accent |
| Completion | Existing purple SVG arc and orange missing-field labels; percentage/tags now derive from saved requirements |

Pattern notes: first visits display blank fields and account email. Email stays read-only; dropdowns include an empty selection so incomplete drafts are explicit. Optional fields are labeled optional. Form controls are disabled through a fieldset while saving; errors preserve input state. Cancel selection removes only a locally staged PDF. Open Resume uses the authenticated app route, never a public storage URL. This entry supersedes sample-data/70% fixture notes for Profile only; Find Jobs remains a preview.

ProfileAttention completion state: completed profiles use a checkmark with bg-success-lightest text-success-foreground. The orange exclamation icon is reserved for incomplete profiles.

### Resume section save action — 2026-10-31

ResumeUpload now shows a local Save Resume button below a selected filename. It uses app-primary mt-4 and disabled pending feedback. Local save success uses text-sm text-text-secondary with role=status; failures use text-sm text-error with role=alert. Helper copy points to Save Resume instead of requiring scrolling to Save Profile. Existing drop-zone/card styles and private Open Resume link are retained. Profile edits remain unsaved when this separate action runs.

### Feature 07 resume extraction — 2026-10-31

Files: components/profile/ResumeUpload.tsx and ProfileForm.tsx. Captured with imprint.

| Property | Class / behavior |
| --- | --- |
| Existing cards and inputs | app-card, app-input; no visual baseline changes |
| Extract action | app-secondary next to Open Resume; disabled during pending work or a staged replacement |
| Loading | Extracting… button text; conflicting form controls disabled |
| Supporting copy | app-muted w-full; explains saved-file source and OpenAI processing |
| Success/review prompt | text-sm text-text-secondary, role=status |
| Extraction errors | text-sm text-error, role=alert |
| Undo action | app-secondary; restores the draft before extraction |

Pattern notes: reuse local draft state and a keyed form revision to refresh fields, tags and roles together after extraction/undo. Saved completion stays unchanged until explicit Save Profile. Missing extracted values preserve existing form entries. Email remains read-only. Generation and LinkedIn remain unavailable. Browser interaction verification remains pending; see profile-extraction-verification.md.

ResumeUpload provider copy now identifies Google Gemini. Existing secondary Extract action, review/Undo flow, styling and accessibility patterns are retained. Gemini overload and quota errors use the existing text-sm text-error alert pattern.

Gemini availability follow-up: extraction now uses gemini-3.5-flash-lite after a successful live synthetic PDF check. This changes no UI styles or review/save interactions; existing alert and status patterns remain unchanged.

Extraction validation follow-up: ordinary printed website links without a protocol are normalized to HTTPS before the existing validation. Invalid model JSON/fields display a distinct unsupported-format message using the existing text-sm text-error alert pattern. No component geometry, colors, save flow or completion rules changed.

### Resume actions placement and extraction success copy — 2026-10-31

Files: components/profile/ResumeUpload.tsx and ProfileForm.tsx. Imprint update: View Resume and Extract from Resume now appear in the card footer, below the generation row, using flex flex-wrap justify-end gap-3. View Resume uses app-secondary inline-flex; Extract from Resume uses app-primary with existing disabled/loading states. The former Open Resume label is replaced by View Resume. Extraction success uses text-sm text-success-foreground with role=status and exact copy: Profile fields filled in. Review and save below. Errors retain text-sm text-error and role=alert. The data-processing helper remains before the footer. Hidden empty selection status no longer leaves an empty paragraph.

Resume extraction status placement: success/error feedback now renders inside ResumeUpload, immediately below the upload area and before the footer divider. Success retains green text-success-foreground and the exact Profile fields filled in. Review and save below. copy. The generic processing helper is removed per the annotated reference; selected-file save/cancel guidance remains conditional. No duplicate extraction status is rendered below the card.

### Resume card redesign — 2026-10-31

Supersedes the previous resume action placement. ResumeUpload uses a compact saved-file row (rounded-xl, bg-surface-muted) with a document icon, filename/size and outlined View Resume / Replace actions. Existing files without persisted metadata show Resume.pdf and PDF document; newly saved uploads show their actual name and size for the current session. Upload/drop controls appear only for an empty resume or staged replacement, retaining independent Save Resume and Cancel.

Extraction has its own responsive text/action row with a purple Extract to Profile button. Success appears in a rounded bg-success-lightest banner with check icon, green review/save copy and Undo inside the banner. The generation row sits below a divider with an outlined sparkle-icon Generate Resume action. Rows stack and actions wrap on mobile. Existing app-card, app-primary, app-secondary and semantic color tokens are reused. Static desktop and 390px-content previews checked; authenticated interaction verification remains pending.

Typography correction: Resume and subsection headings use app-heading (16px/600/24px); filenames and success titles use 14px/500/20px; supporting text uses app-muted (12px/400/16px), with success guidance retaining the green semantic token. Card padding is the standard 24px with 24px section gaps. Reference imagery guides composition; ui-rules.md governs typography.

Sizing refinement: only the Resume card title uses app-heading. Extraction and generation subsection labels use text-sm font-medium leading-5 (14px/500/20px), matching the LinkedIn subheading. Resume buttons use shared app-primary/app-secondary padding without extra min-height or horizontal padding; extraction uses self-start to avoid stretching across the mobile row.

Read-only profile inputs: ProfileField adds read-only:bg-surface-muted to app-input, giving the account email a light grey background while preserving readable text, keyboard focus and text selection. Editable fields retain the white surface.

### Feature 08 generation action

Files: components/profile/ResumeUpload.tsx and ProfileForm.tsx. Last updated: 2026-10-31. Captured with imprint.

The existing Resume card keeps app-card, 24px padding and section gaps. Generation remains below border-t border-border pt-6. Its label uses text-sm font-medium leading-5 text-text-primary and helper copy uses app-muted. The outlined action reuses app-secondary border-accent/60 text-accent-dark hover:bg-accent-muted, shared focus and disabled states, and self-start to avoid mobile stretching. Loading copy is Generating…. Success uses text-sm text-success-foreground with role=status; errors use text-sm text-error with role=alert. No new colors or geometry.

The helper discloses saved details, replacement and Google Gemini processing. Generation is disabled for an unsaved profile, a staged PDF or any in-flight profile operation. Success updates file metadata and View Resume while preserving unsaved form fields. Verified in an authenticated synthetic browser at desktop and mobile widths, with no horizontal overflow or runtime exceptions.

Generated PDF work history (2026-10-31): each role header uses a flexible left column for job title/company and a 145pt right column for dates, separated by 12pt. Dates align to the page's right content edge; long titles wrap within the left column. Header stays together during pagination. This is a PDF document layout, using the renderer style API. Synthetic PDF rendering confirmed spacing, wrapping and right alignment.

PDF spacing/date refinement (2026-10-31): name explicitly uses 21pt with 1.3 line height and 6pt below; the optional 12pt title uses 1.4 line height and 6pt below. This avoids inheriting the body line height at larger font sizes. Contact links have 3pt above. The contact header stays together. Work dates use month/year labels (June 2020 - Sept 2023, or Jan 2022 - Present), with a 145pt right-aligned date column. Month labels are Jan, Feb, Mar, Apr, May, June, July, Aug, Sept, Oct, Nov and Dec, joined to the year; date ranges use a spaced hyphen. Existing saved PDFs must be regenerated for template changes.

### Feature 12 job details, 2026-11-05

Files: `components/job-details/JobDetailsView.tsx`, `JobInfo.tsx`, `MatchScore.tsx`, `JobDescription.tsx`, `CompanyResearch.tsx`, `DetailIcon.tsx`.
Last updated: 2026-11-05. Captured with `/imprint` from the implemented components and `context/designs/job-details.png`.

| Property | Classes |
| --- | --- |
| Card background | `bg-surface` through `app-card` |
| Card border and radius | `border border-border rounded-2xl` |
| Card shadow | `shadow-app-card` |
| Card padding and section spacing | `p-6`, `space-y-6` |
| Section heading | `app-heading` (16px, semibold, primary text) |
| Body copy | `text-sm leading-relaxed` |
| Supporting copy | `app-muted` (12px, normal, muted text) |
| Primary action | `app-primary` |
| Secondary action | `app-secondary` |
| Back link | `text-sm text-text-secondary hover:text-accent`, `gap-2` |
| Inline icons | `currentColor`, rounded semantic surfaces, no independent hardcoded colors |

**JobInfo:** The job title uses `text-2xl font-bold leading-8 tracking-tight`. Company text uses `text-sm text-text-secondary`. The match pill uses `rounded-full px-2.5 py-0.5 text-xs font-medium`, with `bg-success-lightest text-success-foreground` at the shared match threshold and `bg-accent-muted text-accent` below it. Summary actions use shared secondary button styles. The company placeholder uses `rounded-2xl border border-border bg-surface-secondary text-text-muted`.

Info cards use `rounded-2xl border border-border bg-surface p-4` without the main card shadow. Values use `text-sm font-semibold`; uppercase labels use `app-muted`. Icon surfaces use `rounded-xl` with `bg-success-lightest text-success`, `bg-info-lightest text-info-medium`, `bg-accent-muted text-accent`, or `bg-surface-secondary text-text-secondary`.

**MatchScore:** Reasoning and skills labels use `text-xs font-semibold uppercase text-text-secondary`. Reasoning has a green semantic icon surface and `mt-3` body copy. Skills use `mt-4 space-y-3`, muted subgroup labels and `gap-2` between pills. Pills use `rounded-full px-3 py-1 text-xs font-medium`, with `bg-success-lightest text-success-foreground` for matched skills and `bg-accent-muted text-accent` for gaps. Purple gap pills intentionally follow the supplied reference. Check and cross marks supplement color.

**JobDescription:** Uses the shared card and heading, with `bg-surface-secondary text-text-secondary` behind the file icon. Content uses `mt-5 space-y-4 text-sm leading-relaxed`, `[overflow-wrap:anywhere]` and `whitespace-pre-line`. Optional subsection headings use `mb-2 font-semibold`; lists use `list-disc space-y-1 pl-5`. Description text has no height cap, line clamp or text slicing.

The description footer uses `border-t border-border pt-4`, an `app-muted` Adzuna preview notice, and an `app-secondary mt-3` Read full job description link with `gap-2` and the external icon. It opens the saved source URL with `target="_blank" rel="noopener noreferrer"` and accessible new-tab copy. Do not add Show more for text that is absent from the saved snippet.

**CompanyResearch:** Uses `bg-surface border border-border rounded-2xl shadow-app-card`. The divided header uses `border-b border-border px-6 py-4`, `app-heading`, an accent icon surface and an `app-primary` action. Empty content uses `px-6 py-12 text-center`, a `rounded-2xl bg-surface-secondary text-text-muted` icon surface, `text-sm font-medium` title and `mt-2 text-sm leading-5 text-text-muted` guidance. Placeholder feedback uses `mt-4 text-sm text-text-secondary` and `role="status"`. Research execution remains Feature 13.

**JobDetailsView:** Back navigation uses the shared accent hover. Apply uses `app-primary py-3 text-center`; attribution uses `app-muted` with `hover:text-accent`. External links consistently include safe new-tab attributes and accessible labels. Preserve NextRole branding and the shared navbar. Responsive composition belongs to the page, rather than becoming a global visual rule.
### Dashboard analytics chart states

File: components/dashboard/DashboardView.tsx
Last updated: 2026-11-23

| Property | Class |
| --- | --- |
| Card surface, border, radius and shadow | `app-card` |
| Heading | `app-heading` |
| Period and empty/error text | `app-muted mt-1` / `app-muted mt-5` |
| Retry | `underline` |
| Chart accents | `fill-info`, `fill-success`, `stroke-accent` |

Charts label their reporting periods and use separate empty and retry states. Daily charts use UTC dates; axes scale to event counts.

