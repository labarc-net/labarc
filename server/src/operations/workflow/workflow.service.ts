import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, desc, eq, gte, isNull, sql } from 'drizzle-orm'
import { AuditService } from '../../audit/audit.service'
import { DRIZZLE_CLIENT } from '../../database/database.module'
import type { DrizzleClient } from '../../database/drizzle/client'
import * as schema from '../../database/drizzle/schema'
import type { AdvanceWorkItemDto } from './dto/advance-work-item.dto'
import type { AssignWorkItemDto } from './dto/assign-work-item.dto'
import type { CreateWorkItemDto } from './dto/create-work-item.dto'

interface ListWorkItemsFilters {
  departmentId?: string
  stageKey?: string
  status?: 'in_progress' | 'completed' | 'cancelled'
  assignedStaffId?: string
}

const DEFAULT_STAGES = [
  { key: 'received', label: 'Received', sequence: 1, targetWaitMinutes: 15 },
  { key: 'processing', label: 'Processing', sequence: 2, targetWaitMinutes: 30 },
  { key: 'analysis', label: 'Analysis', sequence: 3, targetWaitMinutes: 45 },
  { key: 'qc', label: 'QC', sequence: 4, targetWaitMinutes: 20 },
  { key: 'validation', label: 'Validation', sequence: 5, targetWaitMinutes: 15 },
  { key: 'reported', label: 'Reported', sequence: 6, targetWaitMinutes: 10 },
]

const DWELL_HISTORY_WINDOW_DAYS = 7

@Injectable()
export class WorkflowService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly audit: AuditService,
  ) {}

  /** Idempotent — seeds the default 6-stage pipeline for an org the first time it's needed. */
  async ensureDefaultStages(organizationId: string) {
    const existing = await this.db
      .select()
      .from(schema.workflowStages)
      .where(eq(schema.workflowStages.organizationId, organizationId))

    if (existing.length > 0) {
      return [...existing].sort((a, b) => a.sequence - b.sequence)
    }

    const inserted = await this.db
      .insert(schema.workflowStages)
      .values(DEFAULT_STAGES.map((stage) => ({ organizationId, ...stage })))
      .returning()

    return [...inserted].sort((a, b) => a.sequence - b.sequence)
  }

  async listStages(organizationId: string) {
    return this.ensureDefaultStages(organizationId)
  }

  /**
   * Board view: one row per stage with the current queue count and typical
   * dwell time. Rules-based only, per LabArc's "start simple" guidance —
   * avgWaitMinutes averages *closed* dwell events from the trailing
   * window, falling back to current in-progress dwell time when a stage
   * has no closed events yet (cold start).
   */
  async getBoard(organizationId: string, departmentId?: string) {
    const stages = await this.ensureDefaultStages(organizationId)
    const windowStart = new Date(Date.now() - DWELL_HISTORY_WINDOW_DAYS * 24 * 60 * 60 * 1000)

    const board = []
    for (const stage of stages) {
      const countConditions = [eq(schema.workItems.currentStageId, stage.id), eq(schema.workItems.status, 'in_progress')]
      if (departmentId) countConditions.push(eq(schema.workItems.departmentId, departmentId))

      const [{ count }] = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.workItems)
        .where(and(...countConditions))

      const avgWaitMinutes = await this.getStageAvgWaitMinutes(stage.id, departmentId, windowStart)
      const status = this.waitStatus(avgWaitMinutes, stage.targetWaitMinutes)

      board.push({
        key: stage.key,
        label: stage.label,
        count: Number(count),
        avgWaitMinutes,
        status,
      })
    }

    return board
  }

  private async getStageAvgWaitMinutes(
    stageId: string,
    departmentId: string | undefined,
    windowStart: Date,
  ): Promise<number> {
    const closedConditions = [
      eq(schema.workItemStageEvents.stageId, stageId),
      sql`${schema.workItemStageEvents.exitedAt} is not null`,
      gte(schema.workItemStageEvents.enteredAt, windowStart),
    ]
    if (departmentId) closedConditions.push(eq(schema.workItems.departmentId, departmentId))

    const [{ avgMinutes: closedAvg }] = await this.db
      .select({
        avgMinutes: sql<number | null>`avg(extract(epoch from (${schema.workItemStageEvents.exitedAt} - ${schema.workItemStageEvents.enteredAt})) / 60)`,
      })
      .from(schema.workItemStageEvents)
      .innerJoin(schema.workItems, eq(schema.workItems.id, schema.workItemStageEvents.workItemId))
      .where(and(...closedConditions))

    if (closedAvg !== null && closedAvg !== undefined) {
      return Math.round(Number(closedAvg))
    }

    const openConditions = [eq(schema.workItemStageEvents.stageId, stageId), isNull(schema.workItemStageEvents.exitedAt)]
    if (departmentId) openConditions.push(eq(schema.workItems.departmentId, departmentId))

    const [{ avgMinutes: openAvg }] = await this.db
      .select({
        avgMinutes: sql<number | null>`avg(extract(epoch from (now() - ${schema.workItemStageEvents.enteredAt})) / 60)`,
      })
      .from(schema.workItemStageEvents)
      .innerJoin(schema.workItems, eq(schema.workItems.id, schema.workItemStageEvents.workItemId))
      .where(and(...openConditions))

    return openAvg !== null && openAvg !== undefined ? Math.round(Number(openAvg)) : 0
  }

  private waitStatus(avgWaitMinutes: number, targetWaitMinutes: number | null): 'normal' | 'watch' | 'critical' {
    if (!targetWaitMinutes) return 'normal'
    if (avgWaitMinutes <= targetWaitMinutes) return 'normal'
    if (avgWaitMinutes <= targetWaitMinutes * 1.5) return 'watch'
    return 'critical'
  }

  async listItems(organizationId: string, filters: ListWorkItemsFilters) {
    const stages = await this.ensureDefaultStages(organizationId)
    const conditions = [eq(schema.workItems.organizationId, organizationId)]
    if (filters.departmentId) conditions.push(eq(schema.workItems.departmentId, filters.departmentId))
    if (filters.status) conditions.push(eq(schema.workItems.status, filters.status))
    if (filters.assignedStaffId) conditions.push(eq(schema.workItems.assignedStaffId, filters.assignedStaffId))
    if (filters.stageKey) {
      const stage = stages.find((s) => s.key === filters.stageKey)
      if (stage) conditions.push(eq(schema.workItems.currentStageId, stage.id))
    }

    return this.db
      .select()
      .from(schema.workItems)
      .where(and(...conditions))
      .orderBy(desc(schema.workItems.receivedAt))
  }

  async create(organizationId: string, dto: CreateWorkItemDto, actingUserId: string) {
    const [department] = await this.db
      .select()
      .from(schema.departments)
      .where(and(eq(schema.departments.id, dto.departmentId), eq(schema.departments.organizationId, organizationId)))
      .limit(1)

    if (!department) {
      throw new NotFoundException('Department not found in this organization.')
    }

    const stages = await this.ensureDefaultStages(organizationId)
    const firstStage = stages[0]

    const [item] = await this.db
      .insert(schema.workItems)
      .values({
        organizationId,
        departmentId: dto.departmentId,
        reference: dto.reference,
        priority: dto.priority ?? 'routine',
        currentStageId: firstStage.id,
      })
      .returning()

    await this.db.insert(schema.workItemStageEvents).values({ workItemId: item.id, stageId: firstStage.id })

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'workflow.item.create',
      entityType: 'work_item',
      entityId: item.id,
      metadata: { reference: dto.reference },
    })

    return item
  }

  async advance(organizationId: string, itemId: string, dto: AdvanceWorkItemDto, actingUserId: string) {
    const [item] = await this.db
      .select()
      .from(schema.workItems)
      .where(and(eq(schema.workItems.id, itemId), eq(schema.workItems.organizationId, organizationId)))
      .limit(1)

    if (!item) {
      throw new NotFoundException('Work item not found.')
    }
    if (item.status !== 'in_progress') {
      throw new ConflictException('This work item is no longer in progress.')
    }

    const stages = await this.ensureDefaultStages(organizationId)
    const currentIndex = stages.findIndex((s) => s.id === item.currentStageId)
    const targetStage = dto.toStageKey ? stages.find((s) => s.key === dto.toStageKey) : stages[currentIndex + 1]

    if (!targetStage) {
      throw new BadRequestException('No next stage — use the complete endpoint to finish this work item.')
    }

    await this.db
      .update(schema.workItemStageEvents)
      .set({ exitedAt: new Date() })
      .where(and(eq(schema.workItemStageEvents.workItemId, itemId), isNull(schema.workItemStageEvents.exitedAt)))

    await this.db.insert(schema.workItemStageEvents).values({ workItemId: itemId, stageId: targetStage.id })

    const [updated] = await this.db
      .update(schema.workItems)
      .set({ currentStageId: targetStage.id, updatedAt: new Date() })
      .where(eq(schema.workItems.id, itemId))
      .returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'workflow.item.advance',
      entityType: 'work_item',
      entityId: itemId,
      metadata: { toStage: targetStage.key },
    })

    return updated
  }

  async complete(organizationId: string, itemId: string, actingUserId: string) {
    const [item] = await this.db
      .select()
      .from(schema.workItems)
      .where(and(eq(schema.workItems.id, itemId), eq(schema.workItems.organizationId, organizationId)))
      .limit(1)

    if (!item) {
      throw new NotFoundException('Work item not found.')
    }
    if (item.status !== 'in_progress') {
      throw new ConflictException('This work item is already completed or cancelled.')
    }

    await this.db
      .update(schema.workItemStageEvents)
      .set({ exitedAt: new Date() })
      .where(and(eq(schema.workItemStageEvents.workItemId, itemId), isNull(schema.workItemStageEvents.exitedAt)))

    const [updated] = await this.db
      .update(schema.workItems)
      .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.workItems.id, itemId))
      .returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'workflow.item.complete',
      entityType: 'work_item',
      entityId: itemId,
    })

    return updated
  }

  async assign(organizationId: string, itemId: string, dto: AssignWorkItemDto, actingUserId: string) {
    const [item] = await this.db
      .select()
      .from(schema.workItems)
      .where(and(eq(schema.workItems.id, itemId), eq(schema.workItems.organizationId, organizationId)))
      .limit(1)

    if (!item) {
      throw new NotFoundException('Work item not found.')
    }

    const [updated] = await this.db
      .update(schema.workItems)
      .set({ assignedStaffId: dto.staffProfileId ?? null, updatedAt: new Date() })
      .where(eq(schema.workItems.id, itemId))
      .returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'workflow.item.assign',
      entityType: 'work_item',
      entityId: itemId,
      metadata: { staffProfileId: dto.staffProfileId ?? null },
    })

    return updated
  }
}
