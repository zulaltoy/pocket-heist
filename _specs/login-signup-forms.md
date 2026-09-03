# Spec for Login and Signup Authentication Forms
branch: claude/feature/login-signup-forms

## Summary

Add authentication forms to the existing `/login` and `/signup` pages within `app/(public)/`. These forms collect an email and password, let the user toggle password visibility, and submit via a labeled button. Since real authentication is not yet implemented in this app, submitting a form only logs the entered details to the console rather than calling any backend or API. Users should be able to move easily between the login and signup forms without a jarring page-level context switch.

## Functional Requirements

- The `/login` page displays a form with:
  - An email input field
  - A password input field
  - A "hide/show password" icon or control that toggles the password field between masked and plain text
  - A submit button labeled for login (e.g. "Log In")
- The `/signup` page displays the equivalent form with:
  - An email input field
  - A password input field
  - The same "hide/show password" toggle behavior
  - A submit button labeled for signup (e.g. "Sign Up")
- Submitting either form (with the browser's default required-field validation satisfied) logs the entered email and password to the console. No network request, redirect, or persisted state occurs.
- Each form provides a clear, easy way to switch to the other form (e.g. a link or toggle such as "Already have an account? Log in" / "Need an account? Sign up"), without requiring a full page reload if reasonably avoidable.
- Both forms follow the existing `(public)` route group's minimal layout (no navbar) and the app's established design tokens/styling conventions.
- Password visibility toggle state is local to each form and resets when switching between login and signup.

## Possible Edge Cases

- User submits the form with an empty email or password field.
- User submits an email in an invalid format.
- User toggles password visibility multiple times in a row.
- User switches from login to signup (or vice versa) mid-entry — confirm whether entered values should be cleared or retained.
- Very long email or password input.
- Submitting the form via the Enter key rather than clicking the submit button.
- Rapid repeated submissions (e.g. double-clicking submit).

## Acceptance Criteria

- Visiting `/login` shows an email field, password field, password-visibility toggle, and a "Log In" submit button.
- Visiting `/signup` shows an email field, password field, password-visibility toggle, and a "Sign Up" submit button.
- Clicking the password-visibility toggle switches the password field between masked (`•••`) and plain text display.
- Submitting either form with valid values logs the email and password to the console and does not navigate away, call an API, or throw an error.
- A visible control on each page allows navigating to the other form (login ↔ signup).
- Forms are keyboard accessible (tab order, enter-to-submit) and labeled appropriately for screen readers.

## Open Questions

- Should switching between login and signup preserve the email value already entered, or always start blank?
  **Answer:** Always start blank. Each form resets to a clean state when switching, for consistent UX.
- Should the password-visibility icon differ in appearance between shown/hidden states, and is there an existing icon set/library in use for this?
  **Answer:** Yes. Use `lucide-react` (already a project dependency) — `Eye` icon when the password is hidden (click to reveal), `EyeOff` icon when it's visible (click to hide).
- Is any client-side validation (e.g. email format, minimum password length) expected now, or should that wait until real authentication is implemented?
  **Answer:** Minimal only — rely on native HTML5 validation (`required`, `type="email"`). No custom validation logic (e.g. min password length, custom error messages) until real authentication is implemented.
- Should switching between forms change the URL (navigate between `/login` and `/signup`) or toggle in place without a route change?
  **Answer:** Change the URL — navigate between the existing `/login` and `/signup` routes. This keeps links shareable, browser back/forward working, and matches the existing route structure; the shared minimal `(public)` layout (no navbar) already avoids a jarring visual switch.

## Testing Guidelines

Create a test file(s) in the /tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- Both the login and signup forms render their expected fields (email, password, visibility toggle, submit button with correct label).
- Clicking the password-visibility toggle changes the password input's masked/plain-text state.
- Submitting a form with filled-in values triggers a console log call with the entered data (and does not trigger navigation or network calls).
- The control for switching between login and signup is present and navigates to/renders the other form.
