<script lang="ts">
	import BrandMark from '#lib/components/ui/BrandMark.svelte';
	import { goto } from '$app/navigation';
	import { withParams } from '#lib/utils/url.ts';
	import {
		ArrowLeft,
		Building2,
		ChevronDown,
		MapPin,
		Search,
		Star
	} from '@lucide/svelte';
	import { LANDING_BRAND, LANDING_HERO, LANDING_HOSPITALS } from '#lib/data/landing.ts';
	import { doctorRoleLabel } from '#lib/domain/specialist.ts';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';
	import SpecialtyAutocomplete from '#lib/components/SpecialtyAutocomplete.svelte';

	let { data } = $props();

	let specialty = $state('');
	let hospital = $state('all');

	$effect.pre(() => {
		specialty = data.query;
		hospital = data.hospital || 'all';
	});

	const isLoggedIn = $derived(Boolean(data.user));

	function bookHref(doctorId: string) {
		const target = `/doctors/${doctorId}/book`;
		return isLoggedIn ? target : `/login?redirect=${encodeURIComponent(target)}`;
	}

	const FIND_DOCTOR_URL = new URL('/find-doctor', 'http://localhost');

	function submitSearch(e: SubmitEvent) {
		e.preventDefault();
		const q = specialty.trim();
		goto(withParams(FIND_DOCTOR_URL, { q, hospital: hospital === 'all' ? null : hospital }), {
			reset: false
		});
	}
</script>

<svelte:head>
	<title>Search Doctors — {LANDING_BRAND.name}</title>
</svelte:head>

<div class="min-h-screen bg-surface">
	<header
		class="relative overflow-hidden bg-gradient-to-b from-surface-container-low to-surface px-5 pb-8 pt-6 md:px-8 lg:px-12"
	>
		<div class="mx-auto max-w-5xl">
			<div class="flex items-center justify-between">
				<a
					href="/"
					class="inline-flex items-center gap-1 text-sm font-semibold text-primary"
				>
					<ArrowLeft size={16} /> Back
				</a>
				<BrandMark />
			</div>

			<div class="mt-6">
				<h1 class="font-heading text-2xl font-bold text-on-surface md:text-3xl">
					Search Results
				</h1>
				<p class="mt-1 text-sm text-on-surface-variant">
					{#if data.query}
						Doctors matching <span class="font-semibold text-on-surface">"{data.query}"</span>
					{:else}
						All available specialist doctors
					{/if}
				</p>
			</div>

			<form
				onsubmit={submitSearch}
				class="mt-6 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)] md:p-5"
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
		</div>
	</header>

	<section class="px-5 py-8 md:px-8 lg:px-12">
		<div class="mx-auto max-w-5xl">
			<p class="text-sm text-on-surface-variant">
				<span class="font-semibold text-on-surface">{data.doctors.length}</span>
				{data.doctors.length === 1 ? 'doctor' : 'doctors'} found
			</p>

			<MotionReveal delay={80}>
				<ul class="mt-6 flex flex-col gap-4">
					{#if data.doctors.length === 0}
						<li
							class="rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-low p-10 text-center text-sm text-outline"
						>
							No doctors match your search. Try a different specialty.
						</li>
					{:else}
						{#each data.doctors as doctor (doctor.id)}
							<li
								class="flex flex-col gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center"
							>
								<div class="flex min-w-0 flex-1 items-center gap-4">
									{#if doctor.imageUrl}
										<img
											src={doctor.imageUrl}
											alt={doctor.name}
											class="h-16 w-16 shrink-0 rounded-full object-cover"
											width="64"
											height="64"
										/>
									{:else}
										<div
											class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface-container text-lg font-semibold text-primary"
										>
											{doctor.name.charAt(0)}
										</div>
									{/if}
									<div class="min-w-0">
										<span
											class="inline-block rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold text-primary"
										>
											{doctor.specialty}
										</span>
										<p class="mt-1 truncate font-heading font-semibold text-on-surface">
											{doctor.name}
										</p>
										<p class="text-sm text-on-surface-variant">
											{doctorRoleLabel(doctor.specialty, doctor.rating)}
										</p>
										<p class="mt-1 flex items-center gap-1 text-sm text-outline">
											<MapPin size={14} class="shrink-0 text-primary" />
											<span class="truncate">{doctor.hospital}</span>
										</p>
										<p class="mt-1 flex items-center gap-1 text-sm text-on-surface-variant">
											<Star size={14} class="fill-amber-400 text-amber-400" />
											<span class="font-semibold text-on-surface">{doctor.rating}</span>
											<span class="text-outline">({doctor.reviewCount} reviews)</span>
										</p>
									</div>
								</div>
								<a
									href={bookHref(doctor.id)}
									class="inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-primary bg-surface-container-lowest px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-container-low sm:ml-auto"
								>
									Book Now
								</a>
							</li>
						{/each}
					{/if}
				</ul>
			</MotionReveal>
		</div>
	</section>
</div>
