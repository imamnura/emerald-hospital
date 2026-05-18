<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	interface Props {
		pageKey: string;
		children: Snippet;
	}

	let { pageKey, children }: Props = $props();
</script>

{#key pageKey}
	<div
		class="contents"
		in:fly={{ y: 14, duration: 340, delay: 0 }}
		out:fade={{ duration: 160 }}
	>
		{@render children()}
	</div>
{/key}
