import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { organizations } from './organizations'

/**
 * The ordered pipeline work items move through (Received -> Processing ->
 * Analysis -> QC -> Validation -> Reported by default — see
 * DEFAULT_STAGES in operations/workflow/workflow.service.ts). Configurable
 * per organization; the default set is seeded the first time it's needed.
 */
export const workflowStages = pgTable(
  'workflow_stages',
  {
    id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    label: text('label').notNull(),
    sequence: integer('sequence').notNull(),
    targetWaitMinutes: integer('target_wait_minutes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgKeyUnique: uniqueIndex('workflow_stages_org_key_unique').on(table.organizationId, table.key),
  }),
)

export type WorkflowStageRow = typeof workflowStages.$inferSelect
export type NewWorkflowStageRow = typeof workflowStages.$inferInsert
