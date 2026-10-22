import { describe, expect, it } from 'vitest';
import { useSearchStore } from '#lib/stores/search.ts';

// Server (node) environment: no `window`, so persist falls back to a no-op storage.
describe('useSearchStore without window (SSR)', () => {
	it('uses a no-op storage that never throws', async () => {
		expect(typeof window).toBe('undefined');
		const s = useSearchStore.getState();
		s.toggleBookmark('ssr');
		expect(useSearchStore.getState().isBookmarked('ssr')).toBe(true);
		await useSearchStore.persist.rehydrate();
		// nothing stored server side, so state remains in memory
		expect(useSearchStore.getState().bookmarkedIds).toEqual(['ssr']);
		expect(() => useSearchStore.persist.clearStorage()).not.toThrow();
	});
});
