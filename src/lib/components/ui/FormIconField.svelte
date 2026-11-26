<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		id: string;
		label: string;
		name?: string;
		value?: string;
		type?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		readonly?: boolean;
		icon: Snippet;
		trailing?: Snippet;
	}

	let {
		id,
		label,
		name,
		value = $bindable(''),
		type = 'text',
		placeholder = '',
		required = false,
		disabled = false,
		readonly = false,
		icon,
		trailing
	}: Props = $props();

	const inputClass =
		'w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest py-3 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-surface-container disabled:text-outline';
</script>

<div>
	<label for={id} class="mb-1.5 block text-sm font-semibold text-on-surface-variant">{label}</label>
	<div class="relative">
		<span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
			{@render icon()}
		</span>
		<input
			{id}
			{name}
			{type}
			bind:value
			{placeholder}
			{required}
			{disabled}
			{readonly}
			class="{inputClass} pl-10 {trailing ? 'pr-10' : 'pr-4'}"
		/>
		{#if trailing}
			<span class="absolute right-3 top-1/2 -translate-y-1/2 text-outline">
				{@render trailing()}
			</span>
		{/if}
	</div>
</div>
