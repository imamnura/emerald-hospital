<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		ArrowLeft,
		ArrowRight,
		BadgeCheck,
		Calendar,
		MapPin,
		Stethoscope
	} from '@lucide/svelte';
	import { formatAppointmentDateLong } from '#lib/utils/booking-ui.ts';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';

	let { data, form } = $props();

	const backHref = $derived(
		`/doctors/${data.doctor.id}/book?date=${data.appointment.date}`
	);
	const dateTimeLabel = $derived(
		`${formatAppointmentDateLong(data.appointment.date)} at ${data.appointment.timeLabel}`
	);
	const feeFormatted = $derived(
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
			data.doctor.fee
		)
	);
</script>

<header
	class="-mx-5 flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-lowest px-5 py-3"
>
	<a
		href={backHref}
		class="flex h-10 w-10 items-center justify-center rounded-full text-primary"
		aria-label="Back"
	>
		<ArrowLeft size={22} />
	</a>
	<h1 class="font-heading text-base font-bold text-primary">Confirm Appointment</h1>
	<div class="w-10" aria-hidden="true"></div>
</header>

<MotionReveal delay={50}>
<section class="mt-8 text-center">
	<div
		class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-primary"
	>
		<BadgeCheck size={32} strokeWidth={2.5} />
	</div>
	<h2 class="mt-4 font-heading text-xl font-bold text-on-surface">Review Details</h2>
	<p class="mx-auto mt-2 max-w-xs text-sm text-outline">
		Please review your appointment details before final confirmation.
	</p>
</section>

{#if form?.error}
	<p class="mt-4 rounded-xl bg-error-container px-4 py-3 text-sm text-error">{form.error}</p>
{/if}

<!-- Doctor card -->
<article
	class="mt-8 flex items-center gap-3 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)]"
>
	{#if data.doctor.imageUrl}
		<img
			src={data.doctor.imageUrl}
			alt={data.doctor.name}
			class="h-14 w-14 shrink-0 rounded-full object-cover"
		/>
	{:else}
		<div
			class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-container text-lg font-bold text-primary"
		>
			{data.doctor.name.charAt(0)}
		</div>
	{/if}
	<div>
		<p class="font-heading font-bold text-on-surface">{data.doctor.name}</p>
		<p class="text-sm font-semibold text-primary">{data.doctor.role}</p>
	</div>
</article>

<!-- Appointment details -->
<article
	class="mt-4 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)]"
>
	<div class="flex gap-3 border-b border-outline-variant/20 pb-4">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
		>
			<Calendar size={20} />
		</div>
		<div>
			<p class="text-xs font-medium text-outline">Date & Time</p>
			<p class="mt-0.5 text-sm font-semibold text-on-surface">{dateTimeLabel}</p>
		</div>
	</div>

	<div class="flex gap-3 border-b border-outline-variant/20 py-4">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
		>
			<MapPin size={20} />
		</div>
		<div>
			<p class="text-xs font-medium text-outline">Location</p>
			<p class="mt-0.5 text-sm font-semibold text-on-surface">{data.doctor.hospital}</p>
			<p class="text-sm text-on-surface-variant">{data.doctor.locationLine2}</p>
		</div>
	</div>

	<div class="flex gap-3 pt-4">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
		>
			<Stethoscope size={20} />
		</div>
		<div>
			<p class="text-xs font-medium text-outline">Type</p>
			<p class="mt-0.5 text-sm font-semibold text-on-surface">{data.appointment.visitType}</p>
		</div>
	</div>
</article>

<!-- Fee -->
<article
	class="mt-4 flex items-center justify-between rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)]"
>
	<div>
		<p class="text-sm font-semibold text-on-surface">Consultation Fee</p>
		<p class="text-xs text-outline">To be paid at clinic.</p>
	</div>
	<p class="font-heading text-lg font-bold text-on-surface">{feeFormatted}</p>
</article>
</MotionReveal>

<!-- Footer -->
<div
	class="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-outline-variant/30 bg-surface-container-lowest px-5 py-4"
>
	<form method="POST" use:enhance>
		<input type="hidden" name="scheduleId" value={data.appointment.scheduleId} />
		<input type="hidden" name="appointmentDate" value={data.appointment.date} />
		<input type="hidden" name="appointmentTime" value={data.appointment.time} />

		<button
			type="submit"
			class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-on-primary shadow-primary active:scale-[0.98]"
		>
			Confirm & Complete
			<ArrowRight size={18} />
		</button>
	</form>
</div>

<div class="h-24" aria-hidden="true"></div>
