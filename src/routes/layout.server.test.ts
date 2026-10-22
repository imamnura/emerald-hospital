import { describe, expect, it } from 'vitest';
import { ev } from '../test/helpers-routes-public.ts';
import { load } from './+layout.server.ts';

describe('root layout load', () => {
	it('exposes locals.user', async () => {
		const user = { id: 'u1', role: 'patient' } as never;
		expect(await load(ev({ user }))).toEqual({ user });
		expect(await load(ev())).toEqual({ user: null });
	});
});
