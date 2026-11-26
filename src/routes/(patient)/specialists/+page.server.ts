import type { PageServerLoad } from './$types';
import { publicUserOrNull } from '#lib/server/auth/session.ts';
import { listSpecialists } from '#lib/server/catalog/catalog.ts';

const DISPLAY_ORDER = [
	'cardiology',
	'dental',
	'eye-care',
	'pediatrics',
	'neurology',
	'orthopedics',
	'psychology',
	'dermatology',
	'ent',
	'general',
	'nutrition',
	'oncology'
];

export const load: PageServerLoad = async ({ locals }) => {
	const user = publicUserOrNull(locals.user);
	const rows = await listSpecialists();

	const sorted = [...rows].sort((a, b) => {
		const ai = DISPLAY_ORDER.indexOf(a.slug);
		const bi = DISPLAY_ORDER.indexOf(b.slug);
		if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
		if (ai === -1) return 1;
		if (bi === -1) return -1;
		return ai - bi;
	});

	return { specialists: sorted, user };
};
