<script lang="ts">
	import Avatar from '#lib/components/ui/Avatar.svelte';
	import { ArrowLeft, MapPin, Star } from '@lucide/svelte';
	import { DAY_NAMES } from '#lib/format/date.ts';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';

	let { data } = $props();
	const doctor = $derived(data.doctor);
</script>

<a href="/home" class="mb-4 inline-flex items-center gap-1 text-sm text-primary">
	<ArrowLeft size={16} /> Back
</a>

<MotionReveal delay={60}>
<div class="flex flex-col items-center text-center">
	<div class="relative">
		<Avatar
			src={doctor.imageUrl}
			name={doctor.name}
			class="h-24 w-24"
			fallbackClass="bg-surface-container text-2xl font-bold text-primary"
			initials={doctor.name.charAt(0)}
		/>
		<span
			class="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white {doctor.isOnline
				? 'bg-emerald-500'
				: 'bg-outline-variant'}"
		></span>
	</div>
	<h1 class="mt-4 font-heading text-xl font-bold">{doctor.name}</h1>
	<p class="font-medium text-primary">{doctor.specialty}</p>
	<div class="mt-1 flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
		<Star size={14} class="fill-primary" /> {doctor.rating}
	</div>
</div>

<div class="mt-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
	<p class="flex items-center gap-1 text-sm font-semibold">
		<MapPin size={16} class="text-primary" />
		{doctor.hospital}
	</p>
	<p class="mt-1 text-sm text-outline">{doctor.hospitalAddress}, {doctor.hospitalCity}</p>
</div>

<div class="mt-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
	<h2 class="font-heading text-sm font-bold">Schedule</h2>
	{#if data.schedules.length === 0}
		<p class="mt-2 text-sm text-outline">No schedule available.</p>
	{:else}
		<ul class="mt-3 space-y-2">
			{#each data.schedules as schedule (schedule.id)}
				<li class="flex justify-between text-sm">
					<span class="font-medium">{DAY_NAMES[schedule.dayOfWeek]}</span>
					<span class="text-on-surface-variant">
						{schedule.startTime} – {schedule.endTime} (max {schedule.maxQuota})
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>
</MotionReveal>

<a
	href="/doctors/{doctor.id}/book"
	class="mt-8 block w-full rounded-xl bg-primary py-4 text-center text-sm font-semibold text-on-primary shadow-primary active:scale-[0.98]"
>
	Book Appointment
</a>
