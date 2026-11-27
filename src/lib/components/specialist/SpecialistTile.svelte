<script lang="ts">
	import { resolveSpecialistIcon } from '#lib/domain/specialist.ts';
	import { cn } from '#lib/utils/cn.ts';

	interface Props {
		name: string;
		icon: string | null;
		href: string;
		/** `chip` = round home shortcut, `card` = grid card of the all-specialists page. */
		variant: 'chip' | 'card';
		/** Highlights a `chip`. */
		active?: boolean;
	}

	let { name, icon, href, variant, active = false }: Props = $props();

	const IconComponent = $derived(resolveSpecialistIcon(icon));
</script>

{#if variant === 'chip'}
	<a {href} class="flex shrink-0 flex-col items-center gap-2">
		<span
			class={cn(
				'flex h-16 w-16 items-center justify-center rounded-full transition-colors',
				active
					? 'bg-primary text-on-primary shadow-primary'
					: 'border border-outline-variant/60 bg-surface-container-lowest text-primary'
			)}
		>
			<IconComponent size={26} strokeWidth={1.75} />
		</span>
		<span class={cn('text-xs font-medium', active ? 'text-on-surface' : 'text-on-surface-variant')}>
			{name}
		</span>
	</a>
{:else}
	<a
		{href}
		class="flex flex-col items-center rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-2 py-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md active:scale-[0.98]"
	>
		<span
			class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"
		>
			<IconComponent size={26} strokeWidth={1.75} />
		</span>
		<span class="mt-3 text-center text-sm font-medium leading-tight text-primary">{name}</span>
	</a>
{/if}
