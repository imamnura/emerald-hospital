import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handle } from './hooks.server.ts';
import { SESSION_COOKIE_NAME } from '#lib/server/auth/session.ts';
import { db } from '#lib/server/db/index.ts';
import { resetDb, type TestDb } from '#test/db.ts';
import { makeEvent, makeManager, makeSession, makeUser } from '#test/factories.ts';
import { reset } from '#test/helpers/route.ts';

type HandleInput = Parameters<typeof handle>[0];

function run(event: ReturnType<typeof makeEvent>) {
	const resolve = vi.fn(async () => new Response('ok', { status: 200 }));
	const promise = handle({ event, resolve } as unknown as HandleInput) as Promise<Response>;
	return { resolve, promise };
}

describe('hooks.server handle', () => {
	beforeEach(async () => {
		await reset();
	});

	it('sets locals.user to null without a session cookie and resolves', async () => {
		const event = makeEvent({ url: '/home' });
		(event.locals as { user: unknown }).user = 'stale';
		const { resolve, promise } = run(event);
		const res = await promise;
		expect(event.locals.user).toBeNull();
		expect(resolve).toHaveBeenCalledWith(event);
		expect(res.status).toBe(200);
	});

	it('resolves the user from a valid session cookie', async () => {
		const user = await makeUser();
		const sid = await makeSession(user.id);
		const event = makeEvent({ url: '/home', cookies: { [SESSION_COOKIE_NAME]: sid } });
		const { promise } = run(event);
		await promise;
		expect(event.locals.user?.id).toBe(user.id);
	});

	it('treats an unknown or expired session as anonymous', async () => {
		const user = await makeUser();
		const expired = await makeSession(user.id, new Date(Date.now() - 1000));
		for (const sid of ['nope', expired]) {
			const event = makeEvent({ url: '/home', cookies: { [SESSION_COOKIE_NAME]: sid } });
			await run(event).promise;
			expect(event.locals.user).toBeNull();
		}
	});

	it.each(['/manager', '/manager/doctors', '/manager/bookings?x=1'])(
		'blocks non-GET %s for anonymous users with 403',
		async (url) => {
			const event = makeEvent({ url, method: 'POST' });
			const { resolve, promise } = run(event);
			const res = await promise;
			expect(res.status).toBe(403);
			expect(await res.text()).toBe('Manager access required.');
			expect(resolve).not.toHaveBeenCalled();
		}
	);

	it('blocks non-GET manager requests for patients', async () => {
		const user = await makeUser();
		const sid = await makeSession(user.id);
		for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
			const event = makeEvent({ url: '/manager/doctors', method, cookies: { [SESSION_COOKIE_NAME]: sid } });
			const { resolve, promise } = run(event);
			expect((await promise).status).toBe(403);
			expect(resolve).not.toHaveBeenCalled();
		}
	});

	it('allows non-GET manager requests for managers', async () => {
		const mgr = await makeManager();
		const sid = await makeSession(mgr.id);
		const event = makeEvent({ url: '/manager/doctors', method: 'POST', cookies: { [SESSION_COOKIE_NAME]: sid } });
		const { resolve, promise } = run(event);
		expect((await promise).status).toBe(200);
		expect(resolve).toHaveBeenCalledOnce();
	});

	it.each(['GET', 'HEAD', 'OPTIONS'])('lets safe method %s through to resolve on /manager', async (method) => {
		const event = makeEvent({ url: '/manager', method });
		const { resolve, promise } = run(event);
		expect((await promise).status).toBe(200);
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('does not guard look-alike paths such as /managerial', async () => {
		const event = makeEvent({ url: '/managerial', method: 'POST' });
		const { resolve, promise } = run(event);
		expect((await promise).status).toBe(200);
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('does not guard non-manager POSTs', async () => {
		const event = makeEvent({ url: '/login', form: { email: 'a' } });
		const { resolve, promise } = run(event);
		expect((await promise).status).toBe(200);
		expect(resolve).toHaveBeenCalledOnce();
	});
});
