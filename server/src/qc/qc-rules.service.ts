import { Injectable } from '@nestjs/common'

export interface WestgardResult {
  flags: string[]
  status: 'in-control' | 'warning' | 'out-of-control'
}

/**
 * Standard Westgard multirule QC — a well-established, fully
 * deterministic statistical method used throughout clinical
 * laboratories, not a model. z-scores are computed against the
 * control's TARGET mean/SD (the established value for that lot), which
 * is standard practice — using a freshly recomputed sample SD instead
 * would make rule violations circular and less meaningful.
 *
 * Rules implemented: 1_2s (warning trigger, not itself a rejection),
 * 1_3s, 2_2s, R_4s, 4_1s, 10x (all rejection rules).
 */
@Injectable()
export class QcRulesService {
  evaluateWestgardRules(recentValues: number[], targetMean: number, targetSd: number): WestgardResult {
    if (targetSd === 0 || recentValues.length === 0) {
      return { flags: [], status: 'in-control' }
    }

    const z = recentValues.map((v) => (v - targetMean) / targetSd)
    const flags: string[] = []
    const last = z[z.length - 1]

    if (Math.abs(last) > 3) flags.push('1_3s')
    if (Math.abs(last) > 2) flags.push('1_2s')

    if (z.length >= 2) {
      const prev = z[z.length - 2]
      if ((last > 2 && prev > 2) || (last < -2 && prev < -2)) flags.push('2_2s')
      if (
        Math.abs(last - prev) > 4 &&
        Math.sign(last) !== Math.sign(prev) &&
        Math.sign(last) !== 0 &&
        Math.sign(prev) !== 0
      ) {
        flags.push('R_4s')
      }
    }

    if (z.length >= 4) {
      const lastFour = z.slice(-4)
      if (lastFour.every((v) => v > 1) || lastFour.every((v) => v < -1)) flags.push('4_1s')
    }

    if (z.length >= 10) {
      const lastTen = z.slice(-10)
      if (lastTen.every((v) => v > 0) || lastTen.every((v) => v < 0)) flags.push('10x')
    }

    const rejectionFlags = flags.filter((f) => f !== '1_2s')
    const status: WestgardResult['status'] =
      rejectionFlags.length > 0 ? 'out-of-control' : flags.length > 0 ? 'warning' : 'in-control'

    return { flags, status }
  }

  /**
   * Simple, explainable trend heuristic: split the recent window in
   * half and compare averages. A shift of more than half a target SD
   * between halves is flagged as drift. Not a regression model — a
   * deliberately simple first pass, same philosophy as TAT prediction
   * and equipment health scoring elsewhere in LabArc.
   */
  detectTrend(recentValues: number[], targetSd: number): 'stable' | 'drifting-up' | 'drifting-down' {
    if (recentValues.length < 4 || targetSd === 0) return 'stable'

    const mid = Math.floor(recentValues.length / 2)
    const firstHalf = recentValues.slice(0, mid)
    const secondHalf = recentValues.slice(mid)
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
    const diff = avg(secondHalf) - avg(firstHalf)
    const threshold = 0.5 * targetSd

    if (diff > threshold) return 'drifting-up'
    if (diff < -threshold) return 'drifting-down'
    return 'stable'
  }

  deriveStatus(
    westgardStatus: WestgardResult['status'],
    trend: 'stable' | 'drifting-up' | 'drifting-down',
  ): { status: 'healthy' | 'watch' | 'critical'; risk: 'low' | 'moderate' | 'high' | 'critical' } {
    if (westgardStatus === 'out-of-control') {
      return { status: 'critical', risk: 'critical' }
    }
    if (westgardStatus === 'warning' || trend !== 'stable') {
      return { status: 'watch', risk: 'moderate' }
    }
    return { status: 'healthy', risk: 'low' }
  }

  buildRecommendation(westgard: WestgardResult, trend: 'stable' | 'drifting-up' | 'drifting-down'): string {
    if (westgard.status === 'out-of-control') {
      const rejectionFlags = westgard.flags.filter((f) => f !== '1_2s')
      return `Out of control (${rejectionFlags.join(', ')}) — reject the run and investigate before reporting patient results.`
    }
    if (trend !== 'stable') {
      return `Trending ${trend === 'drifting-up' ? 'upward' : 'downward'} — review recent calibration and reagent lot changes.`
    }
    if (westgard.status === 'warning') {
      return 'Within limits but flagged for review (1_2s warning) — monitor the next run closely.'
    }
    return 'Within limits — no action needed.'
  }
}
