import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { equipment } from './equipment'
import { organizations } from './organizations'
import { staffProfiles } from './staff-profiles'

export const maintenanceRecords = pgTable('maintenance_records', {
  id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  equipmentId: uuid('equipment_id')
    .notNull()
    .references(() => equipment.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['preventive', 'corrective', 'calibration', 'inspection'] }).notNull(),
  /**
   * 'overdue' is NOT a stored value here — it's derived at read time from
   * 'scheduled' + a past-due date (see MaintenanceService.displayStatus),
   * so it can never go stale.
   */
  status: text('status', { enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] })
    .notNull()
    .default('scheduled'),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  technicianStaffProfileId: uuid('technician_staff_profile_id').references(() => staffProfiles.id, {
    onDelete: 'set null',
  }),
  durationHours: integer('duration_hours'),
  notes: text('notes'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect
export type NewMaintenanceRecord = typeof maintenanceRecords.$inferInsert
