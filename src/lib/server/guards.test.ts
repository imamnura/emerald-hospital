import { describe, expect, it } from 'vitest';
import { denyUnlessManager, isManager, requireManager, requirePatient } from './guards.ts';

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
