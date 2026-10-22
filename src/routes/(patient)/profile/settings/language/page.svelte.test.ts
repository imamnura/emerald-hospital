import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';
import { submissions } from '../../../../../test/mocks/app-forms.ts';

describe('language settings page', () => {
	it('marks current language and submits selection', async () => {
		render(Page, {
			props: {
				data: {
					current: 'id',
					options: [
						{ code: 'en', label: 'English' },
						{ code: 'id', label: 'Bahasa Indonesia' }
					]
				}
			} as never
		});
		const en = screen.getByRole('button', { name: 'English' });
		const id = screen.getByRole('button', { name: 'Bahasa Indonesia' });
		expect(id.className).toContain('bg-primary/5');
		expect(en.className).not.toContain('bg-primary/5');
		expect(id.querySelector('svg')).not.toBeNull();
		await fireEvent.submit(en.closest('form')!);
		expect(submissions[0].action.search).toBe('?/set');
		expect(submissions[0].formData.get('language')).toBe('en');
	});
});
