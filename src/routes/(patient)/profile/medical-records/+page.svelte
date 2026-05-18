<script lang="ts">
	import { fly } from 'svelte/transition';
	import Header from '$lib/components/Header.svelte';
	import MedicalRecordCard from '$lib/components/medical-records/MedicalRecordCard.svelte';
	import MotionReveal from '$lib/components/motion/MotionReveal.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import {
		filterMedicalRecords,
		groupRecordsByMonth
	} from '$lib/utils/medical-records';

	let { data } = $props();

	let searchQuery = $state('');

	const filtered = $derived(filterMedicalRecords(data.records, searchQuery));
	const grouped = $derived(groupRecordsByMonth(filtered));
</script>

<Header
	userName={data.user.name}
	userImage={data.user.imageUrl}
	showSearch={false}
	showNotification={true}
/>

<MotionReveal delay={40}>
	<h1 class="mt-2 font-heading text-2xl font-bold text-on-surface">Medical Records</h1>
	<p class="mt-1 text-sm text-outline">Access and manage your clinical documents.</p>
</MotionReveal>

<MotionReveal delay={80}>
	<div class="mt-5">
		<SearchBar
			bind:value={searchQuery}
			placeholder="Search reports, labs..."
			name="records-q"
			rounded="2xl"
			showClear
		/>
	</div>
</MotionReveal>

<div class="mt-6 pb-4">
	{#if grouped.length === 0}
		<p class="rounded-2xl bg-surface-container-low p-8 text-center text-sm text-outline">
			{searchQuery.trim() ? 'No records match your search.' : 'No medical records on file yet.'}
		</p>
	{:else}
		{#each grouped as group, gi (group.monthLabel)}
			<section class={gi > 0 ? 'mt-8' : ''}>
				<p class="text-xs font-bold uppercase tracking-wide text-outline">{group.monthLabel}</p>
				<div class="mt-3 flex flex-col gap-3">
					{#each group.items as record, i (record.id)}
						<div in:fly={{ y: 10, duration: 280, delay: i * 35 }}>
							<MedicalRecordCard {record} />
						</div>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
</div>
