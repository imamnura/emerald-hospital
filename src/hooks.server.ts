import { redirect, type Handle } from '@sveltejs/kit';
import { SESSION_COOKIE_NAME, validateSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(SESSION_COOKIE_NAME);
	event.locals.user = sessionId ? await validateSession(sessionId) : null;
	return resolve(event);
};

export function requirePatient(locals: App.Locals) {
	if (!locals.user) throw redirect(303, '/login');
	if (locals.user.role !== 'patient') throw redirect(303, '/manager');
}

export function requireManager(locals: App.Locals) {
	if (!locals.user) throw redirect(303, '/login');
	if (locals.user.role !== 'manager') throw redirect(303, '/home');
}
