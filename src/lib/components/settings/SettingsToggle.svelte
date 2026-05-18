<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		checked: boolean;
		disabled?: boolean;
		ariaLabel: string;
	}

	let { checked, disabled = false, ariaLabel }: Props = $props();
</script>

<span
	role="presentation"
	class={cn(
		'relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors duration-200',
		checked ? 'bg-primary' : 'bg-outline-variant/50',
		disabled && 'opacity-60'
	)}
>
	<span
		class={cn(
			'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200',
			checked ? 'translate-x-5' : 'translate-x-0'
		)}
		aria-hidden="true"
	></span>
	<span class="sr-only">{ariaLabel}</span>
</span>
