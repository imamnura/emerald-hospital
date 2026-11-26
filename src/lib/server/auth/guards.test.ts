import { describe, expect, it } from 'vitest';
import { makeManager, makeUser } from '../../../test/factories.ts';
import { denyUnlessManager, isManager, requireManager, requirePatient, requireUser } from './guards.ts';

const locals = (role: 'manager' | 'patient' | null) =>
	({ user: role ? { role } : null }) as unknown as App.Locals;

async function thrown(fn: () => unknown) {
	try {
		fn();
	} catch (e) {
		return e as { status: number; location: string };
	}
	return null;
}

describe('isManager', () => {
	it('is true only for managers', () => {
		expect(isManager(locals('manager'))).toBe(true);
		expect(isManager(locals('patient'))).toBe(false);
		expect(isManager(locals(null))).toBe(false);
	});
});

describe('denyUnlessManager', () => {
	it('returns null for managers', () => {
		expect(denyUnlessManager(locals('manager'))).toBeNull();
	});

	it('returns a 403 failure otherwise', () => {
		for (const role of ['patient', null] as const) {
			const result = denyUnlessManager(locals(role));
			expect(result?.status).toBe(403);
			expect(result?.data).toEqual({ error: 'Manager access required.' });
		}
	});
});

describe('requirePatient', () => {
	it('passes patients', async () => {
		expect(await thrown(() => requirePatient(locals('patient')))).toBeNull();
	});
	it('redirects anonymous users to login and managers to /manager', async () => {
		expect(await thrown(() => requirePatient(locals(null)))).toMatchObject({ status: 303, location: '/login' });
		expect(await thrown(() => requirePatient(locals('manager')))).toMatchObject({
			status: 303,
			location: '/manager'
		});
	});
});

describe('requireUser', () => {
	const anon = { user: null } as unknown as App.Locals;

	it('redirects anonymous users with return path', async () => {
		expect(await thrown(() => requireUser(anon, '/profile/insurance'))).toMatchObject({
			status: 303,
			location: '/login?redirect=/profile/insurance'
		});
	});
	it('without returnTo goes to /login', async () => {
		expect(await thrown(() => requireUser(anon))).toMatchObject({ status: 303, location: '/login' });
	});
	it('returns the user', async () => {
		const user = await makeUser();
		expect(requireUser({ user } as unknown as App.Locals)).toBe(user);
	});
	it('requirePatient / requireManager return the user and keep return path', async () => {
		const patient = await makeUser();
		const manager = await makeManager();
		expect(requirePatient({ user: patient } as unknown as App.Locals)).toBe(patient);
		expect(requireManager({ user: manager } as unknown as App.Locals)).toBe(manager);
		expect(await thrown(() => requirePatient(anon, '/appointments'))).toMatchObject({
			location: '/login?redirect=/appointments'
		});
		expect(await thrown(() => requireManager(anon, '/manager'))).toMatchObject({
			location: '/login?redirect=/manager'
		});
	});
});

describe('requireManager', () => {
	it('passes managers', async () => {
		expect(await thrown(() => requireManager(locals('manager')))).toBeNull();
	});
	it('redirects anonymous users to login and patients to /home', async () => {
		expect(await thrown(() => requireManager(locals(null)))).toMatchObject({ status: 303, location: '/login' });
		expect(await thrown(() => requireManager(locals('patient')))).toMatchObject({
			status: 303,
			location: '/home'
		});
	});
});
