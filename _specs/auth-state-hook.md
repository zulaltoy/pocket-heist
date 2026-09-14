# Spec for auth-state-hook
branch: claude/feature/auth-state-hook
figma_component (if used): N/A

## Summary
Introduce a single source of truth for the current authenticated user's state, exposed through a `useUser` hook that any page or component in the app can call. The hook returns `null` when no user is signed in, or the current user object when one is. It is backed by a real-time, app-wide listener so state updates automatically as Firebase Auth's state changes, without each caller setting up its own listener or requiring a manual refresh. This spec covers only the state-reading mechanism — no signup, login, or logout UI/flow is in scope.

## Functional Requirements
- A `useUser()` hook is available for import and use in any Client Component, in either the `(public)` or `(dashboard)` route group.
- `useUser()` returns `null` when no user is currently authenticated, and the current user object when one is authenticated.
- The value returned by `useUser()` updates in real time as the underlying Firebase Auth state changes (sign-in, sign-out, token refresh affecting auth state), without a page reload.
- Regardless of how many components call `useUser()` at once, there is a single underlying auth-state listener for the whole app — not one per caller.
- The hook must be usable without prop-drilling the user down through layouts or page props.
- No signup, login, or logout flow, form, or button is implemented as part of this spec. The hook only reflects whatever auth state already exists (e.g. set by Firebase Auth directly, or manually during testing).
- Existing or planned places in the app that need the current user — such as the splash page's described (but not yet implemented) auth-gate redirect — are identified as intended future consumers of this hook, but wiring that specific redirect logic is out of scope unless trivially small.

## Possible Edge Cases
- Initial app load before Firebase has resolved whether a user is signed in: it should be clear (see Open Questions) whether this is distinguishable from a confirmed signed-out state.
- User's auth state changes in another browser tab/window — the hook's value should stay in sync if Firebase's own persistence supports it.
- The auth listener encountering a network error or failing to initialize.
- A component using `useUser()` unmounting while an auth-state change is in flight (no state updates or warnings after unmount).
- Rapid, repeated auth-state changes should not cause flicker or inconsistent values across simultaneous `useUser()` callers.
- Since most components are Server Components by default per project convention, `useUser()` can only be called from Client Components — this should not silently fail or be easy to misuse from a Server Component.

## Acceptance Criteria
- `useUser()` can be called from a Client Component in either route group and returns the correct, current value.
- When the underlying Firebase Auth state changes (verified directly via the Firebase SDK/emulator, since no UI exists yet), every mounted `useUser()` caller re-renders with the updated value, without a manual refresh.
- Only one Firebase auth-state listener is ever active at a time, no matter how many components use the hook simultaneously.
- Introducing the hook does not break existing routing, layouts, `Navbar`, or `AuthForm` behavior.
- `useUser()` returns `null` for a signed-out user and a defined user object for a signed-in user.

## Open Questions
- What specific properties should the user object contain (email, uid, displayName, etc.)? email, uid, displayName
- Should the hook also expose loading state while authentication is being initialized? yes
- Do we need error handling for authentication state errors? not for now
- Should there be a separate hook for checking if user is authenticated (boolean) vs getting user data? no

## Testing Guidelines
Create test file(s) in the /tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- `useUser()` returns `null` when no user is authenticated.
- `useUser()` returns the current user object when a user is authenticated (mocked auth state).
- `useUser()`'s returned value updates reactively when the mocked auth state changes while a component is mounted.
- Multiple components calling `useUser()` at the same time all reflect the same, in-sync value.
