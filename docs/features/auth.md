# Authentication

This project uses [better-auth](https://www.better-auth.com/) (v1.5.5+) for email/password authentication with SvelteKit, PostgreSQL (via Drizzle ORM), and UUIDv7 primary keys.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [File Map](#file-map)
- [Server-Side Auth Configuration](#server-side-auth-configuration)
- [Client-Side Auth](#client-side-auth)
- [Session Resolution (hooks.server.ts)](#session-resolution)
- [Route Protection](#route-protection)
- [Accessing the User](#accessing-the-user)
- [Auth Pages & UI Component](#auth-pages--ui-component)
- [API Route Handler](#api-route-handler)
- [Database Schema](#database-schema)
- [User Queries](#user-queries)
- [IP Address Tracking](#ip-address-tracking)
- [Auth Flows](#auth-flows)
- [Security Model](#security-model)
- [Environment Variables](#environment-variables)
- [How-To Guides](#how-to-guides)

---

## Architecture Overview

```
Browser                          Server (SvelteKit)                    Database (PostgreSQL)
┌──────────────────┐     ┌────────────────────────────────────┐     ┌─────────────────────┐
│                  │     │                                    │     │                     │
│  auth-client.ts  │────▶│  /api/auth/[...all]/+server.ts    │────▶│  users              │
│  (better-auth    │     │  (catch-all → better-auth handler) │     │  sessions           │
│   svelte client) │     │                                    │     │  accounts           │
│                  │     │  hooks.server.ts                   │     │  verifications      │
│  Auth component  │     │  (session resolution per request)  │     │                     │
│  (auth.svelte)   │     │                                    │     └─────────────────────┘
│                  │     │  server/auth.ts                    │
│  Pages           │     │  (betterAuth instance + config)    │
│                  │     │                                    │
└──────────────────┘     └────────────────────────────────────┘
```

**Request lifecycle:**

1. Browser sends a request (with session cookie)
2. `hooks.server.ts` intercepts every request, calls `getAuth().api.getSession()` to resolve user/session from the cookie
3. `event.locals.user` and `event.locals.session` are populated (or set to `null`)
4. If the route is protected and user is `null`, redirect to `/login`
5. The request proceeds to the route handler / page load function

---

## File Map

| File | Purpose |
|---|---|
| `src/lib/server/auth.ts` | Server-side better-auth instance (config, DB adapter, additional fields) |
| `src/lib/auth-client.ts` | Client-side auth API (signIn, signUp, signOut) |
| `src/hooks.server.ts` | Session resolution on every request + route protection |
| `src/app.d.ts` | TypeScript types for `event.locals.user` and `event.locals.session` |
| `src/lib/db/schema.ts` | Drizzle ORM schema (users, sessions, accounts, verifications) |
| `src/lib/server/db/client/index.ts` | Singleton PostgreSQL/Drizzle connection |
| `src/lib/server/db/users/index.ts` | User query helpers (e.g., `fetchUserById`) |
| `src/lib/server/utils.ts` | `getRequestIp()` utility for IP extraction |
| `src/lib/components/auth.svelte` | Shared sign-in / sign-up form component |
| `src/routes/login/+page.svelte` | Sign-in page |
| `src/routes/login/+page.server.ts` | Redirect authenticated users away from login |
| `src/routes/signup/+page.svelte` | Sign-up page |
| `src/routes/signup/+page.server.ts` | Redirect authenticated users away from signup |
| `src/routes/api/auth/[...all]/+server.ts` | Catch-all route delegating to better-auth handler |
| `src/routes/+layout.server.ts` | Exposes `locals.user` to all pages via layout data |

---

## Server-Side Auth Configuration

**File:** `src/lib/server/auth.ts`

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "$lib/server/db/client";
import * as schema from "$lib/db/schema";
import { uuidv7 } from "uuidv7";

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      database: {
        generateId: () => uuidv7(),
      },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "member",
          input: false,       // Cannot be set by the client
        },
        profile: {
          type: "string",
          defaultValue: "{}",
          input: false,
        },
        isActive: {
          type: "boolean",
          defaultValue: true,
          input: false,
        },
      },
    },
  });
}
```

Key details:

- **Database adapter:** Drizzle with PostgreSQL (`provider: "pg"`), using the four auth tables defined in `schema.ts`.
- **ID generation:** All IDs (users, sessions, etc.) use UUIDv7 for time-sortable ordering.
- **Email/password:** Enabled. better-auth handles password hashing (bcrypt) and stores the hash in the `accounts` table.
- **Additional user fields:** Three server-only fields (`input: false` prevents clients from setting them during signup):
  - `role` — `"admin"` or `"member"` (default: `"member"`)
  - `profile` — JSONB blob for extensible user metadata (default: `"{}"`)
  - `isActive` — soft-delete / deactivation flag (default: `true`)
- **Singleton pattern:** `getAuth()` lazily creates a single instance and reuses it across requests.
- **Type export:** `Auth` type is exported for use in `app.d.ts` to type `locals.user` and `locals.session`.

---

## Client-Side Auth

**File:** `src/lib/auth-client.ts`

```ts
import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient();
```

This creates a Svelte-aware better-auth client that automatically targets `/api/auth/*` endpoints on the same origin. It provides:

- `authClient.signUp.email({ email, password, name })` — create a new account
- `authClient.signIn.email({ email, password })` — authenticate with credentials
- `authClient.signOut()` — end the current session

The client handles cookie management automatically. After sign-out, call `invalidateAll()` from `$app/navigation` to refresh all server-loaded data:

```ts
import { invalidateAll } from "$app/navigation";

await authClient.signOut();
await invalidateAll();
```

---

## Session Resolution

**File:** `src/hooks.server.ts`

```ts
import { type Handle, redirect } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { getAuth } from "$lib/server/auth";

const PROTECTED_PREFIXES = ["/app", "/api/v1"];

export const handle: Handle = async ({ event, resolve }) => {
  if (env.DATABASE_URL) {
    const session = await getAuth().api.getSession({
      headers: event.request.headers,
    });

    event.locals.user = session?.user ?? null;
    event.locals.session = session?.session ?? null;
  } else {
    event.locals.user = null;
    event.locals.session = null;
  }

  const isProtected = PROTECTED_PREFIXES.some((p) =>
    event.url.pathname.startsWith(p),
  );
  if (isProtected && !event.locals.user) {
    redirect(302, "/login");
  }

  return resolve(event);
};
```

How it works:

1. **DATABASE_URL guard:** If `DATABASE_URL` is not set (e.g., during static builds or local development without a DB), session resolution is skipped and `locals.user`/`locals.session` are set to `null`.
2. **Session from cookies:** `getAuth().api.getSession()` reads the session token from the request cookies, validates it against the `sessions` table, and returns the associated user and session objects.
3. **Locals population:** The resolved `user` and `session` are placed on `event.locals`, making them available to all downstream load functions, actions, and API routes.

---

## Route Protection

Protected routes are defined by URL path prefix in `hooks.server.ts`:

```ts
const PROTECTED_PREFIXES = ["/app", "/api/v1"];
```

- Any request to a URL starting with `/app` or `/api/v1` requires an authenticated session.
- Unauthenticated requests to protected routes receive a **302 redirect to `/login`**.
- All other routes (including `/`, `/login`, `/signup`, `/api/auth/*`) are public.

**To protect a new route group**, add its prefix to the `PROTECTED_PREFIXES` array.

---

## Accessing the User

### In pages (via layout data)

The root layout (`src/routes/+layout.server.ts`) exposes the user to all pages:

```ts
export const load: LayoutServerLoad = async ({ locals }) => {
  return { user: locals.user };
};
```

In any Svelte page or component:

```svelte
<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

{#if data.user}
  <p>Hello, {data.user.name}!</p>
  <p>Role: {data.user.role}</p>
  <p>Email: {data.user.email}</p>
{/if}
```

### In server load functions

```ts
export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;   // typed via app.d.ts
  const session = locals.session;
};
```

### In API routes

```ts
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  // locals.user is available here
};
```

### TypeScript types

**File:** `src/app.d.ts`

```ts
import type { Auth } from "$lib/server/auth";

declare global {
  namespace App {
    interface Locals {
      user: Auth["$Infer"]["Session"]["user"] | null;
      session: Auth["$Infer"]["Session"]["session"] | null;
    }
  }
}
```

The `Auth["$Infer"]["Session"]` type is inferred directly from the better-auth configuration, including the additional fields (`role`, `profile`, `isActive`). This means `locals.user` is fully typed with:

- `id`, `email`, `emailVerified`, `name`, `image` (standard better-auth fields)
- `role`, `profile`, `isActive` (custom additional fields)
- `createdAt`, `updatedAt`

---

## Auth Pages & UI Component

### Shared Auth component

**File:** `src/lib/components/auth.svelte`

A single component handles both sign-in and sign-up via a `mode` prop:

```svelte
<Auth mode="signin" />
<Auth mode="signup" />
```

Features:

- **Mode-based rendering:** Shows a `name` field only in signup mode.
- **Svelte 5 runes:** Uses `$state` for form fields, `$derived` for computed values.
- **Client-side auth calls:** Uses `authClient.signUp.email()` or `authClient.signIn.email()`.
- **Error handling:** Displays errors via `toast.error()` (svelte-sonner).
- **Success redirect:** Navigates to `/` on successful auth via `goto("/")`.
- **Loading state:** Disables the submit button while the request is in flight.
- **Navigation links:** Links between `/login` and `/signup` in the footer.
- **UI:** Built with shadcn-svelte Card, Input, Label, and Button components.

### Login page

**File:** `src/routes/login/+page.svelte`

```svelte
<script lang="ts">
  import Auth from "$lib/components/auth.svelte";
</script>

<Auth mode="signin" />
```

**File:** `src/routes/login/+page.server.ts` — Redirects already-authenticated users to `/`:

```ts
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    redirect(302, "/");
  }
};
```

### Signup page

**File:** `src/routes/signup/+page.svelte`

```svelte
<script lang="ts">
  import Auth from "$lib/components/auth.svelte";
</script>

<Auth mode="signup" />
```

**File:** `src/routes/signup/+page.server.ts` — Same redirect logic as login.

---

## API Route Handler

**File:** `src/routes/api/auth/[...all]/+server.ts`

```ts
import { getAuth } from "$lib/server/auth";
import type { RequestHandler } from "./$types";

const handler: RequestHandler = async (event) => {
  return getAuth().handler(event.request);
};

export const GET = handler;
export const POST = handler;
```

This is a SvelteKit catch-all route that delegates all `/api/auth/*` requests to better-auth's built-in handler. better-auth manages the following endpoints internally:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/sign-up/email` | POST | Create account with email/password |
| `/api/auth/sign-in/email` | POST | Authenticate with email/password |
| `/api/auth/sign-out` | POST | End the current session |
| `/api/auth/get-session` | GET | Get the current session |
| `/api/auth/csrf-token` | GET | Get a CSRF token |

---

## Database Schema

**File:** `src/lib/db/schema.ts`

All tables use UUIDv7 primary keys (time-sortable) and `snake_case` SQL column names mapped to `camelCase` TypeScript fields.

### `users` table

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, default UUIDv7 | Time-sortable unique identifier |
| `email` | `varchar(255)` | NOT NULL, UNIQUE | User's email address |
| `email_verified` | `boolean` | NOT NULL, default `false` | Email verification status |
| `name` | `varchar(120)` | NOT NULL | Display name |
| `role` | `user_role` enum | NOT NULL, default `'member'` | `'admin'` or `'member'` |
| `image` | `text` | nullable | Profile image URL |
| `profile` | `jsonb` | NOT NULL, default `'{}'` | Extensible metadata blob |
| `is_active` | `boolean` | NOT NULL, default `true` | Soft-delete / deactivation flag |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last update timestamp |

**Indexes:** Unique index on `email`.

### `sessions` table

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, default UUIDv7 | Session identifier |
| `user_id` | `uuid` | NOT NULL, FK → `users.id` (CASCADE) | Owning user |
| `token` | `text` | NOT NULL, UNIQUE | Session token (stored in cookie) |
| `expires_at` | `timestamptz` | NOT NULL | Session expiration |
| `ip_address` | `text` | nullable | Client IP at session creation |
| `user_agent` | `text` | nullable | Client user agent |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last update timestamp |

**Indexes:** Unique index on `token`, index on `user_id`.

### `accounts` table

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `text` | PK | Account identifier |
| `user_id` | `uuid` | NOT NULL, FK → `users.id` (CASCADE) | Owning user |
| `account_id` | `text` | NOT NULL | Provider-specific account ID |
| `provider_id` | `text` | NOT NULL | Auth provider (e.g., `"credential"`) |
| `access_token` | `text` | nullable | OAuth access token |
| `refresh_token` | `text` | nullable | OAuth refresh token |
| `access_token_expires_at` | `timestamptz` | nullable | Access token expiry |
| `refresh_token_expires_at` | `timestamptz` | nullable | Refresh token expiry |
| `scope` | `text` | nullable | OAuth scopes |
| `id_token` | `text` | nullable | OIDC ID token |
| `password` | `text` | nullable | Hashed password (for email/password provider) |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last update timestamp |

**Indexes:** Index on `user_id`.

### `verifications` table

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `text` | PK | Verification identifier |
| `identifier` | `text` | NOT NULL | Email or phone being verified |
| `value` | `text` | NOT NULL | Verification code/token |
| `expires_at` | `timestamptz` | NOT NULL | Token expiration |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last update timestamp |

**Indexes:** Index on `identifier`.

### Relations (Drizzle ORM)

```
User ──┬── has many ──▶ Sessions
       └── has many ──▶ Accounts
```

- Deleting a user **cascades** to their sessions and accounts.

---

## User Queries

**File:** `src/lib/server/db/users/index.ts`

```ts
import { eq } from "drizzle-orm";
import { user } from "$lib/db/schema";
import { getDb } from "$lib/server/db/client";

export async function fetchUserById(userId: string) {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    throw new Error("Invalid user ID.");
  }

  const [row] = await getDb()
    .select()
    .from(user)
    .where(eq(user.id, normalizedUserId))
    .limit(1);

  return row ?? null;
}
```

Use this when you need to fetch a full user record from the database (e.g., when `locals.user` doesn't have enough data, or in background jobs).

---

## IP Address Tracking

**File:** `src/lib/server/utils.ts`

```ts
export function getRequestIp(request: Request): string {
  // Priority: Cloudflare > X-Forwarded-For > X-Real-IP > "unknown"
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp;

  return "unknown";
}
```

better-auth records the client's IP address and user agent in the `sessions` table automatically. This utility is available for additional IP-based logic (rate limiting, audit logging, etc.).

---

## Auth Flows

### Sign-Up Flow

```
1. User fills the signup form (name, email, password)
2. Auth component calls authClient.signUp.email({ email, password, name })
3. better-auth client sends POST /api/auth/sign-up/email
4. better-auth server:
   a. Validates input
   b. Hashes the password (bcrypt)
   c. Creates a row in `users` table (with UUIDv7 ID, role="member", isActive=true)
   d. Creates a row in `accounts` table (providerId="credential", password=hash)
   e. Creates a row in `sessions` table (with token, expiry, IP, user agent)
   f. Sets an HTTP-only session cookie
5. Client receives success response
6. Auth component calls goto("/") to redirect to home
```

### Sign-In Flow

```
1. User fills the signin form (email, password)
2. Auth component calls authClient.signIn.email({ email, password })
3. better-auth client sends POST /api/auth/sign-in/email
4. better-auth server:
   a. Looks up the account by email + provider
   b. Verifies the password against the stored hash
   c. Creates a new session in the `sessions` table
   d. Sets an HTTP-only session cookie
5. Client receives success response
6. Auth component calls goto("/") to redirect to home
```

### Sign-Out Flow

```
1. User clicks the "Sign out" button
2. Page calls authClient.signOut()
3. better-auth client sends POST /api/auth/sign-out
4. better-auth server:
   a. Invalidates the session in the `sessions` table
   b. Clears the session cookie
5. Page calls invalidateAll() to refresh all server-loaded data
6. Toast notification: "Signed out successfully"
```

### Session Validation (every request)

```
1. Request arrives with session cookie
2. hooks.server.ts calls getAuth().api.getSession({ headers })
3. better-auth:
   a. Reads the session token from the cookie
   b. Looks up the token in the `sessions` table
   c. Checks expiration
   d. Joins with the `users` table to get user data
   e. Returns { user, session } or null
4. hooks.server.ts populates event.locals.user and event.locals.session
5. Request proceeds to route handler
```

---

## Security Model

| Feature | Implementation |
|---|---|
| **Password hashing** | better-auth uses bcrypt internally; hashes stored in `accounts.password` |
| **Session tokens** | Cryptographically random tokens stored in `sessions.token` |
| **HTTP-only cookies** | Session cookie is HTTP-only (not accessible via JavaScript) |
| **Session expiration** | `sessions.expires_at` timestamp; expired sessions are rejected |
| **CSRF protection** | better-auth provides built-in CSRF token validation |
| **IP/UA tracking** | Client IP and user agent recorded per session for security auditing |
| **Server-only fields** | `role`, `profile`, `isActive` have `input: false` — clients cannot set them |
| **Email uniqueness** | Unique constraint on `users.email` prevents duplicate accounts |
| **Cascade delete** | Deleting a user automatically deletes their sessions and accounts |
| **Graceful DB absence** | If `DATABASE_URL` is unset, auth is skipped (user/session = `null`) |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `BETTER_AUTH_SECRET` | Yes (production) | Secret key for signing session cookies. Must be a strong random string. |
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/dbname`) |

---

## How-To Guides

### Add a new protected route

All routes under `/app/` are automatically protected. Just create your page:

```
src/routes/app/dashboard/+page.svelte
```

`data.user` is guaranteed to be non-null on any protected route.

To protect a route outside of `/app`, add its prefix to `PROTECTED_PREFIXES` in `hooks.server.ts`:

```ts
const PROTECTED_PREFIXES = ["/app", "/api/v1", "/admin"];
```

### Access user data in a protected page

```svelte
<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  // data.user is guaranteed non-null on protected routes
  const user = data.user!;
</script>

<h1>Welcome, {user.name}</h1>
<p>Role: {user.role}</p>
```

### Access user data in a server load function

```ts
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user!;  // non-null on protected routes

  // Fetch user-specific data
  const items = await getItemsByUserId(user.id);
  return { items };
};
```

### Access user data in an API route

```ts
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
  // /api/v1/* routes are protected — locals.user is guaranteed
  const user = locals.user!;

  return Response.json({ userId: user.id, role: user.role });
};
```

### Add a new user field

1. Add the column to the `user` table in `src/lib/db/schema.ts`:

```ts
export const user = pgTable("users", {
  // ... existing columns
  bio: text("bio"),
});
```

2. Register the field in better-auth config (`src/lib/server/auth.ts`):

```ts
user: {
  additionalFields: {
    // ... existing fields
    bio: {
      type: "string",
      defaultValue: "",
      input: false,  // set to true if clients can set this during signup
    },
  },
},
```

3. Generate and run a migration:

```bash
npm run db:generate
npm run db:migrate
```

### Add an OAuth provider

better-auth supports many social login providers. Example for adding Google:

1. Update `src/lib/server/auth.ts`:

```ts
import { betterAuth } from "better-auth";

function createAuth() {
  return betterAuth({
    // ... existing config
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
  });
}
```

2. Use in the client:

```ts
await authClient.signIn.social({ provider: "google" });
```

The `accounts` table already supports OAuth fields (`accessToken`, `refreshToken`, `scope`, `idToken`).
