<script lang="ts">
	import { Bell, Search, User } from '@lucide/svelte';
	import brandIcon from '#lib/assets/icon_purwakarta_health.png';

	interface Props {
		userName?: string;
		userImage?: string | null;
		showSearch?: boolean;
		showNotification?: boolean;
		leadingIcon?: 'avatar' | 'user';
	}

	let {
		userName = 'Guest',
		userImage = null,
		showSearch = true,
		showNotification = false,
		leadingIcon = 'avatar'
	}: Props = $props();

	const initials = $derived(
		userName
			.split(' ')
			.map((n) => n[0])
			.join('')
			.slice(0, 2)
			.toUpperCase()
	);
</script>

<header class="flex items-center justify-between py-2">
	{#if leadingIcon === 'user'}
		<div
			class="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/50 text-primary"
			aria-hidden="true"
		>
			<User size={22} strokeWidth={2} />
		</div>
	{:else if userImage}
		<img src={userImage} alt={userName} class="h-10 w-10 rounded-full object-cover" />
	{:else}
		<div
			class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-sm font-semibold text-on-primary"
		>
			{initials}
		</div>
	{/if}

	<div class="flex items-center gap-2">
		<img src={brandIcon} alt="" aria-hidden="true" class="h-7 w-7 shrink-0" />
		<h1 class="font-heading text-lg font-bold text-primary">Purwakarta Health</h1>
	</div>

	{#if showSearch}
		<a
			href="/search"
			class="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container"
			aria-label="Search"
		>
			<Search size={22} />
		</a>
	{:else if showNotification}
		<button
			type="button"
			class="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container"
			aria-label="Notifications"
		>
			<Bell size={22} />
		</button>
	{:else}
		<div class="w-10"></div>
	{/if}
</header>
