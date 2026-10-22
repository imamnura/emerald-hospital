<script lang="ts">
	import { page } from '$app/state';
	import {
		Activity,
		Building2,
		CalendarDays,
		ChevronDown,
		Clock,
		Download,
		FileSpreadsheet,
		Stethoscope,
		TrendingDown,
		TrendingUp
	} from '@lucide/svelte';
	import AreaChart from '#lib/components/charts/AreaChart.svelte';
	import BarChart from '#lib/components/charts/BarChart.svelte';
	import DonutChart from '#lib/components/charts/DonutChart.svelte';
	import { cn } from '#lib/utils.ts';

	let { data } = $props();

	const ranges = [
		{ value: '7d', label: '7 days' },
		{ value: '30d', label: '30 days' },
		{ value: '90d', label: '90 days' },
		{ value: '365d', label: '12 months' },
		{ value: 'all', label: 'All time' }
	] as const;

	const STATUS_COLORS: Record<string, string> = {
		pending: '#f59e0b',
		confirmed: '#005d42',
		completed: '#6e7a73',
		cancelled: '#ba1a1a'
	};

	const STATUS_LABELS: Record<string, string> = {
		pending: 'Pending',
		confirmed: 'Confirmed',
		completed: 'Completed',
		cancelled: 'Cancelled'
	};

	const donutData = $derived(
		data.status.map((s) => ({
			key: s.status,
			label: STATUS_LABELS[s.status],
			value: s.count,
			color: STATUS_COLORS[s.status]
		}))
	);

	const specialtyBars = $derived(
		data.bySpecialty.map((s) => ({
			key: s.specialty,
			label: s.specialty,
			value: s.total
		}))
	);

	const topDoctorBars = $derived(
		data.topDoctors.map((d) => ({
			key: d.id,
			label: d.name,
			sublabel: d.specialty,
			value: d.total
		}))
	);

	function formatDate(iso: string): string {
		return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	const exportHref = $derived.by(() => {
		const params = new URLSearchParams(page.url.searchParams.toString());
		return `/manager/export.csv?${params.toString()}`;
	});

	let exportingMsg = $state(false);

	function handleExport() {
		exportingMsg = true;
		// Trigger CSV download
		const a = document.createElement('a');
		a.href = exportHref;
		a.download = '';
		document.body.appendChild(a);
		a.click();
		a.remove();
		// Give the browser a moment, then open Google Sheets new doc
		setTimeout(() => {
			window.open('https://docs.google.com/spreadsheets/u/0/create', '_blank', 'noopener');
		}, 250);
		setTimeout(() => {
			exportingMsg = false;
		}, 8000);
	}

	const STATUS_BADGE: Record<string, string> = {
		pending: 'bg-amber-100 text-amber-800',
		confirmed: 'bg-primary/15 text-primary',
		completed: 'bg-surface-container text-on-surface-variant',
		cancelled: 'bg-red-100 text-red-800'
	};
</script>

<!-- Header -->
<header class="flex flex-col gap-1">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="font-heading text-2xl font-bold text-on-surface sm:text-3xl">Dashboard</h1>
			<p class="mt-1 text-sm text-outline">
				{data.rangeLabel} · live overview of hospital activity.
			</p>
		</div>
		<button
			type="button"
			onclick={handleExport}
			class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-primary transition-transform hover:translate-y-[-1px] active:scale-[0.98]"
		>
			<FileSpreadsheet size={16} strokeWidth={2.25} />
			Export to Google Sheets
		</button>
	</div>
	{#if exportingMsg}
		<div
			class="mt-2 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-on-surface-variant"
		>
			<Download size={14} class="mt-0.5 shrink-0 text-primary" />
			<p>
				CSV downloaded. Google Sheets opened in a new tab — choose
				<strong>File → Import → Upload</strong> and pick the downloaded file.
			</p>
		</div>
	{/if}
</header>

<!-- Filters -->
<form
	method="GET"
	class="mt-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)]"
>
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr,1fr,1fr,auto]">
		<div>
			<label
				for="range"
				class="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-outline"
			>
				Date range
			</label>
			<div class="relative">
				<CalendarDays
					size={16}
					class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
				/>
				<select
					id="range"
					name="range"
					value={data.filters.range}
					class="w-full appearance-none rounded-xl border border-outline-variant/50 bg-surface-container-lowest py-2.5 pl-9 pr-9 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				>
					{#each ranges as r}
						<option value={r.value}>{r.label}</option>
					{/each}
				</select>
				<ChevronDown
					size={16}
					class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline"
				/>
			</div>
		</div>
		<div>
			<label
				for="hospitalId"
				class="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-outline"
			>
				Hospital
			</label>
			<div class="relative">
				<Building2
					size={16}
					class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
				/>
				<select
					id="hospitalId"
					name="hospitalId"
					value={data.filters.hospitalId ?? ''}
					class="w-full appearance-none rounded-xl border border-outline-variant/50 bg-surface-container-lowest py-2.5 pl-9 pr-9 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				>
					<option value="">All hospitals</option>
					{#each data.filterOptions.hospitals as h}
						<option value={h.id}>{h.name}</option>
					{/each}
				</select>
				<ChevronDown
					size={16}
					class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline"
				/>
			</div>
		</div>
		<div>
			<label
				for="specialistId"
				class="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-outline"
			>
				Specialty
			</label>
			<div class="relative">
				<Stethoscope
					size={16}
					class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
				/>
				<select
					id="specialistId"
					name="specialistId"
					value={data.filters.specialistId ?? ''}
					class="w-full appearance-none rounded-xl border border-outline-variant/50 bg-surface-container-lowest py-2.5 pl-9 pr-9 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				>
					<option value="">All specialties</option>
					{#each data.filterOptions.specialists as s}
						<option value={s.id}>{s.name}</option>
					{/each}
				</select>
				<ChevronDown
					size={16}
					class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline"
				/>
			</div>
		</div>
		<div class="flex items-end gap-2">
			<button
				type="submit"
				class="h-[42px] flex-1 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary shadow-primary transition-transform active:scale-[0.98] lg:flex-initial"
			>
				Apply
			</button>
			<a
				href="/manager"
				class="flex h-[42px] items-center rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
			>
				Reset
			</a>
		</div>
	</div>
</form>

<!-- Stat cards -->
<section class="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
	{#snippet stat(icon: typeof Activity, label: string, value: number, trend: number | null, hint: string)}
		{@const Icon = icon}
		<article
			class="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)] transition-transform hover:translate-y-[-2px] sm:p-5"
		>
			<div class="flex items-start justify-between">
				<span
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
				>
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
	{/snippet}

	{@render stat(Building2, 'Hospitals', data.totals.hospitals, null, 'Total partner facilities')}
	{@render stat(Stethoscope, 'Doctors', data.totals.doctors, null, 'Across all specialties')}
	{@render stat(CalendarDays, 'Bookings', data.totals.bookings, data.trend.bookings, data.rangeLabel)}
	{@render stat(Clock, 'Pending', data.totals.pending, data.trend.pending, 'Awaiting confirmation')}
</section>

<!-- Charts row 1 -->
<section class="mt-6 grid gap-4 lg:grid-cols-3">
	<article
		class="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-5 shadow-[var(--shadow-card)] lg:col-span-2"
	>
		<div class="flex flex-wrap items-baseline justify-between gap-2">
			<div>
				<h2 class="font-heading text-base font-bold text-on-surface">Bookings over time</h2>
				<p class="text-xs text-outline">{data.rangeLabel}</p>
			</div>
			<div class="flex items-center gap-2 text-xs text-outline">
				<span class="h-2 w-2 rounded-full bg-primary"></span>
				Daily bookings
			</div>
		</div>
		<div class="mt-4">
			{#if data.series.length === 0}
				<p class="rounded-xl bg-surface-container-low p-8 text-center text-sm text-outline">
					No bookings in this range.
				</p>
			{:else}
				<AreaChart data={data.series} />
			{/if}
		</div>
	</article>

	<article
		class="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-5 shadow-[var(--shadow-card)]"
	>
		<h2 class="font-heading text-base font-bold text-on-surface">Status breakdown</h2>
		<p class="text-xs text-outline">Distribution of booking states</p>
		<div class="mt-4">
			<DonutChart data={donutData} centerLabel="Bookings" />
		</div>
	</article>
</section>

<!-- Charts row 2 -->
<section class="mt-4 grid gap-4 lg:grid-cols-2">
	<article
		class="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-5 shadow-[var(--shadow-card)]"
	>
		<h2 class="font-heading text-base font-bold text-on-surface">By specialty</h2>
		<p class="mb-4 text-xs text-outline">Booking volume per medical specialty</p>
		<BarChart data={specialtyBars} valueLabel="bookings" />
	</article>

	<article
		class="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-5 shadow-[var(--shadow-card)]"
	>
		<h2 class="font-heading text-base font-bold text-on-surface">Top doctors</h2>
		<p class="mb-4 text-xs text-outline">Most booked physicians in this period</p>
		<BarChart data={topDoctorBars} valueLabel="bookings" />
	</article>
</section>

<!-- Recent bookings -->
<section
	class="mt-4 overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-[var(--shadow-card)]"
>
	<div class="flex items-center justify-between gap-2 border-b border-outline-variant/20 px-5 py-4">
		<div>
			<h2 class="font-heading text-base font-bold text-on-surface">Recent bookings</h2>
			<p class="text-xs text-outline">Latest activity matching your filters</p>
		</div>
		<a href="/manager/bookings" class="text-sm font-semibold text-primary hover:underline">
			View all →
		</a>
	</div>

	{#if data.recent.length === 0}
		<p class="px-5 py-10 text-center text-sm text-outline">No bookings to show.</p>
	{:else}
		<!-- Desktop table -->
		<div class="hidden overflow-x-auto sm:block">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="bg-surface-container-low text-[11px] font-semibold uppercase tracking-wide text-outline">
						<th class="w-12 px-5 py-3 text-right">No.</th>
						<th class="px-5 py-3">Patient</th>
						<th class="px-5 py-3">Doctor</th>
						<th class="px-5 py-3">When</th>
						<th class="px-5 py-3">Status</th>
					</tr>
				</thead>
				<tbody>
					{#each data.recent as b, i (b.id)}
						<tr class="border-t border-outline-variant/20">
							<td class="px-5 py-3 text-right text-xs text-outline tabular-nums">{i + 1}</td>
							<td class="px-5 py-3 font-medium text-on-surface">{b.patient}</td>
							<td class="px-5 py-3">
								<p class="font-medium text-on-surface">{b.doctor}</p>
								<p class="text-xs text-outline">{b.specialty} · {b.hospital}</p>
							</td>
							<td class="px-5 py-3 text-on-surface-variant">
								{formatDate(b.date)}
								<span class="text-outline">· {b.time}</span>
							</td>
							<td class="px-5 py-3">
								<span
									class={cn(
										'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
										STATUS_BADGE[b.status]
									)}
								>
									{STATUS_LABELS[b.status]}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<!-- Mobile cards -->
		<ul class="divide-y divide-outline-variant/20 sm:hidden">
			{#each data.recent as b (b.id)}
				<li class="px-4 py-3">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="truncate text-sm font-semibold text-on-surface">{b.patient}</p>
							<p class="truncate text-xs text-outline">{b.doctor} · {b.specialty}</p>
							<p class="mt-1 text-xs text-on-surface-variant">
								{formatDate(b.date)} · {b.time}
							</p>
						</div>
						<span
							class={cn(
								'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
								STATUS_BADGE[b.status]
							)}
						>
							{STATUS_LABELS[b.status]}
						</span>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>
