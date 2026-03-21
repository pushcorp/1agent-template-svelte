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
  <title>1Agent template</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center">
  <div class="flex flex-col items-center gap-4">
    {#if data.user}
      <p class="text-lg">Welcome, {data.user.name}!</p>
      <Button onclick={signOut}>Sign out</Button>
    {:else}
      <p class="text-lg">Welcome to 1Agent</p>
      <p class="py-4">あなたが作りたいものをメッセージで送信してください。</p>
    {/if}
  </div>
</div>
