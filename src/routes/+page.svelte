<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Rocket } from "@lucide/svelte";
  import { toast } from "svelte-sonner";

  function showToast() {
    toast("Normal!");
    toast.success("Success!");
    toast.error("Error!");
    toast.message("Title", {
      description: "You can write description like this!",
    });
    console.log("Toast shown")
  }
</script>

<svelte:head>
  <title>Home | Svelte 5 Template</title>
</svelte:head>

<Button onclick={showToast}><Rocket />Show toast</Button>
