# Dependency Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring every outdated package to latest (minus two deliberate holds), close all 5 `pnpm audit` findings, and keep test/build/check green.

**Architecture:** Staged upgrade on branch `chore/dependency-update`, one commit per stage: minor/patch → safe majors → `postgres` 4 (verified against a real DB) → record holds. No product code changes except what an upgrade forces.

**Tech Stack:** pnpm 10.30, Node 24.14, SvelteKit 3, Svelte 5, Vite 8, Vitest 5, Drizzle ORM 0.45, postgres.js, PGlite.

**Spec:** `docs/superpowers/specs/2026-11-25-dependency-update-design.md`

## Global Constraints

- Every stage ends with VERIFY (below) passing, then a commit. Never commit a red stage.
- No `overrides`, `--force`, or `--no-strict-peer-dependencies` to silence peer conflicts. Existing `pnpm-workspace.yaml` overrides stay as they are.
- `typescript` stays `^6.0.3` (kit 3.4.0 peers `^6.0.0`; svelte-check 4.7.8 peers `^5 || ^6`).
- `@types/node` stays on 24.x (runtime Node 24). `24.19.2` is already the latest 24.x, so no change.
- `vitest` and `@vitest/coverage-v8` must be the same version; same for `tailwindcss` and `@tailwindcss/vite`.
- If a major upgrade needs non-trivial code changes (more than mechanical renames/type fixes), stop and report instead of pushing through.
- Don't stage `logs/combined.log` or `.claude/` (pre-existing unrelated changes).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### VERIFY (referenced by every task)

```bash
pnpm test    # Expected: "Test Files  115 passed (115)" and "Tests  961 passed (961)" (counts may only grow). ~6 min.
pnpm build   # Expected: ends with "✔ done". The adapter-auto "Could not detect a supported production environment" warning is pre-existing and OK.
pnpm check   # Expected: "0 ERRORS 0 WARNINGS"
```

## Review Focus

Things tests don't exercise that would bite a user:

1. **`postgres` 4 at runtime** — tests use PGlite, so connection/query behavior of the real driver (incl. the `{ prepare: false }` option in `src/lib/server/db/index.ts`) is only proven by Task 3's manual DB run.
2. **`nodemailer` 10.1.7 → 10.6.1** — password-reset email; tests may mock the transport. Task 1 checks the changelog for `createTransport`/`sendMail` changes.
3. **`zustand` 5.0 → 5.1 persisted state** — existing users' `emerald-search` localStorage must still hydrate. Task 1 checks the changelog for `persist` changes.
4. **`@lucide/svelte` 1.61 → 1.80 removed/renamed icons** — caught by `pnpm check` + build in Task 1; any rename must keep the same visual icon.
5. **`@sveltejs/adapter-auto` 9 build output** — Task 2 confirms build still finishes with the same pre-existing warning, nothing new.

---

### Task 1: Minor/patch upgrades (closes all 5 CVEs)

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Modify (only if forced): source files flagged by VERIFY

**Interfaces:**
- Consumes: baseline (961 tests pass, check 0 errors, audit 5 findings in `@sveltejs/kit@3.1.0`)
- Produces: `@sveltejs/kit@3.4.0` installed; `pnpm audit` clean

- [ ] **Step 1: Upgrade**

```bash
pnpm add @lucide/svelte@^1.80.0 nodemailer@^10.6.1 zustand@^5.1.0
pnpm add -D @sveltejs/kit@^3.4.0 @sveltejs/vite-plugin-svelte@^7.3.2 vite@^8.3.8 svelte@^5.59.1 svelte-check@^4.7.8 vitest@^5.1.1 @vitest/coverage-v8@^5.1.1 tailwindcss@^4.3.5 @tailwindcss/vite@^4.3.5 @testing-library/user-event@^14.6.13 dotenv@^18.0.10
```

Expected: install succeeds with no unmet-peer warnings.

- [ ] **Step 2: Changelog check for Review Focus 2 and 3**

Read the nodemailer changelog (10.1.7 → 10.6.1) and zustand release notes (5.0.15 → 5.1.0). Note any change to `createTransport`/`sendMail` or `persist`/`createJSONStorage` behavior. If one affects our usage (`grep -rn "nodemailer\|persist(" src`), fix it in this task or stop and report.

- [ ] **Step 3: Audit**

Run: `pnpm audit`
Expected: `No known vulnerabilities found`

- [ ] **Step 4: VERIFY** — all three pass.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml   # plus any source file fixed in Step 2/4
git commit -m "chore(deps): upgrade minor/patch packages, fix SvelteKit advisories"
```

---

### Task 2: Safe majors, one at a time

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Possibly: `vite.config.ts` (adapter-auto), `src/test/setup-client.ts` (jest-dom import is `@testing-library/jest-dom/vitest`), `vitest.config.ts` (jsdom env), `src/test/db.ts` (PGlite)

**Interfaces:**
- Consumes: Task 1 state
- Produces: adapter-auto 9, jest-dom 8, jsdom 31, pglite 0.6

For each package below, in this order: read its release notes for the major, upgrade, run VERIFY, fix anything forced, then move to the next. If a package fails and the fix is non-trivial, `git checkout package.json pnpm-lock.yaml && pnpm install`, skip it, and report.

- [ ] **Step 1: `pnpm add -D @sveltejs/adapter-auto@^9.0.0`** → VERIFY. Build must end with "✔ done" and only the pre-existing adapter warning (Review Focus 5).
- [ ] **Step 2: `pnpm add -D @testing-library/jest-dom@^8.0.0`** → VERIFY. Check the `/vitest` entry point still exists; peers require `vitest >=5 <6` and `@testing-library/dom >=10 <11`.
- [ ] **Step 3: `pnpm add -D jsdom@^31.0.1`** → VERIFY.
- [ ] **Step 4: `pnpm add -D @electric-sql/pglite@^0.6.0`** → VERIFY. `createTestDb()` in `src/test/db.ts` must still run migrations from `drizzle/`; all server tests depend on it.
- [ ] **Step 5: Commit**

One commit if no code changes were needed; otherwise one commit per package that needed a fix.

```bash
git add package.json pnpm-lock.yaml   # plus fixed files
git commit -m "chore(deps): upgrade adapter-auto 9, jest-dom 8, jsdom 31, pglite 0.6"
```

---

### Task 3: `postgres` 4 (runtime DB driver)

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Possibly: `src/lib/server/db/index.ts`, `scripts/seed.ts`

**Interfaces:**
- Consumes: Task 2 state; `.env` `DATABASE_URL` pointing at the compose DB; Docker Desktop running (it was **not** running on 2026-11-25 — ask the user to start it before Step 3)
- Produces: `postgres@^4.1.1` working against real Postgres 16

- [ ] **Step 1: Read postgres.js 3.x → 4.0 release notes.** List breaking changes touching: default export `postgres(url, options)`, the `prepare` option, and anything `drizzle-orm/postgres-js@0.45.4` relies on. If drizzle 0.45 is known-incompatible, stop and report.

- [ ] **Step 2: Upgrade and VERIFY**

```bash
pnpm add postgres@^4.1.1
```

Then VERIFY (types for `index.ts`/`seed.ts` are the main signal here).

- [ ] **Step 3: Real-DB check (Review Focus 1)**

```bash
docker compose up -d
pnpm db:migrate   # Expected: completes with no error
pnpm db:seed      # Expected: completes with no error
pnpm dev          # then load a DB-backed page (e.g. /login, log in with a seed account, open a page listing bookings/doctors)
```

Expected: pages render data, no driver errors in the dev server log. Stop the dev server after. Leave the DB container to the user's choice (mention it in the report).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml   # plus fixed files
git commit -m "chore(deps): upgrade postgres to 4"
```

---

### Task 4: Record holds and finish

**Files:**
- Modify: `docs/TECHDEBT.MD` (tech-debt register table, append after TD-16)

- [ ] **Step 1: Add two rows**

| ID | Item | Where | Priority | Effort |
| -- | ---- | ----- | -------- | ------ |
| TD-17 | `typescript` held at 6.x: `@sveltejs/kit` and `svelte-check` don't support TS 7 yet. Lift when both peer ranges include `^7`. | `package.json` | P2 | S |
| TD-18 | `@types/node` held at 24.x to match runtime Node 24. Move with the Node runtime upgrade. | `package.json` | P3 | S |

- [ ] **Step 2: Final check**

Run: `pnpm outdated`
Expected: only `typescript` (6.x → 7.x) and `@types/node` (24.x → 26.x) listed.

Run: `pnpm audit`
Expected: `No known vulnerabilities found`

- [ ] **Step 3: Commit**

```bash
git add docs/TECHDEBT.MD
git commit -m "docs: record typescript and @types/node version holds"
```
