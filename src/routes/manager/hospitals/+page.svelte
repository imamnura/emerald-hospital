<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Building2 } from '@lucide/svelte';
	import DeleteConfirm from '#lib/components/manager/DeleteConfirm.svelte';
	import EmptyState from '#lib/components/manager/EmptyState.svelte';
	import Modal from '#lib/components/manager/Modal.svelte';
	import ManagerSearchForm from '#lib/components/manager/ManagerSearchForm.svelte';
	import PageHeader from '#lib/components/manager/PageHeader.svelte';
	import Pagination from '#lib/components/manager/Pagination.svelte';
	import RowActions from '#lib/components/manager/RowActions.svelte';
	import { MANAGER_INPUT_CLASS } from '#lib/components/manager/styles.ts';
	import { createCrudState } from '#lib/utils/crud.svelte.ts';
	import { toastForm } from '#lib/utils/enhance.ts';
	import { withParams } from '#lib/utils/url.ts';

	let { data } = $props();
	type Hospital = (typeof data.hospitals)[number];

	const crud = createCrudState<Hospital>();

	let searchInput = $state('');
	$effect.pre(() => {
		searchInput = data.query;
	});

	function applyFilters() {
		goto(withParams(page.url, { q: searchInput.trim() }, { relative: true }), { reset: false });
	}
</script>

<PageHeader
	title="Hospitals"
	subtitle="Manage partner facilities and their contact details."
	count={data.total}
	countLabel="total"
	addLabel="Add Hospital"
	onadd={() => crud.openAdd()}
/>

<div class="mt-6 flex flex-col gap-4">
	<ManagerSearchForm
		bind:value={searchInput}
		placeholder="Search by name, city, or address (press Enter)"
		onsubmit={() => applyFilters()}
	/>

	{#if data.hospitals.length === 0}
		<EmptyState
			title={data.query ? 'No hospitals match your search' : 'No hospitals yet'}
			description={data.query
				? 'Try a different keyword.'
				: 'Add your first hospital to get started.'}
		>
			{#snippet icon()}
				<Building2 size={24} strokeWidth={2} />
			{/snippet}
		</EmptyState>
	{:else}
		<div
			class="overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-[var(--shadow-card)]"
		>
			<div class="overflow-x-auto">
				<table class="w-full min-w-[680px] text-left text-sm">
					<thead>
						<tr
							class="bg-surface-container-low text-[11px] font-semibold uppercase tracking-wide text-outline"
						>
							<th class="w-12 px-4 py-3 text-right">No.</th>
							<th class="px-4 py-3">Name</th>
							<th class="px-4 py-3">Location</th>
							<th class="px-4 py-3">Contact</th>
							<th class="px-4 py-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.hospitals as h, i (h.id)}
							<tr class="border-t border-outline-variant/20 hover:bg-surface-container-low/40">
								<td class="px-4 py-3 align-middle text-right text-xs text-outline tabular-nums">
									{(data.page - 1) * data.pageSize + i + 1}
								</td>
								<td class="px-4 py-3 align-middle">
									<div class="flex items-center gap-2.5">
										<span
											class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
										>
											<Building2 size={14} strokeWidth={2} />
										</span>
										<span class="font-medium text-on-surface">{h.name}</span>
									</div>
								</td>
								<td class="px-4 py-3 align-middle text-on-surface-variant">
									<p>{h.city}</p>
									<p class="text-xs text-outline">{h.address}</p>
								</td>
								<td class="px-4 py-3 align-middle text-xs text-on-surface-variant">
									{h.contact ?? '—'}
								</td>
								<td class="px-4 py-3 align-middle">
									<RowActions name={h.name} onedit={() => crud.openEdit(h)} ondelete={() => crud.askDelete(h)} />
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<Pagination
				page={data.page}
				pageSize={data.pageSize}
				total={data.total}
				label="hospitals"
			/>
		</div>
	{/if}
</div>

<!-- Add / Edit modal -->
<Modal
	bind:open={crud.modalOpen}
	formId="hospital-form"
	submitLabel={crud.editing ? 'Save Changes' : 'Create'}
	title={crud.editing ? 'Edit hospital' : 'Add hospital'}
	description={crud.editing ? crud.editing.name : 'Create a new partner facility'}
>
	<form
		id="hospital-form"
		method="POST"
		action={crud.editing ? '?/update' : '?/create'}
		use:enhance={toastForm({
			successMessage: crud.editing ? 'Hospital updated.' : 'Hospital created.',
			onSuccess: () => {
				crud.modalOpen = false;
				crud.editing = null;
			}
		})}
		class="space-y-3"
	>
		{#if crud.editing}
			<input type="hidden" name="id" value={crud.editing.id} />
		{/if}
		<label class="block text-xs font-semibold text-on-surface-variant">
			Hospital name *
			<input
				name="name"
				required
				value={crud.editing?.name ?? ''}
				placeholder="Central Health Hospital"
				class={MANAGER_INPUT_CLASS}
			/>
		</label>
		<div class="grid gap-3 sm:grid-cols-2">
			<label class="text-xs font-semibold text-on-surface-variant">
				City *
				<input
					name="city"
					required
					value={crud.editing?.city ?? ''}
					placeholder="Jakarta"
					class={MANAGER_INPUT_CLASS}
				/>
			</label>
			<label class="text-xs font-semibold text-on-surface-variant">
				Contact
				<input
					name="contact"
					value={crud.editing?.contact ?? ''}
					placeholder="+62211234567"
					class={MANAGER_INPUT_CLASS}
				/>
			</label>
		</div>
		<label class="block text-xs font-semibold text-on-surface-variant">
			Address *
			<input
				name="address"
				required
				value={crud.editing?.address ?? ''}
				placeholder="Jl. Sudirman No. 45"
				class={MANAGER_INPUT_CLASS}
			/>
		</label>
		<label class="block text-xs font-semibold text-on-surface-variant">
			Image URL
			<input
				name="imageUrl"
				value={crud.editing?.imageUrl ?? ''}
				placeholder="https://…"
				class={MANAGER_INPUT_CLASS}
			/>
		</label>
	</form>

</Modal>

<DeleteConfirm
	bind:open={crud.confirmOpen}
	target={crud.confirmTarget}
	title="Delete hospital?"
	message={`Delete "${crud.confirmTarget?.name ?? ''}"? Doctors assigned here will need to be reassigned. This cannot be undone.`}
	successMessage={`Hospital "${crud.confirmTarget?.name ?? ''}" deleted.`}
	failureMessage="Failed to delete hospital."
	onclose={() => (crud.confirmTarget = null)}
/>
