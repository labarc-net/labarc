import { IncidentsService } from './incidents.service'

describe('IncidentsService (pure CAPA state-transition logic)', () => {
  const service = new IncidentsService({} as never, {} as never)

  it('detects a status change', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = service as any
    expect(s.hasStatusChange({ status: 'investigating' }, 'open')).toBe(true)
    expect(s.hasStatusChange({ status: 'open' }, 'open')).toBe(false)
    expect(s.hasStatusChange({}, 'open')).toBe(false)
  })

  it('detects a first-time corrective action', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = service as any
    expect(s.hasNewCorrectiveAction({ correctiveAction: 'Recalibrated' }, { correctiveAction: null })).toBe(true)
    expect(s.hasNewCorrectiveAction({ correctiveAction: 'Recalibrated' }, { correctiveAction: 'Existing' })).toBe(false)
    expect(s.hasNewCorrectiveAction({}, { correctiveAction: null })).toBe(false)
  })

  it('detects a first-time preventive action', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = service as any
    expect(s.hasNewPreventiveAction({ preventiveAction: 'New SOP' }, { preventiveAction: null })).toBe(true)
    expect(s.hasNewPreventiveAction({ preventiveAction: 'New SOP' }, { preventiveAction: 'Old SOP' })).toBe(false)
    expect(s.hasNewPreventiveAction({}, { preventiveAction: null })).toBe(false)
  })

  it('detects a root-cause update', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = service as any
    expect(s.hasRootCauseUpdate({ rootCauses: ['Sensor drift'] })).toBe(true)
    expect(s.hasRootCauseUpdate({ rootCauses: [] })).toBe(false)
    expect(s.hasRootCauseUpdate({})).toBe(false)
  })
})
