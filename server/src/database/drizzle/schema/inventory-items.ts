import { doublePrecision, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { departments } from './departments'
import { organizations } from './organizations'

/**
 * The item + lot definition. Current stock is deliberately NOT a column
 * here — it's the sum of `inventory_stock_movements` (see
 * InventoryService.getCurrentStock), the same computed-not-stored
 * pattern used for equipment health, TAT, and QC stats elsewhere.
 */
export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  departmentId: uuid('department_id')
    .notNull()
    .references(() => departments.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category', {
    enum: ['reagent', 'control', 'calibrator', 'consumable', 'spare_part', 'ppe'],
  }).notNull(),
  lot: text('lot').notNull(),
  unit: text('unit').notNull(),
  reorderLevel: doublePrecision('reorder_level').notNull(),
  leadTimeDays: integer('lead_time_days').notNull(),
  expiry: timestamp('expiry', { withTimezone: true }),
  supplier: text('supplier').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type InventoryItem = typeof inventoryItems.$inferSelect
export type NewInventoryItem = typeof inventoryItems.$inferInsert
