<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ArrowLeft } from '@lucide/svelte';
	import { cn } from '#lib/utils.ts';

	interface Props {
		title: string;
		backHref: string;
		/** Render the hairline under the header (replaces the manual divider div). */
		divider?: boolean;
		/** Bottom margin of the divider. */
		dividerClass?: string;
		/** Right-hand slot (avatar/profile); a 40px spacer is rendered when omitted. */
		trailing?: Snippet;
	}

	let { title, backHref, divider = false, dividerClass = 'mb-2', trailing }: Props = $props();
</script>

<header class="flex items-center justify-between py-2">
	<a
		href={backHref}
		class="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container"
		aria-label="Back"
	>
		<ArrowLeft size={22} />
	</a>

	<h1 class="font-heading text-lg font-bold text-primary">{title}</h1>

	{#if trailing}
		{@render trailing()}
	{:else}
		<div class="w-10" aria-hidden="true"></div>
	{/if}
</header>

{#if divider}
	<div class={cn('-mt-1 border-b border-outline-variant/30', dividerClass)} aria-hidden="true"></div>
{/if}
