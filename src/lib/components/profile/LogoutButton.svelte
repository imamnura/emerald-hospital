<script lang="ts">
	import { enhance } from '$app/forms';
	import { LogOut } from '@lucide/svelte';
	import { cn } from '#lib/utils.ts';

	interface Props {
		label?: string;
		/** Extra classes for the form (spacing differs per page). */
		class?: string;
	}

	let { label = 'Logout', class: className }: Props = $props();
</script>

<form method="POST" action="?/logout" use:enhance class={cn(className)}>
	<button
		type="submit"
		class="flex w-full items-center justify-center gap-2 rounded-2xl bg-error-container/60 py-3.5 text-sm font-bold text-error transition-opacity active:opacity-80"
	>
		<LogOut size={18} strokeWidth={2.25} />
		{label}
	</button>
</form>
