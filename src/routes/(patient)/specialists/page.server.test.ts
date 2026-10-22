import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { resetDb, type TestDb } from '../../../test/db.ts';
import { makeSpecialist } from '../../../test/factories.ts';
import { ev } from '../../../test/helpers-routes-public.ts';
import { load } from './+page.server.ts';

beforeEach(() => resetDb(db as unknown as TestDb));

describe('specialists load', () => {
	it('sorts known slugs by display order, then unknown ones alphabetically', async () => {
		for (const [name, slug] of [
			['Zoology', 'zoology'],
			['Neurology', 'neurology'],
			['Allergy', 'allergy'],
			['Cardiology', 'cardiology'],
			['Dental', 'dental']
		]) {
			await makeSpecialist({ name, slug });
		}
		const user = { id: 'u' } as never;
		const data = (await load(ev({ user }))) as { specialists: { slug: string }[]; user: unknown };
		expect(data.user).toBe(user);
		expect(data.specialists.map((s) => s.slug)).toEqual([
			'cardiology',
			'dental',
			'neurology',
			'allergy',
			'zoology'
		]);
	});
});
