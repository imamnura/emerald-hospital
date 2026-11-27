import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { snip } from '#test/helpers/component.ts';
import FormIconField from './FormIconField.svelte';

const icon = snip('<i data-testid="icon"></i>');

describe('FormIconField', () => {
	it('renders labelled input with defaults', () => {
		render(FormIconField, { id: 'email', label: 'Email', icon });
		const input = screen.getByLabelText('Email') as HTMLInputElement;
		expect(input).toHaveAttribute('type', 'text');
		expect(input).toHaveValue('');
		expect(input).not.toBeRequired();
		expect(input).not.toBeDisabled();
		expect(input).toHaveClass('pr-4');
		expect(screen.getByTestId('icon')).toBeInTheDocument();
	});

	it('renders trailing snippet and passes attributes', async () => {
		render(FormIconField, {
			id: 'pw',
			label: 'Password',
			name: 'password',
			type: 'password',
			value: 'secret',
			placeholder: 'Enter',
			required: true,
			readonly: true,
			icon,
			trailing: snip('<button type="button">show</button>')
		});
		const input = screen.getByLabelText('Password') as HTMLInputElement;
		expect(input).toHaveAttribute('name', 'password');
		expect(input).toHaveAttribute('type', 'password');
		expect(input).toHaveAttribute('placeholder', 'Enter');
		expect(input).toHaveAttribute('readonly');
		expect(input).toBeRequired();
		expect(input).toHaveValue('secret');
		expect(input).toHaveClass('pr-10');
		expect(screen.getByText('show')).toBeInTheDocument();
		await fireEvent.input(input, { target: { value: 'changed' } });
		expect(input).toHaveValue('changed');
	});

	it('can be disabled', () => {
		render(FormIconField, { id: 'x', label: 'X', disabled: true, icon });
		expect(screen.getByLabelText('X')).toBeDisabled();
	});
});
