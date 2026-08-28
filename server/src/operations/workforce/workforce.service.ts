import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, eq, sql } from 'drizzle-orm'
import { AuditService } from '../../audit/audit.service'
import { DRIZZLE_CLIENT } from '../../database/database.module'
import type { DrizzleClient } from '../../database/drizzle/client'
import * as schema from '../../database/drizzle/schema'
import type { CreateStaffProfileDto } from './dto/create-staff-profile.dto'
import type { UpdateStaffProfileDto } from './dto/update-staff-profile.dto'

@Injectable()
export class WorkforceService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly audit: AuditService,
  ) {}

  /**
   * Staff list with computed workload fields. assignedTasks/pendingTasks/
   * overdueTasks/capacityPct are derived from live work_items data, not
   * stored — accurate the moment they're read, at the cost of a few extra
   * queries per staff member. Fine at Phase 3 scale; worth batching into
   * a single grouped query later if the roster grows large.
   */
  async list(organizationId: string, departmentId?: string) {
    const membershipConditions = [eq(schema.memberships.organizationId, organizationId)]
    if (departmentId) membershipConditions.push(eq(schema.memberships.departmentId, departmentId))

    const profiles = await this.db
      .select({
        id: schema.staffProfiles.id,
        membershipId: schema.staffProfiles.membershipId,
        shift: schema.staffProfiles.shift,
        taskCapacity: schema.staffProfiles.taskCapacity,
        competencies: schema.staffProfiles.competencies,
        available: schema.staffProfiles.available,
        userId: schema.users.id,
        fullName: schema.users.fullName,
        roleKey: schema.roles.key,
        roleName: schema.roles.name,
        departmentId: schema.memberships.departmentId,
      })
      .from(schema.staffProfiles)
      .innerJoin(schema.memberships, eq(schema.memberships.id, schema.staffProfiles.membershipId))
      .innerJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
      .innerJoin(schema.roles, eq(schema.roles.id, schema.memberships.roleId))
      .where(and(...membershipConditions))

    const results = []
    for (const profile of profiles) {
      const workload = await this.getWorkload(profile.id)
      const capacityPct =
        profile.taskCapacity > 0 ? Math.round((workload.assignedTasks / profile.taskCapacity) * 100) : 0

      results.push({
        ...profile,
        assignedTasks: workload.assignedTasks,
        pendingTasks: workload.pendingTasks,
        overdueTasks: workload.overdueTasks,
        capacityPct,
        status: this.capacityStatus(capacityPct),
      })
    }

    return results
  }

  private async getWorkload(staffProfileId: string) {
    const [{ assignedTasks }] = await this.db
      .select({ assignedTasks: sql<number>`count(*)::int` })
      .from(schema.workItems)
      .where(and(eq(schema.workItems.assignedStaffId, staffProfileId), eq(schema.workItems.status, 'in_progress')))

    const [{ pendingTasks }] = await this.db
      .select({ pendingTasks: sql<number>`count(*)::int` })
      .from(schema.workItems)
      .innerJoin(schema.workflowStages, eq(schema.workflowStages.id, schema.workItems.currentStageId))
      .where(
        and(
          eq(schema.workItems.assignedStaffId, staffProfileId),
          eq(schema.workItems.status, 'in_progress'),
          eq(schema.workflowStages.sequence, 1),
        ),
      )

    const [{ overdueTasks }] = await this.db
      .select({ overdueTasks: sql<number>`count(*)::int` })
      .from(schema.workItems)
      .innerJoin(schema.workflowStages, eq(schema.workflowStages.id, schema.workItems.currentStageId))
      .innerJoin(
        schema.workItemStageEvents,
        and(
          eq(schema.workItemStageEvents.workItemId, schema.workItems.id),
          sql`${schema.workItemStageEvents.exitedAt} is null`,
        ),
      )
      .where(
        and(
          eq(schema.workItems.assignedStaffId, staffProfileId),
          eq(schema.workItems.status, 'in_progress'),
          sql`${schema.workflowStages.targetWaitMinutes} is not null`,
          sql`extract(epoch from (now() - ${schema.workItemStageEvents.enteredAt})) / 60 > ${schema.workflowStages.targetWaitMinutes}`,
        ),
      )

    return {
      assignedTasks: Number(assignedTasks),
      pendingTasks: Number(pendingTasks),
      overdueTasks: Number(overdueTasks),
    }
  }

  private capacityStatus(capacityPct: number): 'normal' | 'watch' | 'critical' {
    if (capacityPct < 70) return 'normal'
    if (capacityPct <= 95) return 'watch'
    return 'critical'
  }

  async create(organizationId: string, dto: CreateStaffProfileDto, actingUserId: string) {
    const [membership] = await this.db
      .select()
      .from(schema.memberships)
      .where(and(eq(schema.memberships.id, dto.membershipId), eq(schema.memberships.organizationId, organizationId)))
      .limit(1)

    if (!membership) {
      throw new NotFoundException('Membership not found in this organization.')
    }

    const existing = await this.db
      .select()
      .from(schema.staffProfiles)
      .where(eq(schema.staffProfiles.membershipId, dto.membershipId))
      .limit(1)

    if (existing.length > 0) {
      throw new ConflictException('This member already has a staff profile.')
    }

    const [profile] = await this.db
      .insert(schema.staffProfiles)
      .values({
        membershipId: dto.membershipId,
        shift: dto.shift,
        taskCapacity: dto.taskCapacity ?? 12,
        competencies: dto.competencies ?? [],
        available: dto.available ?? true,
      })
      .returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'workforce.staff.create',
      entityType: 'staff_profile',
      entityId: profile.id,
    })

    return profile
  }

  async update(organizationId: string, staffProfileId: string, dto: UpdateStaffProfileDto, actingUserId: string) {
    const [row] = await this.db
      .select({ profile: schema.staffProfiles })
      .from(schema.staffProfiles)
      .innerJoin(schema.memberships, eq(schema.memberships.id, schema.staffProfiles.membershipId))
      .where(and(eq(schema.staffProfiles.id, staffProfileId), eq(schema.memberships.organizationId, organizationId)))
      .limit(1)

    if (!row) {
      throw new NotFoundException('Staff profile not found.')
    }

    const [updated] = await this.db
      .update(schema.staffProfiles)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.staffProfiles.id, staffProfileId))
      .returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'workforce.staff.update',
      entityType: 'staff_profile',
      entityId: staffProfileId,
      metadata: dto,
    })

    return updated
  }
}
