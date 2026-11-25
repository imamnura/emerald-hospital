<script lang="ts">
	import { HeartPulse } from '@lucide/svelte';
	import { LANDING_BRAND } from '#lib/data/landing.ts';

	interface Props {
		/** `md` = bold icon stroke (page header), `sm` = regular stroke (footer). */
		size?: 'sm' | 'md';
	}

	let { size = 'md' }: Props = $props();
</script>

<div class="flex items-center gap-2">
	<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary">
		<HeartPulse size={20} strokeWidth={size === 'md' ? 2.5 : 2} />
	</div>
	<span class="font-heading text-lg font-bold text-primary">{LANDING_BRAND.name}</span>
</div>
