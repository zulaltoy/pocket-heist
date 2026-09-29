# Plan: useHeists Hook

## Context
`_specs/use-heists-hook.md` (branch `claude/feature/use-heists-hook`, already checked out) calls for a `useHeists(mode)` hook. The hook gives real-time access to the Firestore `heists` collection. `mode` is one of:
- `'active'` — heists assigned to me, deadline in the future.
- `'assigned'` — heists I created, deadline in the future.
- `'expired'` — heists whose deadline has passed and whose `finalStatus` is set, for every user; newest first.

`app/(dashboard)/heists/page.tsx` already has the three section headings. It is currently a static Server Component with no data under them. The goal is to render each result set's titles under its heading.

Decisions from the spec's answered Open Questions:
- Assume the user is authenticated. `app/(dashboard)/layout.tsx` already guarantees this before children render.
- No result limit and no pagination.
- Loading and error are separate return values.
- Expired heists are sorted most recent first.

## Approach
- **Current user:** `hooks/useHeists.ts` (`"use client"`) reads `user` from the existing `useUser()` (`hooks/useUser.ts`).
- **Query:** built per mode on `collection(db, COLLECTIONS.HEISTS).withConverter(heistConverter)`. This reuses `db` from `lib/firebase.ts` and `COLLECTIONS` / `heistConverter` / `Heist` from `@/types/firestore`, so `deadline` and `createdAt` arrive as `Date`s.
  - **active:** `where("assignedTo", "==", uid)`, `where("deadline", ">", now)`, `orderBy("deadline", "asc")`
  - **assigned:** `where("createdBy", "==", uid)`, `where("deadline", ">", now)`, `orderBy("deadline", "asc")`
  - **expired:** `where("deadline", "<=", now)`, `where("finalStatus", "!=", null)`, `orderBy("deadline", "desc")`
  - `now = new Date()`, captured when the effect runs, as the spec says. A range filter makes Firestore order by `deadline` anyway, so `'active'` and `'assigned'` sort soonest-deadline first at no extra cost.
  - Inequality filters on two different fields (the `'expired'` query) are supported by Firestore in SDK v12. They need a composite index, which is added below.
- **Listening:** `useEffect` keyed on `[mode, user?.uid]` subscribes with `onSnapshot(q, next, error)` and returns the unsubscribe function.
  - If `mode` is `'active'` or `'assigned'` and there is no user, it returns early without subscribing.
  - `next` sets `heists = snap.docs.map(d => d.data())`, `loading = false` and `error = null`.
  - `error` sets `error = err`, `loading = false` and `heists = []`, and never throws.
- **Return value:** `{ heists: Heist[], loading: boolean, error: FirestoreError | null }`.
- **Page:** `/heists` becomes a Client Component because it calls the hook.
  - It calls `useHeists` three times and renders a `<ul>` of `<li>{heist.title}</li>` under each existing heading.
  - The welcome text, headings and class names stay unchanged.
  - Each section shows a simple "Loading..." while it loads, and a short message when its list is empty or failed to load.

## Files to change

**New: `hooks/useHeists.ts`**
```ts
"use client";

import { useEffect, useState } from "react";
import {
  collection, onSnapshot, orderBy, query, where,
  type FirestoreError, type Query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUser } from "@/hooks/useUser";
import { COLLECTIONS, heistConverter, type Heist } from "@/types/firestore";

export type HeistsMode = "active" | "assigned" | "expired";

function buildQuery(mode: HeistsMode, uid: string | undefined, now: Date): Query<Heist> | null {
  const heists = collection(db, COLLECTIONS.HEISTS).withConverter(heistConverter);
  switch (mode) {
    case "active":
      return uid ? query(heists, where("assignedTo", "==", uid), where("deadline", ">", now), orderBy("deadline", "asc")) : null;
    case "assigned":
      return uid ? query(heists, where("createdBy", "==", uid), where("deadline", ">", now), orderBy("deadline", "asc")) : null;
    case "expired":
      return query(heists, where("deadline", "<=", now), where("finalStatus", "!=", null), orderBy("deadline", "desc"));
  }
}

export function useHeists(mode: HeistsMode) {
  const { user } = useUser();
  const uid = user?.uid;
  const [heists, setHeists] = useState<Heist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    const q = buildQuery(mode, uid, new Date());
    if (!q) return;
    return onSnapshot(
      q,
      (snap) => { setHeists(snap.docs.map((d) => d.data())); setError(null); setLoading(false); },
      (err) => { console.error(err); setHeists([]); setError(err); setLoading(false); },
    );
  }, [mode, uid]);

  return { heists, loading, error };
}
```
- `heistConverter.toFirestore` takes `Partial<Heist>`. If `withConverter` needs a `FirestoreDataConverter<Heist>` type, tighten the converter's type in `types/firestore/heist.ts` (for example with `satisfies FirestoreDataConverter<Heist>`) and don't change its behaviour.
- Use the `firestore-schemas` skill for this.

**Modify: `app/(dashboard)/heists/page.tsx`**
- Add `"use client"` and import `useHeists`.
- Call `const active = useHeists("active")`, and the same for `assigned` and `expired`.
- Under each `<h2>`, render a small local helper, `HeistTitles({ heists, loading, error })`, defined in the same file:
  - `loading` → `<p>Loading...</p>`
  - `error` → `<p>Couldn't load heists.</p>`
  - empty list → `<p>No heists here yet.</p>`
  - otherwise `<ul>` with `heists.map(h => <li key={h.id}>{h.title}</li>)`
- No new styling.

**Modify: `firestore.indexes.json`**
- Replace `"indexes": []` with three composite indexes on collection `heists` (`queryScope: "COLLECTION"`):
  1. `assignedTo` ASC, `deadline` ASC
  2. `createdBy` ASC, `deadline` ASC
  3. `deadline` DESC, `finalStatus` DESC. This follows Firestore's implicit ordering: the explicit orderBy first, then the other inequality field in the same direction. If the console's error link suggests a different order, use that.

**No change:**
- `firestore.rules`: the current open rule until 2026-10-11 already allows the expired query.
- `useUser`, `AuthProvider`, the dashboard layout, `Navbar`.

## Tests

**New: `tests/hooks/useHeists.test.tsx`**
- Mock `firebase/firestore`:
  - `collection` returns `{ withConverter: () => ({ name }) }`.
  - `query`, `where` and `orderBy` are `vi.fn` that return descriptive objects, e.g. `where: (f, op, v) => ({ where: [f, op, v] })`.
  - `onSnapshot` captures the `next` / `error` callbacks and returns `unsubscribeSpy`.
- Mock `@/lib/firebase` → `{ db: {} }`, and mock `@/hooks/useUser` with a mutable user (the pattern in `tests/components/CreateHeistForm.test.tsx`).
- Cases:
  1. `'active'`: `where` is called with `("assignedTo", "==", "me")` and `("deadline", ">", expect.any(Date))`.
  2. `'assigned'`: uses `createdBy`.
  3. `'expired'`: uses `("deadline", "<=", …)`, `("finalStatus", "!=", null)` and `orderBy("deadline", "desc")`, and no uid filter.
  4. Starts with `loading: true`. After `next({ docs: [{ data: () => heist }] })`, it returns `[heist]` and `loading: false`.
  5. With no user, `'active'` and `'assigned'` never call `onSnapshot`.
  6. `unmount()` calls `unsubscribeSpy`.
  7. The error callback sets `error` and `loading: false`.

**New: `tests/app/(dashboard)/heists/page.test.tsx`**
- Mock `@/hooks/useHeists` so it returns a different fixed heist list per mode.
- Check that each title renders inside its matching section, found with `within` on the heading's parent container.
- Check that the empty and loading messages appear.

## Verification
1. `npm test`: the new and existing suites pass.
2. `npm run lint` and `npm run build`: no type or lint errors, including the React hooks rules.
3. Deploy the indexes with `firebase deploy --only firestore:indexes` (or the Firebase MCP). This is an outward-facing change, so confirm with the user first.
4. Manual check with `npm run dev` on `/heists` while logged in:
   - Create a heist assigned to another user → it appears under "Heists You've Assigned" without a reload.
   - Log in as that user → it appears under "Your Active Heists".
   - Set a past `deadline` and a `finalStatus` on a heist in the Firestore console → it appears under "All Expired Heists", newest first.
   - Check the browser console for "requires an index" errors.
