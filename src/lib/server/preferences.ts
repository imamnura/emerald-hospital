import type { Cookies } from '@sveltejs/kit';

const COOKIE_OPTS = { path: '/', maxAge: 60 * 60 * 24 * 365, httpOnly: false, sameSite: 'lax' as const };

/** @internal exported for tests */
export const PREF_KEYS = {
	push: 'push_notifications',
	email: 'email_notifications',
	language: 'app_language'
} as const;

export type AppLanguage = 'en' | 'id';

export type UserPreferences = {
	pushNotifications: boolean;
	emailNotifications: boolean;
	language: AppLanguage;
};

const LANGUAGE_LABELS: Record<AppLanguage, string> = {
	en: 'English',
	id: 'Bahasa Indonesia'
};

export function languageLabel(code: AppLanguage): string {
	return LANGUAGE_LABELS[code] ?? 'English';
}

export function readPreferences(cookies: Cookies): UserPreferences {
	const lang = cookies.get(PREF_KEYS.language);
	return {
		pushNotifications: cookies.get(PREF_KEYS.push) !== '0',
		emailNotifications: cookies.get(PREF_KEYS.email) === '1',
		language: lang === 'id' ? 'id' : 'en'
	};
}

export function writePreference(
	cookies: Cookies,
	key: 'push' | 'email' | 'language',
	value: boolean | AppLanguage
): void {
	if (key === 'push') {
		cookies.set(PREF_KEYS.push, value ? '1' : '0', COOKIE_OPTS);
	} else if (key === 'email') {
		cookies.set(PREF_KEYS.email, value ? '1' : '0', COOKIE_OPTS);
	} else {
		cookies.set(PREF_KEYS.language, value as AppLanguage, COOKIE_OPTS);
	}
}
