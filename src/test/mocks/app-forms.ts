import { vi } from 'vitest';

/**
 * Test stand-in for `$app/forms`.
 *
 * `enhance` intercepts the form's submit event and runs the SubmitFunction the
 * same way SvelteKit does, resolving with `enhanceResult.current`. Set it with
 * `setEnhanceResult()` before submitting to drive success / failure branches.
 */
type Result =
	| { type: 'success'; status: number; data?: Record<string, unknown> }
	| { type: 'failure'; status: number; data?: Record<string, unknown> }
	| { type: 'redirect'; status: number; location: string }
	| { type: 'error'; status?: number; error: unknown };

export const enhanceResult: { current: Result } = {
	current: { type: 'success', status: 200, data: {} }
};

export const update = vi.fn(async (_opts?: unknown) => {});

export function setEnhanceResult(result: Result): void {
	enhanceResult.current = result;
}

export const submissions: Array<{ action: URL; formData: FormData; cancelled: boolean }> = [];

type SubmitFn = (input: {
	action: URL;
	formData: FormData;
	formElement: HTMLFormElement;
	controller: AbortController;
	submitter: HTMLElement | null;
	cancel: () => void;
}) => unknown;

export function enhance(form: HTMLFormElement, submit?: SubmitFn) {
	const handler = async (event: Event) => {
		event.preventDefault();
		const action = new URL(form.getAttribute('action') ?? '', 'http://localhost/');
		const formData = new FormData(form);
		let cancelled = false;
		const callback = await submit?.({
			action,
			formData,
			formElement: form,
			controller: new AbortController(),
			submitter: (event as SubmitEvent).submitter ?? null,
			cancel: () => {
				cancelled = true;
			}
		});
		submissions.push({ action, formData, cancelled });
		if (cancelled) return;
		if (typeof callback === 'function') {
			await callback({ action, formData, formElement: form, result: enhanceResult.current, update });
		} else {
			await update();
		}
	};
	form.addEventListener('submit', handler);
	return {
		destroy() {
			form.removeEventListener('submit', handler);
		}
	};
}

export const applyAction = vi.fn(async (_result: unknown) => {});
export const deserialize = vi.fn((text: string) => JSON.parse(text));

export function resetForms(): void {
	enhanceResult.current = { type: 'success', status: 200, data: {} };
	submissions.length = 0;
	update.mockClear();
	applyAction.mockClear();
	deserialize.mockClear();
}
