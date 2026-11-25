<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Search } from '@lucide/svelte';

	interface Props {
		value: string;
		placeholder: string;
		onsubmit: (q: string) => void;
		/** Extra controls rendered after the search box; switches the form to a grid layout. */
		filters?: Snippet;
		/** Grid column classes used together with `filters`. */
		class?: string;
	}

	let { value = $bindable(''), placeholder, onsubmit, filters, class: className }: Props = $props();

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		onsubmit(value.trim());
	}
</script>

{#snippet searchBox()}
	<Search
		size={16}
		class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
	/>
	<input
		type="search"
		name="q"
		bind:value
		{placeholder}
		class="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-2.5 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
	/>
{/snippet}

{#if filters}
	<form onsubmit={handleSubmit} class={['grid gap-2', className]}>
		<div class="relative">
			{@render searchBox()}
		</div>
		{@render filters()}
	</form>
{:else}
	<form onsubmit={handleSubmit} class="relative">
		{@render searchBox()}
	</form>
{/if}
