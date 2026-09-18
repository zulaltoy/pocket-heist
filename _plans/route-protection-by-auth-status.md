# Plan: Route Protection by Auth Status

## Context

Nothing currently stops an unauthenticated user from viewing `(dashboard)` pages (`/heists`, `/heists/[id]`, `/heists/create`) directly, or a logged-in user from viewing `(public)` pages (`/`, `/login`, `/signup`, `/preview`). Per the approved spec (`_specs/route-protection-by-auth-status.md`), this feature adds route protection at the group-layout level using the existing `useUser` hook: `(dashboard)` pages redirect to `/login` if there's no authenticated user, `(public)` pages redirect to `/heists` if there is one, and each layout shows a simple `Clock8` spinner while Firebase is still resolving auth status so neither protected nor public-only content ever flashes before the redirect fires. No redirect-back-to-original-URL, no loading timeout, and the splash page's own separate auth-gate TODO stay out of scope.

## Implementation

### 1. `app/(dashboard)/layout.tsx` — convert to a guarded Client Component

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// components
import Navbar from "@/components/Navbar";
import RouteLoader from "@/components/RouteLoader";

// hooks
import { useUser } from "@/hooks/useUser";

export default function HeistsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <RouteLoader />;
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
```
Render guard is `loading || !user` → spinner; only `!loading && user` renders `Navbar` + children, so there's no flash of dashboard content before the redirect fires. The `useEffect` deps (`[loading, user, router]`) mean this also reacts if `user` later flips to `null` while mounted (e.g. logout in another tab), for free.

This covers all nested dashboard routes (`heists/page.tsx`, `heists/[id]/page.tsx`, `heists/create/page.tsx`) since they all render under this one layout.

### 2. `app/(public)/layout.tsx` — mirror structure, inverted condition

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// components
import RouteLoader from "@/components/RouteLoader";

// hooks
import { useUser } from "@/hooks/useUser";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/heists");
    }
  }, [loading, user, router]);

  if (loading || user) {
    return <RouteLoader />;
  }

  return <main className="public">{children}</main>;
}
```
Keep the existing (slightly misleading) function name `RootLayout` as-is — renaming it is unrelated to this feature. Render guard is `loading || user` → spinner; only `!loading && !user` renders real children.

### 3. New shared component: `components/RouteLoader`

A tiny reusable component (matching this codebase's `ComponentName/ComponentName.tsx` + `index.ts` convention already used by `AuthForm`, `Navbar`, `LogoutButton`, `AuthProvider`, `Skeleton`), since both layouts need identical loading markup and duplicating it risks drift.

**`components/RouteLoader/RouteLoader.tsx`**
```tsx
import { Clock8 } from "lucide-react";

export default function RouteLoader() {
  return (
    <div className="center-content">
      <Clock8 size={40} strokeWidth={2.75} className="animate-spin" />
    </div>
  );
}
```
- No `"use client"` needed — purely presentational, no hooks/state.
- `size={40}` is explicit rather than reusing the `svg.logo` global class, since that class only sets `display: inline-block` (no dimensions) and normally gets its visible size from surrounding heading context (`<h1>` in the splash page, `size={14}` inline in `Navbar`) — `RouteLoader` renders standalone, so it needs its own explicit size.
- `.center-content` (existing global class in `app/globals.css`) handles full-viewport centering, same as the splash page.
- `animate-spin` is Tailwind v4's stock utility — confirmed available (no `tailwind.config`, unmodified `@import "tailwindcss";`, no corePlugins stripped).
- No `.module.css` needed.

**`components/RouteLoader/index.ts`**
```ts
export { default } from "./RouteLoader";
```

### 4. New tests

Following this repo's established mocking conventions: `vi.mock("@/hooks/useUser", ...)` (per `Navbar.test.tsx`/`LogoutButton.test.tsx`) and the `vi.hoisted` + `pushMock` pattern for `next/navigation` (per `AuthForm.test.tsx`, which already uses `useRouter`/`router.push` for its signup redirect).

**`tests/app/(dashboard)/layout.test.tsx`** (new — first layout test in the repo, mirrors `app/(dashboard)/layout.tsx`'s path per CLAUDE.md's "tests mirror source structure"):
- Mocks `next/navigation` (`pushMock`), `@/hooks/useUser`, and `@/lib/firebase` (needed transitively because `Navbar` → `LogoutButton` imports `auth` from it, regardless of which render branch is taken).
- Test 1: `loading: true` → loader shown, children/Navbar absent, `pushMock` not called.
- Test 2: `loading: false, user: null` → `pushMock` called with `"/login"`, children/Navbar absent.
- Test 3: `loading: false, user: {...}` → children + `Navbar`'s `<h1>` render, `pushMock` not called.

**`tests/app/(public)/layout.test.tsx`** (new, mirrors `app/(public)/layout.tsx`):
- Mocks `next/navigation` (`pushMock`) and `@/hooks/useUser` (no `@/lib/firebase` mock needed — this layout never renders `Navbar`).
- Test 1: `loading: true` → loader shown, children absent, `pushMock` not called.
- Test 2: `loading: false, user: {...}` → `pushMock` called with `"/heists"`, children absent.
- Test 3: `loading: false, user: null` → children render, `pushMock` not called.

Both import their layout via `@/app/(dashboard)/layout` / `@/app/(public)/layout`, which resolve fine via `tsconfig.json`'s `"@/*": ["./*"]` path alias and `vitest.config.mts`'s `tsconfigPaths()` plugin (confirmed present).

### 5. No changes needed

- `hooks/useUser.ts`, `components/AuthProvider` — already expose exactly `{ user, loading }` and already wrap the whole app in the true root `app/layout.tsx`; nothing here requires modification.
- All page files (`app/(public)/page.tsx`, `login/page.tsx`, `signup/page.tsx`, `preview/page.tsx`, `app/(dashboard)/heists/page.tsx`, `heists/[id]/page.tsx`, `heists/create/page.tsx`) stay plain Server Components — a Server Component page can render as `children` of a Client Component layout with no changes needed on the page side.
- `components/Navbar`, `components/LogoutButton` — unaffected, `Navbar` continues to be rendered only from `(dashboard)/layout.tsx`.

## Verification

1. `npx vitest run "tests/app/(dashboard)/layout.test.tsx" "tests/app/(public)/layout.test.tsx"`
2. `npm test` — full suite, confirm no regressions in `Navbar`/`LogoutButton`/`AuthForm`/`useUser` tests.
3. `npm run lint`
4. `npm run build` — confirms the Server→Client Component layout boundary compiles cleanly.
5. Manual (`npm run dev`):
   - Logged out, visit `/heists` directly → brief spinner, then redirected to `/login`; dashboard content never visibly renders.
   - Logged in, visit `/login` or `/signup` directly → brief spinner, then redirected to `/heists`.
   - Logged in, visit `/heists` → brief spinner, then normal dashboard page with `Navbar`.
   - Logged out, visit `/`, `/login`, `/signup`, `/preview` → brief spinner on first load while Firebase resolves, then normal public content, no redirect.
   - Log out in one tab while sitting on `/heists` in another → confirm the second tab auto-redirects to `/login` shortly after (free side effect of the `useEffect` dependency array).
