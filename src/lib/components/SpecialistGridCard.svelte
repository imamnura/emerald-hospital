<script lang="ts">
	import { resolveSpecialistIcon } from '#lib/specialist-icons.ts';

	interface Props {
		name: string;
		slug: string;
		icon?: string | null;
	}

	let { name, slug, icon = 'stethoscope' }: Props = $props();

	const IconComponent = $derived(resolveSpecialistIcon(icon));
</script>

<a
	href="/specialists/{slug}"
	class="flex flex-col items-center rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-2 py-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md active:scale-[0.98]"
>
	<span
		class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"
	>
		<IconComponent size={26} strokeWidth={1.75} />
	</span>
	<span class="mt-3 text-center text-sm font-medium leading-tight text-primary">{name}</span>
</a>
