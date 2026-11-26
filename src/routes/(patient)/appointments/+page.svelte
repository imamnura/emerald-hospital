<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';
	import { Calendar } from '@lucide/svelte';
	import AppointmentCard from '#lib/components/appointment/AppointmentCard.svelte';
	import AppointmentConfirmedModal from '#lib/components/appointment/AppointmentConfirmedModal.svelte';
	import CancelAppointmentModal from '#lib/components/appointment/CancelAppointmentModal.svelte';
	import AppointmentCancelledModal from '#lib/components/appointment/AppointmentCancelledModal.svelte';
	import Header from '#lib/components/layout/Header.svelte';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';
	import {
		isUpcomingAppointment,
		type AppointmentTab
	} from '#lib/utils/appointments.ts';
	import { cn } from '#lib/utils/cn.ts';

	let { data } = $props();

	let activeTab = $state<AppointmentTab>('upcoming');
	let confirmedDismissed = $state(false);
	const showConfirmed = $derived(!!data.confirmedBooking && !confirmedDismissed);
	// Closing navigates to /appointments, which drops `confirmedBooking` while the dialog is still
	// fading out; keep the last one so it never renders empty dates.
	let lastConfirmed = $state<typeof data.confirmedBooking>(null);
	$effect.pre(() => {
		if (data.confirmedBooking) lastConfirmed = data.confirmedBooking;
	});
	const confirmed = $derived(data.confirmedBooking ?? lastConfirmed);
	let cancelTarget = $state<(typeof data.appointments)[number] | null>(null);
	let cancelOpen = $state(false);
	let cancelledSuccess = $state<{ doctorName: string; appointmentDate: string } | null>(null);
	let cancelledOpen = $state(false);

	const partitioned = $derived.by(() => {
		const upcoming: typeof data.appointments = [];
		const past: typeof data.appointments = [];
		for (const a of data.appointments) {
			(isUpcomingAppointment(String(a.appointmentDate), a.status) ? upcoming : past).push(a);
		}
		return { upcoming, past };
	});
	const upcoming = $derived(partitioned.upcoming);
	const past = $derived(partitioned.past);
	const visibleList = $derived(activeTab === 'upcoming' ? upcoming : past);

	function closeConfirmedModal() {
		confirmedDismissed = true;
		goto('/appointments', { replace: true, reset: false });
	}

	// The targets stay set after closing so the dialogs keep their text while fading out.
	function openCancelModal(apt: (typeof data.appointments)[number]) {
		cancelTarget = apt;
		cancelOpen = true;
	}

	function closeCancelModal() {
		cancelOpen = false;
	}

	function handleCancelled(details: { doctorName: string; appointmentDate: string }) {
		cancelOpen = false;
		cancelledSuccess = details;
		cancelledOpen = true;
	}

	function closeCancelledSuccess() {
		cancelledOpen = false;
	}

	function bookNewAppointment() {
		cancelledOpen = false;
		goto('/home');
	}
</script>

<Header
	userName={data.user?.name ?? 'Guest'}
	userImage={data.user?.imageUrl}
	showSearch={false}
	showNotification={true}
/>

<MotionReveal delay={40}>
	<h2 class="mt-2 font-heading text-2xl font-bold text-on-surface">My Appointments</h2>
	<p class="mt-1 text-sm text-outline">Manage your upcoming and past visits</p>
</MotionReveal>

<MotionReveal delay={80}>
	<div class="mt-5 flex rounded-2xl bg-surface-container p-1">
		{#each ['upcoming', 'past'] as tab}
			<button
				type="button"
				class={cn(
					'flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300',
					activeTab === tab
						? 'bg-surface-container-lowest text-on-surface shadow-[var(--shadow-card)]'
						: 'text-outline'
				)}
				onclick={() => (activeTab = tab as AppointmentTab)}
			>
				{tab === 'upcoming' ? 'Upcoming' : 'Past'}
			</button>
		{/each}
	</div>
</MotionReveal>

<div class="mt-6">
	{#key activeTab}
		{#if visibleList.length === 0}
			<div
				class="flex flex-col items-center py-12 text-center"
				in:fade={{ duration: 220 }}
			>
				<div
					class="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container text-primary"
				>
					<Calendar size={28} />
				</div>
				<p class="mt-4 font-heading font-semibold">
					No {activeTab === 'upcoming' ? 'upcoming' : 'past'} appointments
				</p>
				<p class="mt-1 text-sm text-outline">
					{#if activeTab === 'upcoming'}
						Book a doctor from the home screen.
					{:else}
						Your completed visits will appear here.
					{/if}
				</p>
				{#if activeTab === 'upcoming'}
					<a
						href="/home"
						class="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary"
					>
						Find a Doctor
					</a>
				{/if}
			</div>
		{:else}
			<div class="flex flex-col gap-4" in:fly={{ y: 10, duration: 280 }}>
				{#each visibleList as apt, i (apt.id)}
					<AppointmentCard
						onCancel={() => openCancelModal(apt)}
						doctorId={apt.doctorId}
						doctorName={apt.doctorName}
						doctorImage={apt.doctorImage}
						specialty={apt.specialty}
						rating={apt.doctorRating ?? '4.5'}
						hospital={apt.hospital}
						appointmentDate={String(apt.appointmentDate)}
						appointmentTime={apt.appointmentTime}
						status={apt.status}
						showActions={activeTab === 'upcoming'}
						index={i}
					/>
				{/each}
			</div>
		{/if}
	{/key}
</div>

<CancelAppointmentModal
	bind:open={cancelOpen}
	bookingId={cancelTarget?.id ?? ''}
	doctorName={cancelTarget?.doctorName ?? ''}
	appointmentDate={String(cancelTarget?.appointmentDate ?? '')}
	onClose={closeCancelModal}
	onCancelled={handleCancelled}
/>

<AppointmentCancelledModal
	bind:open={cancelledOpen}
	doctorName={cancelledSuccess?.doctorName ?? ''}
	appointmentDate={cancelledSuccess?.appointmentDate ?? ''}
	onBackToAppointments={closeCancelledSuccess}
	onBookNew={bookNewAppointment}
/>

<AppointmentConfirmedModal
	bind:open={() => showConfirmed, (v) => (confirmedDismissed = !v)}
	doctorName={confirmed?.doctorName ?? ''}
	appointmentDate={String(confirmed?.appointmentDate ?? '')}
	appointmentTime={confirmed?.appointmentTime ?? ''}
	onClose={closeConfirmedModal}
/>
