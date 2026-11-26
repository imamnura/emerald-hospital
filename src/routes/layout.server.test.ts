import { describe, expect, it } from 'vitest';
import { makeUser } from '#test/factories.ts';
import { ev } from '#test/helpers/route.ts';
import { load } from './+layout.server.ts';

describe('root layout load', () => {
	it('exposes locals.user', async () => {
		const user = { id: 'u1', role: 'patient' } as never;
		expect(await load(ev({ user }))).toEqual({ user });
		expect(await load(ev())).toEqual({ user: null });
	});

	it('never exposes the password hash', async () => {
		const user = await makeUser({ googleId: 'g-1' });
		const data = (await load(ev({ user }))) as { user: unknown };
		expect(data.user).not.toHaveProperty('passwordHash');
		expect(data.user).not.toHaveProperty('googleId');
		expect(data.user).toMatchObject({ id: user.id, email: user.email });
	});
});
