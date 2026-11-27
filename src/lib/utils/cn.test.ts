import { describe, expect, it } from 'vitest';
import { cn } from '#lib/utils/cn.ts';

describe('lib/utils', () => {
	it('cn joins truthy class names', () => {
		expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
		expect(cn()).toBe('');
	});
});
