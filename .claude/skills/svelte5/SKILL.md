---
name: sveltekit-best-practices
description: Svelte 5 runes, SvelteKit load functions, form actions. Prevents AI agents from generating Svelte 4 patterns.
metadata:
  tags: sveltekit, svelte, runes, best-practices
---

## Purpose
AI agents default to Svelte 4 patterns. This enforces Svelte 5 runes and SvelteKit conventions.

## Svelte 5 Runes (Never Use Svelte 4 Syntax)

| Svelte 4 ❌ | Svelte 5 ✅ |
|---|---|
| `let count = writable(0)` / `$count` | `let count = $state(0)` |
| `$: doubled = count * 2` | `let doubled = $derived(count * 2)` |
| `$: if (count > 5) ...` | `$effect(() => { if (count > 5) ... })` |
| `export let title = 'Default'` | `let { title = 'Default' } = $props()` |
| `<slot name="header" />` | `let { header } = $props()` / `{@render header()}` |

For two-way binding props: `let { value = $bindable() } = $props()`

## SvelteKit Data & Mutations

**Data fetching → `+page.server.ts` load, not `onMount` fetch**
```ts
// +page.server.ts
export const load: PageServerLoad = async ({ fetch }) => ({
  user: await fetch('/api/user').then(r => r.json())
});
```
```svelte
<script>
  let { data } = $props(); // data.user is available, SSR-ready
</script>
```

**Form mutations → form actions, not fetch in `on:submit`**
```ts
// +page.server.ts
export const actions = {
  default: async ({ request }) => { /* handle */ }
};
```
```svelte
<form method="POST" use:enhance>
```

**Shared data → `+layout.server.ts`** (runs once, available to all child pages)

**Auth/redirects → `hooks.server.ts`** with `handle`

**Error pages → `+error.svelte`** (not try/catch on every page)

**`+page.ts`** for universal load (server + client); **`+page.server.ts`** for server-only

## Anti-Patterns
- No `writable` / `derived` / `get` from `svelte/store`
- No `$:` for derivations or side effects
- No `export let` for props
- No `onMount` fetch for SSR data
- No `+server.ts` API routes just for form POSTs
- No `bind:value` on props without `$bindable()`
