# Purwakarta Health — Development Status

> **Last updated:** 2026-10-22
> **Branch:** `master`
> **Repo name:** `emerald-hospital` (historical; the product is branded **Purwakarta Health**)
> **Status:** Active development. Core patient and manager flows work with PostgreSQL persistence. Fine for demo and internal review. **Not production-ready**: see [Go-live blockers](./DEPLOYMENT_PLAN.MD#1-go-live-blockers).

This file is the entry point. Details live in the documents linked below.

---

## 1. Project at a glance

Mobile-first hospital and doctor appointment booking platform. Two surfaces share one Postgres database:

- **Public** — landing page (`/`) with specialty autocomplete, and a doctor finder (`/find-doctor`).
- **Patient app** — browse specialists and doctors, book and cancel appointments, manage profile, insurance, payment cards, medical records.
- **Manager console** (`/manager`) — dashboard with charts and CSV export, CRUD for hospitals, specialists, doctors, and schedules, booking status management.

Stack: SvelteKit 3 + Svelte 5 (runes), Tailwind 4, PostgreSQL 16, Drizzle ORM, custom session auth (Argon2) + Google OAuth (PKCE), nodemailer.

## 2. Documentation map

| Document | Read it when you need… |
| -------- | ---------------------- |
| [ARCHITECTURE.MD](./ARCHITECTURE.MD) | System overview, tech stack, folder structure, layer conventions, data model, key design decisions |
| [TECH_IMPLEMENTATION.MD](./TECH_IMPLEMENTATION.MD) | Feature-by-feature status, local setup, scripts, env vars, demo accounts, implementation notes |
| [API.MD](./API.MD) | Every endpoint, form action, and query parameter |
| [FLOW.MD](./FLOW.MD) | User and system flows (booking, auth, OAuth, reset, manager CRUD) with diagrams |
| [PERMISSION.MD](./PERMISSION.MD) | Roles, route access matrix, guard mechanisms, known gaps |
| [UI_COMPONENT.MD](./UI_COMPONENT.MD) | Design tokens, component inventory and props, UI conventions |
| [TESTING.MD](./TESTING.MD) | Current quality gates, manual smoke test, automated test plan |
| [DEPLOYMENT_PLAN.MD](./DEPLOYMENT_PLAN.MD) | Go-live blockers, adapter choice, environments, CI/CD, release and rollback |
| [RISK_ANALYSIS.MD](./RISK_ANALYSIS.MD) | Scored risk register with mitigations |
| [IMPACT_ANALYSIS.MD](./IMPACT_ANALYSIS.MD) | What breaks if you change a module; impact of planned work |
| [TECHDEBT.MD](./TECHDEBT.MD) | Tech debt register and suggested roadmap |

## 3. Status summary

Legend: ✅ done · 🟡 partial · ⬜ not started · ❌ blocked

| Area | Status | Notes |
| ---- | ------ | ----- |
| Public landing + doctor finder | ✅ | Popular doctors on landing are mock data |
| Auth (email, Google, forgot/reset password) | ✅ | No rate limiting yet |
| Patient browse, search, booking, cancel | ✅ | Race-safe booking |
| Patient profile, insurance, cards, medical records | ✅ | No uploads, no payment gateway |
| Notifications, live chat, i18n | ⬜ | Preferences saved in cookies only |
| Manager dashboard + CSV export | ✅ | |
| Manager CRUD (create / update / delete, search, pagination) | ✅ | Update was added since the last status doc |
| Manager authorization on form actions | ✅ | Fixed 2026-10-22 (R1). See [PERMISSION.MD](./PERMISSION.MD) |
| Automated tests | ⬜ | Manual smoke test only |
| CI/CD + production adapter | ⬜ | `adapter-auto` still configured |

Full table: [TECH_IMPLEMENTATION.MD §1](./TECH_IMPLEMENTATION.MD#1-feature-status).

## 4. Top priorities

1. **Rate-limit auth endpoints** and escape user data in emails (R3, R4).
2. **Pick a deploy target** (`adapter-node` recommended) and set up CI.
3. **Write the first tests**: manager authorization (regression for R1) and concurrent booking.

Full roadmap: [TECHDEBT.MD §2](./TECHDEBT.MD#2-roadmap-suggested-order).

## 5. Quick start

```bash
pnpm install
docker compose up -d
cp .env.example .env
pnpm db:migrate && pnpm db:seed
pnpm dev                        # http://localhost:5173
```

Log in as `manager@emerald.com` or `patient@emerald.com` (password `password123`). More in [TECH_IMPLEMENTATION.MD §2](./TECH_IMPLEMENTATION.MD#2-local-development).

## 6. Onboarding checklist

- [ ] Run the quick start and log in as both a manager and a patient.
- [ ] Read [ARCHITECTURE.MD](./ARCHITECTURE.MD) and `src/lib/server/db/schema.ts`.
- [ ] Read `src/lib/server/booking.ts` (booking transaction) and `src/lib/server/analytics.ts` (dashboard data).
- [ ] Walk `src/routes/(patient)/+layout.svelte` and `src/routes/manager/+layout.svelte` to see the two shells.
- [ ] Read [PERMISSION.MD](./PERMISSION.MD) before adding any route or action.
- [ ] Before pushing: `pnpm check` (0 errors / 0 warnings), `pnpm build`, `pnpm audit` (0 vulnerabilities).
- [ ] New server module → follow `lib/server/*`: pure async functions over Drizzle with explicit return types.
- [ ] New manager page → use `PageHeader`, `Modal`, `ConfirmDialog`, `Pagination`, `EmptyState`, `StatusBadge`, **and start every action with `denyUnlessManager(locals)`**.
- [ ] Transitive CVE → patch through `overrides:` in `pnpm-workspace.yaml`.

## 7. Contact

Start with the git log (commit messages explain the why), then these docs, then the code.
