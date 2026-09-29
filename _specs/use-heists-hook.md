# Spec for use-heists-hook
branch: claude/feature/use-heists-hook
figma_component (if used): N/A

## Summary
Introduce a `useHeists` hook that gives any Client Component real-time access to heist documents in the Firestore `heists` collection. The hook takes a single mode argument — `'active'`, `'assigned'` or `'expired'` — and uses it to build the appropriate Firestore query, subscribing to live updates so results change automatically as heists are created, updated or pass their deadline in the database. Once the hook exists, the `/heists` dashboard page uses it three times to populate its existing "Your Active Heists", "Heists You've Assigned" and "All Expired Heists" sections, showing only each heist's title for now (no cards, styling or extra fields).

## Functional Requirements
- A `useHeists(mode)` hook is available for import from the project's `hooks/` folder and can be used in any Client Component.
- `mode` accepts exactly one of three values, and the hook queries the `heists` collection accordingly:
  - `'active'` — all heists assigned **to** the current user (`assignedTo` equals the current user's uid) whose deadline has not yet passed.
  - `'assigned'` — all heists assigned **by** the current user (`createdBy` equals the current user's uid) whose deadline has not yet passed.
  - `'expired'` — all heists whose deadline has passed **and** whose `finalStatus` is not null, regardless of which user created or was assigned them.
- Results are delivered via a real-time Firestore listener, so the returned list updates without a page reload when matching documents are added, changed or removed.
- Returned heists are typed using the existing `Heist` type and read through the existing `heistConverter`, so date fields arrive as JavaScript `Date` objects.
- The hook exposes a loading state so callers can tell "still fetching" apart from "no results".
- The current user is obtained from the existing `useUser` hook; for `'active'` and `'assigned'`, no query is run until a signed-in user is available.
- The listener is cleaned up when the calling component unmounts, and replaced (old one unsubscribed) when the mode or current user changes.
- "Now" for deadline comparisons is taken at the time the listener is set up.
- The `/heists` page (`app/(dashboard)/heists/page.tsx`) renders the titles of each result set under its matching existing heading:
  - "Your Active Heists" → `'active'` results
  - "Heists You've Assigned" → `'assigned'` results
  - "All Expired Heists" → `'expired'` results
- Only titles are displayed — no descriptions, codenames, deadlines or statuses, and no new visual design.
- The page's existing welcome text and headings remain unchanged.

## Possible Edge Cases
- No signed-in user yet (auth still resolving): `'active'` and `'assigned'` should stay in a loading/empty state rather than querying with an undefined uid.
- A result set is empty: the page should still render the heading, with nothing (or a simple empty message) beneath it rather than an error.
- A heist's deadline passes while the page is open: since "now" is fixed when the listener starts, the heist won't move from active/assigned to expired until the listener is re-created (e.g. page reload). This is acceptable for this iteration.
- A heist whose deadline has passed but whose `finalStatus` is still null appears in none of the three lists — this is intended per the requirements.
- A heist the user both created and was assigned (self-assigned) appears in both the active and assigned lists.
- Combining an equality filter (`assignedTo` / `createdBy`) with a range filter on `deadline`, or a range on `deadline` with a not-null filter on `finalStatus`, may require composite Firestore indexes; missing indexes cause the query to fail at runtime.
- Firestore security rules may reject the `'expired'` query if they only allow users to read heists they're involved in.
- The listener errors (permissions, network, missing index): the hook should not crash the page.
- The `/heists` page is currently a Server Component; since the hook needs client-side state and listeners, the title lists must be rendered from a Client Component.

## Acceptance Criteria
- Calling `useHeists('active')` returns only heists assigned to the current user with a deadline in the future.
- Calling `useHeists('assigned')` returns only heists created by the current user with a deadline in the future.
- Calling `useHeists('expired')` returns only heists with a past deadline and a non-null `finalStatus`, from any user.
- Adding, updating or deleting a matching heist in Firestore updates the relevant list on the `/heists` page without a reload.
- The `/heists` page shows the titles for all three result sets under the correct headings, and nothing more per heist.
- The Firestore listener is unsubscribed on unmount (no leaked listeners or state updates after unmount).
- Any composite indexes the queries need are declared in `firestore.indexes.json`.
- Existing pages, layouts, `Navbar` and the create-heist form continue to work unchanged.

## Open Questions
- Should the hook handle authentication state internally or assume the user is authenticated? Assume authenticated.
- Should there be a maximum limit on the number of heists returned per query? No.
- How should loading and error states be exposed from the hook (separate return values, or embedded in the array)? Separate return values.
- Should the hook support pagination for large result sets? no.
- Should expired heists be sorted in any particular order (e.g., most recent first)? Yes, most recent first.

## Testing Guidelines
Create a test file(s) in the /tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- `useHeists` builds the correct query for each of the three modes (mocked Firestore), using the current user's uid for `'active'` and `'assigned'`.
- `useHeists` returns converted heist data from a mocked snapshot and flips loading to false.
- `useHeists` does not subscribe for `'active'` / `'assigned'` when there is no signed-in user.
- The listener is unsubscribed when the component using the hook unmounts.
- The `/heists` page renders the titles from each mocked result set under the correct heading.
