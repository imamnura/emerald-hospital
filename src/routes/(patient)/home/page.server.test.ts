import { beforeEach, describe, expect, it } from 'vitest';
import { makeDoctor, makeSpecialist } from '#test/factories.ts';
import { ev, reset } from '#test/helpers/route.ts';
import { load } from './+page.server.ts';

beforeEach(() => reset());

type Data = { specialists: unknown[]; doctors: { name: string }[]; activeSpecialist: string };

describe('home load', () => {
	it('lists specialists and doctors, optionally filtered by specialist slug', async () => {
		const cardio = await makeSpecialist({ slug: 'cardiology' });
		const dental = await makeSpecialist({ slug: 'dental' });
		await makeDoctor({ name: 'Dr. Heart', specialistId: cardio.id });
		await makeDoctor({ name: 'Dr. Tooth', specialistId: dental.id });

		const all = (await load(ev({ url: '/home' }))) as Data;
		expect(all.specialists).toHaveLength(2);
		expect(all.doctors).toHaveLength(2);
		expect(all.activeSpecialist).toBe('');

		const filtered = (await load(ev({ url: '/home?specialist=dental' }))) as Data;
		expect(filtered.doctors.map((d) => d.name)).toEqual(['Dr. Tooth']);
		expect(filtered.activeSpecialist).toBe('dental');
	});
});
