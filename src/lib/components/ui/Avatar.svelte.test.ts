import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { getInitials } from '#lib/format/text.ts';
import { snip } from '../../../test/helpers-components.ts';
import Avatar from './Avatar.svelte';

describe('Avatar', () => {
	it('falls back to initials', () => {
		render(Avatar, { name: 'Siti Nurhaliza', src: null });
		expect(screen.getByText(getInitials('Siti Nurhaliza'))).toBeInTheDocument();
	});

	it('renders the image with name as alt and size classes', () => {
		render(Avatar, { name: 'Amy Pond', src: '/a.png', size: 'lg', class: 'shrink-0' });
		const img = screen.getByRole('img', { name: 'Amy Pond' });
		expect(img).toHaveAttribute('src', '/a.png');
		expect(img).toHaveClass('h-14', 'w-14', 'rounded-full', 'object-cover', 'shrink-0');
	});

	it('maps every size bucket', () => {
		const expected = { sm: 'h-8', md: 'h-10', lg: 'h-14', xl: 'h-28' } as const;
		for (const [size, cls] of Object.entries(expected)) {
			const { unmount } = render(Avatar, { name: 'A B', size: size as 'sm' });
			expect(screen.getByText('AB')).toHaveClass(cls);
			unmount();
		}
	});

	it('applies fallbackClass only to the initials and honors an initials override', () => {
		render(Avatar, { name: 'Dr. Siti', initials: 'D', fallbackClass: 'bg-surface-container' });
		const el = screen.getByText('D');
		expect(el).toHaveClass('bg-surface-container', 'flex', 'rounded-full');
		expect(el).not.toHaveClass('text-primary');
	});

	it('wraps with a relative container and renders the badge', () => {
		const { container } = render(Avatar, {
			name: 'A B',
			wrapperClass: 'mx-auto w-fit',
			badge: snip('<span data-testid="badge">!</span>')
		});
		expect(screen.getByTestId('badge')).toBeInTheDocument();
		expect(container.firstElementChild).toHaveClass('relative', 'mx-auto', 'w-fit');
	});

	it('renders no wrapper without a badge', () => {
		const { container } = render(Avatar, { name: 'A B' });
		expect(container.firstElementChild).toHaveTextContent('AB');
	});
});
