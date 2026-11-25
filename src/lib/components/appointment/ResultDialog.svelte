<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from '@lucide/svelte';
	import Dialog from '#lib/components/ui/Dialog.svelte';
	import { cn } from '#lib/utils.ts';

	interface Props {
		open: boolean;
		tone: 'success' | 'danger';
		title: string;
		icon: Snippet;
		body: Snippet;
		actions: Snippet;
		onclose?: () => void;
		/** Larger title with more space above it. */
		large?: boolean;
		/** Corner close button (in addition to the backdrop). */
		showClose?: boolean;
	}

	let {
		open = $bindable(false),
		tone,
		title,
		icon,
		body,
		actions,
		onclose,
		large = false,
		showClose = false
	}: Props = $props();

	const uid = $props.id();
	const titleId = `${uid}-result-title`;

	function close() {
		open = false;
		onclose?.();
	}
</script>

<Dialog bind:open {onclose} variant="centered" labelledby={titleId} class="max-w-sm text-center">
	{#if showClose}
		<button
			type="button"
			class="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-outline transition-colors hover:bg-surface-container"
			aria-label="Close"
			onclick={close}
		>
			<X size={20} />
		</button>
	{/if}

	<div
		class={cn(
			'mx-auto flex items-center justify-center rounded-full',
			tone === 'success' ? 'h-20 w-20 bg-primary/15' : 'h-16 w-16 bg-error-container/80'
		)}
	>
		{@render icon()}
	</div>

	<h2
		id={titleId}
		class={cn(
			'font-heading font-bold text-on-surface',
			large ? 'mt-6 text-2xl' : 'mt-5 text-xl'
		)}
	>
		{title}
	</h2>
	{@render body()}
	{@render actions()}
</Dialog>
