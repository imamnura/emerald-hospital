<script lang="ts">
	import FormAlert from '#lib/components/ui/FormAlert.svelte';
	import { enhance, type SubmitFunction } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { Plus } from '@lucide/svelte';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';
	import SavedPaymentCard from '#lib/components/profile/payment/SavedPaymentCard.svelte';
	import PaymentTransactionRow from '#lib/components/profile/payment/PaymentTransactionRow.svelte';
	import BackHeader from '#lib/components/layout/BackHeader.svelte';
	import SettingsSection from '#lib/components/profile/settings/SettingsSection.svelte';

	let { data, form } = $props();

	let showAdd = $state(false);
	let setDefaultFormEl: HTMLFormElement;
	let deleteFormEl: HTMLFormElement;
	let pendingCardId = $state('');

	/** Stamps the chosen card id onto the outgoing request, so it never depends on a DOM flush. */
	const withPendingCard: SubmitFunction = ({ formData }) => {
		formData.set('cardId', pendingCardId);
	};

	function submitSetDefault(cardId: string) {
		pendingCardId = cardId;
		setDefaultFormEl.requestSubmit();
	}

	function submitDelete(cardId: string) {
		pendingCardId = cardId;
		deleteFormEl.requestSubmit();
	}
</script>

<BackHeader title="Payment Methods" backHref="/profile" divider />

<FormAlert message={form?.error} class="mt-2" />

<form
	method="POST"
	action="?/setDefault"
	use:enhance={withPendingCard}
	bind:this={setDefaultFormEl}
	class="hidden"
>
	<input type="hidden" name="cardId" value={pendingCardId} />
</form>
<form
	method="POST"
	action="?/delete"
	use:enhance={withPendingCard}
	bind:this={deleteFormEl}
	class="hidden"
>
	<input type="hidden" name="cardId" value={pendingCardId} />
</form>

<MotionReveal delay={50}>
	<SettingsSection title="Saved Cards">
		<div class="flex flex-col gap-3">
			{#each data.savedCards as card, i (card.id)}
				<div in:fly={{ y: 10, duration: 280, delay: i * 40 }}>
					<SavedPaymentCard
						{card}
						onSetDefault={() => submitSetDefault(card.id)}
						onDelete={() => submitDelete(card.id)}
					/>
				</div>
			{/each}

			{#if showAdd}
				<form
					method="POST"
					action="?/add"
					use:enhance={() => async ({ update }) => {
						await update({ reset: true });
						showAdd = false;
					}}
					class="flex flex-col gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4"
				>
					<div class="grid grid-cols-2 gap-2">
						<label class="text-xs font-semibold text-on-surface-variant">
							Brand
							<select
								name="brand"
								required
								class="mt-1 w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm"
							>
								<option value="visa">Visa</option>
								<option value="mastercard">Mastercard</option>
							</select>
						</label>
						<label class="text-xs font-semibold text-on-surface-variant">
							Last 4
							<input
								type="text"
								name="last4"
								required
								maxlength="4"
								pattern="\d{4}"
								placeholder="1234"
								class="mt-1 w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm"
							/>
						</label>
					</div>
					<label class="text-xs font-semibold text-on-surface-variant">
						Expires (MM/YY)
						<input
							type="text"
							name="expires"
							required
							maxlength="5"
							pattern="(0[1-9]|1[0-2])/\d{2}"
							placeholder="12/26"
							class="mt-1 w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm"
						/>
					</label>
					<label class="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
						<input type="checkbox" name="makeDefault" />
						Make default
					</label>
					<div class="flex gap-2">
						<button
							type="submit"
							class="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary"
						>
							Save Card
						</button>
						<button
							type="button"
							class="rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface"
							onclick={() => (showAdd = false)}
						>
							Cancel
						</button>
					</div>
				</form>
			{:else}
				<button
					type="button"
					class="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant/50 bg-surface-container-lowest/50 px-4 py-8 transition-colors active:bg-surface-container"
					onclick={() => (showAdd = true)}
				>
					<span
						class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-primary"
					>
						<Plus size={24} strokeWidth={2.5} />
					</span>
					<span class="mt-3 text-sm font-semibold text-primary">Add New Payment Method</span>
				</button>
			{/if}
		</div>
	</SettingsSection>
</MotionReveal>

<MotionReveal delay={120}>
	<section class="mt-6">
		<div class="mb-2 flex items-center justify-between gap-2">
			<p class="text-xs font-semibold uppercase tracking-wide text-outline">Recent Transactions</p>
		</div>
		<div class="flex flex-col gap-3">
			{#if data.transactions.length === 0}
				<p class="text-sm text-outline">No transactions yet.</p>
			{:else}
				{#each data.transactions as tx, i (tx.id)}
					<div in:fly={{ y: 10, duration: 280, delay: i * 40 }}>
						<PaymentTransactionRow transaction={tx} />
					</div>
				{/each}
			{/if}
		</div>
	</section>
</MotionReveal>
