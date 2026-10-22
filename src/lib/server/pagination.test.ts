import { describe, expect, it } from 'vitest';
import { parsePagination } from './pagination.ts';

const p = (qs: string, defaults?: Parameters<typeof parsePagination>[1]) =>
	parsePagination(new URLSearchParams(qs), defaults);

describe('parsePagination', () => {
	it('uses defaults when params are absent', () => {
		expect(p('')).toEqual({ page: 1, pageSize: 10, offset: 0 });
		expect(p('', { pageSize: 25 })).toEqual({ page: 1, pageSize: 25, offset: 0 });
	});

	it('computes the offset from page and pageSize', () => {
		expect(p('page=3&pageSize=20')).toEqual({ page: 3, pageSize: 20, offset: 40 });
	});

	it('clamps page to at least 1 and falls back on garbage', () => {
		expect(p('page=0').page).toBe(1);
		expect(p('page=-5').page).toBe(1);
		expect(p('page=abc').page).toBe(1);
	});

	it('clamps pageSize into [1, max]', () => {
		expect(p('pageSize=0').pageSize).toBe(1);
		expect(p('pageSize=-3').pageSize).toBe(1);
		expect(p('pageSize=1000').pageSize).toBe(100);
		expect(p('pageSize=60', { max: 50 }).pageSize).toBe(50);
	});

	it('uses the default size for non-numeric or infinite pageSize', () => {
		expect(p('pageSize=abc').pageSize).toBe(10);
		expect(p('pageSize=abc', { pageSize: 7 }).pageSize).toBe(7);
		// Infinity is a number but not finite -> default
		expect(p('pageSize=Infinity', { pageSize: 5 }).pageSize).toBe(5);
	});
});
