<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from '#lib/stores/toast.svelte.ts';
	import ConfirmDialog from '#lib/components/ui/ConfirmDialog.svelte';

	interface Props {
		open: boolean;
		target: { id: string; name?: string } | null;
		action?: string;
		title: string;
		message: string;
		successMessage?: string;
		failureMessage?: string;
		/** Called when the dialog is cancelled or the delete finished, so the page can drop its target. */
		onclose?: () => void;
	}

	let {
		open = $bindable(false),
		target,
		action = '?/delete',
		title,
		message,
		successMessage,
		failureMessage = 'Failed to delete.',
		onclose
	}: Props = $props();

	let formEl: HTMLFormElement;
	let deleting = $state(false);

	function confirm() {
		if (!target) return;
		deleting = true;
		// `value` below is already bound to target.id before the dialog opened.
		formEl.requestSubmit();
	}
</script>

<form
	method="POST"
	{action}
	bind:this={formEl}
	class="hidden"
	use:enhance={() =>
		async ({ result, update }) => {
			await update({ refreshAll: true });
			deleting = false;
			open = false;
			if (result.type === 'success') {
				if (successMessage) toast.success(successMessage);
			} else if (result.type === 'failure') {
				toast.error((result.data?.error as string) ?? failureMessage);
			}
			onclose?.();
		}}
>
	<input type="hidden" name="id" value={target?.id ?? ''} />
</form>

<ConfirmDialog
	bind:open
	{title}
	{message}
	confirmLabel="Delete"
	danger
	loading={deleting}
	onConfirm={confirm}
	onCancel={onclose}
/>
