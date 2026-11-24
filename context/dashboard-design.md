# Feature 14 — Dashboard UI

Feature 16 update (2026-11-23): Recent Activity now shows the newest five actual completed searches and saved research events, using green search/blue research dots, event timestamps and empty/error states. Only charts are labeled as sample data. See dashboard-activity-verification.md.

Feature 15 update (2026-11-23): the stat cards now use authenticated database aggregates, with descriptive subtitles replacing mock trends. The footer identifies only recent activity/charts as sample data. Empty counts are zero; empty/unavailable average is a dash. See dashboard-stats-verification.md. The original Feature 14 fixture plan below is historical.

Approved in chat before implementation. Implement the composition in designs/dashboard.png with mock data, retain NextRole branding and the shared authenticated navbar, and show a profile completion banner only when the saved profile is incomplete or missing.

- Four white stat cards: 284 Total Jobs Found (+12%), 82% Avg. Match Rate (+3%), 35 Companies Researched, 28 Jobs This Week.
- Equal desktop columns for five Recent Activity entries and Company Research Activity (blue bars, Monday–Sunday).
- Lower desktop row: Jobs Found Over Time (purple smoothed line and fading fill), two thirds; Match Score Distribution (green bars), one third.
- Existing semantic tokens, Inter, 16px card corners, 24px card padding and gaps, 30px stats, 16px headings, 14px activity text and 12px captions.
- Mobile stacks cards and charts; SVG plot geometry stretches while text stays 12px. Each chart exposes all values in an accessible title.
- Footer explicitly identifies sample data. Features 15–17 own real statistics, activity and analytics. No new dependency, provider call, schema or data mutation.

Implementation: app/dashboard/page.tsx owns authentication and the existing SDK profile read; components/dashboard owns presentation; lib/dashboard-preview.ts owns typed fixtures. Missing profile is incomplete; read failure gives neutral unavailable feedback. Server request data stays under Suspense. Existing shared navbar/sign-out behavior is retained.

The reference supersedes outdated cover-letter and resume-tailoring labels in Feature 14. SVG is used for this static UI feature; Feature 17's Recharts integration remains a separate planned task.
