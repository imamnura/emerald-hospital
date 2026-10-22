# Impact Analysis

> Part of the [Purwakarta Health docs](./DEVELOPMENT_STATUS.md). Last verified against code: 2026-10-22.

Use this file before changing a shared module: it lists who depends on what, so you know what to re-test.

## 1. Dependency hotspots

| Module | Depended on by | Blast radius | Re-test |
| ------ | -------------- | ------------ | ------- |
| `src/lib/server/db/schema.ts` | Every server module, all `+page.server.ts`, `scripts/seed.ts`, `drizzle/` | 🔴 Whole app | `pnpm db:generate` → review SQL → `db:migrate` → `pnpm check` → full smoke test. Update `seed.ts`. |
| `src/hooks.server.ts` | Every request (`locals.user`) | 🔴 Whole app | Login, logout, every guarded route, manager access. |
| `src/lib/server/auth.ts` | hooks, login, register, OAuth callback, reset, logout, password change | 🔴 Auth | All flows in [FLOW.MD §4–7](./FLOW.MD#4-registration-and-email-login). |
| `src/lib/server/booking.ts` | `doctors/[id]/book`, `book/confirm`, `/appointments`, profile stats | 🔴 Core business | Booking, full slot, concurrent booking, cancel. |
| `src/lib/server/analytics.ts` | Manager dashboard, `export.csv` | 🟠 Manager reporting | Dashboard filters + CSV parity. |
| `src/lib/server/doctors.ts`, `catalog.ts` | `/find-doctor`, `/home`, `/search`, `/specialists`, `/specialists/[slug]`, `/doctors/[id]`, `book`, `book/confirm`, `/manager` (filter lists) | 🟠 Discovery | All patient browse pages + booking + dashboard filters. |
| `src/lib/server/oauth-google.ts` | `/login/google`, callback | 🟠 Google sign-in | Google login (new, link, refuse). |
| `src/lib/server/password-reset.ts`, `mailer.ts` | `/login/forgot`, `/login/reset/[token]` | 🟢 | Reset flow with and without SMTP. |
| `src/lib/server/pagination.ts` | All 5 manager list pages | 🟢 | Pagination on each list. |
| `src/lib/server/preferences.ts` | `/profile/settings`, `/language` | 🟢 | Toggles persist. |
| `src/lib/stores/search.ts` | `/search`, `FilterOptionsModal`, `SearchResultCard` | 🟢 | Filters, bookmarks. Changing the persisted shape needs a migration in `persist` or users keep stale state. |
| `src/lib/utils/enhance.ts` (`toastForm`) | Nearly every form | 🟠 UX feedback | Success/error toasts on forms. |
| `src/app.css` tokens | Every component | 🟠 Visual | Visual pass on patient + manager. |
| `src/lib/components/manager/*` | All manager pages | 🟢 | Manager pages. |
| `src/routes/+layout.server.ts` | Every page's `data.user` | 🔴 | Anything reading `user` from parent. |

## 2. Data dependencies (FK impact)

| Change | Impacted |
| ------ | -------- |
| Delete / deactivate a **hospital** | Doctors (FK, blocks delete) → their schedules → bookings, dashboard hospital filter, `/find-doctor` hospital filter. |
| Delete / rename a **specialist** | Doctors (FK, blocks delete), `/specialists/[slug]` URLs (slug change breaks links and bookmarks), autocomplete, dashboard specialty chart. |
| Deactivate a **doctor** (`is_active=false`) | Disappears from patient lists (`listActiveDoctors`). Existing bookings stay. |
| Delete a **doctor** | Schedules cascade. Blocked if bookings exist. |
| Change a **schedule** (`day_of_week`, times, `max_quota`) | Existing bookings are **not** re-validated. Lowering quota or shifting times can leave bookings outside the new schedule. |
| Delete a **user** | Cascades sessions, reset tokens, cards, transactions, insurance, medical records. **Blocked** by bookings (no cascade). |

## 3. Impact of planned work

| Planned change (see [TECHDEBT.MD](./TECHDEBT.MD)) | Files touched | Behaviour change | Risk |
| -------------------------------------------------- | ------------- | ---------------- | ---- |
| Switch to `adapter-node` (TD-03) | `vite.config.ts`, `package.json` | Build output → `build/`. Needs `ORIGIN` env behind a proxy, or reset links / OAuth redirect URIs break. | Medium |
| Booking state machine (TD-05) | `manager/bookings/+page.server.ts`, maybe `booking.ts` | Some status changes in the UI start failing. Status `<select>` should hide invalid options. | Low |
| Soft delete (TD-26) | `schema.ts` + migration, all manager delete actions, every patient query (filter deleted rows) | Deleted items vanish from the UI but stay in the DB. | Medium–High (many queries) |
| Revoke sessions on password change (TD-09) | `profile/settings/password/+page.server.ts` | Other devices are signed out. | Low |
| i18n (TD-12) | Every component and page with strings | Large diff; string keys everywhere. | High (merge conflicts) — do it in a quiet period. |
| Rename storage key `emerald-search` (TD-16) | `stores/search.ts` | Existing bookmarks and filters are lost unless migrated. | Low |
| Rename seed emails (TD-16) | `scripts/seed.ts`, docs | Demo credentials change. Update [TECH_IMPLEMENTATION.MD](./TECH_IMPLEMENTATION.MD#demo-accounts-after-pnpm-dbseed). | Low |
| SvelteKit / Svelte major upgrades | `package.json`, possibly route APIs | Check the migration guides for `load`/actions/`$app/*` changes. | Medium |

## 4. Change checklist

Before merging a change to any 🔴 or 🟠 module:

- [ ] Listed the impacted routes from the tables above in the MR description.
- [ ] `pnpm check` and `pnpm build` pass.
- [ ] Ran the relevant sections of the manual smoke test ([TESTING.MD §2](./TESTING.MD#2-manual-smoke-test-before-every-merge)).
- [ ] Schema change → migration file committed and `seed.ts` updated.
- [ ] Updated the affected doc in `docs/`.
