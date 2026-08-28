import { doublePrecision, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { inventoryItems } from './inventory-items'
import { users } from './users'

/** Positive quantity = stock added (received); negative = stock removed (consumed/wasted/adjusted down). */
export const inventoryStockMovements = pgTable('inventory_stock_movements', {
  id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
  inventoryItemId: uuid('inventory_item_id')
    .notNull()
    .references(() => inventoryItems.id, { onDelete: 'cascade' }),
  quantity: doublePrecision('quantity').notNull(),
  reason: text('reason', { enum: ['received', 'consumed', 'adjusted', 'wasted'] }).notNull(),
  recordedByUserId: uuid('recorded_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
})

export type InventoryStockMovement = typeof inventoryStockMovements.$inferSelect
export type NewInventoryStockMovement = typeof inventoryStockMovements.$inferInsert
