# Plan: Navbar Logout Button

## Context
`_specs/navbar-logout-button.md` (branch `claude/feature/navbar-logout-button`, already checked out) specs a logout control in `components/Navbar/Navbar.tsx` that signs the user out of Firebase Auth on click, visible only while `useUser()` (existing hook at `hooks/useUser.ts`) reports an authenticated user — hidden while signed out and while `loading: true`, to avoid a flash of the wrong state. No redirect after logout, no confirmation dialog, no loading/disabled state during the sign-out call (spec's answered Open Questions). Positioned immediately left of the existing "Create Heist" link. Needs a hover/active state and must not produce console errors during sign-out. The linked Figma reference (node 57-18) couldn't be fetched this session (auth required) — implementation proceeds on the spec's text description, with a note to sanity-check visuals against Figma separately.

## Approach
Extract a narrowly-scoped Client Component, `components/LogoutButton/LogoutButton.tsx`, rather than converting all of `Navbar` to a Client Component. `Navbar` itself needs no state/handlers — only the auth-aware button does — matching CLAUDE.md's "Server Components by default, `use client` only when interactivity is needed" and the precedent already set by `AuthProvider` (a narrowly-scoped client component wrapping just what needs it, not its ancestor layout). `LogoutButton` calls `useUser()` and renders `null` whenever `loading` is true or `user` is null; otherwise it renders its own `<li>` containing a `<button>` styled with the shared `.btn` class, so `Navbar` just drops `<LogoutButton />` into its existing `<ul>` as a plain import.

**Critical existing-test fix required**: `tests/components/Navbar.test.tsx` currently renders `<Navbar />` with no `AuthProvider` wrapper. Once `Navbar` renders `LogoutButton` (which calls the real `useUser()`, which throws without an `AuthProvider` ancestor), those two existing tests will break unless `@/hooks/useUser` is mocked there. This is the first precedent in the repo for mocking `@/hooks/useUser` directly (existing `useUser.test.tsx` mocks the underlying Firebase/AuthProvider layer instead) — appropriate here since `Navbar.test.tsx` tests rendering, not auth plumbing.

## Files to change

**New: `components/LogoutButton/LogoutButton.tsx`**
- `"use client"`. Imports `signOut` (`firebase/auth`), `auth` (`@/lib/firebase`), `useUser` (`@/hooks/useUser`), `LogOut` icon (`lucide-react`).
- `const { user, loading } = useUser(); if (loading || !user) return null;`
- Renders `<li><button type="button" className={`btn ${styles.logoutButton}`} onClick={handleLogout}><LogOut size={14} strokeWidth={2.75} />Log Out</button></li>` — icon sizing matches `Clock8`'s usage already in `Navbar.tsx`.
- `handleLogout` calls `signOut(auth).catch((error) => console.error("Failed to sign out:", error))` — un-awaited with a `.catch` so a failure can't produce an unhandled-rejection console warning (satisfies the spec's "no console errors/warnings" criterion) without adding any loading/disabled state (explicitly out of scope).

**New: `components/LogoutButton/LogoutButton.module.css`**
```css
@reference "../../app/globals.css";

.logoutButton {
  @apply inline-flex items-center gap-1.5 active:bg-secondary;
}
```
Composes with the shared `.btn` class (same pattern as `AuthForm.module.css`'s `.submitButton`) — adds icon/label spacing and the button's `active:` state scoped to just this button, rather than editing the shared global `.btn` (which is also used by "Create Heist" and `AuthForm`'s submit button, out of scope for this feature).

**New: `components/LogoutButton/index.ts`** — `export { default } from "./LogoutButton";`

**Modify: `components/Navbar/Navbar.module.css`** — the `<ul>` currently has no layout rules (only ever held one `<li>`); add a `.siteNav ul { @apply flex items-center gap-2; }` rule alongside the existing `.siteNav h1` rule, so the new `<li>` sits inline next to "Create Heist".

**Modify: `components/Navbar/Navbar.tsx`** — import `LogoutButton` from `@/components/LogoutButton` and render `<LogoutButton />` as the first child of the existing `<ul>`, immediately before the "Create Heist" `<li>`. `Navbar` stays a Server Component — no `"use client"` added here.

## Tests

**Modify: `tests/components/Navbar.test.tsx`** — add `vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }))` and a `beforeEach` defaulting `useUser` to `{ user: null, loading: false }` (matching the file's existing no-semicolon style), so `LogoutButton` renders `null` and the two existing tests (heading renders, Create Heist link renders) keep passing unmodified.

**New: `tests/components/LogoutButton.test.tsx`** — mock `@/hooks/useUser`, `firebase/auth`'s `signOut`, and `@/lib/firebase`'s `auth` (same pattern as `tests/hooks/useUser.test.tsx`/`tests/components/AuthForm.test.tsx`). Render `<LogoutButton />` inside a `<ul>` wrapper (valid list markup). Cases:
1. Not rendered when `{ user: null, loading: false }`.
2. Not rendered when `{ user: {...}, loading: true }` — even with a user present, loading hides it.
3. Rendered when `{ user: {...}, loading: false }`.
4. Clicking it calls `signOut` with the `auth` instance.

## Explicitly out of scope
No redirect/navigation after logout, no confirmation dialog, no loading/disabled button state during sign-out, no changes to login/signup flows, no changes outside `(dashboard)`'s use of `Navbar` (its only render site today). Figma visuals (node 57-18) should get a quick manual sanity-check before merging since they couldn't be fetched automatically.

## Verification
- `npx vitest run tests/components/Navbar.test.tsx tests/components/LogoutButton.test.tsx`, then full `npm test` — no regressions in `AuthForm.test.tsx`/`useUser.test.tsx`.
- `npm run lint` and `npm run build` — confirm the new Client/Server Component boundary compiles cleanly (pre-existing unrelated lint error in `heists/page.tsx` is out of scope).
- `npm run dev` — sign in and out on `/heists`, confirm the button shows only while authenticated, disappears immediately on click with no reload, and no console errors/warnings appear.
