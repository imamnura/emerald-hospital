<script lang="ts">
	import { formatDate } from '#lib/format/date.ts';

	type Point = { date: string; total: number };

	interface Props {
		data: Point[];
		height?: number;
		showXAxis?: boolean;
	}

	let { data, height = 220, showXAxis = true }: Props = $props();

	const width = 800; // viewBox width — scales responsively
	const padX = 28;
	const padTop = 16;
	const padBottom = $derived(showXAxis ? 28 : 12);

	const yMax = $derived(
		Math.max(
			1,
			data.reduce((m, p) => (p.total > m ? p.total : m), 0)
		)
	);

	const yTicks = $derived.by(() => {
		const max = yMax;
		const step = max <= 4 ? 1 : max <= 10 ? 2 : Math.ceil(max / 4);
		const ticks: number[] = [];
		for (let v = 0; v <= max; v += step) ticks.push(v);
		if (ticks[ticks.length - 1] !== max) ticks.push(max);
		return ticks;
	});

	const ticksMax = $derived(yTicks[yTicks.length - 1] ?? yMax);

	function xPos(i: number, len: number): number {
		if (len <= 1) return padX;
		return padX + (i * (width - padX * 2)) / (len - 1);
	}

	function yPos(v: number): number {
		return padTop + (height - padTop - padBottom) * (1 - v / ticksMax);
	}

	const linePath = $derived.by(() => {
		if (data.length === 0) return '';
		return data
			.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i, data.length).toFixed(2)} ${yPos(p.total).toFixed(2)}`)
			.join(' ');
	});

	const areaPath = $derived.by(() => {
		if (data.length === 0) return '';
		const first = `M ${xPos(0, data.length).toFixed(2)} ${yPos(0).toFixed(2)}`;
		const top = data
			.map((p, i) => `L ${xPos(i, data.length).toFixed(2)} ${yPos(p.total).toFixed(2)}`)
			.join(' ');
		const last = `L ${xPos(data.length - 1, data.length).toFixed(2)} ${yPos(0).toFixed(2)} Z`;
		return `${first} ${top} ${last}`;
	});

	// Pick ~5 evenly spaced x-axis labels (start, end, 3 in between)
	const xLabels = $derived.by(() => {
		if (data.length === 0) return [] as { x: number; label: string }[];
		const targetTicks = Math.min(5, data.length);
		const idxs =
			targetTicks <= 1
				? [0]
				: Array.from({ length: targetTicks }, (_, i) =>
						Math.round((i * (data.length - 1)) / (targetTicks - 1))
					);
		return idxs.map((i) => {
			return {
				x: xPos(i, data.length),
				label: formatDate(data[i].date, 'dayMonth')
			};
		});
	});

	let hoverIdx = $state<number | null>(null);
	let svgEl: SVGSVGElement;

	function handleMove(e: PointerEvent) {
		if (!svgEl || data.length === 0) return;
		const r = svgEl.getBoundingClientRect();
		const ratioX = (e.clientX - r.left) / r.width;
		const xLocal = padX + ratioX * (width - padX * 2);
		// Find nearest point
		let best = 0;
		let bestDist = Infinity;
		for (let i = 0; i < data.length; i++) {
			const d = Math.abs(xPos(i, data.length) - xLocal);
			if (d < bestDist) {
				bestDist = d;
				best = i;
			}
		}
		hoverIdx = best;
	}

	function handleLeave() {
		hoverIdx = null;
	}

	const tooltip = $derived.by(() => {
		if (hoverIdx == null || !data[hoverIdx]) return null;
		const p = data[hoverIdx];
		return {
			x: xPos(hoverIdx, data.length),
			y: yPos(p.total),
			label: formatDate(p.date, 'short'),
			value: p.total
		};
	});
</script>

<div class="w-full">
	<svg
		bind:this={svgEl}
		viewBox="0 0 {width} {height}"
		class="block w-full"
		preserveAspectRatio="none"
		role="img"
		aria-label="Bookings over time"
		onpointermove={handleMove}
		onpointerleave={handleLeave}
	>
		<defs>
			<linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.28" />
				<stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0" />
			</linearGradient>
		</defs>

		<!-- Horizontal grid -->
		{#each yTicks as t}
			<line
				x1={padX}
				x2={width - padX}
				y1={yPos(t)}
				y2={yPos(t)}
				stroke="var(--color-outline-variant)"
				stroke-opacity="0.4"
				stroke-dasharray="2 4"
			/>
			<text
				x={padX - 6}
				y={yPos(t) + 3}
				text-anchor="end"
				font-size="10"
				fill="var(--color-outline)"
			>
				{t}
			</text>
		{/each}

		{#if areaPath}
			<path d={areaPath} fill="url(#area-gradient)" />
		{/if}
		{#if linePath}
			<path
				d={linePath}
				fill="none"
				stroke="var(--color-primary)"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		{/if}

		<!-- X-axis labels -->
		{#if showXAxis}
			{#each xLabels as l}
				<text
					x={l.x}
					y={height - 8}
					text-anchor="middle"
					font-size="10"
					fill="var(--color-outline)"
				>
					{l.label}
				</text>
			{/each}
		{/if}

		<!-- Hover marker + tooltip -->
		{#if tooltip}
			<line
				x1={tooltip.x}
				x2={tooltip.x}
				y1={padTop}
				y2={height - padBottom}
				stroke="var(--color-primary)"
				stroke-opacity="0.4"
				stroke-dasharray="2 3"
			/>
			<circle
				cx={tooltip.x}
				cy={tooltip.y}
				r="4"
				fill="var(--color-primary)"
				stroke="white"
				stroke-width="2"
			/>
			<g transform="translate({Math.min(Math.max(tooltip.x - 60, padX), width - padX - 120)}, {Math.max(tooltip.y - 42, padTop)})">
				<rect width="120" height="36" rx="6" fill="var(--color-on-surface)" />
				<text x="8" y="14" font-size="10" fill="rgba(255,255,255,0.75)">
					{tooltip.label}
				</text>
				<text x="8" y="28" font-size="12" font-weight="700" fill="white">
					{tooltip.value} booking{tooltip.value === 1 ? '' : 's'}
				</text>
			</g>
		{/if}
	</svg>
</div>
