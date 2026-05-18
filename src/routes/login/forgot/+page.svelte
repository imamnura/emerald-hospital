<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { ArrowLeft, Mail } from '@lucide/svelte';
	import AuthForgotIcon from '$lib/components/auth/AuthForgotIcon.svelte';

	let { form } = $props();

	const sent = $derived(form?.success === true);
</script>

<div class="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-surface px-6 py-10">
	<div class="text-center" in:fly={{ y: 12, duration: 400 }}>
		<AuthForgotIcon />
		<h1 class="mt-6 font-heading text-2xl font-bold text-on-surface">Forgot Password</h1>
		<p class="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-on-surface-variant">
			{#if sent}
				If an account exists for <span class="font-semibold text-on-surface">{form?.email}</span>,
				we've sent a password reset link. Please check your inbox.
			{:else}
				Enter your email address and we'll send you a link to reset your password.
			{/if}
		</p>
	</div>

	{#if !sent}
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
				<label for="email" class="mb-1.5 block text-sm font-semibold text-on-surface">
					Email Address
				</label>
				<div class="relative">
					<Mail
						size={18}
						class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
					/>
					<input
						id="email"
						name="email"
						type="email"
						required
						autocomplete="email"
						placeholder="name@example.com"
						class="w-full rounded-xl border border-outline-variant/60 bg-surface-container py-3.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
				</div>
			</div>

			<button
				type="submit"
				class="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-on-primary shadow-primary transition active:scale-[0.98]"
			>
				Send Reset Link
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
