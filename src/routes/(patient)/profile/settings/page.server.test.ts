import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { sessions } from '#lib/server/db/schema.ts';
import { PREF_KEYS } from '#lib/server/preferences.ts';
import { resetDb, type TestDb } from '../../../../test/db.ts';
import { makeSession, makeUser } from '../../../../test/factories.ts';
import { ev, thrown } from '../../../../test/helpers-routes-public.ts';
import { actions, load } from './+page.server.ts';

beforeEach(() => resetDb(db as unknown as TestDb));

const user = { id: 'u' } as never;

describe('profile/settings load', () => {
	it('redirects anonymous users', async () => {
		expect(await thrown(() => load(ev()))).toMatchObject({
			status: 303,
			location: '/login?redirect=/profile/settings'
		});
	});

	it('reads preferences from cookies', async () => {
		expect(await load(ev({ user }))).toEqual({
			preferences: { pushNotifications: true, emailNotifications: false, language: 'en' },
			languageLabel: 'English'
		});
		const cookies = { [PREF_KEYS.push]: '0', [PREF_KEYS.email]: '1', [PREF_KEYS.language]: 'id' };
		expect(await load(ev({ user, cookies }))).toEqual({
			preferences: { pushNotifications: false, emailNotifications: true, language: 'id' },
			languageLabel: 'Bahasa Indonesia'
		});
	});
});

describe('profile/settings actions', () => {
	it('toggles require a session', async () => {
		for (const action of [actions.togglePush, actions.toggleEmail]) {
			expect(await thrown(() => action(ev()))).toMatchObject({ status: 303, location: '/login' });
		}
	});

	it('togglePush and toggleEmail flip the cookie', async () => {
		const e = ev({ user });
		expect(await actions.togglePush(e)).toEqual({ success: true });
		expect(e.jar.get(PREF_KEYS.push)).toBe('0');
		expect(await actions.togglePush(e)).toEqual({ success: true });
		expect(e.jar.get(PREF_KEYS.push)).toBe('1');

		expect(await actions.toggleEmail(e)).toEqual({ success: true });
		expect(e.jar.get(PREF_KEYS.email)).toBe('1');
		expect(await actions.toggleEmail(e)).toEqual({ success: true });
		expect(e.jar.get(PREF_KEYS.email)).toBe('0');
	});

	it('logout deletes the session (if any) and clears the cookie', async () => {
		const u = await makeUser();
		const sid = await makeSession(u.id);
		const e = ev({ user: u, cookies: { session_id: sid } });
		expect(await thrown(() => actions.logout(e))).toMatchObject({ status: 303, location: '/login' });
		expect(e.jar.get('session_id')).toBe('');
		expect(await db.select().from(sessions).where(eq(sessions.id, sid))).toHaveLength(0);

		const anon = ev();
		expect(await thrown(() => actions.logout(anon))).toMatchObject({ location: '/login' });
		expect(anon.jar.get('session_id')).toBe('');
	});
});
