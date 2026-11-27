# Dependency Update — Design (short)

Date: 2026-11-25

## Intent

Routine maintenance and closing known security vulnerabilities. Deployment is still far off,
but package versions should not drift far from current when it happens.

## Baseline (before any change)

- `pnpm test`: 115 files, 961 tests pass.
- `pnpm build`: succeeds (adapter-auto "no supported environment" warning is pre-existing, TD-03).
- `pnpm check`: 0 errors, 0 warnings.
- `pnpm audit`: 5 vulnerabilities (2 high, 3 moderate), all in `@sveltejs/kit@3.1.0`, patched in `>=3.1.1`.
- `pnpm outdated`: 21 packages (14 minor/patch, 7 major).

## Goals

- `pnpm audit` reports 0 vulnerabilities.
- Every outdated package is at its latest version, except the deliberate holds below.
- `pnpm test`, `pnpm build`, and `pnpm check` pass after every stage.

## Non-goals

- Replacing `adapter-auto` with a production adapter (tracked separately in DEPLOYMENT_PLAN / TD-03).
- Refactors or feature changes beyond what an upgrade forces.
- Upgrading `drizzle-orm` / `drizzle-kit` past what `pnpm outdated` reports (both already latest stable).

## Anti-goals

- A green test suite that hides a broken runtime DB driver (`postgres` is not exercised by tests,
  which use PGlite).
- Silencing peer-dependency conflicts with overrides or `--force`.

## Approaches considered

- **A. Staged, one commit per stage (chosen).** A regression points to a specific package group;
  each stage can be reverted on its own.
- B. Everything at once (`pnpm update --latest`). Faster, but failures are hard to attribute, and it
  pulls TypeScript 7, which conflicts with kit/svelte-check peer ranges.
- C. Minor/patch only. Safest, but leaves majors behind, against the "don't drift before deploy" goal.

## Design

Each stage ends with `pnpm test`, `pnpm build`, `pnpm check`, then a commit.

1. **Minor/patch (closes all 5 CVEs).** `@sveltejs/kit` 3.4.0, `@sveltejs/vite-plugin-svelte`,
   `vite`, `svelte`, `svelte-check`, `vitest` + `@vitest/coverage-v8` (kept in lockstep),
   `tailwindcss` + `@tailwindcss/vite` (lockstep), `@testing-library/user-event`, `dotenv`,
   `@lucide/svelte`, `nodemailer`, `zustand`. Also confirm `pnpm audit` is clean here.
2. **Safe majors, one at a time.** `@sveltejs/adapter-auto` 9, `@testing-library/jest-dom` 8,
   `jsdom` 31, `@electric-sql/pglite` 0.6. Each package is upgraded and verified individually before the next;
   any code fix the upgrade forces goes in with it. One commit for the stage (or per package if a
   fix was needed).
3. **`postgres` 4 (runtime DB driver).** Upgrade, read its changelog for breaking changes affecting
   `src/lib/server/db/index.ts` and `scripts/seed.ts`, then verify against a real Postgres:
   `docker compose up -d` → `pnpm db:migrate` → `pnpm db:seed` → start `pnpm dev` and hit a page that
   queries the DB. **Requires Docker Desktop running** (daemon was not running on 2026-11-25).
4. **Deliberate holds.**
   - `typescript` stays on 6.x: `@sveltejs/kit@3.4.0` peers `typescript ^6.0.0`,
     `svelte-check@4.7.8` peers `^5 || ^6`.
   - `@types/node` moves to latest 24.x, not 26: runtime is Node 24.

   Record both holds (with the reason and the condition to lift them) in `docs/TECHDEBT.MD`.

## Left to the builder

- Exact commit granularity within stage 2.
- How to fix any test/type breakage an upgrade causes, as long as behavior is unchanged.
- If a stage-2 or stage-3 major turns out to need non-trivial code changes, stop and report
  instead of pushing through.
