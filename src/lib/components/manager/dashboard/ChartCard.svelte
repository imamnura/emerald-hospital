<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '#lib/utils.ts';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<article
	class={cn(
		'rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-5 shadow-[var(--shadow-card)]',
		className
	)}
>
	{@render children()}
</article>
