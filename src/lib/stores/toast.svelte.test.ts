import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '#lib/stores/toast.svelte.ts';

describe('toast store', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		toast.clear();
	});
	afterEach(() => {
		toast.clear();
		vi.useRealTimers();
	});

	it('pushes toasts with incrementing ids and kinds', () => {
		const a = toast.success('saved');
		const b = toast.info('fyi');
		const c = toast.warning('careful');
		const d = toast.error('boom');
		expect(b).toBe(a + 1);
		expect(c).toBe(a + 2);
		expect(d).toBe(a + 3);
		expect(toast.toasts.map((t) => [t.kind, t.message])).toEqual([
			['success', 'saved'],
			['info', 'fyi'],
			['warning', 'careful'],
			['error', 'boom']
		]);
	});

	it('uses 4000ms default timeout and 6000ms for errors', () => {
		toast.success('s');
		toast.error('e');
		expect(toast.toasts.map((t) => t.timeout)).toEqual([4000, 6000]);
	});

	it('auto-dismisses after the timeout', () => {
		toast.success('s');
		toast.error('e');
		vi.advanceTimersByTime(3999);
		expect(toast.toasts).toHaveLength(2);
		vi.advanceTimersByTime(1);
		expect(toast.toasts.map((t) => t.kind)).toEqual(['error']);
		vi.advanceTimersByTime(2000);
		expect(toast.toasts).toHaveLength(0);
	});

	it('honours custom timeouts, and 0 means sticky', () => {
		toast.info('quick', 100);
		toast.warning('sticky', 0);
		toast.error('custom-error', 50);
		vi.advanceTimersByTime(100);
		expect(toast.toasts.map((t) => t.message)).toEqual(['sticky']);
		vi.advanceTimersByTime(60_000);
		expect(toast.toasts.map((t) => t.message)).toEqual(['sticky']);
	});

	it('push() can be called directly and negative timeout is sticky', () => {
		toast.push('info', 'direct', -1);
		vi.advanceTimersByTime(10_000);
		expect(toast.toasts).toHaveLength(1);
	});

	it('dismiss removes only the given toast; clear removes all', () => {
		const a = toast.success('a', 0);
		toast.success('b', 0);
		toast.dismiss(a);
		expect(toast.toasts.map((t) => t.message)).toEqual(['b']);
		toast.dismiss(9999);
		expect(toast.toasts).toHaveLength(1);
		toast.clear();
		expect(toast.toasts).toEqual([]);
	});
});
