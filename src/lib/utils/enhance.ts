import type { SubmitFunction } from '$app/forms';
import { toast } from '#lib/stores/toast.svelte.ts';

type Options = {
	successMessage?: string | ((data: Record<string, unknown>) => string);
	errorMessage?: string | ((data: Record<string, unknown>) => string);
	onSuccess?: (data: Record<string, unknown>) => void;
	onError?: (data: Record<string, unknown>) => void;
	reset?: boolean;
	refreshAll?: boolean;
};

/**
 * Returns a `use:enhance` SubmitFunction that:
 *   1. Lets SvelteKit complete the submission and update form/page data normally.
 *   2. Pops a success toast on `success`, an error toast on `failure`.
 *
 * The action's returned data may include `{ message, error }` to override defaults.
 */
export function toastForm(options: Options = {}): SubmitFunction {
	return () => async ({ result, update }) => {
		await update({ reset: options.reset ?? true, refreshAll: options.refreshAll ?? true });

		if (result.type === 'success') {
			const data = (result.data ?? {}) as Record<string, unknown>;
			const msg =
				typeof options.successMessage === 'function'
					? options.successMessage(data)
					: (data.message as string | undefined) ?? options.successMessage;
			if (msg) toast.success(msg);
			options.onSuccess?.(data);
		} else if (result.type === 'failure') {
			const data = (result.data ?? {}) as Record<string, unknown>;
			const msg =
				typeof options.errorMessage === 'function'
					? options.errorMessage(data)
					: (data.error as string | undefined) ?? options.errorMessage ?? 'Something went wrong.';
			toast.error(msg);
			options.onError?.(data);
		} else if (result.type === 'error') {
			toast.error('Network error. Please try again.');
		}
	};
}
