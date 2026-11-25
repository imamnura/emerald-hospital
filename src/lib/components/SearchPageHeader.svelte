<script lang="ts">
	import { getInitials } from '#lib/format/text.ts';
	import { ArrowLeft } from '@lucide/svelte';

	interface Props {
		title?: string;
		backHref?: string;
		userName?: string;
		userImage?: string | null;
		showProfile?: boolean;
	}

	let {
		title = 'Medical Center',
		backHref = '/home',
		userName = 'Guest',
		userImage = null,
		showProfile = true
	}: Props = $props();

	const initials = $derived(getInitials(userName));
</script>

<header class="flex items-center justify-between py-2">
	<a
		href={backHref}
		class="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container"
		aria-label="Back"
	>
		<ArrowLeft size={22} />
	</a>

	<h1 class="font-heading text-lg font-bold text-primary">{title}</h1>

	{#if showProfile}
		{#if userImage}
			<img src={userImage} alt={userName} class="h-10 w-10 rounded-full object-cover" />
		{:else}
			<a
				href="/profile"
				class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-sm font-semibold text-on-primary"
			>
				{initials}
			</a>
		{/if}
	{:else}
		<div class="w-10" aria-hidden="true"></div>
	{/if}
</header>
