import { describe, expect, it } from 'vitest';
import { PREF_KEYS } from '#lib/server/patient/preferences.ts';
import { ev, thrown } from '../../../../../test/helpers-routes-public.ts';
import { actions, load } from './+page.server.ts';

const user = { id: 'u' } as never;

describe('profile/settings/language load', () => {
	it('redirects anonymous users', async () => {
		expect(await thrown(() => load(ev()))).toMatchObject({
			status: 303,
			location: '/login?redirect=/profile/settings/language'
		});
	});

	it('returns current language and options', async () => {
		expect(await load(ev({ user, cookies: { [PREF_KEYS.language]: 'id' } }))).toEqual({
			current: 'id',
			options: [
				{ code: 'en', label: 'English' },
				{ code: 'id', label: 'Bahasa Indonesia' }
			]
		});
	});
});

describe('profile/settings/language set action', () => {
	it('redirects anonymous users', async () => {
		expect(await thrown(() => actions.set(ev({ form: { language: 'en' } })))).toMatchObject({
			location: '/login'
		});
	});

	it('rejects unsupported languages', async () => {
		const e = ev({ user, form: { language: 'fr' } });
		expect(await actions.set(e)).toMatchObject({ status: 400, data: { error: 'Invalid language.' } });
		expect(e.jar.has(PREF_KEYS.language)).toBe(false);
		expect(await actions.set(ev({ user, form: { other: '1' } }))).toMatchObject({ status: 400 });
	});

	it.each(['en', 'id'])('stores %s and returns to settings', async (language) => {
		const e = ev({ user, form: { language } });
		expect(await thrown(() => actions.set(e))).toMatchObject({ status: 303, location: '/profile/settings' });
		expect(e.jar.get(PREF_KEYS.language)).toBe(language);
	});
});
