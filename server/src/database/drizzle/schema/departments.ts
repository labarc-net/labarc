import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { organizations } from './organizations'

export const departments = pgTable(
  'departments',
  {
    id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgNameUnique: uniqueIndex('departments_org_name_unique').on(table.organizationId, table.name),
  }),
)

export type Department = typeof departments.$inferSelect
export type NewDepartment = typeof departments.$inferInsert
