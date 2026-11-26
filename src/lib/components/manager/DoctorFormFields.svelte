<script lang="ts">
import { DEFAULT_RATING } from '#lib/domain/doctor.ts';
	import { MANAGER_INPUT_CLASS } from '#lib/components/manager/styles.ts';

	type Option = { id: string; name: string };
	type EditingDoctor = {
		name: string;
		hospitalId: string;
		specialistId: string;
		rating: string | number | null;
		consultationFee: string | number | null;
		isActive: boolean;
		imageUrl: string | null;
		bio: string | null;
	};

	interface Props {
		editing: EditingDoctor | null;
		hospitals: Option[];
		specialists: Option[];
	}

	let { editing, hospitals, specialists }: Props = $props();
</script>

<label class="block text-xs font-semibold text-on-surface-variant">
	Full name *
	<input
		name="name"
		required
		value={editing?.name ?? ''}
		placeholder="Dr. Jane Doe"
		class={MANAGER_INPUT_CLASS}
	/>
</label>
<div class="grid gap-3 sm:grid-cols-2">
	<label class="text-xs font-semibold text-on-surface-variant">
		Hospital *
		<select
			name="hospitalId"
			required
			value={editing?.hospitalId ?? ''}
			class={MANAGER_INPUT_CLASS}
		>
			<option value="">Select hospital</option>
			{#each hospitals as h (h.id)}
				<option value={h.id}>{h.name}</option>
			{/each}
		</select>
	</label>
	<label class="text-xs font-semibold text-on-surface-variant">
		Specialty *
		<select
			name="specialistId"
			required
			value={editing?.specialistId ?? ''}
			class={MANAGER_INPUT_CLASS}
		>
			<option value="">Select specialty</option>
			{#each specialists as s (s.id)}
				<option value={s.id}>{s.name}</option>
			{/each}
		</select>
	</label>
</div>
<div class="grid gap-3 sm:grid-cols-3">
	<label class="text-xs font-semibold text-on-surface-variant">
		Rating
		<input
			name="rating"
			type="number"
			step="0.1"
			min="0"
			max="5"
			value={editing?.rating ?? DEFAULT_RATING}
			class={MANAGER_INPUT_CLASS}
		/>
	</label>
	<label class="text-xs font-semibold text-on-surface-variant">
		Consultation fee
		<input
			name="consultationFee"
			type="number"
			step="0.01"
			min="0"
			value={editing?.consultationFee ?? ''}
			placeholder="150.00"
			class={MANAGER_INPUT_CLASS}
		/>
	</label>
	<label class="flex items-center gap-2 text-xs font-semibold text-on-surface-variant pt-5">
		<input
			type="checkbox"
			name="isActive"
			checked={editing ? editing.isActive : true}
			class="h-4 w-4 rounded border-outline-variant accent-primary"
		/>
		Active
	</label>
</div>
<label class="block text-xs font-semibold text-on-surface-variant">
	Image URL
	<input
		name="imageUrl"
		value={editing?.imageUrl ?? ''}
		placeholder="https://…"
		class={MANAGER_INPUT_CLASS}
	/>
</label>
<label class="block text-xs font-semibold text-on-surface-variant">
	Bio
	<textarea
		name="bio"
		rows="3"
		value={editing?.bio ?? ''}
		placeholder="Short professional bio shown to patients."
		class="{MANAGER_INPUT_CLASS} resize-y"
	></textarea>
</label>
