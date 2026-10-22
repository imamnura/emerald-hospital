import type { StoreApi } from 'zustand/vanilla';

/**
 * Subscribe a Zustand store to Svelte 5 runes (call inside a .svelte component).
 *
 * Returns one reactive object that is updated in place: callers keep a reference
 * to it, so reassigning a local variable would leave them with a stale snapshot.
 */
export function useZustand<T extends object>(store: StoreApi<T>): T {
	const state = $state(store.getState()) as T;

	$effect(() => {
		// Catch changes made between component init and mount.
		Object.assign(state, store.getState());
		return store.subscribe((next) => {
			Object.assign(state, next);
		});
	});

	return state;
}
