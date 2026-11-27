<script lang="ts">
	import DoctorSummary from '#lib/components/doctor/DoctorSummary.svelte';
	import BrandMark from '#lib/components/ui/BrandMark.svelte';
	import { goto } from '$app/navigation';
	import { findDoctorHref } from '#lib/utils/url.ts';
	import { ArrowLeft } from '@lucide/svelte';
	import { LANDING_BRAND } from '#lib/data/landing.ts';
	import { doctorRoleLabel } from '#lib/domain/specialist.ts';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';
	import DoctorSearchForm from '#lib/components/doctor/DoctorSearchForm.svelte';

	let { data } = $props();

	let specialty = $derived(data.query);
	let hospital = $derived(data.hospital || 'all');

	const isLoggedIn = $derived(Boolean(data.user));

	function bookHref(doctorId: string) {
		const target = `/doctors/${doctorId}/book`;
		return isLoggedIn ? target : `/login?redirect=${encodeURIComponent(target)}`;
	}

	function submitSearch() {
		goto(findDoctorHref(specialty, hospital), { reset: false });
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

			<DoctorSearchForm bind:specialty bind:hospital onsubmit={submitSearch} class="mt-6" />
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
							<DoctorSummary
								doctor={{ ...doctor, role: doctorRoleLabel(doctor.specialty, doctor.rating) }}
								variant="list"
							>
								{#snippet actions()}
									<a
										href={bookHref(doctor.id)}
										class="inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-primary bg-surface-container-lowest px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-container-low sm:ml-auto"
									>
										Book Now
									</a>
								{/snippet}
							</DoctorSummary>
						{/each}
					{/if}
				</ul>
			</MotionReveal>
		</div>
	</section>
</div>
