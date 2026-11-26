# Testing

> Part of the [Purwakarta Health docs](./DEVELOPMENT_STATUS.md). Last verified against code: 2026-11-26.

## 1. Current state

| Layer | Tooling | Status |
| ----- | ------- | ------ |
| Type check + Svelte a11y lint | `pnpm check` (svelte-check) | ✅ Available. Must be 0 errors / 0 warnings before pushing. |
| Build | `pnpm build` | ✅ Must succeed. |
| Dependency audit | `pnpm audit` | ✅ Expected: 0 vulnerabilities. |
| Unit + component tests | `pnpm test` / `pnpm test:coverage` (Vitest 5) | ✅ 161 files, 1067 tests. Coverage threshold 90% on all metrics; currently 99.4% stmts / 97.6% branches / 99.6% funcs / 99.7% lines. |
| DB-backed tests | PGlite (in-memory Postgres) + real `drizzle/` migrations | ✅ Server modules and route `load`/actions run against a real schema, no Docker needed. |
| End-to-end tests | — | ⬜ No Playwright setup. |
| CI | — | ⬜ Nothing runs automatically. |

### 1.1 Vitest setup

- **Config:** `vitest.config.ts`, with two projects:
  - `server`: Node, files `src/**/*.test.ts`.
  - `client`: jsdom + `@testing-library/svelte`, files `src/**/*.svelte.test.ts`.
- **Helpers:** in `src/test/` (excluded from coverage). Import them with the `#test/*` alias (`"#test/*": "./src/test/*"` in the `imports` field of `package.json`), e.g. `import { ev, reset } from '#test/helpers/route.ts'`:
  - `db.ts`: creates a PGlite database per test file. `resetDb()` truncates all tables.
  - `factories.ts`: `makeUser`, `makeDoctor`, … and `makeEvent()`, a fake SvelteKit `RequestEvent`.
  - `mocks/`: stand-ins for `$app/env/private` (`setEnv`), `$app/state` (`setPage`), `$app/forms` (`enhance` runs the real SubmitFunction; `setEnhanceResult`, `submissions`), and `$app/navigation` (`goto` mock).
  - `harness/`: small wrapper components for testing bindings and hooks.
  - `helpers/route.ts` (server route tests, `src/routes/**`): `ev(opts)` (fake `RequestEvent` cast to the handler's type), `reset()` (truncates all tables in the test DB through `resetDb`; call it in `beforeEach`), `nonManagers()` (anonymous + patient principals), `thrown(fn)` (returns the redirect / `HttpError` a handler throws), `UNKNOWN_ID`, `randomId()`, `MONDAY` / `TUESDAY` date constants, and the `ActionResult` type.
  - `helpers/component.ts` (client component tests): `snip(html)` (static snippet), `slowNextUpdate(ms)`, `pressEscape()`, `escapeThenConfirm(dialog)`, `stubSpecialistsFetch(items)`, `resetStores()` (search + toast stores), `mockLocationHref()` and `testUser`.
- **Location and naming:** tests live next to the source. Every component has a co-located `<Component>.svelte.test.ts` next to its `.svelte` file (one test file per component, in the same feature folder). In `src/routes`, test files drop the reserved `+` prefix: `page.server.test.ts`, `page.svelte.test.ts`, `layout.svelte.test.ts`.
- **Importing mock helpers:** import `setPage`, `submissions`, and similar helpers from the mock file path, not `$app/*`. Otherwise `svelte-check` types them against the real SvelteKit modules.
- **Known bugs:** document a bug that isn't fixed yet with `it.fails`, so the test flags it once it's fixed. None are open right now.

## 2. Manual smoke test (before every merge)

Prerequisite: `pnpm db:migrate && pnpm db:seed`, then `pnpm dev`.

### Public
- [ ] `/` loads anonymously. Typing "car" in the specialty field shows suggestions. ↑/↓/Enter works.
- [ ] Submitting the hero search opens `/find-doctor` with matching doctors.
- [ ] **Book Now** while anonymous → `/login?redirect=/doctors/<id>/book`.

### Auth
- [ ] Register a new account → lands on `/home`.
- [ ] Log out → log in as `patient@emerald.com` → lands on `/home`.
- [ ] Wrong password shows "Invalid email or password."
- [ ] `/login/forgot` with any email shows success. For a real account, the reset link appears in the server console (no SMTP).
- [ ] The reset link sets a new password, then `/login?reset=success`. The same link a second time → "invalid or has expired".
- [ ] (If Google is configured) "Continue with Google" works and returns to the original page.

### Patient
- [ ] Book a slot → `/appointments?booked=…` shows the confirmation modal.
- [ ] The deliberately full seeded slot is shown as unavailable.
- [ ] Cancel an upcoming appointment → status becomes cancelled and the slot is free again.
- [ ] Edit personal info, insurance, add / set default / delete a card, change password.
- [ ] Toggle push/email settings and change language. Values persist after reload.

### Manager
- [ ] Log in as `manager@emerald.com` → `/manager` dashboard charts render.
- [ ] Change range / hospital / specialty filters. The URL updates and charts change.
- [ ] Export CSV → file opens in Sheets/Excel with the same rows as the filter.
- [ ] Create, edit, and delete a hospital, specialist, doctor, and schedule.
- [ ] Change a booking status. Tab counts update.
- [ ] As a patient, `/manager` redirects to `/home`.

## 3. Proposed automated test plan

### 3.1 Setup

```bash
pnpm add -D vitest @testing-library/svelte jsdom @playwright/test
```

- Vitest for pure functions and server modules. Point server-module tests at a disposable Postgres (`docker compose` service or Testcontainers) and run `drizzle-kit migrate` before the suite.
- Playwright for end-to-end flows against `pnpm build && pnpm preview` with a freshly seeded DB.

### 3.2 Priority 1 — security and correctness

| ID | Target | Cases |
| -- | ------ | ----- |
| T-01 | Manager actions authorization | POST each `?/create`, `?/update`, `?/delete`, `?/updateStatus` as anonymous and as a patient → expect 403 and **no DB change**. Passes manually since the R1 fix (2026-10-22); needs to be automated. |
| T-02 | `createBookingAtomic` | Fire N concurrent bookings at a slot with `max_quota = 1` → exactly 1 succeeds. Weekday mismatch → `invalid_schedule`. Cancelled bookings don't count. |
| T-03 | `cancelBookingForUser` | Own booking ok. Another user's booking → `not_found`. Already cancelled / completed → error. |
| T-04 | `sanitizeRedirect` | `//evil.com`, `https://evil.com`, `/login`, `/home` → only `/home` passes. |
| T-05 | Password reset | Token hash stored, not raw. Expired / used tokens rejected. New request invalidates old token. Reset deletes sessions. |
| T-06 | `findOrCreateGoogleUser` | Existing `google_id`; email match + verified → link; email match + unverified → refuse; new user → patient. |
| T-07 | `validateSession` | Valid → user. Expired → `null` and row deleted. Unknown → `null`. |

### 3.3 Priority 2 — logic

| ID | Target | Cases |
| -- | ------ | ----- |
| T-10 | `generateTimeSlots`, `parseTime`, `formatTime`, `getDayOfWeek` | Boundaries, non-30-minute end times. |
| T-11 | `parsePagination` | Negative, NaN, over max. |
| T-12 | `parseFilters` / `rangeLabel` | Unknown range → `30d`. |
| T-13 | `addCardForUser` | Invalid brand / last4 / expiry. First card default behaviour. |
| T-14 | `parseProfileForm`, `parseDoctorForm` | Required fields, rating 0–5, fee number. |
| T-15 | CSV `escapeCell` | Commas, quotes, newlines. |
| T-16 | Zustand `search.ts` | Filter combinations, bookmark toggle, persistence key. |

### 3.4 Priority 3 — end-to-end (Playwright)

1. Anonymous search → Book Now → login → book → confirmation.
2. Register → book → cancel.
3. Manager: create doctor → create schedule → patient books it → manager confirms → completes.
4. Forgot password → read link from console or a mail catcher (MailHog / Mailpit) → reset → login.
5. Manager dashboard filters + CSV download contents.

### 3.5 Coverage target

80% line coverage on `src/lib/server/**`, `src/lib/format/**`, `src/lib/domain/**` and `src/lib/utils/**`. Route files are covered through end-to-end tests.

## 4. CI gate (once tests exist)

```
pnpm install --frozen-lockfile
pnpm check
pnpm test            # vitest run --coverage
pnpm build
pnpm audit --prod
pnpm exec playwright test   # optional on main / nightly
```

See [DEPLOYMENT_PLAN.MD](./DEPLOYMENT_PLAN.MD) for where this runs.
