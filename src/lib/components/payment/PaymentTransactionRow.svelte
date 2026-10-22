<script lang="ts">
	import { BriefcaseMedical } from '@lucide/svelte';
	import {
		formatCurrency,
		formatTxDate,
		txPaymentLabel,
		type TransactionView
	} from '#lib/utils/payments.ts';

	interface Props {
		transaction: TransactionView;
	}

	let { transaction }: Props = $props();
</script>

<article
	class="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-4 shadow-[var(--shadow-card)]"
>
	<span
		class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
	>
		<BriefcaseMedical size={20} strokeWidth={2} />
	</span>
	<div class="min-w-0 flex-1">
		<p class="font-heading text-sm font-bold text-primary">{transaction.title}</p>
		<p class="mt-0.5 text-xs text-outline">
			{formatTxDate(transaction.paidAt)} • {txPaymentLabel(transaction)}
		</p>
	</div>
	<p class="shrink-0 font-heading text-sm font-bold text-primary">
		{formatCurrency(transaction.amount, transaction.currency)}
	</p>
</article>
