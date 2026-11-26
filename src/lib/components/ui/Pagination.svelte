<script lang="ts">
	import { page } from '$app/state';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { cn } from '#lib/utils/cn.ts';
	import { withParams } from '#lib/utils/url.ts';

	interface Props {
		page: number;
		pageSize: number;
		total: number;
		label?: string;
	}

	let { page: current, pageSize, total, label = 'rows' }: Props = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const startIdx = $derived(total === 0 ? 0 : (current - 1) * pageSize + 1);
	const endIdx = $derived(Math.min(total, current * pageSize));

	function hrefForPage(n: number): string {
		return withParams(
			page.url,
			{ page: n <= 1 ? null : String(n) },
			{ resetPage: false, relative: true }
		);
	}

	// Compact page-number window: first, last, current ±1, with ellipsis
	const visiblePages = $derived.by(() => {
		const max = totalPages;
		if (max <= 7) return Array.from({ length: max }, (_, i) => i + 1);
		const set = new Set<number>([1, max, current - 1, current, current + 1]);
		const arr = [...set].filter((n) => n >= 1 && n <= max).sort((a, b) => a - b);
		const out: (number | 'gap')[] = [];
		for (let i = 0; i < arr.length; i++) {
			if (i > 0 && arr[i] - arr[i - 1] > 1) out.push('gap');
			out.push(arr[i]);
		}
		return out;
	});
</script>

<div class="flex flex-col items-center justify-between gap-3 border-t border-outline-variant/20 px-4 py-3 sm:flex-row">
	<p class="text-xs text-outline">
		{#if total === 0}
			No {label}
		{:else}
			Showing <span class="font-semibold text-on-surface-variant">{startIdx}–{endIdx}</span>
			of <span class="font-semibold text-on-surface-variant">{total}</span>
			{label}
		{/if}
	</p>

	{#if totalPages > 1}
		<nav class="flex items-center gap-1" aria-label="Pagination">
			<a
				href={hrefForPage(Math.max(1, current - 1))}
				aria-disabled={current === 1}
				class={cn(
					'flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/50 text-on-surface-variant transition-colors hover:bg-surface-container',
					current === 1 && 'pointer-events-none opacity-40'
				)}
				aria-label="Previous page"
			>
				<ChevronLeft size={14} />
			</a>

			{#each visiblePages as p}
				{#if p === 'gap'}
					<span class="px-1.5 text-xs text-outline">…</span>
				{:else}
					<a
						href={hrefForPage(p)}
						class={cn(
							'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors',
							p === current
								? 'bg-primary text-on-primary shadow-primary'
								: 'border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container'
						)}
						aria-current={p === current ? 'page' : undefined}
					>
						{p}
					</a>
				{/if}
			{/each}

			<a
				href={hrefForPage(Math.min(totalPages, current + 1))}
				aria-disabled={current === totalPages}
				class={cn(
					'flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/50 text-on-surface-variant transition-colors hover:bg-surface-container',
					current === totalPages && 'pointer-events-none opacity-40'
				)}
				aria-label="Next page"
			>
				<ChevronRight size={14} />
			</a>
		</nav>
	{/if}
</div>
