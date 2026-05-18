<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		ArrowLeft,
		ArrowRight,
		BadgeCheck,
		ChevronDown,
		MoreVertical,
		Star
	} from '@lucide/svelte';
	import { groupSlotsByPeriod } from '$lib/utils/booking-ui';
	import { cn } from '$lib/utils';
	import MotionReveal from '$lib/components/motion/MotionReveal.svelte';

	let { data } = $props();

	let selectedDate = $state('');
	let selectedTime = $state('');
	let selectedScheduleId = $state('');

	$effect.pre(() => {
		selectedDate = data.selectedDate;
		selectedTime = '';
		selectedScheduleId = '';
	});

	const slotGroups = $derived(groupSlotsByPeriod(data.slots));
	const backHref = $derived(`/specialists/${data.doctor.specialistSlug}`);

	function selectDate(date: string) {
		selectedDate = date;
		selectedTime = '';
		selectedScheduleId = '';
		goto(`/doctors/${data.doctor.id}/book?date=${date}`, { replaceState: true, noScroll: true });
	}

	function selectSlot(slot: (typeof data.slots)[0]) {
		if (slot.isFull) return;
		selectedTime = slot.time;
		selectedScheduleId = slot.scheduleId;
	}
</script>

<!-- Header -->
<header
	class="-mx-5 flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-lowest px-5 py-3"
>
	<a
		href={backHref}
		class="flex h-10 w-10 items-center justify-center rounded-full text-on-surface"
		aria-label="Back"
	>
		<ArrowLeft size={22} />
	</a>
	<h1 class="font-heading text-base font-bold text-on-surface">Doctor Profile</h1>
	<button
		type="button"
		class="flex h-10 w-10 items-center justify-center rounded-full text-on-surface"
		aria-label="More options"
	>
		<MoreVertical size={20} />
	</button>
</header>

<MotionReveal delay={50}>
<!-- Doctor hero -->
<section
	class="-mx-5 bg-gradient-to-b from-primary/10 via-surface-container-low to-surface px-5 pb-6 pt-8 text-center"
>
	<div class="relative mx-auto w-fit">
		{#if data.doctor.imageUrl}
			<img
				src={data.doctor.imageUrl}
				alt={data.doctor.name}
				class="mx-auto h-28 w-28 rounded-full border-4 border-white object-cover shadow-md"
			/>
		{:else}
			<div
				class="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-surface-container text-3xl font-bold text-primary shadow-md"
			>
				{data.doctor.name.charAt(0)}
			</div>
		{/if}
		<span
			class="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary text-on-primary"
		>
			<BadgeCheck size={16} />
		</span>
	</div>

	<h2 class="mt-4 font-heading text-xl font-bold text-on-surface">{data.doctor.name}</h2>
	<p class="mt-0.5 text-sm font-semibold text-primary">{data.doctor.role}</p>

	<div
		class="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 text-sm"
	>
		<Star size={14} class="fill-primary text-primary" />
		<span class="font-semibold text-on-surface">{data.doctor.rating}</span>
		<span class="text-outline">({data.doctor.reviewCount} Reviews)</span>
	</div>

	<p class="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-outline">{data.doctor.bio}</p>
</section>

<!-- Date picker -->
<section class="mt-6">
	<div class="mb-3 flex items-center justify-between">
		<p class="font-heading text-sm font-bold text-on-surface">Date</p>
		<button type="button" class="flex items-center gap-1 text-sm font-medium text-on-surface-variant">
			{data.monthLabel}
			<ChevronDown size={16} />
		</button>
	</div>

	<div class="scrollbar-hide -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
		{#each data.calendarDays as day (day.date)}
			<button
				type="button"
				disabled={!day.available || day.isPast}
				onclick={() => selectDate(day.date)}
				class={cn(
					'flex min-w-[4.5rem] flex-col items-center rounded-2xl border px-3 py-3 transition',
					!day.available || day.isPast
						? 'cursor-not-allowed border-transparent bg-surface-container text-outline'
						: selectedDate === day.date
							? 'border-primary bg-primary text-on-primary shadow-primary'
							: 'border-outline-variant/50 bg-surface-container-lowest text-on-surface hover:border-primary/40'
				)}
			>
				<span class="text-[10px] font-semibold tracking-wide opacity-80">{day.dayLabel}</span>
				<span class="mt-1 text-lg font-bold">{day.dayNum}</span>
			</button>
		{/each}
	</div>
</section>

<!-- Time slots -->
{#if selectedDate}
	<section class="mt-8">
		<p class="mb-4 font-heading text-sm font-bold text-on-surface">Available Time</p>

		{#if data.slots.length === 0}
			<p class="text-sm text-outline">No time slots for this date.</p>
		{:else}
			{#if slotGroups.morning.length > 0}
				<p class="mb-2 text-xs font-medium text-outline">Morning</p>
				<div class="mb-6 grid grid-cols-3 gap-2">
					{#each slotGroups.morning as slot (slot.time)}
						<button
							type="button"
							disabled={slot.isFull}
							onclick={() => selectSlot(slot)}
							class={cn(
								'relative rounded-full border py-2.5 text-xs font-semibold transition',
								slot.isFull
									? 'cursor-not-allowed border-transparent bg-surface-container text-outline line-through'
									: selectedTime === slot.time
										? 'border-primary bg-primary text-on-primary shadow-primary'
										: 'border-outline-variant bg-surface-container-lowest text-on-surface'
							)}
						>
							{#if slot.isFull}
								<span
									class="absolute -right-1 -top-2 rounded bg-outline-variant px-1.5 py-0.5 text-[9px] font-bold text-on-primary"
									>FULL</span
								>
							{/if}
							{slot.label}
						</button>
					{/each}
				</div>
			{/if}

			{#if slotGroups.afternoon.length > 0}
				<p class="mb-2 text-xs font-medium text-outline">Afternoon</p>
				<div class="grid grid-cols-3 gap-2">
					{#each slotGroups.afternoon as slot (slot.time)}
						<button
							type="button"
							disabled={slot.isFull}
							onclick={() => selectSlot(slot)}
							class={cn(
								'relative rounded-full border py-2.5 text-xs font-semibold transition',
								slot.isFull
									? 'cursor-not-allowed border-transparent bg-surface-container text-outline line-through'
									: selectedTime === slot.time
										? 'border-primary bg-primary text-on-primary shadow-primary'
										: 'border-outline-variant bg-surface-container-lowest text-on-surface'
							)}
						>
							{#if slot.isFull}
								<span
									class="absolute -right-1 -top-2 rounded bg-outline-variant px-1.5 py-0.5 text-[9px] font-bold text-on-primary"
									>FULL</span
								>
							{/if}
							{slot.label}
						</button>
					{/each}
				</div>
			{/if}
		{/if}
	</section>
{/if}
</MotionReveal>

<!-- Fixed footer -->
<div
	class="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-outline-variant/30 bg-surface-container-lowest px-5 py-4"
>
	<button
		type="button"
		disabled={!selectedDate || !selectedTime}
		onclick={() => {
			if (!data.user) {
				const q = new URLSearchParams({
					date: selectedDate,
					time: selectedTime,
					scheduleId: selectedScheduleId
				});
				goto(
					`/login?redirect=${encodeURIComponent(`/doctors/${data.doctor.id}/book/confirm?${q}`)}`
				);
				return;
			}
			const q = new URLSearchParams({
				date: selectedDate,
				time: selectedTime,
				scheduleId: selectedScheduleId
			});
			goto(`/doctors/${data.doctor.id}/book/confirm?${q}`);
		}}
		class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-on-primary shadow-primary disabled:opacity-50 active:scale-[0.98]"
	>
		Book Appointment
		<ArrowRight size={18} />
	</button>
</div>

<!-- Spacer for fixed footer -->
<div class="h-24" aria-hidden="true"></div>
