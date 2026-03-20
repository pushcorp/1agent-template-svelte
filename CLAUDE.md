# Project

- Brief: This is the `1agent` template project, built from a Svelte 5 / SvelteKit. `1agent` is the vibe-coding platform.
- Goal: This aims the best vibe-coding template. Landing pages, forms, internal tools, SaaS, or any web apps.
- Tech stack: It uses TypeScript, Tailwind CSS, Shadcn UI (shadcn-svelte), Lucide Icons (@lucide/svelte), and Svelte Sonner (svelte-sonner) for basic experience.

## Packages Guide

- How to use Shadcn UI (shadcn-svelte): `docs/packages/shadcn-svelte.md`
- How to use Lucide Icons (@lucide/svelte): `docs/packages/lucide-svelte.md`
- How to use Svelte Sonner: `docs/packages/svelte-sonner.md`

## Prohibited

- Do NOT read/write/edit: .env, .env.*

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Vite) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run start` | Run production server (`node build/index.js`) |
| `npm run check` | Svelte type check |
| `npm run check:watch` | Svelte type check (watch mode) |
| `npm run format` | Format with Biome |
| `npm run format:check` | Check formatting |
| `npm run lint` | Lint with Biome |
| `npm run lint:fix` | Lint and auto-fix |
| `npm run check:all` | Biome full check (format + lint) |
| `npm run check:all:fix` | Biome full check with auto-fix |

## Database

- uses PostgreSQL via Drizzle ORM
- Schema: `src/lib/db/schema.ts`

## Packages

- How to use Shadcn UI (shadcn-svelte): `docs/packages/shadcn-svelte.md`
- How to use Lucide Icons (@lucide/svelte): `docs/packages/lucide-svelte.md`
- How to use Svelte Sonner: `docs/packages/svelte-sonner.md`

## Project Structure

```
src/
├── app.html                          # HTML template (lang="ja")
├── app.css                           # Tailwind CSS theme (oklch colors, dark mode)
├── app.d.ts                          # Global TypeScript types
├── routes/                           # SvelteKit routes
│   ├── +layout.svelte                # Root layout (Toaster)
│   ├── +layout.ts                    # Page options (ssr, csr, prerender)
│   ├── +page.svelte                  # Home page
│   ├── +error.svelte                 # Error page
│   ├── [feature]/                    # Feature routes
│   │   ├── +page.svelte
│   │   └── +page.server.ts           # Server-side data loading
│   └── api/v1/                       # API routes
│       └── [resource]/+server.ts
└── lib/
    ├── components/ui/                # Shadcn UI components
    ├── constants/index.ts            # App-wide constants
    ├── db/schema.ts                  # Drizzle ORM schema
    ├── server/db/                    # Server-only DB client & queries
    ├── types/index.ts                # Shared type definitions
    ├── utils/main.ts                 # Utility functions
    └── utils.ts                      # Shadcn cn() helper, component type utilities
```

# Coding Style Guide

## General Principles

- Use Svelte 5 runes (`$props`, `$state`, `$derived`, `$effect`). Never use Svelte 4 patterns.
- Format with Biome
- Keep components small and focused. Extract reusable logic into `$lib`.
- Server-only code goes in `$lib/server/`. SvelteKit enforces this boundary.
- Remove unused/dead code.
- Use plan mode by default unless the tasks is small, simple one.

## Naming

- **Files:** kebab-case (`user-profile.svelte`, `schema.ts`)
- **Components:** PascalCase exports (`Button`, `Input`)
- **Variables / functions:** camelCase (`userId`, `parse`)
- **Constants:** SCREAMING_SNAKE_CASE (`API_URL`, `MAX_RETRIES`)
- **Types / interfaces:** PascalCase (`User`, `PostStatus`)
- **DB columns:** snake_case in SQL, camelCase in TypeScript field names (`displayName` maps to `display_name`)

## Schema Definitions (Drizzle)

- Define all tables in `src/lib/db/schema.ts`.
- Use `uuid("id").defaultRandom().primaryKey()` for primary keys.
- Column naming: camelCase field name mapping to snake_case SQL column — e.g., `displayName: varchar("display_name", { length: 120 })`.

## Svelte 5 Runes

Use Svelte 5 runes instead of old Svelte 4 patterns.

- State: Use `let count = $state(0)` instead of old `let count = writable(0)` / `$count`
- Derived: Use `let doubled = $derived(count * 2)` instead of old `$: doubled = count * 2`
- Effect: Use `$effect(() => { if (count > 5) ... })` instead of old `$: if (count > 5) ...`
- Props: Use `let { title = 'Default' } = $props()` instead of old `export let title = 'Default'`
- Slots: Use `let { header } = $props()` / `{@render header()}` instead of old `<slot name="header" />`
