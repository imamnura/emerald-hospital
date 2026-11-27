# UI Components

> Part of the [Purwakarta Health docs](./DEVELOPMENT_STATUS.md). Last verified against code: 2026-11-26.

All components are Svelte 5 with runes (`$props`, `$state`, `$bindable`). They live in `src/lib/components/`. Icons come from `@lucide/svelte`. Class merging uses `cn()` from `src/lib/utils/cn.ts`.

## 1. Design tokens

Defined with Tailwind 4 `@theme` in `src/app.css`. Use the generated utilities (`bg-primary`, `text-on-surface-variant`, `rounded-xl`, `shadow-card`, …) instead of raw hex values.

| Group | Tokens |
| ----- | ------ |
| Fonts | `--font-heading` (Manrope), `--font-body` (Inter). `h1`–`h4` use the heading font. |
| Surface | `surface` `#f6fbf5`, `surface-dim`, `surface-container-lowest` `#fff`, `surface-container-low`, `surface-container` |
| Text | `on-surface` `#181d1a`, `on-surface-variant` `#3e4943` |
| Outline | `outline` `#6e7a73`, `outline-variant` `#bdc9c1` |
| Brand | `primary` `#005d42`, `on-primary`, `primary-container` `#047857`, `on-primary-container` |
| Error | `error` `#ba1a1a`, `error-container` |
| Radius | `sm` 0.25rem · `md` 0.75rem · `lg` 1rem · `xl` 1.5rem · `full` |
| Shadow | `shadow-card`, `shadow-primary` |

- Light theme only. There is no dark palette yet.
- `prefers-reduced-motion: reduce` disables animations and transitions globally.
- `.scrollbar-hide` utility for horizontal chip rows.

## 2. Component inventory

Components are grouped by feature under `src/lib/components/<folder>/`, and each has a co-located `<Name>.svelte.test.ts`. Import with the extension, e.g. `#lib/components/ui/Dialog.svelte`. Props marked `?` are optional.

### 2.1 `ui/` (shared primitives)

| Component | Props | Purpose |
| --------- | ----- | ------- |
| `Avatar` | `src?`, `name`, `size?` (`sm`/`md`/`lg`/`xl`), `class?`, `fallbackClass?`, `wrapperClass?`, `initials?`, `badge?` (snippet) | Image with an initials fallback; optional badge wrapper |
| `BrandMark` | `size?` (`sm`/`md`) | Logo icon with wordmark |
| `Dialog` | `open`, `onclose?`, `title?`, `description?`, `labelledby?`, `variant?` (`sheet`/`centered`), `class?`, `overlayClass?`, `panelClass?`, `bodyClass?`, `motion?`, `children`, `footer?` | Base dialog (backdrop, panel, Escape). `Modal` and `ResultDialog` build on it |
| `Modal` | `open`, `title`, `description?`, `size?`, `onClose?`, `children`, `footer?`, `formId?`, `submitLabel?`, `submitting?` | Manager create / edit form modal; with `formId` it renders the Cancel + submit footer |
| `ConfirmDialog` | `open`, `title?`, `message`, `confirmLabel?`, `cancelLabel?`, `danger?`, `loading?`, `onConfirm`, `onCancel?` | Confirm / cancel prompt |
| `FormAlert` | `kind?` (`error`/`success`/`info`), `message`, `class?` | Inline form message; renders nothing for an empty message |
| `FormIconField` | `id`, `label`, `name?`, `value?`, `type?`, `placeholder?`, `required?`, `disabled?`, `readonly?`, `icon`, `trailing?` | Labelled input with a leading icon snippet |
| `Pagination` | `page`, `pageSize`, `total`, `label?` | URL-driven (`?page=&pageSize=`) |
| `StatusBadge` | `status` | Booking status pill (classes from `lib/domain/booking-status.ts`) |
| `EmptyState` | `title`, `description?`, `icon?` | Empty lists |
| `Toaster` | none | Global toast outlet (root layout), fed by `stores/toast.svelte.ts` |

### 2.2 `layout/`

| Component | Props | Purpose |
| --------- | ----- | ------- |
| `Header` | `userName?`, `userImage?`, `showSearch?`, `showNotification?`, `leadingIcon?` (`avatar`/`user`) | In-app header with logo and brand |
| `BackHeader` | `title`, `backHref`, `divider?`, `dividerClass?`, `trailing?` | Page header with a back link; a spacer is rendered when `trailing` is omitted |
| `BottomNav` | none | Patient mobile tab bar (in `(patient)/+layout.svelte`) |
| `SearchBar` | `value?`, `placeholder?`, `name?`, `showClear?`, `rounded?` (`full`/`2xl`), `onClear?`, `oninput?` | Search input |

### 2.3 `auth/`

| Component | Props | Purpose |
| --------- | ----- | ------- |
| `AuthBadge` | `variant` (`logo`/`register`/`reset`) | Decorative badge on login, register and forgot / reset pages |
| `GoogleAuthButton` | `href`, `enabled`, `label`, `class?`, `enabledClass?`, `animateIn?` | "Continue with Google" link; disabled state when OAuth is not configured |

### 2.4 `doctor/` and `specialist/`

| Component | Props | Purpose |
| --------- | ----- | ------- |
| `DoctorSummary` | `doctor` (`DoctorSummaryData`), `variant` (`compact`/`search`/`list`/`grid`), `href?`, `actions?`, `trailing?` | The single doctor card: home tile, search result (bookmark via `trailing`), list row (`actions`) and specialist grid card |
| `DoctorSearchForm` | `specialty`, `hospital`, `onsubmit`, `class?` | Specialty + hospital search form (landing and `/find-doctor`) |
| `SpecialtyAutocomplete` | `value` (bindable), `placeholder?`, `class?` | Debounced specialty combobox (ARIA listbox, up/down/Enter/Esc) |
| `FilterOptionsModal` | `specialists`, `query`, `onShowResults` | Rating / price / availability / specialty filters (Zustand) |
| `SpecialistTile` | `name`, `icon`, `href`, `variant` (`chip`/`card`), `active?` | Specialty chip (home) or grid card (`/specialists`) |

### 2.5 `appointment/`

| Component | Props | Purpose |
| --------- | ----- | ------- |
| `AppointmentCard` | `doctorId`, `doctorName`, `doctorImage`, `specialty`, `rating`, `hospital`, `appointmentDate`, `appointmentTime`, `status`, `showActions?`, `index?`, `onCancel?` | `/appointments` list item |
| `ResultDialog` | `open`, `tone` (`success`/`danger`), `title`, `icon`, `body`, `actions`, `onclose?`, `large?`, `showClose?`, `blur?`, `motion?` | Shared shell for the confirmed / cancelled dialogs |
| `AppointmentConfirmedModal` | `open`, `doctorName`, `appointmentDate`, `appointmentTime`, `onClose` | Shown after `?booked=` |
| `CancelAppointmentModal` | `open`, `bookingId`, `doctorName`, `appointmentDate`, `onClose`, `onCancelled` | Confirms `?/cancel` |
| `AppointmentCancelledModal` | `open`, `doctorName`, `appointmentDate`, `onBackToAppointments`, `onBookNew` | Post-cancel feedback |

### 2.6 `profile/`

| Component | Props | Purpose |
| --------- | ----- | ------- |
| `ProfileLink` | `imageUrl?`, `name` | Avatar link to the profile page |
| `ProfileMenuItem` | `href`, `label`, `icon` | Profile menu row |
| `HelpContactCard` | `title`, `description`, `icon`, `onclick?` | Help & support contact |
| `LogoutButton` | `label?`, `class?` | Logout form button |
| `insurance/InsuranceCoverageCard` | `insurance` | Coverage summary |
| `insurance/CostDetailCard` | `label`, `amount`, `icon` | One cost line |
| `insurance/CoveragePeriodCard` | `period`, `status` | Coverage period + status |
| `medical-records/MedicalRecordCard` | `record` | One lab / imaging / clinical record |
| `payment/SavedPaymentCard` | `card`, `onDelete?`, `onSetDefault?` | Saved card with actions |
| `payment/PaymentTransactionRow` | `transaction` | Payment history row |
| `payment/CardBrandBadge` | `brand` | Visa / Mastercard badge |
| `settings/SettingsCard` | `children` | Card container for settings rows |
| `settings/SettingsSection` | `title`, `children` | Titled settings group |
| `settings/SettingsRow` | `icon`, `label`, `divider?`, `href?`, `trailing?`, `onclick?` | Link row (`href`), button row (`onclick`) or submit row |
| `settings/SettingsToggle` | `checked`, `ariaLabel` | Switch shown in the `trailing` slot of a `SettingsRow` |

### 2.7 `manager/`

Use these on every new manager page for visual consistency.

| Component | Props | Purpose |
| --------- | ----- | ------- |
| `PageHeader` | `title`, `subtitle?`, `count?`, `countLabel?`, `actions?`, `addLabel?`, `onadd?` | Page title + primary "add" button |
| `ManagerSearchForm` | `value`, `placeholder`, `onsubmit`, `filters?`, `class?` | Search box (+ optional extra filter controls) |
| `RowActions` | `name`, `onedit`, `ondelete?` | Edit / delete buttons for a table row |
| `DeleteConfirm` | `open`, `target`, `action?`, `title`, `message`, `successMessage?`, `failureMessage?`, `onclose?` | `ConfirmDialog` wired to a `?/delete` form with toasts |
| `DoctorFormFields` | `editing`, `hospitals`, `specialists` | Doctor create / edit fields |
| `BookingStatusFields` | `booking`, `status` | Booking status edit fields |
| `dashboard/StatCard` | `icon`, `label`, `value`, `trend`, `hint` | KPI tile with trend |
| `dashboard/ChartCard` | `class?`, `children` | Chart container |
| `dashboard/FilterBar` | `filters`, `hospitals`, `specialists` | Range / hospital / specialty filters (URL-driven) |
| `dashboard/RecentBookings` | `recent` | Recent bookings list |
| `charts/AreaChart` | `data` | Bookings over time (pure SVG) |
| `charts/DonutChart` | `data`, `centerLabel?` | Status breakdown (pure SVG) |
| `charts/BarChart` | `data`, `valueLabel?` | Bookings by specialty (pure SVG) |

### 2.8 `motion/`

| Component | Props | Purpose |
| --------- | ----- | ------- |
| `PageEnter` | `pageKey`, `children` | Route transition wrapper |
| `MotionReveal` | `delay?`, `class?`, `children` | Reveal-on-scroll |

## 3. Layout shells

| Shell | File | Notes |
| ----- | ---- | ----- |
| Root | `src/routes/+layout.svelte` | `<head>` (favicon, title), `Toaster` |
| Patient | `src/routes/(patient)/+layout.svelte` | Mobile-first, `BottomNav`, `PageEnter` transitions |
| Manager | `src/routes/manager/+layout.svelte` | Desktop sidebar + mobile drawer, logout form posting to `/profile?/logout` |

## 4. Conventions

- **Props:** declare an `interface Props` and destructure with `$props()`. Use `$bindable()` only for `open` / `value` style two-way props.
- **Callbacks:** use `onX` function props (`onClose`, `onConfirm`), not `createEventDispatcher`.
- **Composition:** use snippets (`children`, `footer`, `actions`) instead of slots.
- **Forms:** `<form method="POST" action="?/x" use:enhance={toastForm(...)}>` so success and error states show as toasts.
- **Accessibility:** `SpecialtyAutocomplete` implements the ARIA combobox/listbox pattern with ↑/↓/Enter/Esc. Other modals have not been audited for focus trapping (see [TECHDEBT.MD](./TECHDEBT.MD)).
- **Images:** doctor and hospital images are external URLs from the DB. There is no upload pipeline.

## 5. Gaps

- No Storybook or visual regression setup for these components.
- No dark mode tokens.
- Error and 404 pages use the SvelteKit defaults, not branded.
- Strings are hardcoded (mixed English / Indonesian). There is no i18n layer.
