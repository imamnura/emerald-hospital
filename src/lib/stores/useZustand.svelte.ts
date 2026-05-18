import type { StoreApi } from 'zustand/vanilla';

/** Subscribe a Zustand store to Svelte 5 runes (call inside a .svelte component). */
export function useZustand<T>(store: StoreApi<T>): T {
	let state = $state(store.getState());

	$effect(() => {
		const unsub = store.subscribe((next) => {
			state = next;
		});
		return unsub;
	});

	return state;
}
