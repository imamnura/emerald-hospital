<script lang="ts">
	import type { Component } from 'svelte';

	/**
	 * Renders `component` with `bind:value` and mirrors the bound value into
	 * `[data-testid="bound-value"]` so tests can assert two-way binding.
	 */
	interface Props {
		component: Component<any>;
		value?: string;
		props?: Record<string, unknown>;
	}

	let { component: Comp, value = $bindable(''), props = {} }: Props = $props();
</script>

<Comp bind:value {...props} />
<output data-testid="bound-value">{value}</output>
