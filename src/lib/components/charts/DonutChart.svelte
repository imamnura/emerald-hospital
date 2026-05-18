<script lang="ts">
	type Segment = {
		key: string;
		label: string;
		value: number;
		color: string;
	};

	interface Props {
		data: Segment[];
		size?: number;
		thickness?: number;
		centerLabel?: string;
	}

	let { data, size = 180, thickness = 22, centerLabel = 'Total' }: Props = $props();

	const cx = $derived(size / 2);
	const cy = $derived(size / 2);
	const r = $derived((size - thickness) / 2);
	const total = $derived(data.reduce((s, d) => s + d.value, 0));

	function polar(angle: number, radius: number): [number, number] {
		const rad = ((angle - 90) * Math.PI) / 180;
		return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
	}

	function arc(startAngle: number, endAngle: number): string {
		const [x1, y1] = polar(startAngle, r);
		const [x2, y2] = polar(endAngle, r);
		const large = endAngle - startAngle > 180 ? 1 : 0;
		return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
	}

	const segments = $derived.by(() => {
		if (total === 0) return [] as { d: string; color: string; key: string; label: string; value: number; pct: number }[];
		let cursor = 0;
		return data
			.filter((d) => d.value > 0)
			.map((d) => {
				const sweep = (d.value / total) * 360;
				// Avoid full-circle as a single arc (renders nothing)
				const end = cursor + Math.min(sweep, 359.999);
				const out = {
					d: arc(cursor, end),
					color: d.color,
					key: d.key,
					label: d.label,
					value: d.value,
					pct: Math.round((d.value / total) * 100)
				};
				cursor = end;
				return out;
			});
	});

	let hoverKey = $state<string | null>(null);
	const hovered = $derived(segments.find((s) => s.key === hoverKey) ?? null);
</script>

<div class="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
	<div class="relative shrink-0" style="width: {size}px; height: {size}px;">
		<svg viewBox="0 0 {size} {size}" width={size} height={size} role="img" aria-label="Status breakdown">
			<!-- track -->
			<circle
				{cx}
				{cy}
				r={r}
				fill="none"
				stroke="var(--color-surface-container)"
				stroke-width={thickness}
			/>
			{#each segments as seg (seg.key)}
				<path
					d={seg.d}
					fill="none"
					stroke={seg.color}
					stroke-width={thickness}
					stroke-linecap="butt"
					role="presentation"
					aria-hidden="true"
					class="transition-opacity"
					style="opacity: {hoverKey == null || hoverKey === seg.key ? 1 : 0.35};"
					onpointerenter={() => (hoverKey = seg.key)}
					onpointerleave={() => (hoverKey = null)}
				/>
			{/each}
		</svg>
		<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
			<p class="text-xs font-medium text-outline">{hovered ? hovered.label : centerLabel}</p>
			<p class="font-heading text-2xl font-bold text-on-surface">
				{hovered ? hovered.value : total}
			</p>
			{#if hovered}
				<p class="text-[10px] font-semibold text-primary">{hovered.pct}%</p>
			{/if}
		</div>
	</div>

	<ul class="flex w-full min-w-0 flex-col gap-2 text-sm">
		{#each data as d (d.key)}
			<li
				class="flex items-center justify-between gap-3 rounded-lg px-2 py-1 transition-colors"
				class:bg-surface-container={hoverKey === d.key}
				onpointerenter={() => (hoverKey = d.key)}
				onpointerleave={() => (hoverKey = null)}
				role="listitem"
			>
				<span class="flex items-center gap-2 min-w-0">
					<span class="h-2.5 w-2.5 shrink-0 rounded-full" style="background-color: {d.color}"></span>
					<span class="truncate text-on-surface-variant">{d.label}</span>
				</span>
				<span class="shrink-0 font-heading font-bold text-on-surface">{d.value}</span>
			</li>
		{/each}
	</ul>
</div>
