# Risk Analysis

> Part of the [Purwakarta Health docs](./DEVELOPMENT_STATUS.md). Last verified against code: 2026-11-26.

Scoring: **Likelihood** and **Impact** are 1 (low) – 3 (high). **Score = L × I**. 🔴 ≥ 6 · 🟠 3–4 · 🟢 ≤ 2.

## 1. Risk register

| ID | Risk | Category | L | I | Score | Status |
| -- | ---- | -------- | - | - | ----- | ------ |
| <a id="r1"></a>R1 | Manager form actions had no auth/role check | Security | 3 | 3 | 🔴 9 | **Fixed** 2026-10-22 |
| R2 | No automated tests; regressions in booking/auth go unnoticed | Quality | 3 | 2 | 🔴 6 | Open |
| R3 | No rate limiting on login / register / forgot password | Security | 2 | 3 | 🔴 6 | Open |
| R4 | User `name` inserted unescaped into the reset email HTML | Security | 2 | 2 | 🟠 4 | Open |
| R5 | Deleting a hospital/specialist/doctor/schedule with dependents returns an unhandled 500 | Reliability | 3 | 1 | 🟠 3 | **Fixed** 2026-10-22 (409) |
| R6 | `adapter-auto` — deploy target undefined | Delivery | 2 | 2 | 🟠 4 | Open |
| R7 | Manager can set any booking status (no state machine) | Data integrity | 2 | 2 | 🟠 4 | Open |
| R8 | No error monitoring or structured logging | Operations | 3 | 1 | 🟠 3 | Open |
| R9 | Sessions never rotate; password change keeps other sessions alive | Security | 1 | 2 | 🟢 2 | Open |
| R10 | Expired sessions / reset tokens never purged (table growth) | Operations | 2 | 1 | 🟢 2 | Open |
| R11 | `logs/combined.log` tracked in git (tool log, may leak local info) | Hygiene | 2 | 1 | 🟢 2 | **Fixed** 2026-11-26 (8782637: untracked, `logs/` gitignored) |
| R12 | Single manager role, no audit trail of who changed what | Compliance | 2 | 2 | 🟠 4 | Open |
| R13 | Health data (blood type, medical records) without encryption-at-rest policy or retention rules | Compliance | 1 | 3 | 🟠 3 | Open |
| R14 | Dependency drift: SvelteKit 3 / Vite 8 / TS 6 are recent majors; transitive CVEs patched via overrides | Supply chain | 1 | 2 | 🟢 2 | Monitored |
| R15 | Double booking under concurrency | Correctness | 1 | 3 | 🟠 3 | **Mitigated** (`SELECT … FOR UPDATE`) |
| R16 | Google account takeover via unverified email | Security | 1 | 3 | 🟠 3 | **Mitigated** (link only when `email_verified`) |
| R17 | Email enumeration via forgot password | Security | 1 | 1 | 🟢 1 | **Mitigated** (always success) |
| R18 | Open redirect via `?redirect=` | Security | 1 | 2 | 🟢 2 | **Mitigated** (`sanitizeRedirect`) |

## 2. Details and mitigations

### R1 — Unprotected manager actions ✅ fixed

- **What:** `manager/+layout.server.ts` protects page loads only. SvelteKit does not run layout loads before a form action, so `POST /manager/{hospitals,specialists,doctors,schedules}?/create|update|delete` and `POST /manager/bookings?/updateStatus` run for anyone, including anonymous users.
- **Impact:** Anyone can wipe or change the catalogue and every booking status. SvelteKit's CSRF origin check blocks cross-site browser forms but not direct requests (curl, scripts).
- **Fix (2026-10-22):** `denyUnlessManager(locals)` at the top of all 13 manager actions (`src/lib/server/auth/guards.ts`), plus a backstop in `hooks.server.ts` that returns 403 for any non-GET request to `/manager/**` from a non-manager. Verified manually against the dev server: anonymous and patient POSTs → 403, manager POSTs work.
- **Remaining:** automated regression test T-01.

### R2 — No automated tests 🔴

- **Mitigation:** Follow [TESTING.MD §3](./TESTING.MD#3-proposed-automated-test-plan). Start with T-01 and T-02.

### R3 — No rate limiting 🔴

- **What:** Unlimited password guesses on `/login`. Unlimited reset emails per address on `/login/forgot` (spam / SMTP cost).
- **Mitigation:** Proxy-level `limit_req`, or an app-level limiter in `hooks.server.ts` keyed by IP + email. Consider lockout after N failures.

### R4 — HTML injection in reset email 🟠

- **What:** `sendPasswordResetEmail` builds HTML with `${user.name}`. `name` comes from registration or Google and isn't escaped, so a crafted name can inject links or markup into the email.
- **Mitigation:** Escape `&<>"'` before interpolation, or use a templating helper.

### R5 — FK errors on delete ✅ fixed

- **What:** `doctors → hospitals/specialists` and `bookings → doctors/schedules` have no `ON DELETE` rule. Delete actions don't catch the Postgres error → generic 500 page.
- **Mitigation:** Pre-check dependents and return `fail(409, { error: 'Hospital still has doctors' })`, or switch to soft delete (`is_active = false`).

### R7 — Unrestricted status transitions 🟠

- **Mitigation:** Allow-list transitions (`pending→confirmed|cancelled`, `confirmed→completed|cancelled`). See the diagram in [FLOW.MD §3](./FLOW.MD#3-booking-lifecycle).

### R9 — Session handling 🟢

- **Mitigation:** On password change, delete other sessions (as the reset flow already does). Consider a shorter TTL with sliding renewal.

### R12 / R13 — Compliance 🟠

- Health-related data falls under Indonesian personal data rules (UU PDP No. 27/2022). Before production: define a retention policy, access logging for manager actions, DB encryption at rest (managed provider), and a privacy notice.

## 3. Heat map

```
Impact →      1 (low)          2 (med)               3 (high)
L=3       R5, R8              R2                     R1 (fixed)
L=2       R10, R11            R4, R6, R7, R12        R3
L=1       R17                 R9, R14, R18           R13, R15*, R16*
                                                     * mitigated
```

## 4. Review cadence

Review this register at the start of each release and whenever a new integration (payments, notifications, file uploads) is added.
