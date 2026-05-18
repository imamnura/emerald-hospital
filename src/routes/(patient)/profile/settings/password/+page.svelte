<script lang="ts">
	import { enhance } from '$app/forms';
	import MotionReveal from '$lib/components/motion/MotionReveal.svelte';
	import SearchPageHeader from '$lib/components/SearchPageHeader.svelte';

	let { form } = $props();
</script>

<SearchPageHeader title="Change Password" backHref="/profile/settings" showProfile={false} />

<div class="-mt-1 mb-4 border-b border-outline-variant/30" aria-hidden="true"></div>

<MotionReveal delay={50}>
	<form method="POST" action="?/change" use:enhance class="space-y-4">
		{#if form?.error}
			<p class="rounded-xl bg-error-container px-4 py-3 text-sm text-error">{form.error}</p>
		{/if}
		{#if form?.success}
			<p class="rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">
				Password updated successfully.
			</p>
		{/if}

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
			Update Password
		</button>
	</form>
</MotionReveal>
