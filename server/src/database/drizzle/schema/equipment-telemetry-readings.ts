import { doublePrecision, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { equipment } from './equipment'

/**
 * Raw telemetry time series (temperature, vibration, power, utilization,
 * ...). Fed by the equipment.telemetry.record endpoint today — the same
 * pipeline a real sensor, a simulator, or an MQTT bridge (Phase 9) can
 * feed later without any schema change.
 */
export const equipmentTelemetryReadings = pgTable('equipment_telemetry_readings', {
  id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
  equipmentId: uuid('equipment_id')
    .notNull()
    .references(() => equipment.id, { onDelete: 'cascade' }),
  metricKey: text('metric_key').notNull(),
  unit: text('unit').notNull(),
  value: doublePrecision('value').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
})

export type EquipmentTelemetryReading = typeof equipmentTelemetryReadings.$inferSelect
export type NewEquipmentTelemetryReading = typeof equipmentTelemetryReadings.$inferInsert
