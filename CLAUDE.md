# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at http://localhost:3000
npm run build    # production build
npm run lint     # ESLint
npm test         # run all tests (Vitest)
npx vitest run tests/components/Navbar.test.tsx  # run a single test file
```

## Architecture

Next.js App Router with two route groups that share no layout:

- **`app/(public)/`** — unauthenticated pages (splash, login, signup, preview). Minimal layout with no navbar.
- **`app/(dashboard)/`** — authenticated pages under `/heists`. Layout wraps every page with `<Navbar>`.

The splash page (`app/(public)/page.tsx`) is intended as an auth gate: redirect logged-in users to `/heists`, others to `/login`. Auth is not yet implemented.

Components and pages are Server Components by default; add `"use client"` only when interactivity is needed (e.g. `components/AuthForm`, which uses `useState` for its password-visibility toggle).

## Styling

Tailwind CSS v4 with custom design tokens defined in `app/globals.css` under `@theme` (colors: `primary`, `secondary`, `dark`, `light`, `lighter`, `success`, `error`, `heading`, `body`). Component-scoped styles use CSS Modules (e.g. `Navbar.module.css`).

## Path Aliases

`@/` maps to the project root, so `@/components/Navbar` resolves to `components/Navbar/index.ts`.

## Tests

Tests live in `tests/` mirroring the source structure (e.g. `tests/components/`). Vitest runs in jsdom with `@testing-library/react`. Globals (`describe`, `it`, `expect`) are available without imports due to `globals: true` in `vitest.config.mts`.

## Feature Workflow

Non-trivial features go through a spec-then-plan process before implementation, each step on its own branch:

1. `/spec` turns a short idea into a feature spec at `_specs/<feature-slug>.md` (using `_specs/template.md`) and creates a `claude/feature/<feature-slug>` branch.
2. Plan mode turns an approved spec into an implementation plan at `_plans/<feature-slug>.md`.
3. Implementation happens on the feature branch, following that plan.
