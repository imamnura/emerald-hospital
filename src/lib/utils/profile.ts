export function formatMemberSince(createdAt: Date | string): string {
	const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
	return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** e.g. Oct 24 */
export function formatNextVisitShort(dateStr: string): string {
	return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric'
	});
}
