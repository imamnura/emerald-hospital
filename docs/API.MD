# API Reference

> Part of the [Purwakarta Health docs](./DEVELOPMENT_STATUS.md). Last verified against code: 2026-10-22.

The app has no standalone REST API. Its server surface is:

1. **JSON / file endpoints** — `+server.ts` files (4 total).
2. **Form actions** — `actions` in `+page.server.ts`, invoked with `POST <route>?/<actionName>` (or `POST <route>` for `default`).
3. **Page loads** — `load` in `+page.server.ts`, driven by URL query params.

Conventions:

- Form actions take `application/x-www-form-urlencoded` or `multipart/form-data`. With `use:enhance` SvelteKit returns a JSON `ActionResult`; without it the response is a full page or a `303` redirect.
- Validation errors return `fail(400, { error: string })`. Not-found returns `fail(404, { error })`. Success typically returns `{ success: true, message? }` or a `303` redirect.
- SvelteKit's built-in CSRF check rejects cross-origin form POSTs.
- Auth = the `session_id` cookie. The **Auth** column below states what the code actually checks today; see [PERMISSION.MD](./PERMISSION.MD) for gaps.

---

## 1. Endpoints (`+server.ts`)

### `GET /api/specialists`

Specialty autocomplete used by `SpecialtyAutocomplete.svelte`.

| Param | Type | Default | Notes |
| ----- | ---- | ------- | ----- |
| `q` | string | — | Case-insensitive `ILIKE %q%` on name. Empty → all specialists. |
| `limit` | int | `8` | Clamped to 1–20. |

**Auth:** none (public).
**Response 200:**

```json
[{ "name": "Cardiology", "slug": "cardiology" }]
```

Ordered by name ascending.

### `GET /manager/export.csv`

Downloads the filtered booking list as CSV (UTF-8 with BOM, so Excel and Sheets show non-ASCII names correctly).

| Param | Values | Default |
| ----- | ------ | ------- |
| `range` | `7d`, `30d`, `90d`, `365d`, `all` | `30d` |
| `hospitalId` | hospital UUID | — |
| `specialistId` | specialist UUID | — |

**Auth:** `manager` role, else `403 Manager access required`.
**Headers:** `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="emerald-bookings-<range>-<YYYY-MM-DD>.csv"`, `Cache-Control: no-store`.
**Columns:** Booking ID, Patient, Doctor, Specialty, Hospital, Appointment Date, Appointment Time, Status. The file starts with two `#` comment lines (title + generated timestamp).

### `GET /login/google`

Starts Google sign-in. Sets `state`, PKCE verifier and optional `redirect` cookies (HttpOnly, path `/login/google`, 10 min), then `303` to Google.

| Param | Notes |
| ----- | ----- |
| `redirect` | Post-login path; only same-origin relative paths are kept. |

**Errors:** `500` when `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are not set.

### `GET /login/google/callback`

Google redirect target. Validates `state`, exchanges `code` with the PKCE verifier, fetches user info, then finds, links, or creates the user and sets the session cookie.

**Success:** `303` → `/manager` for managers, otherwise the saved redirect or `/home`.
**Failure:** `303` → `/login?error=<message>` (cancelled, expired session, state mismatch, unverified email conflict, token exchange failure).

---

## 2. Form actions

### 2.1 Authentication

| Route | Action | Fields | Auth | Result |
| ----- | ------ | ------ | ---- | ------ |
| `/login` | `default` | `email`, `password`, `redirect?` | anonymous | Sets session → `303` to safe `redirect` or role home. `400` "Invalid email or password." / Google-only account message. |
| `/register` | `default` | `name`, `email`, `phone?`, `password` (≥ 8) | anonymous | Creates `patient`, sets session → `303 /home`. `400` on missing fields or duplicate email. |
| `/login/forgot` | `default` | `email` | anonymous | Always `{ success: true, email }` when the email format is valid (no enumeration). Sends the reset link if the account exists. |
| `/login/reset/[token]` | `default` | `password` (≥ 8), `confirmPassword` | token | Updates hash, consumes token, deletes all sessions → `303 /login?reset=success`. `400 { expired: true }` for invalid or expired tokens. |
| `/profile` | `logout` | — | any session | Deletes session, clears cookie → `303 /login`. Also used by the manager layout. |
| `/profile/settings` | `logout` | — | any session | Same as above. |

`redirect` safety rule (`safeRedirect` in `login/+page.server.ts`): must start with `/`, not `//`, and not `/login`; otherwise the role default (`/manager` or `/home`) is used.

### 2.2 Patient

| Route | Action | Fields | Auth check in code | Result |
| ----- | ------ | ------ | ------------------ | ------ |
| `/doctors/[id]/book/confirm` | `default` | `scheduleId`, `appointmentDate` (YYYY-MM-DD), `appointmentTime` (HH:mm) | logged in (any role) | `createBookingAtomic` → `303 /appointments?booked=<id>`. `400` "Selected slot is no longer available." / "Invalid schedule for selected date." Anonymous → `303 /login?redirect=…`. |
| `/appointments` | `cancel` | `bookingId` | `patient` | Cancels own booking. Fails if already cancelled or completed. `401` / `403` otherwise. |
| `/profile/personal` | `update` | `name`, `phone`, `dateOfBirth`, `gender`, `address`, `bloodType`, `imageUrl` | logged in | Updates own profile. |
| `/profile/settings/password` | `change` | `currentPassword` (required if a password exists), `newPassword` (≥ 8), `confirmPassword` | logged in | `{ success: true }`. Google-only users can set a first password without `currentPassword`. Other sessions stay active. |
| `/profile/settings` | `togglePush`, `toggleEmail` | — | logged in | Flips a preference cookie. |
| `/profile/settings/language` | `set` | `language` (`en` \| `id`) | logged in | Sets cookie → `303 /profile/settings`. |
| `/profile/insurance` | `save` | `providerName`, `providerPhone`, `planName`, `planType`, `memberId`, `groupNo`, `status`, `coverageStart`, `coverageEnd`, `costPcp`, `costSpecialist`, `costEmergency`, `costRx` | logged in | Upserts the single insurance profile. |
| `/profile/payment-methods` | `add` | `brand` (`visa` \| `mastercard`), `last4` (4 digits), `expires` (`MM/YY`), `makeDefault` (`on`) | logged in | Stores card metadata only. `400` on invalid input. |
| `/profile/payment-methods` | `setDefault` | `cardId` | logged in | Scoped to the user's own cards. |
| `/profile/payment-methods` | `delete` | `cardId` | logged in | Scoped to the user's own cards. |

### 2.3 Manager

All manager actions return `{ success: true, message }` or `fail(400 | 404, { error })`.

**Auth:** `manager` role. Each action calls `denyUnlessManager(locals)` → `fail(403, { error: 'Manager access required.' })`, and `hooks.server.ts` rejects non-GET requests to `/manager/**` from non-managers with a plain-text `403` before the action runs. See [PERMISSION.MD](./PERMISSION.MD).

| Route | Actions | Fields |
| ----- | ------- | ------ |
| `/manager/hospitals` | `create`, `update`, `delete` | `id` (update/delete), `name`, `address`, `city`, `contact`, `imageUrl` |
| `/manager/specialists` | `create`, `update`, `delete` | `id`, `name`, `slug`, `icon` |
| `/manager/doctors` | `create`, `update`, `delete` | `id`, `name`, `hospitalId`, `specialistId`, `imageUrl`, `rating` (0–5, default 4.5), `isActive` (checkbox), `bio`, `consultationFee` |
| `/manager/schedules` | `create`, `update`, `delete` | `id`, `doctorId`, `dayOfWeek` (0–6), `startTime`, `endTime`, `maxQuota` |
| `/manager/bookings` | `updateStatus` | `id`, `status` (`pending` \| `confirmed` \| `cancelled` \| `completed`) |

Error statuses common to all manager actions: `400` validation or missing id, `404` unknown **or non-UUID** id, `409` delete blocked by dependent rows. Doctors return `400` "Selected hospital or specialty no longer exists." and schedules `400` "Selected doctor no longer exists." for unknown references.

Manager status updates allow any transition (for example `completed → pending`). Patient cancellation is the only path that enforces state rules.

---

## 3. Page loads and query params

| Route | Query params | Notes |
| ----- | ------------ | ----- |
| `/` | — | Redirects managers → `/manager`, patients → `/home`. |
| `/find-doctor` | `q` (specialty / name), `hospital` (slug-ish name or `all`) | Public search results. If the hospital filter matches nothing, it is silently ignored. |
| `/home` | `specialist` (slug) | Filters recommended doctors. |
| `/search` | `q`, `filter=open` | `filter=open` opens the filter modal on load. Rating, price, and availability filters run client-side (Zustand). |
| `/specialists/[slug]` | — | `404` if the slug is unknown. |
| `/doctors/[id]` | — | `404` if the doctor is unknown. |
| `/doctors/[id]/book` | `date` | Date + slot picker. |
| `/doctors/[id]/book/confirm` | `date`, `time`, `scheduleId` | Redirects back to `/book` if params are missing, the schedule doesn't match the weekday, or the slot is full. |
| `/appointments` | `booked` (booking id) | Shows the confirmation modal for a just-created booking. |
| `/login` | `redirect`, `error`, `reset=success` | |
| `/manager` | `range`, `hospitalId`, `specialistId` | Dashboard filters (same as CSV). |
| `/manager/hospitals`, `/manager/specialists` | `q`, `page`, `pageSize` | |
| `/manager/doctors` | `q`, `hospitalId`, `specialistId`, `page`, `pageSize` | |
| `/manager/schedules` | `q`, `doctorId`, `page`, `pageSize` | |
| `/manager/bookings` | `q`, `status`, `page`, `pageSize` | Status tab counts ignore the `status` filter. |

Pagination (`src/lib/server/pagination.ts`): `page` ≥ 1 (default 1), `pageSize` 1–100 (default 10).
