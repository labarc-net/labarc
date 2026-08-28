import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { memberships } from './memberships'

/**
 * Operational HR data layered on top of a membership — shift, workload
 * capacity, competencies. Deliberately separate from `memberships` (which
 * is Identity/RBAC's concern): a membership says *what a person can do*,
 * a staff profile says *how they're scheduled and loaded*.
 */
export const staffProfiles = pgTable(
  'staff_profiles',
  {
    id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
    membershipId: uuid('membership_id')
      .notNull()
      .references(() => memberships.id, { onDelete: 'cascade' }),
    shift: text('shift', { enum: ['day', 'evening', 'night'] }).notNull().default('day'),
    taskCapacity: integer('task_capacity').notNull().default(12),
    competencies: jsonb('competencies').$type<string[]>().notNull(),
    available: boolean('available').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    membershipUnique: uniqueIndex('staff_profiles_membership_unique').on(table.membershipId),
  }),
)

export type StaffProfile = typeof staffProfiles.$inferSelect
export type NewStaffProfile = typeof staffProfiles.$inferInsert
