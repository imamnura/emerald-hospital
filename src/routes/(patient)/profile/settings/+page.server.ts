import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { clearSessionCookie, deleteSession, SESSION_COOKIE_NAME } from '#lib/server/auth.ts';
import { languageLabel, readPreferences, writePreference } from '#lib/server/preferences.ts';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (!locals.user) throw redirect(303, '/login?redirect=/profile/settings');

	const preferences = readPreferences(cookies);

	return {
		preferences,
		languageLabel: languageLabel(preferences.language)
	};
};

export const actions: Actions = {
	togglePush: async ({ cookies, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const current = readPreferences(cookies);
		writePreference(cookies, 'push', !current.pushNotifications);
		return { success: true };
	},
	toggleEmail: async ({ cookies, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		const current = readPreferences(cookies);
		writePreference(cookies, 'email', !current.emailNotifications);
		return { success: true };
	},
	logout: async ({ cookies, locals }) => {
		const sessionId = cookies.get(SESSION_COOKIE_NAME);
		if (sessionId) await deleteSession(sessionId);
		const opts = clearSessionCookie();
		cookies.set(opts.name, opts.value, { path: opts.path, maxAge: opts.maxAge });
		throw redirect(303, '/login');
	}
};
