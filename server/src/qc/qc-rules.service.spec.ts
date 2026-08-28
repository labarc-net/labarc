import { QcRulesService } from './qc-rules.service'

describe('QcRulesService', () => {
  const service = new QcRulesService()
  const mean = 100
  const sd = 5

  describe('evaluateWestgardRules', () => {
    it('flags nothing for values well within limits', () => {
      const result = service.evaluateWestgardRules([100, 101, 99, 102, 98], mean, sd)
      expect(result.flags).toEqual([])
      expect(result.status).toBe('in-control')
    })

    it('flags 1_3s for a single point beyond 3 SD', () => {
      const result = service.evaluateWestgardRules([100, 101, 117.5], mean, sd) // +3.5 SD
      expect(result.flags).toContain('1_3s')
      expect(result.status).toBe('out-of-control')
    })

    it('flags 2_2s for two consecutive points beyond the same 2 SD side', () => {
      const result = service.evaluateWestgardRules([100, 112.5, 112.5], mean, sd) // +2.5 SD twice
      expect(result.flags).toContain('2_2s')
      expect(result.status).toBe('out-of-control')
    })

    it('flags R_4s for consecutive points spanning opposite 2 SD sides', () => {
      const result = service.evaluateWestgardRules([100, 112.5, 87.5], mean, sd) // +2.5 SD then -2.5 SD
      expect(result.flags).toContain('R_4s')
      expect(result.status).toBe('out-of-control')
    })

    it('flags 4_1s for four consecutive points beyond the same 1 SD side', () => {
      const result = service.evaluateWestgardRules([107.5, 107.5, 107.5, 107.5], mean, sd) // +1.5 SD x4
      expect(result.flags).toContain('4_1s')
      expect(result.status).toBe('out-of-control')
    })

    it('flags 10x for ten consecutive points on the same side of the mean', () => {
      const values = new Array(10).fill(101) // slightly above mean, within 1 SD, all ten
      const result = service.evaluateWestgardRules(values, mean, sd)
      expect(result.flags).toContain('10x')
      expect(result.status).toBe('out-of-control')
    })

    it('treats 1_2s alone as a warning, not a rejection', () => {
      const result = service.evaluateWestgardRules([100, 101, 111], mean, sd) // +2.2 SD
      expect(result.flags).toEqual(['1_2s'])
      expect(result.status).toBe('warning')
    })
  })

  describe('detectTrend', () => {
    it('reports stable for flat data', () => {
      expect(service.detectTrend([100, 100, 100, 100], sd)).toBe('stable')
    })

    it('reports drifting-up when the second half is meaningfully higher', () => {
      expect(service.detectTrend([100, 100, 104, 104], sd)).toBe('drifting-up')
    })

    it('reports drifting-down when the second half is meaningfully lower', () => {
      expect(service.detectTrend([100, 100, 96, 96], sd)).toBe('drifting-down')
    })
  })

  describe('deriveStatus', () => {
    it('maps out-of-control to critical', () => {
      expect(service.deriveStatus('out-of-control', 'stable')).toEqual({ status: 'critical', risk: 'critical' })
    })

    it('maps warning to watch', () => {
      expect(service.deriveStatus('warning', 'stable')).toEqual({ status: 'watch', risk: 'moderate' })
    })

    it('maps an otherwise in-control drift to watch', () => {
      expect(service.deriveStatus('in-control', 'drifting-up')).toEqual({ status: 'watch', risk: 'moderate' })
    })

    it('maps in-control and stable to healthy', () => {
      expect(service.deriveStatus('in-control', 'stable')).toEqual({ status: 'healthy', risk: 'low' })
    })
  })
})
