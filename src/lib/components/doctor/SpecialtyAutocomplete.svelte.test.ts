import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BindHarness from '#test/harness/BindHarness.svelte';
import SpecialtyAutocomplete from './SpecialtyAutocomplete.svelte';

const items = [
	{ name: 'Cardiology', slug: 'cardiology' },
	{ name: 'Cardiac Surgery', slug: 'cardiac-surgery' },
	{ name: 'Care', slug: 'care' }
];

const json = (data: unknown, init?: ResponseInit) =>
	new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' }, ...init });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.useFakeTimers({ shouldAdvanceTime: true });
	fetchMock = vi.fn(async () => json(items));
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

async function type(input: HTMLElement, value: string) {
	await fireEvent.input(input, { target: { value } });
	await vi.advanceTimersByTimeAsync(300);
}

function setup(props: Record<string, unknown> = {}) {
	render(BindHarness, { props: { component: SpecialtyAutocomplete, value: '', props } });
	return screen.getByRole('combobox');
}

describe('SpecialtyAutocomplete', () => {
	it('renders defaults with generated listbox id', () => {
		const input = setup();
		expect(input).toHaveAttribute('placeholder', 'Specialty');
		expect(input).toHaveAttribute('aria-expanded', 'false');
		expect(input.getAttribute('aria-controls')).toMatch(/^specialty-suggestions-\d+$/);
		expect(screen.getByText('Specialty')).toHaveClass('sr-only');
	});

	it('uses class and placeholder props', () => {
		const input = setup({ class: 'w-full', placeholder: 'Pick one' });
		expect(input).toHaveAttribute('placeholder', 'Pick one');
		expect(input.closest('label')).toHaveClass('w-full');
	});

	it('debounces fetch and shows suggestions', async () => {
		const input = setup();
		await fireEvent.input(input, { target: { value: ' car ' } });
		expect(fetchMock).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(300);
		expect(fetchMock).toHaveBeenCalledWith('/api/specialists?q=car&limit=8');
		expect(fetchMock).toHaveBeenCalledTimes(1);
		const listbox = await screen.findByRole('listbox');
		expect(listbox.getAttribute('id')).toMatch(/^specialty-suggestions-\d+$/);
		expect(screen.getAllByRole('option')).toHaveLength(3);
		expect(input).toHaveAttribute('aria-expanded', 'true');
	});

	it('only fires one request for rapid typing', async () => {
		const input = setup();
		await fireEvent.input(input, { target: { value: 'c' } });
		await vi.advanceTimersByTimeAsync(100);
		await fireEvent.input(input, { target: { value: 'ca' } });
		await vi.advanceTimersByTimeAsync(300);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith('/api/specialists?q=ca&limit=8');
	});

	it('supports keyboard navigation and Enter selection', async () => {
		const input = setup();
		await type(input, 'car');
		await screen.findByRole('listbox');
		const selected = () =>
			screen.getAllByRole('option').findIndex((o) => o.getAttribute('aria-selected') === 'true');

		// Enter without an active option does nothing
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(screen.getByRole('listbox')).toBeInTheDocument();
		// Unrelated key does nothing
		await fireEvent.keyDown(input, { key: 'a' });
		expect(selected()).toBe(-1);

		await fireEvent.keyDown(input, { key: 'ArrowUp' });
		expect(selected()).toBe(2);
		await fireEvent.keyDown(input, { key: 'ArrowUp' });
		expect(selected()).toBe(1);
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		expect(selected()).toBe(2);
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		expect(selected()).toBe(0);
		expect(screen.getAllByRole('option')[0]).toHaveClass('bg-primary/10');

		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(screen.queryByRole('listbox')).toBeNull();
		expect(input).toHaveValue('Cardiology');
		expect(screen.getByTestId('bound-value')).toHaveTextContent('Cardiology');

		// Closed list ignores keys
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('closes on Escape and reopens on focus', async () => {
		const input = setup();
		await type(input, 'car');
		await screen.findByRole('listbox');
		await fireEvent.keyDown(input, { key: 'Escape' });
		expect(screen.queryByRole('listbox')).toBeNull();
		expect(input).toHaveAttribute('aria-expanded', 'false');
		await fireEvent.focus(input);
		expect(screen.getByRole('listbox')).toBeInTheDocument();
	});

	it('focus without suggestions keeps the list closed', async () => {
		const input = setup();
		await fireEvent.focus(input);
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('selects an option by click and highlights on mouseenter', async () => {
		const input = setup();
		await type(input, 'car');
		const options = await screen.findAllByRole('option');
		await fireEvent.mouseEnter(options[1]);
		expect(options[1]).toHaveAttribute('aria-selected', 'true');
		const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
		options[1].dispatchEvent(mousedown);
		expect(mousedown.defaultPrevented).toBe(true);
		await fireEvent.click(options[1]);
		expect(input).toHaveValue('Cardiac Surgery');
		expect(screen.getByTestId('bound-value')).toHaveTextContent('Cardiac Surgery');
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('closes shortly after blur', async () => {
		const input = setup();
		await type(input, 'car');
		await screen.findByRole('listbox');
		await fireEvent.blur(input);
		expect(screen.getByRole('listbox')).toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(150);
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('clearing the input hides suggestions without fetching', async () => {
		const input = setup();
		await type(input, 'car');
		await screen.findByRole('listbox');
		fetchMock.mockClear();
		await type(input, '   ');
		expect(fetchMock).not.toHaveBeenCalled();
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('keeps list closed for empty results', async () => {
		fetchMock.mockImplementation(async () => json([]));
		const input = setup();
		await type(input, 'zzz');
		expect(fetchMock).toHaveBeenCalled();
		expect(screen.queryByRole('listbox')).toBeNull();
		expect(input).toHaveAttribute('aria-expanded', 'false');
	});

	it('ignores non-ok responses', async () => {
		fetchMock.mockImplementation(async () => json({ error: 'x' }, { status: 500 }));
		const input = setup();
		await type(input, 'car');
		expect(fetchMock).toHaveBeenCalled();
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('swallows network errors', async () => {
		fetchMock.mockImplementation(async () => {
			throw new TypeError('network down');
		});
		const input = setup();
		await type(input, 'car');
		expect(fetchMock).toHaveBeenCalled();
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('discards stale responses', async () => {
		let resolveSlow!: (r: Response) => void;
		fetchMock
			.mockImplementationOnce(() => new Promise<Response>((r) => (resolveSlow = r)))
			.mockImplementationOnce(async () => json([{ name: 'Neurology', slug: 'neurology' }]));
		const input = setup();
		await type(input, 'car');
		await type(input, 'neu');
		await screen.findByRole('listbox');
		resolveSlow(json(items));
		await vi.advanceTimersByTimeAsync(10);
		const options = screen.getAllByRole('option');
		expect(options).toHaveLength(1);
		expect(options[0]).toHaveTextContent('Neurology');
	});

	it('discards in-flight response after the input is cleared', async () => {
		let resolveSlow!: (r: Response) => void;
		fetchMock.mockImplementationOnce(() => new Promise<Response>((r) => (resolveSlow = r)));
		const input = setup();
		await type(input, 'car');
		await type(input, '');
		resolveSlow(json(items));
		await vi.advanceTimersByTimeAsync(10);
		expect(screen.queryByRole('listbox')).toBeNull();
	});
});
