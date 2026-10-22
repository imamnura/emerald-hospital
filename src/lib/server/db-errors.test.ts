import { describe, expect, it } from 'vitest';
import { isForeignKeyViolation, isUuid } from './db-errors.ts';

describe('isUuid', () => {
	it.each([
		'00000000-0000-4000-8000-000000000000',
		'123e4567-e89b-12d3-a456-426614174000',
		'ABCDEF01-2345-6789-ABCD-EF0123456789'
	])('accepts %s', (v) => {
		expect(isUuid(v)).toBe(true);
	});

	it.each([
		'',
		'not-a-uuid',
		'123e4567e89b12d3a456426614174000',
		'123e4567-e89b-12d3-a456-42661417400',
		'123e4567-e89b-12d3-a456-4266141740000',
		' 123e4567-e89b-12d3-a456-426614174000',
		'g23e4567-e89b-12d3-a456-426614174000'
	])('rejects %j', (v) => {
		expect(isUuid(v)).toBe(false);
	});
});

describe('isForeignKeyViolation', () => {
	it('detects code 23503 on the error itself', () => {
		expect(isForeignKeyViolation(Object.assign(new Error('fk'), { code: '23503' }))).toBe(true);
		expect(isForeignKeyViolation({ code: '23503' })).toBe(true);
	});

	it('detects code 23503 on a wrapped cause', () => {
		expect(isForeignKeyViolation(new Error('wrapped', { cause: { code: '23503' } }))).toBe(true);
	});

	it.each([
		['null', null],
		['undefined', undefined],
		['a string', 'boom'],
		['a plain Error', new Error('boom')],
		['another SQLSTATE', { code: '23505' }],
		['a numeric code', { code: 23503 }],
		['a cause with another code', new Error('x', { cause: { code: '23505' } })],
		['a null cause', { cause: null }]
	])('returns false for %s', (_c, e) => {
		expect(isForeignKeyViolation(e)).toBe(false);
	});
});
