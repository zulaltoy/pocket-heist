# Plan: Heist Card

## Context
`_specs/heist-card.md` (branch `claude/feature/heist-card`, already checked out) asks for two new components:
- `HeistCard`, a styled card for one heist.
- `HeistCardSkeleton`, its loading placeholder.

Both are used on `/heists` for the **active** and **assigned** sections only. Today those sections render plain `<li>{title}</li>` lists through `HeistTitles` in `app/(dashboard)/heists/page.tsx`. The goal is a responsive 3-column card grid. Skeleton cards fill the same grid while data loads. Each card's title links to `/heists/:id`, and that page stays as it is (`app/(dashboard)/heists/[id]/page.tsx`). Expired heists keep the plain list.

Decisions from the spec's answered Open Questions:
- **Grid:** responsive, 1 column on mobile, 2 on tablet, 3 on desktop.
- **Skeletons:** one row (3 skeleton cards) while loading.
- **Empty state:** the empty message stays.
- **Section rules:** "active" means assigned to me and "assigned" means created by me. `useHeists` already does this.
- **Link:** only the title is a link.

### Figma design (node 54:60, from the user's duplicated file `L1C3GDDkotZARNZJyeciTL`)
- **Card box:** `bg-lighter` (#101828), 1px border `#1E2939` (= Tailwind v4 `gray-800`), `rounded-[10px]`, padding ~20px (`p-5`), and a 12px vertical gap between the title row and the meta block (`gap-3`). The card is ~378px wide in Figma, but in the grid it fills its column.
- **Title row:**
  - Title: Inter 16px / 24px line height, `text-heading` (white), regular weight, wraps across lines.
  - Top-right: a 16px clock icon in `text-primary`, as lucide `Clock`.
- **Meta block:** 3 rows with an 8px gap. Each row is a 12px icon in `text-body` plus 14px / 20px text in `text-body`.
  - `To: @<assignedToCodename>`: `User` icon, codename in `text-primary` (#C27AFF).
  - `By: @<createdByCodename>`: `User` icon, codename in `text-secondary` (#FB64B6).
  - `<Dec 4, 03:00 PM> • <time left>`: `Calendar` icon. The time left is in `text-primary`, e.g. `4h 42m`, `1d 0h` or `Overdue`.
- **Grid gap:** 16px between cards (`gap-4`).
- **Colours:** all match existing `@theme` tokens except the border. For the border, use Tailwind's built-in `border-gray-800`, so no new token is needed.
- **Out of scope:** the Figma section headings have icons and different wording. The spec keeps the current headings unchanged.

## Approach
- **`HeistCard`** (no `"use client"`, since it has no state):
  - Takes `{ heist: Heist }`.
  - The title is wrapped in `next/link` to `/heists/${heist.id}`.
  - Uses lucide icons `Clock`, `User` and `Calendar`. Decorative icons get `aria-hidden`.
  - The deadline text comes from small pure helpers in `lib/deadline.ts`, so they're easy to test:
    - `formatDeadline(date)`: `Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })` → `Dec 4, 03:00 PM`.
    - `formatTimeLeft(deadline, now = new Date())`: returns `Overdue` when `<= 0`, `${d}d ${h}h` when at least a day is left, and `${h}h ${m}m` otherwise.
  - Missing codename or description: if a codename is missing, render `@unknown`. The description isn't shown in the design, so it's not rendered.
- **`HeistCardSkeleton`:**
  - Has the same card shell as `HeistCard` (shared look, its own CSS module).
  - Shows a 2-line title bar, a small circle where the clock goes, and 3 short meta lines, all `bg-gray-800 animate-pulse`. This mirrors the pattern of the existing `components/Skeleton`.
  - The root has `role="status"`, `aria-busy="true"` and `aria-label="Loading heist"`.
- **Page** (`app/(dashboard)/heists/page.tsx`):
  - Add a page-local `HeistCards` next to the existing `HeistTitles`, with the same `{heists, loading, error}` props.
  - Loading → 3 × `HeistCardSkeleton` in the grid.
  - Error → `Couldn't load heists.`
  - Empty → `No heists here yet.`
  - Otherwise → a `<ul>` grid of `<li><HeistCard/></li>`.
  - The active and assigned sections switch to `HeistCards`. Expired keeps `HeistTitles`.
  - Grid classes: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`, in a new `app/(dashboard)/heists/page.module.css` as `.grid` (CSS Module + `@reference`, matching the project's convention).
- **Before writing code:** per `CLAUDE.md`, check Context7 for Next.js `Link` and Tailwind v4 (`@reference`, responsive `grid-cols-*`).

## Files to change

**New: `lib/deadline.ts`**
```ts
const formatter = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
})

export function formatDeadline(deadline: Date) {
  return formatter.format(deadline)
}

export function formatTimeLeft(deadline: Date, now: Date = new Date()) {
  const ms = deadline.getTime() - now.getTime()
  if (ms <= 0) return "Overdue"
  const totalMinutes = Math.floor(ms / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  return days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`
}
```

**New: `components/HeistCard/HeistCard.tsx`, plus `HeistCard.module.css` and `index.ts`**
```tsx
import Link from "next/link"
import { Calendar, Clock, User } from "lucide-react"
import { formatDeadline, formatTimeLeft } from "@/lib/deadline"
import type { Heist } from "@/types/firestore"
import styles from "./HeistCard.module.css"

interface HeistCardProps {
  heist: Heist
}

export default function HeistCard({ heist }: HeistCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <Link href={`/heists/${heist.id}`}>{heist.title}</Link>
        </h3>
        <Clock className={styles.clock} size={16} aria-hidden />
      </div>
      <ul className={styles.meta}>
        <li><User size={12} aria-hidden /> To: <span className={styles.to}>@{heist.assignedToCodename || "unknown"}</span></li>
        <li><User size={12} aria-hidden /> By: <span className={styles.by}>@{heist.createdByCodename || "unknown"}</span></li>
        <li><Calendar size={12} aria-hidden /> {formatDeadline(heist.deadline)} • <span className={styles.timeLeft}>{formatTimeLeft(heist.deadline)}</span></li>
      </ul>
    </article>
  )
}
```
```css
@reference "../../app/globals.css";

.card     { @apply flex flex-col gap-3 h-full rounded-[10px] border border-gray-800 bg-lighter p-5; }
.header   { @apply flex items-start justify-between gap-2; }
.title    { @apply text-base leading-6 font-normal tracking-tight text-heading break-words; }
.title a:hover { @apply text-primary transition-colors; }
.clock    { @apply mt-1 shrink-0 text-primary; }
.meta     { @apply flex flex-col gap-2 text-sm leading-5 text-body; }
.meta li  { @apply flex items-center gap-2; }
.to, .timeLeft { @apply text-primary; }
.by       { @apply text-secondary; }
```

**New: `components/HeistCardSkeleton/HeistCardSkeleton.tsx`, plus `.module.css` and `index.ts`.** The structure mirrors the card. CSS reuses the `.card` shell values plus `.line { @apply h-3 rounded-full bg-gray-800 animate-pulse }` with width variants, the same as in `components/Skeleton/Skeleton.module.css`.

**Edit: `app/(dashboard)/heists/page.tsx`**: add `HeistCards` and use it for active and assigned. **New: `app/(dashboard)/heists/page.module.css`** with `.grid`.

## Tests
- **New: `tests/components/HeistCard.test.tsx`**
  - Renders the title, `@assignee`, `@creator` and the formatted deadline.
  - The title link has `href="/heists/<id>"`.
  - A missing codename falls back to `@unknown` without crashing.
- **New: `tests/components/HeistCardSkeleton.test.tsx`**: renders `role="status"` with `aria-busy="true"`.
- **New: `tests/lib/deadline.test.ts`**
  - `formatTimeLeft` returns `Overdue`, `1d 0h` and `4h 42m` for fixed `now` values.
  - `formatDeadline` formats a fixed date.
- **Edit: `tests/app/(dashboard)/heists/page.test.tsx`**
  - Update the `done()` fixture to include `deadline`, `assignedToCodename` and `createdByCodename`.
  - Change the loading expectation from "Loading..." to 3 skeletons (`getAllByRole("status")`) in the active section.
  - Assert that active titles are links to `/heists/<id>`.
  - Assert that expired still renders a plain title without a link.

## Verification
1. `npm test`: all suites pass, both new and updated.
2. `npm run lint` and `npm run build` complete cleanly.
3. Run `npm run dev`, log in and open `/heists`:
   - Skeletons briefly appear, then the cards.
   - The grid has 3 columns on desktop, 2 on tablet and 1 on mobile.
   - The card matches the Figma screenshot (colours, icons, spacing).
   - Clicking a title goes to `/heists/<id>` and shows only the "Heist Details" placeholder.
   - Expired heists are still a plain list.
