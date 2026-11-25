<script lang="ts">
	import { getInitials } from '#lib/format/text.ts';
	import { Calendar, Check, Clock, MapPin } from '@lucide/svelte';
	import {
		appointmentStatusLabel,
		appointmentStatusStyles,
		formatAppointmentListDate
	} from '#lib/utils/appointments.ts';
	import { doctorRoleLabel } from '#lib/domain/specialist.ts';
	import { cn } from '#lib/utils.ts';

	interface Props {
		onCancel?: () => void;
		doctorId: string;
		doctorName: string;
		doctorImage: string | null;
		specialty: string;
		rating: string;
		hospital: string;
		appointmentDate: string;
		appointmentTime: string;
		status: string;
		showActions?: boolean;
		index?: number;
	}

	let {
		onCancel,
		doctorId,
		doctorName,
		doctorImage,
		specialty,
		rating,
		hospital,
		appointmentDate,
		appointmentTime,
		status,
		showActions = true,
		index = 0
	}: Props = $props();

	const role = $derived(doctorRoleLabel(specialty, rating));
	const dateTimeLabel = $derived(formatAppointmentListDate(appointmentDate, appointmentTime));
	const initials = $derived(getInitials(doctorName.replace(/^Dr\.\s*/i, '')));
</script>

<article
	class="rounded-2xl border border-outline-variant/35 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)]"
	style="animation: card-enter 0.45s ease-out {index * 0.07}s both"
>
	<div class="flex items-start gap-3">
		{#if doctorImage}
			<img
				src={doctorImage}
				alt={doctorName}
				class="h-14 w-14 shrink-0 rounded-full object-cover"
			/>
		{:else}
			<div
				class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
			>
				{initials}
			</div>
		{/if}

		<div class="min-w-0 flex-1">
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0">
					<p class="truncate font-heading font-bold text-on-surface">{doctorName}</p>
					<p class="text-sm text-outline">{role}</p>
				</div>
				<span
					class={cn(
						'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
						appointmentStatusStyles(status)
					)}
				>
					{#if status === 'confirmed'}
						<Check size={12} strokeWidth={2.5} />
					{:else if status === 'pending'}
						<Clock size={12} strokeWidth={2.5} />
					{/if}
					{appointmentStatusLabel(status)}
				</span>
			</div>
		</div>
	</div>

	<div class="mt-4 rounded-xl bg-surface-container px-3.5 py-3">
		<div class="flex items-center gap-2.5 text-sm text-on-surface-variant">
			<Calendar size={16} class="shrink-0 text-primary" />
			<span>{dateTimeLabel}</span>
		</div>
		<div class="mt-2.5 flex items-center gap-2.5 text-sm text-on-surface-variant">
			<MapPin size={16} class="shrink-0 text-primary" />
			<span class="line-clamp-2">{hospital}</span>
		</div>
	</div>

	{#if showActions && (status === 'pending' || status === 'confirmed')}
		<div class="mt-4 flex items-center gap-3">
			<a
				href="/doctors/{doctorId}/book"
				class="flex-1 rounded-xl border border-outline-variant/60 py-2.5 text-center text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
			>
				Reschedule
			</a>
			<button
				type="button"
				class="flex-1 py-2.5 text-center text-sm font-semibold text-error transition-opacity hover:opacity-80"
				onclick={() => onCancel?.()}
			>
				Cancel
			</button>
		</div>
	{/if}
</article>

<style>
	@keyframes card-enter {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
