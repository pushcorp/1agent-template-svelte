<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { invalidateAll } from "$app/navigation";
  import { authClient } from "$lib/auth-client";
  import { toast } from "svelte-sonner";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  async function signOut() {
    await authClient.signOut();
    await invalidateAll();
    toast.success("Signed out successfully");
  }
</script>

<svelte:head>
  <title>Home | Svelte 5 Template</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center">
  <div class="flex flex-col items-center gap-4">
    {#if data.user}
      <p class="text-lg">Welcome, {data.user.name}!</p>
      <Button onclick={signOut}>Sign out</Button>
    {:else}
      <p class="text-lg">Welcome to Svelte 5 Template</p>
      <div class="flex gap-2">
        <Button href="/login" variant="outline">Sign in</Button>
        <Button href="/signup">Sign up</Button>
      </div>
    {/if}
  </div>
</div>
