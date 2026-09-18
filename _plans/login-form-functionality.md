# Plan: Wire Up Real Login Authentication (Login Form Functionality)

## Context

The login form at `app/(public)/login/` (rendered via `components/AuthForm/AuthForm.tsx` with `mode="login"`) currently doesn't authenticate anyone — on submit it just `console.log`s the entered email/password and returns. The sibling `mode="signup"` path already authenticates for real via Firebase (`createUserWithEmailAndPassword`), sets a codename, and redirects to `/heists`.

Per the approved spec (`_specs/login-form-functionality.md`), this feature makes the login form actually authenticate against Firebase using the account's existing credentials, and — unlike signup — shows a generic in-place success message ("Login successful.") with **no redirect**. Incorrect credentials show a friendly error message instead. The submit button gets a loading/disabled state consistent with signup, and any previous success/error message clears on resubmit. Rate limiting and user-specific success text are explicitly out of scope.

Since this touches a Firebase Auth API (`signInWithEmailAndPassword`) that isn't used elsewhere in the codebase yet, implementation should start by checking Firebase Auth docs via the Context7 MCP server (per this repo's CLAUDE.md requirement to check lib/framework docs before writing framework-specific code) to confirm current `signInWithEmailAndPassword` usage and the error codes it throws (notably whether `auth/invalid-credential` is indeed the unified code for wrong-password/unknown-email, as opposed to legacy `auth/wrong-password` / `auth/user-not-found`).

## Implementation

### 1. `components/AuthForm/AuthForm.tsx`

- **Import**: add `signInWithEmailAndPassword` to the existing `firebase/auth` import (line 7), alongside `createUserWithEmailAndPassword` and `updateProfile`.
- **`CONFIG` object** (lines 17-32): replace the now-unused `logTag` field (its only consumer, the login `console.log`, is being removed) with a `submittingLabel` field per mode:
  - `login.submittingLabel: "Logging In..."`
  - `signup.submittingLabel: "Signing Up..."`
  Update the destructure at line 53 to pull `submittingLabel` instead of `logTag`.
- **New error-mapping helper**, placed after `getSignupErrorMessage` (lines 34-46), mirroring its exact shape:
  ```
  function getSigninErrorMessage(error: unknown): string {
    const code = (error as { code?: string })?.code;
    switch (code) {
      case "auth/invalid-credential":
        return "Incorrect email or password. Please try again.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
  ```
  Confirm the exact error code(s) via Context7/Firebase Auth docs before finalizing this switch — adjust cases if the installed SDK version returns legacy codes (`auth/wrong-password`, `auth/user-not-found`) instead of the unified `auth/invalid-credential`.
- **State** (lines 49-51): add `const [successMessage, setSuccessMessage] = useState<string | null>(null);` alongside `errorMessage`.
- **`handleSubmit` login branch** (lines 62-65): replace the `console.log` + early `return` with:
  ```
  if (mode === "login") {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccessMessage("Login successful.");
    } catch (error) {
      setErrorMessage(getSigninErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
    return;
  }
  ```
  No `router.push` call — this is the explicit no-redirect requirement. Keep the mode branches independent (don't merge into the signup logic below); each manages its own state reset, matching the existing structure.
- **Submit button JSX** (lines 136-142): generalize from the signup-only gate to cover both modes:
  ```
  <button
    type="submit"
    className={`btn ${styles.submitButton}`}
    disabled={isSubmitting}
  >
    {isSubmitting ? submittingLabel : submitLabel}
  </button>
  ```
- **Success message JSX**: add right after the existing `errorMessage` block (lines 131-135):
  ```
  {successMessage && (
    <p className={styles.successMessage} role="status">
      {successMessage}
    </p>
  )}
  ```
  Use `role="status"` (not `role="alert"`) since it's a polite confirmation, not an error.

### 2. `components/AuthForm/AuthForm.module.css`

Add, right after `.errorMessage` (line 29):
```css
.successMessage {
  @apply text-sm text-success mt-2;
}
```
`--color-success: #05DF72` already exists in `app/globals.css`'s `@theme` block, so `text-success` is a ready-to-use utility — no token changes needed.

### 3. `tests/components/AuthForm.test.tsx`

- Add `signInWithEmailAndPassword` to both the import (line 5) and the `vi.mock("firebase/auth", ...)` factory (lines 16-19), as `vi.fn()`.
- **Remove** the now-obsolete test `"logs the entered values on login submit"` (lines 82-95).
- **Add** new tests in its place, following the file's existing patterns exactly (mocked module functions via `vi.mocked(...)`, `userEvent`, `findByText`/`queryByText`, `waitFor`, asserting `pushMock` where redirect matters):
  1. **Successful login** — mock `signInWithEmailAndPassword` to resolve; submit valid credentials; assert `"Login successful."` appears via `findByText`, assert it was called with `({}, email, password)`, and assert `pushMock` was **not** called (proves no redirect).
  2. **Invalid credentials** — mock rejection with `{ code: "auth/invalid-credential" }`; assert the mapped error text appears via `findByText`, assert `"Login successful."` is absent via `queryByText`, assert `pushMock` not called.
  3. **Loading state** — mirror the existing `"disables the submit button and shows a loading label while signing up"` test (lines 163-182): defer the mocked promise, submit, assert the button shows `"Logging In..."` and is disabled, then resolve and assert it re-enables.
  4. **Resubmit clears previous message** — chain `mockRejectedValueOnce` then `mockResolvedValueOnce`; submit once to produce the error, confirm it renders; submit again with corrected input, confirm the error is gone and `"Login successful."` now shows. This directly covers the spec's "clears previous message on resubmit" acceptance criterion.
- No changes needed to any existing signup tests — `submittingLabel` for signup evaluates to the same `"Signing Up..."` string already asserted.

### 4. No changes needed

- **`lib/firebase.ts`** — only exports the initialized `auth`/`db` instances; `signInWithEmailAndPassword` is imported directly from the `firebase/auth` package, same as `createUserWithEmailAndPassword` already is.
- **`app/(public)/login/page.tsx`** — just renders `<AuthForm mode="login" />`; all new behavior lives inside `AuthForm`.

## Verification

1. Run the new/updated test file directly: `npx vitest run tests/components/AuthForm.test.tsx`.
2. Run the full suite to confirm no regressions elsewhere: `npm test`.
3. Run `npm run lint` to catch any unused-import or type issues (e.g. confirm `logTag` removal didn't leave dead references).
4. Manual spot-check with `npm run dev` at `/login`:
   - Create a real test account via `/signup` first (no seed data exists), then attempt login with those exact credentials — confirm "Login successful." appears in place and the page does not navigate away.
   - Attempt login with a wrong password and with a non-existent email — confirm the friendly error message appears (not a raw Firebase error), and note whether the real project's Firebase Auth settings produce `auth/invalid-credential` or a legacy code, adjusting the error-mapping switch if needed.
   - Watch the submit button during a live request to confirm the disabled/loading state.
   - Trigger an error, then resubmit successfully — confirm the error message is replaced by the success message rather than both showing at once.
