<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Inbox } from '@lucide/svelte';

	interface Props {
		title: string;
		description?: string;
		icon?: Snippet;
	}

	let { title, description, icon }: Props = $props();
</script>

<div
	class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-lowest/50 px-6 py-12 text-center"
>
	<span class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
		{#if icon}
			{@render icon()}
		{:else}
			<Inbox size={24} strokeWidth={2} />
		{/if}
	</span>
	<p class="mt-3 font-heading text-base font-bold text-on-surface">{title}</p>
	{#if description}
		<p class="mt-1 max-w-xs text-sm text-outline">{description}</p>
	{/if}
</div>
