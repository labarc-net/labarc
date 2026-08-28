import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { departments } from './departments'
import { organizations } from './organizations'
import { roles } from './roles'
import { users } from './users'

/**
 * The tenant-isolation join: a user only has access to an organization's
 * resources through an active row here. TenantGuard resolves this on every
 * tenant-scoped request — nothing downstream should trust a client-supplied
 * organizationId without it having passed through that guard.
 */
export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id),
    status: text('status', { enum: ['active', 'invited', 'disabled'] }).notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userOrgUnique: uniqueIndex('memberships_user_org_unique').on(table.userId, table.organizationId),
  }),
)

export type Membership = typeof memberships.$inferSelect
export type NewMembership = typeof memberships.$inferInsert
