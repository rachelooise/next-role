# Memory - Feature 12 Job Details

Last updated: 2026-11-05 Australia/Perth

## What was built

Implemented Feature 12 from context/designs/job-details.png. Added authenticated app/find-jobs/[id]/page.tsx and not-found.tsx, lib/job-details.ts, lib/job-details-server.ts, and components/job-details/{JobDetailsView,JobInfo,MatchScore,JobDescription,CompanyResearch,DetailIcon}. Saved job title links in JobsTable now open internal details; AppNavigation keeps Find Jobs active for nested routes.

The page displays saved owner job data, summary and four information cards, match reasoning, matched and gap skills, description and optional structured sections, research empty state, and external View Job Post/Apply actions. Missing fields are not fabricated. Invalid, missing and foreign jobs are handled without exposing foreign data; database errors receive a generic message.

Reviewed the reported mid-sentence description: the component displays all saved text, but Adzuna supplies a shortened snippet. Added a preview notice and Read full job description link inside JobDescription. Longer saved descriptions render fully. No scraping or full-description enrichment was implemented.

Updated context/progress-tracker.md and the existing Feature 12 entry in context/ui-registry.md. The user explicitly ran /imprint; the registry now records component-specific visual classes, including the description footer. Added scripts/check-job-details.mjs and scripts/check-job-details-browser.mjs.

## Decisions made

Follow the supplied reference composition, existing semantic tokens and NextRole branding. Purple gap-skill pills intentionally follow the reference. Research execution is Feature 13; its current button only discloses that research is not available yet. External job actions open the saved original URL in a new tab.

Feature 11 was implemented earlier in this conversation, then fully reverted at the user's request. Preserve the pre-Feature-11 behavior: load the latest 20 saved jobs, filter/sort that window locally, and paginate six rows. The new job-filters helper and its test script were removed. Feature 11 remains pending; do not silently restore it.

## Problems solved

Mobile job header initially squeezed the title beside View Job Post. It now stacks the summary and action on small screens. Final browser checks passed at exactly 390px with no horizontal overflow and a usable title width.

Chrome profiles inside .next can lock files that Next.js removes during build. Run browser checks after building, use a temporary browser profile outside .next, and close the task browser. Builds also delete preview artifacts; regenerate the static preview with node scripts/check-job-details.mjs after building. Browser checker expects Chrome debugging on port 9226 and that generated preview.

## Current state

Feature 12 implementation is present. Final description follow-up passed 33 local job-details checks, scoped ESLint and TypeScript. The Feature 12 production build passed before the small description-footer follow-up. All 105 discovery regression checks passed during the feature build.

Synthetic static desktop and 390px mobile component rendering was inspected and checked. Those checks use actual components and compiled CSS, not a signed-in hydrated app. Authenticated live database/browser verification and research-placeholder click behavior remain unverified. No real user data was changed. The known Next.js security advisory remains unresolved.

Feature 10 discovery is implemented and previously verified, superseding the old memory's claim that Find Jobs uses samples. Existing OAuth, PostHog, extraction browser and resume storage concurrency follow-ups remain documented in project context.

There is extensive preexisting uncommitted work, including a staged AGENTS-old.md deletion and untracked profile/resume/job files. Preserve all of it. No commit was created in this session.

## Next session starts with

Run /remember restore and follow the required context reading order before implementation. Wait for the user's next task. A useful remaining check is authenticated Feature 12 behavior: open a saved job, test missing/foreign job access, follow Back to Jobs and external links, and click the research placeholder. Feature 13 is the next planned feature if requested; Feature 11 remains separately pending.

## Open questions

No pending user design decision for Feature 12. Full in-page descriptions would require a new source/enrichment integration; the current action opens the original posting because the missing text is absent from Adzuna's stored snippet.

The user confirmed overwriting the old memory with this handoff.
