import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { departments } from './departments'
import { organizations } from './organizations'
import { staffProfiles } from './staff-profiles'
import { workflowStages } from './workflow-stages'

/** A sample/task/order moving through the lab's workflow pipeline. */
export const workItems = pgTable('work_items', {
  id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  departmentId: uuid('department_id')
    .notNull()
    .references(() => departments.id, { onDelete: 'cascade' }),
  reference: text('reference').notNull(),
  priority: text('priority', { enum: ['routine', 'urgent', 'stat'] }).notNull().default('routine'),
  currentStageId: uuid('current_stage_id')
    .notNull()
    .references(() => workflowStages.id),
  assignedStaffId: uuid('assigned_staff_id').references(() => staffProfiles.id, { onDelete: 'set null' }),
  status: text('status', { enum: ['in_progress', 'completed', 'cancelled'] }).notNull().default('in_progress'),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type WorkItem = typeof workItems.$inferSelect
export type NewWorkItem = typeof workItems.$inferInsert
