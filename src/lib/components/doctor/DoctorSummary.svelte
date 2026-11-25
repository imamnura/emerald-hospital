<script module lang="ts">
	export interface DoctorSummaryData {
		id: string;
		name: string;
		imageUrl?: string | null;
		specialty?: string;
		/** Role line under the name (`list` / `grid` variants). */
		role?: string;
		hospital?: string;
		rating?: string | number;
		reviewCount?: number;
		isOnline?: boolean;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { MapPin, Star } from '@lucide/svelte';
	import Avatar from '#lib/components/ui/Avatar.svelte';

	interface Props {
		doctor: DoctorSummaryData;
		/**
		 * `compact` home card, `search` search result (bookmark via `trailing`),
		 * `list` row with `actions` (find-doctor / landing, renders an `<li>`),
		 * `grid` specialist card with profile / book links.
		 */
		variant: 'compact' | 'search' | 'list' | 'grid';
		/** Profile link; defaults to `/doctors/{id}`. */
		href?: string;
		actions?: Snippet;
		trailing?: Snippet;
	}

	let { doctor, variant, href, actions, trailing }: Props = $props();

	const { id, name, imageUrl = null, specialty, role, hospital, isOnline = false } = $derived(doctor);
	const { rating = '4.5', reviewCount = 120 } = $derived(doctor);
	const profileHref = $derived(href ?? `/doctors/${id ?? ""}`);
	const FALLBACK = 'bg-surface-container text-lg font-semibold text-primary';
</script>

{#if variant === 'compact'}
	<a
		href={profileHref}
		class="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md"
	>
		<Avatar
			src={imageUrl}
			{name}
			initials={name.charAt(0)}
			class="h-16 w-16"
			fallbackClass={FALLBACK}
			wrapperClass="shrink-0"
		>
			{#snippet badge()}
				<span
					class="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white {isOnline
						? 'bg-emerald-500'
						: 'bg-outline-variant'}"
				></span>
			{/snippet}
		</Avatar>

		<div class="min-w-0 flex-1">
			<p class="truncate font-heading font-semibold text-on-surface">{name}</p>
			<p class="text-sm font-medium text-primary">{specialty}</p>
			<p class="mt-0.5 flex items-center gap-1 text-xs text-outline">
				<MapPin size={12} />
				<span class="truncate">{hospital}</span>
			</p>
		</div>

		<div
			class="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
		>
			<Star size={12} class="fill-primary" />
			{rating}
		</div>
	</a>
{:else if variant === 'search'}
	<article
		class="relative rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)]"
	>
		{@render trailing?.()}

		<a href={profileHref} class="flex gap-3 pr-8">
			<Avatar
				src={imageUrl}
				{name}
				initials={name.charAt(0)}
				class="h-16 w-16 shrink-0"
				fallbackClass={FALLBACK}
			/>

			<div class="min-w-0 flex-1">
				<p class="truncate font-heading text-base font-bold text-on-surface">{name}</p>
				<p class="text-sm font-medium text-primary">{specialty}</p>

				<div class="mt-3 flex flex-wrap items-center gap-2">
					<span
						class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
					>
						<Star size={12} class="fill-primary" />
						{rating}
						<span class="font-normal text-on-surface-variant">({reviewCount})</span>
					</span>
					<span class="flex items-center gap-1 text-xs text-outline">
						<MapPin size={12} />
						<span class="truncate">{hospital}</span>
					</span>
				</div>
			</div>
		</a>
	</article>
{:else if variant === 'list'}
	<li
		class="flex flex-col gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center"
	>
		<div class="flex min-w-0 flex-1 items-center gap-4">
			<Avatar
				src={imageUrl}
				{name}
				initials={name.charAt(0)}
				class="h-16 w-16 shrink-0"
				fallbackClass={FALLBACK}
			/>
			<div class="min-w-0">
				<span
					class="inline-block rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold text-primary"
				>
					{specialty}
				</span>
				<p class="mt-1 truncate font-heading font-semibold text-on-surface">{name}</p>
				<p class="text-sm text-on-surface-variant">{role}</p>
				{#if hospital !== undefined}
					<p class="mt-1 flex items-center gap-1 text-sm text-outline">
						<MapPin size={14} class="shrink-0 text-primary" />
						<span class="truncate">{hospital}</span>
					</p>
				{/if}
				<p class="mt-1 flex items-center gap-1 text-sm text-on-surface-variant">
					<Star size={14} class="fill-amber-400 text-amber-400" />
					<span class="font-semibold text-on-surface">{rating}</span>
					<span class="text-outline">({reviewCount} reviews)</span>
				</p>
			</div>
		</div>
		{@render actions?.()}
	</li>
{:else}
	<article
		class="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)]"
	>
		<div class="flex gap-3">
			<Avatar
				src={imageUrl}
				{name}
				initials={name.charAt(0)}
				class="h-16 w-16 shrink-0"
				fallbackClass={FALLBACK}
			/>

			<div class="min-w-0 flex-1">
				<p class="truncate font-heading text-base font-bold text-on-surface">{name}</p>
				<p class="text-sm font-medium text-primary">{role}</p>
				<p class="mt-1.5 flex items-center gap-1 text-sm text-on-surface-variant">
					<Star size={14} class="fill-primary text-primary" />
					<span class="font-semibold text-on-surface">{rating}</span>
					<span class="text-outline">({reviewCount} Reviews)</span>
				</p>
				<p class="mt-1 flex items-center gap-1 text-sm text-outline">
					<MapPin size={14} class="shrink-0" />
					<span class="truncate">{hospital}</span>
				</p>
			</div>
		</div>

		<div class="mt-4 grid grid-cols-2 gap-3">
			<a
				href={profileHref}
				class="rounded-xl bg-surface-container py-3 text-center text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
			>
				View Profile
			</a>
			<a
				href="{profileHref}/book"
				class="rounded-xl bg-primary py-3 text-center text-sm font-semibold text-on-primary shadow-primary transition active:scale-[0.98]"
			>
				Book Now
			</a>
		</div>
	</article>
{/if}
