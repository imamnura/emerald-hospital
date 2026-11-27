import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { sessions, users } from '#lib/server/db/schema.ts';
import { GOOGLE_TOKEN_URL, OAUTH_COOKIES } from '#lib/server/auth/oauth-google.ts';
import { makeUser } from '#test/factories.ts';
import { ev, thrown, reset } from '#test/helpers/route.ts';
import { setEnv } from '#test/mocks/env-private.ts';
import { GET } from './+server.ts';

beforeEach(async () => {
	await reset();
	setEnv({ GOOGLE_CLIENT_ID: 'cid', GOOGLE_CLIENT_SECRET: 'csecret' });
});
afterEach(() => vi.restoreAllMocks());

type Info = { sub: string; email: string; email_verified: boolean; name?: string };

function stubGoogle(info: Info, opts: { tokenOk?: boolean } = {}) {
	const fetchMock = vi.fn(async (input: string | URL) => {
		if (String(input) === GOOGLE_TOKEN_URL) {
			return opts.tokenOk === false
				? new Response('bad code', { status: 400 })
				: Response.json({ access_token: 'at', expires_in: 3600, token_type: 'Bearer' });
		}
		return Response.json(info);
	});
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

const allCookies = (extra: Record<string, string> = {}) => ({
	[OAUTH_COOKIES.state]: 'st',
	[OAUTH_COOKIES.verifier]: 'ver',
	...extra
});

function callback(query: string, cookies: Record<string, string> = allCookies()) {
	const e = ev({ url: `http://localhost/login/google/callback?${query}`, cookies });
	return { e, run: () => GET(e) };
}

const loginError = (location: string | undefined) =>
	decodeURIComponent(new URL(location!, 'http://x').searchParams.get('error') ?? '');

const oauthCleared = (jar: Map<string, string>) =>
	!jar.has(OAUTH_COOKIES.state) && !jar.has(OAUTH_COOKIES.verifier) && !jar.has(OAUTH_COOKIES.redirect);

describe('GET /login/google/callback — failures', () => {
	it('500s when not configured', async () => {
		setEnv({ GOOGLE_CLIENT_ID: undefined });
		expect(await thrown(callback('code=c&state=st').run)).toMatchObject({ status: 500 });
	});

	it('maps provider errors and clears the oauth cookies', async () => {
		const denied = callback('error=access_denied', allCookies({ [OAUTH_COOKIES.redirect]: '/x' }));
		const r1 = await thrown(denied.run);
		expect(r1.status).toBe(303);
		expect(loginError(r1.location)).toBe('Google sign-in was cancelled.');
		expect(oauthCleared(denied.e.jar)).toBe(true);

		const other = await thrown(callback('error=server_error').run);
		expect(loginError(other.location)).toBe('Google sign-in failed. Please try again.');
	});

	it.each([
		['state=st', allCookies()],
		['code=c', allCookies()],
		['code=c&state=st', { [OAUTH_COOKIES.verifier]: 'ver' }],
		['code=c&state=st', { [OAUTH_COOKIES.state]: 'st' }]
	])('expired session when params/cookies missing (%s)', async (query, cookies) => {
		const r = await thrown(callback(query, cookies).run);
		expect(loginError(r.location)).toBe('Sign-in session expired. Please try again.');
	});

	it('rejects state mismatch', async () => {
		const { e, run } = callback('code=c&state=other');
		const r = await thrown(run);
		expect(loginError(r.location)).toBe('Sign-in verification failed. Please try again.');
		expect(oauthCleared(e.jar)).toBe(true);
	});

	it('handles token exchange failure', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		stubGoogle({ sub: 's', email: 'a@x.com', email_verified: true }, { tokenOk: false });
		const r = await thrown(callback('code=c&state=st').run);
		expect(loginError(r.location)).toBe('Could not complete Google sign-in. Please try again.');
		expect(console.error).toHaveBeenCalled();
	});

	it('refuses to link an unverified email to an existing account', async () => {
		await makeUser({ email: 'taken@x.com' });
		stubGoogle({ sub: 'g1', email: 'taken@x.com', email_verified: false });
		const r = await thrown(callback('code=c&state=st').run);
		expect(loginError(r.location)).toMatch(/already exists/);
	});

	it('refuses to create an account for an unverified email', async () => {
		stubGoogle({ sub: 'g1', email: 'new@x.com', email_verified: false });
		const r = await thrown(callback('code=c&state=st').run);
		expect(loginError(r.location)).toBe('Your Google account email is not verified.');
		expect(await db.select().from(users)).toHaveLength(0);
	});
});

describe('GET /login/google/callback — success', () => {
	it('creates a patient, sets the session and honours the stored redirect', async () => {
		const fetchMock = stubGoogle({ sub: 'g-new', email: 'New@X.com', email_verified: true, name: 'New' });
		const { e, run } = callback('code=c&state=st', allCookies({ [OAUTH_COOKIES.redirect]: '/appointments' }));
		expect(await thrown(run)).toMatchObject({ status: 303, location: '/appointments' });

		const [u] = await db.select().from(users).where(eq(users.googleId, 'g-new'));
		expect(u).toMatchObject({ email: 'new@x.com', role: 'patient', emailVerified: true });
		const [s] = await db.select().from(sessions).where(eq(sessions.id, e.jar.get('session_id')!));
		expect(s.userId).toBe(u.id);
		expect(oauthCleared(e.jar)).toBe(true);

		const tokenBody = fetchMock.mock.calls[0] as unknown as [string, { body: URLSearchParams }];
		expect(tokenBody[1].body.get('code_verifier')).toBe('ver');
		expect(tokenBody[1].body.get('redirect_uri')).toBe('http://localhost/login/google/callback');
	});

	it('links a verified email to an existing patient and defaults to /home', async () => {
		const existing = await makeUser({ email: 'pat@x.com' });
		stubGoogle({ sub: 'g-link', email: 'pat@x.com', email_verified: true });
		expect(await thrown(callback('code=c&state=st').run)).toMatchObject({ location: '/home' });
		const [u] = await db.select().from(users).where(eq(users.id, existing.id));
		expect(u.googleId).toBe('g-link');
	});

	it('sends managers to /manager regardless of stored redirect', async () => {
		await makeUser({ email: 'boss@x.com', role: 'manager', googleId: 'g-boss' });
		stubGoogle({ sub: 'g-boss', email: 'boss@x.com', email_verified: true });
		const { run } = callback('code=c&state=st', allCookies({ [OAUTH_COOKIES.redirect]: '/appointments' }));
		expect(await thrown(run)).toMatchObject({ location: '/manager' });
	});
});
