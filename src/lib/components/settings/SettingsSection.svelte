<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		children: Snippet;
	}

	let { title, children }: Props = $props();
</script>

<section class="mt-6 first:mt-0">
	<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-outline">{title}</p>
	{@render children()}
</section>
