<script lang="ts">
	import { goto } from "$app/navigation";
	import { authClient } from "$lib/auth-client";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { toast } from "svelte-sonner";

	let { mode }: { mode: "signin" | "signup" } = $props();

	let email = $state("");
	let password = $state("");
	let name = $state("");
	let loading = $state(false);

	const isSignUp = $derived(mode === "signup");
	const title = $derived(isSignUp ? "Create an account" : "Sign in");
	const buttonLabel = $derived(isSignUp ? "Sign up" : "Sign in");

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;

		if (isSignUp) {
			const { error } = await authClient.signUp.email({
				email,
				password,
				name,
			});
			if (error) {
				toast.error(error.message ?? "Sign up failed");
				loading = false;
				return;
			}
			toast.success("Account created");
			goto("/");
		} else {
			const { error } = await authClient.signIn.email({
				email,
				password,
			});
			if (error) {
				toast.error(error.message ?? "Sign in failed");
				loading = false;
				return;
			}
			toast.success("Signed in");
			goto("/");
		}
	}
</script>

<div class="flex min-h-svh items-center justify-center p-4">
	<Card.Root class="w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">{title}</Card.Title>
			<Card.Description>
				{#if isSignUp}
					Enter your details to create an account
				{:else}
					Enter your credentials to sign in
				{/if}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form onsubmit={handleSubmit} class="grid gap-4">
				{#if isSignUp}
					<div class="grid gap-2">
						<Label for="name">Name</Label>
						<Input
							id="name"
							type="text"
							placeholder="Your name"
							required
							bind:value={name}
						/>
					</div>
				{/if}
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						type="email"
						placeholder="mail@example.com"
						required
						bind:value={email}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						type="password"
						required
						bind:value={password}
					/>
				</div>
				<Button type="submit" class="w-full" disabled={loading}>
					{buttonLabel}
				</Button>
			</form>
		</Card.Content>
		<Card.Footer class="justify-center">
			{#if isSignUp}
				<p class="text-muted-foreground text-sm">
					Already have an account?
					<a href="/login" class="text-primary underline">Sign in</a>
				</p>
			{:else}
				<p class="text-muted-foreground text-sm">
					Don't have an account?
					<a href="/signup" class="text-primary underline">Sign up</a>
				</p>
			{/if}
		</Card.Footer>
	</Card.Root>
</div>
