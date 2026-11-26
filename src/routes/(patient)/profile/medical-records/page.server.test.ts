import { beforeEach, describe, expect, it } from 'vitest';
import { makeMedicalRecord, makeUser } from '#test/factories.ts';
import { ev, thrown, reset } from '#test/helpers/route.ts';
import { load } from './+page.server.ts';

beforeEach(() => reset());

describe('profile/medical-records load', () => {
	it('redirects anonymous users', async () => {
		expect(await thrown(() => load(ev()))).toMatchObject({
			status: 303,
			location: '/login?redirect=/profile/medical-records'
		});
	});

	it('lists only the current user records', async () => {
		const user = await makeUser({ name: 'Ana', imageUrl: 'https://img/a.png' });
		const other = await makeUser();
		await makeMedicalRecord(user.id, { title: 'Mine' });
		await makeMedicalRecord(other.id, { title: 'Theirs' });

		const data = (await load(ev({ user }))) as { user: unknown; records: unknown[] };
		expect(data.user).toEqual({ name: 'Ana', imageUrl: 'https://img/a.png' });
		expect(data.records).toHaveLength(1);
		expect(JSON.stringify(data.records)).toContain('Mine');
	});
});
