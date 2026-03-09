<script lang="ts">
	import '../app.css';
	import "../styles.css";
	import { Toaster } from "svelte-sonner";

	let { children } = $props();
</script>

{@render children()}
<Toaster />
