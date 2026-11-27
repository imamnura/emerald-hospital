import { describe, expect, it } from 'vitest';
import { findDoctorHref, withParams } from './url.ts';

describe('withParams', () => {
	it('resets page and drops empty values', () =>
		expect(withParams(new URL('http://x/m?page=3&q=a'), { q: '' })).toBe('/m'));

	it('keeps page when asked', () =>
		expect(withParams(new URL('http://x/m?q=a'), { page: '2' }, { resetPage: false })).toBe(
			'/m?q=a&page=2'
		));

	it('drops null values and keeps existing param order', () =>
		expect(withParams(new URL('http://x/m?a=1&q=a&b=2'), { q: 'z', a: null })).toBe('/m?q=z&b=2'));

	it('appends new params in update order', () =>
		expect(withParams(new URL('http://x/m'), { q: 'a', hospitalId: 'h' })).toBe(
			'/m?q=a&hospitalId=h'
		));

	it('returns a query-only href or the bare path when relative', () => {
		const url = new URL('http://x/m?page=2&q=a');
		expect(withParams(url, { q: 'b' }, { relative: true })).toBe('?q=b');
		expect(withParams(url, { q: null }, { relative: true })).toBe('/m');
	});
});

describe('findDoctorHref', () => {
	it('is the bare path without filters', () =>
		expect(findDoctorHref('  ', 'all')).toBe('/find-doctor'));

	it('adds a trimmed query and a hospital other than all', () =>
		expect(findDoctorHref(' Cardio ', 'rsud-purwakarta')).toBe(
			'/find-doctor?q=Cardio&hospital=rsud-purwakarta'
		));

	it('drops the hospital when it is all', () =>
		expect(findDoctorHref('Neuro', 'all')).toBe('/find-doctor?q=Neuro'));
});
