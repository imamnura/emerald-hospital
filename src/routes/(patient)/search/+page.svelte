<script lang="ts">
	import { goto } from '$app/navigation';
	import FilterOptionsModal from '#lib/components/FilterOptionsModal.svelte';
	import SearchBar from '#lib/components/SearchBar.svelte';
	import SearchPageHeader from '#lib/components/SearchPageHeader.svelte';
	import SearchResultCard from '#lib/components/SearchResultCard.svelte';
	import { filterAndSortDoctors, useSearchStore } from '#lib/stores/search.ts';
	import { useZustand } from '#lib/stores/useZustand.svelte.ts';
	import { SlidersHorizontal } from '@lucide/svelte';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';

	let { data } = $props();

	const search = useZustand(useSearchStore);
	let localQuery = $state('');

	$effect.pre(() => {
		useSearchStore.getState().setQuery(data.query);
		useSearchStore.getState().setResults(data.allDoctors);
		localQuery = data.query;
	});

	$effect(() => {
		if (data.openFilter) {
			useSearchStore.getState().openFilter();
		}
	});

	const displayed = $derived(
		filterAndSortDoctors(search.results, localQuery, search.filters)
	);

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	function syncUrl(stripFilter = false) {
		useSearchStore.getState().setQuery(localQuery);
		const params = new URLSearchParams();
		if (localQuery.trim()) params.set('q', localQuery.trim());
		if (!stripFilter && data.openFilter) params.set('filter', 'open');
		const qs = params.toString();
		goto(qs ? `/search?${qs}` : '/search', { replace: true, reset: false });
	}

	function onQueryInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => syncUrl(), 350);
	}

	function clearSearch() {
		localQuery = '';
		useSearchStore.getState().clearQuery();
		syncUrl();
	}

	function openFilter() {
		useSearchStore.getState().openFilter();
	}

	function onShowResults() {
		syncUrl(true);
	}
</script>

<SearchPageHeader userName={data.user?.name} userImage={data.user?.imageUrl} />

<form
	class="mt-4"
	onsubmit={(e) => {
		e.preventDefault();
		syncUrl();
	}}
>
	<SearchBar
		bind:value={localQuery}
		showClear
		onClear={clearSearch}
		oninput={onQueryInput}
		placeholder="Search doctor, specialist, or hospital.."
	/>
</form>

<div class="mt-4 flex items-center justify-between">
	<p class="text-sm text-on-surface-variant">
		<span class="font-semibold text-on-surface">{displayed.length}</span>
		{displayed.length === 1 ? ' result' : ' results'} found
	</p>
	<button
		type="button"
		onclick={openFilter}
		class="inline-flex items-center gap-1.5 rounded-xl border border-primary bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-primary"
	>
		<SlidersHorizontal size={16} />
		Filter
	</button>
</div>

<MotionReveal delay={100}>
<div class="mt-6 flex flex-col gap-3">
	{#if displayed.length === 0}
		<p class="rounded-2xl bg-surface-container-low p-8 text-center text-sm text-outline">
			No doctors match your search. Try another keyword or filter.
		</p>
	{:else}
		{#each displayed as doctor (doctor.id)}
			<SearchResultCard
				id={doctor.id}
				name={doctor.name}
				specialty={doctor.specialty}
				hospital={doctor.hospital}
				imageUrl={doctor.imageUrl}
				rating={doctor.rating}
				reviewCount={doctor.reviewCount}
				bookmarked={search.bookmarkedIds.includes(doctor.id)}
				onBookmark={(id) => useSearchStore.getState().toggleBookmark(id)}
			/>
		{/each}
	{/if}
</div>
</MotionReveal>

<FilterOptionsModal
	specialists={data.specialists}
	query={localQuery}
	onShowResults={onShowResults}
/>
