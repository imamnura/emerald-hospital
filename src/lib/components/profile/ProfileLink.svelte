<script lang="ts">
	import Avatar from '#lib/components/ui/Avatar.svelte';
	import { getInitials } from '#lib/format/text.ts';

	interface Props {
		imageUrl?: string | null;
		name: string;
	}

	let { imageUrl, name }: Props = $props();
</script>

{#if imageUrl}
	<Avatar src={imageUrl} {name} size="md" />
{:else}
	<a
		href="/profile"
		class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-sm font-semibold text-on-primary"
	>
		{getInitials(name)}
	</a>
{/if}
