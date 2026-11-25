<script lang="ts">
	import { cn } from '#lib/utils.ts';

	interface Props {
		kind?: 'error' | 'success' | 'info';
		message: string | null | undefined;
		/** Extra classes, e.g. a top margin. */
		class?: string;
	}

	const KINDS = {
		error: 'rounded-xl bg-error-container px-4 py-3 text-sm text-error',
		success: 'rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary',
		info: 'rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface-variant'
	} as const;

	let { kind = 'error', message, class: className }: Props = $props();
</script>

{#if message}
	<p class={cn(KINDS[kind], className)}>{message}</p>
{/if}
