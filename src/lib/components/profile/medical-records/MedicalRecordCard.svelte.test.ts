import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { MedicalRecordView } from '#lib/utils/medical-records.ts';
import MedicalRecordCard from './MedicalRecordCard.svelte';

const base: MedicalRecordView = {
	id: 'r1',
	title: 'Blood Test',
	facility: 'Central Lab',
	type: 'lab',
	recordDate: '2024-05-01',
	dateLabel: 'May 1, 2024',
	monthKey: '2024-05',
	monthLabel: 'May 2024',
	categoryLabel: 'LAB RESULT',
	fileUrl: '/files/r1.pdf'
};

describe('MedicalRecordCard', () => {
	it('renders lab record with download link', () => {
		const { container } = render(MedicalRecordCard, { record: base });
		expect(screen.getByText('Blood Test')).toBeInTheDocument();
		expect(screen.getByText('May 1, 2024 • Central Lab')).toBeInTheDocument();
		expect(screen.getByText('LAB RESULT')).toBeInTheDocument();
		const link = screen.getByLabelText('Download Blood Test');
		expect(link).toHaveAttribute('href', '/files/r1.pdf');
		expect(link).toHaveAttribute('target', '_blank');
		expect(container.querySelector('.lucide-flask-conical')).toBeInTheDocument();
	});

	it('renders imaging icon and no download without file', () => {
		const { container } = render(MedicalRecordCard, {
			record: { ...base, type: 'imaging', fileUrl: null }
		});
		expect(screen.queryByRole('link')).toBeNull();
		expect(container.querySelector('.lucide-bone')).toBeInTheDocument();
	});

	it('renders clinical icon', () => {
		const { container } = render(MedicalRecordCard, { record: { ...base, type: 'clinical' } });
		expect(container.querySelector('.lucide-file-text')).toBeInTheDocument();
	});
});

describe('MedicalRecordCard with nullish fields', () => {
	it('renders empty strings for missing labels', () => {
		const nil = null as unknown as string;
		render(MedicalRecordCard, {
			record: { ...base, title: nil, dateLabel: nil, facility: nil }
		});
		expect(screen.getByRole('link')).toHaveAttribute('aria-label', 'Download ');
		expect(screen.getByText('•')).toBeInTheDocument();
	});
});
