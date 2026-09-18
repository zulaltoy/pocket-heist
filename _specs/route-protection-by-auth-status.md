# Spec for Route Protection by Auth Status
branch: claude/feature/route-protection-by-auth-status
figma_component (if used): none

## Summary
The app currently has two route groups — `(public)` (splash, login, signup, preview) and `(dashboard)` (heists) — but nothing stops an unauthenticated user from viewing dashboard pages directly, or a logged-in user from viewing public pages like login/signup. This feature adds route protection at the group-layout level: `(dashboard)` pages are only viewable by authenticated users, and `(public)` pages are only viewable by unauthenticated users. Auth status is read via the existing `useUser` hook, and each group layout shows a simple loading state while Firebase is still resolving auth status, so protected content or public-only content never flashes on screen before a redirect happens.

## Functional Requirements
- The `(dashboard)` group layout uses the `useUser` hook to determine auth status.
- While the auth status is still loading, the `(dashboard)` layout shows a simple loading indicator instead of rendering the page content or the navbar.
- Once loading finishes, if there is no authenticated user, the `(dashboard)` layout redirects to the login page instead of rendering the requested dashboard page.
- Once loading finishes, if there is an authenticated user, the `(dashboard)` layout renders normally (navbar + page content) as it does today.
- The `(public)` group layout uses the `useUser` hook to determine auth status.
- While the auth status is still loading, the `(public)` layout shows a simple loading indicator instead of rendering the page content.
- Once loading finishes, if there is an authenticated user, the `(public)` layout redirects to the heists page instead of rendering the requested public page.
- Once loading finishes, if there is no authenticated user, the `(public)` layout renders normally as it does today.
- The loading indicator shown in either layout is intentionally simple (e.g. a short loading message or basic spinner) — it is a placeholder state, not a polished loading screen.
- Redirects happen automatically (no user action required) as soon as auth status resolves to the "wrong" state for that route group.

## Figma Design Reference (only if referenced)
Not applicable — no Figma component was referenced for this feature.

## Possible Edge Cases
- A logged-out user directly navigates (via URL) to a `(dashboard)` route such as `/heists` — should be redirected to `/login` without the dashboard content ever rendering.
- A logged-in user directly navigates (via URL) to a `(public)` route such as `/login` or `/signup` — should be redirected to `/heists` without the public page content ever rendering.
- A page refresh on a protected or public-only route while Firebase is still resolving auth state — the loader should show first, not a flash of the wrong content followed by a redirect.
- Auth state changes while a user is already sitting on a page (e.g. a session expires, or another tab logs the user out) — behavior in this scenario should be clarified (see Open Questions).
- The splash page (`/`) is inside the `(public)` group, so under this feature an authenticated user hitting `/` is redirected to `/heists` by the group-level guard; an unauthenticated user still sees the existing splash page content as-is (the splash page's own further redirect-to-`/login` behavior, noted separately in the codebase, is not part of this feature).
- Slow or failed network connections to Firebase that delay auth resolution longer than usual — the loader should remain visible until a definitive auth state (logged in or out) is known.

## Acceptance Criteria
- Given an unauthenticated user, when they visit any `(dashboard)` route, then they see the loading indicator first and are then redirected to `/login` without dashboard content appearing.
- Given an authenticated user, when they visit any `(dashboard)` route, then they see the loading indicator first and then the normal dashboard page (with navbar).
- Given an authenticated user, when they visit any `(public)` route, then they see the loading indicator first and are then redirected to `/heists` without the public page content appearing.
- Given an unauthenticated user, when they visit any `(public)` route, then they see the loading indicator first and then the normal public page content.
- Given auth status is still resolving, when a user is on either group's route, then a simple loading indicator is shown instead of the page's real content.


## Open Questions
- Should we preserve the intended destination URL and redirect back after authentication? No.
- What should the loading indicator look like (spinner, skeleton, simple text)? Spinner, using this clock icon from the title.
- Should there be a timeout for the loading state if
Firebase takes too long? No.

## Testing Guidelines
Create a test file(s) in the /tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- The `(dashboard)` layout shows a loading indicator while auth status is loading, then redirects an unauthenticated user to `/login`.
- The `(dashboard)` layout renders its children normally for an authenticated user once loading finishes.
- The `(public)` layout shows a loading indicator while auth status is loading, then redirects an authenticated user to `/heists`.
- The `(public)` layout renders its children normally for an unauthenticated user once loading finishes.
