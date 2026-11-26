import { describe, expect, it } from 'vitest';
import { ev } from '#test/helpers/route.ts';
import { load } from './+layout.server.ts';

describe('(patient) layout load', () => {
	it('passes the parent user through', async () => {
		const user = { id: 'u1' } as never;
		expect(await load(ev({ user }))).toEqual({ user });
		expect(await load(ev())).toEqual({ user: null });
	});
});
