<script lang="ts">
	import "../app.css";
	import favicon from "#lib/assets/favicon.svg";
	import Toaster from "#lib/components/Toaster.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href={favicon} />
	<title>Purwakarta Health</title>
</svelte:head>

{@render children()}

<Toaster />
