<script lang="ts">
	import { STATUS_HEX, getStatusLabel } from '#lib/domain/booking-status.ts';
	import { page } from '$app/state';
	import { Building2, CalendarDays, Clock, Download, FileSpreadsheet, Stethoscope } from '@lucide/svelte';
	import AreaChart from '#lib/components/manager/charts/AreaChart.svelte';
	import BarChart from '#lib/components/manager/charts/BarChart.svelte';
	import DonutChart from '#lib/components/manager/charts/DonutChart.svelte';
	import ChartCard from '#lib/components/manager/dashboard/ChartCard.svelte';
	import FilterBar from '#lib/components/manager/dashboard/FilterBar.svelte';
	import RecentBookings from '#lib/components/manager/dashboard/RecentBookings.svelte';
	import StatCard from '#lib/components/manager/dashboard/StatCard.svelte';

	let { data } = $props();

	const donutData = $derived(
		data.status.map((s) => ({
			key: s.status,
			label: getStatusLabel(s.status),
			value: s.count,
			color: STATUS_HEX[s.status]
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

<FilterBar
	filters={data.filters}
	hospitals={data.filterOptions.hospitals}
	specialists={data.filterOptions.specialists}
/>

<!-- Stat cards -->
<section class="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
	<StatCard
		icon={Building2}
		label="Hospitals"
		value={data.totals.hospitals}
		trend={null}
		hint="Total partner facilities"
	/>
	<StatCard
		icon={Stethoscope}
		label="Doctors"
		value={data.totals.doctors}
		trend={null}
		hint="Across all specialties"
	/>
	<StatCard
		icon={CalendarDays}
		label="Bookings"
		value={data.totals.bookings}
		trend={data.trend.bookings}
		hint={data.rangeLabel}
	/>
	<StatCard
		icon={Clock}
		label="Pending"
		value={data.totals.pending}
		trend={data.trend.pending}
		hint="Awaiting confirmation"
	/>
</section>

<!-- Charts row 1 -->
<section class="mt-6 grid gap-4 lg:grid-cols-3">
	<ChartCard class="lg:col-span-2">
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
	</ChartCard>

	<ChartCard>
		<h2 class="font-heading text-base font-bold text-on-surface">Status breakdown</h2>
		<p class="text-xs text-outline">Distribution of booking states</p>
		<div class="mt-4">
			<DonutChart data={donutData} centerLabel="Bookings" />
		</div>
	</ChartCard>
</section>

<!-- Charts row 2 -->
<section class="mt-4 grid gap-4 lg:grid-cols-2">
	<ChartCard>
		<h2 class="font-heading text-base font-bold text-on-surface">By specialty</h2>
		<p class="mb-4 text-xs text-outline">Booking volume per medical specialty</p>
		<BarChart data={specialtyBars} valueLabel="bookings" />
	</ChartCard>

	<ChartCard>
		<h2 class="font-heading text-base font-bold text-on-surface">Top doctors</h2>
		<p class="mb-4 text-xs text-outline">Most booked physicians in this period</p>
		<BarChart data={topDoctorBars} valueLabel="bookings" />
	</ChartCard>
</section>

<RecentBookings recent={data.recent} />
