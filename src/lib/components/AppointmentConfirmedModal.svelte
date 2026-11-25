<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { Calendar, Check, Clock } from '@lucide/svelte';
	import { formatDate, formatTime12h } from '#lib/format/date.ts';

	interface Props {
		open: boolean;
		doctorName: string;
		appointmentDate: string;
		appointmentTime: string;
		onClose: () => void;
	}

	let { open, doctorName, appointmentDate, appointmentTime, onClose }: Props = $props();

	const dateLabel = $derived(formatDate(appointmentDate, 'short'));
	const timeLabel = $derived(formatTime12h(appointmentTime));
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/50 p-5"
		transition:fade={{ duration: 200 }}
		role="presentation"
		onclick={onClose}
	>
		<div
			class="w-full max-w-sm rounded-3xl bg-surface-container-lowest p-6 text-center shadow-xl"
			transition:fly={{ y: 24, duration: 280 }}
			role="dialog"
			aria-modal="true"
			aria-labelledby="confirmed-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
				<div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
					<Check size={28} class="text-on-primary" strokeWidth={3} />
				</div>
			</div>

			<h2 id="confirmed-title" class="mt-5 font-heading text-xl font-bold text-on-surface">
				Appointment Confirmed!
			</h2>
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
		</div>
	</div>
{/if}
