# Plan: Firebase Signup + Codename Generation

## Context
`_specs/firebase-signup-codename.md` (branch `claude/feature/firebase-signup-codename`, already checked out) specs out wiring the existing signup form (`AuthForm` in `mode="signup"`) to real Firebase Authentication — it currently only `console.log`s the entered email/password. On successful signup, a random "codename" (one word from each of three distinct word sets, PascalCase, no separator — e.g. `SneakyInternStapler`) should become the user's Firebase `displayName`, and a Firestore `users/{uid}` document should store only `{ codename, id }` — never the email. Only the client Firebase Web SDK is used (already configured in `lib/firebase.ts`, exporting `auth`/`db`) — no Admin SDK, no server actions.

The spec's resolved Open Questions lock in:
- Word sets live in a **new dedicated file**, not inline in the component.
- If `updateProfile`/Firestore write fails *after* the Auth account was already created: **log the error only** — no retry, no rollback of the auth account.
- **No codename-uniqueness check** against Firestore.
- Firebase Auth errors need at least password-strength and email-related messages mapped to friendly text; implementer's call on exact wording.
- Show a loading state during signup; redirect to `/heists` on success.
- `mode="login"` is explicitly **out of scope** and must be left exactly as it is today.

Nothing in the codebase yet has an error/alert UI pattern, or uses `next/navigation`'s `useRouter` — this feature establishes both, following the CSS Modules `@apply` convention already used in `AuthForm.module.css` and the `vi.mock` Firebase-mocking pattern already established in `tests/hooks/useUser.test.tsx`.

## Approach
A pure, dependency-free `generateCodename()` in a new `lib/codename.ts` produces the codename from three exported word-set arrays (so tests can build an exact regex from the real lists instead of mocking `Math.random`). `AuthForm.tsx`'s `handleSubmit` branches on `mode`: `login` stays byte-for-byte identical to today; `signup` becomes async and does `createUserWithEmailAndPassword` → generate codename → best-effort `updateProfile` + Firestore `setDoc` (failures here are caught, logged, and non-blocking since the account already exists) → `router.push("/heists")`, with a top-level catch mapping Firebase Auth error codes to an `errorMessage` shown in the UI, and an `isSubmitting` flag disabling the submit button (which also guards against double-submission).

## Files to change

**New: `lib/codename.ts`**
- Three word-set arrays (~8 words each, office-heist/cute tone matching the app's "Tiny missions. Big office mischief." tagline), exported as `CODENAME_WORD_SETS` so tests can validate composition without mocking randomness.
- `generateCodename()`: picks one random word from each set, joins with no separator.

**Modify: `components/AuthForm/AuthForm.module.css`**
- Add `.errorMessage { @apply text-sm text-error mt-2; }` (uses the existing `--color-error` theme token — first usage in the repo).
- Extend `.submitButton` with `disabled:opacity-50 disabled:cursor-not-allowed`.

**Modify: `components/AuthForm/AuthForm.tsx`**
- New imports: `useRouter` (`next/navigation`), `createUserWithEmailAndPassword`/`updateProfile` (`firebase/auth`), `doc`/`setDoc` (`firebase/firestore`), `auth`/`db` (`@/lib/firebase`), `generateCodename` (`@/lib/codename`).
- New state: `isSubmitting`, `errorMessage`.
- `handleSubmit` becomes `async`; `mode === "login"` branch is untouched; `mode === "signup"` branch: reset error, set submitting, `try { create user → generate codename → try { updateProfile + setDoc(doc(db,"users",uid), {codename, id: uid}) } catch { console.error } → router.push("/heists") } catch (e) { setErrorMessage(mapped) } finally { clear submitting }`.
- Local `getSignupErrorMessage(error)` helper mapping `auth/email-already-in-use`, `auth/invalid-email`, `auth/weak-password`, and a generic fallback to user-facing strings.
- Submit button: for signup, `disabled={isSubmitting}` and label becomes `"Signing Up..."` while submitting; login button unchanged.
- Render `{errorMessage && <p className={styles.errorMessage} role="alert">{errorMessage}</p>}` above the submit button — only ever populated on the signup path.

No changes expected to `app/(public)/signup/page.tsx`, `components/AuthProvider/`, or `hooks/useUser.ts` (unrelated to this direct-Firebase-call flow).

## Tests

**New: `tests/lib/codename.test.ts`**
- `generateCodename()` matches a regex built from the real exported word sets (proves 3-word PascalCase composition without brittle `Math.random` mocking).
- Many calls (e.g. 30) produce more than one distinct value.

**Modify: `tests/components/AuthForm.test.tsx`**
- Add `vi.mock` for `next/navigation` (via `vi.hoisted` for the `push` spy), `firebase/auth`, `firebase/firestore`, `@/lib/firebase`, and `@/lib/codename` (deterministic return value), following the pattern already used in `tests/hooks/useUser.test.tsx`.
- Replace the existing `"logs the entered values on signup submit"` test with:
  1. Successful signup — asserts `createUserWithEmailAndPassword(auth, email, password)`, `updateProfile(user, {displayName: codename})`, `setDoc` payload is *exactly* `{codename, id}` (no `email` key), and `router.push("/heists")`.
  2. `auth/email-already-in-use` rejection — mapped message shown, no redirect, no `updateProfile`/`setDoc` calls.
  3. `auth/weak-password` rejection — weak-password-specific message shown.
  4. Loading state — button disabled + shows "Signing Up..." while the create-user promise is pending.
  5. Post-auth failure (`updateProfile`/`setDoc` rejects after successful account creation) — `console.error` called, but `router.push("/heists")` still fires and no `errorMessage` is shown (matches the spec's "log only, no rollback" decision).
- Leave `"logs the entered values on login submit"` and all other existing tests untouched.

## Verification
- `npx vitest run tests/lib/codename.test.ts tests/components/AuthForm.test.tsx` (then full `npm test`) — new/updated suites pass, nothing else regresses.
- `npm run lint` — no new errors (the pre-existing unrelated error in `app/(dashboard)/heists/page.tsx` is out of scope).
- `npm run build` — confirms no TypeScript issues across the new/modified files.
- `npm run dev` — manually visit `/signup`, submit with a fresh email/password and confirm redirect to `/heists`; check the Firebase console (or emulator) for the created Auth user's `displayName` and the corresponding `users/{uid}` Firestore doc (codename + id only, no email); retry with the same email to confirm the "already in use" error renders inline.
