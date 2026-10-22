import { fail, redirect } from '@sveltejs/kit';

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

export function requirePatient(locals: App.Locals) {
	if (!locals.user) throw redirect(303, '/login');
	if (locals.user.role !== 'patient') throw redirect(303, '/manager');
}

export function requireManager(locals: App.Locals) {
	if (!locals.user) throw redirect(303, '/login');
	if (locals.user.role !== 'manager') throw redirect(303, '/home');
}
