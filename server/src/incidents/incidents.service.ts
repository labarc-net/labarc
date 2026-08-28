import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, desc, eq, sql } from 'drizzle-orm'
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type'
import { AuditService } from '../audit/audit.service'
import { DRIZZLE_CLIENT } from '../database/database.module'
import type { DrizzleClient } from '../database/drizzle/client'
import * as schema from '../database/drizzle/schema'
import type { AddTimelineNoteDto } from './dto/add-timeline-note.dto'
import type { CreateIncidentDto } from './dto/create-incident.dto'
import type { UpdateIncidentDto } from './dto/update-incident.dto'

interface ListIncidentsFilters {
  departmentId?: string
  status?: 'open' | 'investigating' | 'capa' | 'resolved' | 'closed'
  severity?: 'low' | 'moderate' | 'high' | 'critical'
  equipmentId?: string
}

@Injectable()
export class IncidentsService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly audit: AuditService,
  ) {}

  async list(organizationId: string, filters: ListIncidentsFilters) {
    const conditions = [eq(schema.incidents.organizationId, organizationId)]
    if (filters.departmentId) conditions.push(eq(schema.incidents.departmentId, filters.departmentId))
    if (filters.status) conditions.push(eq(schema.incidents.status, filters.status))
    if (filters.severity) conditions.push(eq(schema.incidents.severity, filters.severity))
    if (filters.equipmentId) conditions.push(eq(schema.incidents.equipmentId, filters.equipmentId))

    const rows = await this.db
      .select()
      .from(schema.incidents)
      .where(and(...conditions))
      .orderBy(desc(schema.incidents.reportedAt))

    const results = []
    for (const row of rows) {
      results.push(await this.toSummary(row))
    }
    return results
  }

  async getById(organizationId: string, incidentId: string) {
    const row = await this.findRecord(organizationId, incidentId)
    const summary = await this.toSummary(row)
    const timeline = await this.getTimeline(incidentId)
    return { ...summary, timeline }
  }

  async create(organizationId: string, dto: CreateIncidentDto, actingUser: AuthenticatedUser) {
    const [department] = await this.db
      .select()
      .from(schema.departments)
      .where(and(eq(schema.departments.id, dto.departmentId), eq(schema.departments.organizationId, organizationId)))
      .limit(1)

    if (!department) {
      throw new NotFoundException('Department not found in this organization.')
    }

    if (dto.equipmentId) {
      const [equipmentRow] = await this.db
        .select()
        .from(schema.equipment)
        .where(and(eq(schema.equipment.id, dto.equipmentId), eq(schema.equipment.organizationId, organizationId)))
        .limit(1)
      if (!equipmentRow) {
        throw new NotFoundException('Equipment not found in this organization.')
      }
    }

    if (dto.ownerUserId) {
      await this.assertUserIsOrgMember(organizationId, dto.ownerUserId)
    }

    const reference = await this.generateReference(organizationId)

    const [incident] = await this.db
      .insert(schema.incidents)
      .values({
        organizationId,
        departmentId: dto.departmentId,
        equipmentId: dto.equipmentId,
        reference,
        title: dto.title,
        type: dto.type,
        severity: dto.severity,
        reporterUserId: actingUser.id,
        ownerUserId: dto.ownerUserId,
        description: dto.description,
        immediateAction: dto.immediateAction,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        rootCauses: [],
      })
      .returning()

    await this.addTimelineEvent(incident.id, actingUser.fullName, `Incident reported: "${dto.title}"`)

    await this.audit.log({
      userId: actingUser.id,
      organizationId,
      action: 'incident.create',
      entityType: 'incident',
      entityId: incident.id,
      metadata: { reference },
    })

    return this.toSummary(incident)
  }

  async update(organizationId: string, incidentId: string, dto: UpdateIncidentDto, actingUser: AuthenticatedUser) {
    const existing = await this.findRecord(organizationId, incidentId)

    if (dto.ownerUserId) {
      await this.assertUserIsOrgMember(organizationId, dto.ownerUserId)
    }

    const patch: Record<string, unknown> = { ...dto, updatedAt: new Date() }
    if (dto.dueDate) patch.dueDate = new Date(dto.dueDate)

    const [updated] = await this.db
      .update(schema.incidents)
      .set(patch)
      .where(eq(schema.incidents.id, incidentId))
      .returning()

    if (this.hasStatusChange(dto, existing.status)) {
      await this.addTimelineEvent(
        incidentId,
        actingUser.fullName,
        `Status changed from "${existing.status}" to "${dto.status}"`,
      )
    }
    if (this.hasNewCorrectiveAction(dto, existing)) {
      await this.addTimelineEvent(incidentId, actingUser.fullName, 'Corrective action recorded')
    }
    if (this.hasNewPreventiveAction(dto, existing)) {
      await this.addTimelineEvent(incidentId, actingUser.fullName, 'Preventive action recorded')
    }
    if (this.hasRootCauseUpdate(dto)) {
      await this.addTimelineEvent(incidentId, actingUser.fullName, 'Root cause analysis updated')
    }

    await this.audit.log({
      userId: actingUser.id,
      organizationId,
      action: 'incident.update',
      entityType: 'incident',
      entityId: incidentId,
      metadata: dto,
    })

    return this.toSummary(updated)
  }

  async addNote(organizationId: string, incidentId: string, dto: AddTimelineNoteDto, actingUser: AuthenticatedUser) {
    await this.findRecord(organizationId, incidentId)
    const event = await this.addTimelineEvent(incidentId, actingUser.fullName, dto.event)

    await this.audit.log({
      userId: actingUser.id,
      organizationId,
      action: 'incident.note.add',
      entityType: 'incident',
      entityId: incidentId,
    })

    return event
  }

  private hasStatusChange(dto: UpdateIncidentDto, existingStatus: string): boolean {
    return !!dto.status && dto.status !== existingStatus
  }

  private hasNewCorrectiveAction(dto: UpdateIncidentDto, existing: { correctiveAction: string | null }): boolean {
    return !!dto.correctiveAction && !existing.correctiveAction
  }

  private hasNewPreventiveAction(dto: UpdateIncidentDto, existing: { preventiveAction: string | null }): boolean {
    return !!dto.preventiveAction && !existing.preventiveAction
  }

  private hasRootCauseUpdate(dto: UpdateIncidentDto): boolean {
    return !!dto.rootCauses && dto.rootCauses.length > 0
  }

  private async findRecord(organizationId: string, incidentId: string) {
    const [row] = await this.db
      .select()
      .from(schema.incidents)
      .where(and(eq(schema.incidents.id, incidentId), eq(schema.incidents.organizationId, organizationId)))
      .limit(1)

    if (!row) {
      throw new NotFoundException('Incident not found.')
    }
    return row
  }

  private async toSummary(row: typeof schema.incidents.$inferSelect) {
    const [reporter, owner, equipmentName] = await Promise.all([
      this.resolveUserName(row.reporterUserId),
      row.ownerUserId ? this.resolveUserName(row.ownerUserId) : Promise.resolve(null),
      row.equipmentId ? this.resolveEquipmentName(row.equipmentId) : Promise.resolve(null),
    ])

    return {
      id: row.id,
      reference: row.reference,
      title: row.title,
      type: row.type,
      departmentId: row.departmentId,
      equipmentId: row.equipmentId,
      equipmentName,
      severity: row.severity,
      status: row.status,
      reporter,
      owner,
      reportedAt: row.reportedAt,
      dueDate: row.dueDate,
      description: row.description,
      immediateAction: row.immediateAction,
      rootCauses: row.rootCauses,
      correctiveAction: row.correctiveAction,
      preventiveAction: row.preventiveAction,
    }
  }

  private async getTimeline(incidentId: string) {
    const rows = await this.db
      .select()
      .from(schema.incidentTimelineEvents)
      .where(eq(schema.incidentTimelineEvents.incidentId, incidentId))
      .orderBy(schema.incidentTimelineEvents.occurredAt)

    return rows.map((r) => ({ at: r.occurredAt, actor: r.actorLabel, event: r.event }))
  }

  private async addTimelineEvent(incidentId: string, actorLabel: string, event: string) {
    const [row] = await this.db
      .insert(schema.incidentTimelineEvents)
      .values({ incidentId, actorLabel, event })
      .returning()
    return row
  }

  private async resolveUserName(userId: string): Promise<string> {
    const [row] = await this.db
      .select({ fullName: schema.users.fullName })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1)
    return row?.fullName ?? 'Unknown'
  }

  private async resolveEquipmentName(equipmentId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ name: schema.equipment.name })
      .from(schema.equipment)
      .where(eq(schema.equipment.id, equipmentId))
      .limit(1)
    return row?.name ?? null
  }

  private async assertUserIsOrgMember(organizationId: string, userId: string) {
    const [row] = await this.db
      .select({ id: schema.memberships.id })
      .from(schema.memberships)
      .where(and(eq(schema.memberships.userId, userId), eq(schema.memberships.organizationId, organizationId)))
      .limit(1)
    if (!row) {
      throw new NotFoundException('Owner is not a member of this organization.')
    }
  }

  /**
   * NOTE: a simple count-based sequence — two incidents created in the
   * same organization + year at the exact same moment could theoretically
   * collide. Acceptable for this phase; a DB sequence/advisory lock is a
   * reasonable hardening step if that turns out to matter in practice.
   */
  private async generateReference(organizationId: string): Promise<string> {
    const year = new Date().getFullYear()
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.incidents)
      .where(
        and(
          eq(schema.incidents.organizationId, organizationId),
          sql`extract(year from ${schema.incidents.reportedAt}) = ${year}`,
        ),
      )
    const seq = Number(count) + 1
    return `INC-${year}-${String(seq).padStart(4, '0')}`
  }
}
