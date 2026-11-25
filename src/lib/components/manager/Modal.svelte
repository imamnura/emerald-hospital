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
		/** When set, the modal renders a Cancel + submit footer for the form with this id. */
		formId?: string;
		submitLabel?: string;
		submitting?: boolean;
	}

	let {
		open = $bindable(false),
		title,
		description,
		size = 'md',
		onClose,
		children,
		footer,
		formId,
		submitLabel = 'Save',
		submitting = false
	}: Props = $props();

	const sizeClass = $derived({ sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size]);
</script>

{#snippet formFooter()}
	<button
		type="button"
		class="rounded-xl border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
		onclick={() => (open = false)}
	>
		Cancel
	</button>
	<button
		type="submit"
		form={formId}
		disabled={submitting}
		class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-primary transition-transform active:scale-[0.98]"
	>
		{submitLabel}
	</button>
{/snippet}

<Dialog
	bind:open
	onclose={onClose}
	{title}
	{description}
	class={sizeClass}
	{children}
	footer={formId ? formFooter : footer}
/>
