import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { resetDb, type TestDb } from '../../test/db.ts';
import { makeDoctor, makeHospital, makeSpecialist } from '../../test/factories.ts';
import {
	filterDoctorsByQuery,
	getDoctorDetail,
	listActiveDoctors,
	listActiveDoctorsBySpecialistId
} from './doctors.ts';

beforeEach(() => resetDb(db as unknown as TestDb));

async function seed() {
	const hospital = await makeHospital({ name: 'Emerald General', address: 'Jl. A', city: 'Bandung' });
	const cardio = await makeSpecialist({ name: 'Cardiology', slug: 'cardiology' });
	const neuro = await makeSpecialist({ name: 'Neurology', slug: 'neurology' });
	const heart = await makeDoctor({
		name: 'Dr. Heart',
		hospitalId: hospital.id,
		specialistId: cardio.id,
		rating: '4.8',
		reviewCount: 12,
		consultationFee: '200',
		isOnline: true,
		bio: 'Bio'
	});
	const noRating = await makeDoctor({
		name: 'Dr. Null',
		hospitalId: hospital.id,
		specialistId: cardio.id,
		rating: null
	});
	const brain = await makeDoctor({ name: 'Dr. Brain', hospitalId: hospital.id, specialistId: neuro.id });
	const inactive = await makeDoctor({
		name: 'Dr. Gone',
		hospitalId: hospital.id,
		specialistId: cardio.id,
		isActive: false
	});
	return { hospital, cardio, neuro, heart, noRating, brain, inactive };
}

describe('listActiveDoctors', () => {
	it('lists only active doctors with joined fields and a default rating', async () => {
		const { heart, noRating, brain } = await seed();
		const rows = await listActiveDoctors();
		expect(rows.map((r) => r.id).sort()).toEqual([heart.id, noRating.id, brain.id].sort());
		expect(rows.find((r) => r.id === heart.id)).toEqual({
			id: heart.id,
			name: 'Dr. Heart',
			imageUrl: null,
			rating: '4.8',
			reviewCount: 12,
			consultationFee: '200.00',
			isOnline: true,
			specialty: 'Cardiology',
			specialistSlug: 'cardiology',
			hospital: 'Emerald General'
		});
		expect(rows.find((r) => r.id === noRating.id)?.rating).toBe('4.5');
	});
});

describe('listActiveDoctorsBySpecialistId', () => {
	it('filters by specialist and active flag', async () => {
		const { cardio, neuro, heart, noRating, brain } = await seed();
		const c = await listActiveDoctorsBySpecialistId(cardio.id);
		expect(c.map((r) => r.id).sort()).toEqual([heart.id, noRating.id].sort());
		expect(c.find((r) => r.id === noRating.id)?.rating).toBe('4.5');
		expect((await listActiveDoctorsBySpecialistId(neuro.id)).map((r) => r.id)).toEqual([brain.id]);
		expect(await listActiveDoctorsBySpecialistId('00000000-0000-0000-0000-000000000000')).toEqual([]);
	});
});

describe('getDoctorDetail', () => {
	it('returns joined detail', async () => {
		const { hospital, heart } = await seed();
		expect(await getDoctorDetail(heart.id)).toEqual({
			id: heart.id,
			name: 'Dr. Heart',
			imageUrl: null,
			rating: '4.8',
			reviewCount: 12,
			consultationFee: '200.00',
			bio: 'Bio',
			isOnline: true,
			specialty: 'Cardiology',
			specialistSlug: 'cardiology',
			hospital: 'Emerald General',
			hospitalId: hospital.id,
			hospitalAddress: 'Jl. A',
			hospitalCity: 'Bandung'
		});
	});

	it('defaults a null rating to 4.5 and still returns inactive doctors', async () => {
		const { noRating, inactive } = await seed();
		expect((await getDoctorDetail(noRating.id))?.rating).toBe('4.5');
		expect((await getDoctorDetail(inactive.id))?.name).toBe('Dr. Gone');
	});

	it('returns null for unknown id', async () => {
		expect(await getDoctorDetail('00000000-0000-0000-0000-000000000000')).toBeNull();
	});

	it('returns null for a non-UUID id instead of hitting the DB', async () => {
		expect(await getDoctorDetail('not-a-uuid')).toBeNull();
	});
});

describe('filterDoctorsByQuery', () => {
	const rows = [
		{ name: 'Dr. Heart', specialty: 'Cardiology', hospital: 'Emerald' },
		{ name: 'Dr. Brain', specialty: 'Neurology', hospital: 'Sapphire' },
		{ name: 'Dr. Bones', specialty: 'Orthopedics', hospital: 'Emerald East' }
	];

	it('returns all rows for a blank query', () => {
		expect(filterDoctorsByQuery(rows, '')).toBe(rows);
		expect(filterDoctorsByQuery(rows, '   ')).toBe(rows);
	});

	it('matches name, specialty, or hospital case-insensitively', () => {
		expect(filterDoctorsByQuery(rows, ' HEART ').map((r) => r.name)).toEqual(['Dr. Heart']);
		expect(filterDoctorsByQuery(rows, 'neuro').map((r) => r.name)).toEqual(['Dr. Brain']);
		expect(filterDoctorsByQuery(rows, 'emerald').map((r) => r.name)).toEqual(['Dr. Heart', 'Dr. Bones']);
		expect(filterDoctorsByQuery(rows, 'xyz')).toEqual([]);
	});
});
