# Permissions & Access Control

> Part of the [Purwakarta Health docs](./DEVELOPMENT_STATUS.md). Last verified against code: 2026-11-26.

## 1. Roles

| Role | How it is assigned | Lands on |
| ---- | ------------------ | -------- |
| Anonymous | No valid `session_id` cookie | `/` |
| `patient` | Default for `/register` and new Google sign-ins | `/home` |
| `manager` | Seed data or a direct DB update only — no UI for role management | `/manager` |

The role lives in `users.role` (enum `user_role`). There are no finer-grained permissions, per-hospital scoping, or super-admin role. Every manager can see and change everything.

## 2. How guards work today

`hooks.server.ts` resolves the session on every request and sets `locals.user`. Protection is layered:

| Mechanism | Where | Covers |
| --------- | ----- | ------ |
| Layout guard | `src/routes/manager/+layout.server.ts` | Page **loads** under `/manager/**`. Anonymous → `/login?redirect=/manager`; patient → `/home`. |
| Hook backstop | `src/hooks.server.ts` | Any non-GET/HEAD/OPTIONS request to `/manager` or `/manager/**` from a non-manager → plain-text `403 Manager access required.` |
| Action guard | `denyUnlessManager(locals)` in `src/lib/server/auth/guards.ts` | Called at the top of every manager form action → `fail(403, { error })`. |
| Load helpers | `requireUser()` / `requirePatient()` / `requireManager()` in `src/lib/server/auth/guards.ts` | Redirect-style helpers used by patient and manager loads; each takes an optional `returnTo` for the `?redirect=` target. |
| Inline checks | A few `+server.ts` endpoints | `if (!locals.user) redirect(303, '/login?redirect=…')` where a helper does not fit. |

> **Important SvelteKit behaviour:** a `+layout.server.ts` guard does **not** run before a form action. `POST /manager/doctors?/delete` executes the action even if the layout load would redirect. That is why manager actions check the role themselves, with the hook as a second layer.

## 3. Access matrix — pages

✅ allowed · ↪ redirected · 🔓 allowed but probably shouldn't be

| Route | Anonymous | Patient | Manager |
| ----- | --------- | ------- | ------- |
| `/` | ✅ | ↪ `/home` | ↪ `/manager` |
| `/find-doctor` | ✅ | ✅ | ✅ |
| `/login`, `/register`, `/login/forgot`, `/login/reset/[token]` | ✅ | ↪ | ↪ |
| `/home`, `/search`, `/specialists`, `/specialists/[slug]` | ✅ (no guard) | ✅ | 🔓 |
| `/doctors/[id]`, `/doctors/[id]/book`, `/book/confirm` (view) | ✅ (no guard) | ✅ | 🔓 |
| `/appointments` | ↪ login | ✅ | ↪ `/manager` |
| `/profile/**` | ↪ login | ✅ | 🔓 (no role check) |
| `/manager/**` | ↪ login | ↪ `/home` | ✅ |

## 4. Access matrix — mutations and endpoints

| Target | Check in code | Gap |
| ------ | ------------- | --- |
| `GET /api/specialists` | none | Public by design (specialty names only). |
| `GET /manager/export.csv` | `manager` role, else `403` | — |
| `POST /doctors/[id]/book/confirm` | logged in | Managers can create bookings for themselves. |
| `POST /appointments?/cancel` | `patient` role + booking belongs to user | — |
| `POST /profile/**` actions | logged in; queries scoped by `locals.user.id` | Managers can edit their own patient-style data. Low risk. |
| `POST /manager/{hospitals,specialists,doctors,schedules}` `?/create` `?/update` `?/delete` | hook + `denyUnlessManager` → 403 | — |
| `POST /manager/bookings?/updateStatus` | hook + `denyUnlessManager` → 403 | — |

Previously these actions had no check at all (**R1**, fixed 2026-10-22, see [RISK_ANALYSIS.MD](./RISK_ANALYSIS.MD#r1)). Verified manually: anonymous and patient POSTs return 403; manager POSTs run normally.

## 5. Ownership (row-level) rules

Patient data is scoped by `user_id = locals.user.id` in the server modules:

| Module | Scoping |
| ------ | ------- |
| `booking.ts` → `cancelBookingForUser`, `getAppointmentForUser`, `listAppointmentsForUser` | `bookings.user_id` |
| `payments.ts` → `setDefaultCard`, `deleteCard`, list functions | `payment_cards.user_id` |
| `insurance.ts`, `medical-records.ts`, `users.ts` | `user_id` / own row |

A patient cannot read or change another patient's records through these paths.

## 6. Rules for new code

1. **Every new manager form action** starts with:

   ```ts
   import { denyUnlessManager } from '#lib/server/auth/guards.ts';

   export const actions: Actions = {
     create: async ({ request, locals }) => {
       const denied = denyUnlessManager(locals);
       if (denied) return denied;
       // …
     }
   };
   ```

   The hook in `hooks.server.ts` is a backstop only. Don't rely on it alone: it only covers paths under `/manager`.
2. **New `+server.ts` endpoints** under `/manager` must check `isManager(locals)` for GET too (the hook only blocks non-GET methods), as `export.csv` does.
3. **Open question:** may managers use the patient app? If not, add a `(patient)/+layout.server.ts` role redirect and a role check in `book/confirm` (TD-20).
4. Automated regression test for the 403s is still to do (T-01 in [TESTING.MD](./TESTING.MD)).
