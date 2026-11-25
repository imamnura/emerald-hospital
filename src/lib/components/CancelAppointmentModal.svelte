<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade, scale } from 'svelte/transition';
	import { AlertTriangle } from '@lucide/svelte';
	import { formatDate } from '#lib/format/date.ts';

	interface Props {
		open: boolean;
		bookingId: string;
		doctorName: string;
		appointmentDate: string;
		onClose: () => void;
		onCancelled: (details: { doctorName: string; appointmentDate: string }) => void;
	}

	let { open, bookingId, doctorName, appointmentDate, onClose, onCancelled }: Props = $props();

	const dateLabel = $derived(formatDate(appointmentDate, 'short'));
	let submitting = $state(false);
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-5 backdrop-blur-md"
		transition:fade={{ duration: 200 }}
		role="presentation"
		onclick={onClose}
	>
		<div
			class="w-full max-w-sm rounded-3xl bg-surface-container-lowest p-6 text-center shadow-xl"
			transition:scale={{ start: 0.92, duration: 280 }}
			role="dialog"
			aria-modal="true"
			aria-labelledby="cancel-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			<div
				class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-container/80"
			>
				<AlertTriangle size={32} class="text-error" strokeWidth={2.25} />
			</div>

			<h2 id="cancel-title" class="mt-5 font-heading text-xl font-bold text-on-surface">
				Cancel Appointment?
			</h2>
			<p class="mt-3 text-sm leading-relaxed text-outline">
				Are you sure you want to cancel your appointment with
				<span class="font-semibold text-on-surface-variant">{doctorName}</span>
				on {dateLabel}? This action cannot be undone.
			</p>

			<form
				method="POST"
				action="?/cancel"
				class="mt-6 flex flex-col gap-3"
				use:enhance={() => {
					submitting = true;
					return async ({ result, update }) => {
						submitting = false;
						if (result.type === 'success') {
							onCancelled({ doctorName, appointmentDate });
						}
						await update();
					};
				}}
			>
				<input type="hidden" name="bookingId" value={bookingId} />
				<button
					type="submit"
					disabled={submitting}
					class="w-full rounded-xl border-2 border-error py-3.5 text-sm font-bold text-error transition-opacity hover:bg-error-container/30 disabled:opacity-50 active:scale-[0.98]"
				>
					{submitting ? 'Cancelling…' : 'Yes, Cancel Appointment'}
				</button>
				<button
					type="button"
					disabled={submitting}
					class="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-on-primary shadow-primary transition-opacity disabled:opacity-50 active:scale-[0.98]"
					onclick={onClose}
				>
					Keep Appointment
				</button>
			</form>
		</div>
	</div>
{/if}
