# Homepage design

Source: `context/designs/landing-page.png`.

## Character

Brand update (2026-10-27): the user confirmed **NextRole** replaces the reference's wordmark everywhere. Use the shared `Brand` component, which retains the supplied icon and renders NextRole as text. This overrides the original branding instructions below.

NextRole uses Inter, restrained purple accents, dark call to action buttons, pale blue and lilac atmospheric backgrounds, fine borders, and generous whitespace. The supplied screenshot governs the homepage composition. Theme values live in `app/globals.css`.

## Build mandate

Match the supplied logo, headline, paired actions, dashboard preview, two alternating feature sections, striped separators, testimonial, closing call to action, and footer. Use the matching images in `public/`. Keep copy and branding faithful to the screenshot, including illustrative content that describes later product capabilities.

## Responsive behavior

Use a centered frame up to 1280 pixels. Stack feature text and images on small screens. Wrap navigation and actions without horizontal overflow. Keep images at their original aspect ratios. Keep the supplied light appearance.

## Navigation

The homepage links to the planned app routes. Acquisition actions go to `/login` until authentication is implemented in Feature 02. Privacy and terms routes are linked but their content is not part of Feature 01.
