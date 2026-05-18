<script lang="ts">
	import { goto } from '$app/navigation';
	import DoctorCard from '$lib/components/DoctorCard.svelte';
	import Header from '$lib/components/Header.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import SpecialistChip from '$lib/components/SpecialistChip.svelte';
	import { useSearchStore } from '$lib/stores/search';
	import { SlidersHorizontal } from '@lucide/svelte';
	import MotionReveal from '$lib/components/motion/MotionReveal.svelte';

	let { data } = $props();

	let searchQuery = $state('');

	function applySearch() {
		const q = searchQuery.trim();
		if (!q) {
			goto('/search');
			return;
		}
		useSearchStore.getState().setQuery(q);
		goto(`/search?q=${encodeURIComponent(q)}`);
	}

	function openFilter() {
		useSearchStore.getState().openFilter();
		const q = searchQuery.trim();
		goto(q ? `/search?q=${encodeURIComponent(q)}&filter=open` : '/search?filter=open');
	}
</script>

<Header userName={data.user?.name ?? 'Guest'} userImage={data.user?.imageUrl} />

<MotionReveal delay={60}>
	<section class="mt-6">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="font-heading text-base font-semibold text-on-surface">Find your care</h2>
			<button
				type="button"
				onclick={openFilter}
				class="inline-flex items-center gap-1.5 rounded-xl border border-primary bg-surface-container-lowest px-3 py-1.5 text-sm font-semibold text-primary"
			>
				<SlidersHorizontal size={15} />
				Filter
			</button>
		</div>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				applySearch();
			}}
		>
			<SearchBar bind:value={searchQuery} />
		</form>
	</section>
</MotionReveal>

<MotionReveal delay={120}>
	<section class="mt-8">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="font-heading text-base font-bold text-on-surface">Specialists</h2>
			<a href="/specialists" class="text-sm font-semibold text-primary">See all</a>
		</div>
		<div class="scrollbar-hide -mx-5 flex gap-4 overflow-x-auto px-5 pb-2">
			{#each data.specialists as spec}
				<SpecialistChip
					name={spec.name}
					icon={spec.icon}
					active={data.activeSpecialist === spec.slug}
					href="/specialists/{spec.slug}"
				/>
			{/each}
		</div>
	</section>
</MotionReveal>

<MotionReveal delay={180}>
	<section class="mt-8">
		<h2 class="mb-4 font-heading text-base font-bold text-on-surface">Recommended Doctors</h2>
		<div class="flex flex-col gap-3">
			{#each data.doctors as doctor}
				<DoctorCard
					id={doctor.id}
					name={doctor.name}
					specialty={doctor.specialty}
					hospital={doctor.hospital}
					imageUrl={doctor.imageUrl}
					rating={doctor.rating ?? '4.5'}
					isOnline={doctor.isOnline}
				/>
			{/each}
		</div>
	</section>
</MotionReveal>
