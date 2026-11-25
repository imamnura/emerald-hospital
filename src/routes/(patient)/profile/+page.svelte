<script lang="ts">
	import { getInitials } from '#lib/format/text.ts';
	import { enhance } from '$app/forms';
	import {
		Banknote,
		Bell,
		FileText,
		HelpCircle,
		LogOut,
		Settings,
		Shield,
		User
	} from '@lucide/svelte';
	import Header from '#lib/components/Header.svelte';
	import ProfileMenuItem from '#lib/components/ProfileMenuItem.svelte';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';

	let { data } = $props();

	const menuItems = [
		{ href: '/profile/personal', label: 'Personal Information', Icon: User },
		{ href: '/profile/medical-records', label: 'Medical Records', Icon: FileText },
		{ href: '/profile/insurance', label: 'Insurance Details', Icon: Shield },
		{ href: '/profile/payment-methods', label: 'Payment Methods', Icon: Banknote },
		{ href: '/appointments', label: 'Notifications', Icon: Bell },
		{ href: '/profile/settings', label: 'Account Settings', Icon: Settings },
		{ href: '/profile/help', label: 'Help & Support', Icon: HelpCircle }
	] as const;

	const initials = $derived(getInitials(data.profile.name));
</script>

<Header leadingIcon="user" showSearch={false} showNotification={true} />

<MotionReveal delay={40}>
	<section class="mt-4 flex flex-col items-center text-center">
		{#if data.profile.imageUrl}
			<img
				src={data.profile.imageUrl}
				alt={data.profile.name}
				class="h-28 w-28 rounded-full border-4 border-surface-container-lowest object-cover shadow-[var(--shadow-card)]"
			/>
		{:else}
			<div
				class="flex h-28 w-28 items-center justify-center rounded-full border-4 border-surface-container-lowest bg-primary/10 text-3xl font-bold text-primary shadow-[var(--shadow-card)]"
			>
				{initials}
			</div>
		{/if}
		<h2 class="mt-4 font-heading text-2xl font-bold text-on-surface">{data.profile.name}</h2>
		<p class="mt-1 text-sm text-outline">Member since {data.memberSince}</p>
	</section>
</MotionReveal>

<MotionReveal delay={90}>
	<div
		class="mt-6 grid grid-cols-3 divide-x divide-outline-variant/40 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest py-5 shadow-[var(--shadow-card)]"
	>
		<div class="px-3 text-center">
			<p class="text-xs text-outline">Blood Type</p>
			<p class="mt-1 font-heading text-lg font-bold text-primary">{data.stats.bloodType}</p>
		</div>
		<div class="px-3 text-center">
			<p class="text-xs text-outline">Next Visit</p>
			<p class="mt-1 font-heading text-lg font-bold text-on-surface">{data.stats.nextVisit}</p>
		</div>
		<div class="px-3 text-center">
			<p class="text-xs text-outline">Reports</p>
			<p class="mt-1 font-heading text-lg font-bold text-primary">{data.stats.reports}</p>
		</div>
	</div>
</MotionReveal>

<MotionReveal delay={140}>
	<nav class="mt-6 flex flex-col gap-2.5" aria-label="Profile menu">
		{#each menuItems as item}
			<ProfileMenuItem href={item.href} label={item.label}>
				{#snippet icon()}
					<item.Icon size={20} strokeWidth={2} />
				{/snippet}
			</ProfileMenuItem>
		{/each}
	</nav>
</MotionReveal>

<MotionReveal delay={190}>
	<form method="POST" action="?/logout" use:enhance class="mt-6 pb-2">
		<button
			type="submit"
			class="flex w-full items-center justify-center gap-2 rounded-2xl bg-error-container/60 py-3.5 text-sm font-bold text-error transition-opacity active:opacity-80"
		>
			<LogOut size={18} strokeWidth={2.25} />
			Logout
		</button>
	</form>

	{#if data.profile.role === 'manager'}
		<a href="/manager" class="mt-4 block text-center text-sm font-semibold text-primary">
			Manager Dashboard
		</a>
	{/if}
</MotionReveal>
