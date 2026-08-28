import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { equipment } from './equipment'

/** An open event (exitedAt null) means the equipment is down right now. */
export const equipmentDowntimeEvents = pgTable('equipment_downtime_events', {
  id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
  equipmentId: uuid('equipment_id')
    .notNull()
    .references(() => equipment.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
})

export type EquipmentDowntimeEvent = typeof equipmentDowntimeEvents.$inferSelect
export type NewEquipmentDowntimeEvent = typeof equipmentDowntimeEvents.$inferInsert
