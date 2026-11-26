import type { Cookies } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { makeEvent } from '../../../test/factories.ts';
import { PREF_KEYS, languageLabel, readPreferences, writePreference, type AppLanguage } from './preferences.ts';

const jar = (cookies: Record<string, string> = {}) => {
	const ev = makeEvent({ cookies });
	return { cookies: ev.cookies as unknown as Cookies, jar: ev.jar };
};

describe('languageLabel', () => {
	it('maps known codes and falls back to English', () => {
		expect(languageLabel('en')).toBe('English');
		expect(languageLabel('id')).toBe('Bahasa Indonesia');
		expect(languageLabel('fr' as AppLanguage)).toBe('English');
	});
});

describe('readPreferences', () => {
	it('defaults: push on, email off, english', () => {
		expect(readPreferences(jar().cookies)).toEqual({
			pushNotifications: true,
			emailNotifications: false,
			language: 'en'
		});
	});

	it('reads stored values', () => {
		const { cookies } = jar({
			[PREF_KEYS.push]: '0',
			[PREF_KEYS.email]: '1',
			[PREF_KEYS.language]: 'id'
		});
		expect(readPreferences(cookies)).toEqual({
			pushNotifications: false,
			emailNotifications: true,
			language: 'id'
		});
	});

	it('ignores unknown language values', () => {
		expect(readPreferences(jar({ [PREF_KEYS.language]: 'fr' }).cookies).language).toBe('en');
	});
});

describe('writePreference', () => {
	it('writes push/email as 1/0 and language verbatim, with year-long non-httpOnly cookies', () => {
		const { cookies, jar: store } = jar();
		const set = vi.spyOn(cookies, 'set');
		writePreference(cookies, 'push', false);
		writePreference(cookies, 'email', true);
		writePreference(cookies, 'language', 'id');
		expect(store.get('push_notifications')).toBe('0');
		expect(store.get('email_notifications')).toBe('1');
		expect(store.get('app_language')).toBe('id');
		expect(set).toHaveBeenCalledWith('push_notifications', '0', {
			path: '/',
			maxAge: 60 * 60 * 24 * 365,
			httpOnly: false,
			sameSite: 'lax'
		});

		writePreference(cookies, 'push', true);
		writePreference(cookies, 'email', false);
		expect(readPreferences(cookies)).toEqual({
			pushNotifications: true,
			emailNotifications: false,
			language: 'id'
		});
	});
});
