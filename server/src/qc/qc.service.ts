import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, asc, eq } from 'drizzle-orm'
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type'
import { AuditService } from '../audit/audit.service'
import { DRIZZLE_CLIENT } from '../database/database.module'
import type { DrizzleClient } from '../database/drizzle/client'
import * as schema from '../database/drizzle/schema'
import type { CreateQcControlDto } from './dto/create-qc-control.dto'
import type { RecordQcResultDto } from './dto/record-qc-result.dto'
import type { UpdateQcControlDto } from './dto/update-qc-control.dto'
import { QcRulesService } from './qc-rules.service'

/** Recent points considered for mean/SD/CV, trend, and Westgard evaluation. */
const TREND_WINDOW = 20

const SEVERITY_RANK: Record<'low' | 'moderate' | 'high' | 'critical', number> = {
  low: 0,
  moderate: 1,
  high: 2,
  critical: 3,
}

@Injectable()
export class QcService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly audit: AuditService,
    private readonly rules: QcRulesService,
  ) {}

  async list(organizationId: string, departmentId?: string) {
    const conditions = [eq(schema.qcControls.organizationId, organizationId)]
    if (departmentId) conditions.push(eq(schema.qcControls.departmentId, departmentId))

    const rows = await this.db
      .select()
      .from(schema.qcControls)
      .where(and(...conditions))

    const results = []
    for (const row of rows) {
      results.push(await this.buildPanel(row))
    }
    return results
  }

  async getById(organizationId: string, qcControlId: string) {
    const row = await this.findRecord(organizationId, qcControlId)
    return this.buildPanel(row)
  }

  async create(organizationId: string, dto: CreateQcControlDto, actingUser: AuthenticatedUser) {
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

    const [control] = await this.db
      .insert(schema.qcControls)
      .values({
        organizationId,
        departmentId: dto.departmentId,
        equipmentId: dto.equipmentId,
        analyte: dto.analyte,
        level: dto.level,
        instrumentLabel: dto.instrumentLabel,
        targetMean: dto.targetMean,
        targetSd: dto.targetSd,
        unit: dto.unit,
      })
      .returning()

    await this.audit.log({
      userId: actingUser.id,
      organizationId,
      action: 'qc.control.create',
      entityType: 'qc_control',
      entityId: control.id,
    })

    return this.buildPanel(control)
  }

  async update(organizationId: string, qcControlId: string, dto: UpdateQcControlDto, actingUser: AuthenticatedUser) {
    await this.findRecord(organizationId, qcControlId)

    const [updated] = await this.db
      .update(schema.qcControls)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.qcControls.id, qcControlId))
      .returning()

    await this.audit.log({
      userId: actingUser.id,
      organizationId,
      action: 'qc.control.update',
      entityType: 'qc_control',
      entityId: qcControlId,
      metadata: dto,
    })

    return this.buildPanel(updated)
  }

  async recordResult(organizationId: string, qcControlId: string, dto: RecordQcResultDto, actingUser: AuthenticatedUser) {
    await this.findRecord(organizationId, qcControlId)

    const [result] = await this.db
      .insert(schema.qcResults)
      .values({ qcControlId, value: dto.value, recordedByUserId: actingUser.id })
      .returning()

    await this.audit.log({
      userId: actingUser.id,
      organizationId,
      action: 'qc.result.record',
      entityType: 'qc_control',
      entityId: qcControlId,
      metadata: { value: dto.value },
    })

    return result
  }

  /**
   * Used by EquipmentHealthService (via EquipmentService) as the QC-risk
   * input to the health score — the gap documented since Phase 4. Worst
   * (highest-severity) risk across every QC control linked to this piece
   * of equipment; null if none are linked yet.
   */
  async getWorstRiskForEquipment(equipmentId: string): Promise<'low' | 'moderate' | 'high' | 'critical' | null> {
    const controls = await this.db.select().from(schema.qcControls).where(eq(schema.qcControls.equipmentId, equipmentId))
    if (controls.length === 0) return null

    let worst: 'low' | 'moderate' | 'high' | 'critical' = 'low'

    for (const control of controls) {
      const recent = await this.getRecentValues(control.id)
      const westgard = this.rules.evaluateWestgardRules(recent, control.targetMean, control.targetSd)
      const trend = this.rules.detectTrend(recent, control.targetSd)
      const { risk } = this.rules.deriveStatus(westgard.status, trend)

      if (SEVERITY_RANK[risk] > SEVERITY_RANK[worst]) worst = risk
    }

    return worst
  }

  private async findRecord(organizationId: string, qcControlId: string) {
    const [row] = await this.db
      .select()
      .from(schema.qcControls)
      .where(and(eq(schema.qcControls.id, qcControlId), eq(schema.qcControls.organizationId, organizationId)))
      .limit(1)

    if (!row) {
      throw new NotFoundException('QC control not found.')
    }
    return row
  }

  private async getRecentValues(qcControlId: string): Promise<number[]> {
    const rows = await this.db
      .select({ value: schema.qcResults.value })
      .from(schema.qcResults)
      .where(eq(schema.qcResults.qcControlId, qcControlId))
      .orderBy(asc(schema.qcResults.recordedAt))

    return rows.slice(-TREND_WINDOW).map((r) => r.value)
  }

  private async buildPanel(row: typeof schema.qcControls.$inferSelect) {
    const values = await this.getRecentValues(row.id)

    const mean = values.length > 0 ? this.average(values) : row.targetMean
    const sd = values.length > 1 ? this.stdDev(values, mean) : row.targetSd
    const cv = mean !== 0 ? Math.round((sd / Math.abs(mean)) * 1000) / 10 : 0

    const westgard = this.rules.evaluateWestgardRules(values, row.targetMean, row.targetSd)
    const trend = this.rules.detectTrend(values, row.targetSd)
    const { status, risk } = this.rules.deriveStatus(westgard.status, trend)
    const recommendation = this.rules.buildRecommendation(westgard, trend)

    return {
      id: row.id,
      departmentId: row.departmentId,
      equipmentId: row.equipmentId,
      analyte: row.analyte,
      level: row.level,
      instrument: row.instrumentLabel,
      mean: Math.round(mean * 100) / 100,
      sd: Math.round(sd * 100) / 100,
      cv,
      target: row.targetMean,
      unit: row.unit,
      status,
      trend,
      risk,
      westgardFlags: westgard.flags,
      points: values.map((value, i) => ({ n: i + 1, value })),
      recommendation,
    }
  }

  private average(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  private stdDev(values: number[], mean: number): number {
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
    return Math.sqrt(variance)
  }
}
