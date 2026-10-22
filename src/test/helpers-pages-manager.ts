import { within } from '@testing-library/svelte';
import { update } from './mocks/app-forms.ts';

/** Make the next enhance `update()` resolve after `ms`, leaving a window to interact mid-submit. */
export function slowNextUpdate(ms = 30): void {
	update.mockImplementationOnce(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));
}

/** Dispatch Escape on window synchronously (Modal listens via <svelte:window onkeydown>). */
export function pressEscape(): void {
	window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

/**
 * Closes the open ConfirmDialog with Escape (which clears the page's confirm target) and,
 * in the same synchronous tick — before Svelte flushes — clicks its confirm button.
 * Exercises the `if (!confirmTarget) return` guard in the pages' confirmDelete().
 */
export function escapeThenConfirm(dialog: HTMLElement, confirmLabel = 'Delete'): void {
	const btn = within(dialog).getByRole('button', { name: confirmLabel });
	pressEscape();
	btn.click();
}
