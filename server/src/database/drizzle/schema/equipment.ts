import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { departments } from './departments'
import { organizations } from './organizations'

export const equipment = pgTable(
  'equipment',
  {
    id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    model: text('model').notNull(),
    manufacturer: text('manufacturer').notNull(),
    serialNumber: text('serial_number').notNull(),
    location: text('location').notNull(),
    installedOn: timestamp('installed_on', { withTimezone: true }).notNull(),
    warrantyUntil: timestamp('warranty_until', { withTimezone: true }),
    serviceProvider: text('service_provider'),
    /**
     * Manual override — equipment taken out of service (decommissioned,
     * in storage, etc). Independent of the computed health score: healthy
     * equipment can still be manually marked offline.
     */
    operationalState: text('operational_state', { enum: ['in_service', 'offline'] }).notNull().default('in_service'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgSerialUnique: uniqueIndex('equipment_org_serial_unique').on(table.organizationId, table.serialNumber),
  }),
)

export type Equipment = typeof equipment.$inferSelect
export type NewEquipment = typeof equipment.$inferInsert
