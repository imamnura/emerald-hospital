<script lang="ts">
	import FormAlert from '#lib/components/ui/FormAlert.svelte';
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import AuthBadge from '#lib/components/auth/AuthBadge.svelte';
	import GoogleAuthButton from '#lib/components/auth/GoogleAuthButton.svelte';

	let { data, form } = $props();

	const googleHref = $derived(
		data.redirectTo
			? `/login/google?redirect=${encodeURIComponent(data.redirectTo)}`
			: '/login/google'
	);
</script>

<div class="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-surface px-6 py-10">
	<div class="text-center" in:fly={{ y: 12, duration: 400 }}>
		<AuthBadge variant="logo" />
		<h1 class="mt-6 font-heading text-2xl font-bold text-on-surface">Purwakarta Health</h1>
		<p class="mt-2 text-sm text-on-surface-variant">Welcome back. Please enter your details.</p>
	</div>

	<form
		method="POST"
		use:enhance
		class="mt-8 space-y-5"
		in:fly={{ y: 16, duration: 420, delay: 80 }}
	>
		{#if data.redirectTo}
			<input type="hidden" name="redirect" value={data.redirectTo} />
		{/if}

		{#if form?.error}
			<FormAlert message={form.error} />
		{:else if data.errorMsg}
			<FormAlert message={data.errorMsg} />
		{:else if data.resetSuccess}
			<p class="rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
				Your password has been reset. Please sign in with your new password.
			</p>
		{/if}

		<div>
			<label for="email" class="mb-1.5 block text-sm font-semibold text-on-surface">Email</label>
			<input
				id="email"
				name="email"
				type="email"
				required
				autocomplete="email"
				placeholder="Enter your email"
				class="w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</div>

		<div>
			<div class="mb-1.5 flex items-center justify-between gap-2">
				<label for="password" class="text-sm font-semibold text-on-surface">Password</label>
				<a href="/login/forgot" class="text-sm font-medium text-primary">Forgot Password?</a>
			</div>
			<input
				id="password"
				name="password"
				type="password"
				required
				autocomplete="current-password"
				placeholder="••••••••"
				class="w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</div>

		<button
			type="submit"
			class="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-on-primary shadow-primary transition active:scale-[0.98]"
		>
			Sign In
		</button>
	</form>

	<div class="mt-6 flex items-center gap-3" in:fly={{ y: 12, duration: 380, delay: 160 }}>
		<div class="h-px flex-1 bg-outline-variant/50"></div>
		<span class="text-xs font-medium text-outline">OR</span>
		<div class="h-px flex-1 bg-outline-variant/50"></div>
	</div>

	<GoogleAuthButton
		href={googleHref}
		enabled={data.googleEnabled}
		label="Sign in with Google"
		class="mt-6"
		enabledClass="shadow-[var(--shadow-card)]"
		animateIn
	/>

	<p class="mt-8 text-center text-sm text-on-surface-variant">
		Don't have an account?
		<a href="/register" class="font-bold text-primary">Register</a>
	</p>
</div>
