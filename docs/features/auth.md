# Authentication

This project uses [better-auth](https://www.better-auth.com/) for email/password authentication with SvelteKit.

## Architecture

```
src/
├── lib/
│   ├── auth-client.ts              # Client-side auth (browser)
│   ├── server/auth.ts              # Server-side auth config
│   ├── components/auth.svelte      # Shared sign-in / sign-up form
│   └── db/schema.ts                # Auth tables (user, session, account, verification)
├── hooks.server.ts                 # Session resolution + route protection
├── routes/
│   ├── login/+page.svelte          # Sign-in page
│   ├── signup/+page.svelte         # Sign-up page
│   └── api/auth/[...all]/+server.ts  # better-auth API handler
```

## How It Works

### Session Resolution (`hooks.server.ts`)

Every request passes through `hooks.server.ts`, which resolves the session from cookies and populates `event.locals`:

```ts
const session = await auth.api.getSession({
  headers: event.request.headers,
});

event.locals.user = session?.user ?? null;
event.locals.session = session?.session ?? null;
```

### Route Protection

Protected routes are defined by path prefix. Unauthenticated users are redirected to `/login`:

```ts
const PROTECTED_PREFIXES = ["/app", "/api/v1"];

const isProtected = PROTECTED_PREFIXES.some((p) =>
  event.url.pathname.startsWith(p),
);
if (isProtected && !event.locals.user) {
  redirect(302, "/login");
}
```

To protect a new route, add its prefix to `PROTECTED_PREFIXES`.

### Accessing the User

The root `+layout.server.ts` exposes `locals.user` to all pages:

```ts
export const load: LayoutServerLoad = async ({ locals }) => {
  return { user: locals.user };
};
```

In any page, access the user via `data.user`:

```svelte
<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

{#if data.user}
  <p>Hello, {data.user.name}!</p>
{/if}
```

In server load functions, access it directly from `locals`:

```ts
export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user; // typed via app.d.ts
};
```

## Auth Client

`$lib/auth-client.ts` provides the client-side auth API for sign-in, sign-up, and sign-out:

```ts
import { authClient } from "$lib/auth-client";

// Sign up
await authClient.signUp.email({ email, password, name });

// Sign in
await authClient.signIn.email({ email, password });

// Sign out
await authClient.signOut();
```

After sign-out, call `invalidateAll()` to refresh server data:

```ts
import { invalidateAll } from "$app/navigation";

await authClient.signOut();
await invalidateAll();
```

## Auth Pages

Both `/login` and `/signup` use the shared `Auth` component (`$lib/components/auth.svelte`):

```svelte
<Auth mode="signin" />
<Auth mode="signup" />
```

These pages redirect authenticated users to `/` via their `+page.server.ts` load functions.

## Database Tables

Auth uses four tables defined in `src/lib/db/schema.ts`:

| Table | Purpose |
|---|---|
| `users` | User accounts (email, name, role, profile) |
| `sessions` | Active sessions with token and expiry |
| `accounts` | Auth provider accounts (email/password credentials) |
| `verifications` | Email verification tokens |

All IDs use UUIDv7 for time-sortable ordering.

## Environment Variables

| Variable | Description |
|---|---|
| `BETTER_AUTH_SECRET` | Secret key for signing sessions |
| `DATABASE_URL` | PostgreSQL connection string |

## Adding a New Protected Route

All routes under `src/routes/app/` are automatically protected. Simply create your page there:

1. Create your route (e.g., `src/routes/app/dashboard/+page.svelte`)
2. Access `data.user` in the page — it's guaranteed to exist on protected routes

If you need to protect a route outside of `/app`, add its prefix to `PROTECTED_PREFIXES` in `hooks.server.ts`.
