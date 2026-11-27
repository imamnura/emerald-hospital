<script module lang="ts">
	const RANGES = [
		{ value: '7d', label: '7 days' },
		{ value: '30d', label: '30 days' },
		{ value: '90d', label: '90 days' },
		{ value: '365d', label: '12 months' },
		{ value: 'all', label: 'All time' }
	] as const;

	const LABEL_CLASS = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-outline';
	const ICON_CLASS = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline';
	const CHEVRON_CLASS = 'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline';
	const SELECT_CLASS =
		'w-full appearance-none rounded-xl border border-outline-variant/50 bg-surface-container-lowest py-2.5 pl-9 pr-9 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
</script>

<script lang="ts">
	import { Building2, CalendarDays, ChevronDown, Stethoscope } from '@lucide/svelte';

	type Option = { id: string; name: string };

	interface Props {
		filters: { range: string; hospitalId: string | null; specialistId: string | null };
		hospitals: Option[];
		specialists: Option[];
	}

	let { filters, hospitals, specialists }: Props = $props();
</script>

<form
	method="GET"
	class="mt-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)]"
>
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr,1fr,1fr,auto]">
		<div>
			<label for="range" class={LABEL_CLASS}>Date range</label>
			<div class="relative">
				<CalendarDays size={16} class={ICON_CLASS} />
				<select id="range" name="range" value={filters.range} class={SELECT_CLASS}>
					{#each RANGES as r (r.value)}
						<option value={r.value}>{r.label}</option>
					{/each}
				</select>
				<ChevronDown size={16} class={CHEVRON_CLASS} />
			</div>
		</div>
		<div>
			<label for="hospitalId" class={LABEL_CLASS}>Hospital</label>
			<div class="relative">
				<Building2 size={16} class={ICON_CLASS} />
				<select
					id="hospitalId"
					name="hospitalId"
					value={filters.hospitalId ?? ''}
					class={SELECT_CLASS}
				>
					<option value="">All hospitals</option>
					{#each hospitals as h (h.id)}
						<option value={h.id}>{h.name}</option>
					{/each}
				</select>
				<ChevronDown size={16} class={CHEVRON_CLASS} />
			</div>
		</div>
		<div>
			<label for="specialistId" class={LABEL_CLASS}>Specialty</label>
			<div class="relative">
				<Stethoscope size={16} class={ICON_CLASS} />
				<select
					id="specialistId"
					name="specialistId"
					value={filters.specialistId ?? ''}
					class={SELECT_CLASS}
				>
					<option value="">All specialties</option>
					{#each specialists as s (s.id)}
						<option value={s.id}>{s.name}</option>
					{/each}
				</select>
				<ChevronDown size={16} class={CHEVRON_CLASS} />
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
