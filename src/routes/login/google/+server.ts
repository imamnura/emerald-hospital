import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sanitizeRedirect } from '#lib/server/auth/redirect.ts';
import {
	OAUTH_COOKIES,
	buildAuthorizeUrl,
	generatePkce,
	generateState,
	getConfig,
	oauthCookieOptions
} from '#lib/server/auth/oauth-google.ts';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const config = getConfig();
	if (!config) {
		throw error(500, 'Google sign-in is not configured on this server.');
	}

	const state = generateState();
	const { verifier, challenge } = generatePkce();
	const redirectUri = `${url.origin}/login/google/callback`;
	const opts = oauthCookieOptions();

	cookies.set(OAUTH_COOKIES.state, state, opts);
	cookies.set(OAUTH_COOKIES.verifier, verifier, opts);

	const postLogin = sanitizeRedirect(url.searchParams.get('redirect'));
	if (postLogin) cookies.set(OAUTH_COOKIES.redirect, postLogin, opts);
	else cookies.delete(OAUTH_COOKIES.redirect, { path: opts.path });

	const authUrl = buildAuthorizeUrl({
		clientId: config.clientId,
		redirectUri,
		state,
		codeChallenge: challenge
	});

	throw redirect(303, authUrl, { external: true });
};
