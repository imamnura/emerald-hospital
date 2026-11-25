<script lang="ts">
	import type { Snippet } from 'svelte';
	import Dialog from '#lib/components/ui/Dialog.svelte';

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

	const sizeClass = $derived({ sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size]);
</script>

<Dialog bind:open onclose={onClose} {title} {description} class={sizeClass} {children} {footer} />
