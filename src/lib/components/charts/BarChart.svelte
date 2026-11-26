<script lang="ts">
	type Row = {
		key: string;
		label: string;
		sublabel?: string;
		value: number;
	};

	interface Props {
		data: Row[];
		valueLabel?: string;
	}

	const MAX_ROWS = 8;

	let { data, valueLabel = '' }: Props = $props();

	const visible = $derived(data.slice(0, MAX_ROWS));
	const max = $derived(
		Math.max(
			1,
			visible.reduce((m, r) => (r.value > m ? r.value : m), 0)
		)
	);
</script>

<ul class="flex flex-col gap-3">
	{#if visible.length === 0}
		<li class="rounded-xl bg-surface-container-low p-6 text-center text-sm text-outline">
			No data for the selected filters.
		</li>
	{/if}
	{#each visible as row (row.key)}
		<li class="flex items-center gap-3">
			<div class="min-w-0 flex-1">
				<div class="flex items-baseline justify-between gap-2">
					<p class="truncate text-sm font-semibold text-on-surface">{row.label}</p>
					<p class="shrink-0 font-heading text-sm font-bold text-primary">
						{row.value}{valueLabel ? ` ${valueLabel}` : ''}
					</p>
				</div>
				{#if row.sublabel}
					<p class="truncate text-xs text-outline">{row.sublabel}</p>
				{/if}
				<div class="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-container">
					<div
						class="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
						style="width: {(row.value / max) * 100}%;"
					></div>
				</div>
			</div>
		</li>
	{/each}
</ul>
