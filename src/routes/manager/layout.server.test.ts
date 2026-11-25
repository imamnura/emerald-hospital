import { describe, expect, it } from 'vitest';
import { makeManager, makeUser } from '../../test/factories.ts';
import { ev } from '../../test/helpers-routes-manager.ts';
import { load } from './+layout.server.ts';

type Event = Parameters<typeof load>[0];

describe('manager layout load', () => {
	it('redirects anonymous users to login with a return path', async () => {
		await expect(load(ev<Event>({ user: null }))).rejects.toMatchObject({
			status: 303,
			location: '/login?redirect=/manager'
		});
	});

	it('redirects patients to /home', async () => {
		const user = await makeUser();
		await expect(load(ev<Event>({ user }))).rejects.toMatchObject({ status: 303, location: '/home' });
	});

	it('returns the manager user', async () => {
		const user = await makeManager({ googleId: 'g-1' });
		const data = (await load(ev<Event>({ user }))) as { user: unknown };
		expect(data.user).not.toHaveProperty('passwordHash');
		expect(data.user).not.toHaveProperty('googleId');
		expect(data.user).toMatchObject({ id: user.id, role: 'manager' });
	});
});
