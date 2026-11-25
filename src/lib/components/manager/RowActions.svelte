<script lang="ts">
	import { Pencil, Trash2 } from '@lucide/svelte';

	interface Props {
		name: string;
		onedit: () => void;
		ondelete?: () => void;
	}

	let { name, onedit, ondelete }: Props = $props();
</script>

<div class="flex justify-end gap-1">
	<button
		type="button"
		class="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
		aria-label="Edit {name}"
		onclick={onedit}
	>
		<Pencil size={14} />
	</button>
	{#if ondelete}
		<button
			type="button"
			class="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
			aria-label="Delete {name}"
			onclick={ondelete}
		>
			<Trash2 size={14} />
		</button>
	{/if}
</div>
