<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { Check, X } from '@lucide/svelte';
	import { formatCancelModalDate } from '#lib/utils/appointments.ts';

	interface Props {
		open: boolean;
		doctorName: string;
		appointmentDate: string;
		onBackToAppointments: () => void;
		onBookNew: () => void;
	}

	let { open, doctorName, appointmentDate, onBackToAppointments, onBookNew }: Props = $props();

	const dateLabel = $derived(formatCancelModalDate(appointmentDate));
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-5 backdrop-blur-md"
		transition:fade={{ duration: 200 }}
		role="presentation"
		onclick={onBackToAppointments}
	>
		<div
			class="relative w-full max-w-sm rounded-3xl bg-surface-container-lowest p-8 text-center shadow-xl"
			transition:scale={{ start: 0.92, duration: 280 }}
			role="dialog"
			aria-modal="true"
			aria-labelledby="cancelled-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			<button
				type="button"
				class="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-outline transition-colors hover:bg-surface-container"
				aria-label="Close"
				onclick={onBackToAppointments}
			>
				<X size={20} />
			</button>

			<div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
				<div
					class="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-surface-container-lowest"
				>
					<Check size={28} class="text-primary" strokeWidth={2.5} />
				</div>
			</div>

			<h2 id="cancelled-title" class="mt-6 font-heading text-2xl font-bold text-on-surface">
				Appointment Cancelled
			</h2>
			<p class="mt-3 text-sm leading-relaxed text-outline">
				Your appointment with <span class="font-bold text-on-surface">{doctorName}</span> on
				<span class="font-bold text-on-surface">{dateLabel}</span>
				has been successfully removed from your schedule.
			</p>

			<button
				type="button"
				class="mt-8 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-on-primary shadow-primary active:scale-[0.98]"
				onclick={onBackToAppointments}
			>
				Back to Appointments
			</button>
			<button
				type="button"
				class="mt-4 text-sm font-bold text-primary transition-opacity hover:opacity-80"
				onclick={onBookNew}
			>
				Book a New Appointment
			</button>
		</div>
	</div>
{/if}
