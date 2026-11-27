<script lang="ts">
	import FormAlert from '#lib/components/ui/FormAlert.svelte';
	import { enhance } from '$app/forms';
	import MotionReveal from '#lib/components/motion/MotionReveal.svelte';
	import BackHeader from '#lib/components/layout/BackHeader.svelte';

	let { data, form } = $props();
</script>

<BackHeader title={data.hasPassword ? 'Change Password' : 'Set Password'} backHref="/profile/settings" divider dividerClass="mb-4" />

<MotionReveal delay={50}>
	<form method="POST" action="?/change" use:enhance class="space-y-4">
		<FormAlert message={form?.error} />
		{#if form?.success}
			<FormAlert kind="success" message="Password updated successfully." />
		{/if}

		{#if !data.hasPassword}
			<p class="rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
				You signed up with Google. Set a password to also sign in with your email.
			</p>
		{:else}
		<div>
			<label for="current" class="mb-1.5 block text-sm font-semibold">Current Password</label>
			<input
				id="current"
				name="currentPassword"
				type="password"
				required
				autocomplete="current-password"
				class="w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</div>
		{/if}

		<div>
			<label for="new" class="mb-1.5 block text-sm font-semibold">New Password</label>
			<input
				id="new"
				name="newPassword"
				type="password"
				required
				minlength="8"
				autocomplete="new-password"
				class="w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</div>

		<div>
			<label for="confirm" class="mb-1.5 block text-sm font-semibold">Confirm New Password</label>
			<input
				id="confirm"
				name="confirmPassword"
				type="password"
				required
				minlength="8"
				autocomplete="new-password"
				class="w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</div>

		<button
			type="submit"
			class="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-on-primary active:scale-[0.98]"
		>
			{data.hasPassword ? 'Update Password' : 'Set Password'}
		</button>
	</form>
</MotionReveal>
