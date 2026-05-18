<script lang="ts">
	import { MapPin, Star } from '@lucide/svelte';

	interface Props {
		id: string;
		name: string;
		role: string;
		hospital: string;
		imageUrl?: string | null;
		rating?: string;
		reviewCount?: number;
	}

	let {
		id,
		name,
		role,
		hospital,
		imageUrl = null,
		rating = '4.5',
		reviewCount = 120
	}: Props = $props();
</script>

<article
	class="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)]"
>
	<div class="flex gap-3">
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
			<p class="text-sm font-medium text-primary">{role}</p>
			<p class="mt-1.5 flex items-center gap-1 text-sm text-on-surface-variant">
				<Star size={14} class="fill-primary text-primary" />
				<span class="font-semibold text-on-surface">{rating}</span>
				<span class="text-outline">({reviewCount} Reviews)</span>
			</p>
			<p class="mt-1 flex items-center gap-1 text-sm text-outline">
				<MapPin size={14} class="shrink-0" />
				<span class="truncate">{hospital}</span>
			</p>
		</div>
	</div>

	<div class="mt-4 grid grid-cols-2 gap-3">
		<a
			href="/doctors/{id}"
			class="rounded-xl bg-surface-container py-3 text-center text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
		>
			View Profile
		</a>
		<a
			href="/doctors/{id}/book"
			class="rounded-xl bg-primary py-3 text-center text-sm font-semibold text-on-primary shadow-primary transition active:scale-[0.98]"
		>
			Book Now
		</a>
	</div>
</article>
