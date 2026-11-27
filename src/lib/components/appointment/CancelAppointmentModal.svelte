<script lang="ts">
	import { enhance } from '$app/forms';
	import { AlertTriangle } from '@lucide/svelte';
	import ResultDialog from '#lib/components/appointment/ResultDialog.svelte';
	import { formatDate } from '#lib/format/date.ts';

	interface Props {
		open: boolean;
		bookingId: string;
		doctorName: string;
		appointmentDate: string;
		onClose: () => void;
		onCancelled: (details: { doctorName: string; appointmentDate: string }) => void;
	}

	let {
		open = $bindable(false),
		bookingId,
		doctorName,
		appointmentDate,
		onClose,
		onCancelled
	}: Props = $props();

	const dateLabel = $derived(formatDate(appointmentDate, 'short'));
	let submitting = $state(false);
</script>

<ResultDialog bind:open tone="danger" title="Cancel Appointment?" onclose={onClose}>
	{#snippet icon()}
		<AlertTriangle size={32} class="text-error" strokeWidth={2.25} />
	{/snippet}
	{#snippet body()}
		<p class="mt-3 text-sm leading-relaxed text-outline">
			Are you sure you want to cancel your appointment with
			<span class="font-semibold text-on-surface-variant">{doctorName}</span>
			on {dateLabel}? This action cannot be undone.
		</p>
	{/snippet}
	{#snippet actions()}
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
	{/snippet}
</ResultDialog>
