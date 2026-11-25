<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { cn } from '#lib/utils.ts';

	interface Props {
		open: boolean;
		onclose?: () => void;
		title?: string;
		description?: string;
		variant?: 'sheet' | 'centered';
		class?: string;
		children: Snippet;
		footer?: Snippet;
	}

	let {
		open = $bindable(false),
		onclose,
		title,
		description,
		variant = 'sheet',
		class: className,
		children,
		footer
	}: Props = $props();

	const uid = $props.id();
	const titleId = `${uid}-title`;

	const overlayClass = $derived(
		variant === 'sheet' ? 'items-end p-0 sm:items-center sm:p-4' : 'items-center p-4'
	);
	const panelClass = $derived(variant === 'sheet' ? 'rounded-t-3xl sm:rounded-2xl' : 'rounded-2xl');

	function close() {
		open = false;
		onclose?.();
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			e.preventDefault();
			close();
		}
	}
</script>

<svelte:window onkeydown={handleKey} />

{#if open}
	<div
		class={cn(
			'fixed inset-0 z-50 flex justify-center bg-on-surface/40 backdrop-blur-sm',
			overlayClass
		)}
		transition:fade={{ duration: 150 }}
	>
		<button
			type="button"
			class="absolute inset-0 cursor-default"
			aria-label="Close modal"
			tabindex="-1"
			onclick={close}
		></button>

		<div
			class={cn(
				'relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-surface-container-lowest shadow-2xl',
				panelClass,
				className
			)}
			transition:fly={{ y: 16, duration: 220 }}
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? titleId : undefined}
			tabindex="-1"
		>
			{#if title}
				<header
					class="flex items-start justify-between gap-3 border-b border-outline-variant/30 px-5 py-4"
				>
					<div class="min-w-0">
						<h2 id={titleId} class="font-heading text-base font-bold text-on-surface">{title}</h2>
						{#if description}
							<p class="mt-0.5 text-xs text-outline">{description}</p>
						{/if}
					</div>
					<button
						type="button"
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container hover:text-on-surface"
						aria-label="Close"
						onclick={close}
					>
						<X size={18} />
					</button>
				</header>
			{/if}

			<div class="flex-1 overflow-y-auto px-5 py-5">
				{@render children()}
			</div>

			{#if footer}
				<footer
					class="flex items-center justify-end gap-2 border-t border-outline-variant/30 bg-surface-container-low/40 px-5 py-3"
				>
					{@render footer()}
				</footer>
			{/if}
		</div>
	</div>
{/if}
