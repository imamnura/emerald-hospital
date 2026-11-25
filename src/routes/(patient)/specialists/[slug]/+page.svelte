<script lang="ts">
	import BackHeader from '#lib/components/layout/BackHeader.svelte';
	import DoctorSummary from '#lib/components/doctor/DoctorSummary.svelte';
	import {
		doctorRoleLabel,
		specialistAvailabilityLabel,
		specialistPluralTitle
	} from '#lib/domain/specialist.ts';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';

	let { data } = $props();

	const pageTitle = $derived(specialistPluralTitle(data.specialist.name));
	const availabilityText = $derived(specialistAvailabilityLabel(data.doctors.length));
</script>

<BackHeader title={pageTitle} backHref="/specialists" />

<p class="mt-2 text-sm text-outline">{availabilityText}</p>

<MotionReveal delay={90}>
<div class="mt-5 flex flex-col gap-4">
	{#if data.doctors.length === 0}
		<p class="rounded-2xl bg-surface-container-low p-8 text-center text-sm text-outline">
			No doctors available for this specialty yet.
		</p>
	{:else}
		{#each data.doctors as doctor (doctor.id)}
			<DoctorSummary
				doctor={{ ...doctor, role: doctorRoleLabel(data.specialist.name, doctor.rating) }}
				variant="grid"
			/>
		{/each}
	{/if}
</div>
</MotionReveal>
