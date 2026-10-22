# UI Components

> Part of the [Purwakarta Health docs](./DEVELOPMENT_STATUS.md). Last verified against code: 2026-10-22.

All components are Svelte 5 with runes (`$props`, `$state`, `$bindable`). They live in `src/lib/components/`. Icons come from `@lucide/svelte`. Class merging uses `cn()` from `src/lib/utils.ts`.

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

### 2.1 Shared / patient

| Component | Props | Used for |
| --------- | ----- | -------- |
| `Header` | `userName?`, `userImage?`, `showSearch?`, `showNotification?`, `leadingIcon?` | In-app header with logo and brand |
| `BottomNav` | — | Patient mobile tab bar (in `(patient)/+layout.svelte`) |
| `SearchBar` | `value?`, `placeholder?`, `name?`, `showClear?`, `rounded?`, `onClear?`, `oninput?` | Search inputs |
| `SearchPageHeader` | `title?`, `backHref?`, `userName?`, `userImage?`, `showProfile?` | Header with back button |
| `SpecialtyAutocomplete` | `value` (bindable), `placeholder?`, `class?`, `inputId?` | Debounced specialty combobox (landing + `/find-doctor`) |
| `FilterOptionsModal` | `specialists`, `query`, `onShowResults` | Rating / price / availability / specialty filters (Zustand) |
| `DoctorCard` | `id`, `name`, `specialty`, `hospital`, `imageUrl?`, `rating?`, `isOnline?` | Doctor tiles |
| `SearchResultCard` | `id`, `name`, `specialty`, `hospital`, `imageUrl?`, `rating?`, `reviewCount?`, `bookmarked?`, `onBookmark?` | Search results with bookmark |
| `SpecialistChip` | `name`, `icon?`, `active?`, `href?` | Horizontal specialty filter chips |
| `SpecialistGridCard` | `name`, `slug`, `icon?` | Specialty grid on `/specialists` |
| `SpecialistDoctorCard` | `id`, `name`, `role`, `hospital`, `imageUrl?`, `rating?`, `reviewCount?` | Doctor list inside a specialty |
| `AppointmentCard` | `doctorId`, `doctorName`, `doctorImage`, `specialty`, `rating`, `hospital`, `appointmentDate`, `appointmentTime`, `status`, `showActions?`, `index?`, `onCancel?` | `/appointments` list |
| `AppointmentConfirmedModal` | `open`, `doctorName`, `appointmentDate`, `appointmentTime`, `onClose` | Shown after `?booked=` |
| `CancelAppointmentModal` | `open`, `bookingId`, `doctorName`, `appointmentDate`, `onClose`, `onCancelled` | Confirms `?/cancel` |
| `AppointmentCancelledModal` | `open`, `doctorName`, `appointmentDate`, `onBackToAppointments`, `onBookNew` | Post-cancel feedback |
| `ProfileMenuItem` | `href`, `label`, `icon` | Profile menu rows |
| `HelpContactCard` | `title`, `description`, `icon`, `onclick?` | Help & support contacts |
| `Toaster` | — | Global toast outlet (root layout), fed by `stores/toast.svelte.ts` |

### 2.2 Feature folders

| Folder | Components |
| ------ | ---------- |
| `auth/` | `AuthLogo`, `AuthRegisterLogo`, `AuthForgotIcon` — decorative, no props |
| `forms/` | `FormIconField` (`id`, `label`, `icon`, `name?`, `value?`, `type?`, `placeholder?`, `required?`, `disabled?`, `readonly?`, `trailing?`) |
| `insurance/` | `InsuranceCoverageCard` (`insurance`), `CostDetailCard` (`label`, `amount`, `icon`), `CoveragePeriodCard` (`period`, `status`) |
| `medical-records/` | `MedicalRecordCard` (`record`) |
| `payment/` | `SavedPaymentCard` (`card`, `onDelete?`, `onSetDefault?`), `PaymentTransactionRow` (`transaction`), `CardBrandBadge` (`brand`) |
| `settings/` | `SettingsCard`, `SettingsSection` (`title`), `SettingsLinkRow` (`href`, `label`, `icon`, `value?`, `showDivider?`), `SettingsToggleRow` (`label`, `checked`, `icon`, `showDivider?`), `SettingsToggle` (`checked`, `ariaLabel`, `disabled?`) |
| `motion/` | `PageEnter` (`pageKey`, children) for route transitions, `MotionReveal` (`delay?`, `class?`, children) for reveal-on-scroll |

### 2.3 Manager

Use these on every new manager page for visual consistency.

| Component | Props | Notes |
| --------- | ----- | ----- |
| `PageHeader` | `title`, `subtitle?`, `count?`, `countLabel?`, `actions?` (snippet) | Page title + primary action button |
| `Modal` | `open` (bindable), `title`, `description?`, `size?`, `onClose?`, `children`, `footer?` | Create/edit forms |
| `ConfirmDialog` | `open` (bindable), `message`, `onConfirm`, `title?`, `confirmLabel?`, `cancelLabel?`, `danger?`, `loading?`, `onCancel?` | Built on `Modal`. Drives a hidden `?/delete` form. |
| `Pagination` | `page`, `pageSize`, `total`, `label?` | URL-driven (`?page=&pageSize=`) |
| `StatusBadge` | `status` | Booking status pill |
| `EmptyState` | `title`, `description?`, `icon?` | Empty lists |

### 2.4 Charts (pure SVG, no library)

| Component | Props | Dashboard use |
| --------- | ----- | ------------- |
| `AreaChart` | `data`, `height?`, `showXAxis?` | Bookings over time |
| `DonutChart` | `data`, `size?`, `thickness?`, `centerLabel?` | Status breakdown |
| `BarChart` | `data`, `valueLabel?`, `maxRows?` | Bookings by specialty |

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
