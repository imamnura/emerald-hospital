<script lang="ts">
	import { TriangleAlert } from '@lucide/svelte';
	import Modal from './Modal.svelte';

	interface Props {
		open: boolean;
		title?: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		danger?: boolean;
		loading?: boolean;
		onConfirm: () => void | Promise<void>;
		onCancel?: () => void;
	}

	let {
		open = $bindable(false),
		title = 'Are you sure?',
		message,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		danger = false,
		loading = false,
		onConfirm,
		onCancel
	}: Props = $props();

	async function handleConfirm() {
		await onConfirm();
	}

	function handleCancel() {
		open = false;
		onCancel?.();
	}
</script>

<Modal bind:open size="sm" {title} onClose={handleCancel}>
	<div class="flex items-start gap-3">
		<span
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full {danger
				? 'bg-error-container/60 text-error'
				: 'bg-primary/10 text-primary'}"
		>
			<TriangleAlert size={20} strokeWidth={2} />
		</span>
		<p class="text-sm leading-relaxed text-on-surface-variant">{message}</p>
	</div>

	{#snippet footer()}
		<button
			type="button"
			class="rounded-xl border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
			onclick={handleCancel}
			disabled={loading}
		>
			{cancelLabel}
		</button>
		<button
			type="button"
			class="rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 {danger
				? 'bg-error text-on-primary hover:bg-error/90'
				: 'bg-primary text-on-primary hover:bg-primary/90'}"
			onclick={handleConfirm}
			disabled={loading}
		>
			{loading ? 'Working…' : confirmLabel}
		</button>
	{/snippet}
</Modal>
