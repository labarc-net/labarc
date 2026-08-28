import { EquipmentHealthService } from './equipment-health.service'

describe('EquipmentHealthService', () => {
  const service = new EquipmentHealthService()

  it('scores healthy equipment at 100', () => {
    const result = service.compute({
      errorEventsLast7Days: 0,
      telemetryDrifts: [],
      daysUntilNextMaintenance: 30,
      downtimeHoursThisMonth: 0,
      utilizationPct: 50,
      qcRiskLevel: null,
    })
    expect(result).toEqual({ healthScore: 100, status: 'operational', failureRisk: 'low' })
  })

  it('deducts for overdue maintenance', () => {
    const result = service.compute({
      errorEventsLast7Days: 0,
      telemetryDrifts: [],
      daysUntilNextMaintenance: -2,
      downtimeHoursThisMonth: 0,
      utilizationPct: null,
      qcRiskLevel: null,
    })
    expect(result.healthScore).toBe(85)
    expect(result.status).toBe('operational')
  })

  it('caps error-event deductions', () => {
    const result = service.compute({
      errorEventsLast7Days: 50, // 50*3=150, capped at 30
      telemetryDrifts: [],
      daysUntilNextMaintenance: null,
      downtimeHoursThisMonth: 0,
      utilizationPct: null,
      qcRiskLevel: null,
    })
    expect(result.healthScore).toBe(70)
  })

  it('flags critical status when deductions stack up', () => {
    const result = service.compute({
      errorEventsLast7Days: 50, // -30 (capped)
      telemetryDrifts: [{ metricKey: 'vibration', driftPct: 40 }], // -20 (capped)
      daysUntilNextMaintenance: -5, // -15 (overdue)
      downtimeHoursThisMonth: 20, // -15 (capped)
      utilizationPct: 95, // -10 (overloaded)
      qcRiskLevel: null,
    })
    // 100 - 30 - 20 - 15 - 15 - 10 = 10
    expect(result.healthScore).toBe(10)
    expect(result.status).toBe('critical')
    expect(result.failureRisk).toBe('critical')
  })

  it('deducts for QC risk (Phase 5 input)', () => {
    const base = {
      errorEventsLast7Days: 0,
      telemetryDrifts: [],
      daysUntilNextMaintenance: null,
      downtimeHoursThisMonth: 0,
      utilizationPct: null,
    }
    expect(service.compute({ ...base, qcRiskLevel: 'low' }).healthScore).toBe(100)
    expect(service.compute({ ...base, qcRiskLevel: 'moderate' }).healthScore).toBe(90)
    expect(service.compute({ ...base, qcRiskLevel: 'high' }).healthScore).toBe(80)
    expect(service.compute({ ...base, qcRiskLevel: 'critical' }).healthScore).toBe(70)
  })

  describe('computeDrift', () => {
    it('returns 0 when there is no baseline yet', () => {
      expect(service.computeDrift(50, null)).toBe(0)
    })

    it('computes percentage drift from baseline', () => {
      expect(service.computeDrift(115, 100)).toBe(15)
      expect(service.computeDrift(85, 100)).toBe(-15)
    })
  })

  describe('driftStatus', () => {
    it.each([
      [5, 'healthy'],
      [15, 'watch'],
      [30, 'at-risk'],
      [-30, 'at-risk'],
    ])('driftStatus(%i) -> %s', (drift, expected) => {
      expect(service.driftStatus(drift)).toBe(expected)
    })
  })
})
