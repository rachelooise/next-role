# Feature 05 — Profile Page UI

Design source: `context/designs/profile.png`.
Status: proposed for confirmation, 2026-10-31.

## What we are building

A complete `/profile` page matching the reference composition, proportions, typography, spacing, and controls. Keep the established NextRole brand. Feature 05 uses mock profile data and local UI state; database persistence, resume extraction, and PDF generation belong to Features 06–08.

## Terms and scope

- Complete profile: all five form sections shown in the reference, plus completion and resume cards.
- Match the reference: centered narrow content column, three white cards, pale page background, compact navbar with active Profile link, purple actions, red 70% completion ring, and the pictured sample values.
- Interactive UI: editable fields, dropdowns, removable skills and industries, adding/removing up to three work roles, current-role checkbox, and local PDF selection/drop with type and 5 MB validation.
- Save and generate: visible controls with honest feedback that persistence and PDF generation are not connected yet; never claim a backend operation succeeded.

## Decisions

- Retain NextRole branding, existing authentication protection, and existing PostHog initialization.
- Treat the supplied screenshot as the visual authority where generic UI guidance differs, including the active navigation underline and narrower content width.
- Omit cover-letter tone and tailoring terminology, consistent with current product scope and the actual reference form.
- Use existing project color tokens and native controls; add no dependencies or backend migrations.
- Completion starts at the pictured 70% with PHONE, LOCATION, EDUCATION tags. This remains a UI fixture; final completion rules belong to Feature 06.
- Desktop uses two-column field groups; mobile collapses to one column without horizontal overflow.

## Implementation

1. Read relevant installed Next.js routing and client-component guidance.
2. Add the protected profile page and a reusable compact application header, preserving the public homepage header.
3. Build completion, resume, and profile form components with shared field and tag patterns.
4. Implement local interactions, keyboard labels, focus states, validation feedback, and responsive layouts.
5. Run lint and production build; inspect desktop/mobile rendering and exercise form interactions when browser tooling is available.
6. Capture UI patterns in `context/ui-registry.md`, record verification, and update `context/progress-tracker.md`.

## Acceptance criteria

- All screenshot sections and controls are present with the same initial values and hierarchy.
- Email is read-only; skills/industries can be added and removed; work roles are capped at three and current roles disable end date.
- PDF selection/drop rejects unsupported or oversized files and supports clearing a selection.
- Save/generate feedback does not imply persistence or an actual generated PDF.
- No database writes, new analytics events, dependency upgrades, or authentication bypasses.
- Lint/build pass, and remaining verification limitations are documented.
