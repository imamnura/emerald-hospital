import type { Handle } from '@sveltejs/kit/hooks';
import { SESSION_COOKIE_NAME, validateSession } from '#lib/server/auth/session.ts';
import { isManager } from '#lib/server/auth/guards.ts';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function isManagerPath(pathname: string): boolean {
	return pathname === '/manager' || pathname.startsWith('/manager/');
}

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(SESSION_COOKIE_NAME);
	event.locals.user = sessionId ? await validateSession(sessionId) : null;

	// Defence in depth: manager/+layout.server.ts only guards page loads, not form actions.
	// Each manager action also checks the role via denyUnlessManager().
	if (
		isManagerPath(event.url.pathname) &&
		!SAFE_METHODS.has(event.request.method) &&
		!isManager(event.locals)
	) {
		return new Response('Manager access required.', { status: 403 });
	}

	return resolve(event);
};
