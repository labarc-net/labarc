import { Injectable } from '@nestjs/common'

export interface EquipmentHealthInput {
  errorEventsLast7Days: number
  telemetryDrifts: { metricKey: string; driftPct: number }[]
  /** null = no scheduled maintenance; negative = overdue by that many days. */
  daysUntilNextMaintenance: number | null
  downtimeHoursThisMonth: number
  utilizationPct: number | null
  /** Worst QC risk among QC controls linked to this equipment (Phase 5). null = none linked yet. */
  qcRiskLevel: 'low' | 'moderate' | 'high' | 'critical' | null
}

export interface EquipmentHealthResult {
  healthScore: number
  status: 'operational' | 'watch' | 'at-risk' | 'critical'
  failureRisk: 'low' | 'moderate' | 'high' | 'critical'
}

const WEIGHTS = {
  errorEventPoints: 3,
  errorEventsCap: 30,
  driftThresholdPct: 15,
  driftCap: 20,
  maintenanceOverdue: 15,
  maintenanceDueSoon: 5,
  maintenanceDueSoonWindowDays: 3,
  downtimeHourPoints: 1,
  downtimeCap: 15,
  utilizationOverloadThreshold: 90,
  utilizationOverloadPoints: 10,
}

const QC_RISK_DEDUCTIONS: Record<'low' | 'moderate' | 'high' | 'critical', number> = {
  low: 0,
  moderate: 10,
  high: 20,
  critical: 30,
}

/**
 * Transparent, rules-based equipment health scoring — per the spec's
 * explicit instruction to start with a rules-based model and not pretend
 * an ML model exists. Every deduction below is explainable; there's no
 * hidden weighting or trained component. QC risk (qcRiskLevel) was a
 * documented-but-missing input through Phase 4 — Phase 5's QC module
 * (Westgard rules + trend detection) fills it in here. Equipment age
 * remains a documented future contributor.
 */
@Injectable()
export class EquipmentHealthService {
  compute(input: EquipmentHealthInput): EquipmentHealthResult {
    let deductions = 0

    deductions += Math.min(WEIGHTS.errorEventsCap, input.errorEventsLast7Days * WEIGHTS.errorEventPoints)

    const maxAbsDrift = input.telemetryDrifts.reduce((max, d) => Math.max(max, Math.abs(d.driftPct)), 0)
    if (maxAbsDrift > WEIGHTS.driftThresholdPct) {
      deductions += Math.min(WEIGHTS.driftCap, Math.round(maxAbsDrift - WEIGHTS.driftThresholdPct))
    }

    if (input.daysUntilNextMaintenance !== null) {
      if (input.daysUntilNextMaintenance < 0) {
        deductions += WEIGHTS.maintenanceOverdue
      } else if (input.daysUntilNextMaintenance <= WEIGHTS.maintenanceDueSoonWindowDays) {
        deductions += WEIGHTS.maintenanceDueSoon
      }
    }

    deductions += Math.min(WEIGHTS.downtimeCap, input.downtimeHoursThisMonth * WEIGHTS.downtimeHourPoints)

    if (input.utilizationPct !== null && input.utilizationPct > WEIGHTS.utilizationOverloadThreshold) {
      deductions += WEIGHTS.utilizationOverloadPoints
    }

    if (input.qcRiskLevel !== null) {
      deductions += QC_RISK_DEDUCTIONS[input.qcRiskLevel]
    }

    const healthScore = Math.max(0, Math.round(100 - deductions))

    return {
      healthScore,
      status: this.statusFromScore(healthScore),
      failureRisk: this.riskFromScore(healthScore),
    }
  }

  computeDrift(recent: number | null, baseline: number | null): number {
    if (recent === null || baseline === null || baseline === 0) return 0
    return Math.round(((recent - baseline) / Math.abs(baseline)) * 100)
  }

  driftStatus(driftPct: number): 'healthy' | 'watch' | 'at-risk' {
    const abs = Math.abs(driftPct)
    if (abs < 10) return 'healthy'
    if (abs < 25) return 'watch'
    return 'at-risk'
  }

  /**
   * Mirrors the frontend's healthLevel() breakpoints (spec §12), collapsed
   * to EquipmentStatus's computed levels — 'offline' is a manual state set
   * on the equipment record itself, never derived from the score.
   */
  private statusFromScore(score: number): 'operational' | 'watch' | 'at-risk' | 'critical' {
    if (score >= 80) return 'operational'
    if (score >= 60) return 'watch'
    if (score >= 40) return 'at-risk'
    return 'critical'
  }

  private riskFromScore(score: number): 'low' | 'moderate' | 'high' | 'critical' {
    if (score >= 80) return 'low'
    if (score >= 60) return 'moderate'
    if (score >= 40) return 'high'
    return 'critical'
  }
}
