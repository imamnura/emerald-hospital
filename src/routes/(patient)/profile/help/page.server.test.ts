import { describe, expect, it } from 'vitest';
import { ev, thrown } from '../../../../test/helpers-routes-public.ts';
import { load } from './+page.server.ts';

describe('profile/help load', () => {
	it('redirects anonymous users and renders for signed-in users', async () => {
		expect(await thrown(() => load(ev()))).toMatchObject({
			status: 303,
			location: '/login?redirect=/profile/help'
		});
		expect(await load(ev({ user: { id: 'u' } as never }))).toEqual({});
	});
});
