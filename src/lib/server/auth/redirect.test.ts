import { describe, expect, it } from 'vitest';
import { homeFor, sanitizeRedirect } from './redirect.ts';

describe('sanitizeRedirect', () => {
	it.each([
		['/doctors/1', '/doctors/1'],
		['//evil.com', null],
		['/login?x', null],
		['/login/forgot', null],
		['https://x', null],
		['', null],
		[null, null],
		[undefined, null]
	])('sanitizeRedirect(%s)', (inp, out) => expect(sanitizeRedirect(inp)).toBe(out));
});

describe('homeFor', () => {
	it('maps role to its landing page', () => {
		expect(homeFor('manager')).toBe('/manager');
		expect(homeFor('patient')).toBe('/home');
	});
});
