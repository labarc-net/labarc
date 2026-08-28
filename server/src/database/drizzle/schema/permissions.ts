import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
  key: text('key').notNull().unique(),
  description: text('description'),
})

export type Permission = typeof permissions.$inferSelect
export type NewPermission = typeof permissions.$inferInsert
