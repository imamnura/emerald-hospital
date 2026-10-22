<script lang="ts">
	import { Search, X } from '@lucide/svelte';
	import { cn } from '#lib/utils.ts';

	interface Props {
		value?: string;
		placeholder?: string;
		name?: string;
		showClear?: boolean;
		rounded?: 'full' | '2xl';
		onClear?: () => void;
		oninput?: () => void;
	}

	let {
		value = $bindable(''),
		placeholder = 'Search doctor, specialist, or hospital..',
		name = 'q',
		showClear = false,
		rounded = 'full',
		onClear,
		oninput
	}: Props = $props();

	function clear() {
		value = '';
		onClear?.();
	}
</script>

<div class="relative">
	<Search class="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
	<input
		type="search"
		{name}
		bind:value
		{oninput}
		{placeholder}
		class={cn(
			'w-full border border-outline-variant/60 bg-surface-container-lowest py-3.5 pl-11 pr-11 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
			rounded === '2xl' ? 'rounded-2xl' : 'rounded-full'
		)}
	/>
	{#if showClear && value}
		<button
			type="button"
			onclick={clear}
			class="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-outline hover:bg-surface-container"
			aria-label="Clear search"
		>
			<X size={16} />
		</button>
	{/if}
</div>
