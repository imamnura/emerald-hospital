import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '#lib/server/db/index.ts';
import { users } from '#lib/server/db/schema.ts';
import { resetDb, type TestDb } from '../../test/db.ts';
import { makeUser } from '../../test/factories.ts';
import { setEnv } from '../../test/mocks/env-private.ts';
import {
	GOOGLE_AUTHORIZE_URL,
	GOOGLE_TOKEN_URL,
	GOOGLE_USERINFO_URL,
	OAUTH_COOKIES,
	buildAuthorizeUrl,
	exchangeCodeForTokens,
	fetchGoogleUserInfo,
	findOrCreateGoogleUser,
	generatePkce,
	generateState,
	getConfig,
	isConfigured,
	oauthCookieOptions,
	type GoogleUserInfo
} from './oauth-google.ts';

beforeEach(() => resetDb(db as unknown as TestDb));
afterEach(() => {
	vi.unstubAllEnvs();
});

const jsonResponse = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('config', () => {
	it('requires both client id and secret', () => {
		expect(getConfig()).toBeNull();
		expect(isConfigured()).toBe(false);
		setEnv({ GOOGLE_CLIENT_ID: 'id' });
		expect(getConfig()).toBeNull();
		setEnv({ GOOGLE_CLIENT_ID: undefined, GOOGLE_CLIENT_SECRET: 'secret' });
		expect(getConfig()).toBeNull();
		setEnv({ GOOGLE_CLIENT_ID: 'id' });
		expect(getConfig()).toEqual({ clientId: 'id', clientSecret: 'secret' });
		expect(isConfigured()).toBe(true);
	});
});

describe('state and PKCE', () => {
	it('generates url-safe random state', () => {
		const a = generateState();
		expect(a).toMatch(/^[A-Za-z0-9_-]{22}$/);
		expect(generateState()).not.toBe(a);
	});

	it('generates an S256 challenge for the verifier', () => {
		const { verifier, challenge } = generatePkce();
		expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
		expect(challenge).toBe(crypto.createHash('sha256').update(verifier).digest('base64url'));
	});
});

describe('buildAuthorizeUrl', () => {
	it('includes every required OAuth parameter', () => {
		const url = new URL(
			buildAuthorizeUrl({
				clientId: 'cid',
				redirectUri: 'http://localhost/login/google/callback',
				state: 'st',
				codeChallenge: 'ch'
			})
		);
		expect(`${url.origin}${url.pathname}`).toBe(GOOGLE_AUTHORIZE_URL);
		expect(Object.fromEntries(url.searchParams)).toEqual({
			client_id: 'cid',
			redirect_uri: 'http://localhost/login/google/callback',
			response_type: 'code',
			scope: 'openid email profile',
			state: 'st',
			code_challenge: 'ch',
			code_challenge_method: 'S256',
			access_type: 'online',
			prompt: 'select_account'
		});
	});
});

describe('exchangeCodeForTokens', () => {
	const args = {
		config: { clientId: 'cid', clientSecret: 'sec' },
		code: 'the-code',
		codeVerifier: 'ver',
		redirectUri: 'http://localhost/cb'
	};

	it('posts the form and maps the token response', async () => {
		const fetchMock = vi.fn(async () =>
			jsonResponse({ access_token: 'at', id_token: 'it', expires_in: 3599, token_type: 'Bearer' })
		);
		vi.stubGlobal('fetch', fetchMock);
		expect(await exchangeCodeForTokens(args)).toEqual({
			accessToken: 'at',
			idToken: 'it',
			expiresIn: 3599,
			tokenType: 'Bearer'
		});
		const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe(GOOGLE_TOKEN_URL);
		expect(init.method).toBe('POST');
		expect(init.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
		expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
			client_id: 'cid',
			client_secret: 'sec',
			code: 'the-code',
			code_verifier: 'ver',
			grant_type: 'authorization_code',
			redirect_uri: 'http://localhost/cb'
		});
	});

	it('defaults idToken to null', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => jsonResponse({ access_token: 'at', expires_in: 1, token_type: 'Bearer' }))
		);
		expect((await exchangeCodeForTokens(args)).idToken).toBeNull();
	});

	it('throws with status and body on failure', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response('invalid_grant', { status: 400 })));
		await expect(exchangeCodeForTokens(args)).rejects.toThrow(
			'Google token exchange failed (400): invalid_grant'
		);
	});
});

describe('fetchGoogleUserInfo', () => {
	it('sends the bearer token and normalises the profile', async () => {
		const fetchMock = vi.fn(async () =>
			jsonResponse({
				sub: '123',
				email: 'Jane@Example.COM',
				email_verified: true,
				name: 'Jane',
				picture: 'http://pic'
			})
		);
		vi.stubGlobal('fetch', fetchMock);
		expect(await fetchGoogleUserInfo('tok')).toEqual({
			sub: '123',
			email: 'jane@example.com',
			emailVerified: true,
			name: 'Jane',
			picture: 'http://pic'
		});
		expect(fetchMock).toHaveBeenCalledWith(GOOGLE_USERINFO_URL, {
			headers: { Authorization: 'Bearer tok' }
		});
	});

	it('falls back to the email local part and null picture', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ sub: '1', email: 'bob@x.com' })));
		expect(await fetchGoogleUserInfo('tok')).toEqual({
			sub: '1',
			email: 'bob@x.com',
			emailVerified: false,
			name: 'bob',
			picture: null
		});
	});

	it('throws on non-ok responses', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 401 })));
		await expect(fetchGoogleUserInfo('bad')).rejects.toThrow('Google userinfo failed (401): nope');
	});
});

describe('findOrCreateGoogleUser', () => {
	const info = (o: Partial<GoogleUserInfo> = {}): GoogleUserInfo => ({
		sub: 'g-1',
		email: 'jane@test.com',
		emailVerified: true,
		name: 'Jane G',
		picture: 'http://pic',
		...o
	});

	it('returns the user already linked by google_id', async () => {
		const existing = await makeUser({ googleId: 'g-1', email: 'other@test.com' });
		const res = await findOrCreateGoogleUser(info({ emailVerified: false }));
		expect(res).toEqual({ ok: true, user: existing, created: false, linked: false });
	});

	it('links a verified email to an existing account, keeping an existing image', async () => {
		const existing = await makeUser({ email: 'jane@test.com', imageUrl: 'http://mine', emailVerified: false });
		const res = await findOrCreateGoogleUser(info());
		expect(res).toMatchObject({ ok: true, created: false, linked: true });
		if (!res.ok) throw new Error('expected ok');
		expect(res.user).toMatchObject({
			id: existing.id,
			googleId: 'g-1',
			emailVerified: true,
			imageUrl: 'http://mine'
		});
	});

	it('uses the Google picture when linking an account without an image', async () => {
		await makeUser({ email: 'jane@test.com', imageUrl: null });
		const res = await findOrCreateGoogleUser(info());
		if (!res.ok) throw new Error('expected ok');
		expect(res.user.imageUrl).toBe('http://pic');
	});

	it('refuses to link an unverified email to an existing account', async () => {
		const existing = await makeUser({ email: 'jane@test.com' });
		expect(await findOrCreateGoogleUser(info({ emailVerified: false }))).toEqual({
			ok: false,
			reason: 'email_collision'
		});
		const [row] = await db.select().from(users).where(eq(users.id, existing.id));
		expect(row.googleId).toBeNull();
	});

	it('refuses to create an account for an unverified email', async () => {
		expect(await findOrCreateGoogleUser(info({ emailVerified: false }))).toEqual({
			ok: false,
			reason: 'email_unverified'
		});
		expect(await db.select().from(users)).toHaveLength(0);
	});

	it('creates a new patient for a verified, unknown email', async () => {
		const res = await findOrCreateGoogleUser(info({ picture: null }));
		expect(res).toMatchObject({ ok: true, created: true, linked: false });
		if (!res.ok) throw new Error('expected ok');
		expect(res.user).toMatchObject({
			email: 'jane@test.com',
			emailVerified: true,
			googleId: 'g-1',
			name: 'Jane G',
			imageUrl: null,
			role: 'patient',
			passwordHash: null
		});
	});
});

describe('cookies', () => {
	it('names the round-trip cookies', () => {
		expect(OAUTH_COOKIES).toEqual({
			state: 'g_oauth_state',
			verifier: 'g_oauth_verifier',
			redirect: 'g_oauth_redirect'
		});
	});

	it('is secure only in production', () => {
		vi.stubEnv('NODE_ENV', 'development');
		expect(oauthCookieOptions()).toEqual({
			path: '/login/google',
			httpOnly: true,
			secure: false,
			sameSite: 'lax',
			maxAge: 600
		});
		vi.stubEnv('NODE_ENV', 'production');
		expect(oauthCookieOptions().secure).toBe(true);
	});
});
