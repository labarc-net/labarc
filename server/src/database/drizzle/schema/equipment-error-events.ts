import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { equipment } from './equipment'

export const equipmentErrorEvents = pgTable('equipment_error_events', {
  id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
  equipmentId: uuid('equipment_id')
    .notNull()
    .references(() => equipment.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
})

export type EquipmentErrorEvent = typeof equipmentErrorEvents.$inferSelect
export type NewEquipmentErrorEvent = typeof equipmentErrorEvents.$inferInsert
