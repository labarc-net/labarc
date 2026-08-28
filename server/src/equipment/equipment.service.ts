import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, asc, desc, eq, gte, sql } from 'drizzle-orm'
import { AuditService } from '../audit/audit.service'
import { DRIZZLE_CLIENT } from '../database/database.module'
import type { DrizzleClient } from '../database/drizzle/client'
import * as schema from '../database/drizzle/schema'
import { QcService } from '../qc/qc.service'
import type { CreateEquipmentDto } from './dto/create-equipment.dto'
import type { RecordErrorEventDto } from './dto/record-error-event.dto'
import type { RecordTelemetryDto } from './dto/record-telemetry.dto'
import type { UpdateEquipmentDto } from './dto/update-equipment.dto'
import { EquipmentHealthService } from './health/equipment-health.service'

const METRIC_LABELS: Record<string, { label: string; unit: string }> = {
  temperature: { label: 'Temperature', unit: '°C' },
  vibration: { label: 'Vibration', unit: 'mm/s' },
  power: { label: 'Power', unit: 'kW' },
  utilization: { label: 'Utilization', unit: '%' },
}

@Injectable()
export class EquipmentService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly audit: AuditService,
    private readonly health: EquipmentHealthService,
    private readonly qc: QcService,
  ) {}

  /** Lighter summary shape — no full telemetry point history or error-code list. */
  async list(organizationId: string, departmentId?: string) {
    const conditions = [eq(schema.equipment.organizationId, organizationId)]
    if (departmentId) conditions.push(eq(schema.equipment.departmentId, departmentId))

    const rows = await this.db
      .select()
      .from(schema.equipment)
      .where(and(...conditions))

    const results = []
    for (const row of rows) {
      results.push(await this.buildSummary(row))
    }
    return results
  }

  /** Full detail shape — adds errorCodes[] and telemetry[] (with points). */
  async getById(organizationId: string, equipmentId: string) {
    const row = await this.findRecord(organizationId, equipmentId)
    const summary = await this.buildSummary(row)
    const errorCodes = await this.getErrorCodesSummary(equipmentId)
    const telemetry = await this.getTelemetrySeries(equipmentId, true)

    return { ...summary, errorCodes, telemetry }
  }

  async create(organizationId: string, dto: CreateEquipmentDto, actingUserId: string) {
    const [department] = await this.db
      .select()
      .from(schema.departments)
      .where(and(eq(schema.departments.id, dto.departmentId), eq(schema.departments.organizationId, organizationId)))
      .limit(1)

    if (!department) {
      throw new NotFoundException('Department not found in this organization.')
    }

    const existing = await this.db
      .select()
      .from(schema.equipment)
      .where(and(eq(schema.equipment.organizationId, organizationId), eq(schema.equipment.serialNumber, dto.serialNumber)))
      .limit(1)

    if (existing.length > 0) {
      throw new ConflictException(`Equipment with serial number "${dto.serialNumber}" already exists in this organization.`)
    }

    const [record] = await this.db
      .insert(schema.equipment)
      .values({
        organizationId,
        departmentId: dto.departmentId,
        name: dto.name,
        model: dto.model,
        manufacturer: dto.manufacturer,
        serialNumber: dto.serialNumber,
        location: dto.location,
        installedOn: new Date(dto.installedOn),
        warrantyUntil: dto.warrantyUntil ? new Date(dto.warrantyUntil) : null,
        serviceProvider: dto.serviceProvider,
      })
      .returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'equipment.create',
      entityType: 'equipment',
      entityId: record.id,
    })

    return this.buildSummary(record)
  }

  async update(organizationId: string, equipmentId: string, dto: UpdateEquipmentDto, actingUserId: string) {
    await this.findRecord(organizationId, equipmentId)

    const patch: Record<string, unknown> = { ...dto, updatedAt: new Date() }
    if (dto.warrantyUntil) patch.warrantyUntil = new Date(dto.warrantyUntil)

    const [updated] = await this.db
      .update(schema.equipment)
      .set(patch)
      .where(eq(schema.equipment.id, equipmentId))
      .returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'equipment.update',
      entityType: 'equipment',
      entityId: equipmentId,
      metadata: dto,
    })

    return this.buildSummary(updated)
  }

  async recordTelemetry(organizationId: string, equipmentId: string, dto: RecordTelemetryDto, actingUserId: string) {
    await this.findRecord(organizationId, equipmentId)

    const [reading] = await this.db
      .insert(schema.equipmentTelemetryReadings)
      .values({ equipmentId, metricKey: dto.metricKey, unit: dto.unit, value: dto.value })
      .returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'equipment.telemetry.record',
      entityType: 'equipment',
      entityId: equipmentId,
      metadata: { metricKey: dto.metricKey, value: dto.value },
    })

    return reading
  }

  async recordErrorEvent(organizationId: string, equipmentId: string, dto: RecordErrorEventDto, actingUserId: string) {
    await this.findRecord(organizationId, equipmentId)

    const [event] = await this.db.insert(schema.equipmentErrorEvents).values({ equipmentId, code: dto.code }).returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'equipment.error.record',
      entityType: 'equipment',
      entityId: equipmentId,
      metadata: { code: dto.code },
    })

    return event
  }

  async startDowntime(organizationId: string, equipmentId: string, actingUserId: string) {
    await this.findRecord(organizationId, equipmentId)

    const open = await this.db
      .select()
      .from(schema.equipmentDowntimeEvents)
      .where(
        and(
          eq(schema.equipmentDowntimeEvents.equipmentId, equipmentId),
          sql`${schema.equipmentDowntimeEvents.endedAt} is null`,
        ),
      )
      .limit(1)

    if (open.length > 0) {
      throw new ConflictException('This equipment already has an open downtime event.')
    }

    const [event] = await this.db.insert(schema.equipmentDowntimeEvents).values({ equipmentId }).returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'equipment.downtime.start',
      entityType: 'equipment',
      entityId: equipmentId,
    })

    return event
  }

  async endDowntime(organizationId: string, equipmentId: string, actingUserId: string) {
    await this.findRecord(organizationId, equipmentId)

    const [open] = await this.db
      .select()
      .from(schema.equipmentDowntimeEvents)
      .where(
        and(
          eq(schema.equipmentDowntimeEvents.equipmentId, equipmentId),
          sql`${schema.equipmentDowntimeEvents.endedAt} is null`,
        ),
      )
      .limit(1)

    if (!open) {
      throw new NotFoundException('No open downtime event for this equipment.')
    }

    const [updated] = await this.db
      .update(schema.equipmentDowntimeEvents)
      .set({ endedAt: new Date() })
      .where(eq(schema.equipmentDowntimeEvents.id, open.id))
      .returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'equipment.downtime.end',
      entityType: 'equipment',
      entityId: equipmentId,
    })

    return updated
  }

  private async findRecord(organizationId: string, equipmentId: string) {
    const [row] = await this.db
      .select()
      .from(schema.equipment)
      .where(and(eq(schema.equipment.id, equipmentId), eq(schema.equipment.organizationId, organizationId)))
      .limit(1)

    if (!row) {
      throw new NotFoundException('Equipment not found.')
    }
    return row
  }

  private async buildSummary(row: typeof schema.equipment.$inferSelect) {
    const [errorEventsLast7Days, downtimeHoursMonth, nextMaintenance, lastMaintenance, utilization, driftSeries, qcRiskLevel] =
      await Promise.all([
        this.countRecentErrorEvents(row.id, 7),
        this.getDowntimeHoursThisMonth(row.id),
        this.getNextMaintenanceDate(row.organizationId, row.id),
        this.getLastMaintenanceDate(row.organizationId, row.id),
        this.getLatestUtilization(row.id),
        this.getTelemetrySeries(row.id, false),
        this.qc.getWorstRiskForEquipment(row.id),
      ])

    const daysUntilNextMaintenance = nextMaintenance
      ? Math.floor((nextMaintenance.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : null

    const { healthScore, status: computedStatus, failureRisk } = this.health.compute({
      errorEventsLast7Days,
      telemetryDrifts: driftSeries.map((s) => ({ metricKey: s.key, driftPct: s.drift })),
      daysUntilNextMaintenance,
      downtimeHoursThisMonth: downtimeHoursMonth,
      utilizationPct: utilization,
      qcRiskLevel,
    })

    const status = row.operationalState === 'offline' ? 'offline' : computedStatus

    return {
      id: row.id,
      organizationId: row.organizationId,
      departmentId: row.departmentId,
      name: row.name,
      model: row.model,
      manufacturer: row.manufacturer,
      serialNumber: row.serialNumber,
      location: row.location,
      installedOn: row.installedOn,
      warrantyUntil: row.warrantyUntil,
      serviceProvider: row.serviceProvider,
      status,
      healthScore,
      failureRisk,
      utilization: utilization ?? 0,
      downtimeHoursMonth,
      nextMaintenance,
      lastMaintenance,
    }
  }

  private async getTelemetrySeries(equipmentId: string, includePoints: boolean) {
    const metricRows = await this.db
      .selectDistinct({
        metricKey: schema.equipmentTelemetryReadings.metricKey,
        unit: schema.equipmentTelemetryReadings.unit,
      })
      .from(schema.equipmentTelemetryReadings)
      .where(eq(schema.equipmentTelemetryReadings.equipmentId, equipmentId))

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const series = []

    for (const metric of metricRows) {
      const [{ recentAvg }] = await this.db
        .select({ recentAvg: sql<number | null>`avg(${schema.equipmentTelemetryReadings.value})` })
        .from(schema.equipmentTelemetryReadings)
        .where(
          and(
            eq(schema.equipmentTelemetryReadings.equipmentId, equipmentId),
            eq(schema.equipmentTelemetryReadings.metricKey, metric.metricKey),
            gte(schema.equipmentTelemetryReadings.recordedAt, dayAgo),
          ),
        )

      const [{ baselineAvg }] = await this.db
        .select({ baselineAvg: sql<number | null>`avg(${schema.equipmentTelemetryReadings.value})` })
        .from(schema.equipmentTelemetryReadings)
        .where(
          and(
            eq(schema.equipmentTelemetryReadings.equipmentId, equipmentId),
            eq(schema.equipmentTelemetryReadings.metricKey, metric.metricKey),
            sql`${schema.equipmentTelemetryReadings.recordedAt} < ${dayAgo}`,
          ),
        )

      const recent = recentAvg !== null && recentAvg !== undefined ? Number(recentAvg) : null
      const baseline = baselineAvg !== null && baselineAvg !== undefined ? Number(baselineAvg) : null
      const drift = this.health.computeDrift(recent, baseline)

      let points: { t: string; value: number }[] = []
      if (includePoints) {
        const pointRows = await this.db
          .select({ t: schema.equipmentTelemetryReadings.recordedAt, value: schema.equipmentTelemetryReadings.value })
          .from(schema.equipmentTelemetryReadings)
          .where(
            and(
              eq(schema.equipmentTelemetryReadings.equipmentId, equipmentId),
              eq(schema.equipmentTelemetryReadings.metricKey, metric.metricKey),
            ),
          )
          .orderBy(desc(schema.equipmentTelemetryReadings.recordedAt))
          .limit(50)
        points = pointRows.reverse().map((p) => ({ t: p.t.toISOString(), value: p.value }))
      }

      const meta = METRIC_LABELS[metric.metricKey] ?? { label: metric.metricKey, unit: metric.unit }

      series.push({
        key: metric.metricKey,
        label: meta.label,
        unit: meta.unit,
        drift,
        status: this.health.driftStatus(drift),
        points,
      })
    }

    return series
  }

  private async getLatestUtilization(equipmentId: string): Promise<number | null> {
    const rows = await this.db
      .select({ value: schema.equipmentTelemetryReadings.value })
      .from(schema.equipmentTelemetryReadings)
      .where(
        and(
          eq(schema.equipmentTelemetryReadings.equipmentId, equipmentId),
          eq(schema.equipmentTelemetryReadings.metricKey, 'utilization'),
        ),
      )
      .orderBy(desc(schema.equipmentTelemetryReadings.recordedAt))
      .limit(1)

    return rows[0]?.value ?? null
  }

  private async getErrorCodesSummary(equipmentId: string) {
    const rows = await this.db
      .select({
        code: schema.equipmentErrorEvents.code,
        count: sql<number>`count(*)::int`,
        lastSeen: sql<Date>`max(${schema.equipmentErrorEvents.occurredAt})`,
      })
      .from(schema.equipmentErrorEvents)
      .where(eq(schema.equipmentErrorEvents.equipmentId, equipmentId))
      .groupBy(schema.equipmentErrorEvents.code)

    return rows.map((r) => ({ code: r.code, count: Number(r.count), lastSeen: r.lastSeen }))
  }

  private async countRecentErrorEvents(equipmentId: string, days: number): Promise<number> {
    const windowStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.equipmentErrorEvents)
      .where(
        and(eq(schema.equipmentErrorEvents.equipmentId, equipmentId), gte(schema.equipmentErrorEvents.occurredAt, windowStart)),
      )
    return Number(count)
  }

  private async getDowntimeHoursThisMonth(equipmentId: string): Promise<number> {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const events = await this.db
      .select()
      .from(schema.equipmentDowntimeEvents)
      .where(
        and(
          eq(schema.equipmentDowntimeEvents.equipmentId, equipmentId),
          sql`(${schema.equipmentDowntimeEvents.endedAt} is null or ${schema.equipmentDowntimeEvents.endedAt} >= ${monthStart})`,
        ),
      )

    let totalMs = 0
    for (const event of events) {
      const start = event.startedAt < monthStart ? monthStart : event.startedAt
      const end = event.endedAt ?? now
      totalMs += Math.max(0, end.getTime() - start.getTime())
    }

    return Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10
  }

  private async getNextMaintenanceDate(organizationId: string, equipmentId: string): Promise<Date | null> {
    const rows = await this.db
      .select({ scheduledFor: schema.maintenanceRecords.scheduledFor })
      .from(schema.maintenanceRecords)
      .where(
        and(
          eq(schema.maintenanceRecords.organizationId, organizationId),
          eq(schema.maintenanceRecords.equipmentId, equipmentId),
          sql`${schema.maintenanceRecords.status} in ('scheduled', 'in_progress')`,
        ),
      )
      .orderBy(asc(schema.maintenanceRecords.scheduledFor))
      .limit(1)

    return rows[0]?.scheduledFor ?? null
  }

  private async getLastMaintenanceDate(organizationId: string, equipmentId: string): Promise<Date | null> {
    const rows = await this.db
      .select({ completedAt: schema.maintenanceRecords.completedAt })
      .from(schema.maintenanceRecords)
      .where(
        and(
          eq(schema.maintenanceRecords.organizationId, organizationId),
          eq(schema.maintenanceRecords.equipmentId, equipmentId),
          eq(schema.maintenanceRecords.status, 'completed'),
        ),
      )
      .orderBy(desc(schema.maintenanceRecords.completedAt))
      .limit(1)

    return rows[0]?.completedAt ?? null
  }
}
