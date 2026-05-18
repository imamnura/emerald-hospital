<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Calendar,
		ChevronDown,
		Droplet,
		Image,
		Mail,
		MapPin,
		Pencil,
		Phone,
		Save,
		User
	} from '@lucide/svelte';
	import FormIconField from '$lib/components/forms/FormIconField.svelte';
	import MotionReveal from '$lib/components/motion/MotionReveal.svelte';
	import SearchPageHeader from '$lib/components/SearchPageHeader.svelte';

	let { data, form } = $props();

	let name = $state('');
	let phone = $state('');
	let imageUrl = $state('');
	let address = $state('');
	let dateOfBirth = $state('');
	let gender = $state<'female' | 'male' | 'other' | 'prefer_not'>('prefer_not');
	let bloodType = $state('');

	$effect.pre(() => {
		name = data.profile.name;
		phone = data.profile.phone ?? '';
		imageUrl = data.profile.imageUrl ?? '';
		address = data.profile.address ?? '';
		dateOfBirth = data.dateOfBirth;
		gender = data.gender;
		bloodType = data.profile.bloodType ?? '';
	});

	const initials = $derived(
		name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.slice(0, 2)
			.toUpperCase()
	);
</script>

<SearchPageHeader title="Personal Information" backHref="/profile" showProfile={false} />

<div class="-mt-1 mb-2 border-b border-outline-variant/30" aria-hidden="true"></div>

<MotionReveal delay={40}>
	<div class="flex flex-col items-center py-4">
		<div class="relative">
			{#if imageUrl}
				<img
					src={imageUrl}
					alt={name}
					class="h-28 w-28 rounded-full border-4 border-surface-container-lowest object-cover shadow-[var(--shadow-card)]"
				/>
			{:else}
				<div
					class="flex h-28 w-28 items-center justify-center rounded-full border-4 border-surface-container-lowest bg-primary/10 text-3xl font-bold text-primary shadow-[var(--shadow-card)]"
				>
					{initials}
				</div>
			{/if}
			<span
				class="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container-lowest bg-primary text-on-primary"
			>
				<Pencil size={14} strokeWidth={2.5} />
			</span>
		</div>
		<p class="mt-3 text-xs text-outline">Set your profile photo via the Image URL field below.</p>
	</div>
</MotionReveal>

<MotionReveal delay={90}>
	<form method="POST" action="?/update" use:enhance class="space-y-4 pb-6">
		{#if form?.error}
			<p class="rounded-xl bg-error-container px-4 py-3 text-sm text-error">{form.error}</p>
		{/if}
		{#if form?.success}
			<p class="rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">Profile updated successfully.</p>
		{/if}

		<FormIconField id="name" label="Full Name" name="name" bind:value={name} required>
			{#snippet icon()}
				<User size={18} strokeWidth={2} />
			{/snippet}
		</FormIconField>

		<FormIconField
			id="email"
			label="Email Address"
			value={data.profile.email}
			readonly
			disabled
		>
			{#snippet icon()}
				<Mail size={18} strokeWidth={2} />
			{/snippet}
		</FormIconField>

		<FormIconField id="phone" label="Phone Number" name="phone" bind:value={phone}>
			{#snippet icon()}
				<Phone size={18} strokeWidth={2} />
			{/snippet}
		</FormIconField>

		<FormIconField
			id="imageUrl"
			label="Profile Image URL"
			name="imageUrl"
			bind:value={imageUrl}
			placeholder="https://…"
		>
			{#snippet icon()}
				<Image size={18} strokeWidth={2} />
			{/snippet}
		</FormIconField>

		<FormIconField id="address" label="Address" name="address" bind:value={address}>
			{#snippet icon()}
				<MapPin size={18} strokeWidth={2} />
			{/snippet}
		</FormIconField>

		<div class="grid grid-cols-2 gap-3">
			<FormIconField
				id="dateOfBirth"
				label="Date of Birth"
				name="dateOfBirth"
				bind:value={dateOfBirth}
				placeholder="MM/DD/YYYY"
			>
				{#snippet icon()}
					<Calendar size={18} strokeWidth={2} />
				{/snippet}
				{#snippet trailing()}
					<Calendar size={18} strokeWidth={2} />
				{/snippet}
			</FormIconField>

			<div>
				<label for="gender" class="mb-1.5 block text-sm font-semibold text-on-surface-variant">
					Gender
				</label>
				<div class="relative">
					<select
						id="gender"
						name="gender"
						bind:value={gender}
						class="w-full appearance-none rounded-xl border border-outline-variant/60 bg-surface-container-lowest py-3 pl-4 pr-10 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					>
						<option value="female">Female</option>
						<option value="male">Male</option>
						<option value="other">Other</option>
						<option value="prefer_not">Prefer not to say</option>
					</select>
					<ChevronDown
						size={18}
						class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline"
					/>
				</div>
			</div>
		</div>

		<div>
			<label for="bloodType" class="mb-1.5 block text-sm font-semibold text-on-surface-variant">
				Blood Type
			</label>
			<div class="relative">
				<span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
					<Droplet size={18} strokeWidth={2} />
				</span>
				<select
					id="bloodType"
					name="bloodType"
					bind:value={bloodType}
					class="w-full appearance-none rounded-xl border border-outline-variant/60 bg-surface-container-lowest py-3 pl-10 pr-10 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				>
					<option value="">Unknown</option>
					<option value="A+">A+</option>
					<option value="A-">A-</option>
					<option value="B+">B+</option>
					<option value="B-">B-</option>
					<option value="AB+">AB+</option>
					<option value="AB-">AB-</option>
					<option value="O+">O+</option>
					<option value="O-">O-</option>
				</select>
				<ChevronDown
					size={18}
					class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline"
				/>
			</div>
		</div>

		<button
			type="submit"
			class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-on-primary shadow-primary active:scale-[0.98]"
		>
			<Save size={18} strokeWidth={2.25} />
			Save Changes
		</button>
	</form>
</MotionReveal>
