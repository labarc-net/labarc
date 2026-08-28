import { jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { departments } from './departments'
import { equipment } from './equipment'
import { organizations } from './organizations'
import { users } from './users'

/**
 * reporterUserId/ownerUserId reference `users` directly rather than
 * `memberships` — a platform super admin filing or owning an incident on
 * behalf of an organization they aren't a member of is a legitimate case,
 * and users.id is always available for any authenticated actor.
 */
export const incidents = pgTable(
  'incidents',
  {
    id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'cascade' }),
    equipmentId: uuid('equipment_id').references(() => equipment.id, { onDelete: 'set null' }),
    reference: text('reference').notNull(),
    title: text('title').notNull(),
    type: text('type').notNull(),
    severity: text('severity', { enum: ['low', 'moderate', 'high', 'critical'] }).notNull(),
    status: text('status', { enum: ['open', 'investigating', 'capa', 'resolved', 'closed'] })
      .notNull()
      .default('open'),
    reporterUserId: uuid('reporter_user_id')
      .notNull()
      .references(() => users.id),
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
    reportedAt: timestamp('reported_at', { withTimezone: true }).notNull().defaultNow(),
    dueDate: timestamp('due_date', { withTimezone: true }),
    description: text('description').notNull(),
    immediateAction: text('immediate_action'),
    rootCauses: jsonb('root_causes').$type<string[]>().notNull(),
    correctiveAction: text('corrective_action'),
    preventiveAction: text('preventive_action'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgReferenceUnique: uniqueIndex('incidents_org_reference_unique').on(table.organizationId, table.reference),
  }),
)

export type Incident = typeof incidents.$inferSelect
export type NewIncident = typeof incidents.$inferInsert
