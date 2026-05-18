<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description: string;
		onclick?: () => void;
		icon: Snippet;
	}

	let { title, description, onclick, icon }: Props = $props();
</script>

<button
	type="button"
	{onclick}
	class="flex w-full flex-col items-start rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-left shadow-[var(--shadow-card)] transition-colors active:bg-surface-container"
>
	<span class="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
		{@render icon()}
	</span>
	<p class="mt-3 font-heading text-sm font-bold text-on-surface">{title}</p>
	<p class="mt-0.5 text-xs leading-snug text-outline">{description}</p>
</button>
