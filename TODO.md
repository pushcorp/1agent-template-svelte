
Auth:
- [x] better-auth email and password
- [x] auth schema (user, session, account, verification tables)
- [x] sign-up / sign-in / sign-out pages
- [x] auth middleware in hooks.server.ts (protect routes)
- [x] add .env.example with AUTH_SECRET, DATABASE_URL
- [x] add auth guide document in `docs/features/`

API:
- [ ] typed fetch helper utility (`$lib/utils/api.ts`)
- [ ] error response helper (consistent JSON error shape)
- [ ] example CRUD endpoint (e.g. `/api/v1/posts/+server.ts`)

More shadcn components:
- [x] Label
- [x] Textarea
- [x] Select
- [x] Checkbox
- [x] Dialog
- [x] Card
- [x] Badge
- [x] Avatar
- [x] Dropdown Menu
- [x] Separator

Hooks examples:
- [x] add auth guard pattern (after better-auth is set up)

PostgreSQL Database:
- [x] add these scripts packagejson and claude.md
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
- [x] install and use uuidv7 for id `import { uuidv7 } from "uuidv7";`
- [x] Change schema and drizzle config for PostgreSQL. currently it shows Turso/libSQL code so.

Built-In service
- [x] Sending email by AWS SES

Shadcn themes and prompt for ai:
- [ ] add shadcn theme doc/guide (`docs/packages/shadcn-theme.md`)
- [ ] document how to swap OKLCH color tokens in app.css
- [ ] add AI prompt reference for generating new themes

Form handling:
- [ ] create Zod schema example for a form
- [ ] build example form page with client/server validation
- [ ] document form pattern in docs/
