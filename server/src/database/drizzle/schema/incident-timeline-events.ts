import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { incidents } from './incidents'

/**
 * The human-readable CAPA narrative (reported -> investigating ->
 * corrective/preventive action -> closure). actorLabel is captured as
 * text at write time rather than joined live, so the timeline reads
 * correctly even if the actor's name changes later. This is separate
 * from `audit_events`, which is the system-level security/compliance
 * log — the two serve different audiences.
 */
export const incidentTimelineEvents = pgTable('incident_timeline_events', {
  id: uuid('id').primaryKey().$defaultFn(() => randomUUID()),
  incidentId: uuid('incident_id')
    .notNull()
    .references(() => incidents.id, { onDelete: 'cascade' }),
  actorLabel: text('actor_label').notNull(),
  event: text('event').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
})

export type IncidentTimelineEvent = typeof incidentTimelineEvents.$inferSelect
export type NewIncidentTimelineEvent = typeof incidentTimelineEvents.$inferInsert
