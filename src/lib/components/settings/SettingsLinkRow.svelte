<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronRight } from '@lucide/svelte';

	interface Props {
		href: string;
		label: string;
		value?: string;
		icon: Snippet;
		showDivider?: boolean;
	}

	let { href, label, value, icon, showDivider = false }: Props = $props();
</script>

{#if showDivider}
	<div class="mx-4 border-t border-outline-variant/35"></div>
{/if}

<a
	{href}
	class="flex items-center gap-3 px-4 py-4 transition-colors active:bg-surface-container"
>
	<span class="flex h-9 w-9 shrink-0 items-center justify-center text-on-surface-variant">
		{@render icon()}
	</span>
	<span class="min-w-0 flex-1 text-sm font-medium text-on-surface">{label}</span>
	{#if value}
		<span class="text-sm text-on-surface-variant">{value}</span>
	{/if}
	<ChevronRight size={18} class="shrink-0 text-outline" />
</a>
