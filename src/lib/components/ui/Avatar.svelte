<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getInitials } from '#lib/format/text.ts';
	import { cn } from '#lib/utils.ts';

	interface Props {
		src?: string | null;
		name: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		/** Extra classes applied to both the image and the initials fallback. */
		class?: string;
		/** Colors/typography of the initials fallback (replaces the default). */
		fallbackClass?: string;
		/** Classes of the wrapper rendered only when `badge` is given. */
		wrapperClass?: string;
		/** Text shown without `src`; defaults to the initials of `name`. */
		initials?: string;
		badge?: Snippet;
	}

	const SIZES = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14', xl: 'h-28 w-28' } as const;

	let {
		src = null,
		name,
		size,
		class: className,
		fallbackClass = 'bg-primary/10 font-bold text-primary',
		wrapperClass,
		initials,
		badge
	}: Props = $props();

	const sizeClass = $derived(size ? SIZES[size] : undefined);
	const label = $derived(initials ?? getInitials(name));
</script>

{#snippet face()}
	{#if src}
		<img {src} alt={name} class={cn(sizeClass, 'rounded-full object-cover', className)} />
	{:else}
		<div
			class={cn(
				'flex items-center justify-center rounded-full',
				sizeClass,
				fallbackClass,
				className
			)}
		>
			{label}
		</div>
	{/if}
{/snippet}

{#if badge}
	<div class={cn('relative', wrapperClass)}>
		{@render face()}
		{@render badge()}
	</div>
{:else}
	{@render face()}
{/if}
