<script lang="ts">
	import { Bone, Download, FileText, FlaskConical } from '@lucide/svelte';
	import type { MedicalRecordView } from '#lib/utils/medical-records.ts';

	interface Props {
		record: MedicalRecordView;
	}

	let { record }: Props = $props();
</script>

<article
	class="flex items-start gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[var(--shadow-card)]"
>
	<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
		{#if record.type === 'lab'}
			<FlaskConical size={20} strokeWidth={2} />
		{:else if record.type === 'imaging'}
			<Bone size={20} strokeWidth={2} />
		{:else}
			<FileText size={20} strokeWidth={2} />
		{/if}
	</span>

	<div class="min-w-0 flex-1">
		<p class="font-heading text-sm font-bold text-on-surface">{record.title}</p>
		<p class="mt-0.5 text-xs text-outline">{record.dateLabel} • {record.facility}</p>
		<span
			class="mt-2 inline-block rounded-md bg-surface-container px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant"
		>
			{record.categoryLabel}
		</span>
	</div>

	{#if record.fileUrl}
		<a
			href={record.fileUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
			aria-label="Download {record.title}"
		>
			<Download size={20} strokeWidth={2} />
		</a>
	{/if}
</article>
