<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		size?: 'sm' | 'md' | 'lg';
		onClose?: () => void;
		children: Snippet;
		footer?: Snippet;
	}

	let {
		open = $bindable(false),
		title,
		description,
		size = 'md',
		onClose,
		children,
		footer
	}: Props = $props();

	const sizeClass = $derived(
		{ sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size]
	);

	function close() {
		open = false;
		onClose?.();
	}

	function handleBackdropClick() {
		close();
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
		class="fixed inset-0 z-50 flex items-end justify-center bg-on-surface/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
		transition:fade={{ duration: 150 }}
	>
		<button
			type="button"
			class="absolute inset-0 cursor-default"
			aria-label="Close modal"
			tabindex="-1"
			onclick={handleBackdropClick}
		></button>

		<div
			class="relative flex w-full {sizeClass} max-h-[92vh] flex-col overflow-hidden rounded-t-3xl bg-surface-container-lowest shadow-2xl sm:rounded-2xl"
			transition:fly={{ y: 16, duration: 220 }}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			tabindex="-1"
		>
			<header class="flex items-start justify-between gap-3 border-b border-outline-variant/30 px-5 py-4">
				<div class="min-w-0">
					<h2 id="modal-title" class="font-heading text-base font-bold text-on-surface">{title}</h2>
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

			<div class="flex-1 overflow-y-auto px-5 py-5">
				{@render children()}
			</div>

			{#if footer}
				<footer class="flex items-center justify-end gap-2 border-t border-outline-variant/30 bg-surface-container-low/40 px-5 py-3">
					{@render footer()}
				</footer>
			{/if}
		</div>
	</div>
{/if}
