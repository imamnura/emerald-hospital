import { describe, expect, it } from 'vitest';
import { OAUTH_COOKIES } from '#lib/server/oauth-google.ts';
import { ev, thrown } from '../../../test/helpers-routes-public.ts';
import { setEnv } from '../../../test/mocks/env-private.ts';
import { GET } from './+server.ts';

const configure = () => setEnv({ GOOGLE_CLIENT_ID: 'client-123', GOOGLE_CLIENT_SECRET: 'secret' });

/** The handler throws a 303 redirect to Google (`{ external: true }`); return its target. */
function googleTarget(err: { status?: number; location?: string }): URL {
	expect(err).toMatchObject({ status: 303 });
	expect(err.location).toMatch(/^https:\/\/accounts\.google\.com\//);
	return new URL(err.location!);
}

describe('GET /login/google', () => {
	it('500s when Google is not configured', async () => {
		expect(await thrown(() => GET(ev({ url: '/login/google' })))).toMatchObject({ status: 500 });
	});

	it('stores state + verifier and targets Google with PKCE', async () => {
		configure();
		const e = ev({ url: 'http://localhost/login/google?redirect=/appointments' });
		const target = googleTarget(await thrown(() => GET(e)));

		expect(target.origin + target.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
		expect(target.searchParams.get('client_id')).toBe('client-123');
		expect(target.searchParams.get('redirect_uri')).toBe('http://localhost/login/google/callback');
		expect(target.searchParams.get('state')).toBe(e.jar.get(OAUTH_COOKIES.state));
		expect(target.searchParams.get('code_challenge_method')).toBe('S256');
		expect(target.searchParams.get('code_challenge')).toBeTruthy();
		expect(e.jar.get(OAUTH_COOKIES.verifier)).toBeTruthy();
		expect(e.jar.get(OAUTH_COOKIES.redirect)).toBe('/appointments');
	});

	it.each([
		['/login/google'],
		['/login/google?redirect=//evil.com'],
		['/login/google?redirect=https://evil.com'],
		['/login/google?redirect=/login/forgot']
	])('clears a stale redirect cookie for unsafe/missing target (%s)', async (url) => {
		configure();
		const e = ev({ url, cookies: { [OAUTH_COOKIES.redirect]: '/stale' } });
		googleTarget(await thrown(() => GET(e)));
		expect(e.jar.has(OAUTH_COOKIES.redirect)).toBe(false);
		expect(e.jar.get(OAUTH_COOKIES.state)).toBeTruthy();
	});
});
