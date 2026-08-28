import { doublePrecision, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { qcControls } from './qc-controls'
import { users } from './users'

export const qcResults = pgTable('qc_results', {
  id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
  qcControlId: uuid('qc_control_id')
    .notNull()
    .references(() => qcControls.id, { onDelete: 'cascade' }),
  value: doublePrecision('value').notNull(),
  recordedByUserId: uuid('recorded_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
})

export type QcResult = typeof qcResults.$inferSelect
export type NewQcResult = typeof qcResults.$inferInsert
