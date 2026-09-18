# Spec for Login Form Functionality
branch: claude/feature/login-form-functionality
figma_component (if used): none

## Summary
The login form at `app/(public)/login/` currently accepts email and password input but only logs the submitted values to the console — it does not authenticate the user. This feature wires the login form to actually authenticate users against their existing credentials. On successful authentication, the user is shown a success message on the same page. No redirect happens after login as part of this feature; the user stays on the login page.

## Functional Requirements
- Submitting the login form with a registered account's correct email and password authenticates the user.
- On successful authentication, the form displays a clear success message to the user (e.g. "Logged in successfully.").
- The success message is displayed in place on the login page — no navigation or redirect occurs after a successful login.
- If the submitted credentials are incorrect or the account does not exist, the form displays an appropriate, user-friendly error message instead of a success message.
- While the login request is in progress, the submit button reflects a loading/submitting state (consistent with the existing signup flow) and is disabled to prevent duplicate submissions.
- The email and password fields retain their existing required validation.
- Any previously shown error or success message is cleared when the user resubmits the form.

## Figma Design Reference (only if referenced)
Not applicable — no Figma component was referenced for this feature.

## Possible Edge Cases
- Empty or missing email/password on submit (should be prevented by existing required field validation).
- Incorrect password for a valid, existing email.
- Email address that has no associated account.
- Malformed email address.
- Rapid repeated submissions (e.g. double-clicking submit) while a request is already in flight.
- Network/connectivity failure during authentication.
- Successfully authenticating, then submitting the form again without changing fields.

## Acceptance Criteria
- Given a registered user enters their correct email and password and submits the login form, when authentication completes, then a success message is shown on the page and no redirect occurs.
- Given a user enters an incorrect password or an email with no matching account, when they submit the form, then an error message is shown and no success message appears.
- Given the login request is in progress, when the user views the submit button, then it shows a loading state and is disabled.
- Given a success or error message is currently shown, when the user submits the form again, then the previous message is cleared before the new result is shown.

## Open Questions
- Should the success message include any user-specific detail (e.g. codename or email), or remain generic? just login successful
- Should the success message persist indefinitely, or clear after a timeout / on next field edit? no
- Is there a maximum number of failed login attempts to guard against before this feature is considered complete, or is that out of scope? right now out of scope

## Testing Guidelines
Create a test file(s) in the /tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- Submitting valid credentials shows a success message and does not navigate away from the login page.
- Submitting invalid credentials (wrong password / unknown email) shows an error message and no success message.
- The submit button is disabled and shows a loading state while the login request is pending.
