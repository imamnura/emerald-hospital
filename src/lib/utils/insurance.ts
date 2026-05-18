export type InsuranceCostItem = {
	id: string;
	label: string;
	amount: string;
};

export type InsuranceProfileView = {
	id: string | null;
	providerName: string;
	planName: string;
	memberName: string;
	memberId: string;
	groupNo: string;
	planType: string;
	coveragePeriod: string;
	coverageStart: string | null;
	coverageEnd: string | null;
	status: 'ACTIVE' | 'INACTIVE';
	costs: InsuranceCostItem[];
	providerPhone: string;
};
