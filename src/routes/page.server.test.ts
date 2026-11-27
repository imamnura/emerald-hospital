import { describe, expect, it } from 'vitest';
import { ev, thrown } from '#test/helpers/route.ts';
import { load } from './+page.server.ts';

describe('landing page load', () => {
	it('redirects managers to /manager and patients to /home', async () => {
		expect(await thrown(() => load(ev({ user: { role: 'manager' } as never })))).toMatchObject({
			status: 303,
			location: '/manager'
		});
		expect(await thrown(() => load(ev({ user: { role: 'patient' } as never })))).toMatchObject({
			status: 303,
			location: '/home'
		});
	});

	it('renders for anonymous visitors', async () => {
		expect(await load(ev())).toEqual({});
	});
});
