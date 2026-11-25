import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { snip } from '../../../test/helpers-components.ts';
import ResultDialog from './ResultDialog.svelte';

function props(extra: Record<string, unknown> = {}) {
	return {
		open: true,
		tone: 'success' as const,
		title: 'All done',
		icon: snip('<i data-testid="ic"></i>'),
		body: snip('<p>the body</p>'),
		actions: snip('<button type="button">Go</button>'),
		...extra
	};
}

describe('ResultDialog', () => {
	it('renders nothing when closed', () => {
		render(ResultDialog, props({ open: false }));
		expect(screen.queryByRole('dialog')).toBeNull();
	});

	it('names the dialog by its title and renders icon, body and actions', () => {
		const { baseElement } = render(ResultDialog, props());
		expect(screen.getByRole('dialog', { name: 'All done' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'All done' })).toBeInTheDocument();
		expect(screen.getByTestId('ic')).toBeInTheDocument();
		expect(screen.getByText('the body')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
		expect(baseElement.querySelector('.bg-primary\\/15')).toBeInTheDocument();
	});

	it('uses the danger tone', () => {
		const { baseElement } = render(ResultDialog, props({ tone: 'danger' }));
		expect(baseElement.querySelector('.bg-error-container\\/80')).toBeInTheDocument();
		expect(baseElement.querySelector('.bg-primary\\/15')).toBeNull();
	});

	it('calls onclose from the backdrop, and clicks inside do not close', async () => {
		const onclose = vi.fn();
		render(ResultDialog, props({ onclose }));
		await fireEvent.click(screen.getByRole('dialog'));
		expect(onclose).not.toHaveBeenCalled();
		await fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
		expect(onclose).toHaveBeenCalledTimes(1);
	});

	it('shows the corner close button only when asked', async () => {
		const onclose = vi.fn();
		const { unmount } = render(ResultDialog, props({ onclose }));
		expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
		unmount();
		render(ResultDialog, props({ onclose, showClose: true, large: true }));
		expect(screen.getByRole('heading')).toHaveClass('text-2xl');
		await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
		expect(onclose).toHaveBeenCalledTimes(1);
	});
});
