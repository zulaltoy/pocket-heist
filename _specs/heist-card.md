# Spec for heist-card
branch: claude/feature/heist-card
figma_component (if used): Heist Card (Page-Designs, node 54:60)

## Summary
Introduce a reusable `HeistCard` component that presents a single heist as a styled card, and a matching `HeistCardSkeleton` placeholder shown while heists are loading. On the `/heists` dashboard page, the "Your Active Heists" and "Heists You've Assigned" sections replace their current plain title lists with a responsive 3-column grid of heist cards, showing skeleton cards in the same grid until the data has loaded. Each card's title links to that heist's details page (`/heists/:id`), which remains an empty placeholder for now. The "All Expired Heists" section is not changed in this feature.

## Functional Requirements
- A `HeistCard` component is available from the project's `components/` folder and accepts a single heist (using the existing `Heist` type).
- The card displays the heist's key information as defined by the Figma design. At minimum this is expected to be the title, plus relevant supporting details such as description, the other agent's codename (assigner or assignee) and the deadline. Confirm the exact fields against Figma.
- The heist title on the card is a link that navigates to `/heists/<heist id>`.
- The heist details page (`/heists/[id]`) is left as-is: no new content is added to it as part of this feature.
- A `HeistCardSkeleton` component is available from `components/` and visually mirrors the card's shape and size using a loading placeholder style, consistent with the existing `Skeleton` component where appropriate.
- On the `/heists` page:
  - "Your Active Heists" renders the `'active'` heists as `HeistCard`s.
  - "Heists You've Assigned" renders the `'assigned'` heists as `HeistCard`s.
  - "All Expired Heists" is unchanged (expired heists do **not** use the card in this feature).
- Cards in each section are laid out in a 3-column grid.
- While a section's heists are loading, the section shows a small fixed number of `HeistCardSkeleton`s in the same 3-column grid, instead of the "Loading..." text.
- Existing empty and error messages for each section continue to be shown when there are no heists or loading fails.
- Styling uses the project's existing design tokens (colours, font) and component conventions; no hard-coded colours that duplicate an existing token.
- The page's welcome text and section headings remain unchanged.

## Figma Design Reference (only if referenced)
- File: https://www.figma.com/design/elHzuUQZiJXNqJft57oneh/Page-Designs?node-id=54-60&m=dev
- Component name: Heist Card (node 54:60)
- Design reference could not be retrieved. See Figma manually for details. (The Figma MCP server was not connected or authenticated when this spec was written. Re-run the `ui-design-extractor` agent after authenticating via `/mcp` to produce `_designs/heist-card.md` before planning.)
- Key visual constraints: match the Figma card's layout, typography, colours, radius and icons, mapped onto the existing theme tokens in `app/globals.css`.

## Possible Edge Cases
- Very long titles or descriptions should wrap or truncate gracefully without breaking the card or grid layout.
- A section with fewer than three heists should still align cards to the grid, without stretching a lone card across the full width.
- Missing optional data (e.g. empty description or missing codename) should not break the card's layout.
- A deadline that is very close or has just passed while the page is open (the card still shows until the listener refreshes, as per the existing `useHeists` behaviour).
- Narrow screens: the 3-column grid should collapse to fewer columns so cards remain readable.
- Loading finishes with zero results: skeletons are replaced by the empty-state message, not left on screen.

## Acceptance Criteria
- Active and assigned heists on `/heists` are shown as cards in a 3-column grid that matches the Figma design.
- Expired heists are not rendered as cards.
- Clicking a card's title navigates to `/heists/<id>` for that heist, and the details page still shows only its existing placeholder content.
- While loading, each of the two sections shows skeleton cards in the same grid layout, and these are replaced by real cards once loaded.
- Empty and error states still display their existing messages.
- `HeistCard` and `HeistCardSkeleton` follow the project's component folder conventions and use theme tokens for styling.
- All existing and new tests pass, and lint passes.

## Open Questions
- Should the grid be responsive (e.g., 2 columns on tablet, 1 on mobile)? Yes.
- How many skeleton cards should display during loading? one row of cards in the grid.
- Should there be an empty state message when no heists exist? Yes.
- What determines if a heist is "assigned" vs
"active"? assigned if created by user, active if created for current user.
- Should clicking anywhere on the card navigate to detail page, or only the title? just the title.

## Testing Guidelines
Create a test file(s) in the /tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- `HeistCard` renders the heist title and its key supporting details.
- `HeistCard` title links to `/heists/<id>` for the given heist.
- `HeistCard` handles a heist with missing optional data without crashing.
- `HeistCardSkeleton` renders a loading placeholder (e.g. accessible busy/loading indication).
