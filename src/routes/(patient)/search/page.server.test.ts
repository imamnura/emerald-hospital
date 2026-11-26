import { beforeEach, describe, expect, it } from 'vitest';
import { makeDoctor } from '#test/factories.ts';
import { ev, reset } from '#test/helpers/route.ts';
import { load } from './+page.server.ts';

beforeEach(() => reset());

type Data = { query: string; doctors: { name: string }[]; allDoctors: unknown[]; specialists: unknown[]; openFilter: boolean };

describe('search load', () => {
	it('returns all doctors without a query', async () => {
		await makeDoctor({ name: 'Dr. Andi' });
		await makeDoctor({ name: 'Dr. Budi' });
		const data = (await load(ev({ url: '/search' }))) as Data;
		expect(data).toMatchObject({ query: '', openFilter: false });
		expect(data.doctors).toHaveLength(2);
		expect(data.specialists).toHaveLength(2);
	});

	it('filters by query and reads the open filter', async () => {
		await makeDoctor({ name: 'Dr. Andi' });
		await makeDoctor({ name: 'Dr. Budi' });
		const data = (await load(ev({ url: '/search?q=%20budi%20&filter=open' }))) as Data;
		expect(data.query).toBe('budi');
		expect(data.openFilter).toBe(true);
		expect(data.doctors.map((d) => d.name)).toEqual(['Dr. Budi']);
		expect(data.allDoctors).toHaveLength(2);
	});
});
