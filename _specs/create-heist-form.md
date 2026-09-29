# Spec for Create Heist Form
branch: claude/feature/create-heist-form
figma_component (if used): none

## Summary
The create heist page at `app/(dashboard)/heists/create/page.tsx` currently only renders a "Create a New Heist" heading. This feature adds a form that lets a logged-in user create a new heist and assign it to another user. Submitting the form writes a new document to the Firestore `heists` collection, shaped by the existing `CreateHeistInput` interface, and then redirects the user to `/heists`.

The user fills in only the heist's title and description and picks an assignee. Everything else in `CreateHeistInput` is filled in automatically:
- `createdBy` and `createdByCodename` come from the logged-in user.
- `assignedTo` and `assignedToCodename` come from the assignee the user picks.
- `createdAt` is set to the server timestamp.
- `deadline` is set to 48 hours after creation.
- `finalStatus` is set to `null`.

The list of assignees comes from the Firestore `users` collection, where each document holds a user's `id` and `codename`.

## Functional Requirements
- The create heist page shows a form with these fields:
  - **Title**: required text input.
  - **Description**: required multi-line text input.
  - **Assignee**: required plain dropdown listing the codenames of other users from the `users` collection.
- The assignee picker is populated by fetching the `users` collection when the page loads. Each option shows the user's codename, and picking one stores both that user's id and codename.
- The logged-in user does not appear in the assignee list, so a user cannot assign a heist to themselves.
- On submit, a new document is added to the Firestore `heists` collection with every field in `CreateHeistInput`:
  - `title` and `description`: taken from the form, trimmed of surrounding whitespace.
  - `createdBy`: the current user's uid.
  - `createdByCodename`: the current user's codename.
  - `assignedTo` and `assignedToCodename`: the chosen assignee's id and codename.
  - `createdAt`: set programmatically to the server timestamp.
  - `deadline`: set programmatically to 48 hours after creation, using the existing heist duration constant.
  - `finalStatus`: `null`.
- After the document is created, the user is redirected to `/heists`.
- While the submission is in progress, the submit button is disabled and shows a loading state, matching the existing auth forms, so the heist can't be submitted twice.
- If creating the heist fails, a user-friendly error message is shown, the user stays on the page, and the form keeps what they entered.
- While the user list is loading, the assignee picker shows a loading state. If the list fails to load, an error message is shown and the form cannot be submitted.
- If there are no other users to assign to, a message is shown in place of the form.
- There is no confirmation dialog before submission and no success toast afterwards. The redirect to `/heists` is the only feedback.
- The deadline cannot be edited. It is always 48 hours after the client's current time at submission.
- Styling follows the existing design tokens and form styles, such as `form-title` and the look of the auth forms.

## Figma Design Reference (only if referenced)
Not applicable. No Figma component was referenced for this feature.

## Possible Edge Cases
- The title or description contains only whitespace, which should be treated as empty.
- The `users` collection is empty or contains only the current user.
- A user document is missing a `codename`. Either skip it or show a fallback label.
- The current user's codename isn't available yet, for example because auth state is still loading or the display name isn't set.
- Network failure or a permission error while fetching users or writing the heist.
- The user double-clicks submit, or presses Enter repeatedly, while a request is already in progress.
- Very long title or description input.
- The user leaves the page mid-submission.

## Acceptance Criteria
- Given a logged-in user on `/heists/create`, when the page loads, then the assignee picker lists the codenames of every other user in the `users` collection and leaves out the current user.
- Given the user fills in a title and a description and picks an assignee, when they submit, then a new document appears in the `heists` collection with:
  - the entered title and description
  - the creator's uid and codename
  - the assignee's uid and codename
  - a server-set `createdAt`
  - a `deadline` 48 hours later
  - `finalStatus` set to `null`
- Given the heist was created successfully, when the write completes, then the user is redirected to `/heists`.
- Given a required field is empty or contains only whitespace, when the user tries to submit, then no document is created and the form shows which field needs attention.
- Given the submission is in progress, when the user looks at the submit button, then it is disabled and shows a loading state.
- Given the heist creation fails, when the error occurs, then an error message is shown, no redirect happens, and the entered values are kept.

## Open Questions
- Should the "Created By" field be auto-populated with the logged-in user, or be a dropdown? It comes from the logged-in user. There's no input or dropdown for it.
- Should the deadline be exactly 48 hours after the client's current time, or computed some other way so it lines up with the server-set `createdAt`? Use the client's current time plus 48 hours. It is always fixed and not editable.
- Should the assignee picker be a plain dropdown, or a searchable list for when there are many users? A plain dropdown.
- Should there be maximum lengths for the title and description? Out of scope for now.
- Should there be a confirmation dialog before submission? No.
- Should the page show a success confirmation, such as a toast, after redirecting to `/heists`, or is the redirect enough? The redirect is enough.
- Should users be able to assign a heist to themselves? No. Don't show the logged-in user in the assignee dropdown.
- What should happen if there are no other users in the users collection? Show a message instead of the form.

## Testing Guidelines
Create a test file(s) in the /tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- The form renders the title, description and assignee fields, and the assignee options are populated from mocked `users` data without the current user.
- Submitting valid input calls the Firestore add with the expected `CreateHeistInput` fields, including the creator and assignee ids and codenames, and `finalStatus` set to `null`, then redirects to `/heists`.
- Submitting with a missing title, description or assignee does not call Firestore.
- The submit button is disabled and shows a loading state while the request is pending.
- A failed Firestore write shows an error message and does not redirect.
- When there are no other users, a message is shown instead of the form.
