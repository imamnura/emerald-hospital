import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { doctors, hospitals, specialists } from './db/schema';

export type DoctorListItem = {
	id: string;
	name: string;
	imageUrl: string | null;
	rating: string;
	reviewCount: number;
	consultationFee: string;
	isOnline: boolean;
	specialty: string;
	specialistSlug: string;
	hospital: string;
};

const doctorListSelect = {
	id: doctors.id,
	name: doctors.name,
	imageUrl: doctors.imageUrl,
	rating: doctors.rating,
	reviewCount: doctors.reviewCount,
	consultationFee: doctors.consultationFee,
	isOnline: doctors.isOnline,
	specialty: specialists.name,
	specialistSlug: specialists.slug,
	hospital: hospitals.name
};

function normalize(rows: Awaited<ReturnType<typeof db.select>> | unknown[]): DoctorListItem[] {
	return (rows as DoctorListItem[]).map((d) => ({
		...d,
		rating: d.rating ?? '4.5'
	}));
}

export async function listActiveDoctors(): Promise<DoctorListItem[]> {
	const rows = await db
		.select(doctorListSelect)
		.from(doctors)
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.innerJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
		.where(eq(doctors.isActive, true));

	return normalize(rows);
}

export async function listActiveDoctorsBySpecialistId(specialistId: string): Promise<DoctorListItem[]> {
	const rows = await db
		.select(doctorListSelect)
		.from(doctors)
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.innerJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
		.where(and(eq(doctors.specialistId, specialistId), eq(doctors.isActive, true)));

	return normalize(rows);
}

export async function getDoctorDetail(id: string) {
	const [row] = await db
		.select({
			id: doctors.id,
			name: doctors.name,
			imageUrl: doctors.imageUrl,
			rating: doctors.rating,
			reviewCount: doctors.reviewCount,
			consultationFee: doctors.consultationFee,
			bio: doctors.bio,
			isOnline: doctors.isOnline,
			specialty: specialists.name,
			specialistSlug: specialists.slug,
			hospital: hospitals.name,
			hospitalId: hospitals.id,
			hospitalAddress: hospitals.address,
			hospitalCity: hospitals.city
		})
		.from(doctors)
		.innerJoin(specialists, eq(doctors.specialistId, specialists.id))
		.innerJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
		.where(eq(doctors.id, id))
		.limit(1);

	if (!row) return null;
	return { ...row, rating: row.rating ?? '4.5' };
}

export function filterDoctorsByQuery<
	T extends { name: string; specialty: string; hospital: string }
>(rows: T[], q: string): T[] {
	const lower = q.trim().toLowerCase();
	if (!lower) return rows;
	return rows.filter(
		(d) =>
			d.name.toLowerCase().includes(lower) ||
			d.specialty.toLowerCase().includes(lower) ||
			d.hospital.toLowerCase().includes(lower)
	);
}
