# User & System Flows

> Part of the [Purwakarta Health docs](./DEVELOPMENT_STATUS.md). Last verified against code: 2026-10-22.

Diagrams use Mermaid and render on GitHub, GitLab, and VS Code's Markdown preview.

## 1. Anonymous search → booking

```mermaid
flowchart TD
  A[/ landing/] -->|hero search: specialty + hospital| B[/find-doctor?q=&hospital=/]
  A -->|logged in| R{role}
  R -->|patient| H[/home/]
  R -->|manager| M[/manager/]
  B -->|Book Now, anonymous| L[/login?redirect=/doctors/:id/book/]
  B -->|Book Now, logged in| K[/doctors/:id/book/]
  L -->|sign in| K
  K -->|pick date + slot| C[/doctors/:id/book/confirm?date&time&scheduleId/]
  C -->|POST default| X{createBookingAtomic}
  X -->|ok| AP[/appointments?booked=id → confirmation modal/]
  X -->|slot_full / invalid_schedule| C
```

- The specialty input calls `GET /api/specialists?q=` with a 250 ms debounce. Stale responses are dropped through a request counter.
- `/doctors/[id]/book` is viewable without login. The login redirect happens on the confirm **POST**, which preserves the full confirm URL in `?redirect=`.

## 2. Booking transaction

```mermaid
sequenceDiagram
  participant U as Patient
  participant P as confirm/+page.server.ts
  participant B as booking.ts
  participant DB as PostgreSQL
  U->>P: POST scheduleId, date, time
  P->>B: createBookingAtomic(...)
  B->>DB: BEGIN
  B->>DB: SELECT … FROM doctor_schedules WHERE id AND doctor_id FOR UPDATE
  alt schedule missing or weekday mismatch
    B-->>P: { ok:false, invalid_schedule }
  else
    B->>DB: COUNT bookings for slot WHERE status <> 'cancelled'
    alt used >= max_quota
      B-->>P: { ok:false, slot_full }
    else
      B->>DB: INSERT booking (status = pending)
      B-->>P: { ok:true, id }
    end
  end
  B->>DB: COMMIT
  P-->>U: 303 /appointments?booked=id
```

## 3. Booking lifecycle

```mermaid
stateDiagram-v2
  [*] --> pending: patient books
  pending --> confirmed: manager
  pending --> cancelled: patient or manager
  confirmed --> cancelled: patient or manager
  confirmed --> completed: manager
  cancelled --> [*]
  completed --> [*]
```

- Patients can cancel only `pending` or `confirmed` bookings (`cancelBookingForUser`).
- Managers can set **any** status from any status. There is no transition validation. See [TECHDEBT.MD](./TECHDEBT.MD).
- Cancelled bookings free the slot immediately (availability counts ignore `cancelled`).

## 4. Registration and email login

```mermaid
flowchart LR
  R[/register/] -->|name, email, phone?, password ≥ 8| V{valid & email free?}
  V -->|no| R
  V -->|yes| U[insert user role=patient<br/>Argon2 hash] --> S[create session<br/>set session_id cookie] --> H[/home/]

  L[/login/] -->|email, password| Q{user exists?}
  Q -->|no| E[Invalid email or password]
  Q -->|yes, no password| G[Use Continue with Google]
  Q -->|yes| P{Argon2 verify}
  P -->|fail| E
  P -->|ok| S2[create session] --> D[safeRedirect → redirect param or role home]
```

## 5. Google sign-in (OAuth 2.0 + PKCE)

```mermaid
sequenceDiagram
  participant B as Browser
  participant S as /login/google
  participant G as Google
  participant C as /login/google/callback
  B->>S: GET ?redirect=…
  S->>B: Set cookies: state, PKCE verifier, redirect (10 min)<br/>303 → Google authorize URL
  B->>G: consent
  G->>B: 303 → callback?code&state
  B->>C: GET code, state (+ cookies)
  C->>C: state == cookie?
  C->>G: exchange code + verifier → tokens
  C->>G: userinfo
  C->>C: findOrCreateGoogleUser
  Note over C: existing google_id → sign in<br/>existing email + email_verified → link<br/>existing email + NOT verified → refuse<br/>new email → create patient
  C->>B: session cookie, 303 → /manager or redirect or /home
```

## 6. Forgot / reset password

```mermaid
sequenceDiagram
  participant U as User
  participant F as /login/forgot
  participant PR as password-reset.ts
  participant M as mailer.ts
  participant RS as /login/reset/[token]
  U->>F: POST email
  F->>PR: (if user exists) createPasswordResetToken
  PR->>PR: delete old unused tokens<br/>store sha256(token), expires +1h
  F->>M: sendPasswordResetEmail(link)
  M-->>M: SMTP configured? send : console.log
  F-->>U: always { success: true }
  U->>RS: GET (token valid?)
  U->>RS: POST password, confirmPassword
  RS->>PR: findValidPasswordResetToken
  RS->>RS: update hash, mark used_at, delete ALL sessions
  RS-->>U: 303 /login?reset=success
```

## 7. Logout

Patients use `/profile?/logout` or `/profile/settings?/logout`. The manager layout posts to `/profile?/logout`. The action deletes the session row and clears the cookie, then `303 /login`.

## 8. Manager CRUD

```mermaid
flowchart LR
  List[List page<br/>q / filters / page / pageSize] -->|Add| Modal[Modal form] -->|POST ?/create| Toast
  List -->|Edit| Modal2[Modal form prefilled] -->|POST ?/update| Toast
  List -->|Delete| Confirm[ConfirmDialog] -->|hidden form POST ?/delete| Toast
  Toast[toastForm → Toaster] --> List
```

The same pattern applies to hospitals, specialists, doctors, and schedules. Bookings have only an inline status `<select>` posting `?/updateStatus`.

### Delete and foreign keys

| Delete | FK behaviour | Result today |
| ------ | ------------ | ------------ |
| Hospital with doctors | `doctors.hospital_id` → no action | `409` "Hospital still has doctors…" |
| Specialist with doctors | `doctors.specialist_id` → no action | `409` |
| Doctor with bookings | `bookings.doctor_id` / `schedule_id` → no action (schedules cascade, but bookings block it) | `409` — mark the doctor inactive instead |
| Doctor without bookings | schedules `ON DELETE CASCADE` | OK |
| Schedule with bookings | `bookings.schedule_id` → no action | `409` |

Delete actions catch the Postgres FK violation (SQLSTATE `23503`, via `isForeignKeyViolation` in `src/lib/server/db-errors.ts`) and return `fail(409, { error })`. Fixed 2026-10-22 (TD-04).

## 9. Manager dashboard and CSV export

1. `/manager?range=&hospitalId=&specialistId=` — a GET form, so filters live in the URL.
2. The `load` function calls `totals`, `previousTotals` (for trend chips; hidden when `range=all`), `bookingsOverTime`, `statusBreakdown`, `bookingsBySpecialty`, `topDoctors`, and `recentBookings`.
3. **Export** links to `/manager/export.csv` with the same query string → `exportRows(filters)` → CSV download.
