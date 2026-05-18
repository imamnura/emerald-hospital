<script lang="ts">
	import { MapPin, Star } from '@lucide/svelte';

	interface Props {
		id: string;
		name: string;
		specialty: string;
		hospital: string;
		imageUrl?: string | null;
		rating?: string;
		isOnline?: boolean;
	}

	let {
		id,
		name,
		specialty,
		hospital,
		imageUrl = null,
		rating = '4.5',
		isOnline = false
	}: Props = $props();
</script>

<a
	href="/doctors/{id}"
	class="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md"
>
	<div class="relative shrink-0">
		{#if imageUrl}
			<img src={imageUrl} alt={name} class="h-16 w-16 rounded-full object-cover" />
		{:else}
			<div
				class="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container text-lg font-semibold text-primary"
			>
				{name.charAt(0)}
			</div>
		{/if}
		<span
			class="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white {isOnline
				? 'bg-emerald-500'
				: 'bg-outline-variant'}"
		></span>
	</div>

	<div class="min-w-0 flex-1">
		<p class="truncate font-heading font-semibold text-on-surface">{name}</p>
		<p class="text-sm font-medium text-primary">{specialty}</p>
		<p class="mt-0.5 flex items-center gap-1 text-xs text-outline">
			<MapPin size={12} />
			<span class="truncate">{hospital}</span>
		</p>
	</div>

	<div
		class="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
	>
		<Star size={12} class="fill-primary" />
		{rating}
	</div>
</a>
