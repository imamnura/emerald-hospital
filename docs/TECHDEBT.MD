# Tech Debt & Roadmap

> Part of the [Purwakarta Health docs](./DEVELOPMENT_STATUS.md). Last verified against code: 2026-11-26.

Priority: **P0** fix before any deploy · **P1** next sprint · **P2** planned · **P3** nice to have.
Effort: **S** < ½ day · **M** 1–3 days · **L** > 3 days.

## 1. Tech debt register

| ID | Item | Where | Priority | Effort |
| -- | ---- | ----- | -------- | ------ |
| TD-02 | No automated tests (Vitest / Playwright) | — | P0 | L |
| TD-03 | `adapter-auto` still configured; warns on every build | `vite.config.ts` | P0 | S |
| TD-05 | Booking status updates accept any transition | `manager/bookings/+page.server.ts` | P1 | S |
| TD-07 | Reset email HTML interpolates `user.name` unescaped (R4) | `lib/server/auth/password-reset.ts` | P1 | S |
| TD-09 | Password change doesn't revoke other sessions | `profile/settings/password/+page.server.ts` | P2 | S |
| TD-10 | No error tracking; only `console.error` in the OAuth callback | `login/google/callback/+server.ts` | P1 | S |
| TD-12 | No i18n. Mixed English / Indonesian strings; language picker only sets a cookie | all components | P2 | L |
| TD-13 | Notification preferences don't drive anything | `lib/server/patient/preferences.ts` | P2 | M |
| TD-14 | Help FAQ answers are placeholders | `lib/data/help-support.ts` | P3 | S |
| TD-15 | Landing "popular doctors" is mock data, not from the DB | `lib/data/landing.ts` | P3 | S |
| TD-16 | Rebrand leftovers: CSV header and filename "Emerald", seed emails `@emerald.com`, storage key `emerald-search`, package name | `export.csv/+server.ts`, `scripts/seed.ts`, `stores/search.ts`, `package.json` | P3 | S |
| TD-18 | First-card-default logic: `makeDefault` is always a boolean from the form, so `?? !existing` never applies — a first card added unchecked is not default | `lib/server/patient/payments.ts` → `addCardForUser` | P2 | S |
| TD-19 | Expired `sessions` / `password_reset_tokens` rows are never purged | DB | P2 | S |
| TD-20 | Managers can use the patient app and create bookings | `(patient)` routes, `book/confirm` | P2 | S |
| TD-23 | Modals not audited for focus trapping / WCAG | `components/ui/Modal.svelte`, `components/ui/Dialog.svelte`, patient modals | P2 | M |
| TD-24 | No dark mode tokens | `src/app.css` | P3 | M |
| TD-25 | Error / 404 pages unbranded | `src/routes/+error.svelte` (missing) | P3 | S |
| TD-26 | No soft delete or audit log for manager changes | schema | P2 | M |
| TD-27 | No role-management UI | manager | P2 | M |
| TD-28 | `@esbuild-kit/*` deprecated subdependencies via `drizzle-kit@0.31`; esbuild CVE neutralised through overrides | `pnpm-workspace.yaml` | P3 | — |
| TD-29 | `typescript` held at 6.x: `@sveltejs/kit` 3.4 (`^6.0.0`) and `svelte-check` 4.7 (`^5 \|\| ^6`) don't support TS 7 yet. Lift when both peer ranges include `^7` | `package.json` | P2 | S |
| TD-30 | `@types/node` held at 24.x to match the Node 24 runtime (24.22.3). Move together with a Node runtime upgrade | `package.json` | P3 | S |
| TD-31 | Mixed English / Indonesian `DAY_NAMES` (Indonesian) and the `longId` date preset, next to English UI strings (relates to TD-12) | `lib/format/date.ts` | P3 | S |
| TD-32 | Three hand-rolled back headers do not use `BackHeader` | `doctors/[id]/+page.svelte`, `book/+page.svelte`, `book/confirm/+page.svelte` | P3 | S |
| TD-33 | Register / forgot / reset password icon inputs do not use `FormIconField` | `register/`, `login/forgot/`, `login/reset/[token]/` | P3 | S |
| TD-35 | Dashboard loader (`manager/+page.server.ts`) issues ~11 parallel queries while the postgres-js pool defaults to `max: 10`; set `max` explicitly or group reads | `lib/server/db/index.ts:9`, `routes/manager/+page.server.ts` | P3 | S |
| TD-36 | `src/routes/+page.svelte` is 262 lines (target is 250); split a landing section into a component | `routes/+page.svelte` | P3 | S |

### Resolved

- ~~TD-34 `analytics.parseFilters` did not UUID-check the hospital / specialist filters (`/manager?hospitalId=abc` and the CSV export returned 500)~~ — fixed 2026-11-26 (d5bce72): non-UUID values are ignored via `uuidOrUndefined`.
- ~~TD-06 `requirePatient` / `requireManager` unused, inline checks repeated~~ — fixed 2026-11-26 (fbee7b9): shared guards in `lib/server/auth/guards.ts` (`requireUser`, `requirePatient`, `requireManager`) used by loads.
- ~~TD-08 `validateSession` ran two queries per request~~ — fixed 2026-11-26 (8be435d): one `sessions` ⨝ `users` query with the expiry check.
- ~~TD-11 Unused session-secret env var documented~~ — fixed 2026-11-26 (8782637): variable removed from `.env.example` and the docs.
- ~~TD-17 `logs/combined.log` tracked in git~~ — fixed 2026-11-26 (8782637): untracked, `logs/` is gitignored.
- ~~TD-21 Duplicated query-building in manager list pages~~ — fixed 2026-11-26 (67e607b): shared `searchWhere` / `paginate` / `uuidOrUndefined` (`lib/server/http/list-query.ts`) and form helpers.
- ~~TD-22 Raw SQL row-shape handling in `createBookingAtomic`~~ — fixed 2026-11-26 (8be435d, 28f7e9b).
- Client data no longer includes `passwordHash` / `googleId`: layouts and loads return `PublicUser` — fixed 2026-11-26 (471c973, bdf9e1f).
- Foreign-key indexes added for join / filter columns (migration `0004`) — 2026-11-26 (5558a46).
- Reset-token reuse race closed: the token is consumed atomically — 2026-11-26 (28f7e9b).
- ~~TD-04 Delete actions don't handle FK violations~~ — fixed 2026-10-22: delete returns `409`; non-UUID ids return `404`; unknown doctor/hospital/specialty references return `400`.
- Bugs found by the unit-test pass, fixed 2026-10-22: Google sign-in redirect (SvelteKit 3 needs `{ external: true }`); `useZustand` not re-rendering (search page + filter modal); delete / set-default forms posting an empty id (`await tick()` before `requestSubmit()`); schedule day select never selected + empty day saved as Sunday; calendar and "upcoming" dates shifted one day in UTC+ timezones (`toLocalDateString`); Google-only users unable to set a password; `setDefaultCard` clearing the default for unknown cards; missing `sessionsRelations`; non-UUID ids in URLs/forms causing 500s.

- ~~TD-01 Manager form actions lack role checks~~ — fixed 2026-10-22: `denyUnlessManager` in all 13 actions + hook backstop (R1).

- ~~Manager CRUD is create / delete only~~ — all four entities now have `?/update` + edit modal, plus search and pagination.
- ~~Forgot password not implemented~~ — done with hashed single-use tokens and SMTP.

## 2. Roadmap (suggested order)

| # | Goal | Closes |
| - | ---- | ------ |
| 1 | **Security hardening:** rate limits, email escaping (manager action guards done) | TD-07, R3, R4 |
| 2 | **Deploy foundation:** pick adapter (Node recommended), CI pipeline, staging env, error tracking | TD-03, TD-10 |
| 3 | **Test suite:** Vitest for `lib/server` + Playwright smoke flows | TD-02 |
| 4 | **Data integrity:** soft delete, booking state machine, audit log | TD-05, TD-26 |
| 5 | **Account features:** Google ↔ password account linking UI, revoke sessions on password change, role management | TD-09, TD-27 |
| 6 | **Notifications:** booking confirmation emails, web push / FCM, honour preferences | TD-13 |
| 7 | **i18n:** `@inlang/paraglide-sveltekit` or similar, extract strings, wire the language cookie | TD-12 |
| 8 | **Accessibility audit:** focus traps, contrast, tab order | TD-23 |
| 9 | **Polish:** branded error pages, dark mode, real FAQ, DB-driven landing doctors, finish rebrand | TD-14, TD-15, TD-16, TD-24, TD-25 |

## 3. How to add an item

Add a row with the next `TD-xx` ID, the file path, priority, and effort. When it's fixed, move it to "Resolved" with a one-line note and the commit hash.
