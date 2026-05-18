<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		subtitle?: string;
		count?: number;
		countLabel?: string;
		actions?: Snippet;
	}

	let { title, subtitle, count, countLabel, actions }: Props = $props();
</script>

<header class="flex flex-wrap items-end justify-between gap-3">
	<div class="min-w-0">
		<div class="flex items-baseline gap-2">
			<h1 class="font-heading text-2xl font-bold text-on-surface sm:text-3xl">{title}</h1>
			{#if count != null}
				<span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
					{count}{countLabel ? ` ${countLabel}` : ''}
				</span>
			{/if}
		</div>
		{#if subtitle}
			<p class="mt-1 text-sm text-outline">{subtitle}</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex flex-wrap items-center gap-2">{@render actions()}</div>
	{/if}
</header>
