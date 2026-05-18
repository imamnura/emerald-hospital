<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronRight } from '@lucide/svelte';

	interface Props {
		href: string;
		label: string;
		icon: Snippet;
	}

	let { href, label, icon }: Props = $props();
</script>

<a
	{href}
	class="flex items-center gap-3 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-3.5 shadow-[var(--shadow-card)] transition-colors active:bg-surface-container"
>
	<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
		{@render icon()}
	</span>
	<span class="min-w-0 flex-1 font-medium text-on-surface">{label}</span>
	<ChevronRight size={18} class="shrink-0 text-outline" />
</a>
