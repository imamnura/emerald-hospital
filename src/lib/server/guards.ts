import { fail, redirect } from '@sveltejs/kit';
import type { User } from './db/schema';

export function isManager(locals: App.Locals): boolean {
	return locals.user?.role === 'manager';
}

/**
 * Form-action guard. Layout `load` guards do NOT run before form actions,
 * so every manager action must call this itself:
 *
 *   const denied = denyUnlessManager(locals);
 *   if (denied) return denied;
 */
export function denyUnlessManager(locals: App.Locals) {
	return isManager(locals) ? null : fail(403, { error: 'Manager access required.' });
}

/** Returns the signed-in user, or redirects to `/login` (with `?redirect=returnTo` when given). */
export function requireUser(locals: App.Locals, returnTo?: string): User {
	if (!locals.user) throw redirect(303, returnTo ? '/login?redirect=' + returnTo : '/login');
	return locals.user;
}

export function requirePatient(locals: App.Locals, returnTo?: string): User {
	const user = requireUser(locals, returnTo);
	if (user.role !== 'patient') throw redirect(303, '/manager');
	return user;
}

export function requireManager(locals: App.Locals, returnTo?: string): User {
	const user = requireUser(locals, returnTo);
	if (user.role !== 'manager') throw redirect(303, '/home');
	return user;
}
