import { beforeEach, describe, expect, it } from 'vitest';
import { makeDoctor, makeSchedule } from '#test/factories.ts';
import { ev, randomId, thrown, reset } from '#test/helpers/route.ts';
import { load } from './+page.server.ts';

beforeEach(() => reset());

describe('doctor detail load', () => {
	it('404s for unknown doctors', async () => {
		expect(await thrown(() => load(ev({ params: { id: randomId() } })))).toMatchObject({ status: 404 });
	});

	it('returns the doctor with schedules and day names', async () => {
		const doctor = await makeDoctor({ name: 'Dr. Who' });
		await makeSchedule(doctor.id, { dayOfWeek: 1 });
		await makeSchedule(doctor.id, { dayOfWeek: 3 });

		const data = (await load(ev({ params: { id: doctor.id } }))) as {
			doctor: { name: string };
			schedules: unknown[];
			scheduleDays: string;
		};
		expect(data.doctor.name).toBe('Dr. Who');
		expect(data.schedules).toHaveLength(2);
		expect(data.scheduleDays.split(', ')).toHaveLength(2);
	});
});
