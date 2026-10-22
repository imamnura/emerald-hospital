# Tech Debt & Roadmap

> Part of the [Purwakarta Health docs](./DEVELOPMENT_STATUS.md). Last verified against code: 2026-10-22.

Priority: **P0** fix before any deploy · **P1** next sprint · **P2** planned · **P3** nice to have.
Effort: **S** < ½ day · **M** 1–3 days · **L** > 3 days.

## 1. Tech debt register

| ID | Item | Where | Priority | Effort |
| -- | ---- | ----- | -------- | ------ |
| TD-02 | No automated tests (Vitest / Playwright) | — | P0 | L |
| TD-03 | `adapter-auto` still configured; warns on every build | `vite.config.ts` | P0 | S |
| TD-05 | Booking status updates accept any transition | `manager/bookings/+page.server.ts` | P1 | S |
| TD-06 | `requirePatient` / `requireManager` (now in `lib/server/guards.ts`) are still unused; patient routes repeat inline checks | all `(patient)` `+page.server.ts` | P2 | S |
| TD-07 | Reset email HTML interpolates `user.name` unescaped (R4) | `lib/server/password-reset.ts` | P1 | S |
| TD-08 | `validateSession` runs two queries per request; can be one join with an `expires_at` check | `lib/server/auth.ts` | P2 | S |
| TD-09 | Password change doesn't revoke other sessions | `profile/settings/password/+page.server.ts` | P2 | S |
| TD-10 | No error tracking; only `console.error` in the OAuth callback | `login/google/callback/+server.ts` | P1 | S |
| TD-11 | `SESSION_SECRET` documented but unused | `.env.example` | P3 | S |
| TD-12 | No i18n. Mixed English / Indonesian strings; language picker only sets a cookie | all components | P2 | L |
| TD-13 | Notification preferences don't drive anything | `lib/server/preferences.ts` | P2 | M |
| TD-14 | Help FAQ answers are placeholders | `lib/data/help-support.ts` | P3 | S |
| TD-15 | Landing "popular doctors" is mock data, not from the DB | `lib/data/landing.ts` | P3 | S |
| TD-16 | Rebrand leftovers: CSV header and filename "Emerald", seed emails `@emerald.com`, storage key `emerald-search`, package name | `export.csv/+server.ts`, `scripts/seed.ts`, `stores/search.ts`, `package.json` | P3 | S |
| TD-17 | `logs/combined.log` (Storybook MCP tool log) is tracked in git | `logs/` | P1 | S |
| TD-18 | First-card-default logic: `makeDefault` is always a boolean from the form, so `?? !existing` never applies — a first card added unchecked is not default | `lib/server/payments.ts` → `addCardForUser` | P2 | S |
| TD-19 | Expired `sessions` / `password_reset_tokens` rows are never purged | DB | P2 | S |
| TD-20 | Managers can use the patient app and create bookings | `(patient)` routes, `book/confirm` | P2 | S |
| TD-21 | Duplicated query-building in manager list pages (count + list + filters repeated) | `manager/*/+page.server.ts` | P3 | M |
| TD-22 | Raw SQL row-shape handling in `createBookingAtomic` (`rows?.[0] ?? [0]` cast) | `lib/server/booking.ts` | P3 | S |
| TD-23 | Modals not audited for focus trapping / WCAG | `components/manager/Modal.svelte`, patient modals | P2 | M |
| TD-24 | No dark mode tokens | `src/app.css` | P3 | M |
| TD-25 | Error / 404 pages unbranded | `src/routes/+error.svelte` (missing) | P3 | S |
| TD-26 | No soft delete or audit log for manager changes | schema | P2 | M |
| TD-27 | No role-management UI | manager | P2 | M |
| TD-28 | `@esbuild-kit/*` deprecated subdependencies via `drizzle-kit@0.31`; esbuild CVE neutralised through overrides | `pnpm-workspace.yaml` | P3 | — |

### Resolved

- ~~TD-04 Delete actions don't handle FK violations~~ — fixed 2026-10-22: delete returns `409`; non-UUID ids return `404`; unknown doctor/hospital/specialty references return `400`.
- Bugs found by the unit-test pass, fixed 2026-10-22: Google sign-in redirect (SvelteKit 3 needs `{ external: true }`); `useZustand` not re-rendering (search page + filter modal); delete / set-default forms posting an empty id (`await tick()` before `requestSubmit()`); schedule day select never selected + empty day saved as Sunday; calendar and "upcoming" dates shifted one day in UTC+ timezones (`toLocalDateString`); Google-only users unable to set a password; `setDefaultCard` clearing the default for unknown cards; missing `sessionsRelations`; non-UUID ids in URLs/forms causing 500s.

- ~~TD-01 Manager form actions lack role checks~~ — fixed 2026-10-22: `denyUnlessManager` in all 13 actions + hook backstop (R1).

- ~~Manager CRUD is create / delete only~~ — all four entities now have `?/update` + edit modal, plus search and pagination.
- ~~Forgot password not implemented~~ — done with hashed single-use tokens and SMTP.

## 2. Roadmap (suggested order)

| # | Goal | Closes |
| - | ---- | ------ |
| 1 | **Security hardening:** rate limits, email escaping (manager action guards done) | TD-07, R3, R4 |
| 2 | **Deploy foundation:** pick adapter (Node recommended), CI pipeline, staging env, error tracking | TD-03, TD-10, TD-17 |
| 3 | **Test suite:** Vitest for `lib/server` + Playwright smoke flows | TD-02 |
| 4 | **Data integrity:** soft delete, booking state machine, audit log | TD-05, TD-26 |
| 5 | **Account features:** Google ↔ password account linking UI, revoke sessions on password change, role management | TD-09, TD-27 |
| 6 | **Notifications:** booking confirmation emails, web push / FCM, honour preferences | TD-13 |
| 7 | **i18n:** `@inlang/paraglide-sveltekit` or similar, extract strings, wire the language cookie | TD-12 |
| 8 | **Accessibility audit:** focus traps, contrast, tab order | TD-23 |
| 9 | **Polish:** branded error pages, dark mode, real FAQ, DB-driven landing doctors, finish rebrand | TD-14, TD-15, TD-16, TD-24, TD-25 |

## 3. How to add an item

Add a row with the next `TD-xx` ID, the file path, priority, and effort. When it's fixed, move it to "Resolved" with a one-line note and the commit hash.
