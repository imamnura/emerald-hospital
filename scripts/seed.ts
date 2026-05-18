import 'dotenv/config';
import { hash } from '@node-rs/argon2';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/server/db/schema';

const {
	users,
	hospitals,
	specialists,
	doctors,
	doctorSchedules,
	bookings,
	sessions,
	paymentCards,
	paymentTransactions,
	insuranceProfiles,
	medicalRecords
} = schema;

const connectionString =
	process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/emerald_hospital';

/** Next date (YYYY-MM-DD) for a given JS day-of-week (0=Sun … 6=Sat) */
function nextDateForDay(dayOfWeek: number): string {
	const d = new Date();
	d.setHours(12, 0, 0, 0);
	let diff = dayOfWeek - d.getDay();
	if (diff <= 0) diff += 7;
	d.setDate(d.getDate() + diff);
	return d.toISOString().slice(0, 10);
}

function dateOffset(days: number): string {
	const d = new Date();
	d.setHours(12, 0, 0, 0);
	d.setDate(d.getDate() + days);
	return d.toISOString().slice(0, 10);
}

/** Friday at least `weeks` weeks ahead (for upcoming demo) */
function nextFridayWeeksAhead(weeks: number): string {
	const d = new Date();
	d.setHours(12, 0, 0, 0);
	d.setDate(d.getDate() + weeks * 7);
	while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
	return d.toISOString().slice(0, 10);
}

const BIO_BY_SPECIALTY: Record<string, string> = {
	Cardiology:
		'Specializing in preventive cardiology and heart failure management with over 15 years of clinical experience.',
	Neurology:
		'Expert in neurological disorders, stroke prevention, and comprehensive brain health with 12+ years of practice.',
	Dental:
		'Focused on restorative dentistry and patient comfort with modern techniques and 10 years of experience.',
	'Eye Care':
		'Dedicated to vision care, cataract assessment, and ocular disease management for all age groups.',
	Pediatrics:
		'Compassionate child healthcare from infancy through adolescence with evidence-based treatment plans.',
	Orthopedics: 'Specialist in musculoskeletal injuries, joint care, and sports medicine rehabilitation.',
	Psychology: 'Providing supportive mental health care through evidence-based therapy and counseling.',
	Dermatology: 'Expert in skin health, cosmetic dermatology, and chronic skin condition management.',
	ENT: 'Treating ear, nose, and throat conditions with minimally invasive approaches.',
	General: 'Comprehensive primary care focused on prevention, diagnosis, and long-term wellness.',
	Nutrition: 'Personalized nutrition plans for weight management and chronic disease support.',
	Oncology: 'Patient-centered cancer care with emphasis on treatment planning and supportive care.'
};

async function main() {
	const client = postgres(connectionString, { prepare: false });
	const db = drizzle(client, { schema });

	console.log('Seeding database...');

	await db.delete(medicalRecords);
	await db.delete(paymentTransactions);
	await db.delete(paymentCards);
	await db.delete(insuranceProfiles);
	await db.delete(bookings);
	await db.delete(sessions);
	await db.delete(doctorSchedules);
	await db.delete(doctors);
	await db.delete(specialists);
	await db.delete(hospitals);
	await db.delete(users);

	const passwordHash = await hash('password123', {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	const [manager] = await db
		.insert(users)
		.values({
			email: 'manager@emerald.com',
			passwordHash,
			role: 'manager',
			name: 'Admin Manager',
			phone: '+6281234567890',
			gender: 'male'
		})
		.returning();

	const [patient] = await db
		.insert(users)
		.values({
			email: 'patient@emerald.com',
			passwordHash,
			role: 'patient',
			name: 'Ahmad Patient',
			phone: '+6289876543210',
			imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
			bloodType: 'O+',
			dateOfBirth: '1990-08-14',
			gender: 'male',
			address: 'Jl. Merdeka 12, Jakarta'
		})
		.returning();

	const [siti] = await db
		.insert(users)
		.values({
			email: 'siti@emerald.com',
			passwordHash,
			role: 'patient',
			name: 'Siti Rahayu',
			phone: '+628112223344',
			imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti',
			bloodType: 'A+',
			dateOfBirth: '1992-03-22',
			gender: 'female',
			address: 'Jl. Diponegoro 88, Bandung'
		})
		.returning();

	const [hospital1] = await db
		.insert(hospitals)
		.values({
			name: 'Central Health Hospital',
			address: 'Jl. Sudirman No. 45',
			city: 'Jakarta',
			contact: '+62211234567',
			imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400'
		})
		.returning();

	const [hospital2] = await db
		.insert(hospitals)
		.values({
			name: 'Westside Neurology Clinic',
			address: 'Jl. Gatot Subroto No. 12',
			city: 'Jakarta',
			contact: '+62217654321',
			imageUrl: 'https://images.unsplash.com/photo-1586773866498-48aa388b6c5c?w=400'
		})
		.returning();

	const [hospital3] = await db
		.insert(hospitals)
		.values({
			name: 'Mercy General',
			address: 'Jl. MH Thamrin No. 88',
			city: 'Jakarta',
			contact: '+62215556677',
			imageUrl: 'https://images.unsplash.com/photo-1631217868264-e4b8bbff7170?w=400'
		})
		.returning();

	const specialistData = [
		{ name: 'Cardiology', slug: 'cardiology', icon: 'heart' },
		{ name: 'Dental', slug: 'dental', icon: 'dental' },
		{ name: 'Eye Care', slug: 'eye-care', icon: 'eye' },
		{ name: 'Pediatrics', slug: 'pediatrics', icon: 'pediatrics' },
		{ name: 'Neurology', slug: 'neurology', icon: 'neurology' },
		{ name: 'Orthopedics', slug: 'orthopedics', icon: 'orthopedics' },
		{ name: 'Psychology', slug: 'psychology', icon: 'psychology' },
		{ name: 'Dermatology', slug: 'dermatology', icon: 'dermatology' },
		{ name: 'ENT', slug: 'ent', icon: 'ent' },
		{ name: 'General', slug: 'general', icon: 'general' },
		{ name: 'Nutrition', slug: 'nutrition', icon: 'nutrition' },
		{ name: 'Oncology', slug: 'oncology', icon: 'oncology' }
	];

	const insertedSpecialists = await db.insert(specialists).values(specialistData).returning();
	const spec = Object.fromEntries(insertedSpecialists.map((s) => [s.slug, s]));
	const specialtyById = Object.fromEntries(insertedSpecialists.map((s) => [s.id, s.name]));

	const doctorRows = [
		{
			name: 'Dr. Sarah Jenkins',
			hospitalId: hospital1.id,
			specialistId: spec.cardiology.id,
			imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop',
			rating: '4.9',
			isOnline: true,
			fee: '180.00',
			reviews: 312
		},
		{
			name: 'Dr. James Wilson',
			hospitalId: hospital1.id,
			specialistId: spec.cardiology.id,
			imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop',
			rating: '4.7',
			isOnline: true,
			fee: '165.00',
			reviews: 245
		},
		{
			name: 'Dr. Emily Carter',
			hospitalId: hospital3.id,
			specialistId: spec.cardiology.id,
			imageUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop',
			rating: '4.6',
			isOnline: false,
			fee: '150.00',
			reviews: 198
		},
		{
			name: 'Dr. Robert Chen',
			hospitalId: hospital2.id,
			specialistId: spec.cardiology.id,
			imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop',
			rating: '4.8',
			isOnline: true,
			fee: '175.00',
			reviews: 270
		},
		{
			name: 'Dr. Lisa Park',
			hospitalId: hospital3.id,
			specialistId: spec.cardiology.id,
			imageUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop',
			rating: '4.5',
			isOnline: false,
			fee: '140.00',
			reviews: 132
		},
		{
			name: 'Dr. Marcus Thorne',
			hospitalId: hospital2.id,
			specialistId: spec.neurology.id,
			imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop',
			rating: '4.8',
			isOnline: false,
			fee: '210.00',
			reviews: 256
		},
		{
			name: 'Dr. Anna Becker',
			hospitalId: hospital1.id,
			specialistId: spec.dermatology.id,
			imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop',
			rating: '4.9',
			isOnline: true,
			fee: '160.00',
			reviews: 287
		},
		{
			name: 'Dr. David Ortiz',
			hospitalId: hospital3.id,
			specialistId: spec['eye-care'].id,
			imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop',
			rating: '4.7',
			isOnline: true,
			fee: '170.00',
			reviews: 221
		},
		{
			name: 'Dr. Maya Sari',
			hospitalId: hospital1.id,
			specialistId: spec.pediatrics.id,
			imageUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop',
			rating: '4.8',
			isOnline: true,
			fee: '155.00',
			reviews: 234
		},
		{
			name: 'Dr. Kevin Moore',
			hospitalId: hospital2.id,
			specialistId: spec.dental.id,
			imageUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop',
			rating: '4.6',
			isOnline: false,
			fee: '120.00',
			reviews: 145
		},
		{
			name: 'Dr. Helen Brooks',
			hospitalId: hospital3.id,
			specialistId: spec.general.id,
			imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop',
			rating: '4.5',
			isOnline: true,
			fee: '100.00',
			reviews: 168
		},
		{
			name: 'Dr. Omar Hassan',
			hospitalId: hospital1.id,
			specialistId: spec.orthopedics.id,
			imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop',
			rating: '4.7',
			isOnline: false,
			fee: '185.00',
			reviews: 192
		}
	];

	const insertedDoctors = await db
		.insert(doctors)
		.values(
			doctorRows.map((d) => ({
				name: d.name,
				hospitalId: d.hospitalId,
				specialistId: d.specialistId,
				imageUrl: d.imageUrl,
				rating: d.rating,
				isOnline: d.isOnline,
				isActive: true,
				consultationFee: d.fee,
				reviewCount: d.reviews,
				bio: BIO_BY_SPECIALTY[specialtyById[d.specialistId]] ?? null
			}))
		)
		.returning();

	const sarah = insertedDoctors.find((d) => d.name === 'Dr. Sarah Jenkins')!;

	const fullWeekSchedule = [
		{ dayOfWeek: 1, startTime: '08:00', endTime: '12:00', maxQuota: 3 },
		{ dayOfWeek: 1, startTime: '13:00', endTime: '17:00', maxQuota: 3 },
		{ dayOfWeek: 2, startTime: '08:00', endTime: '12:00', maxQuota: 4 },
		{ dayOfWeek: 2, startTime: '13:00', endTime: '17:00', maxQuota: 4 },
		{ dayOfWeek: 3, startTime: '09:00', endTime: '12:00', maxQuota: 5 },
		{ dayOfWeek: 3, startTime: '13:00', endTime: '16:00', maxQuota: 5 },
		{ dayOfWeek: 4, startTime: '08:00', endTime: '12:00', maxQuota: 4 },
		{ dayOfWeek: 5, startTime: '08:00', endTime: '12:00', maxQuota: 4 },
		{ dayOfWeek: 5, startTime: '13:00', endTime: '17:00', maxQuota: 3 }
	];

	const lightSchedule = [
		{ dayOfWeek: 1, startTime: '08:00', endTime: '12:00', maxQuota: 5 },
		{ dayOfWeek: 3, startTime: '08:00', endTime: '12:00', maxQuota: 5 },
		{ dayOfWeek: 5, startTime: '13:00', endTime: '17:00', maxQuota: 4 }
	];

	const scheduleInserts: (typeof doctorSchedules.$inferInsert)[] = [];
	for (const doc of insertedDoctors) {
		const template = doc.specialistId === spec.cardiology.id ? fullWeekSchedule : lightSchedule;
		for (const row of template) scheduleInserts.push({ ...row, doctorId: doc.id });
	}

	const insertedSchedules = await db.insert(doctorSchedules).values(scheduleInserts).returning();

	const sarahMondayAm = insertedSchedules.find(
		(s) => s.doctorId === sarah.id && s.dayOfWeek === 1 && s.startTime === '08:00'
	)!;
	const mondayDate = nextDateForDay(1);
	const tuesdayDate = nextDateForDay(2);
	const fridayUpcoming = nextFridayWeeksAhead(2);

	const sarahTuesday = insertedSchedules.find(
		(s) => s.doctorId === sarah.id && s.dayOfWeek === 2 && s.startTime === '08:00'
	)!;

	const marcus = insertedDoctors.find((d) => d.name === 'Dr. Marcus Thorne')!;
	const marcusFriday = insertedSchedules.find(
		(s) => s.doctorId === marcus.id && s.dayOfWeek === 5
	)!;

	const anna = insertedDoctors.find((d) => d.name === 'Dr. Anna Becker')!;
	const annaSchedule = insertedSchedules.find(
		(s) => s.doctorId === anna.id && s.dayOfWeek === 1
	)!;

	const james = insertedDoctors.find((d) => d.name === 'Dr. James Wilson')!;
	const jamesSchedule = insertedSchedules.find(
		(s) => s.doctorId === james.id && s.dayOfWeek === 3
	)!;

	const insertedBookings = await db
		.insert(bookings)
		.values([
			{
				userId: siti.id,
				doctorId: sarah.id,
				scheduleId: sarahMondayAm.id,
				appointmentDate: mondayDate,
				appointmentTime: '09:00',
				status: 'confirmed'
			},
			{
				userId: siti.id,
				doctorId: sarah.id,
				scheduleId: sarahMondayAm.id,
				appointmentDate: mondayDate,
				appointmentTime: '09:00',
				status: 'confirmed'
			},
			{
				userId: siti.id,
				doctorId: sarah.id,
				scheduleId: sarahMondayAm.id,
				appointmentDate: mondayDate,
				appointmentTime: '09:00',
				status: 'confirmed'
			},
			{
				userId: patient.id,
				doctorId: sarah.id,
				scheduleId: sarahTuesday.id,
				appointmentDate: tuesdayDate,
				appointmentTime: '10:30',
				status: 'confirmed'
			},
			{
				userId: patient.id,
				doctorId: marcus.id,
				scheduleId: marcusFriday.id,
				appointmentDate: fridayUpcoming,
				appointmentTime: '14:00',
				status: 'pending'
			},
			{
				userId: patient.id,
				doctorId: anna.id,
				scheduleId: annaSchedule.id,
				appointmentDate: dateOffset(-21),
				appointmentTime: '11:00',
				status: 'completed'
			},
			{
				userId: patient.id,
				doctorId: marcus.id,
				scheduleId: marcusFriday.id,
				appointmentDate: dateOffset(-35),
				appointmentTime: '08:00',
				status: 'completed'
			},
			{
				userId: patient.id,
				doctorId: james.id,
				scheduleId: jamesSchedule.id,
				appointmentDate: dateOffset(-10),
				appointmentTime: '09:30',
				status: 'cancelled'
			}
		])
		.returning();

	const completedBookingIds = insertedBookings
		.filter((b) => b.userId === patient.id && b.status === 'completed')
		.map((b) => b.id);

	const insertedCards = await db
		.insert(paymentCards)
		.values([
			{
				userId: patient.id,
				brand: 'visa',
				last4: '1234',
				expires: '12/26',
				isDefault: true
			},
			{
				userId: patient.id,
				brand: 'mastercard',
				last4: '8765',
				expires: '08/25',
				isDefault: false
			}
		])
		.returning();

	const defaultCard = insertedCards[0]!;

	await db.insert(paymentTransactions).values([
		{
			userId: patient.id,
			cardId: defaultCard.id,
			bookingId: completedBookingIds[0] ?? null,
			title: 'Dr. Anna Becker Consultation',
			amount: '160.00',
			currency: 'USD',
			paidAt: new Date(dateOffset(-21) + 'T11:30:00Z')
		},
		{
			userId: patient.id,
			cardId: insertedCards[1]!.id,
			bookingId: completedBookingIds[1] ?? null,
			title: 'Dr. Marcus Thorne Follow-up',
			amount: '210.00',
			currency: 'USD',
			paidAt: new Date(dateOffset(-35) + 'T09:00:00Z')
		},
		{
			userId: patient.id,
			cardId: defaultCard.id,
			bookingId: null,
			title: 'Prescription Refill',
			amount: '45.00',
			currency: 'USD',
			paidAt: new Date(dateOffset(-12) + 'T16:20:00Z')
		}
	]);

	await db.insert(insuranceProfiles).values({
		userId: patient.id,
		providerName: 'HEALTH PROVIDER',
		planName: 'BlueShield Plus',
		memberId: 'XYZ-987654321',
		groupNo: 'GRP-5544',
		planType: 'PPO Premier',
		coverageStart: `${new Date().getFullYear()}-01-01`,
		coverageEnd: `${new Date().getFullYear()}-12-31`,
		status: 'ACTIVE',
		costPcp: '20.00',
		costSpecialist: '40.00',
		costEmergency: '150.00',
		costRx: '50.00',
		providerPhone: '+18005551234'
	});

	await db.insert(medicalRecords).values([
		{
			userId: patient.id,
			title: 'Comprehensive Blood Panel',
			facility: 'Quest Diagnostics',
			type: 'lab',
			recordDate: dateOffset(-7)
		},
		{
			userId: patient.id,
			title: 'Chest X-Ray Report',
			facility: 'Central Health Hospital',
			type: 'imaging',
			recordDate: dateOffset(-14)
		},
		{
			userId: patient.id,
			title: 'Annual Physical Summary',
			facility: 'Dr. Sarah Jenkins',
			type: 'clinical',
			recordDate: dateOffset(-28)
		},
		{
			userId: patient.id,
			title: 'Lipid Profile',
			facility: 'Quest Diagnostics',
			type: 'lab',
			recordDate: dateOffset(-45)
		},
		{
			userId: patient.id,
			title: 'MRI Knee Scan',
			facility: 'Westside Neurology Clinic',
			type: 'imaging',
			recordDate: dateOffset(-60)
		},
		{
			userId: patient.id,
			title: 'Follow-up Consultation Note',
			facility: 'Dr. Marcus Thorne',
			type: 'clinical',
			recordDate: dateOffset(-75)
		}
	]);

	console.log('\nSeed complete.\n');
	console.log(`Manager: ${manager.email} / password123`);
	console.log(`Patient: ${patient.email} / password123`);
	console.log(`Patient: ${siti.email} / password123`);
	console.log(`Hospitals: 3 | Specialists: ${insertedSpecialists.length} | Doctors: ${insertedDoctors.length}`);
	console.log(`Schedules: ${insertedSchedules.length} | Bookings: ${insertedBookings.length}`);
	console.log(`Cards: ${insertedCards.length} | Insurance: 1 | Medical records: 6`);
	console.log(`Demo FULL slot: Dr. Sarah Jenkins on ${mondayDate} at 09:00`);

	await client.end();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
