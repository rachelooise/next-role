# Feature 06 — Profile Save Logic

Status: approved for implementation, 2026-10-31.

## Agreed behavior

Explicit saves create/update the authenticated user's profile, including incomplete drafts. Return visits load saved fields; first visits show blank fields and the account email. Account email and ownership come from the validated server session.

Completion uses ten equally weighted requirements: full name, account email, location, work authorization, current/recent title, experience level, years of experience (zero allowed), at least one skill, one desired job title, and remote preference. Phone, links, education, work history, and resume are optional. Server computes completion percentage, missing fields, and is_complete together.

PDF selection is local until Save Profile. Cancelling a selection preserves the saved PDF. Saving uploads a PDF of at most 5 MiB to the existing private canonical key; Open Resume downloads through an authenticated same-origin route. Upload failure retains edits and selection for retry. AI extraction, generation, and LinkedIn connection remain separate features.

## Implementation

Use Server Actions in actions/profile.ts with authenticated SDK clients and server validation. Server-rendered profile loading stays outside UI components. Shared validation/completion helpers define the field contract; controlled tag and role inputs submit structured data. No migrations or new dependencies. Allow multipart action bodies slightly larger than 5 MiB. Revalidate profile/dashboard after saves. Guard updates with updated_at to detect stale forms. Storage and database are not transactional; retain previous bytes before replacement and attempt restoration on database failure, reporting recovery failures honestly.

## Verification

Exercise partial/complete saves, zero experience, optional education/work history, invalid enums/dates/URLs/nested data, PDF signature/type/size checks, existing resume preservation, conflict/error responses, and ownership derivation. Run TypeScript, lint, production build, and available browser/live checks; document any authenticated verification gaps.

## Approved follow-up — independent resume save

The user requested saving the selected PDF from its own section without saving the profile form. Add Save Resume next to the selected-file controls; leave combined Save Profile behavior available. Resume-only saving preserves all existing profile fields/completion and returns the new version timestamp. For users without a profile row, create a blank draft container with trusted account email. Keep unsaved local edits and retry behavior intact.
