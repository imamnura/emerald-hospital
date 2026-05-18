<script lang="ts">
	import { Plus, Shield } from '@lucide/svelte';
</script>

<div
	class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-outline-variant/40 bg-surface-container-low shadow-[var(--shadow-card)]"
>
	<div class="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
		<Shield size={22} class="text-on-primary" strokeWidth={2} fill="currentColor" />
		<span
			class="absolute flex h-4 w-4 items-center justify-center rounded-sm bg-on-primary text-primary"
		>
			<Plus size={12} strokeWidth={3} />
		</span>
	</div>
</div>
