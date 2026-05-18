<script lang="ts">
	import { Lock, RotateCcw } from '@lucide/svelte';
</script>

<div
	class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-outline-variant/40 bg-surface-container-low shadow-[var(--shadow-card)]"
>
	<div class="relative flex h-10 w-10 items-center justify-center text-primary">
		<RotateCcw size={36} strokeWidth={1.75} />
		<span
			class="absolute flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-lowest"
		>
			<Lock size={12} strokeWidth={2.5} />
		</span>
	</div>
</div>
