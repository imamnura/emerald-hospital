# Refactor & Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghapus duplikasi dan kode mati, memperbaiki performa query/render, dan merapikan struktur folder `src/lib` tanpa mengubah perilaku aplikasi yang terlihat pengguna.

**Architecture:** Refactor bertahap, satu commit per task, suite test tetap hijau di setiap commit. Helper bersama dibuat langsung di lokasi folder final (lihat *File Structure*), lalu pemanggil dimigrasikan; file lama dipindah (`git mv`) di task terpisah di akhir supaya diff logika dan diff pemindahan tidak bercampur. Test route/komponen yang sudah ada (961 test) berfungsi sebagai *characterization test*: migrasi pemanggil dianggap benar bila test lama tetap lulus tanpa diubah asersinya.

**Tech Stack:** SvelteKit 3.4, Svelte 5.59 (runes), Vite 8, Vitest 5 + PGlite, Drizzle ORM 0.45 + drizzle-kit 0.31, Tailwind 4, Zustand 5, pnpm.

**Spec:** Tidak ada dokumen spec terpisah. Sumber kebutuhan: permintaan user — *"refactor code, no duplication code, no dead code, remove unused code, good performance, scalability, easy maintenance, good structure folder"* — ditambah temuan audit 2026-11-25 yang diringkas di bagian **Temuan Audit** di bawah. Executor membaca bagian itu sebagai spec.

## Global Constraints

- **Perilaku tetap sama.** Teks UI, URL redirect, status HTTP, pesan error, nama cookie, dan output CSV tidak berubah. Pengecualian yang disengaja hanya: Task 2 (data user ke client dipangkas) dan Task 6 (filter UUID tidak valid diabaikan, bukan 500).
- **Asersi test lama tidak boleh dilemahkan.** Test boleh dipindah, di-import ulang, atau dihapus *hanya* bila kode yang diujinya dihapus; asersi nilai tidak diubah.
- Tidak ada dependency baru. `zustand` dipertahankan (dipakai `persist`). Persist key `'emerald-search'` **tidak** diganti (mengganti akan menghapus bookmark/filter user).
- Di luar scope: i18n / penyeragaman bahasa (TD-12), rebrand string "emerald" (TD-16), nama database, tombol placeholder tanpa handler (Header notifikasi, MoreVertical di halaman book), perubahan visual.
- Import memakai alias `#lib/...` dengan ekstensi `.ts`/`.svelte` eksplisit (konvensi yang sudah ada).
- Pemindahan file (`git mv`) dan perubahan logika tidak boleh berada dalam commit yang sama.
- File baru ≤ 200 baris; `+page.svelte` yang disentuh ditargetkan ≤ 250 baris.
- Coverage threshold 90% (lines/statements/functions/branches) di `vitest.config.ts` tetap lulus.
- Branch kerja: `refactor/cleanup`, dibuat dari HEAD `chore/dependency-update` (590e4d9) — atau dari `master` bila branch dependency sudah di-merge.
- Jangan stage `.claude/`. `logs/` hanya disentuh di Task 1.
- Pesan commit diakhiri `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### VERIFY (dirujuk oleh setiap task)

```bash
pnpm test    # Expected: "Test Files  N passed (N)", 0 failed. Baseline 115 file / 961 test; jumlah boleh berubah hanya karena test kode mati dihapus atau test baru ditambah. ~4 menit.
pnpm check   # Expected: "0 ERRORS 0 WARNINGS"
pnpm build   # Expected: berakhir dengan "✔ done" (warning adapter-auto sudah ada sebelumnya, OK)
```

Di akhir Task 9, 13, dan 18 jalankan juga `pnpm test:coverage` — Expected: tidak ada pesan "ERROR: Coverage for ... does not meet global threshold".

## Review Focus

1. **State Zustand tersimpan (`emerald-search`) tetap ter-hydrate** setelah tipe store diubah (Task 4/14): user lama yang punya bookmark di localStorage harus tetap melihatnya. Test di Task 14: `hydrates bookmarks persisted by the previous version`.
2. **Cookie sesi identik** setelah ekstraksi `setSessionCookie` (Task 5): nama `session_id`, `path: '/'`, `httpOnly`, `sameSite: 'lax'`, `secure` hanya di production, `maxAge` 30 hari. Test di Task 5: `setSessionCookie sets the same options as before`.
3. **Tanggal tidak bergeser di zona waktu UTC+7 / UTC−8** setelah formatter disatukan (Task 3). Test di Task 3: `formatDate keeps the calendar day in Asia/Jakarta and America/Los_Angeles`.
4. **Form delete manager mengirim id target yang benar** setelah trik `tick()+requestSubmit()` diganti `DeleteConfirm` (Task 11) — bug lama: id kosong terkirim. Test di Task 11: `DeleteConfirm submits the target id`.
5. **Migration index aman untuk data produksi** (Task 9): hanya `CREATE INDEX`, tanpa rewrite tabel. Step verifikasi di Task 9 memeriksa isi SQL hasil generate.

---

## Temuan Audit (ringkasan, menjadi spec)

| Area | Temuan | Ditangani di |
| --- | --- | --- |
| Keamanan | `routes/+layout.server.ts:4` dan `profile/+page.server.ts:39` mengirim seluruh `User` (termasuk `passwordHash`, `googleId`) ke client | Task 2 |
| Hygiene | `logs/*.log` ter-track git; `SESSION_SECRET` tidak dipakai; `src/lib/index.ts` kosong + alias `"#lib"` tanpa pemakai; `tsconfig` include folder `test` yang tidak ada | Task 1 |
| Format | Pola `new Date(s + 'T12:00:00').toLocaleDateString('en-US', …)` ±12 salinan; `formatCurrency`/`formatCardNumber` 3 salinan; initials 6 salinan | Task 3 |
| Domain | Peta label/warna status booking 5+5 salinan; peta specialist 2 tabel terpisah + `specialist-icons.ts`; daftar enum ditulis manual (`VALID_STATUSES`, `BRANDS`, `ALLOWED_GENDER`, `ALLOWED_BLOOD`) | Task 4 |
| Auth | Cek login inline 20×; set cookie sesi 3×; logout 2×; `safeRedirect` vs `safeRedirectTarget`; lookup user by email 3×; update password 2×; `requirePatient`/`requireManager` tidak dipakai | Task 5 |
| Manager server | load list (where/count/list) 5×; baca+validasi `id` 9×; tangkap FK violation 8×; `String(fd.get(k) ?? '').trim()` ±40× | Task 6 |
| Modul server | join berulang di `doctors.ts`, `booking.ts`, `analytics.ts` (8×); cabang `if (where)` tak terjangkau di `analytics.ts`; `parseProfileForm` tidak dipakai tapi diduplikasi di `profile/personal`; formatter duplikat di `server/payments.ts` | Task 7 |
| Performa DB | `validateSession` 2 query/request; N+1 di `getAllSlotsForDoctorDate`; `await` berurutan di loader; read-then-write di `upsertInsurance`; reset password tanpa transaksi; query fallback sia-sia di appointments | Task 8 |
| Index | Tidak ada index di kolom FK yang dipakai join/filter | Task 9 |
| UI | Avatar 13 salinan; banner error 6×; shell modal 3×; header back 3 hand-rolled; brand mark 3× | Task 10 |
| UI manager | State CRUD + form delete tersembunyi + search form + footer modal 4–5× | Task 11 |
| UI pasien/auth | Kartu dokter 3 komponen + 2 inline; chip/grid specialist; form hero landing = find-doctor; tombol Google 2×; ikon auth 3; settings row 3; logout 2× | Task 12 |
| Reaktivitas | `$effect.pre` menyalin props ke `$state` (9 halaman); `{#each}` data tanpa key; array dibangun ulang di markup; `manager/+page.svelte` 431 baris | Task 13 |
| Kode mati | Props tak pernah dikirim (chart, autocomplete, toggle, `open` modal); export yang hanya dipakai internal/test | Task 14 |
| Struktur | `lib/server` flat 16 modul; `components` campuran flat + subfolder; `utils.ts` + `utils/`; helper test 5 file tumpang tindih | Task 15–17 |

---

## File Structure (target akhir)

```
src/lib/
├─ format/            # formatter murni, isomorfik
│  ├─ date.ts         # parseIsoDate, formatDate(preset), toLocalDateString, formatTime12h, DAY_NAMES
│  ├─ money.ts        # formatCurrency, formatCardNumber
│  └─ text.ts         # getInitials
├─ domain/            # konstanta & aturan domain, isomorfik
│  ├─ booking-status.ts   # BOOKING_STATUSES, BookingStatus, STATUS_LABEL, kelas warna per varian
│  └─ specialist.ts       # gabungan utils/specialist.ts + specialist-icons.ts
├─ utils/             # helper view per fitur
│  ├─ cn.ts  enhance.ts  url.ts  crud.svelte.ts
│  └─ appointments.ts booking-ui.ts insurance.ts medical-records.ts payments.ts profile.ts
├─ stores/  data/     # tidak berubah
├─ server/
│  ├─ auth/      session.ts (ex auth.ts) guards.ts redirect.ts oauth-google.ts password-reset.ts
│  ├─ db/        index.ts schema.ts errors.ts (ex db-errors.ts)
│  ├─ http/      forms.ts pagination.ts list-query.ts
│  ├─ catalog/   catalog.ts doctors.ts
│  ├─ booking/   booking.ts analytics.ts
│  ├─ patient/   users.ts insurance.ts payments.ts medical-records.ts preferences.ts
│  └─ mailer.ts
└─ components/
   ├─ ui/          Dialog Modal ConfirmDialog Avatar FormAlert FormIconField EmptyState Pagination StatusBadge Toaster BrandMark
   ├─ layout/      Header BackHeader BottomNav SearchBar
   ├─ motion/      MotionReveal PageEnter
   ├─ auth/        AuthBadge GoogleAuthButton
   ├─ doctor/      DoctorSummary DoctorSearchForm SpecialtyAutocomplete FilterOptionsModal
   ├─ specialist/  SpecialistTile
   ├─ appointment/ AppointmentCard ResultDialog CancelAppointmentModal AppointmentCancelledModal AppointmentConfirmedModal
   ├─ profile/     ProfileMenuItem HelpContactCard LogoutButton settings/ insurance/ payment/ medical-records/
   └─ manager/     PageHeader RowActions ManagerSearchForm DeleteConfirm charts/ dashboard/
src/test/
├─ helpers/  route.ts (ev, thrown, reset, nonManagers, UNKNOWN_ID, MONDAY…)  component.ts (snip, resetStores)
├─ mocks/  harness/  db.ts  factories.ts  setup-*.ts
```

Dihapus: `src/lib/index.ts`, `src/lib/utils.ts`, `src/lib/specialist-icons.ts`, `src/lib/utils/specialist.ts`, `src/test/helpers-*.ts` (5 file), `lib/components/SpecialistChip.svelte`, `SpecialistGridCard.svelte`, `DoctorCard.svelte`, `SpecialistDoctorCard.svelte`, `SearchResultCard.svelte`, `SearchPageHeader.svelte`, `auth/AuthLogo.svelte`, `auth/AuthRegisterLogo.svelte`, `auth/AuthForgotIcon.svelte`, `settings/SettingsLinkRow.svelte` + `SettingsToggleRow.svelte` (digabung jadi `SettingsRow`).

---

### Task 1: Hygiene repo & konfigurasi mati

**Files:**
- Modify: `.gitignore`, `.env.example`, `package.json` (`imports`), `tsconfig.json`
- Delete: `src/lib/index.ts`; asersi `#lib/index` di `src/lib/data/data.test.ts:4,48`
- Untrack: `logs/combined.log`, `logs/error.log`

**Interfaces:**
- Consumes: —
- Produces: `package.json` `imports` hanya berisi `"#lib/*": "./src/lib/*"` (Task 17 menambah `#test/*`)

- [ ] **Step 1:** `git rm --cached logs/combined.log logs/error.log`; tambahkan `logs/` dan `*.log` ke `.gitignore`.
- [ ] **Step 2:** Hapus baris `SESSION_SECRET` dari `.env.example` (verifikasi dulu: `grep -rn SESSION_SECRET src scripts` → kosong).
- [ ] **Step 3:** Hapus `src/lib/index.ts`, entry `"#lib"` di `package.json` `imports`, dan import/asersi-nya di `data.test.ts`. Ubah `tsconfig.json` `include` menjadi `["src", "*"]`.
- [ ] **Step 4:** VERIFY. Expected tambahan: `git status --short logs/` kosong setelah commit.
- [ ] **Step 5: Commit** — `chore: untrack logs, drop unused lib index and SESSION_SECRET`

---

### Task 2: Jangan kirim `passwordHash`/`googleId` ke client

**Files:**
- Modify: `src/lib/server/auth.ts` (tambah fungsi), `src/routes/+layout.server.ts`, `src/routes/(patient)/profile/+page.server.ts`
- Test: `src/lib/server/auth.test.ts`, `src/routes/layout.server.test.ts`, `src/routes/(patient)/profile/page.server.test.ts`

**Interfaces:**
- Produces: `export type PublicUser = Omit<User, 'passwordHash' | 'googleId'>` dan `export function toPublicUser(user: User): PublicUser` di `src/lib/server/auth.ts` (pindah ke `server/auth/session.ts` di Task 15)

- [ ] **Step 1: Tulis test gagal**

```ts
// auth.test.ts
it('toPublicUser strips credentials', async () => {
  const u = await makeUser({ googleId: 'g-1' });
  const pub = toPublicUser(u);
  expect(pub).not.toHaveProperty('passwordHash');
  expect(pub).not.toHaveProperty('googleId');
  expect(pub).toMatchObject({ id: u.id, email: u.email, role: u.role });
});
// layout.server.test.ts
it('root layout never exposes the password hash', async () => {
  const user = await makeUser();
  const data = await load(ev({ locals: { user } }));
  expect(data.user).not.toHaveProperty('passwordHash');
  expect(data.user).not.toHaveProperty('googleId');
});
// profile/page.server.test.ts — asersi yang sama pada data.profile
```

- [ ] **Step 2:** `pnpm vitest run src/lib/server/auth.test.ts src/routes/layout.server.test.ts "src/routes/(patient)/profile/page.server.test.ts"` → FAIL (`toPublicUser` tidak ada / properti masih ada).
- [ ] **Step 3:** Implementasi `toPublicUser` (destructuring, bukan `delete`); root layout mengembalikan `{ user: locals.user ? toPublicUser(locals.user) : null }`; profile mengembalikan `profile: toPublicUser(locals.user)`. Ganti tipe `User` → `PublicUser` di komponen yang mengonsumsi data ini bila `pnpm check` mengeluh.
- [ ] **Step 4:** Jalankan ulang test Step 2 → PASS, lalu VERIFY.
- [ ] **Step 5: Commit** — `fix(security): strip password hash and google id from client data`

---

### Task 3: `lib/format` — satu sumber untuk tanggal, uang, initials

**Files:**
- Create: `src/lib/format/date.ts`, `src/lib/format/money.ts`, `src/lib/format/text.ts` (+ `*.test.ts` di folder yang sama)
- Modify (pemanggil): `src/lib/utils/{appointments,booking-ui,payments,profile}.ts`, `src/lib/utils.ts`, `src/lib/server/{insurance,medical-records,payments,booking}.ts`, `src/routes/(patient)/doctors/[id]/book/+page.server.ts:55`, `src/routes/(patient)/doctors/[id]/book/confirm/+page.svelte:23`, `src/routes/(patient)/profile/personal/+page.server.ts:13`, `src/routes/manager/+page.svelte:70`, `src/routes/manager/bookings/+page.svelte` (`formatDateId`), `Header.svelte:21`, `SearchPageHeader.svelte:20`, `AppointmentCard.svelte:539`, `(patient)/profile/+page.svelte:238`, `profile/personal/+page.svelte:39`, `routes/manager/+layout.svelte:45`
- Test: test lama untuk fungsi yang digantikan dipindah ke `format/*.test.ts` dengan nilai harapan yang sama persis

**Interfaces:**
- Produces:
  - `type DatePreset = 'short' | 'long' | 'longId' | 'monthYear' | 'monthYearShort' | 'dayMonth' | 'weekdayDayMonth' | 'weekdayShort'`
  - `parseIsoDate(value: string | Date): Date` — string `YYYY-MM-DD` → `new Date(v + 'T12:00:00')`; string lain → `new Date(v)`; `Date` dikembalikan apa adanya
  - `formatDate(value: string | Date, preset: DatePreset): string`
  - `toLocalDateString(d: Date): string`, `formatTime12h(time24: string): string` (dipindah dari `booking-ui.ts`, signature sama)
  - `DAY_NAMES` (dipindah dari `utils.ts`, nilai sama)
  - `formatCurrency(amount: number | string, currency = 'USD'): string`, `formatCardNumber(last4: string): string` di `money.ts`
  - `getInitials(name: string | null | undefined): string` di `text.ts`

Tabel preset (opsi `toLocaleDateString`, locale `en-US` kecuali disebut):

| preset | opsi | menggantikan |
| --- | --- | --- |
| `short` | `{ month:'short', day:'numeric', year:'numeric' }` | `formatCancelModalDate`, `formatAppointmentDateShort`, `formatTxDate`, `manager/+page.svelte formatDate`, `insurance.ts` (2×), medical-records `dateLabel` bila opsinya sama |
| `long` | `{ weekday:'long', month:'short', day:'numeric', year:'numeric' }` | `formatAppointmentDateLong` |
| `longId` | locale `id-ID`, `{ weekday:'long', day:'numeric', month:'long', year:'numeric' }` | `formatDateId` |
| `monthYear` | `{ month:'long', year:'numeric' }` | `formatMonthYear`, book `+page.server.ts:55`, medical-records `monthLabel` (pemanggil tetap `.toUpperCase()`) |
| `monthYearShort` | `{ month:'short', year:'numeric' }` | `formatMemberSince` |
| `dayMonth` | `{ month:'short', day:'numeric' }` | `formatNextVisitShort` |
| `weekdayDayMonth` | `{ weekday:'short', month:'short', day:'numeric' }` | bagian tanggal di `formatAppointmentListDate` |
| `weekdayShort` | `{ weekday:'short' }` | `generateCalendarDays` `dayLabel` (pemanggil tetap `.toUpperCase()`) |

`getInitials` = algoritme yang sama dengan `Header.svelte:21` (`split(' ')` → huruf pertama → `join('')` → `slice(0, 2)` → `toUpperCase()`), ditambah `null`/`undefined` → `''`. Salinan `charAt(0)` di `manager/doctors:203` tetap satu huruf: pemanggil memakai `getInitials(name).slice(0, 1)`.

- [ ] **Step 1: Tulis test gagal** di `src/lib/format/date.test.ts`, `money.test.ts`, `text.test.ts`. Salin dulu asersi lama untuk setiap fungsi yang digantikan (cari di `utils/misc.test.ts`, `utils/booking-ui.test.ts`, `utils/appointments.test.ts`, `server/payments.test.ts`, `utils.test.ts`), lalu tambahkan:

```ts
it('formatDate keeps the calendar day in Asia/Jakarta and America/Los_Angeles', () => {
  const prev = process.env.TZ;
  for (const tz of ['Asia/Jakarta', 'America/Los_Angeles']) {
    process.env.TZ = tz;
    expect(formatDate('2026-10-17', 'short')).toBe('Oct 17, 2026');
    expect(formatDate('2026-10-17', 'monthYear')).toBe('October 2026');
  }
  process.env.TZ = prev;
});
it('formatCurrency', () => expect(formatCurrency('150')).toBe('$150.00'));
it('getInitials', () => {
  expect(getInitials('Siti Nurhaliza Putri')).toBe('SN');
  expect(getInitials('budi')).toBe('B');
  expect(getInitials('')).toBe('');
  expect(getInitials(null)).toBe('');
});
```

- [ ] **Step 2:** `pnpm vitest run src/lib/format` → FAIL (modul tidak ada).
- [ ] **Step 3:** Implementasi tiga modul (`formatDate` memakai `Record<DatePreset, { locale: string; opts: Intl.DateTimeFormatOptions }>`). Jalankan test Step 2 → PASS.
- [ ] **Step 4:** Migrasikan semua pemanggil di daftar *Files*, lalu hapus fungsi lama yang sekarang tidak dipakai: `formatCancelModalDate`, `formatAppointmentDateShort`, `formatAppointmentDateLong`, `formatMonthYear`, `formatTxDate`, `formatMemberSince`, `formatNextVisitShort`, `formatDateId`, `formatCurrency`/`formatCardNumber` di `utils/payments.ts` **dan** `server/payments.ts`, `dollar()` di `insurance.ts` bila setara dengan `formatCurrency`. Hapus juga test lama yang asersinya sudah disalin di Step 1. Cek sisa: `grep -rn "T12:00:00" src --include=*.ts --include=*.svelte | grep -v test` → hanya `src/lib/format/date.ts`.
- [ ] **Step 5:** VERIFY.
- [ ] **Step 6: Commit** — `refactor: consolidate date, money and initials formatting into lib/format`

---

### Task 4: `lib/domain` — status booking & specialist

**Files:**
- Create: `src/lib/domain/booking-status.ts`, `src/lib/domain/specialist.ts` (+ test di folder yang sama)
- Modify: `src/lib/server/db/schema.ts` (enum memakai konstanta domain), `src/lib/components/manager/StatusBadge.svelte`, `src/routes/manager/+page.svelte:30-42,98-103`, `src/routes/manager/export.csv/+server.ts:5`, `src/routes/manager/bookings/+page.server.ts:10` (`VALID_STATUSES`), `src/routes/manager/bookings/+page.svelte:16` (tipe `Status`), `src/lib/utils/appointments.ts:33-51`, `src/lib/server/payments.ts:8` (`BRANDS`), `src/lib/server/users.ts:15-16` + `src/routes/(patient)/profile/personal/+page.server.ts:8` (`ALLOWED_GENDER`/`ALLOWED_BLOOD`), semua importir `#lib/specialist-icons.ts` dan `#lib/utils/specialist.ts`
- Delete: `statusLabel`, `statusColor` (`src/lib/utils.ts:13-32`, hanya dipakai test), `src/lib/specialist-icons.ts`, `src/lib/utils/specialist.ts`

**Interfaces:**
- Produces (`domain/booking-status.ts`):
  - `BOOKING_STATUSES = ['pending','confirmed','cancelled','completed'] as const` (urutan sama dengan enum `booking_status` di `schema.ts`)
  - `type BookingStatus = (typeof BOOKING_STATUSES)[number]`
  - `isBookingStatus(v: string): v is BookingStatus`
  - `STATUS_LABEL: Record<BookingStatus, string>` — `Pending`/`Confirmed`/`Cancelled`/`Completed`
  - `STATUS_CLASS: Record<'badge' | 'pill' | 'dot' | 'appointment', Record<BookingStatus, string>>` — nilainya disalin persis dari: `badge` = `manager/+page.svelte STATUS_BADGE`; `pill` = `StatusBadge COLOR`; `dot` = `StatusBadge DOT`; `appointment` = `appointmentStatusStyles`
  - `STATUS_HEX: Record<BookingStatus, string>` = `manager/+page.svelte STATUS_COLORS`
  - Status di luar enum: fallback ke string mentah untuk label dan `bg-surface-container text-on-surface-variant` untuk kelas, sama seperti perilaku sekarang
- Produces (`domain/specialist.ts`): `resolveSpecialistIcon(key)` (signature sama), `specialistPluralTitle(name)`, `doctorRoleLabel(name, rating)`, `specialistAvailabilityLabel(count)` — dua tabel 12 entri digabung jadi satu `SPECIALISTS: Record<string, { plural: string; role: string }>`
- Konstanta enum lain (`CARD_BRANDS`, `GENDERS`, `BLOOD_TYPES`) di-export dari `schema.ts` via `cardBrandEnum.enumValues` dkk. **Hanya** untuk kode server. `BLOOD_TYPES` tetap array literal bila bukan enum DB; satu definisi dipakai oleh `users.ts` dan `personal`.

- [ ] **Step 1: Tulis test gagal**

```ts
// domain/booking-status.test.ts
it('BOOKING_STATUSES mirrors the DB enum', () =>
  expect(BOOKING_STATUSES).toEqual(bookingStatusEnum.enumValues));
it('labels', () => expect(STATUS_LABEL.cancelled).toBe('Cancelled'));
it('class variants keep current values', () => {
  expect(STATUS_CLASS.badge.confirmed).toBe('bg-primary/15 text-primary');
  expect(STATUS_CLASS.pill.cancelled).toBe('bg-red-50 text-error ring-red-200');
  expect(STATUS_CLASS.appointment.cancelled).toBe('bg-red-50 text-error');
  expect(STATUS_HEX.confirmed).toBe('#005d42');
});
// domain/specialist.test.ts — pindahkan asersi dari specialist-icons.test.ts dan utils/misc.test.ts (bagian specialist) tanpa mengubah nilai
```

- [ ] **Step 2:** `pnpm vitest run src/lib/domain` → FAIL.
- [ ] **Step 3:** Implementasi. `schema.ts` memakai `pgEnum('booking_status', BOOKING_STATUSES)`. Lalu jalankan `pnpm db:generate` → Expected: "No schema changes" (tidak ada migration baru).
- [ ] **Step 4:** Migrasikan semua pemanggil di daftar *Files*; hapus file/fungsi lama beserta test yang asersinya sudah dipindah. Cek: `grep -rn "Cancelled'" src --include=*.ts --include=*.svelte | grep -v test` → hanya `domain/booking-status.ts`.
- [ ] **Step 5:** VERIFY.
- [ ] **Step 6: Commit** — `refactor: single source for booking status and specialist metadata`

---

### Task 5: Helper auth — guard, cookie sesi, redirect, query user

**Files:**
- Create: `src/lib/server/auth/redirect.ts` (+ test)
- Modify: `src/lib/server/guards.ts`, `src/lib/server/auth.ts`, `src/lib/server/users.ts`, `src/routes/login/+page.server.ts`, `src/routes/login/google/+server.ts`, `src/routes/login/google/callback/+server.ts`, `src/routes/login/forgot/+page.server.ts`, `src/routes/login/reset/[token]/+page.server.ts`, `src/routes/register/+page.server.ts`, `src/routes/+page.server.ts`, `src/routes/manager/+layout.server.ts`, `src/routes/manager/export.csv/+server.ts:21`, semua `+page.server.ts` di `src/routes/(patient)/profile/**`, `(patient)/appointments/+page.server.ts`, `(patient)/doctors/[id]/book/confirm/+page.server.ts:61-63`
- Test: `guards.test.ts`, `auth.test.ts`, `users.test.ts`, `auth/redirect.test.ts`

**Interfaces:**
- Produces (`guards.ts`):
  - `requireUser(locals: App.Locals, returnTo?: string): User` — bila belum login: `throw redirect(303, returnTo ? '/login?redirect=' + returnTo : '/login')` (tanpa `encodeURIComponent`, sama seperti string literal sekarang)
  - `requirePatient(locals, returnTo?): User` — `requireUser` + role manager → `redirect(303, '/manager')`
  - `requireManager(locals, returnTo?): User` — `requireUser` + role patient → `redirect(303, '/home')`
  - `isManager`, `denyUnlessManager` tetap
- Produces (`auth.ts`): `setSessionCookie(cookies: Cookies, userId: string): Promise<void>` (membuat sesi + set cookie) dan `endSession(cookies: Cookies): Promise<void>` (hapus sesi + clear cookie). `sessionCookieOptions` dan `clearSessionCookie` jadi internal (tanpa `export`) bila tidak ada pemakai lain.
- Produces (`auth/redirect.ts`): `homeFor(role: 'manager' | 'patient'): '/manager' | '/home'`, `sanitizeRedirect(path: string | null | undefined): string | null` (mengembalikan `path` bila diawali `/`, bukan `//`, dan bukan `/login`; selain itu `null`). `safeRedirect`/`safeRedirectTarget` lokal dihapus; pemanggil memakai `sanitizeRedirect(x) ?? homeFor(role)`.
- Produces (`users.ts`): `getUserByEmail(email: string): Promise<User | undefined>` (email di-lowercase sama seperti pemanggil sekarang — cek dulu apakah ketiga pemanggil melakukan normalisasi yang sama), `setPassword(userId: string, plain: string): Promise<void>`
- Perilaku yang dipertahankan: `appointments` action tetap `fail(401)` (bukan redirect); halaman `forgot`/`reset`/`register` tetap redirect ke `/home` untuk user login.

- [ ] **Step 1: Tulis test gagal**

```ts
// guards.test.ts
it('requireUser redirects anonymous users with return path', async () =>
  expect(await thrown(() => requireUser({ user: null }, '/profile/insurance')))
    .toMatchObject({ status: 303, location: '/login?redirect=/profile/insurance' }));
it('requireUser without returnTo goes to /login', async () =>
  expect(await thrown(() => requireUser({ user: null }))).toMatchObject({ location: '/login' }));
it('requireUser returns the user', async () => {
  const u = await makeUser(); expect(requireUser({ user: u })).toBe(u);
});
it('requirePatient sends managers to /manager', async () =>
  expect(await thrown(async () => requirePatient({ user: await makeManager() }))).toMatchObject({ location: '/manager' }));
// auth.test.ts
it('setSessionCookie sets the same options as before', async () => {
  const set = vi.fn(); const u = await makeUser();
  await setSessionCookie({ set } as unknown as Cookies, u.id);
  expect(set).toHaveBeenCalledWith('session_id', expect.any(String),
    { path: '/', httpOnly: true, sameSite: 'lax', secure: false, maxAge: 2592000 });
});
it('endSession deletes the session row and clears the cookie', /* get → id, set maxAge 0, validateSession(id) → null */);
// auth/redirect.test.ts
it.each([['/doctors/1', '/doctors/1'], ['//evil.com', null], ['/login?x', null], ['https://x', null], [null, null]])(
  'sanitizeRedirect(%s)', (inp, out) => expect(sanitizeRedirect(inp)).toBe(out));
it('homeFor', () => { expect(homeFor('manager')).toBe('/manager'); expect(homeFor('patient')).toBe('/home'); });
// users.test.ts
it('getUserByEmail finds by email', /* … */);
it('setPassword stores a verifiable hash', /* verifyPassword(row.passwordHash, 'new-pass-123') → true */);
```

- [ ] **Step 2:** `pnpm vitest run src/lib/server` → FAIL.
- [ ] **Step 3:** Implementasi helper.
- [ ] **Step 4:** Migrasikan pemanggil route. Cek sisa: `grep -rn "if (!locals.user) throw redirect" src/routes` → kosong; `grep -rn "cookies.set(opts.name" src/routes` → kosong.
- [ ] **Step 5:** VERIFY. Test route yang lama (login, register, callback, profile/*) harus lulus tanpa mengubah asersi.
- [ ] **Step 6: Commit** — `refactor: shared auth guards, session cookie and redirect helpers`

---

### Task 6: Helper form & list untuk route manager

**Files:**
- Create: `src/lib/server/http/forms.ts`, `src/lib/server/http/list-query.ts` (+ test)
- Modify: `src/lib/server/db-errors.ts` (tambah `isUniqueViolation`), `src/lib/server/catalog.ts` (tambah `listDoctorOptions`), `src/routes/manager/{bookings,doctors,hospitals,schedules,specialists}/+page.server.ts`; pemakaian `formStr`/`formOpt` juga di `profile/{insurance,personal,settings/password}`, `login`, `login/forgot`, `register`, `users.ts`
- Test: `forms.test.ts`, `list-query.test.ts`, `db-errors.test.ts`, `catalog.test.ts`, test route manager (tambah kasus filter UUID tidak valid)

**Interfaces:**
- Produces (`http/forms.ts`):
  - `formStr(fd: FormData, key: string): string` — `String(fd.get(key) ?? '').trim()`
  - `formOpt(fd: FormData, key: string): string | null` — `formStr(...) || null`
  - `readEntityId(fd: FormData, label: string): { id: string } | ActionFailure<{ error: string }>` — kosong → `fail(400, { error: \`Missing ${label} ID.\` })`; bukan UUID → `fail(404, { error: \`${Label} not found.\` })` (huruf pertama label dikapitalisasi; pesan harus sama persis dengan yang ada sekarang)
  - `withFkGuard<T>(op: () => Promise<T>, status: 400 | 409, error: string): Promise<T | ActionFailure<{ error: string }>>` — tangkap `isForeignKeyViolation`, lempar ulang error lain
  - `ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/` (menggantikan 3 salinan)
- Produces (`http/list-query.ts`):
  - `searchWhere(q: string, cols: AnyColumn[], extra?: (SQL | undefined)[]): SQL | undefined` — `or(ilike(col, %q%)…)` AND `extra`; `undefined` bila tidak ada kondisi
  - `paginate<T>(list: { rows: PgSelect; count: PgSelect }, p: Pagination): Promise<{ rows: T[]; total: number }>` — menjalankan count dan list dengan `Promise.all`. Bila tipe Drizzle generik sulit, signature alternatif yang diizinkan: `paginate<T>(rows: Promise<T[]>, count: Promise<{ value: number }[]>): Promise<{ rows: T[]; total: number }>`.
  - `uuidOrUndefined(v: string | null): string | undefined` — filter id dari query string; bukan UUID → `undefined` (perubahan perilaku yang disengaja: sebelumnya error 500 dari Postgres)
- Produces (`catalog.ts`): `listDoctorOptions(): Promise<{ id: string; name: string }[]>` (urut nama) menggantikan query inline di `manager/schedules:73-76`; `manager/doctors:95-96` memakai `listHospitals`/`listSpecialists` yang sudah ada.
- Produces (`db-errors.ts`): `isUniqueViolation(e: unknown): boolean` (SQLSTATE `23505`, cek `e.code` dan `e.cause.code`)
- Manager `specialists` `slugTaken` pre-check diganti dengan menangkap `isUniqueViolation` saat insert/update; pesan error tetap sama.
- Bookings route: kondisi pencarian hanya dibangun sekali (sekarang 2×, di 22-37 dan 72-84).

- [ ] **Step 1: Tulis test gagal**

```ts
// forms.test.ts
const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
it('formStr trims and defaults to empty', () => { expect(formStr(fd({ a: '  x ' }), 'a')).toBe('x'); expect(formStr(fd({}), 'a')).toBe(''); });
it('formOpt returns null for blank', () => expect(formOpt(fd({ a: '  ' }), 'a')).toBeNull());
it('readEntityId: missing → 400', () => expect(readEntityId(fd({}), 'hospital')).toMatchObject({ status: 400, data: { error: 'Missing hospital ID.' } }));
it('readEntityId: non-uuid → 404', () => expect(readEntityId(fd({ id: 'x' }), 'hospital')).toMatchObject({ status: 404, data: { error: 'Hospital not found.' } }));
it('readEntityId: ok', () => expect(readEntityId(fd({ id: UNKNOWN_ID }), 'hospital')).toEqual({ id: UNKNOWN_ID }));
it('withFkGuard maps 23503 and rethrows others', async () => {
  expect(await withFkGuard(() => Promise.reject({ code: '23503' }), 409, 'busy')).toMatchObject({ status: 409, data: { error: 'busy' } });
  await expect(withFkGuard(() => Promise.reject(new Error('x')), 409, 'busy')).rejects.toThrow('x');
});
// list-query.test.ts — searchWhere('', [...]) → undefined; paginate memberi total & rows yang benar atas data PGlite
// db-errors.test.ts — isUniqueViolation({ code: '23505' }) / ({ cause: { code: '23505' } }) → true
// manager/doctors & schedules page.server.test.ts
it('ignores a non-uuid hospital filter instead of erroring', async () =>
  expect((await run('/manager/doctors?hospital=abc')).total).toBe(/* total tanpa filter */));
```

- [ ] **Step 2:** `pnpm vitest run src/lib/server src/routes/manager` → FAIL.
- [ ] **Step 3:** Implementasi helper.
- [ ] **Step 4:** Migrasikan kelima route manager dan pemakai `formStr`/`formOpt`. Cek: `grep -rnE "String\(fd\.get\(" src/routes src/lib | grep -v test` → kosong.
- [ ] **Step 5:** VERIFY.
- [ ] **Step 6: Commit** — `refactor: shared form, id, FK and pagination helpers for manager routes`

---

### Task 7: Deduplikasi & kode mati di modul `lib/server`

**Files:**
- Modify: `src/lib/server/doctors.ts`, `booking.ts`, `analytics.ts`, `users.ts`, `insurance.ts`, `medical-records.ts`, `mailer.ts`, `oauth-google.ts`, `preferences.ts`, `src/routes/(patient)/profile/personal/+page.server.ts`, `src/routes/manager/export.csv/+server.ts`
- Test: test modul terkait

**Interfaces:**
- Consumes: `formStr`/`formOpt`/`ISO_DATE_RE` (Task 6), `parseIsoDate`/`formatDate` (Task 3)
- Produces:
  - `doctors.ts`: satu `doctorListSelect` (objek kolom) + satu `doctorBaseQuery()` (join hospitals/specialists). Default `rating ?? '4.5'` didefinisikan sekali sebagai `DEFAULT_RATING`.
  - `booking.ts`: satu `appointmentQuery()` untuk join di 213-220 dan 228-235; `getDayOfWeek` memakai `parseIsoDate`.
  - `analytics.ts`:
    - `whereForFilters` return type menjadi `SQL` (tidak pernah `undefined`); semua cabang `if (where)` (67, 135, 171, 198, 225, 267, 301) dan ternary 74-77 dihapus.
    - Satu `bookingsWithDoctors()` untuk 8 join.
    - Peta hari didefinisikan sekali.
    - `recentBookings` dan `exportRows` memakai `bookingRowsQuery(where, { order, limit? })`.
    - Kolom `createdAt` yang tidak dipakai di `recentBookings` dihapus.
  - `users.ts`: `parseProfileForm` dipakai oleh `profile/personal` action; duplikat di route dihapus.
  - Hapus `export` dari simbol yang hanya dipakai internal: `mailer.isConfigured`, `getConfig`, `MailConfig`, `SendMailArgs`, `GOOGLE_*_URL`, `PREF_KEYS`, `parseTime`, `formatTime`, `generateTimeSlots`. Test boleh tetap menguji lewat API publik. Bila sebuah simbol hanya bisa diuji langsung, pertahankan `export` dan beri komentar `/** @internal exported for tests */`.

- [ ] **Step 1: Tulis test gagal** untuk perilaku yang dipindah: `profile/personal` action memakai aturan validasi `parseProfileForm`.

```ts
it('rejects an unknown blood type via parseProfileForm rules', async () =>
  expect(await act('update', { user, form: { …valid, bloodType: 'Z' } })).toMatchObject({ status: 400 }));
```

  Bila asersi ini sudah ada dan lulus, lanjut — refactor ini dijaga oleh test yang ada.
- [ ] **Step 2:** `pnpm vitest run "src/routes/(patient)/profile/personal" src/lib/server` → catat hasil.
- [ ] **Step 3:** Lakukan refactor sesuai *Produces*. Untuk simbol yang `export`-nya dihapus, ubah test yang meng-import-nya agar menguji lewat fungsi publik.
- [ ] **Step 4:** VERIFY. `pnpm check` harus memastikan tidak ada importir yang rusak.
- [ ] **Step 5: Commit** — `refactor: dedupe query builders and drop dead branches in server modules`

---

### Task 8: Performa query

**Files:**
- Modify: `src/lib/server/auth.ts` (`validateSession`), `booking.ts` (`getAllSlotsForDoctorDate`, `cancelBookingForUser`, `createBookingAtomic`), `insurance.ts` (`upsertInsurance`), `analytics.ts` (`totals`, `previousTotals`); `src/routes/login/reset/[token]/+page.server.ts`; `src/routes/(patient)/{appointments,doctors/[id],doctors/[id]/book,doctors/[id]/book/confirm,profile/personal,profile/settings/password,specialists,specialists/[slug]}/+page.server.ts`; `src/routes/find-doctor/+page.server.ts`; semua loader manager (sudah memakai `paginate` dari Task 6)
- Test: test modul/route terkait

**Interfaces (signature publik tidak berubah):**
- `validateSession(id)`: satu query join yang juga memilih `sessions.expiresAt`; sesi kedaluwarsa → `deleteSession` + `null`.
- `getAllSlotsForDoctorDate(doctorId, date)`: 1 query jadwal + 1 query `count(*)` di-`GROUP BY schedule_id, appointment_time` dengan `inArray(scheduleIds)`, status ≠ `cancelled`. Output identik.
- `confirm/+page.server.ts`: tidak lagi mengambil jadwal 2×.
- `cancelBookingForUser`: satu `UPDATE … WHERE id AND user_id AND status IN (...) RETURNING`. Hasil sama untuk booking milik orang lain / yang sudah dibatalkan.
- `createBookingAtomic`: cabang `.rows` yang mati dihapus. Hasil query `FOR UPDATE` diberi tipe eksplisit (TD-22).
- `upsertInsurance`: `insert … onConflictDoUpdate({ target: insuranceProfiles.userId })`.
- `analytics.totals` + `previousTotals`: satu query per periode dengan `count(*) filter (where …)`.
- Reset password: tandai token terpakai, set password, dan hapus sesi dalam **satu** `db.transaction`.
- Loader: query yang saling independen dijalankan dengan `Promise.all` (`doctors/[id]`, `book`, `analytics` di `manager/+page.server.ts`).
- `await parent()` yang hanya untuk mengambil `user` diganti `locals.user` (find-doctor, book, confirm, specialists, specialists/[slug]).
- `profile/personal` dan `settings/password`: hapus `getUserById`/select ulang; pakai `locals.user`. Password page tetap butuh hash: `locals.user.passwordHash` tersedia di server.
- `appointments`: hapus fallback `getAppointmentForUser` (16-19).

- [ ] **Step 1: Tulis test gagal / pengaman**

```ts
// auth.test.ts
it('validateSession deletes and rejects an expired session', async () => {
  const u = await makeUser(); const id = await createSession(u.id);
  await db.update(sessions).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(sessions.id, id));
  expect(await validateSession(id)).toBeNull();
  expect(await db.select().from(sessions).where(eq(sessions.id, id))).toHaveLength(0);
});
// booking.test.ts
it('getAllSlotsForDoctorDate counts bookings per schedule and time across several schedules', /* 2 jadwal di hari yang sama, booking di keduanya, 1 cancelled → hitungan sama seperti implementasi lama */);
// reset/page.server.test.ts
it('a reset token cannot be reused after success', async () => { /* submit 2× → kedua kali gagal dengan pesan token tidak valid yang sudah ada */ });
// insurance.test.ts
it('upsertInsurance updates the existing row instead of inserting a second', /* 2× upsert → 1 baris */);
```

- [ ] **Step 2:** Jalankan test-test itu. Test yang menguji perilaku baru harus gagal; test perilaku lama boleh langsung lulus (itu pengaman).
- [ ] **Step 3:** Implementasi sesuai *Interfaces*.
- [ ] **Step 4:** VERIFY.
- [ ] **Step 5: Commit** — `perf: single-query session check, batch slot counts, parallel loaders, atomic writes`

---

### Task 9: Index database

**Files:**
- Modify: `src/lib/server/db/schema.ts`
- Create: `drizzle/0004_*.sql`, `drizzle/meta/0004_snapshot.json`, `drizzle/meta/_journal.json` (hasil `pnpm db:generate`)
- Test: `src/lib/server/db/schema.test.ts`

**Interfaces:**
- Produces index (nama `<table>_<column>_idx`, lewati yang sudah ada di schema):
  - `sessions.user_id`
  - `doctors.hospital_id`, `doctors.specialist_id`
  - `doctor_schedules.doctor_id`
  - `bookings.doctor_id`, `bookings.created_at`
  - `payment_cards.user_id`
  - `payment_transactions.card_id`

- [ ] **Step 1: Tulis test gagal**

```ts
it('has indexes on hot foreign keys', async () => {
  const rows = await db.execute(sql`select indexname from pg_indexes where schemaname = 'public'`);
  const names = rows.rows.map((r) => r.indexname);
  for (const n of ['sessions_user_id_idx', 'doctors_hospital_id_idx', 'doctors_specialist_id_idx',
    'doctor_schedules_doctor_id_idx', 'bookings_doctor_id_idx', 'bookings_created_at_idx',
    'payment_cards_user_id_idx', 'payment_transactions_card_id_idx']) expect(names).toContain(n);
});
```

- [ ] **Step 2:** `pnpm vitest run src/lib/server/db/schema.test.ts` → FAIL.
- [ ] **Step 3:** Tambah `index()` di callback tabel di `schema.ts`, lalu `pnpm db:generate`.
- [ ] **Step 4: Periksa SQL.** `grep -vE "^(CREATE INDEX|--> statement-breakpoint|\s*$)" drizzle/0004_*.sql` → kosong (hanya `CREATE INDEX`).
- [ ] **Step 5:** Test Step 2 → PASS, lalu VERIFY dan `pnpm test:coverage`.
- [ ] **Step 6: Commit** — `perf(db): index foreign keys used in joins and filters`

---

### Task 10: Primitif UI bersama

**Files:**
- Create di `src/lib/components/ui/`: `Avatar.svelte`, `FormAlert.svelte`, `Dialog.svelte`, `BrandMark.svelte`; di `src/lib/components/layout/`: `BackHeader.svelte` (+ test `*.svelte.test.ts` per folder)
- Modify: semua salinan avatar (doctors/[id]:17-30, book:71-88, confirm:64-76, `AppointmentCard`, profile:252-264, personal:56-73, `Header`, `manager/+layout`:130-134, manager/doctors:200-204, serta kartu dokter), banner error (login ×2, forgot, reset, register, personal:82, password:238), brand mark (landing:57-64, 274-280, find-doctor:60-67), `manager/Modal.svelte` (memakai `Dialog`), 10 pemakai `SearchPageHeader` + 3 header back hand-rolled (book:45-63, confirm:29-41, doctors/[id]:10-12)
- Delete: `src/lib/components/SearchPageHeader.svelte`; `src/lib/components/Headers.svelte.test.ts` dipindah/dipecah ke `layout/`

**Interfaces:**
- `Avatar`: props `{ src?: string | null; name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; class?: string; badge?: Snippet }`. Tanpa `src` → initials dari `getInitials`. Peta `size` → kelas tinggi/lebar diambil dari salinan yang ada sekarang; tiap pemanggil memakai ukuran yang menghasilkan kelas yang sama.
- `FormAlert`: `{ kind?: 'error' | 'success' | 'info'; message: string | null | undefined }` — tidak merender apa pun bila `message` kosong. Kelas `error` = banner `rounded-xl bg-error-container …` yang sekarang.
- `Dialog`: `{ open: boolean (bindable); onclose?: () => void; title?: string; variant?: 'sheet' | 'centered'; class?: string; children: Snippet; footer?: Snippet }`. Esc dan klik backdrop menutup; id judul unik lewat `$props.id()`; `role="dialog"` + `aria-modal="true"` + `aria-labelledby`.
- `BackHeader`: `{ title: string; backHref: string; divider?: boolean; trailing?: Snippet }` — `divider` menggantikan `<div class="-mt-1 … border-b">` di 7 halaman. Avatar/profil yang dulu dirender oleh `SearchPageHeader` dikirim lewat `trailing`.
- `BrandMark`: `{ size?: 'sm' | 'md' }`.

- [ ] **Step 1: Tulis test gagal**

```ts
it('Avatar falls back to initials', () => {
  render(Avatar, { name: 'Siti Nurhaliza', src: null });
  expect(screen.getByText(getInitials('Siti Nurhaliza'))).toBeInTheDocument();
});
it('FormAlert renders nothing without a message', () => {
  const { container } = render(FormAlert, { message: '' }); expect(container.textContent).toBe('');
});
it('Dialog closes on Escape and labels itself', async () => {
  const onclose = vi.fn(); render(Dialog, { open: true, title: 'Hi', onclose, children: snip('body') });
  expect(screen.getByRole('dialog', { name: 'Hi' })).toBeInTheDocument();
  await userEvent.keyboard('{Escape}'); expect(onclose).toHaveBeenCalled();
});
it('two Dialogs get distinct title ids', /* render 2 → id aria-labelledby berbeda */);
it('BackHeader renders the divider only when asked', /* … */);
```

- [ ] **Step 2:** `pnpm vitest run src/lib/components/ui src/lib/components/layout` → FAIL.
- [ ] **Step 3:** Implementasi komponen.
- [ ] **Step 4:** Migrasikan pemanggil. Test halaman yang ada harus tetap lulus. Bila sebuah test mencari teks/role yang sekarang dirender komponen baru, perbaiki *selector*-nya, bukan nilai yang diharapkan.
- [ ] **Step 5:** VERIFY.
- [ ] **Step 6: Commit** — `refactor(ui): shared Avatar, FormAlert, Dialog, BackHeader, BrandMark`

---

### Task 11: UI CRUD manager

**Files:**
- Create: `src/lib/utils/crud.svelte.ts`, `src/lib/utils/url.ts`, `src/lib/components/manager/{DeleteConfirm,ManagerSearchForm,RowActions}.svelte` (+ test)
- Modify: `src/routes/manager/{specialists,hospitals,doctors,schedules,bookings}/+page.svelte`, `src/lib/components/manager/{Modal,PageHeader,Pagination}.svelte`, `src/routes/find-doctor/+page.svelte:34-41`

**Interfaces:**
- `createCrudState<T extends { id: string }>()` → objek runes `{ modalOpen: boolean; editing: T | null; confirmTarget: T | null; confirmOpen: boolean; openAdd(): void; openEdit(row: T): void; askDelete(row: T): void }`
- `withParams(url: URL, updates: Record<string, string | null>, opts?: { resetPage?: boolean }): string` — `null`/`''` menghapus param. `resetPage` default `true` menghapus `page`. `Pagination.hrefForPage` memakai `withParams(url, { page: String(n) }, { resetPage: false })`.
- `DeleteConfirm`: `{ open: boolean (bindable); target: { id: string; name?: string } | null; action?: string /* default '?/delete' */; title: string; message: string }` — membungkus `ConfirmDialog` dan memiliki `<form method="POST">` sendiri dengan `<input type="hidden" name="id" value={target?.id}>`. Konfirmasi memanggil `requestSubmit()` pada form itu; trik `tick()` tidak diperlukan karena `value` sudah reaktif sebelum dialog dibuka.
- `ManagerSearchForm`: `{ value: string (bindable); placeholder: string; onsubmit: (q: string) => void; filters?: Snippet }`
- `RowActions`: `{ name: string; onedit: () => void; ondelete?: () => void }` — `aria-label` tombol sama dengan yang sekarang (`Edit <name>` / `Delete <name>`; cek string persisnya di halaman).
- `Modal` mendapat props `formId?: string; submitLabel?: string; submitting?: boolean`. Bila `formId` ada, footer Cancel + submit `form={formId}` dirender oleh `Modal`.
- `PageHeader` mendapat `addLabel?: string; onadd?: () => void`.
- Kelas input form manager (`mt-1 w-full rounded-xl border border-outline-variant/50 …`, 20×) menjadi satu konstanta `MANAGER_INPUT_CLASS` di `src/lib/components/manager/styles.ts`.

- [ ] **Step 1: Tulis test gagal**

```ts
it('DeleteConfirm submits the target id', async () => {
  const submit = vi.spyOn(HTMLFormElement.prototype, 'requestSubmit').mockImplementation(function (this: HTMLFormElement) {
    expect(new FormData(this).get('id')).toBe('abc'); });
  render(DeleteConfirm, { open: true, target: { id: 'abc', name: 'X' }, title: 'Delete', message: 'Sure?' });
  await userEvent.click(screen.getByRole('button', { name: /delete/i }));
  expect(submit).toHaveBeenCalledOnce();
});
it('withParams resets page and drops empty values', () =>
  expect(withParams(new URL('http://x/m?page=3&q=a'), { q: '' })).toBe('/m'));
it('withParams keeps page when asked', () =>
  expect(withParams(new URL('http://x/m?q=a'), { page: '2' }, { resetPage: false })).toBe('/m?q=a&page=2'));
it('createCrudState openEdit sets editing and opens the modal', /* … */);
```

- [ ] **Step 2:** `pnpm vitest run src/lib/utils src/lib/components/manager` → FAIL.
- [ ] **Step 3:** Implementasi.
- [ ] **Step 4:** Migrasikan 5 halaman manager dan find-doctor. `src/routes/manager/*/page.svelte.test.ts` harus tetap lulus. Cek: `grep -rn "requestSubmit" src/routes` → kosong.
- [ ] **Step 5:** VERIFY.
- [ ] **Step 6: Commit** — `refactor(manager-ui): shared CRUD state, delete confirm, search form, row actions`

---

### Task 12: UI pasien & auth

**Files:**
- Create: `src/lib/components/doctor/{DoctorSummary,DoctorSearchForm}.svelte`, `src/lib/components/specialist/SpecialistTile.svelte`, `src/lib/components/appointment/ResultDialog.svelte`, `src/lib/components/auth/{AuthBadge,GoogleAuthButton}.svelte`, `src/lib/components/profile/LogoutButton.svelte`, `src/lib/components/settings/SettingsRow.svelte` (+ test; folder `settings/` ikut pindah ke `profile/` di Task 16)
- Modify: `src/routes/+page.svelte` (landing), `src/routes/find-doctor/+page.svelte`, `src/routes/(patient)/{home,search,specialists,specialists/[slug]}/+page.svelte`, `src/routes/{login,register,login/forgot,login/reset/[token]}/+page.svelte`, `src/routes/(patient)/profile/{+page.svelte,settings/+page.svelte,help/+page.svelte}`, the three appointment modals
- Delete: `DoctorCard.svelte`, `SpecialistDoctorCard.svelte`, `SearchResultCard.svelte`, `SpecialistChip.svelte`, `SpecialistGridCard.svelte`, `auth/AuthLogo.svelte`, `auth/AuthRegisterLogo.svelte`, `auth/AuthForgotIcon.svelte`, `settings/SettingsLinkRow.svelte`, `settings/SettingsToggleRow.svelte`

**Interfaces:**
- `DoctorSummary`: `{ doctor: DoctorListItem-like { id, name, imageUrl, specialistName, hospitalName, rating, reviewCount? }; variant: 'compact' | 'list' | 'grid'; href?: string; actions?: Snippet; trailing?: Snippet }`. Ketiga varian menghasilkan markup yang sama dengan `DoctorCard` / `SearchResultCard` / `SpecialistDoctorCard` saat ini, serta 2 salinan inline (find-doctor:141-189 = landing:192-224 → `variant: 'list'` + `actions`).
- `SpecialistTile`: `{ name: string; icon: string | null; href: string; variant: 'chip' | 'card'; active?: boolean }`
- `DoctorSearchForm`: `{ specialty: string (bindable); hospital: string (bindable); onsubmit: () => void }`. Landing dan find-doctor sama-sama memakai `goto()` dengan URL yang sama (sekarang landing memakai `window.location`; URL tujuan tidak berubah).
- `ResultDialog`: `{ open: boolean (bindable); tone: 'success' | 'danger'; title: string; icon: Snippet; body: Snippet; actions: Snippet; onclose?: () => void }` di atas `Dialog` (Task 10). Ketiga modal appointment menjadi pembungkus tipis. Prop `open` yang selalu `true` dihapus dari `CancelAppointmentModal`/`AppointmentCancelledModal`; halaman appointments memakai `bind:open`, bukan `{#if}`.
- `AuthBadge`: `{ variant: 'logo' | 'register' | 'reset' }`
- `GoogleAuthButton`: `{ href: string; enabled: boolean; label: string }` (SVG Google satu salinan)
- Field input berikon di register/forgot/reset memakai `FormIconField.svelte` yang sudah ada di `components/forms/` (dipindah ke `ui/` di Task 16).
- `SettingsRow`: `{ icon: Component; label: string; divider?: boolean; href?: string; trailing?: Snippet; onclick?: () => void }` menggantikan LinkRow/ToggleRow. Memperbaiki `<div>` di dalam `<button>`: elemen di dalam memakai `<span>`.
- `LogoutButton`: `{ label?: string }` — form `POST ?/logout` (dipakai profile dan settings).
- `help/+page.svelte:24-31`: timer notice manual diganti `toast.info(...)` dari `stores/toast.svelte.ts` dengan teks yang sama.

- [ ] **Step 1: Tulis test gagal** — satu test render per komponen baru dengan asersi yang diambil dari test komponen lama (`Cards.svelte.test.ts`, `AuthIcons.svelte.test.ts`, `Settings.svelte.test.ts`, `AppointmentModals.svelte.test.ts`), plus:

```ts
it('SettingsRow renders no block element inside its button', () => {
  const { container } = render(SettingsRow, { icon: Bell, label: 'Push', onclick: () => {} });
  expect(container.querySelector('button div')).toBeNull();
});
it('GoogleAuthButton is disabled with a hint when not configured', /* teks hint sama dengan login saat ini */);
```

- [ ] **Step 2:** `pnpm vitest run src/lib/components` → FAIL.
- [ ] **Step 3:** Implementasi.
- [ ] **Step 4:** Migrasikan halaman, hapus komponen lama beserta test yang asersinya sudah dipindah. `pnpm vitest run src/routes` harus lulus.
- [ ] **Step 5:** VERIFY.
- [ ] **Step 6: Commit** — `refactor(ui): merge doctor/specialist cards, auth widgets, settings rows, result dialogs`

---

### Task 13: Reaktivitas & performa render

**Files:**
- Create: `src/lib/components/manager/dashboard/{FilterBar,StatCard,ChartCard,RecentBookings}.svelte`
- Modify: `src/routes/manager/+page.svelte`, `src/routes/manager/{hospitals,specialists,doctors,schedules,bookings}/+page.svelte`, `src/routes/find-doctor/+page.svelte`, `src/routes/(patient)/{profile/personal,doctors/[id]/book,search,appointments,home,doctors/[id]}/+page.svelte`, `src/routes/+page.svelte`, `src/lib/components/charts/AreaChart.svelte`

**Interfaces / aturan:**
- `$effect.pre(() => { x = data.y })` menjadi writable derived `let x = $derived(data.y)` di 9 lokasi: hospitals:22, specialists:22, doctors:24, schedules:24, bookings:23, find-doctor:22, personal:29, book:21, search:17.
- `search:23-27`: mutasi store dari `data.openFilter` dipindah ke `$effect.pre` dengan guard agar hanya jalan saat nilainya berubah.
- `appointments:342-351`: satu `$derived.by` yang mempartisi upcoming/past sekali jalan.
- Semua `{#each}` atas data server diberi key `(item.id)`: home:65,81; doctors/[id]:53; manager/doctors:139,150,310,324; schedules:135,269; manager/+page:195,224; landing:191,251.
- Array literal di dalam markup (`manager/+page.svelte:155`, landing:155) dipindah ke konstanta modul.
- `AreaChart`: titik `xPos`/`toFixed` dihitung sekali dalam `$derived`.
- `manager/+page.svelte` dipecah menjadi 4 komponen dashboard (target ≤ 250 baris). Dashboard memakai `STATUS_CLASS.badge` dari Task 4.

- [ ] **Step 1: Tulis test gagal**

```ts
// manager/page.svelte.test.ts
it('updates the search input when navigation brings a new query', async () => {
  const { rerender } = render(Page, { data: { ...base, query: 'a' } });
  await rerender({ data: { ...base, query: 'b' } });
  expect(screen.getByRole('searchbox')).toHaveValue('b');
});
```

  Tambahkan test ini untuk satu halaman manager dan halaman search. Ini mengunci perilaku sinkronisasi yang sebelumnya dikerjakan `$effect.pre`. Test kemungkinan sudah lulus sekarang; tujuannya sebagai pengaman.
- [ ] **Step 2:** Jalankan → PASS (pengaman).
- [ ] **Step 3:** Terapkan aturan di atas.
- [ ] **Step 4:** VERIFY dan `pnpm test:coverage`. Cek: `grep -rn "\$effect.pre" src/routes` → hanya search (store sync).
- [ ] **Step 5: Commit** — `perf(ui): derived state, keyed each blocks, split manager dashboard`

---

### Task 14: Sapu bersih kode mati yang tersisa

**Files:**
- Modify: `src/lib/components/charts/{AreaChart,BarChart,DonutChart}.svelte`, `SpecialtyAutocomplete.svelte`, `settings/SettingsToggle.svelte`, `src/lib/stores/search.ts`, `src/lib/stores/toast.svelte.ts`, `src/lib/utils/booking-ui.ts`, `src/routes/(patient)/+layout.svelte:294-296`, `scripts/seed.ts`
- Test: test terkait + `src/lib/stores/search.test.ts`

**Interfaces / aturan:**
- Hapus props yang tidak pernah dikirim pemanggil: AreaChart `height`/`showXAxis`, BarChart `maxRows`, DonutChart `size`/`thickness`, SpecialtyAutocomplete `inputId`, SettingsToggle `disabled`. Nilai default-nya menjadi konstanta internal sehingga render tidak berubah.
- Hapus `export` dari simbol yang hanya dipakai di file sendiri: `doctorPrice`, `SearchFilters`, `CalendarDay`, `Toast`. `DoctorSearchResult` menjadi `Omit<DoctorListItem, 'consultationFee'>`.
- `(patient)/+layout.svelte:294-296`: cek `/login` dan `/register` yang tak mungkin terjadi dihapus.
- `resetStores` di helper test memakai `defaultSearchFilters`, bukan literal `[50, 250]`.
- `scripts/seed.ts`: pakai `hashPassword` dari `auth`, bukan opsi argon2 salinan; pakai `toLocalDateString` sebagai ganti `toISOString().slice(0,10)`.
- Akhiri dengan pemeriksaan otomatis (Step 4).

- [ ] **Step 1: Tulis test gagal**

```ts
// search.test.ts
it('hydrates bookmarks persisted by the previous version', async () => {
  localStorage.setItem('emerald-search', JSON.stringify({ state: { bookmarks: ['d1'], filters: {/* bentuk lama */} }, version: 0 }));
  await useSearchStore.persist.rehydrate();
  expect(useSearchStore.getState().bookmarks).toEqual(['d1']);
});
```

- [ ] **Step 2:** Jalankan → PASS sebelum perubahan (pengaman), dan harus tetap PASS sesudahnya.
- [ ] **Step 3:** Terapkan aturan di atas.
- [ ] **Step 4: Cek export tak terpakai.** Simpan script berikut ke scratchpad (bukan ke repo) lalu jalankan dengan `node <path>` dari root repo:

```js
// Untuk setiap `export (const|function|type|interface|class) X` di src/lib/**/*.ts (bukan test/routes),
// laporkan X yang tidak muncul di file non-test lain mana pun. Pakai satu regex gabungan per file
// (bukan satu regex per nama) supaya selesai < 10 detik.
```

  Expected: daftar kosong, atau hanya simbol bertanda `@internal exported for tests` (Task 7).
- [ ] **Step 5:** VERIFY.
- [ ] **Step 6: Commit** — `chore: remove unused props, exports and stale helpers`

---

### Task 15: Struktur folder `lib/server`

**Files:**
- Move (`git mv`, lihat *File Structure*):
  - `auth.ts` → `auth/session.ts`
  - `guards.ts`, `oauth-google.ts`, `password-reset.ts` → `auth/`
  - `db-errors.ts` → `db/errors.ts`
  - `pagination.ts` → `http/`
  - `catalog.ts`, `doctors.ts` → `catalog/`
  - `booking.ts`, `analytics.ts` → `booking/`
  - `users.ts`, `insurance.ts`, `payments.ts`, `medical-records.ts`, `preferences.ts` → `patient/`
  - Test `*.test.ts` ikut pindah bersama modulnya.
- Modify: semua import (`src/**`, `scripts/seed.ts`, `src/app.d.ts`, `src/test/setup-server.ts`, `vitest.config.ts` bila ada path mock)

**Interfaces:** hanya path yang berubah; tidak ada simbol yang berubah.

- [ ] **Step 1:** `git mv` sesuai daftar.
- [ ] **Step 2:** Perbarui import secara mekanis (contoh: `sed -i "s#\#lib/server/auth.ts#\#lib/server/auth/session.ts#g"`), satu pasangan path per perintah. Import relatif di dalam `lib/server` (`'./db'`, `'./db/schema'`) diubah ke `#lib/server/db/index.ts` dkk.
- [ ] **Step 3:** `grep -rnE "#lib/server/(auth|guards|oauth-google|password-reset|db-errors|pagination|catalog|doctors|booking|analytics|users|insurance|payments|medical-records|preferences)\.ts" src scripts` → kosong.
- [ ] **Step 4:** VERIFY.
- [ ] **Step 5: Commit** — `refactor: group lib/server modules by domain (moves only)`

---

### Task 16: Struktur folder `components` & `lib`

**Files:**
- Move (`git mv`):
  - `manager/{Modal,ConfirmDialog,EmptyState,Pagination,StatusBadge}.svelte`, `Toaster.svelte`, `forms/FormIconField.svelte` → `components/ui/`
  - `Header`, `BottomNav`, `SearchBar` → `components/layout/`
  - `SpecialtyAutocomplete`, `FilterOptionsModal` → `components/doctor/`
  - `AppointmentCard` + 3 modal appointment → `components/appointment/`
  - `ProfileMenuItem`, `HelpContactCard`, folder `settings/`, `insurance/`, `payment/`, `medical-records/` → `components/profile/`
  - `charts/` → `components/manager/charts/`
  - `src/lib/utils.ts`: `cn` → `src/lib/utils/cn.ts` (`DAY_NAMES` dan `formatDateId` sudah pindah di Task 3), lalu hapus `utils.ts`
  - Test `*.svelte.test.ts` gabungan dipecah dan diletakkan di samping komponennya: `Cards`, `Headers`, `Manager`, `Insurance`, `Payment`, `Settings`, `AppointmentModals`, `utils/misc.test.ts` (dipecah per modul)
- Modify: semua import.

**Interfaces:** hanya path yang berubah.

- [ ] **Step 1:** `git mv` sesuai daftar.
- [ ] **Step 2:** Perbarui import secara mekanis; `Toaster` di `src/routes/+layout.svelte:4` diseragamkan ke kutip tunggal.
- [ ] **Step 3:** `find src/lib/components -maxdepth 1 -name "*.svelte"` → kosong (semua komponen ada di subfolder fitur). `test -f src/lib/utils.ts` → tidak ada.
- [ ] **Step 4:** VERIFY.
- [ ] **Step 5: Commit** — `refactor: group components by feature and split combined tests (moves only)`

---

### Task 17: Konsolidasi helper test

**Files:**
- Create: `src/test/helpers/route.ts`, `src/test/helpers/component.ts`
- Delete: `src/test/helpers-{components,pages-manager,pages-public,routes-manager,routes-public}.ts`
- Modify: `package.json` `imports` (tambah `"#test/*": "./src/test/*"`); semua test yang meng-import helper; 5 test manager yang mendefinisikan `ev` lokal; `lib/server/guards.test.ts:7` (`thrown` lokal); `preferences.test.ts:7`; 35 pemanggilan `resetDb(db as unknown as TestDb)`

**Interfaces:**
- `helpers/route.ts`: `ev<T = any>(opts?): T` (gabungan dua versi; tanpa argumen generik perilakunya sama dengan versi publik yang mengembalikan `any`), `thrown`, `reset(): Promise<void>`, `nonManagers()`, `UNKNOWN_ID`, `MONDAY`, `TUESDAY`, `randomId`, `ActionResult`
- `helpers/component.ts`: `snip` (gabungan `snip` + `childrenSnippet`), `resetStores`, serta isi `helpers-pages-*` lainnya
- Re-export `makeManager` dari helper manager dihapus; importir memakai `#test/factories.ts`.

- [ ] **Step 1:** Buat dua file helper baru (isi dipindah, bukan ditulis ulang), dan tambahkan alias `#test/*`.
- [ ] **Step 2:** Ganti semua import `../../test/helpers-*.ts` dan `../../../test/...` dengan `#test/helpers/route.ts` dsb. Hapus `ev`/`thrown` lokal dan ganti `resetDb(db as unknown as TestDb)` dengan `reset()`.
- [ ] **Step 3:** Cek: `grep -rn "helpers-\(routes\|pages\|components\)" src` → kosong; `grep -rn "resetDb(db as unknown" src | grep -v "src/test/"` → kosong; `grep -rn "\.\./test/" src` → kosong.
- [ ] **Step 4:** VERIFY.
- [ ] **Step 5: Commit** — `test: consolidate helpers under src/test/helpers with #test alias`

---

### Task 18: Dokumentasi

**Files:**
- Modify: `docs/ARCHITECTURE.MD` §3 (struktur folder) dan §4 (konvensi: `lib/format`, `lib/domain`, `server/http` helpers, `requireUser`), `docs/UI_COMPONENT.MD` (daftar komponen baru/terhapus), `docs/TECHDEBT.MD`, `docs/TESTING.MD` (helper `#test/*`)

**Interfaces:** —

- [ ] **Step 1:** Perbarui `ARCHITECTURE.MD` agar sesuai struktur hasil `find src/lib -type d`.
- [ ] **Step 2:** Di `TECHDEBT.MD`, pindahkan ke *Resolved* dengan hash commit masing-masing: TD-06 (Task 5), TD-08 (Task 8), TD-11 (Task 1), TD-17 (Task 1), TD-21 (Task 6), TD-22 (Task 8). Tambahkan item baru untuk keputusan di luar scope bila ada (mis. bahasa campuran `DAY_NAMES`/`longId`).
- [ ] **Step 3:** Jalankan VERIFY dan `pnpm test:coverage` sebagai gerbang akhir.
- [ ] **Step 4: Commit** — `docs: update architecture, components, testing and tech-debt after refactor`
