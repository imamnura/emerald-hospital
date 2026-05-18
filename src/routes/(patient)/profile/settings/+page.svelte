<script lang="ts">
	import { enhance } from '$app/forms';
	import { Bell, Globe, Lock, LogOut, Mail } from '@lucide/svelte';
	import MotionReveal from '$lib/components/motion/MotionReveal.svelte';
	import SearchPageHeader from '$lib/components/SearchPageHeader.svelte';
	import SettingsCard from '$lib/components/settings/SettingsCard.svelte';
	import SettingsLinkRow from '$lib/components/settings/SettingsLinkRow.svelte';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import SettingsToggleRow from '$lib/components/settings/SettingsToggleRow.svelte';

	let { data } = $props();
</script>

<SearchPageHeader title="Account Settings" backHref="/profile" showProfile={false} />

<div class="-mt-1 mb-2 border-b border-outline-variant/30" aria-hidden="true"></div>

<MotionReveal delay={50}>
	<SettingsSection title="Security">
		<SettingsCard>
			<SettingsLinkRow href="/profile/settings/password" label="Change Password">
				{#snippet icon()}
					<Lock size={20} strokeWidth={2} />
				{/snippet}
			</SettingsLinkRow>
		</SettingsCard>
	</SettingsSection>
</MotionReveal>

<MotionReveal delay={100}>
	<SettingsSection title="Preferences">
		<SettingsCard>
			<form method="POST" action="?/togglePush" use:enhance class="block">
				<button type="submit" class="w-full text-left">
					<SettingsToggleRow
						label="Push Notifications"
						checked={data.preferences.pushNotifications}
					>
						{#snippet icon()}
							<Bell size={20} strokeWidth={2} />
						{/snippet}
					</SettingsToggleRow>
				</button>
			</form>
			<form method="POST" action="?/toggleEmail" use:enhance class="block">
				<button type="submit" class="w-full text-left">
					<SettingsToggleRow
						label="Email Notifications"
						checked={data.preferences.emailNotifications}
						showDivider
					>
						{#snippet icon()}
							<Mail size={20} strokeWidth={2} />
						{/snippet}
					</SettingsToggleRow>
				</button>
			</form>
		</SettingsCard>
	</SettingsSection>
</MotionReveal>

<MotionReveal delay={150}>
	<SettingsSection title="Account">
		<SettingsCard>
			<SettingsLinkRow
				href="/profile/settings/language"
				label="Language"
				value={data.languageLabel}
			>
				{#snippet icon()}
					<Globe size={20} strokeWidth={2} />
				{/snippet}
			</SettingsLinkRow>
		</SettingsCard>
	</SettingsSection>
</MotionReveal>

<MotionReveal delay={200}>
	<form method="POST" action="?/logout" use:enhance class="mt-8 pb-4">
		<button
			type="submit"
			class="flex w-full items-center justify-center gap-2 rounded-2xl bg-error-container/60 py-3.5 text-sm font-bold text-error transition-opacity active:opacity-80"
		>
			<LogOut size={18} strokeWidth={2.25} />
			Sign Out
		</button>
	</form>
</MotionReveal>
