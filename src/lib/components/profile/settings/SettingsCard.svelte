<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div
	class="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-[var(--shadow-card)]"
>
	{@render children()}
</div>
