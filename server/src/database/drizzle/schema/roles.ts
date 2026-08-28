import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'

/**
 * Organization-scoped roles. "Super Admin" is intentionally NOT a row
 * here — it's the platform-level `users.isSuperAdmin` flag instead (see
 * common/security/roles.constants.ts for why).
 */
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  isSystem: boolean('is_system').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert
