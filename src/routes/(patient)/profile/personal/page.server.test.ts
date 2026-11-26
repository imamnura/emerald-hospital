import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { users } from '#lib/server/db/schema.ts';
import { resetDb, type TestDb } from '#test/db.ts';
import { makeUser } from '#test/factories.ts';
import { ev, randomId, thrown, reset } from '#test/helpers/route.ts';
import { actions, load } from './+page.server.ts';

beforeEach(() => reset());

const fresh = async (id: string) => (await db.select().from(users).where(eq(users.id, id)))[0];

describe('profile/personal load', () => {
	it('redirects anonymous users and users that no longer exist', async () => {
		expect(await thrown(() => load(ev()))).toMatchObject({
			status: 303,
			location: '/login?redirect=/profile/personal'
		});
		expect(await thrown(() => load(ev({ user: { id: randomId() } as never })))).toMatchObject({
			location: '/login'
		});
	});

	it('formats date of birth and defaults gender', async () => {
		const bare = await makeUser();
		expect(await load(ev({ user: bare }))).toMatchObject({ dateOfBirth: '', gender: 'prefer_not' });

		const full = await makeUser({
			dateOfBirth: '1990-03-05',
			gender: 'female',
			bloodType: 'A+',
			phone: '0812',
			address: 'Jl. 1'
		});
		const data = (await load(ev({ user: full }))) as { profile: Record<string, unknown> };
		expect(data).toMatchObject({ dateOfBirth: '03/05/1990', gender: 'female' });
		expect(data.profile).toEqual({
			id: full.id,
			email: full.email,
			name: full.name,
			phone: '0812',
			imageUrl: null,
			bloodType: 'A+',
			address: 'Jl. 1'
		});
	});
});

describe('profile/personal update action', () => {
	const base = { name: 'Ana', gender: 'female' };

	it('redirects anonymous users', async () => {
		expect(await thrown(() => actions.update(ev({ form: base })))).toMatchObject({ location: '/login' });
	});

	it.each([
		[{ name: ' ' }, 'Full name is required.'],
		[{ other: '1', name: '' }, 'Full name is required.'],
		[{ dateOfBirth: 'yesterday' }, 'Enter a valid date of birth (MM/DD/YYYY).'],
		[{ dateOfBirth: '13/45/2020' }, 'Enter a valid date of birth (MM/DD/YYYY).'],
		[{ gender: 'robot' }, 'Please select a valid gender.'],
		[{ bloodType: 'Z+' }, 'Invalid blood type.']
	])('rejects %o', async (patch, error) => {
		const user = await makeUser();
		expect(await actions.update(ev({ user, form: { ...base, ...patch } }))).toMatchObject({
			status: 400,
			data: { error }
		});
	});

	it('rejects a missing gender field', async () => {
		const user = await makeUser();
		expect(await actions.update(ev({ user, form: { name: 'Ana' } }))).toMatchObject({ status: 400 });
	});

	it('saves MM/DD/YYYY dates and every optional field', async () => {
		const user = await makeUser();
		const form = {
			name: ' Ana B ',
			phone: ' 0812 ',
			imageUrl: 'https://img/x.png',
			address: 'Jl. 2',
			dateOfBirth: '3/5/1990',
			gender: 'male',
			bloodType: 'AB-'
		};
		expect(await actions.update(ev({ user, form }))).toEqual({ success: true });
		expect(await fresh(user.id)).toMatchObject({
			name: 'Ana B',
			phone: '0812',
			imageUrl: 'https://img/x.png',
			address: 'Jl. 2',
			dateOfBirth: '1990-03-05',
			gender: 'male',
			bloodType: 'AB-'
		});
	});

	it('load after the action (no-JS submit, same stale locals) shows the saved profile', async () => {
		const user = await makeUser({ name: 'Old Name', phone: '1' });
		const event = ev({ user, form: { name: 'New Name', phone: '0812', gender: 'male', dateOfBirth: '1990-03-05' } });
		expect(await actions.update(event)).toEqual({ success: true });
		// SvelteKit reruns load in the same request: locals.user is still the pre-update row.
		expect(event.locals.user.name).toBe('Old Name');
		const data = (await load(event)) as { profile: Record<string, unknown>; dateOfBirth: string; gender: string };
		expect(data.profile).toMatchObject({ name: 'New Name', phone: '0812' });
		expect(data).toMatchObject({ dateOfBirth: '03/05/1990', gender: 'male' });
	});

	it('accepts ISO dates, clears empties and maps prefer_not to null', async () => {
		const user = await makeUser({ gender: 'female', bloodType: 'O+', phone: '1' });
		expect(
			await actions.update(ev({ user, form: { name: 'Ana', gender: 'prefer_not', dateOfBirth: '2000-01-02' } }))
		).toEqual({ success: true });
		expect(await fresh(user.id)).toMatchObject({
			gender: null,
			bloodType: null,
			phone: null,
			dateOfBirth: '2000-01-02'
		});

		expect(await actions.update(ev({ user, form: { name: 'Ana', gender: 'other', dateOfBirth: '' } }))).toEqual({
			success: true
		});
		expect(await fresh(user.id)).toMatchObject({ gender: 'other', dateOfBirth: null });
	});
});
