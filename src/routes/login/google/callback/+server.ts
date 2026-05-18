import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSession, sessionCookieOptions } from '$lib/server/auth';
import {
	OAUTH_COOKIES,
	exchangeCodeForTokens,
	fetchGoogleUserInfo,
	findOrCreateGoogleUser,
	getConfig,
	oauthCookieOptions
} from '$lib/server/oauth-google';

function clearOAuthCookies(cookies: Parameters<RequestHandler>[0]['cookies']) {
	const path = oauthCookieOptions().path;
	cookies.delete(OAUTH_COOKIES.state, { path });
	cookies.delete(OAUTH_COOKIES.verifier, { path });
	cookies.delete(OAUTH_COOKIES.redirect, { path });
}

function loginErrorRedirect(message: string): never {
	throw redirect(303, `/login?error=${encodeURIComponent(message)}`);
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	const config = getConfig();
	if (!config) throw error(500, 'Google sign-in is not configured on this server.');

	const code = url.searchParams.get('code');
	const stateParam = url.searchParams.get('state');
	const providerError = url.searchParams.get('error');

	const stateCookie = cookies.get(OAUTH_COOKIES.state);
	const verifier = cookies.get(OAUTH_COOKIES.verifier);
	const redirectAfter = cookies.get(OAUTH_COOKIES.redirect) ?? '/home';

	if (providerError) {
		clearOAuthCookies(cookies);
		loginErrorRedirect(
			providerError === 'access_denied'
				? 'Google sign-in was cancelled.'
				: 'Google sign-in failed. Please try again.'
		);
	}

	if (!code || !stateParam || !stateCookie || !verifier) {
		clearOAuthCookies(cookies);
		loginErrorRedirect('Sign-in session expired. Please try again.');
	}

	if (stateParam !== stateCookie) {
		clearOAuthCookies(cookies);
		loginErrorRedirect('Sign-in verification failed. Please try again.');
	}

	const redirectUri = `${url.origin}/login/google/callback`;

	let tokens;
	let info;
	try {
		tokens = await exchangeCodeForTokens({
			config,
			code,
			codeVerifier: verifier,
			redirectUri
		});
		info = await fetchGoogleUserInfo(tokens.accessToken);
	} catch (e) {
		console.error('Google OAuth callback error:', e);
		clearOAuthCookies(cookies);
		loginErrorRedirect('Could not complete Google sign-in. Please try again.');
	}

	const result = await findOrCreateGoogleUser(info);
	if (!result.ok) {
		clearOAuthCookies(cookies);
		if (result.reason === 'email_collision') {
			loginErrorRedirect(
				'An account with this email already exists. Sign in with your password, then link Google from your profile.'
			);
		}
		loginErrorRedirect('Your Google account email is not verified.');
	}

	const sessionId = await createSession(result.user.id);
	const opts = sessionCookieOptions(sessionId);
	cookies.set(opts.name, opts.value, {
		path: opts.path,
		httpOnly: opts.httpOnly,
		sameSite: opts.sameSite,
		secure: opts.secure,
		maxAge: opts.maxAge
	});

	clearOAuthCookies(cookies);

	const target = result.user.role === 'manager' ? '/manager' : redirectAfter;
	throw redirect(303, target);
};
