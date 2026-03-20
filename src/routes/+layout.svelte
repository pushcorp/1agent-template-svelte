<script lang="ts">
  import "../app.css";
  import "../styles.css";
  import { Toaster } from "svelte-sonner";
  import type { LayoutData } from "./$types";

  let { data, children }: { data: LayoutData; children: any } = $props();
</script>

{@render children()}

<Toaster position="top-center" richColors />
