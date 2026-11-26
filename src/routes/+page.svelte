<script lang="ts">
	import BrandMark from '#lib/components/ui/BrandMark.svelte';
	import {
		LANDING_BRAND,
		LANDING_FEATURES,
		LANDING_FOOTER,
		LANDING_HERO,
		LANDING_HOSPITALS,
		LANDING_POPULAR_DOCTORS,
		LANDING_TESTIMONIALS,
		LANDING_TRUST_BADGES
	} from '#lib/data/landing.ts';
	import {
		ArrowRight,
		Calendar,
		CalendarClock,
		Mail,
		MapPin,
		MessageCircle,
		Phone,
		Search,
		ShieldCheck,
		Star
	} from '@lucide/svelte';
	import DoctorSummary from '#lib/components/doctor/DoctorSummary.svelte';
	import { goto } from '$app/navigation';
	import DoctorSearchForm from '#lib/components/doctor/DoctorSearchForm.svelte';
	import { findDoctorHref } from '#lib/utils/url.ts';

	let specialty = $state('');
	let hospital = $state(LANDING_HOSPITALS[0].value);
	let testimonialTab = $state<'doctor' | 'app'>('app');

	const activeTestimonials = $derived(
		testimonialTab === 'doctor'
			? LANDING_TESTIMONIALS.doctorReviews
			: LANDING_TESTIMONIALS.appReviews
	);

	function handleHeroSearch() {
		goto(findDoctorHref(specialty, hospital));
	}
</script>

<svelte:head>
	<title>{LANDING_BRAND.name} — Specialist Care in Purwakarta</title>
</svelte:head>

<div class="min-h-screen bg-surface">
	<!-- Hero -->
	<header class="relative overflow-hidden bg-gradient-to-b from-surface-container-low to-surface px-5 pb-10 pt-6 md:px-8 lg:px-12">
		<div class="mx-auto max-w-5xl">
			<BrandMark />

			<div
				class="mt-4 flex items-center gap-2 rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface-variant shadow-[var(--shadow-card)]"
			>
				<MapPin size={16} class="shrink-0 text-primary" />
				<span>
					<span class="font-semibold text-on-surface">{LANDING_BRAND.locationLabel}</span>
					<span class="text-outline"> · {LANDING_BRAND.locationSub}</span>
				</span>
			</div>

			<div class="mt-8 max-w-2xl">
				<h1 class="font-heading text-3xl font-bold leading-tight text-on-surface md:text-4xl">
					{LANDING_HERO.headline}
					<span class="text-primary">{LANDING_HERO.headlineHighlight}</span>
				</h1>
				<p class="mt-4 text-base leading-relaxed text-on-surface-variant md:text-lg">
					{LANDING_HERO.subheadline}
				</p>

				<a
					href="/login"
					class="mt-6 inline-flex w-full max-w-md items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-on-primary shadow-[var(--shadow-primary)] transition-transform active:scale-[0.98] sm:w-auto"
				>
					<Calendar size={20} />
					{LANDING_HERO.ctaLabel}
					<ArrowRight size={18} class="ml-auto opacity-80" />
				</a>
			</div>

			<DoctorSearchForm bind:specialty bind:hospital onsubmit={handleHeroSearch} class="mt-8" />

			<ul class="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
				{#each LANDING_TRUST_BADGES as badge (badge.id)}
					<li class="flex items-center gap-2 text-sm text-on-surface-variant">
						<ShieldCheck size={18} class="shrink-0 text-primary" />
						{badge.label}
					</li>
				{/each}
			</ul>
		</div>
	</header>

	<!-- Features -->
	<section class="px-5 py-12 md:px-8 lg:px-12">
		<div class="mx-auto max-w-5xl text-center">
			<h2 class="font-heading text-2xl font-bold text-on-surface md:text-3xl">
				{LANDING_FEATURES.title}
			</h2>
			<p class="mt-2 text-on-surface-variant">{LANDING_FEATURES.subtitle}</p>
		</div>
		<ul class="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
			{#each LANDING_FEATURES.items as feature, i (feature.id)}
				{@const icons = [Search, Star, CalendarClock]}
				{@const Icon = icons[i]}
				<li
					class="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6 text-left"
				>
					<div
						class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"
					>
						<Icon size={24} />
					</div>
					<h3 class="font-heading text-lg font-semibold text-on-surface">{feature.title}</h3>
					<p class="mt-2 text-sm leading-relaxed text-on-surface-variant">{feature.description}</p>
				</li>
			{/each}
		</ul>
	</section>

	<!-- Popular doctors -->
	<section class="bg-surface-container-low px-5 py-12 md:px-8 lg:px-12">
		<div class="mx-auto max-w-5xl">
			<div class="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2 class="font-heading text-2xl font-bold text-on-surface">
						{LANDING_POPULAR_DOCTORS.title}
					</h2>
					<p class="mt-1 text-sm text-on-surface-variant">{LANDING_POPULAR_DOCTORS.subtitle}</p>
				</div>
				<a
					href="/find-doctor"
					class="inline-flex items-center gap-1 text-sm font-semibold text-primary"
				>
					{LANDING_POPULAR_DOCTORS.viewAllLabel}
					<ArrowRight size={16} />
				</a>
			</div>
			<ul class="mt-8 flex flex-col gap-4">
				{#each LANDING_POPULAR_DOCTORS.doctors as doctor (doctor.id)}
					<DoctorSummary
						doctor={{ ...doctor, specialty: doctor.specialtyBadge, role: doctor.title }}
						variant="list"
					>
						{#snippet actions()}
							<a
								href="/login"
								class="inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-primary bg-surface-container-lowest px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-container-low sm:ml-auto"
							>
								Book Now
							</a>
						{/snippet}
					</DoctorSummary>
				{/each}
			</ul>
		</div>
	</section>

	<!-- Testimonials -->
	<section class="px-5 py-12 md:px-8 lg:px-12">
		<div class="mx-auto max-w-5xl">
			<h2 class="text-center font-heading text-2xl font-bold text-on-surface">
				{LANDING_TESTIMONIALS.title}
			</h2>
			<div class="mt-6 flex justify-center gap-2">
				{#each LANDING_TESTIMONIALS.tabs as tab (tab.id)}
					<button
						type="button"
						onclick={() => (testimonialTab = tab.id)}
						class="rounded-full px-4 py-2 text-sm font-semibold transition-colors {testimonialTab ===
						tab.id
							? 'bg-primary text-on-primary'
							: 'bg-surface-container text-on-surface-variant hover:bg-surface-container-low'}"
					>
						{tab.label}
					</button>
				{/each}
			</div>
			<ul class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each activeTestimonials as review (review.id)}
					<li
						class="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-[var(--shadow-card)]"
					>
						<div class="flex gap-0.5">
							{#each Array(review.rating) as _}
								<Star size={16} class="fill-amber-400 text-amber-400" />
							{/each}
						</div>
						<p class="mt-3 text-sm leading-relaxed text-on-surface-variant">{review.text}</p>
						<p class="mt-4 text-sm font-semibold text-on-surface">
							{review.author}<span class="font-normal text-outline">, {review.location}</span>
						</p>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<!-- Footer -->
	<footer class="bg-surface-container px-5 py-12 md:px-8 lg:px-12">
		<div class="mx-auto grid max-w-5xl gap-10 md:grid-cols-2 lg:grid-cols-3">
			<div>
				<BrandMark size="sm" />
				<p class="mt-4 text-sm leading-relaxed text-on-surface-variant">{LANDING_FOOTER.tagline}</p>
				<div class="mt-4 flex gap-2">
					{#each LANDING_FOOTER.socialLinks as social (social.id)}
						<a
							href={social.href}
							aria-label={social.label}
							class="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/50 bg-surface-container-lowest text-outline transition-colors hover:border-primary hover:text-primary"
						>
							<span class="text-xs font-bold">{social.label.charAt(0)}</span>
						</a>
					{/each}
				</div>
			</div>

			<div>
				<h3 class="font-heading font-semibold text-on-surface">
					{LANDING_FOOTER.developmentCenter.title}
				</h3>
				<p class="mt-2 flex gap-2 text-sm text-on-surface-variant">
					<MapPin size={16} class="mt-0.5 shrink-0 text-primary" />
					{LANDING_FOOTER.developmentCenter.address}
				</p>
			</div>

			<div>
				<h3 class="font-heading font-semibold text-on-surface">{LANDING_FOOTER.support.title}</h3>
				<ul class="mt-3 space-y-2 text-sm text-on-surface-variant">
					<li class="flex items-center gap-2">
						<Phone size={16} class="text-primary" />
						<a href="tel:{LANDING_FOOTER.support.phone}" class="hover:text-primary">
							{LANDING_FOOTER.support.phone}
						</a>
					</li>
					<li class="flex items-center gap-2">
						<Mail size={16} class="text-primary" />
						<a href="mailto:{LANDING_FOOTER.support.email}" class="hover:text-primary">
							{LANDING_FOOTER.support.email}
						</a>
					</li>
				</ul>
				<a
					href="https://wa.me/622642001234"
					target="_blank"
					rel="noopener noreferrer"
					class="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white"
				>
					<MessageCircle size={18} />
					{LANDING_FOOTER.support.chatLabel}
				</a>
			</div>
		</div>
		<p class="mx-auto mt-10 max-w-5xl border-t border-outline-variant/40 pt-6 text-center text-xs text-outline">
			{LANDING_FOOTER.copyright}
		</p>
	</footer>
</div>
