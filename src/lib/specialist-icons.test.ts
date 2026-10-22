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
import { resolveSpecialistIcon } from '#lib/specialist-icons.ts';

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
