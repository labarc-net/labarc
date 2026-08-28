# LabArc Server — Phase 1 (Foundation)

NestJS backend for LabArc. This package is independent from the frontend
(`app/`, `components/`, `lib/`) — it does not share a package.json,
lockfile, or dependency tree with it.

## What Phase 1 includes

- NestJS app bootstrap (`src/main.ts`)
- Config module with env validation (`src/common/config`)
- Structured logging via `nestjs-pino`
- Global validation (`class-validator`) and a consistent error response
  shape (`src/common/filters/http-exception.filter.ts`)
- A Postgres connection via Drizzle ORM (`src/database`), pointed at
  Supabase's Postgres or a local instance
- An optional Supabase client (`src/supabase`) — safe to leave
  unconfigured until a later phase wires up auth/storage
- `GET /api/health` — verifies the process is up and the database is
  reachable

**No domain schema yet.** `src/database/drizzle/schema/index.ts` is an
empty barrel on purpose — Organizations/Users/Roles/Permissions and
tenant isolation land in Phase 2 (Identity).

## Setup

```bash
cp .env.example .env
# edit .env — set DATABASE_URL to your Supabase Postgres connection
# string (or a local Postgres instance for development)

pnpm install
pnpm run start:dev
```

Then:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api
```

## Scripts

| Command              | What it does                                  |
|-----------------------|------------------------------------------------|
| `pnpm run start:dev`  | Start the API in watch mode                    |
| `pnpm run build`      | Compile to `dist/`                              |
| `pnpm run start:prod` | Run the compiled build                          |
| `pnpm run db:generate`| Generate a Drizzle migration from the schema    |
| `pnpm run db:migrate` | Apply migrations to `DATABASE_URL`              |
| `pnpm run db:studio`  | Open Drizzle Studio against `DATABASE_URL`      |

## Next (Phase 2 — Identity)

- `organizations`, `departments`, `users`, `roles`, `permissions` tables
  in `src/database/drizzle/schema/`
- Authentication (Supabase-backed or NestJS-native — TBD)
- Permission-based authorization guard (`equipment.read`,
  `equipment.manage`, ...)
- Tenant isolation enforced at the query layer, not just the frontend
