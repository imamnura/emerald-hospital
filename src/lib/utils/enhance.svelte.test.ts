import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '#lib/stores/toast.svelte.ts';
import { toastForm } from '#lib/utils/enhance.ts';

type Callback = (input: { result: unknown; update: ReturnType<typeof vi.fn> }) => Promise<void>;

async function submit(opts: Parameters<typeof toastForm>[0], result: unknown) {
	const update = vi.fn(async () => {});
	const cb = (toastForm(opts) as unknown as () => Callback)();
	await cb({ result, update });
	return update;
}

const messages = () => toast.toasts.map((t) => [t.kind, t.message]);

describe('toastForm', () => {
	beforeEach(() => toast.clear());
	afterEach(() => toast.clear());

	it('works with no options at all', async () => {
		const update = vi.fn(async () => {});
		const cb = (toastForm() as unknown as () => Callback)();
		await cb({ result: { type: 'success', status: 200 }, update });
		expect(update).toHaveBeenCalledWith({ reset: true, refreshAll: true });
		expect(toast.toasts).toEqual([]);
	});

	it('calls update with defaults and respects reset/refreshAll overrides', async () => {
		const u1 = await submit({}, { type: 'success', status: 200 });
		expect(u1).toHaveBeenCalledWith({ reset: true, refreshAll: true });
		const u2 = await submit({ reset: false, refreshAll: false }, { type: 'success', status: 200 });
		expect(u2).toHaveBeenCalledWith({ reset: false, refreshAll: false });
	});

	describe('success', () => {
		it('uses data.message over the static successMessage', async () => {
			await submit({ successMessage: 'Static' }, { type: 'success', status: 200, data: { message: 'From server' } });
			expect(messages()).toEqual([['success', 'From server']]);
		});

		it('falls back to static successMessage', async () => {
			await submit({ successMessage: 'Static' }, { type: 'success', status: 200, data: {} });
			expect(messages()).toEqual([['success', 'Static']]);
		});

		it('uses a function successMessage with the data', async () => {
			const fn = vi.fn((d: Record<string, unknown>) => `Hi ${d.name}`);
			await submit({ successMessage: fn }, { type: 'success', status: 200, data: { name: 'Ana', message: 'ignored' } });
			expect(fn).toHaveBeenCalledWith({ name: 'Ana', message: 'ignored' });
			expect(messages()).toEqual([['success', 'Hi Ana']]);
		});

		it('shows no toast when there is no message, but still calls onSuccess', async () => {
			const onSuccess = vi.fn();
			const onError = vi.fn();
			await submit({ onSuccess, onError }, { type: 'success', status: 200 });
			expect(toast.toasts).toEqual([]);
			expect(onSuccess).toHaveBeenCalledWith({});
			expect(onError).not.toHaveBeenCalled();
		});

		it('skips the toast when the function returns an empty string', async () => {
			await submit({ successMessage: () => '' }, { type: 'success', status: 200, data: {} });
			expect(toast.toasts).toEqual([]);
		});
	});

	describe('failure', () => {
		it('uses data.error over static errorMessage', async () => {
			await submit({ errorMessage: 'Static err' }, { type: 'failure', status: 400, data: { error: 'Bad email' } });
			expect(messages()).toEqual([['error', 'Bad email']]);
		});

		it('falls back to static errorMessage then generic text', async () => {
			await submit({ errorMessage: 'Static err' }, { type: 'failure', status: 400, data: {} });
			await submit({}, { type: 'failure', status: 400 });
			expect(messages()).toEqual([
				['error', 'Static err'],
				['error', 'Something went wrong.']
			]);
		});

		it('uses a function errorMessage and calls onError with data', async () => {
			const onError = vi.fn();
			const onSuccess = vi.fn();
			await submit(
				{ errorMessage: (d) => `Failed: ${d.code}`, onError, onSuccess },
				{ type: 'failure', status: 422, data: { code: 'E1' } }
			);
			expect(messages()).toEqual([['error', 'Failed: E1']]);
			expect(onError).toHaveBeenCalledWith({ code: 'E1' });
			expect(onSuccess).not.toHaveBeenCalled();
		});

		it('works without onError', async () => {
			await submit({}, { type: 'failure', status: 500, data: { error: 'x' } });
			expect(messages()).toEqual([['error', 'x']]);
		});
	});

	it('shows a network error toast for error results', async () => {
		const onError = vi.fn();
		await submit({ onError }, { type: 'error', status: 500, error: new Error('down') });
		expect(messages()).toEqual([['error', 'Network error. Please try again.']]);
		expect(onError).not.toHaveBeenCalled();
	});

	it('does nothing extra for redirect results', async () => {
		const onSuccess = vi.fn();
		const update = await submit({ onSuccess, successMessage: 'x' }, { type: 'redirect', status: 303, location: '/home' });
		expect(update).toHaveBeenCalledOnce();
		expect(toast.toasts).toEqual([]);
		expect(onSuccess).not.toHaveBeenCalled();
	});
});
