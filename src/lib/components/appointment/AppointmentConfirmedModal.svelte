<script lang="ts">
	import { Calendar, Check, Clock } from '@lucide/svelte';
	import ResultDialog from '#lib/components/appointment/ResultDialog.svelte';
	import { formatDate, formatTime12h } from '#lib/format/date.ts';

	interface Props {
		open: boolean;
		doctorName: string;
		appointmentDate: string;
		appointmentTime: string;
		onClose: () => void;
	}

	let {
		open = $bindable(false),
		doctorName,
		appointmentDate,
		appointmentTime,
		onClose
	}: Props = $props();

	const dateLabel = $derived(formatDate(appointmentDate, 'short'));
	const timeLabel = $derived(formatTime12h(appointmentTime));
</script>

<ResultDialog
	bind:open
	tone="success"
	title="Appointment Confirmed!"
	blur={false}
	motion="fly"
	onclose={onClose}
>
	{#snippet icon()}
		<div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
			<Check size={28} class="text-on-primary" strokeWidth={3} />
		</div>
	{/snippet}
	{#snippet body()}
		<p class="mt-2 text-sm leading-relaxed text-outline">
			Your appointment with <span class="font-semibold text-on-surface-variant">{doctorName}</span>
			has been successfully scheduled.
		</p>

		<div class="mt-6 rounded-2xl bg-surface-container px-4 py-1 text-left">
			<div class="flex items-center justify-between gap-3 py-3">
				<div class="flex items-center gap-2 text-outline">
					<Calendar size={18} class="text-primary" />
					<span class="text-sm">Date</span>
				</div>
				<span class="text-sm font-bold text-on-surface">{dateLabel}</span>
			</div>
			<div class="border-t border-outline-variant/40"></div>
			<div class="flex items-center justify-between gap-3 py-3">
				<div class="flex items-center gap-2 text-outline">
					<Clock size={18} class="text-primary" />
					<span class="text-sm">Time</span>
				</div>
				<span class="text-sm font-bold text-on-surface">{timeLabel}</span>
			</div>
		</div>
	{/snippet}
	{#snippet actions()}
		<button
			type="button"
			class="mt-6 w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-on-primary shadow-primary active:scale-[0.98]"
			onclick={onClose}
		>
			View My Appointments
		</button>
		<a href="/home" class="mt-4 inline-block text-sm font-semibold text-primary" onclick={onClose}>
			Back to Home
		</a>
	{/snippet}
</ResultDialog>
