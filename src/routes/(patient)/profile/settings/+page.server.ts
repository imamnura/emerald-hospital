import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { endSession } from '#lib/server/auth.ts';
import { requireUser } from '#lib/server/guards.ts';
import { languageLabel, readPreferences, writePreference } from '#lib/server/preferences.ts';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	requireUser(locals, '/profile/settings');

	const preferences = readPreferences(cookies);

	return {
		preferences,
		languageLabel: languageLabel(preferences.language)
	};
};

export const actions: Actions = {
	togglePush: async ({ cookies, locals }) => {
		requireUser(locals);
		const current = readPreferences(cookies);
		writePreference(cookies, 'push', !current.pushNotifications);
		return { success: true };
	},
	toggleEmail: async ({ cookies, locals }) => {
		requireUser(locals);
		const current = readPreferences(cookies);
		writePreference(cookies, 'email', !current.emailNotifications);
		return { success: true };
	},
	logout: async ({ cookies }) => {
		await endSession(cookies);
		throw redirect(303, '/login');
	}
};
