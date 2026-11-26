import { beforeEach, describe, expect, it } from 'vitest';
import { makeSpecialist } from '#test/factories.ts';
import { ev, reset } from '#test/helpers/route.ts';
import { load } from './+page.server.ts';

beforeEach(() => reset());

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
		expect(data.user).toEqual(user);
		expect(data.specialists.map((s) => s.slug)).toEqual([
			'cardiology',
			'dental',
			'neurology',
			'allergy',
			'zoology'
		]);
	});
});
