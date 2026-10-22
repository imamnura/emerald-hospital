<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cn } from '#lib/utils.ts';

	interface Props {
		delay?: number;
		class?: string;
		children: Snippet;
	}

	let { delay = 0, class: className = '', children }: Props = $props();
</script>

<div
	class={cn('contents', className)}
	in:fly={{ y: 18, duration: 420, delay }}
>
	{@render children()}
</div>
