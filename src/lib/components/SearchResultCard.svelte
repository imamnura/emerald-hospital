<script lang="ts">
	import { Bookmark, MapPin, Star } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	interface Props {
		id: string;
		name: string;
		specialty: string;
		hospital: string;
		imageUrl?: string | null;
		rating?: string;
		reviewCount?: number;
		bookmarked?: boolean;
		onBookmark?: (id: string) => void;
	}

	let {
		id,
		name,
		specialty,
		hospital,
		imageUrl = null,
		rating = '4.5',
		reviewCount = 120,
		bookmarked = false,
		onBookmark
	}: Props = $props();
</script>

<article
	class="relative rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)]"
>
	<button
		type="button"
		class="absolute right-4 top-4 text-outline transition-colors hover:text-primary"
		aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark doctor'}
		onclick={(e) => {
			e.preventDefault();
			onBookmark?.(id);
		}}
	>
		<Bookmark size={20} class={cn(bookmarked && 'fill-primary text-primary')} />
	</button>

	<a href="/doctors/{id}" class="flex gap-3 pr-8">
		{#if imageUrl}
			<img src={imageUrl} alt={name} class="h-16 w-16 shrink-0 rounded-full object-cover" />
		{:else}
			<div
				class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface-container text-lg font-semibold text-primary"
			>
				{name.charAt(0)}
			</div>
		{/if}

		<div class="min-w-0 flex-1">
			<p class="truncate font-heading text-base font-bold text-on-surface">{name}</p>
			<p class="text-sm font-medium text-primary">{specialty}</p>

			<div class="mt-3 flex flex-wrap items-center gap-2">
				<span
					class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
				>
					<Star size={12} class="fill-primary" />
					{rating}
					<span class="font-normal text-on-surface-variant">({reviewCount})</span>
				</span>
				<span class="flex items-center gap-1 text-xs text-outline">
					<MapPin size={12} />
					<span class="truncate">{hospital}</span>
				</span>
			</div>
		</div>
	</a>
</article>
