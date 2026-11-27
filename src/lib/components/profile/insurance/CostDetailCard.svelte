<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		amount: string;
		icon: Snippet;
	}

	let { label, amount, icon }: Props = $props();
</script>

<article
	class="flex flex-col rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)]"
>
	<span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
		{@render icon()}
	</span>
	<p class="mt-3 text-xs text-outline">{label}</p>
	<p class="mt-0.5 font-heading text-lg font-bold text-primary">{amount}</p>
</article>
