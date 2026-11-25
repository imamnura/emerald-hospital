import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import * as env from '$app/env/private';
import { db } from './db';
import { users, type User } from './db/schema';

/** @internal exported for tests */
export const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
/** @internal exported for tests */
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
/** @internal exported for tests */
export const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

export type GoogleConfig = {
	clientId: string;
	clientSecret: string;
};

export function getConfig(): GoogleConfig | null {
	const clientId = env.GOOGLE_CLIENT_ID;
	const clientSecret = env.GOOGLE_CLIENT_SECRET;
	if (!clientId || !clientSecret) return null;
	return { clientId, clientSecret };
}

export function isConfigured(): boolean {
	return getConfig() !== null;
}

function base64Url(buf: Buffer): string {
	return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generateState(): string {
	return base64Url(crypto.randomBytes(16));
}

export function generatePkce(): { verifier: string; challenge: string } {
	const verifier = base64Url(crypto.randomBytes(32));
	const challenge = base64Url(crypto.createHash('sha256').update(verifier).digest());
	return { verifier, challenge };
}

export function buildAuthorizeUrl(args: {
	clientId: string;
	redirectUri: string;
	state: string;
	codeChallenge: string;
}): string {
	const params = new URLSearchParams({
		client_id: args.clientId,
		redirect_uri: args.redirectUri,
		response_type: 'code',
		scope: 'openid email profile',
		state: args.state,
		code_challenge: args.codeChallenge,
		code_challenge_method: 'S256',
		access_type: 'online',
		prompt: 'select_account'
	});
	return `${GOOGLE_AUTHORIZE_URL}?${params.toString()}`;
}

export type GoogleTokens = {
	accessToken: string;
	idToken: string | null;
	expiresIn: number;
	tokenType: string;
};

export async function exchangeCodeForTokens(args: {
	config: GoogleConfig;
	code: string;
	codeVerifier: string;
	redirectUri: string;
}): Promise<GoogleTokens> {
	const body = new URLSearchParams({
		client_id: args.config.clientId,
		client_secret: args.config.clientSecret,
		code: args.code,
		code_verifier: args.codeVerifier,
		grant_type: 'authorization_code',
		redirect_uri: args.redirectUri
	});

	const res = await fetch(GOOGLE_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body
	});

	if (!res.ok) {
		const detail = await res.text();
		throw new Error(`Google token exchange failed (${res.status}): ${detail}`);
	}

	const json = (await res.json()) as {
		access_token: string;
		id_token?: string;
		expires_in: number;
		token_type: string;
	};

	return {
		accessToken: json.access_token,
		idToken: json.id_token ?? null,
		expiresIn: json.expires_in,
		tokenType: json.token_type
	};
}

export type GoogleUserInfo = {
	sub: string;
	email: string;
	emailVerified: boolean;
	name: string;
	picture: string | null;
};

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
	const res = await fetch(GOOGLE_USERINFO_URL, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
	if (!res.ok) {
		const detail = await res.text();
		throw new Error(`Google userinfo failed (${res.status}): ${detail}`);
	}
	const json = (await res.json()) as {
		sub: string;
		email: string;
		email_verified: boolean;
		name?: string;
		picture?: string;
	};
	return {
		sub: json.sub,
		email: json.email.toLowerCase(),
		emailVerified: Boolean(json.email_verified),
		name: json.name ?? json.email.split('@')[0],
		picture: json.picture ?? null
	};
}

/**
 * Resolve the user for a Google sign-in:
 *   1. Existing user with matching google_id → return it.
 *   2. Existing user with matching email AND Google says email_verified → link google_id and return.
 *   3. Otherwise → create a new user.
 *
 * Refuses to link when Google has not verified the email, to prevent
 * account takeover via attacker-controlled Google accounts.
 */
export async function findOrCreateGoogleUser(info: GoogleUserInfo): Promise<
	| { ok: true; user: User; created: boolean; linked: boolean }
	| { ok: false; reason: 'email_unverified' | 'email_collision' }
> {
	const [byGoogle] = await db
		.select()
		.from(users)
		.where(eq(users.googleId, info.sub))
		.limit(1);
	if (byGoogle) return { ok: true, user: byGoogle, created: false, linked: false };

	const [byEmail] = await db
		.select()
		.from(users)
		.where(eq(users.email, info.email))
		.limit(1);

	if (byEmail) {
		if (!info.emailVerified) return { ok: false, reason: 'email_collision' };
		const [linked] = await db
			.update(users)
			.set({
				googleId: info.sub,
				emailVerified: true,
				imageUrl: byEmail.imageUrl ?? info.picture
			})
			.where(eq(users.id, byEmail.id))
			.returning();
		return { ok: true, user: linked, created: false, linked: true };
	}

	if (!info.emailVerified) return { ok: false, reason: 'email_unverified' };

	const [created] = await db
		.insert(users)
		.values({
			email: info.email,
			emailVerified: true,
			googleId: info.sub,
			name: info.name,
			imageUrl: info.picture,
			role: 'patient',
			passwordHash: null
		})
		.returning();

	return { ok: true, user: created, created: true, linked: false };
}

/** Cookies used during the OAuth round trip. Short-lived, HttpOnly. */
export const OAUTH_COOKIES = {
	state: 'g_oauth_state',
	verifier: 'g_oauth_verifier',
	redirect: 'g_oauth_redirect'
} as const;

export function oauthCookieOptions() {
	return {
		path: '/login/google',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax' as const,
		maxAge: 60 * 10 // 10 minutes
	};
}
