import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	languageLabel,
	readPreferences,
	writePreference,
	type AppLanguage
} from '$lib/server/preferences';

const LANGUAGES: AppLanguage[] = ['en', 'id'];

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (!locals.user) throw redirect(303, '/login?redirect=/profile/settings/language');

	const preferences = readPreferences(cookies);

	return {
		current: preferences.language,
		options: LANGUAGES.map((code) => ({ code, label: languageLabel(code) }))
	};
};

export const actions: Actions = {
	set: async ({ request, cookies, locals }) => {
		if (!locals.user) throw redirect(303, '/login');

		const language = String((await request.formData()).get('language') ?? '');
		if (language !== 'en' && language !== 'id') {
			return fail(400, { error: 'Invalid language.' });
		}

		writePreference(cookies, 'language', language as AppLanguage);
		throw redirect(303, '/profile/settings');
	}
};
