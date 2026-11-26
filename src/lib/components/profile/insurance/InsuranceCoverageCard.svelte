<script lang="ts">
	import { Shield } from '@lucide/svelte';
	import type { InsuranceProfileView } from '#lib/utils/insurance.ts';

	interface Props {
		insurance: InsuranceProfileView;
	}

	let { insurance }: Props = $props();
</script>

<article
	class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-[#004d38] to-[#003d2e] p-5 text-on-primary shadow-[var(--shadow-primary)]"
>
	<div class="flex items-start justify-between gap-3">
		<div>
			<p class="text-[10px] font-semibold uppercase tracking-wider text-on-primary/75">
				{insurance.providerName}
			</p>
			<p class="mt-0.5 font-heading text-xl font-bold">{insurance.planName}</p>
		</div>
		<span
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-on-primary/30"
		>
			<Shield size={22} class="text-on-primary" strokeWidth={1.75} />
		</span>
	</div>

	<div class="mt-5 grid grid-cols-2 gap-4 border-t border-on-primary/20 pt-4">
		<div>
			<p class="text-[10px] text-on-primary/70">Member Name</p>
			<p class="mt-0.5 text-sm font-bold">{insurance.memberName}</p>
		</div>
		<div>
			<p class="text-[10px] text-on-primary/70">Member ID</p>
			<p class="mt-0.5 text-sm font-bold">{insurance.memberId}</p>
		</div>
	</div>

	<div class="mt-4 grid grid-cols-2 gap-4 border-t border-on-primary/20 pt-4">
		<div>
			<p class="text-[10px] text-on-primary/70">Group No.</p>
			<p class="mt-0.5 text-sm font-bold">{insurance.groupNo}</p>
		</div>
		<div>
			<p class="text-[10px] text-on-primary/70">Plan Type</p>
			<p class="mt-0.5 text-sm font-bold">{insurance.planType}</p>
		</div>
	</div>
</article>
