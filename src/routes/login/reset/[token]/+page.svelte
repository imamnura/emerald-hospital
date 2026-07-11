<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { ArrowLeft, Lock } from '@lucide/svelte';
	import AuthForgotIcon from '$lib/components/auth/AuthForgotIcon.svelte';

	let { data, form } = $props();

	const expired = $derived(!data.valid || form?.expired === true);
</script>

<div class="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-surface px-6 py-10">
	<div class="text-center" in:fly={{ y: 12, duration: 400 }}>
		<AuthForgotIcon />
		<h1 class="mt-6 font-heading text-2xl font-bold text-on-surface">Reset Password</h1>
		<p class="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-on-surface-variant">
			{#if expired}
				This reset link is invalid or has expired. Request a new one to continue.
			{:else}
				Choose a new password for your account.
			{/if}
		</p>
	</div>

	{#if expired}
		<a
			href="/login/forgot"
			class="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-primary py-3.5 text-sm font-bold text-on-primary shadow-primary transition active:scale-[0.98]"
			in:fly={{ y: 16, duration: 420, delay: 80 }}
		>
			Request New Link
		</a>
	{:else}
		<form
			method="POST"
			use:enhance
			class="mt-8 space-y-5"
			in:fly={{ y: 16, duration: 420, delay: 80 }}
		>
			{#if form?.error}
				<p class="rounded-xl bg-error-container px-4 py-3 text-sm text-error">{form.error}</p>
			{/if}

			<div>
				<label for="password" class="mb-1.5 block text-sm font-semibold text-on-surface">
					New Password
				</label>
				<div class="relative">
					<Lock
						size={18}
						class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
					/>
					<input
						id="password"
						name="password"
						type="password"
						required
						minlength="8"
						autocomplete="new-password"
						placeholder="••••••••"
						class="w-full rounded-xl border border-outline-variant/60 bg-surface-container py-3.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
				</div>
			</div>

			<div>
				<label for="confirmPassword" class="mb-1.5 block text-sm font-semibold text-on-surface">
					Confirm New Password
				</label>
				<div class="relative">
					<Lock
						size={18}
						class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
					/>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						required
						minlength="8"
						autocomplete="new-password"
						placeholder="••••••••"
						class="w-full rounded-xl border border-outline-variant/60 bg-surface-container py-3.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
				</div>
			</div>

			<button
				type="submit"
				class="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-on-primary shadow-primary transition active:scale-[0.98]"
			>
				Reset Password
			</button>
		</form>
	{/if}

	<a
		href="/login"
		class="mt-8 inline-flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
	>
		<ArrowLeft size={16} />
		Back to Login
	</a>
</div>
