<script lang="ts">
	import { enhance } from '$app/forms';
	import { Check } from '@lucide/svelte';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';
	import BackHeader from '#lib/components/layout/BackHeader.svelte';
	import SettingsCard from '#lib/components/settings/SettingsCard.svelte';
	import { cn } from '#lib/utils.ts';

	let { data } = $props();
</script>

<BackHeader title="Language" backHref="/profile/settings" divider dividerClass="mb-4" />

<MotionReveal delay={50}>
	<SettingsCard>
		{#each data.options as option, i (option.code)}
			<form method="POST" action="?/set" use:enhance>
				<input type="hidden" name="language" value={option.code} />
				<button
					type="submit"
					class={cn(
						'flex w-full items-center justify-between px-4 py-4 text-left transition-colors active:bg-surface-container',
						option.code === data.current && 'bg-primary/5'
					)}
				>
					<span class="text-sm font-medium text-on-surface">{option.label}</span>
					{#if option.code === data.current}
						<Check size={20} class="text-primary" strokeWidth={2.5} />
					{/if}
				</button>
			</form>
			{#if i < data.options.length - 1}
				<div class="mx-4 border-t border-outline-variant/35"></div>
			{/if}
		{/each}
	</SettingsCard>
</MotionReveal>
