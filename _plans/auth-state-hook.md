# Plan: `useUser()` Auth State Hook

## Context

`_specs/auth-state-hook.md` specs out a way for any page or component to read the current Firebase-authenticated user: a `useUser()` hook, usable from any Client Component, returning `null` when signed out or the current user when signed in, backed by one real-time, app-wide Firebase listener rather than one per caller. Signup/login/logout flows are explicitly out of scope — this only wires up the state-reading side.

The spec's resolved Open Questions lock in:
- Trimmed user shape: `{ uid, email, displayName }` (not the raw Firebase `User`)
- The hook also exposes a `loading` flag (auth state not-yet-determined vs. confirmed signed out)
- No error handling for auth state errors, for now
- One hook only — no separate boolean `isAuthenticated` hook
- The listener lives at the root of the app (`app/layout.tsx`), the only layout shared by both `(public)` and `(dashboard)` route groups

`lib/firebase.ts` already exports a configured `auth` (`getAuth(app)`) — `onAuthStateChanged` is not used anywhere yet. The codebase has no `hooks/`, `context/`, or `providers/` directory, and no existing pattern for mocking `firebase/auth` in tests — this feature establishes both, built to match the repo's established 3-file component convention (seen in `components/AuthForm/`, the one existing Client Component).

## Approach

**A Context provider (`AuthProvider`) owns the single Firebase listener; `useUser()` is a thin hook that reads from its Context.** This is the standard way to fan a single subscription out to many consumers in React, and matches the locked decision that the listener lives once, at the app root, not per-caller.

`AuthContext`'s default value is `undefined` (not a fallback object) so `useUser()` can tell "no provider mounted" apart from "provider mounted, still loading" — `useUser()` throws if called with no provider above it, rather than silently returning a misleading value.

`AuthProvider` is the first — and only new — Client Component. `app/layout.tsx` stays a Server Component (it keeps `export const metadata`, which can't live in a `"use client"` file) and simply renders `AuthProvider` as a child wrapping `{children}`; both route groups nest under it already, so no other layout needs to change.

## Files to change

**New: `components/AuthProvider/AuthProvider.tsx`**
```tsx
"use client"

import { createContext, useEffect, useState, type ReactNode } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"

export interface AppUser {
  uid: string
  email: string | null
  displayName: string | null
}

export interface AuthContextValue {
  user: AppUser | null
  loading: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function toAppUser(firebaseUser: User | null): AppUser | null {
  if (!firebaseUser) return null
  const { uid, email, displayName } = firebaseUser
  return { uid, email, displayName }
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthContextValue>({ user: null, loading: true })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setState({ user: toAppUser(firebaseUser), loading: false })
    })
    return unsubscribe
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
```

**New: `components/AuthProvider/index.ts`**
```ts
export { default, AuthContext } from "./AuthProvider"
export type { AppUser, AuthContextValue } from "./AuthProvider"
```

**New: `hooks/useUser.ts`** (first file in a new `hooks/` directory)
```ts
"use client"

import { useContext } from "react"
import { AuthContext } from "@/components/AuthProvider"

export function useUser() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useUser must be used within an AuthProvider")
  }
  return context
}
```

**Modify: `app/layout.tsx`** — wrap children in the provider:
```tsx
import type { Metadata } from "next"
import AuthProvider from "@/components/AuthProvider"
import "@/app/globals.css"

export const metadata: Metadata = {
  title: "Pocket Heist",
  description: "Tiny missions. Big office mischief.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
```

No changes needed to `app/(public)/layout.tsx`, `app/(dashboard)/layout.tsx`, `components/Navbar/Navbar.tsx`, or `components/AuthForm/AuthForm.tsx` — nothing in the current codebase reads user state today, so there's no existing consumer to migrate, and no signup/login/logout UI is added.

## Tests

**New: `tests/hooks/useUser.test.tsx`** (new `tests/hooks/` directory, mirroring the new `hooks/` source directory). Covers the hook and provider together — the provider has no independent visual output worth its own test file.

First `vi.mock` module-mock pattern in the repo (existing tests only use `vi.spyOn`): mock `firebase/auth`'s `onAuthStateChanged` to capture the registered callback and return a spyable unsubscribe function, and mock `@/lib/firebase`'s `auth` export as an empty object so no real Firebase initialization happens in tests. Use `@testing-library/react`'s built-in `renderHook(() => useUser(), { wrapper: AuthProvider })`.

```tsx
import { renderHook, act, render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { onAuthStateChanged } from "firebase/auth"
import AuthProvider from "@/components/AuthProvider"
import { useUser } from "@/hooks/useUser"

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(),
}))
vi.mock("@/lib/firebase", () => ({
  auth: {},
}))

describe("useUser", () => {
  let authCallback: (user: unknown) => void
  const unsubscribeSpy = vi.fn()

  beforeEach(() => {
    unsubscribeSpy.mockClear()
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, cb) => {
      authCallback = cb as (user: unknown) => void
      return unsubscribeSpy
    })
  })

  it("starts as not-yet-determined before the callback fires", () => {
    const { result } = renderHook(() => useUser(), { wrapper: AuthProvider })
    expect(result.current).toEqual({ user: null, loading: true })
  })

  it("resolves to signed-out state", () => {
    const { result } = renderHook(() => useUser(), { wrapper: AuthProvider })
    act(() => authCallback(null))
    expect(result.current).toEqual({ user: null, loading: false })
  })

  it("trims the Firebase user down to uid/email/displayName", () => {
    const { result } = renderHook(() => useUser(), { wrapper: AuthProvider })
    act(() =>
      authCallback({ uid: "u1", email: "a@b.com", displayName: "Ay", photoURL: "x" })
    )
    expect(result.current).toEqual({
      user: { uid: "u1", email: "a@b.com", displayName: "Ay" },
      loading: false,
    })
  })

  it("reacts to auth state changing while mounted", () => {
    const { result } = renderHook(() => useUser(), { wrapper: AuthProvider })
    act(() => authCallback({ uid: "u1", email: "a@b.com", displayName: "Ay" }))
    expect(result.current.user).not.toBeNull()
    act(() => authCallback(null))
    expect(result.current.user).toBeNull()
  })

  it("uses a single listener for multiple simultaneous consumers", () => {
    function TwoConsumers() {
      const a = useUser()
      const b = useUser()
      return <div>{a.user?.uid ?? "none"}-{b.user?.uid ?? "none"}</div>
    }
    render(
      <AuthProvider>
        <TwoConsumers />
      </AuthProvider>
    )
    act(() => authCallback({ uid: "u1", email: "a@b.com", displayName: "Ay" }))
    expect(onAuthStateChanged).toHaveBeenCalledTimes(1)
    expect(screen.getByText("u1-u1")).toBeInTheDocument()
  })

  it("unsubscribes on unmount", () => {
    const { unmount } = renderHook(() => useUser(), { wrapper: AuthProvider })
    unmount()
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1)
  })

  it("throws when used outside an AuthProvider", () => {
    expect(() => renderHook(() => useUser())).toThrow(
      "useUser must be used within an AuthProvider"
    )
  })
})
```

## Verification

- `npm test` (or `npx vitest run tests/hooks/useUser.test.tsx`) — new suite passes, existing suites (`Navbar`, `AuthForm`, `Avatar`) unaffected.
- `npm run lint` and `npm run build` — confirm the Server/Client Component boundary in `app/layout.tsx` compiles cleanly and no type errors from the new files.
- `npm run dev` — manually load a page in both route groups, confirm no runtime errors (no visible UI change is expected yet, since no component consumes `useUser()` for rendering).
