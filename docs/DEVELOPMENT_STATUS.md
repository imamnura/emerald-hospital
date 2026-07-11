# Purwakarta Health — Development Status

> **Last updated:** 2026-07-11
> **Branch:** `master`
> **Repo name:** `emerald-hospital` (historical; the product is branded **Purwakarta Health**)
> **Status:** Active development. Core patient and manager flows are functional with PostgreSQL persistence. Suitable for demo and internal review; **not production-ready** yet (see [Known limitations](#9-known-limitations--tech-debt)).

---

## 1. Project at a glance

Mobile-first hospital and doctor appointment booking platform branded **Purwakarta Health**. Two surfaces share a single Postgres database:

- **Public landing** (`/`) — marketing page with hero search (specialty + hospital), specialist autocomplete, popular doctors, testimonials. Visitors who are already authenticated get redirected to `/home` (patient) or `/manager` (manager).
- **Public doctor finder** (`/find-doctor`) — search results page reachable from the landing form. Shows matching doctors as cards; **Book Now** routes anonymous users to `/login?redirect=/doctors/[id]/book`, and authenticated users straight to the booking page.
- **Patient app** (`/home`, `/specialists`, `/appointments`, `/profile`, …) — browse specialists & doctors, search, book appointments, manage profile.
- **Manager console** (`/manager`) — CRUD hospitals/specialists/doctors/schedules, view bookings, analytics dashboard, CSV export.

Authentication is custom: opaque session cookies + Argon2 password hashing, with optional Google OAuth (PKCE).

---

## 2. Tech stack

| Layer            | Choice                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Framework        | SvelteKit 2 (SSR), Svelte 5 (runes mode forced via `svelte.config.js`) |
| Styling          | Tailwind CSS 4 (`@theme` design tokens in `src/app.css`)              |
| Icons            | `@lucide/svelte`                                                       |
| Database         | PostgreSQL 16 (via Docker compose)                                     |
| ORM / migrations | Drizzle ORM 0.45 + drizzle-kit 0.31                                    |
| Auth             | Custom `sessions` table, Argon2 (`@node-rs/argon2`), nanoid session IDs |
| Google OAuth     | OAuth 2.0 auth-code flow with PKCE (no external library)              |
| Email            | `nodemailer` over SMTP (optional; used for password-reset links)      |
| Client state     | Zustand 5 (`useSearchStore` for search/filter/bookmark state)         |
| Tooling          | pnpm 11, Vite 8, TypeScript 6, svelte-check                            |

### Security-relevant overrides

Transitive vulnerabilities patched via `pnpm-workspace.yaml`:

```yaml
overrides:
  esbuild@<0.25.0: '>=0.25.0'   # GHSA-67mh-4wv8-2f99 (dev server)
  cookie@<0.7.0: '>=0.7.0'      # GHSA-pxg6-pf52-xh8x (cookie parsing)
```

`pnpm audit` is clean as of the last update.

---

## 3. Development status by feature

Legend: ✅ done · 🟡 partial · ⬜ not started · ❌ blocked

### Pre-auth flows (anonymous-friendly)

| Area                                | Status | Notes |
| ----------------------------------- | ------ | ----- |
| Landing page                        | ✅     | `/` — hero, features, popular doctors, testimonials, footer. Redirects logged-in users to `/home` or `/manager`. |
| Hero search w/ specialty autocomplete | ✅   | Debounced 250 ms calls to `/api/specialists`; keyboard nav (↑/↓/Enter/Esc); ARIA combobox. |
| Specialty autocomplete API          | ✅     | `GET /api/specialists?q=&limit=` returns specialists by case-insensitive `ILIKE`. |
| Public doctor finder                | ✅     | `/find-doctor` — server-rendered list of matching doctors. **Book Now** → `/login?redirect=…` for anon, direct booking for authenticated users. |
| Shared autocomplete component       | ✅     | `src/lib/components/SpecialtyAutocomplete.svelte` used on both landing and `/find-doctor`. |

### Patient flows

| Area                                | Status | Notes |
| ----------------------------------- | ------ | ----- |
| Email + password registration       | ✅     | `/register` — Argon2 hash, auto-creates session |
| Email + password login              | ✅     | `/login` — supports `?redirect=` query, returns the user to the original page after sign-in |
| Google sign-in                      | ✅     | `/login/google` — OAuth 2.0 + PKCE, auto-links if email is Google-verified |
| Forgot password                     | ✅     | `/login/forgot` issues a hashed, single-use, 1-hour token and emails a reset link via SMTP (`nodemailer`); falls back to logging the link when `SMTP_*` isn't configured. `/login/reset/[token]` sets the new password, invalidates the token, and signs the user out of all sessions. |
| Home / specialty discovery          | ✅     | `(patient)/home/+page.svelte` |
| Specialist list + detail            | ✅     | `(patient)/specialists/[slug]` |
| Search + filters                    | ✅     | Zustand-backed filters (rating, price, availability, specialty) |
| Doctor profile                      | ✅     | `(patient)/doctors/[id]` |
| Booking (calendar + slot)           | ✅     | Race-safe via `SELECT FOR UPDATE` in a transaction |
| Booking confirmation + receipt      | ✅     | Modal with date/time summary |
| My appointments (upcoming/past)     | ✅     | Cancel action available |
| Cancel appointment                  | ✅     | Server-side state transitions enforced |
| Profile dashboard                   | ✅     | Stats: blood type, next visit, completed reports |
| Personal information edit           | ✅     | DB-backed (name, phone, DOB, gender, address, blood type, image URL) |
| Account settings                    | ✅     | Push/email/language preferences (cookie-stored) |
| Change / set password               | ✅     | Also allows Google-only users to add a password |
| Language picker                     | 🟡     | UI works; no actual i18n strings — labels are English-only |
| Help & support                      | ✅     | Contact options, FAQ accordion (placeholder answers) |
| Insurance details                   | ✅     | DB-backed CRUD (`insurance_profiles` table) |
| Payment methods                     | ✅     | DB-backed CRUD (`payment_cards`, `payment_transactions`) |
| Medical records                     | ✅     | DB-backed list (`medical_records` table); download requires `file_url` |
| Push notifications                  | ⬜     | Preference toggle exists but no Web Push or FCM wired |
| Live chat / messaging               | ⬜     | Placeholder button in Help page |

### Manager flows

| Area                       | Status | Notes |
| -------------------------- | ------ | ----- |
| Dashboard with charts      | ✅     | Area + donut + bar charts, all pure SVG (no chart lib) |
| Filters (range, hospital, specialty) | ✅ | URL-driven `<form method="GET">` |
| Trend chips (vs previous period)     | ✅ | Auto-hides for "all time" range |
| CSV export (filtered)      | ✅     | `/manager/export.csv` — opens Sheets import in a new tab |
| Hospitals CRUD             | ✅     | Card grid with image, contact; create + delete |
| Specialists CRUD           | ✅     | Chip grid with icon; create + delete |
| Doctors CRUD               | ✅     | Card grid with avatar, rating, active badge; triple filter |
| Schedules CRUD             | ✅     | Grouped by doctor with weekly slots; create + delete |
| Bookings list + status     | ✅     | Status tabs + count chips + inline status update + CSV export |
| Edit (in-place update)     | ⬜     | All CRUD currently supports **create / delete only**, no edit |
| Role management UI         | ⬜     | Roles set at registration; no admin tool to change them |

### Cross-cutting

| Area                          | Status | Notes |
| ----------------------------- | ------ | ----- |
| Branding                      | ✅     | Renamed Emerald Hospital → **Purwakarta Health** (`src/lib/components/Header.svelte`, auth pages, layout title); logo at `src/lib/assets/icon_purwakarta_health.png`; favicon at `src/lib/assets/favicon.svg`. |
| Mobile-first responsive layout | ✅    | Patient is mobile-first; manager has sidebar (desktop) + drawer (mobile) |
| Dark mode                     | ⬜     | Design tokens only define light palette |
| Internationalization (i18n)   | ⬜     | Strings hardcoded in English/Indonesian mix |
| Accessibility                 | 🟡     | Keyboard navigation works; not yet WCAG-audited |
| Automated tests               | ⬜     | No Vitest / Playwright suite |
| CI / CD                       | ⬜     | No GitHub Actions / pipelines yet |
| Production adapter            | 🟡     | Using `adapter-auto`; needs explicit adapter (node/vercel/cloudflare) for deploy |
| Error & 404 pages             | 🟡     | Default SvelteKit; not branded |
| Logging / monitoring          | ⬜     | Only `console.error` for OAuth callback failures |
| Rate limiting                 | ⬜     | None at app layer; rely on reverse proxy in production |

---

## 4. Folder structure

```
emerald-hospital/                  # Repo folder (product is "Purwakarta Health")
├─ docs/
│  └─ DEVELOPMENT_STATUS.md        # ← you are here
├─ drizzle/                        # SQL migrations + journal (committed)
│  ├─ 0000_spicy_silver_surfer.sql
│  ├─ 0001_gorgeous_mongu.sql
│  ├─ 0002_glorious_havok.sql
│  └─ meta/                        # Drizzle internal snapshots
├─ scripts/
│  └─ seed.ts                      # `pnpm db:seed` — demo data
├─ src/
│  ├─ app.css                      # Tailwind 4 theme tokens (colors, radii, shadows)
│  ├─ app.html                     # Document shell
│  ├─ app.d.ts                     # SvelteKit Locals type (user attached by hook)
│  ├─ hooks.server.ts              # Auth middleware (validates session cookie)
│  ├─ lib/
│  │  ├─ assets/                   # favicon.svg, brand logos
│  │  ├─ components/
│  │  │  ├─ auth/                  # Login/register decorative pieces
│  │  │  ├─ charts/                # AreaChart, DonutChart, BarChart (manager dashboard)
│  │  │  ├─ forms/                 # FormIconField, etc.
│  │  │  ├─ insurance/             # Insurance card components
│  │  │  ├─ manager/               # PageHeader, FormCard, StatusBadge, EmptyState
│  │  │  ├─ medical-records/
│  │  │  ├─ motion/                # Page-enter and reveal-on-scroll wrappers
│  │  │  ├─ payment/
│  │  │  ├─ settings/              # Reusable settings rows
│  │  │  ├─ Header.svelte          # In-app header (logo + brand)
│  │  │  ├─ SpecialtyAutocomplete.svelte  # Shared debounced specialty search
│  │  │  └─ …                       # Other shared pieces
│  │  ├─ data/
│  │  │  ├─ help-support.ts        # FAQs, support contacts (static config)
│  │  │  └─ landing.ts             # Landing page strings + popular doctors mock data
│  │  ├─ server/                   # SERVER-ONLY (SvelteKit blocks client imports)
│  │  │  ├─ analytics.ts           # Dashboard aggregations (counts, time series, trends)
│  │  │  ├─ auth.ts                # Sessions: hash, verify, create, validate, cookie opts
│  │  │  ├─ booking.ts             # Slot availability + race-safe createBookingAtomic
│  │  │  ├─ catalog.ts             # Hospitals/specialists/schedules read queries
│  │  │  ├─ doctors.ts             # Doctor list/detail/search-filter queries
│  │  │  ├─ insurance.ts           # Insurance profile read/upsert
│  │  │  ├─ mailer.ts              # SMTP sending via nodemailer; logs instead when unconfigured
│  │  │  ├─ medical-records.ts     # Patient medical records list
│  │  │  ├─ oauth-google.ts        # PKCE + token exchange + find-or-create user
│  │  │  ├─ pagination.ts          # Parse page/pageSize query params
│  │  │  ├─ password-reset.ts      # Reset token create/validate/consume + reset email
│  │  │  ├─ payments.ts            # Cards + transactions CRUD
│  │  │  ├─ preferences.ts         # Cookie-based notification + language prefs
│  │  │  ├─ users.ts               # Profile update
│  │  │  └─ db/
│  │  │     ├─ index.ts            # Drizzle client (reads DATABASE_URL)
│  │  │     └─ schema.ts           # All table definitions + relations + types
│  │  ├─ stores/
│  │  │  ├─ search.ts              # Zustand store: query/filters/bookmarks
│  │  │  ├─ toast.svelte.ts        # Toast notifications (Svelte 5 runes)
│  │  │  └─ useZustand.svelte.ts   # Svelte 5 reactive wrapper for Zustand vanilla stores
│  │  ├─ utils/                    # Pure helpers, safe for client + server
│  │  │  ├─ appointments.ts
│  │  │  ├─ booking-ui.ts
│  │  │  ├─ enhance.ts             # `toastForm` for `use:enhance`
│  │  │  ├─ insurance.ts
│  │  │  ├─ medical-records.ts
│  │  │  ├─ payments.ts
│  │  │  ├─ profile.ts
│  │  │  └─ specialist.ts
│  │  ├─ specialist-icons.ts
│  │  ├─ utils.ts                  # cn(), formatDateId(), statusLabel(), DAY_NAMES
│  │  └─ index.ts
│  └─ routes/
│     ├─ +layout.server.ts         # Exposes locals.user to all pages
│     ├─ +layout.svelte            # Document head (favicon, global title), Toaster
│     ├─ +page.{server,svelte}     # Landing page (anonymous)
│     ├─ api/
│     │  └─ specialists/+server.ts # GET /api/specialists?q=&limit=
│     ├─ find-doctor/
│     │  └─ +page.{server,svelte}  # Public doctor finder
│     ├─ login/
│     │  ├─ +page.{server,svelte}
│     │  ├─ forgot/+page.{server,svelte}   # Request a reset link by email
│     │  ├─ reset/[token]/+page.{server,svelte}  # Consume the link, set a new password
│     │  └─ google/                # OAuth flow
│     │     ├─ +server.ts          # Start: generate state+PKCE, redirect to Google
│     │     └─ callback/+server.ts # Complete: exchange code, find/link/create user
│     ├─ register/+page.{server,svelte}
│     ├─ (patient)/                # Patient app (route group, no URL prefix)
│     │  ├─ +layout.{server,svelte}       # Mobile shell + BottomNav
│     │  ├─ home/+page.{server,svelte}    # Patient home — specialists + recommended
│     │  ├─ appointments/+page.{server,svelte}
│     │  ├─ doctors/[id]/+page.{server,svelte}
│     │  │   └─ book/
│     │  │      ├─ +page.{server,svelte}              # Date + slot picker
│     │  │      └─ confirm/+page.{server,svelte}      # Review + submit
│     │  ├─ profile/
│     │  │   ├─ +page.{server,svelte}
│     │  │   ├─ personal/+page.{server,svelte}
│     │  │   ├─ insurance/+page.{server,svelte}
│     │  │   ├─ payment-methods/+page.{server,svelte}
│     │  │   ├─ medical-records/+page.{server,svelte}
│     │  │   ├─ help/+page.{server,svelte}
│     │  │   └─ settings/
│     │  │       ├─ +page.{server,svelte}
│     │  │       ├─ password/+page.{server,svelte}
│     │  │       └─ language/+page.{server,svelte}
│     │  ├─ search/+page.{server,svelte}
│     │  └─ specialists/
│     │      ├─ +page.{server,svelte}
│     │      └─ [slug]/+page.{server,svelte}
│     └─ manager/                  # Desktop-first manager console
│        ├─ +layout.{server,svelte}       # Auth gate (role === 'manager')
│        ├─ +page.{server,svelte}         # Dashboard
│        ├─ export.csv/+server.ts         # CSV download endpoint
│        ├─ hospitals/+page.{server,svelte}
│        ├─ specialists/+page.{server,svelte}
│        ├─ doctors/+page.{server,svelte}
│        ├─ schedules/+page.{server,svelte}
│        └─ bookings/+page.{server,svelte}
├─ static/                         # Public assets served at /
├─ .env.example                    # Template (DO commit)
├─ .env                            # Local secrets (NEVER commit; gitignored)
├─ docker-compose.yml              # PostgreSQL 16
├─ drizzle.config.ts               # Drizzle Kit config (reads DATABASE_URL)
├─ package.json
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml             # `overrides:` for transitive security patches
├─ README.md
├─ svelte.config.js
├─ tsconfig.json
└─ vite.config.ts
```

### Layer conventions

- Anything inside `src/lib/server/` is **server-only** — SvelteKit refuses to bundle it into client code. Database access and secrets stay here.
- `src/lib/utils/`, `src/lib/data/`, and components are isomorphic. Use them when both server (load) and client (render) need shared types or pure functions.
- Each route owns its data via `+page.server.ts` (load function + form actions). Components are dumb props consumers.
- Form mutations use SvelteKit form actions (`<form method="POST" action="?/x" use:enhance>`) — no fetch + JSON unless we genuinely need a JSON endpoint (CSV export, autocomplete API).

---

## 5. Database

PostgreSQL 16. Schema lives in `src/lib/server/db/schema.ts`; migrations are in `drizzle/`.

### Tables

| Table                 | Purpose                                                  | Notable columns                           |
| --------------------- | -------------------------------------------------------- | ----------------------------------------- |
| `users`               | Patient + manager accounts                               | `password_hash` (nullable for Google-only), `google_id` (unique), `email_verified`, `role` (enum), `blood_type`, `date_of_birth`, `gender` (enum), `address` |
| `sessions`            | Session cookies (one row per logged-in browser)          | `id` (nanoid), `expires_at`               |
| `password_reset_tokens` | Forgot-password links                                  | `token_hash` (sha-256, unique), `expires_at` (1h TTL), `used_at` (single-use) |
| `hospitals`           | Partner facilities                                       | `image_url`, `contact`                    |
| `specialists`         | Medical specialty categories                             | `slug` unique, `icon` key                 |
| `doctors`             | Doctor profiles                                          | `consultation_fee` (numeric), `review_count`, `bio`, `is_active`, `is_online`, `rating` |
| `doctor_schedules`    | Weekly availability blocks                               | `day_of_week`, `start_time`, `end_time`, `max_quota` |
| `bookings`            | Appointments                                             | `status` (enum), composite index on `(schedule_id, appointment_date, appointment_time, status)` |
| `payment_cards`       | Saved patient cards (no real PCI data — last4 only)      | `brand` (enum), `last4`, `expires`, `is_default` |
| `payment_transactions`| Historical transactions                                  | `amount` (numeric), `currency`, `paid_at`, `card_id`, `booking_id` |
| `insurance_profiles`  | One per patient (unique on `user_id`)                    | `cost_pcp`, `cost_specialist`, `cost_emergency`, `cost_rx`, `coverage_start`, `coverage_end`, `status` (enum) |
| `medical_records`     | Lab / imaging / clinical notes per patient               | `type` (enum), `file_url`, `notes`        |

### Migrations

Four migrations are checked in:

1. `0000_spicy_silver_surfer.sql` — Initial baseline (users, sessions, hospitals, specialists, doctors, schedules, bookings).
2. `0001_gorgeous_mongu.sql` — Adds payment/insurance/medical tables, extends user/doctor columns, adds booking indexes.
3. `0002_glorious_havok.sql` — Makes `users.password_hash` nullable, adds `google_id`, `email_verified` for OAuth.
4. `0003_old_quasimodo.sql` — Adds `password_reset_tokens` for the forgot-password flow.

Apply with `pnpm db:migrate`. For greenfield local: `pnpm db:push` syncs schema directly (no migration history) — prototyping only. **Always prefer `db:generate` + `db:migrate`** so a migration file is committed.

### Demo accounts (after `pnpm db:seed`)

| Role    | Email                  | Password     |
| ------- | ---------------------- | ------------ |
| Manager | manager@emerald.com    | password123  |
| Patient | patient@emerald.com    | password123  |
| Patient | siti@emerald.com       | password123  |

Email domains still use `@emerald.com` (the repo's original brand); the user-facing product is **Purwakarta Health**. Change in `scripts/seed.ts` and re-seed if needed.

The seed also fills 3 hospitals, 12 specialties, 12 doctors, 66 schedule blocks, 8 bookings (including a deliberately-full slot for the booking UI), 2 cards, 3 transactions, 1 insurance profile, and 6 medical records — enough to populate every screen and the manager dashboard charts.

---

## 6. Environment variables

`.env.example` is the source of truth; copy it to `.env` for local development.

| Variable                | Required        | Notes |
| ----------------------- | --------------- | ----- |
| `DATABASE_URL`          | ✅              | `postgresql://user:pass@host:port/db` |
| `SESSION_SECRET`        | ✅ (production) | **Currently advisory.** Sessions use opaque nanoid tokens; reserved for future cookie signing. No code reads this yet — track in roadmap before you treat it as critical. |
| `GOOGLE_CLIENT_ID`      | optional        | Enables the "Continue with Google" button; UI degrades gracefully when missing |
| `GOOGLE_CLIENT_SECRET`  | optional        | Paired with `GOOGLE_CLIENT_ID` |
| `SMTP_HOST`             | optional        | Enables sending password-reset emails; without it, reset links are logged to the console instead |
| `SMTP_PORT`             | optional        | Defaults to `587` |
| `SMTP_SECURE`           | optional        | `true`/`false`; defaults to `false` (STARTTLS on 587) |
| `SMTP_USER`             | optional        | SMTP auth user |
| `SMTP_PASS`             | optional        | SMTP auth password |
| `SMTP_FROM`             | optional        | `From:` address; falls back to `SMTP_USER` |
| `NODE_ENV`              | implicit        | Drives cookie `secure` flag; set to `production` when deployed |

### Things to upload to your hosting provider

- `.env` values for all variables above (use the provider's secret manager, **never commit `.env`**).
- A reachable PostgreSQL connection string in `DATABASE_URL`.
- If using Google OAuth: add `https://YOUR_DOMAIN/login/google/callback` to the OAuth client's authorized redirect URIs in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
- The build adapter — `@sveltejs/adapter-auto` is fine for Vercel / Netlify / Cloudflare. For Node / self-hosted, swap to `@sveltejs/adapter-node` in `svelte.config.js`.
- Migrations: run `pnpm db:migrate` against the production database before serving traffic. CI should fail the deploy if migrations don't apply cleanly.
- Static assets: `static/` is served at the root (just `robots.txt` today); brand assets live in `src/lib/assets/` and are bundled by Vite.

---

## 7. Local development setup

```bash
# Prerequisites: Node 20+, pnpm 11, Docker
pnpm install
docker compose up -d            # starts PostgreSQL on :5432
cp .env.example .env            # then edit DATABASE_URL if needed
pnpm db:migrate                 # applies SQL migrations from drizzle/
pnpm db:seed                    # populates demo data
pnpm dev                        # http://localhost:5173
```

### Useful scripts

| Command            | What it does                                                       |
| ------------------ | ------------------------------------------------------------------ |
| `pnpm dev`         | Vite dev server, hot reload                                         |
| `pnpm build`       | Production build via adapter-auto                                   |
| `pnpm preview`     | Serve the built app locally                                         |
| `pnpm check`       | `svelte-kit sync && svelte-check` — type + a11y check (no tests)    |
| `pnpm db:generate` | Emit a new SQL migration from the current schema                    |
| `pnpm db:migrate`  | Apply pending migrations to `DATABASE_URL`                          |
| `pnpm db:push`     | Sync schema directly (skips migration files; prototyping only)      |
| `pnpm db:studio`   | Drizzle Studio (web UI at the URL it prints)                         |
| `pnpm db:seed`     | Wipe & repopulate demo data                                          |

---

## 8. Architecture notes (for whoever takes this over)

### Public surface vs. authenticated surface

- `/` and `/find-doctor` are **anonymous-accessible** routes (no `(patient)` layout). They do their own server load via `+page.server.ts` and consult `locals.user` only to choose where **Book Now** points (`/login?redirect=…` vs `/doctors/[id]/book`).
- The `(patient)` route group **does not auto-guard** — each `+page.server.ts` inside it that needs auth checks `locals.user` and redirects with `?redirect=…`. `requirePatient()` / `requireManager()` helpers exist in `hooks.server.ts` but are kept as utilities; current routes do the checks inline because they need a per-route `?redirect=` target.
- The `manager/` group **does** auto-guard via `manager/+layout.server.ts` (returns the user or redirects).

### Specialty autocomplete

- Shared component: `src/lib/components/SpecialtyAutocomplete.svelte`. Used on `/` (landing hero) and `/find-doctor` (refinement bar).
- Endpoint: `src/routes/api/specialists/+server.ts` returns up to 20 `{ name, slug }` rows from Postgres using `ILIKE %q%`.
- Behavior: 250 ms debounce, race-safe response handling (token counter discards stale fetches), keyboard nav (↑/↓/Enter/Esc), ARIA combobox/listbox roles, blur-delay so click selection registers before the listbox closes.

### Booking concurrency

`createBookingAtomic` in `src/lib/server/booking.ts` wraps the booking flow in a Drizzle transaction with `SELECT … FOR UPDATE` on the schedule row. This is the only correctness-critical path; **do not** revert to a non-transactional "check then insert" pattern — it allowed double-booking the same slot under concurrent requests.

### Auth model

- Sessions are 30-day opaque IDs stored in the `sessions` table, sent via an HttpOnly cookie (`session_id`).
- `hooks.server.ts` resolves the session on every request and attaches `locals.user` (or `null`).
- `passwordHash` is nullable: Google-only accounts have no local password, and `login/+page.server.ts` handles that case explicitly.
- Google sign-in uses PKCE (RFC 7636) and a CSRF `state` cookie; both are HttpOnly, `SameSite=Lax`, scoped to `/login/google`, with a 10-minute TTL.
- Auto-linking: if a Google user signs in with an email that already exists locally **and** Google reports `email_verified: true`, the rows are linked. If `email_verified` is false, we refuse and tell the user to link from their profile after a password login. This prevents account takeover via attacker-controlled Google accounts.

### Password reset

- `src/lib/server/password-reset.ts` issues a random 32-byte token, stores only its SHA-256 hash in `password_reset_tokens`, and returns the raw token to embed in the emailed link — the DB never holds a usable token, mirroring how `passwordHash` never holds a plaintext password.
- Tokens are single-use (`used_at`) and expire after 1 hour. Requesting a new link deletes any prior outstanding token for that user first, so only the most recent link ever works.
- `/login/forgot` always returns `{ success: true }` regardless of whether the email matched an account, to avoid leaking which emails are registered.
- On successful reset, `deleteSessionsByUserId` (in `auth.ts`) signs the user out everywhere, the same way you'd want a compromised-password recovery to behave.
- `src/lib/server/mailer.ts` sends via SMTP when `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` are set; otherwise it logs the email to the console so the flow stays testable without real credentials.

### Analytics & charts

- All aggregation queries live in `src/lib/server/analytics.ts` and accept the same `AnalyticsFilters` (date range, hospital, specialty). The CSV export route reuses these so what you see on the dashboard is exactly what gets exported.
- Charts are pure-SVG components in `src/lib/components/charts/`. There is no chart library dependency.

### Client state

The patient app uses Zustand (via `useZustand.svelte.ts`) for **search filters and bookmarks only**. Everything else flows through SvelteKit page data. Zustand persists to `localStorage` under the key `emerald-search` (preserved across the rename to keep existing dev bookmarks).

### Branding

- Brand assets: `src/lib/assets/icon_purwakarta_health.png` (in-app header) and `src/lib/assets/favicon.svg` (browser tab).
- Brand strings live inline in components (`Header.svelte`, `login/+page.svelte`, `register/+page.svelte`) and in `LANDING_BRAND` (`src/lib/data/landing.ts`). The CSV export and seed file still say "Emerald Hospital" — historical, change if rebranding the data export too.

---

## 9. Known limitations & tech debt

- **No automated tests.** Smoke test by running `pnpm check && pnpm build` and walking the demo accounts through every flow.
- **No edit flows in manager CRUD.** Each entity supports create + delete only. To edit a doctor, you currently delete and recreate. Add `?/update` actions in each manager `+page.server.ts` plus an inline edit toggle.
- **Static `adapter-auto`.** Pick a real adapter before deploying (`adapter-node`, `adapter-vercel`, `adapter-cloudflare`, etc.).
- **`SESSION_SECRET` is unused.** Reserved for future cookie signing; currently a placeholder.
- **No real i18n.** Mixed English / Indonesian strings; the language picker only flips a cookie value.
- **Notification preferences don't drive anything.** The toggle saves a cookie but no transactional email or push system is wired. (Password-reset is the one exception — it sends real SMTP email when `SMTP_*` is configured.)
- **Help FAQs are placeholders.** Accordion expands into a "we're preparing this" message; populate `src/lib/data/help-support.ts` with real Q&A, or move them into a CMS / DB table.
- **Password-reset email requires SMTP credentials.** Without `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` set, `/login/forgot` still works end-to-end but the reset link is only written to the server console, not actually emailed.
- **Adapter-auto warns on every build** ("Could not detect a supported production environment"). Harmless locally; resolves once a specific adapter is chosen.
- **Repo folder name is `emerald-hospital`** but the product brand is now **Purwakarta Health**. Renaming the package name would touch many places (lockfile, deployment configs, CI). Defer until a real deploy is set up.
- **Seed emails use `@emerald.com`.** Update `scripts/seed.ts` if you want the demo accounts to match the brand.
- **`@esbuild-kit/*` deprecated subdependencies** pulled in by `drizzle-kit@0.31.10`. Functionally fine; will disappear when drizzle-kit moves to its next major. We already neutralize the linked esbuild CVE via `pnpm-workspace.yaml` overrides.

---

## 10. Roadmap (suggested priorities)

1. **Pick a deployment target** and lock in the adapter + CI workflow.
2. **Add edit actions** to all manager CRUD pages (`?/update` form action + inline edit UI).
3. **Write a Vitest unit-test pass** for `src/lib/server/booking.ts` (race scenarios), `src/lib/server/oauth-google.ts` (URL building, state validation), and the price-range filter logic.
4. **Add a Playwright smoke suite** that walks the demo accounts: register → book → manager-confirm → patient-cancel.
5. **Implement real i18n** with a library (`@inlang/paraglide-sveltekit`, `svelte-i18n`, or your pick) and extract strings.
6. **Wire remaining notifications** — password-reset email is done (SMTP via `nodemailer`); still needed: transactional email for other events (booking confirmations, etc.) and push via web push or FCM.
7. **Audit accessibility** (focus traps in modals, label / contrast / keyboard tab order).
8. **Account linking UI** — let users with email/password add a Google identity from `/profile/settings`, and vice-versa.
9. **Manager: real edit + role assignment + soft delete.**
10. **Observability** — pipe server errors into Sentry / Logflare; replace `console.error` calls in `login/google/callback/+server.ts`.
11. **Rebrand the repo / package / seed emails** to fully match "Purwakarta Health" (low priority — cosmetic).

---

## 11. Onboarding checklist for new contributors

- [ ] Clone the repo, run the setup commands above, log in as `manager@emerald.com` and as `patient@emerald.com`.
- [ ] Read `src/lib/server/db/schema.ts` — every column has a reason; the foreign keys tell the story.
- [ ] Read `src/lib/server/booking.ts` to understand the booking transaction.
- [ ] Read `src/lib/server/analytics.ts` to see how dashboard data is built.
- [ ] Walk `src/routes/(patient)/+layout.svelte` and `src/routes/manager/+layout.svelte` to see the two shells.
- [ ] Walk `src/routes/+page.svelte` and `src/routes/find-doctor/+page.svelte` to see the public flow.
- [ ] Run `pnpm check` — must always be 0 errors / 0 warnings before pushing.
- [ ] Run `pnpm build` — must succeed.
- [ ] Run `pnpm audit` — should be **0 vulnerabilities**.
- [ ] When you add a new server module, mirror the pattern in `lib/server/*`: pure functions over Drizzle, with explicit return types.
- [ ] When you add a new manager page, use the shared `PageHeader`, `EmptyState`, `FormCard`, `StatusBadge` components for visual consistency.
- [ ] When adding a third-party transitive dep with a CVE, patch via `pnpm-workspace.yaml` `overrides:` rather than vendoring or forking.

---

## 12. Contact

If you inherit this project and need context, start with the git log: every commit message describes the why, not just the what. After that, this document, then the code itself.
