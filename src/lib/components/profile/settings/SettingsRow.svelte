<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import { ChevronRight } from '@lucide/svelte';

	interface Props {
		icon: Component<{ size?: number; strokeWidth?: number }>;
		label: string;
		/** Top divider line, for rows after the first in a card. */
		divider?: boolean;
		/** Renders a link row with a chevron. */
		href?: string;
		/** Right-hand content before the chevron, e.g. a value or a toggle. */
		trailing?: Snippet;
		/** Renders a `type="button"` row; without `href` / `onclick` the row is a submit button. */
		onclick?: () => void;
	}

	let { icon: Icon, label, divider = false, href, trailing, onclick }: Props = $props();

	const LINK = 'flex items-center gap-3 px-4 py-4 transition-colors active:bg-surface-container';
	const BUTTON = 'flex w-full items-center gap-3 px-4 py-4 text-left';
</script>

{#snippet content()}
	<span class="flex h-9 w-9 shrink-0 items-center justify-center text-on-surface-variant">
		<Icon size={20} strokeWidth={2} />
	</span>
	<span class="min-w-0 flex-1 text-sm font-medium text-on-surface">{label}</span>
	{@render trailing?.()}
	{#if href}
		<ChevronRight size={18} class="shrink-0 text-outline" />
	{/if}
{/snippet}

{#if divider}
	<div class="mx-4 border-t border-outline-variant/35"></div>
{/if}

{#if href}
	<a {href} class={LINK}>{@render content()}</a>
{:else}
	<button type={onclick ? 'button' : 'submit'} {onclick} class={BUTTON}>
		{@render content()}
	</button>
{/if}
