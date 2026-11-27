<script lang="ts">
	import { Building2, ChevronDown, Search } from '@lucide/svelte';
	import SpecialtyAutocomplete from '#lib/components/doctor/SpecialtyAutocomplete.svelte';
	import { LANDING_HERO, LANDING_HOSPITALS } from '#lib/data/landing.ts';
	import { cn } from '#lib/utils/cn.ts';

	interface Props {
		specialty: string;
		hospital: string;
		onsubmit: () => void;
		/** Extra classes for the form (outer spacing differs per page). */
		class?: string;
	}

	let {
		specialty = $bindable(),
		hospital = $bindable(),
		onsubmit,
		class: className
	}: Props = $props();
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		onsubmit();
	}}
	class={cn(
		'rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)] md:p-5',
		className
	)}
>
	<div class="flex flex-col gap-3 md:flex-row md:items-stretch">
		<SpecialtyAutocomplete
			bind:value={specialty}
			placeholder={LANDING_HERO.searchSpecialtyPlaceholder}
			class="flex-1"
		/>
		<label class="relative flex-1">
			<span class="sr-only">Hospital</span>
			<Building2
				size={18}
				class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
			/>
			<select
				bind:value={hospital}
				class="w-full appearance-none rounded-xl border border-outline-variant/50 bg-surface py-3 pl-10 pr-10 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			>
				{#each LANDING_HOSPITALS as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
			<ChevronDown
				size={16}
				class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline"
			/>
		</label>
		<button
			type="submit"
			class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-[var(--shadow-primary)] md:shrink-0"
		>
			<Search size={18} />
			{LANDING_HERO.searchButtonLabel}
		</button>
	</div>
</form>
