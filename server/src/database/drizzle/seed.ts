import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { hashPassword } from '../../common/security/hash.util'
import { ALL_PERMISSION_KEYS, DEFAULT_ROLE_PERMISSIONS } from '../../common/security/permissions.constants'
import { ROLE_DEFINITIONS } from '../../common/security/roles.constants'
import * as schema from './schema'

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.')
  }

  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client, { schema })

  console.log('Seeding permissions...')
  for (const key of ALL_PERMISSION_KEYS) {
    await db.insert(schema.permissions).values({ key }).onConflictDoNothing({ target: schema.permissions.key })
  }

  console.log('Seeding roles...')
  for (const role of ROLE_DEFINITIONS) {
    await db
      .insert(schema.roles)
      .values({ key: role.key, name: role.name, description: role.description, isSystem: true })
      .onConflictDoNothing({ target: schema.roles.key })
  }

  console.log('Wiring role -> permission mappings...')
  const allRoles = await db.select().from(schema.roles)
  const allPermissions = await db.select().from(schema.permissions)

  for (const role of allRoles) {
    const wanted = DEFAULT_ROLE_PERMISSIONS[role.key as keyof typeof DEFAULT_ROLE_PERMISSIONS] ?? []
    for (const permKey of wanted) {
      const permission = allPermissions.find((p) => p.key === permKey)
      if (!permission) continue
      await db
        .insert(schema.rolePermissions)
        .values({ roleId: role.id, permissionId: permission.id })
        .onConflictDoNothing()
    }
  }

  const seedEmail = process.env.SEED_SUPER_ADMIN_EMAIL
  const seedPassword = process.env.SEED_SUPER_ADMIN_PASSWORD

  if (seedEmail && seedPassword) {
    console.log(`Seeding super admin user (${seedEmail})...`)
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, seedEmail))
    if (existing.length === 0) {
      const passwordHash = await hashPassword(seedPassword, Number(process.env.BCRYPT_SALT_ROUNDS ?? 12))
      await db.insert(schema.users).values({
        email: seedEmail,
        passwordHash,
        fullName: 'Super Admin',
        isSuperAdmin: true,
      })
    } else {
      console.log('Super admin already exists, skipping.')
    }
  } else {
    console.log('SEED_SUPER_ADMIN_EMAIL / SEED_SUPER_ADMIN_PASSWORD not set — skipping super admin seed.')
  }

  const seedOrgName = process.env.SEED_ORG_NAME
  const seedOrgSlug = process.env.SEED_ORG_SLUG

  if (seedOrgName && seedOrgSlug) {
    console.log(`Seeding organization "${seedOrgName}"...`)
    const existingOrg = await db.select().from(schema.organizations).where(eq(schema.organizations.slug, seedOrgSlug))
    if (existingOrg.length === 0) {
      await db.insert(schema.organizations).values({ name: seedOrgName, slug: seedOrgSlug })
    } else {
      console.log('Organization already exists, skipping.')
    }
  } else {
    console.log('SEED_ORG_NAME / SEED_ORG_SLUG not set — skipping organization seed.')
  }

  console.log('Seed complete.')
  await client.end()
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
