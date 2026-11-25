<script lang="ts">
	import FormAlert from '#lib/components/ui/FormAlert.svelte';
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import {
		BriefcaseMedical,
		ClipboardPlus,
		FileUp,
		Phone,
		SquarePlus,
		Sparkles
	} from '@lucide/svelte';
	import CoveragePeriodCard from '#lib/components/insurance/CoveragePeriodCard.svelte';
	import CostDetailCard from '#lib/components/insurance/CostDetailCard.svelte';
	import InsuranceCoverageCard from '#lib/components/insurance/InsuranceCoverageCard.svelte';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';
	import BackHeader from '#lib/components/layout/BackHeader.svelte';

	let { data, form } = $props();

	let editing = $state(false);

	function contactProvider() {
		window.location.href = `tel:${data.insurance.providerPhone}`;
	}
</script>

<BackHeader title="Insurance" backHref="/profile" divider />

<FormAlert message={form?.error} class="mt-2" />

{#if editing}
	<form
		method="POST"
		action="?/save"
		use:enhance={() => async ({ update }) => {
			await update({ reset: false });
			editing = false;
		}}
		class="mt-4 flex flex-col gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)]"
	>
		<div class="grid grid-cols-2 gap-2">
			<label class="text-xs font-semibold text-on-surface-variant">
				Provider
				<input
					name="providerName"
					required
					value={data.insurance.providerName === '—' ? '' : data.insurance.providerName}
					class="mt-1 w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm"
				/>
			</label>
			<label class="text-xs font-semibold text-on-surface-variant">
				Plan name
				<input
					name="planName"
					required
					value={data.insurance.id ? data.insurance.planName : ''}
					class="mt-1 w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm"
				/>
			</label>
		</div>
		<div class="grid grid-cols-2 gap-2">
			<label class="text-xs font-semibold text-on-surface-variant">
				Member ID
				<input
					name="memberId"
					required
					value={data.insurance.id ? data.insurance.memberId : ''}
					class="mt-1 w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm"
				/>
			</label>
			<label class="text-xs font-semibold text-on-surface-variant">
				Group No.
				<input
					name="groupNo"
					value={data.insurance.id && data.insurance.groupNo !== '—' ? data.insurance.groupNo : ''}
					class="mt-1 w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm"
				/>
			</label>
		</div>
		<label class="text-xs font-semibold text-on-surface-variant">
			Plan type
			<input
				name="planType"
				value={data.insurance.id && data.insurance.planType !== '—' ? data.insurance.planType : ''}
				class="mt-1 w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm"
			/>
		</label>
		<div class="grid grid-cols-2 gap-2">
			<label class="text-xs font-semibold text-on-surface-variant">
				Coverage start
				<input
					type="date"
					name="coverageStart"
					required
					value={data.insurance.coverageStart ?? ''}
					class="mt-1 w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm"
				/>
			</label>
			<label class="text-xs font-semibold text-on-surface-variant">
				Coverage end
				<input
					type="date"
					name="coverageEnd"
					required
					value={data.insurance.coverageEnd ?? ''}
					class="mt-1 w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm"
				/>
			</label>
		</div>
		<label class="text-xs font-semibold text-on-surface-variant">
			Status
			<select
				name="status"
				value={data.insurance.status}
				class="mt-1 w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm"
			>
				<option value="ACTIVE">Active</option>
				<option value="INACTIVE">Inactive</option>
			</select>
		</label>
		<div class="grid grid-cols-2 gap-2">
			<label class="text-xs font-semibold text-on-surface-variant">
				PCP cost ($)
				<input
					type="number"
					min="0"
					step="0.01"
					name="costPcp"
					class="mt-1 w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm"
				/>
			</label>
			<label class="text-xs font-semibold text-on-surface-variant">
				Specialist ($)
				<input
					type="number"
					min="0"
					step="0.01"
					name="costSpecialist"
					class="mt-1 w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm"
				/>
			</label>
			<label class="text-xs font-semibold text-on-surface-variant">
				Emergency ($)
				<input
					type="number"
					min="0"
					step="0.01"
					name="costEmergency"
					class="mt-1 w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm"
				/>
			</label>
			<label class="text-xs font-semibold text-on-surface-variant">
				Rx Deductible ($)
				<input
					type="number"
					min="0"
					step="0.01"
					name="costRx"
					class="mt-1 w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm"
				/>
			</label>
		</div>
		<label class="text-xs font-semibold text-on-surface-variant">
			Provider phone
			<input
				type="tel"
				name="providerPhone"
				value={data.insurance.providerPhone}
				class="mt-1 w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm"
			/>
		</label>
		<div class="flex gap-2 pt-1">
			<button
				type="submit"
				class="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary"
			>
				Save
			</button>
			<button
				type="button"
				class="rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface"
				onclick={() => (editing = false)}
			>
				Cancel
			</button>
		</div>
	</form>
{:else}
	<MotionReveal delay={50}>
		<p class="text-sm font-medium text-on-surface-variant">Active Coverage</p>
		<div class="mt-3">
			<InsuranceCoverageCard insurance={data.insurance} />
		</div>
	</MotionReveal>

	<MotionReveal delay={100}>
		<div class="mt-4">
			<CoveragePeriodCard
				period={data.insurance.coveragePeriod}
				status={data.insurance.status}
			/>
		</div>
	</MotionReveal>

	{#if data.insurance.costs.length > 0}
		<MotionReveal delay={150}>
			<div class="mt-4 grid grid-cols-2 gap-3">
				{#each data.insurance.costs as cost, i (cost.id)}
					<div in:fly={{ y: 10, duration: 280, delay: i * 35 }}>
						<CostDetailCard label={cost.label} amount={cost.amount}>
							{#snippet icon()}
								{#if cost.id === 'pcp'}
									<BriefcaseMedical size={20} strokeWidth={2} />
								{:else if cost.id === 'specialist'}
									<SquarePlus size={20} strokeWidth={2} />
								{:else if cost.id === 'emergency'}
									<Sparkles size={20} strokeWidth={2} />
								{:else}
									<ClipboardPlus size={20} strokeWidth={2} />
								{/if}
							{/snippet}
						</CostDetailCard>
					</div>
				{/each}
			</div>
		</MotionReveal>
	{/if}

	<MotionReveal delay={200}>
		<div class="mt-8 flex flex-col gap-3 pb-4">
			<button
				type="button"
				class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-on-primary shadow-primary active:scale-[0.98]"
				onclick={contactProvider}
			>
				<Phone size={18} strokeWidth={2.25} />
				Contact Provider
			</button>
			<button
				type="button"
				class="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface-container py-3.5 text-sm font-semibold text-primary active:scale-[0.98]"
				onclick={() => (editing = true)}
			>
				<FileUp size={18} strokeWidth={2.25} />
				{data.insurance.id ? 'Update Insurance' : 'Add Insurance'}
			</button>
		</div>
	</MotionReveal>
{/if}
