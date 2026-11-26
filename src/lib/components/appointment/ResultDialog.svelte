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
		/** Blur the page behind the dialog. */
		blur?: boolean;
		/** Panel entrance: scale up (default) or fly up. */
		motion?: 'scale' | 'fly';
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
		showClose = false,
		blur = true,
		motion = 'scale'
	}: Props = $props();

	const uid = $props.id();
	const titleId = `${uid}-result-title`;

	function close() {
		open = false;
		onclose?.();
	}
</script>

<Dialog
	bind:open
	{onclose}
	variant="centered"
	labelledby={titleId}
	overlayClass={cn(
		'fixed inset-0 z-50 flex items-center justify-center p-5',
		blur ? 'bg-on-surface/40 backdrop-blur-md' : 'bg-on-surface/50'
	)}
	panelClass={cn(
		'w-full max-w-sm rounded-3xl bg-surface-container-lowest text-center shadow-xl',
		large ? 'p-8' : 'p-6'
	)}
	bodyClass="contents"
	motion={{
		fade: 200,
		panel:
			motion === 'scale'
				? { type: 'scale', start: 0.92, duration: 280 }
				: { type: 'fly', y: 24, duration: 280 }
	}}
>
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
