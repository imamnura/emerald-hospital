<script lang="ts">
	import { TrendingDown, TrendingUp } from '@lucide/svelte';
	import type { Component } from 'svelte';
	import { cn } from '#lib/utils/cn.ts';

	interface Props {
		icon: Component<{ size?: number; strokeWidth?: number }>;
		label: string;
		value: number;
		trend: number | null;
		hint: string;
	}

	let { icon: Icon, label, value, trend, hint }: Props = $props();
</script>

<article
	class="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)] transition-transform hover:translate-y-[-2px] sm:p-5"
>
	<div class="flex items-start justify-between">
		<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
			<Icon size={20} strokeWidth={2} />
		</span>
		{#if trend !== null}
			<span
				class={cn(
					'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
					trend >= 0 ? 'bg-primary/10 text-primary' : 'bg-error-container/60 text-error'
				)}
				title="vs previous period"
			>
				{#if trend >= 0}
					<TrendingUp size={11} strokeWidth={2.5} />
				{:else}
					<TrendingDown size={11} strokeWidth={2.5} />
				{/if}
				{trend >= 0 ? '+' : ''}{trend}%
			</span>
		{/if}
	</div>
	<p class="mt-4 font-heading text-2xl font-bold text-on-surface sm:text-3xl">{value}</p>
	<p class="mt-0.5 text-sm font-medium text-on-surface-variant">{label}</p>
	<p class="mt-2 text-[11px] text-outline">{hint}</p>
</article>
