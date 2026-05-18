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
