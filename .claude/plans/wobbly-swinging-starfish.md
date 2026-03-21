# Lazy DB/Auth Initialization

## Context
`npm run preview` fails because `postgres(DATABASE_URL)` and `betterAuth()` are called at module load time. The `building` guard only helps during `vite build`. We need to defer initialization to first request so the server can start without PostgreSQL.

## Plan

### 1. `src/lib/server/db/client/index.ts`
- Replace exported `db` constant with `getDb()` function
- Cache the instance in a module-level variable (singleton pattern)
- `postgres()` only called on first `getDb()` invocation

### 2. `src/lib/server/auth.ts`
- Replace exported `auth` constant with `getAuth()` function
- Import `getDb` instead of `db`, call it inside `createAuth()`
- Cache the instance in a module-level variable
- Export `Auth` type for use in `app.d.ts`

### 3. Consumer updates (import `getAuth`/`getDb`, call inside handler/function body)
- `src/hooks.server.ts` — `getAuth().api.getSession(...)` inside handler
- `src/routes/api/auth/[...all]/+server.ts` — `getAuth().handler(...)`
- `src/lib/server/db/users/index.ts` — `getDb().select()...` inside function

### 4. `src/app.d.ts`
- Change type from `typeof auth.$Infer.Session` to `Auth["$Infer"]["Session"]`

## Verification
1. `npm run build` — passes
2. `npm run preview` (without DB) — server starts, requests fail gracefully at runtime
3. `npm run check` — no type errors
4. `npm run check:all` — Biome passes
