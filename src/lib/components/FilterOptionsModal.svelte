<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { X } from '@lucide/svelte';
	import {
		filterAndSortDoctors,
		useSearchStore,
		type Availability,
		type SortBy
	} from '$lib/stores/search';
	import { useZustand } from '$lib/stores/useZustand.svelte';
	import { cn } from '$lib/utils';

	interface Specialist {
		name: string;
		slug: string;
	}

	interface Props {
		specialists: Specialist[];
		query: string;
		onShowResults: () => void;
	}

	let { specialists, query, onShowResults }: Props = $props();

	const search = useZustand(useSearchStore);
	const draft = $derived(search.draftFilters);

	const previewCount = $derived(
		filterAndSortDoctors(search.results, query, draft).length
	);

	const priceTrack = $derived({
		minPct: (draft.priceRange[0] / 500) * 100,
		maxPct: (draft.priceRange[1] / 500) * 100
	});

	const sortOptions: { value: SortBy; label: string }[] = [
		{ value: 'recommended', label: 'Recommended' },
		{ value: 'rating', label: 'Rating' },
		{ value: 'distance', label: 'Distance' }
	];

	const availabilityOptions: { value: Availability; label: string }[] = [
		{ value: 'today', label: 'Today' },
		{ value: 'week', label: 'This Week' }
	];

	function setSortBy(sortBy: SortBy) {
		useSearchStore.getState().updateDraftFilters({ sortBy });
	}

	function toggleSpecialty(slug: string) {
		const current = search.draftFilters.specialties;
		const next = current.includes(slug)
			? current.filter((s) => s !== slug)
			: [...current, slug];
		useSearchStore.getState().updateDraftFilters({ specialties: next });
	}

	function setAvailability(availability: Availability) {
		useSearchStore.getState().updateDraftFilters({
			availability: search.draftFilters.availability === availability ? null : availability
		});
	}

	function onMinPriceInput(e: Event) {
		const min = Number((e.target as HTMLInputElement).value);
		const max = draft.priceRange[1];
		useSearchStore.getState().updateDraftFilters({
			priceRange: [Math.min(min, max), max]
		});
	}

	function onMaxPriceInput(e: Event) {
		const max = Number((e.target as HTMLInputElement).value);
		const min = draft.priceRange[0];
		useSearchStore.getState().updateDraftFilters({
			priceRange: [min, Math.max(min, max)]
		});
	}

	function priceLabel(): string {
		const [min, max] = draft.priceRange;
		const maxLabel = max >= 500 ? '$500+' : `$${max}`;
		return `$${min} - ${maxLabel}`;
	}

	function handleShowResults() {
		useSearchStore.getState().applyFilters();
		onShowResults();
	}

	function handleClearAll() {
		useSearchStore.getState().clearAllFilters();
	}
</script>

{#if search.isFilterOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-40 bg-on-surface/50"
		transition:fade={{ duration: 200 }}
		onclick={() => useSearchStore.getState().closeFilter()}
		role="presentation"
	></div>

	<div
		class="fixed bottom-0 left-1/2 z-50 flex max-h-[90vh] w-full max-w-md -translate-x-1/2 flex-col rounded-t-3xl bg-surface-container-lowest shadow-2xl"
		transition:fly={{ y: 480, duration: 320, opacity: 1 }}
		role="dialog"
		aria-modal="true"
		aria-labelledby="filter-title"
	>
		<div class="flex shrink-0 flex-col items-center border-b border-outline-variant/40 px-5 pb-4 pt-3">
			<div class="mb-3 h-1 w-10 rounded-full bg-outline-variant/60" aria-hidden="true"></div>
			<div class="flex w-full items-center justify-between">
				<h2 id="filter-title" class="font-heading text-lg font-bold text-on-surface">Filter Options</h2>
				<button
					type="button"
					class="flex h-9 w-9 items-center justify-center rounded-full text-outline hover:bg-surface-container"
					aria-label="Close filters"
					onclick={() => useSearchStore.getState().closeFilter()}
				>
					<X size={20} />
				</button>
			</div>
		</div>

		<div class="scrollbar-hide flex-1 overflow-y-auto px-5 py-5">
			<section class="mb-6">
				<p class="mb-3 text-xs font-semibold tracking-wide text-outline">SORT BY</p>
				<div class="flex flex-wrap gap-2">
					{#each sortOptions as opt}
						<button
							type="button"
							class={cn(
								'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
								draft.sortBy === opt.value
									? 'border-primary bg-primary text-on-primary'
									: 'border-outline-variant bg-surface-container-lowest text-on-surface'
							)}
							onclick={() => setSortBy(opt.value)}
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</section>

			<section class="mb-6">
				<p class="mb-3 text-xs font-semibold tracking-wide text-outline">SPECIALTY</p>
				<div class="flex flex-wrap gap-2">
					{#each specialists as spec}
						<button
							type="button"
							class={cn(
								'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
								draft.specialties.includes(spec.slug)
									? 'bg-primary text-on-primary'
									: 'bg-surface-container text-on-surface-variant'
							)}
							onclick={() => toggleSpecialty(spec.slug)}
						>
							{spec.name}
						</button>
					{/each}
				</div>
			</section>

			<section class="mb-6">
				<p class="mb-3 text-xs font-semibold tracking-wide text-outline">AVAILABILITY</p>
				<div class="grid grid-cols-2 gap-3">
					{#each availabilityOptions as opt}
						<button
							type="button"
							class={cn(
								'flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm font-semibold transition-colors',
								draft.availability === opt.value
									? 'border-primary bg-primary/10 text-on-surface'
									: 'border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant'
							)}
							onclick={() => setAvailability(opt.value)}
						>
							<span
								class={cn(
									'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
									draft.availability === opt.value
										? 'border-primary'
										: 'border-outline-variant'
								)}
							>
								{#if draft.availability === opt.value}
									<span class="h-2.5 w-2.5 rounded-full bg-primary"></span>
								{/if}
							</span>
							{opt.label}
						</button>
					{/each}
				</div>
			</section>

			<section class="mb-2">
				<div class="mb-4 flex items-center justify-between">
					<p class="text-xs font-semibold tracking-wide text-outline">PRICE RANGE</p>
					<p class="text-sm font-semibold text-primary">{priceLabel()}</p>
				</div>

				<div class="relative px-1 pt-2 pb-6">
					<div class="relative h-2 rounded-full bg-surface-container">
						<div
							class="absolute h-2 rounded-full bg-primary"
							style="left: {priceTrack.minPct}%; right: {100 - priceTrack.maxPct}%"
						></div>
					</div>
					<input
						type="range"
						min="0"
						max="500"
						value={draft.priceRange[0]}
						class="range-thumb absolute inset-x-0 top-0 w-full cursor-pointer appearance-none bg-transparent"
						aria-label="Minimum price"
						oninput={onMinPriceInput}
					/>
					<input
						type="range"
						min="0"
						max="500"
						value={draft.priceRange[1]}
						class="range-thumb absolute inset-x-0 top-0 w-full cursor-pointer appearance-none bg-transparent"
						aria-label="Maximum price"
						oninput={onMaxPriceInput}
					/>
					<div class="mt-2 flex justify-between text-xs text-outline">
						<span>$0</span>
						<span>$500+</span>
					</div>
				</div>
			</section>
		</div>

		<div class="shrink-0 border-t border-outline-variant/40 px-5 pb-6 pt-4">
			<button
				type="button"
				class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-on-primary shadow-primary active:scale-[0.98]"
				onclick={handleShowResults}
			>
				Show Results
				<span class="flex h-7 min-w-7 items-center justify-center rounded-full bg-primary-container px-2 text-xs font-bold">
					{previewCount}
				</span>
			</button>
			<button
				type="button"
				class="mt-4 w-full text-center text-sm font-medium text-on-surface-variant underline underline-offset-2"
				onclick={handleClearAll}
			>
				Clear all filters
			</button>
		</div>
	</div>
{/if}

<style>
	.range-thumb::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		height: 1.25rem;
		width: 1.25rem;
		border-radius: 9999px;
		background: white;
		border: 2px solid var(--color-primary);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
		pointer-events: auto;
	}
	.range-thumb::-moz-range-thumb {
		height: 1.25rem;
		width: 1.25rem;
		border-radius: 9999px;
		background: white;
		border: 2px solid var(--color-primary);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
		pointer-events: auto;
	}
	.range-thumb::-webkit-slider-runnable-track {
		background: transparent;
	}
</style>
