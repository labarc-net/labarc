import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, eq, gte, sql } from 'drizzle-orm'
import { DRIZZLE_CLIENT } from '../../database/database.module'
import type { DrizzleClient } from '../../database/drizzle/client'
import * as schema from '../../database/drizzle/schema'

const CURRENT_TAT_WINDOW_HOURS = 4
const HISTORY_WINDOW_HOURS = 24
const DEFAULT_TARGET_MINUTES = 120

@Injectable()
export class TatService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  async getForOrganization(organizationId: string) {
    const departmentRows = await this.db
      .select()
      .from(schema.departments)
      .where(eq(schema.departments.organizationId, organizationId))

    const metrics = []
    for (const department of departmentRows) {
      metrics.push(await this.getForDepartment(department.id, department.name))
    }
    return metrics
  }

  async setTarget(organizationId: string, departmentId: string, targetMinutes: number) {
    const [department] = await this.db
      .select()
      .from(schema.departments)
      .where(and(eq(schema.departments.id, departmentId), eq(schema.departments.organizationId, organizationId)))
      .limit(1)

    if (!department) {
      throw new NotFoundException('Department not found in this organization.')
    }

    const existing = await this.db
      .select()
      .from(schema.departmentTatTargets)
      .where(eq(schema.departmentTatTargets.departmentId, departmentId))
      .limit(1)

    if (existing.length > 0) {
      const [updated] = await this.db
        .update(schema.departmentTatTargets)
        .set({ targetMinutes })
        .where(eq(schema.departmentTatTargets.departmentId, departmentId))
        .returning()
      return updated
    }

    const [created] = await this.db.insert(schema.departmentTatTargets).values({ departmentId, targetMinutes }).returning()
    return created
  }

  private async getForDepartment(departmentId: string, departmentName: string) {
    const targetRows = await this.db
      .select({ targetMinutes: schema.departmentTatTargets.targetMinutes })
      .from(schema.departmentTatTargets)
      .where(eq(schema.departmentTatTargets.departmentId, departmentId))
      .limit(1)

    const targetMinutes = targetRows[0]?.targetMinutes ?? DEFAULT_TARGET_MINUTES

    const windowStart = new Date(Date.now() - CURRENT_TAT_WINDOW_HOURS * 60 * 60 * 1000)

    const [{ currentMinutes, completedCount }] = await this.db
      .select({
        currentMinutes: sql<number | null>`avg(extract(epoch from (${schema.workItems.completedAt} - ${schema.workItems.receivedAt})) / 60)`,
        completedCount: sql<number>`count(*)::int`,
      })
      .from(schema.workItems)
      .where(
        and(
          eq(schema.workItems.departmentId, departmentId),
          eq(schema.workItems.status, 'completed'),
          gte(schema.workItems.completedAt, windowStart),
        ),
      )

    const [{ queue }] = await this.db
      .select({ queue: sql<number>`count(*)::int` })
      .from(schema.workItems)
      .where(and(eq(schema.workItems.departmentId, departmentId), eq(schema.workItems.status, 'in_progress')))

    const [{ totalCapacity }] = await this.db
      .select({ totalCapacity: sql<number>`coalesce(sum(${schema.staffProfiles.taskCapacity}), 0)::int` })
      .from(schema.staffProfiles)
      .innerJoin(schema.memberships, eq(schema.memberships.id, schema.staffProfiles.membershipId))
      .where(eq(schema.memberships.departmentId, departmentId))

    const [{ totalAssigned }] = await this.db
      .select({ totalAssigned: sql<number>`count(*)::int` })
      .from(schema.workItems)
      .innerJoin(schema.staffProfiles, eq(schema.staffProfiles.id, schema.workItems.assignedStaffId))
      .innerJoin(schema.memberships, eq(schema.memberships.id, schema.staffProfiles.membershipId))
      .where(and(eq(schema.memberships.departmentId, departmentId), eq(schema.workItems.status, 'in_progress')))

    const resolvedCurrentMinutes =
      currentMinutes !== null && currentMinutes !== undefined ? Math.round(Number(currentMinutes)) : 0
    const resolvedCapacityPct =
      Number(totalCapacity) > 0 ? Math.round((Number(totalAssigned) / Number(totalCapacity)) * 100) : 0
    const throughputPerHour = Number(completedCount) / CURRENT_TAT_WINDOW_HOURS

    const predictedBreachMinutes = this.predictBreach({
      queue: Number(queue),
      throughputPerHour,
      targetMinutes,
      currentMinutes: resolvedCurrentMinutes,
    })

    const history = await this.getHistory(departmentId)

    return {
      departmentId,
      department: departmentName,
      currentMinutes: resolvedCurrentMinutes,
      targetMinutes,
      queue: Number(queue),
      capacityPct: resolvedCapacityPct,
      predictedBreachMinutes,
      recommendation: this.recommend({ resolvedCapacityPct, predictedBreachMinutes }),
      history,
    }
  }

  /**
   * First-pass, rules-based projection (per LabArc's "start simple, add
   * ML later" guidance) — not a trained model. Flags a likely breach when
   * current TAT is already over target, or when throughput is too slow to
   * clear the queue within target. Returns null when there's no evidence
   * of a breach, and null (rather than a guess) when there's simply not
   * enough completed-item data yet to project from.
   */
  private predictBreach(input: {
    queue: number
    throughputPerHour: number
    targetMinutes: number
    currentMinutes: number
  }): number | null {
    const { queue, throughputPerHour, targetMinutes, currentMinutes } = input

    if (currentMinutes > targetMinutes) {
      return Math.round(currentMinutes - targetMinutes)
    }

    if (queue === 0) {
      return null
    }

    if (throughputPerHour <= 0) {
      return null
    }

    const minutesToClearQueue = (queue / throughputPerHour) * 60
    if (minutesToClearQueue > targetMinutes) {
      return Math.round(minutesToClearQueue - targetMinutes)
    }

    return null
  }

  private recommend(input: { resolvedCapacityPct: number; predictedBreachMinutes: number | null }): string {
    if (input.predictedBreachMinutes !== null) {
      return `Target TAT likely to be exceeded by ~${input.predictedBreachMinutes} min at the current pace — consider reassigning staff or triaging the queue.`
    }
    if (input.resolvedCapacityPct >= 95) {
      return 'Staff capacity is saturated — TAT is at risk if volume increases.'
    }
    return 'Within target — no action needed.'
  }

  private async getHistory(departmentId: string) {
    const windowStart = new Date(Date.now() - HISTORY_WINDOW_HOURS * 60 * 60 * 1000)

    const rows = await this.db
      .select({
        bucket: sql<string>`date_trunc('hour', ${schema.workItems.completedAt})`,
        avgTat: sql<number>`avg(extract(epoch from (${schema.workItems.completedAt} - ${schema.workItems.receivedAt})) / 60)`,
      })
      .from(schema.workItems)
      .where(
        and(
          eq(schema.workItems.departmentId, departmentId),
          eq(schema.workItems.status, 'completed'),
          gte(schema.workItems.completedAt, windowStart),
        ),
      )
      .groupBy(sql`date_trunc('hour', ${schema.workItems.completedAt})`)
      .orderBy(sql`date_trunc('hour', ${schema.workItems.completedAt})`)

    return rows.map((row) => ({ t: row.bucket, tat: Math.round(Number(row.avgTat)) }))
  }
}
