import { describe, expect, it } from 'vitest';
import { formOpt, formStr, ISO_DATE_RE, readEntityId, withFkGuard } from './forms.ts';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';
const fd = (o: Record<string, string>) => {
	const f = new FormData();
	for (const [k, v] of Object.entries(o)) f.set(k, v);
	return f;
};

describe('formStr / formOpt', () => {
	it('formStr trims and defaults to empty', () => {
		expect(formStr(fd({ a: '  x ' }), 'a')).toBe('x');
		expect(formStr(fd({}), 'a')).toBe('');
	});
	it('formOpt returns null for blank or missing', () => {
		expect(formOpt(fd({ a: '  ' }), 'a')).toBeNull();
		expect(formOpt(fd({}), 'a')).toBeNull();
		expect(formOpt(fd({ a: ' y ' }), 'a')).toBe('y');
	});
});

describe('readEntityId', () => {
	it('missing id -> 400', () =>
		expect(readEntityId(fd({}), 'hospital')).toMatchObject({ status: 400, data: { error: 'Missing hospital ID.' } }));
	it('non-uuid -> 404 with capitalised label', () =>
		expect(readEntityId(fd({ id: 'x' }), 'hospital')).toMatchObject({
			status: 404,
			data: { error: 'Hospital not found.' }
		}));
	it('valid uuid', () => expect(readEntityId(fd({ id: UNKNOWN_ID }), 'hospital')).toEqual({ id: UNKNOWN_ID }));
});

describe('withFkGuard', () => {
	it('maps 23503 and rethrows others', async () => {
		expect(await withFkGuard(() => Promise.reject({ code: '23503' }), 409, 'busy')).toMatchObject({
			status: 409,
			data: { error: 'busy' }
		});
		await expect(withFkGuard(() => Promise.reject(new Error('x')), 409, 'busy')).rejects.toThrow('x');
	});
	it('passes through the result on success', async () => {
		expect(await withFkGuard(() => Promise.resolve(7), 400, 'e')).toBe(7);
	});
});

describe('ISO_DATE_RE', () => {
	it('matches only YYYY-MM-DD', () => {
		expect(ISO_DATE_RE.test('2024-01-31')).toBe(true);
		expect(ISO_DATE_RE.test('2024-1-31')).toBe(false);
	});
});
