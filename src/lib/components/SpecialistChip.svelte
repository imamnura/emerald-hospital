<script lang="ts">
	import { resolveSpecialistIcon } from '$lib/specialist-icons';
	import { cn } from '$lib/utils';

	interface Props {
		name: string;
		icon?: string | null;
		active?: boolean;
		href?: string;
	}

	let { name, icon = 'stethoscope', active = false, href = '#' }: Props = $props();

	const IconComponent = $derived(resolveSpecialistIcon(icon));
</script>

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
