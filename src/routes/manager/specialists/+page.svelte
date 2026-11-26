<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Sparkles } from '@lucide/svelte';
	import DeleteConfirm from '#lib/components/manager/DeleteConfirm.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import Modal from '#lib/components/ui/Modal.svelte';
	import ManagerSearchForm from '#lib/components/manager/ManagerSearchForm.svelte';
	import PageHeader from '#lib/components/manager/PageHeader.svelte';
	import Pagination from '#lib/components/ui/Pagination.svelte';
	import RowActions from '#lib/components/manager/RowActions.svelte';
	import { MANAGER_INPUT_CLASS } from '#lib/components/manager/styles.ts';
	import { createCrudState } from '#lib/utils/crud.svelte.ts';
	import { toastForm } from '#lib/utils/enhance.ts';
	import { withParams } from '#lib/utils/url.ts';

	let { data } = $props();
	type Specialist = (typeof data.specialists)[number];

	const crud = createCrudState<Specialist>();

	let searchInput = $derived(data.query);

	function applyFilters() {
		goto(withParams(page.url, { q: searchInput.trim() }, { relative: true }), { reset: false });
	}
</script>

<PageHeader
	title="Specialists"
	subtitle="Manage the medical specialties shown to patients."
	count={data.total}
	countLabel="total"
	addLabel="Add Specialty"
	onadd={() => crud.openAdd()}
/>

<div class="mt-6 flex flex-col gap-4">
	<ManagerSearchForm
		bind:value={searchInput}
		placeholder="Search specialties (press Enter)"
		onsubmit={() => applyFilters()}
	/>

	{#if data.specialists.length === 0}
		<EmptyState
			title={data.query ? 'No specialties found' : 'No specialties yet'}
			description={data.query
				? 'Try a different keyword.'
				: 'Add medical specialties so doctors can be categorized.'}
		>
			{#snippet icon()}
				<Sparkles size={24} strokeWidth={2} />
			{/snippet}
		</EmptyState>
	{:else}
		<div
			class="overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-[var(--shadow-card)]"
		>
			<div class="overflow-x-auto">
				<table class="w-full min-w-[560px] text-left text-sm">
					<thead>
						<tr
							class="bg-surface-container-low text-[11px] font-semibold uppercase tracking-wide text-outline"
						>
							<th class="w-12 px-4 py-3 text-right">No.</th>
							<th class="px-4 py-3">Specialty</th>
							<th class="px-4 py-3">Slug</th>
							<th class="px-4 py-3">Icon</th>
							<th class="px-4 py-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.specialists as s, i (s.id)}
							<tr class="border-t border-outline-variant/20 hover:bg-surface-container-low/40">
								<td class="px-4 py-3 align-middle text-right text-xs text-outline tabular-nums">
									{(data.page - 1) * data.pageSize + i + 1}
								</td>
								<td class="px-4 py-3 align-middle">
									<div class="flex items-center gap-2.5">
										<span
											class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
										>
											<Sparkles size={14} strokeWidth={2} />
										</span>
										<span class="font-medium text-on-surface">{s.name}</span>
									</div>
								</td>
								<td class="px-4 py-3 align-middle text-xs text-on-surface-variant">
									<code class="rounded bg-surface-container px-1.5 py-0.5">{s.slug}</code>
								</td>
								<td class="px-4 py-3 align-middle text-xs text-on-surface-variant">
									{s.icon ?? '—'}
								</td>
								<td class="px-4 py-3 align-middle">
									<RowActions name={s.name} onedit={() => crud.openEdit(s)} ondelete={() => crud.askDelete(s)} />
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
				label="specialties"
			/>
		</div>
	{/if}
</div>

<Modal
	bind:open={crud.modalOpen}
	formId="specialist-form"
	submitLabel={crud.editing ? 'Save Changes' : 'Create'}
	title={crud.editing ? 'Edit specialty' : 'Add specialty'}
	description={crud.editing ? crud.editing.name : 'Create a new medical specialty category'}
>
	<form
		id="specialist-form"
		method="POST"
		action={crud.editing ? '?/update' : '?/create'}
		use:enhance={toastForm({
			successMessage: crud.editing ? 'Specialty updated.' : 'Specialty created.',
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
			Display name *
			<input
				name="name"
				required
				value={crud.editing?.name ?? ''}
				placeholder="Cardiology"
				class={MANAGER_INPUT_CLASS}
			/>
		</label>
		<div class="grid gap-3 sm:grid-cols-2">
			<label class="text-xs font-semibold text-on-surface-variant">
				URL slug *
				<input
					name="slug"
					required
					value={crud.editing?.slug ?? ''}
					pattern="[a-z0-9-]+"
					placeholder="cardiology"
					class={MANAGER_INPUT_CLASS}
				/>
			</label>
			<label class="text-xs font-semibold text-on-surface-variant">
				Icon key
				<input
					name="icon"
					value={crud.editing?.icon ?? ''}
					placeholder="heart, eye, dental…"
					class={MANAGER_INPUT_CLASS}
				/>
			</label>
		</div>
	</form>

</Modal>

<DeleteConfirm
	bind:open={crud.confirmOpen}
	target={crud.confirmTarget}
	title="Delete specialty?"
	message={`Delete "${crud.confirmTarget?.name ?? ''}"? Doctors in this specialty will need to be reassigned.`}
	successMessage={`Specialty "${crud.confirmTarget?.name ?? ''}" deleted.`}
	failureMessage="Failed to delete specialty."
	onclose={() => (crud.confirmTarget = null)}
/>
