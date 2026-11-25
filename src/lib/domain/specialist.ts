import {
	Apple,
	Baby,
	Bone,
	Brain,
	Ear,
	Eye,
	Heart,
	Microscope,
	ScanFace,
	Smile,
	Stethoscope,
	UserCog
} from '@lucide/svelte';

export function resolveSpecialistIcon(key: string | null | undefined) {
	switch (key?.toLowerCase()) {
		case 'heart':
		case 'cardiology':
			return Heart;
		case 'dental':
			return Smile;
		case 'eye':
		case 'eye-care':
			return Eye;
		case 'pediatrics':
		case 'baby':
			return Baby;
		case 'neurology':
		case 'brain':
			return Brain;
		case 'orthopedics':
		case 'bone':
			return Bone;
		case 'psychology':
			return UserCog;
		case 'dermatology':
			return ScanFace;
		case 'ent':
		case 'ear':
			return Ear;
		case 'general':
		case 'stethoscope':
			return Stethoscope;
		case 'nutrition':
		case 'apple':
			return Apple;
		case 'oncology':
			return Microscope;
		default:
			return Stethoscope;
	}
}

const SPECIALISTS: Record<string, { plural: string; role: string }> = {
	Cardiology: { plural: 'Cardiologists', role: 'Cardiologist' },
	Dental: { plural: 'Dentists', role: 'Dentist' },
	'Eye Care': { plural: 'Ophthalmologists', role: 'Ophthalmologist' },
	Pediatrics: { plural: 'Pediatricians', role: 'Pediatrician' },
	Neurology: { plural: 'Neurologists', role: 'Neurologist' },
	Orthopedics: { plural: 'Orthopedists', role: 'Orthopedist' },
	Psychology: { plural: 'Psychologists', role: 'Psychologist' },
	Dermatology: { plural: 'Dermatologists', role: 'Dermatologist' },
	ENT: { plural: 'ENT Specialists', role: 'ENT Specialist' },
	General: { plural: 'General Practitioners', role: 'General Practitioner' },
	Nutrition: { plural: 'Nutritionists', role: 'Nutritionist' },
	Oncology: { plural: 'Oncologists', role: 'Oncologist' }
};

/** Plural page title, e.g. Cardiology → Cardiologists */
export function specialistPluralTitle(name: string): string {
	return SPECIALISTS[name]?.plural ?? `${name} Specialists`;
}

/** Role under doctor name, e.g. Senior Cardiologist */
export function doctorRoleLabel(specialistName: string, rating: string): string {
	const role = SPECIALISTS[specialistName]?.role ?? specialistName;
	return parseFloat(rating) >= 4.8 ? `Senior ${role}` : role;
}

export function specialistAvailabilityLabel(count: number): string {
	const noun = count === 1 ? 'Specialist' : 'Specialists';
	return `${count} ${noun} available`;
}
