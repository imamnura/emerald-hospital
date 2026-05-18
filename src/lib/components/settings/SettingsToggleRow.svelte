<script lang="ts">
	import type { Snippet } from 'svelte';
	import SettingsToggle from './SettingsToggle.svelte';

	interface Props {
		label: string;
		checked: boolean;
		icon: Snippet;
		showDivider?: boolean;
	}

	let { label, checked, icon, showDivider = false }: Props = $props();
</script>

{#if showDivider}
	<div class="mx-4 border-t border-outline-variant/35"></div>
{/if}

<div class="flex items-center gap-3 px-4 py-4">
	<span class="flex h-9 w-9 shrink-0 items-center justify-center text-on-surface-variant">
		{@render icon()}
	</span>
	<span class="min-w-0 flex-1 text-sm font-medium text-on-surface">{label}</span>
	<SettingsToggle {checked} ariaLabel={label} />
</div>
