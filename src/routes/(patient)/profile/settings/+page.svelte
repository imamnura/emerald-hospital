<script lang="ts">
	import { enhance } from '$app/forms';
	import { Bell, Globe, Lock, Mail } from '@lucide/svelte';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';
	import BackHeader from '#lib/components/layout/BackHeader.svelte';
	import LogoutButton from '#lib/components/profile/LogoutButton.svelte';
	import SettingsCard from '#lib/components/profile/settings/SettingsCard.svelte';
	import SettingsRow from '#lib/components/profile/settings/SettingsRow.svelte';
	import SettingsSection from '#lib/components/profile/settings/SettingsSection.svelte';
	import SettingsToggle from '#lib/components/profile/settings/SettingsToggle.svelte';

	let { data } = $props();
</script>

<BackHeader title="Account Settings" backHref="/profile" divider />

<MotionReveal delay={50}>
	<SettingsSection title="Security">
		<SettingsCard>
			<SettingsRow href="/profile/settings/password" label="Change Password" icon={Lock} />
		</SettingsCard>
	</SettingsSection>
</MotionReveal>

<MotionReveal delay={100}>
	<SettingsSection title="Preferences">
		<SettingsCard>
			<form method="POST" action="?/togglePush" use:enhance class="block">
				<SettingsRow label="Push Notifications" icon={Bell}>
					{#snippet trailing()}
						<SettingsToggle
							checked={data.preferences.pushNotifications}
							ariaLabel="Push Notifications"
						/>
					{/snippet}
				</SettingsRow>
			</form>
			<form method="POST" action="?/toggleEmail" use:enhance class="block">
				<SettingsRow label="Email Notifications" icon={Mail} divider>
					{#snippet trailing()}
						<SettingsToggle
							checked={data.preferences.emailNotifications}
							ariaLabel="Email Notifications"
						/>
					{/snippet}
				</SettingsRow>
			</form>
		</SettingsCard>
	</SettingsSection>
</MotionReveal>

<MotionReveal delay={150}>
	<SettingsSection title="Account">
		<SettingsCard>
			<SettingsRow href="/profile/settings/language" label="Language" icon={Globe}>
				{#snippet trailing()}
					{#if data.languageLabel}
						<span class="text-sm text-on-surface-variant">{data.languageLabel}</span>
					{/if}
				{/snippet}
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>
</MotionReveal>

<MotionReveal delay={200}>
	<LogoutButton label="Sign Out" class="mt-8 pb-4" />
</MotionReveal>
