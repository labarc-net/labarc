import { doublePrecision, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { departments } from './departments'
import { equipment } from './equipment'
import { organizations } from './organizations'

/**
 * A QC "panel": one analyte + control level + instrument combination
 * (e.g. Glucose / Level 2 / Chemistry Analyzer 02), with the target
 * mean/SD established for that control lot. targetMean/targetSd are the
 * denominator for Westgard z-scores — see qc-rules.service.ts.
 */
export const qcControls = pgTable('qc_controls', {
  id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  departmentId: uuid('department_id')
    .notNull()
    .references(() => departments.id, { onDelete: 'cascade' }),
  equipmentId: uuid('equipment_id').references(() => equipment.id, { onDelete: 'set null' }),
  analyte: text('analyte').notNull(),
  level: text('level').notNull(),
  instrumentLabel: text('instrument_label').notNull(),
  targetMean: doublePrecision('target_mean').notNull(),
  targetSd: doublePrecision('target_sd').notNull(),
  unit: text('unit').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type QcControl = typeof qcControls.$inferSelect
export type NewQcControl = typeof qcControls.$inferInsert
