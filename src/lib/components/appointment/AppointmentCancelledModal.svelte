<script lang="ts">
	import { Check } from '@lucide/svelte';
	import ResultDialog from '#lib/components/appointment/ResultDialog.svelte';
	import { formatDate } from '#lib/format/date.ts';

	interface Props {
		open: boolean;
		doctorName: string;
		appointmentDate: string;
		onBackToAppointments: () => void;
		onBookNew: () => void;
	}

	let {
		open = $bindable(false),
		doctorName,
		appointmentDate,
		onBackToAppointments,
		onBookNew
	}: Props = $props();

	const dateLabel = $derived(formatDate(appointmentDate, 'short'));
</script>

<ResultDialog
	bind:open
	tone="success"
	title="Appointment Cancelled"
	large
	showClose
	onclose={onBackToAppointments}
>
	{#snippet icon()}
		<div
			class="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-surface-container-lowest"
		>
			<Check size={28} class="text-primary" strokeWidth={2.5} />
		</div>
	{/snippet}
	{#snippet body()}
		<p class="mt-3 text-sm leading-relaxed text-outline">
			Your appointment with <span class="font-bold text-on-surface">{doctorName}</span> on
			<span class="font-bold text-on-surface">{dateLabel}</span>
			has been successfully removed from your schedule.
		</p>
	{/snippet}
	{#snippet actions()}
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
	{/snippet}
</ResultDialog>
