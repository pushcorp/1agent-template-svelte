# Complete remaining Auth TODO items

## Context

The core better-auth integration (schema, server auth, auth client, sign-in/sign-up pages, session resolution) was implemented in the previous session. Three Auth TODO items remain incomplete:

1. **Sign-out** — no sign-out UI or functionality exists
2. **Auth middleware (protect routes)** — `hooks.server.ts` resolves sessions but doesn't guard any routes
3. **`.env.example`** — missing; developers have no reference for required env vars

## Files to Create

| File | Purpose |
|---|---|
| `.env.example` | Template with `BETTER_AUTH_SECRET` and `DATABASE_URL` |

## Files to Modify

| File | Changes |
|---|---|
| `src/hooks.server.ts` | Add route protection pattern: redirect unauthenticated users away from protected routes |
| `src/routes/+layout.svelte` | Pass `user` to child pages via layout data |
| `src/routes/+layout.server.ts` | Expose `locals.user` to the client via layout load |
| `src/routes/+page.svelte` | Show sign-out button when authenticated, login/signup links when not |
| `TODO.md` | Check off completed Auth items |

## Implementation Steps

### 1. Create `.env.example`
```
BETTER_AUTH_SECRET=
DATABASE_URL=
```

### 2. Add route protection to `hooks.server.ts`
- Define a list of protected path prefixes (e.g., `/dashboard`, `/settings`, `/api/v1`)
- After session resolution, check if the path starts with a protected prefix
- If unauthenticated → redirect to `/login`
- Keep `/api/auth` unprotected (better-auth needs it)
- Keep public routes (`/`, `/login`, `/signup`) unprotected

```ts
const PROTECTED_PREFIXES = ["/dashboard", "/settings", "/api/v1"];

// after session resolution:
const isProtected = PROTECTED_PREFIXES.some((p) => event.url.pathname.startsWith(p));
if (isProtected && !event.locals.user) {
  redirect(302, "/login");
}
```

### 3. Add `+layout.server.ts` to expose user to client
- Return `user` from `locals` so all pages can access it via `data.user`

```ts
export const load: LayoutServerLoad = async ({ locals }) => {
  return { user: locals.user };
};
```

### 4. Update `+layout.svelte` to receive user data
- Accept `data` prop with user info

### 5. Update home page (`+page.svelte`) with auth-aware UI
- Show the user's name and a "Sign out" button when authenticated
- Show "Sign in" / "Sign up" links when not authenticated
- Sign out calls `authClient.signOut()` then `invalidateAll()` + toast

### 6. Update `TODO.md`
- Check off: `better-auth email and password`, `auth schema`, `sign-up / sign-in / sign-out pages`, `auth middleware`, `.env.example`

## Verification
1. `npm run check` — no type errors (except pre-existing DATABASE_URL)
2. Visit `/` — see login/signup links when logged out
3. Sign up → redirected to `/`, see name + sign-out button
4. Click sign out → session cleared, see login/signup links again
5. Visit `/dashboard` while logged out → redirected to `/login`
