import { eq } from 'drizzle-orm';
import { db } from './db';
import { insuranceProfiles, type InsuranceProfile } from './db/schema';
import { formatDate } from '#lib/format/date.ts';
import type { InsuranceProfileView } from '#lib/utils/insurance.ts';

export type { InsuranceCostItem, InsuranceProfileView } from '#lib/utils/insurance.ts';

const DEFAULT_PHONE = '+18005551234';

function formatCoveragePeriod(start: string, end: string): string {
	return `${formatDate(start, 'short')} - ${formatDate(end, 'short')}`;
}

function dollar(amount: string | null): string {
	if (!amount) return '—';
	const n = parseFloat(amount);
	return `$${n.toFixed(0)}`;
}

export async function getInsuranceForUser(
	userId: string,
	memberName: string
): Promise<InsuranceProfileView> {
	const [row]: [InsuranceProfile | undefined] = (await db
		.select()
		.from(insuranceProfiles)
		.where(eq(insuranceProfiles.userId, userId))
		.limit(1)) as [InsuranceProfile | undefined];

	if (!row) {
		return {
			id: null,
			providerName: '—',
			planName: 'No active plan',
			memberName,
			memberId: '—',
			groupNo: '—',
			planType: '—',
			coveragePeriod: '—',
			coverageStart: null,
			coverageEnd: null,
			status: 'INACTIVE',
			costs: [],
			providerPhone: DEFAULT_PHONE
		};
	}

	return {
		id: row.id,
		providerName: row.providerName,
		planName: row.planName,
		memberName,
		memberId: row.memberId,
		groupNo: row.groupNo ?? '—',
		planType: row.planType ?? '—',
		coveragePeriod: formatCoveragePeriod(String(row.coverageStart), String(row.coverageEnd)),
		coverageStart: String(row.coverageStart),
		coverageEnd: String(row.coverageEnd),
		status: row.status,
		costs: [
			{ id: 'pcp', label: 'PCP Visit', amount: dollar(row.costPcp) },
			{ id: 'specialist', label: 'Specialist', amount: dollar(row.costSpecialist) },
			{ id: 'emergency', label: 'Emergency', amount: dollar(row.costEmergency) },
			{ id: 'rx', label: 'Rx Deductible', amount: dollar(row.costRx) }
		],
		providerPhone: row.providerPhone ?? DEFAULT_PHONE
	};
}

type UpsertInsuranceInput = {
	providerName: string;
	planName: string;
	memberId: string;
	groupNo?: string | null;
	planType?: string | null;
	coverageStart: string;
	coverageEnd: string;
	status?: 'ACTIVE' | 'INACTIVE';
	costPcp?: string | null;
	costSpecialist?: string | null;
	costEmergency?: string | null;
	costRx?: string | null;
	providerPhone?: string | null;
};

/** One row per user (`insurance_user_unique`): insert, or update that row in place keeping its id. */
export async function upsertInsurance(userId: string, input: UpsertInsuranceInput) {
	const values = {
		userId,
		providerName: input.providerName,
		planName: input.planName,
		memberId: input.memberId,
		groupNo: input.groupNo ?? null,
		planType: input.planType ?? null,
		coverageStart: input.coverageStart,
		coverageEnd: input.coverageEnd,
		status: input.status ?? 'ACTIVE',
		costPcp: input.costPcp ?? null,
		costSpecialist: input.costSpecialist ?? null,
		costEmergency: input.costEmergency ?? null,
		costRx: input.costRx ?? null,
		providerPhone: input.providerPhone ?? null,
		updatedAt: new Date()
	};

	const [row] = await db
		.insert(insuranceProfiles)
		.values(values)
		.onConflictDoUpdate({ target: insuranceProfiles.userId, set: values })
		.returning({ id: insuranceProfiles.id });
	return row.id;
}
