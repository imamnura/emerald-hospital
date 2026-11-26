# Technical Implementation

> Part of the [Purwakarta Health docs](./DEVELOPMENT_STATUS.md). Last verified against code: 2026-11-26.

This file covers feature status, setup, configuration, and implementation notes per feature. For the big picture see [ARCHITECTURE.MD](./ARCHITECTURE.MD).

## 1. Feature status

Legend: ✅ done · 🟡 partial · ⬜ not started · ❌ blocked

### 1.1 Public (anonymous-friendly)

| Area | Status | Implementation |
| ---- | ------ | -------------- |
| Landing page | ✅ | `routes/+page.svelte`. Hero, features, popular doctors, testimonials, footer. Content in `lib/data/landing.ts`. Logged-in users are redirected. |
| Hero search with specialty autocomplete | ✅ | `SpecialtyAutocomplete.svelte` → `GET /api/specialists`. 250 ms debounce, ARIA combobox. |
| Public doctor finder | ✅ | `routes/find-doctor`. Server-filtered with `filterDoctorsByQuery` + hospital name match. |
| Popular doctors on landing | 🟡 | Mock data in `lib/data/landing.ts`, not from the DB. |

### 1.2 Patient

| Area | Status | Implementation |
| ---- | ------ | -------------- |
| Email + password registration | ✅ | `register/+page.server.ts`. Argon2 hash, auto-login. |
| Email + password login | ✅ | `login/+page.server.ts`, with `?redirect=` support via `sanitizeRedirect`. |
| Google sign-in | ✅ | `login/google/*`, `lib/server/auth/oauth-google.ts`. PKCE, verified-email auto-link. |
| Forgot / reset password | ✅ | `login/forgot`, `login/reset/[token]`, `lib/server/auth/password-reset.ts`, `lib/server/mailer.ts`. |
| Home / specialty discovery | ✅ | `(patient)/home`, `?specialist=` filter. |
| Specialist list + detail | ✅ | `(patient)/specialists`, `(patient)/specialists/[slug]`. |
| Search + filters + bookmarks | ✅ | `(patient)/search`, Zustand `useSearchStore` (persisted to `localStorage`). |
| Doctor profile | ✅ | `(patient)/doctors/[id]`. |
| Booking (calendar + slot) | ✅ | `doctors/[id]/book` + `confirm`, `createBookingAtomic`. |
| Booking confirmation | ✅ | `AppointmentConfirmedModal` via `/appointments?booked=`. |
| My appointments + cancel | ✅ | `(patient)/appointments`, `cancelBookingForUser`. |
| Profile dashboard | ✅ | Blood type, next visit, completed count. |
| Personal information edit | ✅ | `profile/personal`, `lib/server/patient/users.ts`. |
| Account settings | ✅ | Push / email toggles stored in cookies. |
| Change / set password | ✅ | Google-only users can add a password. |
| Language picker | 🟡 | Saves a cookie only. No translated strings. |
| Help & support | 🟡 | Contacts work. FAQ answers are placeholders. |
| Insurance details | ✅ | `profile/insurance`, `insurance_profiles` upsert. |
| Payment methods | ✅ | `profile/payment-methods`. Card metadata only (brand, last4, expiry). No payment gateway. |
| Medical records | ✅ | Read-only list. Download needs `file_url`. No upload. |
| Push notifications | ⬜ | Toggle only. |
| Live chat | ⬜ | Placeholder button. |

### 1.3 Manager

| Area | Status | Implementation |
| ---- | ------ | -------------- |
| Dashboard with charts | ✅ | `manager/+page.server.ts` + `lib/server/booking/analytics.ts`, SVG charts. |
| Filters (range, hospital, specialty) | ✅ | URL-driven GET form. |
| Trend chips vs previous period | ✅ | `previousTotals`. Hidden for `range=all`. |
| CSV export | ✅ | `manager/export.csv/+server.ts`. |
| Hospitals CRUD | ✅ | Create / **update** / delete, search, pagination. |
| Specialists CRUD | ✅ | Create / update / delete, search, pagination. |
| Doctors CRUD | ✅ | Create / update / delete, search + hospital + specialty filter, pagination. |
| Schedules CRUD | ✅ | Create / update / delete, doctor filter, pagination. |
| Bookings list + status update | ✅ | Status tabs with counts, search, pagination, inline status change. |
| Manager authorization on actions | ✅ | `denyUnlessManager` in every action + hook backstop. See [PERMISSION.MD](./PERMISSION.MD). |
| Role management UI | ⬜ | Roles can only be changed in the DB. |
| Soft delete / audit trail | ⬜ | Hard deletes only. |

> The earlier status doc listed manager CRUD as "create / delete only". That is outdated: all four entities now have `?/update` actions and an edit modal.

### 1.4 Cross-cutting

| Area | Status | Notes |
| ---- | ------ | ----- |
| Branding (Purwakarta Health) | 🟡 | UI rebranded. CSV export, seed emails, and storage key still say "Emerald". |
| Mobile-first responsive layout | ✅ | Patient mobile-first, manager sidebar + drawer. |
| Dark mode | ⬜ | |
| i18n | ⬜ | |
| Accessibility | 🟡 | Keyboard navigation works. Not WCAG-audited. |
| Automated tests | ⬜ | See [TESTING.MD](./TESTING.MD). |
| CI / CD | ⬜ | See [DEPLOYMENT_PLAN.MD](./DEPLOYMENT_PLAN.MD). |
| Production adapter | 🟡 | Still `adapter-auto`. |
| Error / 404 pages | 🟡 | SvelteKit defaults. |
| Logging / monitoring | ⬜ | `console.error` only. |
| Rate limiting | ⬜ | None at the app layer. |

## 2. Local development

```bash
# Prerequisites: Node 22.17+, pnpm 11, Docker
pnpm install
docker compose up -d            # PostgreSQL 16 on :5432 (db: emerald_hospital, user/pass: postgres)
cp .env.example .env            # edit DATABASE_URL if needed
pnpm db:migrate                 # apply drizzle/ migrations
pnpm db:seed                    # demo data (wipes existing rows)
pnpm dev                        # http://localhost:5173
```

### Scripts

| Command | What it does |
| ------- | ------------ |
| `pnpm dev` | Vite dev server with hot reload |
| `pnpm build` | Production build (adapter-auto) |
| `pnpm preview` | Serve the built app locally |
| `pnpm check` | `svelte-kit sync && svelte-check` — types + a11y lint |
| `pnpm check:watch` | Same, in watch mode |
| `pnpm db:generate` | Generate a SQL migration from `schema.ts` |
| `pnpm db:migrate` | Apply pending migrations to `DATABASE_URL` |
| `pnpm db:push` | Sync schema directly, no migration file (prototyping only) |
| `pnpm db:studio` | Drizzle Studio web UI |
| `pnpm db:seed` | Wipe and repopulate demo data (`scripts/seed.ts` via `tsx`) |

### Demo accounts (after `pnpm db:seed`)

| Role | Email | Password |
| ---- | ----- | -------- |
| Manager | `manager@emerald.com` | `password123` |
| Patient | `patient@emerald.com` | `password123` |
| Patient | `siti@emerald.com` | `password123` |

The seed also creates 3 hospitals, 12 specialties, 12 doctors, 66 schedule blocks, 8 bookings (including one deliberately full slot), 2 cards, 3 transactions, 1 insurance profile, and 6 medical records.

## 3. Environment variables

`.env.example` is the source of truth.

| Variable | Required | Notes |
| -------- | -------- | ----- |
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:port/db` |
| `GOOGLE_CLIENT_ID` | optional | Enables "Continue with Google". The button is hidden when unset. |
| `GOOGLE_CLIENT_SECRET` | optional | Pair with `GOOGLE_CLIENT_ID`. |
| `SMTP_HOST` | optional | Enables reset emails. Without it, links are logged to the console. |
| `SMTP_PORT` | optional | Default `587`. |
| `SMTP_SECURE` | optional | `true` / `false`, default `false` (STARTTLS). |
| `SMTP_USER` / `SMTP_PASS` | optional | SMTP auth. |
| `SMTP_FROM` | optional | Falls back to `SMTP_USER`. |
| `NODE_ENV` | implicit | `production` turns on the `Secure` cookie flag. |

Google OAuth redirect URIs to register: `http://localhost:5173/login/google/callback` and `https://<domain>/login/google/callback`.

## 4. Implementation notes per feature

### 4.1 Specialty autocomplete

- Component: `src/lib/components/doctor/SpecialtyAutocomplete.svelte`. Endpoint: `src/routes/api/specialists/+server.ts`.
- 250 ms debounce. A token counter discards out-of-order responses.
- Keyboard: ↑ / ↓ move, Enter selects, Esc closes. The blur is delayed so a mouse click registers before the list closes.
- Roles: `combobox` on the input, `listbox` / `option` on the results.

### 4.2 Slot generation and availability

- `generateTimeSlots(start, end, 30)` produces 30-minute slots.
- `getSlotAvailability(scheduleId, date)` runs one `GROUP BY appointment_time` query and returns `max_quota − used` per slot.
- `getAllSlotsForDoctorDate` merges multiple schedule blocks on the same weekday and keeps the block with the most remaining quota per time.
- Weekday is computed with `new Date(date + 'T12:00:00').getDay()` (noon avoids DST and timezone edge cases).

### 4.3 Race-safe booking

See [ARCHITECTURE.MD §6.3](./ARCHITECTURE.MD#63-race-safe-booking) and the sequence diagram in [FLOW.MD §2](./FLOW.MD#2-booking-transaction).

### 4.4 Sessions

- `createSession` → `nanoid(32)`, 30-day expiry, row in `sessions`.
- `validateSession` runs two queries (join for the user, then the session row for expiry) and deletes the session if expired. It could be done in one query (see [TECHDEBT.MD](./TECHDEBT.MD)).
- Sessions are not refreshed (no sliding expiration).

### 4.5 Password reset

- Token: `crypto.randomBytes(32).toString('base64url')`. Only `sha256(token)` is stored.
- TTL 60 min, single use. Older unused tokens for the same user are deleted on each request.
- Reset → all sessions for the user are deleted.
- Email via `mailer.ts`. Without SMTP config, the full message is logged to the console.

### 4.6 Payments

- Stores `brand`, `last4`, `expires` only. The UI never collects a full card number. No PCI scope.
- `setDefaultCard` and `deleteCard` run in transactions. Deleting the default card promotes the most recent remaining card.

### 4.7 Preferences

`lib/server/patient/preferences.ts` stores `push_notifications`, `email_notifications`, and `app_language` in non-HttpOnly cookies for 1 year. Push defaults to on, email to off, language to `en`.

### 4.8 Analytics

`lib/server/booking/analytics.ts`: `parseFilters` (default `30d`), `totals`, `previousTotals`, `bookingsOverTime`, `statusBreakdown`, `bookingsBySpecialty`, `topDoctors(limit 5)`, `recentBookings(limit 8)`, `exportRows` (no limit), `rangeLabel`.

### 4.9 Pagination

`parsePagination(searchParams, { pageSize = 10, max = 100 })` returns `{ page, pageSize, offset }`. Used by all manager list pages together with the `Pagination` component.
