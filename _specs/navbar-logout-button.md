# Spec for navbar-logout-button
branch: claude/feature/navbar-logout-button
figma_component (if used): Page Designs — node 57-18

## Summary
Add a logout control to the `Navbar` component that signs the current user out of Firebase Auth when clicked. The control is only visible while a user is authenticated (using the existing `useUser()` hook), and disappears once they're signed out. No redirect or navigation after logout is in scope for this spec — only the sign-out action and the button's visibility.

## Functional Requirements
- `Navbar` gains a logout button/control, positioned to fit its existing layout (logo/title, tagline, "Create Heist" link).
- The logout control is visible only when `useUser()` reports a currently authenticated user; it is hidden while signed out and while the initial auth state is still resolving (`loading: true`), to avoid flashing the wrong state.
- Clicking the control signs the user out of Firebase Auth using the client Web SDK (consistent with the project's existing auth setup in `lib/firebase.ts`) — no Firebase Admin SDK or server-side code.
- After a successful sign-out, `useUser()`'s real-time update causes the logout control to disappear from `Navbar` — no manual page refresh needed.
- No client-side redirect or navigation happens automatically as a result of logging out; the user stays on whatever page they were on.
- Login and signup flows and their components are unaffected by this spec.

## Figma Design Reference (only if referenced)
- File: Page Designs (https://www.figma.com/design/elHzuUQZiJXNqJft57oneh/Page-Designs?node-id=57-18&m=dev)
- Component name: node 57-18
- Key visual constraints: Design reference could not be retrieved automatically this session (Figma access requires authentication that wasn't available). See the Figma link manually for the button's exact label/icon, placement, and styling before implementing.

## Possible Edge Cases
- `Navbar` is currently a Server Component with no client-side interactivity; adding an auth-aware, clickable control requires introducing client-side rendering somewhere in or under `Navbar`.
- The brief window before `useUser()` resolves the initial auth state (`loading: true`) must not show a flash of the logout button for a signed-out user, or hide it momentarily for a signed-in one.
- Clicking logout while a prior sign-out call is still in flight (e.g. rapid double-click).
- Firebase's `signOut()` call rejecting (e.g. network failure) — whether that needs to be surfaced to the user or can fail silently for this first pass.
- `Navbar` currently only renders inside the `(dashboard)` route group's layout — confirm no other place in the app needs this control for this spec.

## Acceptance Criteria
- Logout button appears in the Navar only when user is authenticated
- Logout button is hidden when user is not authenticated
- Clicking the logout button successfully signs the user out via Firebase Authentication
The button styling matches the Figma design and existing design system
- No console errors or warnings during the sign out process
- Button has appropriate hover/active states for better UX
## Open Questions
- Should there be a confirmation dialog before logging out? No.
- Should the button show a loading state during the sign out process? No.
- Exact positioning in the navbar (left of avatar, right of avatar, or in a dropdown menu)? it should be just left of the creat button.|
## Testing Guidelines
Create a test file in the /tests folder for the logout button functionality, and create meaningful tests for the following cases, without going too heavy:
- Logout button is visible when user is authenticated
- Logout button is not visible when user is not authenticated
- Clicking logout button calls Firebase signut method
- Button has correct styling and text content
- Button handles click events properly
