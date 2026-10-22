import { vi } from 'vitest';

/** Test stand-in for `$app/navigation`. */
export const goto = vi.fn(async (_url: string | URL, _opts?: unknown) => {});
export const invalidate = vi.fn(async (_dep: unknown) => {});
export const invalidateAll = vi.fn(async () => {});
export const preloadData = vi.fn(async (_href: string) => ({}));
export const preloadCode = vi.fn(async (..._urls: string[]) => {});
export const beforeNavigate = vi.fn();
export const afterNavigate = vi.fn();
export const onNavigate = vi.fn();
export const pushState = vi.fn();
export const replaceState = vi.fn();
export const disableScrollHandling = vi.fn();

export function resetNavigation(): void {
	for (const fn of [
		goto,
		invalidate,
		invalidateAll,
		preloadData,
		preloadCode,
		beforeNavigate,
		afterNavigate,
		onNavigate,
		pushState,
		replaceState,
		disableScrollHandling
	]) {
		fn.mockClear();
	}
}
