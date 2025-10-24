# Repository Guidelines

## Project Structure & Module Organization
- Next.js App Router lives in `app/`; marketing, auth, and dashboard flows keep their own subdirectories (e.g., `app/dashboard/chart-builder/page.tsx`).
- Reusable UI lives in `components/`, split into domain bundles (`components/chart-builder`, `components/dashboard`, `components/upload`) and shared primitives in `components/ui/`.
- Shared logic sits in `lib/` for prompts, chart planning, and parsing; cross-cutting hooks (e.g., responsive helpers, toast store) live in `hooks/`.
- Static assets stay in `public/`, while Highcharts rendering is centralized in `components/chart-builder/chart-canvas.tsx` with configs produced by `lib/utils/chart-plan.ts`.

## Build, Test, and Development Commands
- `pnpm dev` — start the local Next.js server with hot reload for all app routes.
- `pnpm build` — produce the optimized production bundle; run before shipping changes.
- `pnpm start` — serve the production build for smoke checks.
- `pnpm lint` — run ESLint (requires Node ≥20 because `URL.canParse` is used in rules).

## Coding Style & Naming Conventions
- Write TypeScript + React function components; add `"use client"` at the top of client-side files.
- Favor Tailwind utility classes for layout and spacing; keep custom CSS in `styles/` only when utilities fall short.
- Name files in `kebab-case` (`agent-panel.tsx`, `chart-plan.ts`) and colocate logic with its owning feature bundle.
- Let ESLint surface formatting issues; resolve warnings before committing.

## Testing Guidelines
- Automated tests are not in place yet; manually validate the upload → analysis → chart workflow after each change.
- When adding tests, follow Jest + React Testing Library conventions with `*.test.ts(x)` filenames and colocate near the code they cover.
- Confirm agent output by checking the chart plan log in devtools and the `/dashboard/chart-builder` debug drawer during QA.

## Commit & Pull Request Guidelines
- Keep commits scoped and written in imperative mood (e.g., `Add chart plan orchestrator`).
- PRs should summarize the problem, outline the solution, and describe validation steps; attach screenshots or console excerpts for UI or agent updates.
- Link related issues and call out risky areas (data transforms, chart rendering) so reviewers can focus their manual testing.

## Agent & Charting Notes
- Multi-agent state persists in `localStorage` keys like `currentData` and `agentRecommendations`; clear them when verifying cold-start flows.
- Extend chart planning in `lib/utils/chart-plan.ts` when agents gain new skills, and keep Highcharts options aligned with https://www.highcharts.com/docs/index.
