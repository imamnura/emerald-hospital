/**
 * Catalog reads — hospitals, specialists, schedules.
 * Centralizes the simple select queries that were previously inlined
 * across multiple route loaders.
 */
import { asc, eq } from 'drizzle-orm';
import { db } from './db';
import { isUuid } from './db-errors';
import { doctorSchedules, doctors, hospitals, specialists } from './db/schema';

export async function listHospitals() {
	return db.select().from(hospitals).orderBy(asc(hospitals.name));
}

export async function listSpecialists() {
	return db.select().from(specialists).orderBy(asc(specialists.name));
}

export async function listDoctorOptions() {
	return db.select({ id: doctors.id, name: doctors.name }).from(doctors).orderBy(asc(doctors.name));
}

export async function getSpecialistBySlug(slug: string) {
	const [row] = await db
		.select()
		.from(specialists)
		.where(eq(specialists.slug, slug))
		.limit(1);
	return row ?? null;
}

export async function listSchedulesForDoctor(doctorId: string) {
	if (!isUuid(doctorId)) return [];
	return db
		.select()
		.from(doctorSchedules)
		.where(eq(doctorSchedules.doctorId, doctorId));
}
