# Purwakarta Health

Mobile-first hospital and doctor appointment booking platform.

Two surfaces share a single Postgres database:

- **Public** — landing page (`/`) with hero search + specialty autocomplete; public doctor finder (`/find-doctor`) where anonymous visitors can browse before signing up.
- **Patient app** (`/home`, `/appointments`, `/profile`, …) — browse → search → book → manage appointments.
- **Manager console** (`/manager`) — catalog CRUD + analytics dashboard with charts, filters, and CSV export.

Built with **SvelteKit 3**, **Svelte 5 (runes)**, **Tailwind CSS 4**, **PostgreSQL + Drizzle ORM**, and **Argon2 + Google OAuth** for authentication.

> Looking for full status, architecture, or onboarding info? See [`docs/DEVELOPMENT_STATUS.md`](docs/DEVELOPMENT_STATUS.md).

---

## Features

### Public (anonymous)

- Landing page at `/` with hero, popular specialists, testimonials, and footer.
- **Specialty autocomplete** on the search bar — debounced 250 ms, keyboard-navigable, served by `/api/specialists`.
- **`/find-doctor`** — server-rendered list of doctors matching the typed specialty. `Book Now` routes to `/login?redirect=/doctors/[id]/book` for anonymous visitors, and straight to the booking page for authenticated users.

### Patient app

- Email + password or **Google** sign-in (OAuth 2.0 + PKCE).
- Browse specialists and recommended doctors.
- Search doctors / specialties / hospitals; filter by rating, price, availability.
- Book appointments by date + time slot with **race-safe quota enforcement** (`SELECT FOR UPDATE`).
- View and cancel upcoming or past appointments.
- Profile: personal info, insurance, payment methods, medical records, settings.

### Manager console

- Analytics dashboard with date-range, hospital, and specialty filters.
- Pure-SVG charts: bookings over time, status breakdown, by-specialty, top doctors.
- Trend chips comparing current period vs. previous period.
- CSV export (`/manager/export.csv`) honoring all dashboard filters.
- CRUD for hospitals, specialists, doctors, schedules (create + delete today; edit on the roadmap).
- Booking status management with searchable filters.
- Responsive: sidebar on desktop / tablet, drawer on mobile.

---

## Tech stack

| Layer    | Choice                                                          |
| -------- | --------------------------------------------------------------- |
| Framework | SvelteKit 3 + Svelte 5 (runes mode)                            |
| Styling  | Tailwind CSS 4 with `@theme` design tokens                      |
| Icons    | `@lucide/svelte`                                                |
| Database | PostgreSQL 16 + Drizzle ORM 0.45                                |
| Auth     | Sessions + Argon2 (`@node-rs/argon2`) + Google OAuth (custom PKCE flow) |
| State    | Zustand 5 (client-only, scoped to search filters and bookmarks) |
| Runtime  | Node 22.17+, pnpm 11                                            |

Security note: transitive vulnerabilities in `esbuild` (via drizzle-kit) and `cookie` (via @sveltejs/kit) are patched through `pnpm-workspace.yaml` `overrides:`. `pnpm audit` reports **no known vulnerabilities**.

---

## Getting started

### Prerequisites

- Node.js 22.17+ (required by SvelteKit 3)
- pnpm 11
- Docker (for the local PostgreSQL container)

### Setup

```bash
pnpm install
docker compose up -d            # PostgreSQL 16 on :5432
cp .env.example .env            # edit if your DB / OAuth differ
pnpm db:migrate                 # apply SQL migrations
pnpm db:seed                    # populate demo data
pnpm dev                        # http://localhost:5173
```

### Demo accounts

| Role    | Email                  | Password     |
| ------- | ---------------------- | ------------ |
| Manager | manager@emerald.com    | password123  |
| Patient | patient@emerald.com    | password123  |
| Patient | siti@emerald.com       | password123  |

The repo originated as `emerald-hospital`; the product is rebranded **Purwakarta Health**, but seed emails still use the legacy domain. Change in `scripts/seed.ts` if you'd rather not see them.

---

## Google sign-in (optional)

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth client (Web application)**.
3. Add authorized redirect URIs:
   - `http://localhost:5173/login/google/callback`
   - `https://YOUR_DOMAIN/login/google/callback` (production)
4. Paste the values into `.env`:

```ini
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

The **Continue with Google** button on `/login` and `/register` becomes active once these are set. Without them, the button shows a disabled "not configured" state — no crash.

---

## Environment variables

| Variable               | Required        | Notes                                                          |
| ---------------------- | --------------- | -------------------------------------------------------------- |
| `DATABASE_URL`         | yes             | `postgresql://user:pass@host:port/db`                          |
| `SESSION_SECRET`       | recommended     | Reserved for future cookie signing; currently advisory          |
| `GOOGLE_CLIENT_ID`     | optional        | Enables Google sign-in                                          |
| `GOOGLE_CLIENT_SECRET` | optional        | Pair with the client ID                                         |

See `.env.example`.

---

## Scripts

| Command            | What it does                                                    |
| ------------------ | --------------------------------------------------------------- |
| `pnpm dev`         | Vite dev server with HMR                                        |
| `pnpm build`       | Production build                                                |
| `pnpm preview`     | Serve the production build locally                              |
| `pnpm check`       | `svelte-kit sync && svelte-check` (type + a11y check)           |
| `pnpm db:generate` | Generate a new migration from the current schema                |
| `pnpm db:migrate`  | Apply pending migrations                                        |
| `pnpm db:push`     | Sync the schema directly (no migration file — prototyping only) |
| `pnpm db:studio`   | Drizzle Studio (web UI)                                          |
| `pnpm db:seed`     | Wipe and reload demo data                                        |

---

## Project layout (high level)

```
src/
├─ hooks.server.ts             # Session middleware
├─ lib/
│  ├─ assets/                  # icon_purwakarta_health.png, favicon.svg
│  ├─ components/              # UI components (auth, charts, manager, patient, shared)
│  ├─ server/                  # Server-only: DB, auth, OAuth, analytics, services
│  │  └─ db/{index,schema}.ts
│  ├─ stores/                  # Zustand client state + toast store
│  ├─ utils/                   # Pure helpers (isomorphic)
│  └─ data/                    # Static config (FAQs, support contact, landing copy)
└─ routes/
   ├─ +page.{server,svelte}    # Landing (anonymous)
   ├─ api/specialists/+server.ts  # Autocomplete endpoint
   ├─ find-doctor/             # Public doctor finder
   ├─ login/, register/        # Auth + Google OAuth
   ├─ (patient)/               # Patient app (route group, mobile shell)
   └─ manager/                 # Manager console (sidebar shell)

drizzle/                       # SQL migrations
scripts/seed.ts                # Demo data
pnpm-workspace.yaml            # Transitive-dep security overrides
docs/DEVELOPMENT_STATUS.md     # Status, architecture, roadmap
```

A complete tree with module-by-module purpose is in `docs/DEVELOPMENT_STATUS.md`.

---

## Design

Brand: **Purwakarta Health**. Logo at `src/lib/assets/icon_purwakarta_health.png`, favicon at `src/lib/assets/favicon.svg`. Typography uses Manrope for headings and Inter for body, with the emerald primary palette (`#005d42`). The patient app is a `max-w-md` centered mobile layout; the manager console uses `max-w-7xl` with a sidebar. All design tokens live in `src/app.css` under the `@theme` block.

---

## Deployment

The repo ships with `@sveltejs/adapter-auto`, which works on Vercel, Netlify, and Cloudflare Pages without changes. For Node / self-hosted, swap to `@sveltejs/adapter-node` in `vite.config.ts` (the `adapter` option of the `sveltekit()` plugin). Then set the production env vars (`DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) and add the OAuth redirect URI for the production domain in Google Cloud Console.

Before the first deploy:

1. Run `pnpm db:migrate` against the production database.
2. Configure the secret manager with the env vars above.
3. Optionally run `pnpm db:seed` for a demo environment — **never** in real production.

---

## Contributing

- Always run `pnpm check` before pushing — current baseline is **0 errors, 0 warnings**.
- Always run `pnpm build` before pushing.
- Run `pnpm audit` periodically — should be **0 vulnerabilities**. Transitive CVEs are patched in `pnpm-workspace.yaml`.
- Server-only code goes under `src/lib/server/*`; SvelteKit enforces that this code can't be bundled into client output.
- Import from `src/lib` with `#lib/...` (subpath imports, see `imports` in `package.json`) and always include the file extension, e.g. `#lib/server/db/index.ts`, `#lib/components/Header.svelte`.
- New environment variables must be declared in `src/env.ts` and read from `$app/env/private` (or `$app/env/public`).
- Route loaders own data fetching; components consume props.
- Form mutations use SvelteKit form actions, not fetch + JSON, unless we genuinely need a JSON endpoint (e.g., CSV export at `/manager/export.csv`, autocomplete at `/api/specialists`).

See `docs/DEVELOPMENT_STATUS.md` for the onboarding checklist and roadmap.
