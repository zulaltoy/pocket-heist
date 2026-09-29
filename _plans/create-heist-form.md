# Plan: Create Heist Form

## Context
`_specs/create-heist-form.md` (branch `claude/feature/create-heist-form`, already checked out) specs out the form on `app/(dashboard)/heists/create/page.tsx`. Right now that page only renders a heading. The finished form should:
- let a logged-in user enter a **title** and a **description**, and pick an **assignee** from a plain dropdown;
- write a `CreateHeistInput` document to the Firestore `heists` collection;
- redirect to `/heists`.

These fields are set in code, never by the user:
- `createdBy` and `createdByCodename` come from the logged-in user.
- `createdAt` is `serverTimestamp()`.
- `deadline` is the browser's current time + `HEIST_DURATION_MS` (48 hours).
- `finalStatus` is `null`.

Decisions settled in the spec's answered Open Questions:
- The logged-in user is left out of the dropdown.
- If there are no other users, a message is shown **instead of** the form.
- There is no confirmation dialog, no success toast and no length limits.
- The deadline can't be edited.

## Approach
- **Keep the page a Server Component** and add a new client component, `CreateHeistForm`, that holds all the interactivity, following the same pattern as `AuthForm`.
- **Current user:** `app/(dashboard)/layout.tsx` already guarantees a logged-in user before any child renders, so the form reads the user from `useUser()`.
- **Loading users:** on mount, the form fetches the `users` collection with `getDocs`. Those docs have the shape `{ id, codename }`, as written by `AuthForm` at signup.
- **Dropdown options:** the current user is filtered out of the fetched list.
- **Creator's codename:** taken from the current user's own `users` doc, falling back to `user.displayName`. The fallback matters because the auth context can hold `displayName: null` right after signup, since `updateProfile` runs after `onAuthStateChanged` fires.
- **Submit:** trim the fields and check them, build a `CreateHeistInput`, then call `addDoc(collection(db, COLLECTIONS.HEISTS), payload)` and `router.push("/heists")`.
- **Loading, error and submit states:** the same `isSubmitting` / `errorMessage` pattern and `role="alert"` markup as `AuthForm.tsx`.

## Files to change

**New: `types/firestore/user.ts`**
- Add `export interface User { id: string; codename: string }` for documents in the `users` collection.
- Use the `firestore-schemas` skill conventions while writing it.

**Modify: `types/firestore/index.ts`**
- Add `export * from "./user"`.
- Add `USERS: "users"` to `COLLECTIONS`.

**New: `components/CreateHeistForm/CreateHeistForm.tsx`** (`"use client"`), plus an `index.ts` barrel
- **Imports:**
  - `useRouter` from `next/navigation`
  - `collection`, `getDocs`, `addDoc`, `serverTimestamp` from `firebase/firestore`
  - `db` from `@/lib/firebase`
  - `useUser` from `@/hooks/useUser`
  - `COLLECTIONS`, `HEIST_DURATION_MS`, `CreateHeistInput`, `User` from `@/types/firestore`
- **State:**
  - `users: User[]`
  - `usersLoading`
  - `usersError`
  - `isSubmitting`
  - `errorMessage`
- **`useEffect`:** calls `getDocs(collection(db, COLLECTIONS.USERS))`, maps the docs to `User` and skips any doc without a `codename`. On failure it sets `usersError`.
- **Derived values:**
  - `assignees = users.filter(u => u.id !== user.uid)`
  - `creatorCodename = users.find(u => u.id === user.uid)?.codename ?? user.displayName ?? ""`
- **What renders:**
  1. While users are loading: a "Loading agents..." status.
  2. If loading failed: an error message, and no form.
  3. If `assignees` is empty: a message such as "No other agents to assign a heist to yet.", and no form.
  4. Otherwise the form:
     - `title` text input
     - `description` textarea
     - `assignedTo` `<select>` with a disabled placeholder option, then one option per assignee (value is the uid, label is the codename)
     - all three fields `required`
- **`handleSubmit`:**
  1. Call `preventDefault` and read the values with `FormData`.
  2. Trim the title and description.
  3. If any field is empty after trimming, set `errorMessage` ("Please fill in all fields.") and return without writing.
  4. Look up the chosen assignee.
  5. Build the `CreateHeistInput` payload: `createdAt: serverTimestamp()`, `deadline: new Date(Date.now() + HEIST_DURATION_MS)`, `finalStatus: null`.
  6. Inside `try`: `await addDoc(...)`, then `router.push("/heists")`.
  7. In `catch`: show a generic friendly error. The form's values stay because the inputs are uncontrolled and nothing resets them.
  8. In `finally`: clear `isSubmitting`.
- **Submit button:** `disabled={isSubmitting}`, and the label changes from "Create Heist" to "Creating...".

**New: `components/CreateHeistForm/CreateHeistForm.module.css`**
- Copy the relevant rules from `AuthForm.module.css`, using the same `@reference "../../app/globals.css"` pattern:
  - `.form`, `.field`, `.input`, `.submitButton`, `.errorMessage`
- Add `.textarea` (the `.input` styles plus `min-h-32 resize-y`), a style for the `select` element, and `.statusMessage`.

**Modify: `app/(dashboard)/heists/create/page.tsx`**
- Render `<CreateHeistForm />` under the existing heading.
- The page stays a Server Component.

## Tests

**New: `tests/components/CreateHeistForm.test.tsx`**
- **Mocks,** following the setup in `tests/components/AuthForm.test.tsx`:
  - `next/navigation`: hoisted `pushMock`
  - `firebase/firestore`: `collection`, `getDocs`, `addDoc`, and `serverTimestamp` returning a sentinel
  - `@/lib/firebase`
  - `@/hooks/useUser`: returns `{ user: { uid: "me", displayName: "MeCodename" }, loading: false }`
- **Cases:**
  1. Renders the title, description and assignee fields. The dropdown lists the other users' codenames and leaves out the current user.
  2. A valid submit calls `addDoc` with:
     - the trimmed title and description
     - `createdBy: "me"` and the creator's codename
     - the assignee's id and codename
     - the `serverTimestamp` sentinel
     - `finalStatus: null`
     - a `deadline` 48 hours after a fixed time (freeze it with `vi.useFakeTimers`/`setSystemTime`, or check it with `expect.any(Date)` plus a time-range check)

     Then it redirects to `/heists`.
  3. A title or description that is only whitespace, or no selected assignee, means `addDoc` is not called and an error is shown.
  4. While `addDoc` is pending, the button is disabled and shows "Creating...".
  5. When `addDoc` rejects, an error message is shown and there is no redirect.
  6. When `getDocs` returns only the current user, the empty-state message is shown and no form is rendered.

## Verification
1. `npx vitest run tests/components/CreateHeistForm.test.tsx`, then the full `npm test` run.
2. `npm run lint` and `npm run build`, to catch type errors, for example the payload not matching `CreateHeistInput`.
3. `npm run dev`:
   - Log in with one account and open `/heists/create`. Check that the dropdown lists other users and not yourself.
   - Submit the form and check that you're redirected to `/heists`.
   - In the Firebase console, or with the Firebase MCP `firestore_list_documents` on `heists`, check that the new document has every field, a server `createdAt`, and a `deadline` about 48 hours later.
   - Check that Firestore security rules allow reading `users` and creating documents in `heists`.

