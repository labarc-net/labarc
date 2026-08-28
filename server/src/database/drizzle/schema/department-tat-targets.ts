import { integer, pgTable, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { departments } from './departments'

export const departmentTatTargets = pgTable('department_tat_targets', {
  id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
  departmentId: uuid('department_id')
    .notNull()
    .references(() => departments.id, { onDelete: 'cascade' })
    .unique(),
  targetMinutes: integer('target_minutes').notNull().default(120),
})

export type DepartmentTatTarget = typeof departmentTatTargets.$inferSelect
export type NewDepartmentTatTarget = typeof departmentTatTargets.$inferInsert
