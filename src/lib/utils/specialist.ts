/** Plural page title, e.g. Cardiology → Cardiologists */
export function specialistPluralTitle(name: string): string {
	const map: Record<string, string> = {
		Cardiology: 'Cardiologists',
		Dental: 'Dentists',
		'Eye Care': 'Ophthalmologists',
		Pediatrics: 'Pediatricians',
		Neurology: 'Neurologists',
		Orthopedics: 'Orthopedists',
		Psychology: 'Psychologists',
		Dermatology: 'Dermatologists',
		ENT: 'ENT Specialists',
		General: 'General Practitioners',
		Nutrition: 'Nutritionists',
		Oncology: 'Oncologists'
	};
	return map[name] ?? `${name} Specialists`;
}

/** Role under doctor name, e.g. Senior Cardiologist */
export function doctorRoleLabel(specialistName: string, rating: string): string {
	const roleMap: Record<string, string> = {
		Cardiology: 'Cardiologist',
		Dental: 'Dentist',
		'Eye Care': 'Ophthalmologist',
		Pediatrics: 'Pediatrician',
		Neurology: 'Neurologist',
		Orthopedics: 'Orthopedist',
		Psychology: 'Psychologist',
		Dermatology: 'Dermatologist',
		ENT: 'ENT Specialist',
		General: 'General Practitioner',
		Nutrition: 'Nutritionist',
		Oncology: 'Oncologist'
	};
	const role = roleMap[specialistName] ?? specialistName;
	return parseFloat(rating) >= 4.8 ? `Senior ${role}` : role;
}

export function specialistAvailabilityLabel(count: number): string {
	const noun = count === 1 ? 'Specialist' : 'Specialists';
	return `${count} ${noun} available`;
}
