import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'

/**
 * Platform-level identity — not tenant-scoped. A user's access to a given
 * organization comes entirely from `memberships`, not from this table.
 * `isSuperAdmin` is the one exception: it grants cross-organization
 * platform access and bypasses membership/permission checks (see
 * common/guards/tenant.guard.ts and permissions.guard.ts).
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  isSuperAdmin: boolean('is_super_admin').notNull().default(false),
  status: text('status', { enum: ['active', 'invited', 'disabled'] }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
