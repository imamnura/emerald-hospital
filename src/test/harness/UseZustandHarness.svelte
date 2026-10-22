<script lang="ts" generics="T extends object">
	import type { StoreApi } from 'zustand/vanilla';
	import { useZustand } from '#lib/stores/useZustand.svelte.ts';

	let { store, select }: { store: StoreApi<T>; select: (s: T) => unknown } = $props();

	// svelte-ignore state_referenced_locally
	const state = useZustand(store);
</script>

<output data-testid="value">{String(select(state))}</output>
