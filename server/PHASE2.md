# LabArc Server — Phase 2 (Identity)

Adds authentication, Organizations, Departments, Users, Roles,
Permissions, and tenant isolation on top of the Phase 1 foundation.

## Model

```
Platform
  └── users (isSuperAdmin: bypasses everything below)
Organization
  └── departments
  └── memberships (user + org + role + optional department)
        role ─┬── org_admin, lab_manager, lab_scientist, technician,
              │   quality_officer, inventory_manager,
              │   maintenance_engineer, it_admin, viewer
              └── each role -> a set of permission keys (role_permissions)
```

"Super Admin" is a platform-level flag on `users`, not a membership role —
it operates across every organization and bypasses membership/permission
checks entirely.

## Auth

- `POST /api/auth/login` — `{ email, password }` -> access + refresh tokens
- `POST /api/auth/refresh` — `{ refreshToken }` -> new token pair (old one revoked)
- `POST /api/auth/logout` — `{ refreshToken }` -> revokes it
- `GET /api/auth/me` — current user (requires `Authorization: Bearer <accessToken>`)

Every other route requires a valid access token by default (global
`JwtAuthGuard`) — mark a route `@Public()` to opt out.

## Tenant isolation

Routes nested under `/organizations/:organizationId/...` go through
`TenantGuard` (resolves the caller's membership + permissions for that
org and attaches them to `request.tenant`) and `PermissionsGuard`
(`@RequirePermissions(...)`). Nothing downstream should trust a
client-supplied `organizationId` that hasn't passed through TenantGuard.

## Setup

```bash
# from server/
pnpm install              # already run by the scaffold script unless --no-install

pnpm run db:generate       # generate the SQL migration from the schema
pnpm run db:migrate        # apply it to DATABASE_URL
pnpm run db:seed           # seed system roles + permissions (+ optional
                            # super admin / org if SEED_* vars are set)

pnpm run start:dev
```

Then, with a seeded super admin:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"<SEED_SUPER_ADMIN_EMAIL>","password":"<SEED_SUPER_ADMIN_PASSWORD>"}'
```

## Known Phase 2 scope cuts (documented, not hidden)

- No invite-email flow yet — inviting a member takes a `temporaryPassword`
  the org admin shares directly. A token-based invite link is a natural
  follow-up.
- Guard unit tests (`*.spec.ts`) cover PermissionsGuard's authorization
  logic without a database. Full integration/e2e tests against a real
  Postgres instance (e.g. proving cross-org data leaks are impossible
  end-to-end) are a good addition once CI has a test database — this
  phase intentionally didn't fake that coverage.
- No rate limiting or `helmet` yet (tracked under the spec's general
  Security section, not Identity specifically).

## Next (Phase 3 — Laboratory Operations)

Departments already exist; next up per the plan is workflows, queues,
workforce, and TAT.
