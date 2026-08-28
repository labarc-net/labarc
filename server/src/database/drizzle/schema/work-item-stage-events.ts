import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { workItems } from './work-items'
import { workflowStages } from './workflow-stages'

/** Dwell-time history per stage — closed events (exitedAt set) drive avgWaitMinutes. */
export const workItemStageEvents = pgTable('work_item_stage_events', {
  id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
  workItemId: uuid('work_item_id')
    .notNull()
    .references(() => workItems.id, { onDelete: 'cascade' }),
  stageId: uuid('stage_id')
    .notNull()
    .references(() => workflowStages.id, { onDelete: 'cascade' }),
  enteredAt: timestamp('entered_at', { withTimezone: true }).notNull().defaultNow(),
  exitedAt: timestamp('exited_at', { withTimezone: true }),
})

export type WorkItemStageEvent = typeof workItemStageEvents.$inferSelect
export type NewWorkItemStageEvent = typeof workItemStageEvents.$inferInsert
