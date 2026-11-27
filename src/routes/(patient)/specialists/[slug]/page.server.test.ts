import { beforeEach, describe, expect, it } from 'vitest';
import { makeDoctor, makeSpecialist } from '#test/factories.ts';
import { ev, thrown, reset } from '#test/helpers/route.ts';
import { load } from './+page.server.ts';

beforeEach(() => reset());

describe('specialist detail load', () => {
	it('404s for unknown slugs', async () => {
		expect(await thrown(() => load(ev({ params: { slug: 'nope' } })))).toMatchObject({ status: 404 });
	});

	it('lists active doctors of the specialty sorted by rating', async () => {
		const spec = await makeSpecialist({ slug: 'cardiology' });
		const other = await makeSpecialist();
		await makeDoctor({ name: 'Low', rating: '3.9', specialistId: spec.id });
		await makeDoctor({ name: 'High', rating: '4.9', specialistId: spec.id });
		await makeDoctor({ name: 'Mid', rating: '4.2', specialistId: spec.id });
		await makeDoctor({ name: 'Inactive', rating: '5.0', specialistId: spec.id, isActive: false });
		await makeDoctor({ name: 'Elsewhere', specialistId: other.id });

		const data = (await load(ev({ params: { slug: 'cardiology' } }))) as {
			specialist: { id: string };
			doctors: Record<string, unknown>[];
		};
		expect(data.specialist.id).toBe(spec.id);
		expect(data.doctors.map((d) => d.name)).toEqual(['High', 'Mid', 'Low']);
		expect(Object.keys(data.doctors[0]).sort()).toEqual(
			['hospital', 'id', 'imageUrl', 'isOnline', 'name', 'rating', 'reviewCount'].sort()
		);
	});
});
