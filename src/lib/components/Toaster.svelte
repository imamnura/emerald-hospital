<script lang="ts">
	import { fly } from 'svelte/transition';
	import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from '@lucide/svelte';
	import { toast, type ToastKind } from '$lib/stores/toast.svelte';
	import { cn } from '$lib/utils';

	const KIND_STYLES: Record<ToastKind, { wrap: string; icon: string; bar: string }> = {
		success: {
			wrap: 'border-primary/30 bg-surface-container-lowest',
			icon: 'text-primary',
			bar: 'bg-primary'
		},
		error: {
			wrap: 'border-red-200 bg-surface-container-lowest',
			icon: 'text-error',
			bar: 'bg-error'
		},
		info: {
			wrap: 'border-outline-variant bg-surface-container-lowest',
			icon: 'text-on-surface-variant',
			bar: 'bg-on-surface-variant'
		},
		warning: {
			wrap: 'border-amber-200 bg-surface-container-lowest',
			icon: 'text-amber-700',
			bar: 'bg-amber-500'
		}
	};
</script>

<div
	class="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end"
	aria-live="polite"
	aria-atomic="true"
>
	{#each toast.toasts as t (t.id)}
		{@const style = KIND_STYLES[t.kind]}
		<div
			class={cn(
				'pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border px-4 py-3 pr-9 shadow-[var(--shadow-card)]',
				style.wrap
			)}
			role={t.kind === 'error' ? 'alert' : 'status'}
			in:fly={{ y: 16, duration: 240 }}
			out:fly={{ y: 16, duration: 200 }}
		>
			<span class={cn('h-full w-1 absolute left-0 top-0', style.bar)} aria-hidden="true"></span>
			<span class={cn('mt-0.5 shrink-0', style.icon)}>
				{#if t.kind === 'success'}
					<CircleCheck size={18} strokeWidth={2} />
				{:else if t.kind === 'error'}
					<CircleAlert size={18} strokeWidth={2} />
				{:else if t.kind === 'warning'}
					<TriangleAlert size={18} strokeWidth={2} />
				{:else}
					<Info size={18} strokeWidth={2} />
				{/if}
			</span>
			<p class="min-w-0 flex-1 text-sm text-on-surface">{t.message}</p>
			<button
				type="button"
				class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-outline transition-colors hover:bg-surface-container hover:text-on-surface"
				aria-label="Dismiss notification"
				onclick={() => toast.dismiss(t.id)}
			>
				<X size={14} />
			</button>
		</div>
	{/each}
</div>
