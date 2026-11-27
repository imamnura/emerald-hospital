<script lang="ts">
	import { goto } from '$app/navigation';
	import FilterOptionsModal from '#lib/components/doctor/FilterOptionsModal.svelte';
	import SearchBar from '#lib/components/layout/SearchBar.svelte';
	import BackHeader from '#lib/components/layout/BackHeader.svelte';
	import ProfileLink from '#lib/components/profile/ProfileLink.svelte';
	import DoctorSummary from '#lib/components/doctor/DoctorSummary.svelte';
	import { filterAndSortDoctors, useSearchStore } from '#lib/stores/search.ts';
	import { useZustand } from '#lib/stores/useZustand.svelte.ts';
	import { Bookmark, SlidersHorizontal } from '@lucide/svelte';
	import { cn } from '#lib/utils/cn.ts';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';

	let { data } = $props();

	const search = useZustand(useSearchStore);
	let localQuery = $derived(data.query);

	let lastOpenFilter = false;
	// Store sync from load data (pre-render so first paint is consistent).
	$effect.pre(() => {
		const store = useSearchStore.getState();
		store.setQuery(data.query);
		store.setResults(data.allDoctors);
		const open = Boolean(data.openFilter);
		if (open && !lastOpenFilter) store.openFilter();
		lastOpenFilter = open;
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

<BackHeader title="Medical Center" backHref="/home">
	{#snippet trailing()}
		<ProfileLink imageUrl={data.user?.imageUrl} name={data.user?.name ?? 'Guest'} />
	{/snippet}
</BackHeader>

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
			{@const bookmarked = search.bookmarkedIds.includes(doctor.id)}
			<DoctorSummary {doctor} variant="search">
				{#snippet trailing()}
					<button
						type="button"
						class="absolute right-4 top-4 text-outline transition-colors hover:text-primary"
						aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark doctor'}
						onclick={(e) => {
							e.preventDefault();
							useSearchStore.getState().toggleBookmark(doctor.id);
						}}
					>
						<Bookmark size={20} class={cn(bookmarked && 'fill-primary text-primary')} />
					</button>
				{/snippet}
			</DoctorSummary>
		{/each}
	{/if}
</div>
</MotionReveal>

<FilterOptionsModal
	specialists={data.specialists}
	query={localQuery}
	onShowResults={onShowResults}
/>
