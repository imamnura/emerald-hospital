import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { stubSpecialistsFetch } from '#test/helpers/component.ts';
import DoctorSearchForm from './DoctorSearchForm.svelte';

beforeEach(() => {
	stubSpecialistsFetch([]);
});

describe('DoctorSearchForm', () => {
	it('submits without a page reload', async () => {
		const onsubmit = vi.fn();
		render(DoctorSearchForm, { specialty: '', hospital: 'all', onsubmit });
		const form = screen.getByRole('button', { name: /search/i }).closest('form')!;
		const event = new Event('submit', { cancelable: true, bubbles: true });
		form.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
		expect(onsubmit).toHaveBeenCalledTimes(1);
	});

	it('lists the hospitals and reflects the selected one', async () => {
		const user = userEvent.setup();
		render(DoctorSearchForm, { specialty: '', hospital: 'all', onsubmit: vi.fn() });
		const select = screen.getByRole('combobox', { name: /hospital/i }) as HTMLSelectElement;
		expect(select.value).toBe('all');
		await user.selectOptions(select, 'rsud-purwakarta');
		expect(select.value).toBe('rsud-purwakarta');
	});

	it('shows the bound specialty and merges classes', async () => {
		const { container } = render(DoctorSearchForm, {
			specialty: 'Cardio',
			hospital: 'all',
			onsubmit: vi.fn(),
			class: 'mt-6'
		});
		expect(screen.getAllByRole('combobox')[0]).toHaveValue('Cardio');
		expect(container.querySelector('form')).toHaveClass('mt-6', 'rounded-2xl');
		await fireEvent.submit(container.querySelector('form')!);
	});
});
