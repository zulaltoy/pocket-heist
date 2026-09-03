# Plan: Login/Signup Authentication Forms

## Context

`_specs/login-signup-forms.md` specs out authentication forms for the existing `/login` and `/signup` stub pages (`app/(public)/login/page.tsx`, `app/(public)/signup/page.tsx`) — currently each renders only a bare `.form-title` heading, no inputs. The app has no real authentication yet (per `CLAUDE.md`), so for now these forms should only `console.log` the entered email/password on submit, with a password-visibility toggle and an easy way to switch between the two forms. This plan implements exactly that, resolving the spec's Open Questions as already answered there: blank state on switch, `lucide-react` `Eye`/`EyeOff` icons, native-only HTML5 validation, and real URL navigation (`/login` ↔ `/signup`) for switching.

The codebase has zero existing form/password code and zero `useState` usage anywhere — this is genuinely new ground, built to match the repo's established 3-file component convention (seen in `components/Avatar/`, `components/Skeleton/`).

## Approach

**One shared `AuthForm` component, driven by a `mode: "login" | "signup"` prop**, rather than two separate components. The email/password/toggle/submit/switch-link markup and logic are identical between login and signup; only 4 leaf strings differ (submit label, console-log tag, switch prompt, switch target). A `mode` prop plus a small lookup object is the minimal parametrization — not premature abstraction, since both call sites exist right now.

**Uncontrolled inputs + `FormData` on submit**, with `useState` reserved only for `showPassword`. Nothing in the spec needs live-read email/password state (no cross-field validation, no confirm-password). Reading values once via `FormData` on submit avoids two unnecessary `useState`/`onChange` pairs. `showPassword` is the only value that actually drives a re-render (icon swap + `type` attribute).

This makes `AuthForm` the first Client Component in the repo (`"use client"`) — necessary since it uses `useState`/`onClick`; the two page files stay Server Components and just import/render it.

## Files to change

**New: `components/AuthForm/AuthForm.tsx`**
```tsx
"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import styles from "./AuthForm.module.css"

interface AuthFormProps {
  mode: "login" | "signup"
}

const CONFIG = {
  login: {
    submitLabel: "Log In",
    logTag: "Login form submitted:",
    switchPrompt: "Need an account?",
    switchLinkText: "Sign up",
    switchHref: "/signup",
  },
  signup: {
    submitLabel: "Sign Up",
    logTag: "Signup form submitted:",
    switchPrompt: "Already have an account?",
    switchLinkText: "Log in",
    switchHref: "/login",
  },
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const { submitLabel, logTag, switchPrompt, switchLinkText, switchHref } = CONFIG[mode]

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    console.log(logTag, {
      email: formData.get("email"),
      password: formData.get("password"),
    })
  }

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className={styles.input} />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <div className={styles.passwordField}>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className={styles.input}
            />
            <button
              type="button"
              className={styles.toggleButton}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button type="submit" className={`btn ${styles.submitButton}`}>
          {submitLabel}
        </button>
      </form>
      <p className={styles.switchRow}>
        {switchPrompt}{" "}
        <Link href={switchHref} className={styles.switchLink}>
          {switchLinkText}
        </Link>
      </p>
    </>
  )
}
```

**New: `components/AuthForm/AuthForm.module.css`**
```css
@reference "../../app/globals.css";

.form {
  @apply flex flex-col gap-4;
}
.field {
  @apply flex flex-col gap-1;
}
.field label {
  @apply text-sm font-medium text-heading;
}
.input {
  @apply w-full rounded-md border border-lighter bg-light px-3 py-2 text-body focus:outline-none focus:border-primary;
}
.passwordField {
  @apply relative flex items-center;
}
.passwordField input {
  @apply pr-10;
}
.toggleButton {
  @apply absolute right-2 flex items-center justify-center text-body hover:text-heading transition-colors;
}
.submitButton {
  @apply w-full mt-2;
}
.switchRow {
  @apply text-center text-sm mt-4;
}
.switchLink {
  @apply text-primary hover:text-secondary underline-offset-2 hover:underline;
}
```
The global `.btn` class is applied as a plain string alongside the module class (`` `btn ${styles.submitButton}` ``) — same pattern `Navbar.tsx` uses for its `Link` CTA, since `.btn` is a non-utility custom class not reliably reachable via `@apply` from another module.

**New: `components/AuthForm/index.ts`**
```ts
export { default } from "./AuthForm"
```

**Modify: `app/(public)/login/page.tsx`** — fix the pre-existing copy-paste bug (function is misnamed `SignupPage`) and render the form:
```tsx
import AuthForm from "@/components/AuthForm"

export default function LoginPage() {
  return (
    <div className="center-content">
      <div className="page-content">
        <h1 className="form-title">Log in to Your Account</h1>
        <AuthForm mode="login" />
      </div>
    </div>
  )
}
```

**Modify: `app/(public)/signup/page.tsx`** — add the form (function name already correct):
```tsx
import AuthForm from "@/components/AuthForm"

export default function SignupPage() {
  return (
    <div className="center-content">
      <div className="page-content">
        <h2 className="form-title">Signup for an Account</h2>
        <AuthForm mode="signup" />
      </div>
    </div>
  )
}
```

No changes needed to `app/globals.css`, `tsconfig.json`, or `vitest.config.mts` — all existing tokens/utilities/aliases/test setup already cover this feature.

## Tests

**New: `tests/components/AuthForm.test.tsx`**, following the existing `Avatar.test.tsx`/`Navbar.test.tsx` style (explicit `vitest`/`@testing-library/react` imports despite `globals: true`, `// component imports` comment, `getByRole`/`getByLabelText` queries, no test ids/snapshots). First use of `@testing-library/user-event` (already a devDependency, unused elsewhere) and `vi.spyOn` in the repo.

Cases, mapped to the spec's Testing Guidelines:
1. Both modes render email field, password field, visibility-toggle button, and a submit button with the correct label (`"Log In"` / `"Sign Up"`).
2. Clicking the toggle flips the password input's `type` between `password`/`text` and the toggle button's accessible name between `"Show password"`/`"Hide password"` (click again to confirm it reverts).
3. Typing values and submitting (`vi.spyOn(console, "log")`) asserts `console.log` was called with the mode-specific tag and `{ email, password }` — for both modes.
4. The switch link is present with the correct text and `href` for each mode (`/signup` from login, `/login` from signup).

## Verification

- `npm test` (or `npx vitest run tests/components/AuthForm.test.tsx`) — new suite passes, existing suites unaffected.
- `npm run lint` — no new lint errors (unused imports, missing `key`s, etc.).
- `npm run dev` and manually visit `http://localhost:3000/login` and `/signup`: confirm both forms render, the eye icon toggles password visibility, submitting logs to the browser console with no navigation/errors, and the switch link moves between the two routes with fields reset.
