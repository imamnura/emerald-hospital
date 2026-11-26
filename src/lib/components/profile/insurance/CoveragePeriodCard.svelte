<script lang="ts">
	import { Calendar } from '@lucide/svelte';

	interface Props {
		period: string;
		status: string;
	}

	let { period, status }: Props = $props();
</script>

<article
	class="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-4 shadow-[var(--shadow-card)]"
>
	<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
		<Calendar size={20} strokeWidth={2} />
	</span>
	<div class="min-w-0 flex-1">
		<p class="text-xs text-outline">Coverage Period</p>
		<p class="mt-0.5 font-heading text-sm font-bold text-on-surface">{period}</p>
	</div>
	<span class="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold tracking-wide text-primary">
		{status}
	</span>
</article>
