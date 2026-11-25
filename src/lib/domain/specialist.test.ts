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
import { describe, expect, it } from 'vitest';
import {
	doctorRoleLabel,
	resolveSpecialistIcon,
	specialistAvailabilityLabel,
	specialistPluralTitle
} from '#lib/domain/specialist.ts';

describe('resolveSpecialistIcon', () => {
	it.each([
		['heart', Heart],
		['cardiology', Heart],
		['dental', Smile],
		['eye', Eye],
		['eye-care', Eye],
		['pediatrics', Baby],
		['baby', Baby],
		['neurology', Brain],
		['brain', Brain],
		['orthopedics', Bone],
		['bone', Bone],
		['psychology', UserCog],
		['dermatology', ScanFace],
		['ent', Ear],
		['ear', Ear],
		['general', Stethoscope],
		['stethoscope', Stethoscope],
		['nutrition', Apple],
		['apple', Apple],
		['oncology', Microscope]
	])('%s', (key, icon) => {
		expect(resolveSpecialistIcon(key)).toBe(icon);
	});

	it('is case-insensitive', () => {
		expect(resolveSpecialistIcon('HEART')).toBe(Heart);
		expect(resolveSpecialistIcon('Eye-Care')).toBe(Eye);
	});

	it('falls back to Stethoscope for unknown, null and undefined', () => {
		expect(resolveSpecialistIcon('unknown')).toBe(Stethoscope);
		expect(resolveSpecialistIcon(null)).toBe(Stethoscope);
		expect(resolveSpecialistIcon(undefined)).toBe(Stethoscope);
		expect(resolveSpecialistIcon('')).toBe(Stethoscope);
	});
});

describe('specialist', () => {
	it.each([
		['Cardiology', 'Cardiologists'],
		['Dental', 'Dentists'],
		['Eye Care', 'Ophthalmologists'],
		['ENT', 'ENT Specialists'],
		['General', 'General Practitioners'],
		['Oncology', 'Oncologists'],
		['Podiatry', 'Podiatry Specialists']
	])('plural title %s -> %s', (name, title) => {
		expect(specialistPluralTitle(name)).toBe(title);
	});

	it('labels doctor role, prefixing Senior for rating >= 4.8', () => {
		expect(doctorRoleLabel('Cardiology', '4.5')).toBe('Cardiologist');
		expect(doctorRoleLabel('Cardiology', '4.8')).toBe('Senior Cardiologist');
		expect(doctorRoleLabel('Eye Care', '5.0')).toBe('Senior Ophthalmologist');
		expect(doctorRoleLabel('Podiatry', '4.79')).toBe('Podiatry');
		expect(doctorRoleLabel('Podiatry', '4.9')).toBe('Senior Podiatry');
		expect(doctorRoleLabel('General', 'n/a')).toBe('General Practitioner');
	});

	it('pluralises availability label', () => {
		expect(specialistAvailabilityLabel(0)).toBe('0 Specialists available');
		expect(specialistAvailabilityLabel(1)).toBe('1 Specialist available');
		expect(specialistAvailabilityLabel(12)).toBe('12 Specialists available');
	});
});
