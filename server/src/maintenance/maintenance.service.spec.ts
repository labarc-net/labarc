import { MaintenanceService } from './maintenance.service'

describe('MaintenanceService (pure logic)', () => {
  const service = new MaintenanceService({} as never, {} as never)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function record(status: string, scheduledFor: Date): any {
    return { status, scheduledFor }
  }

  it('reports overdue for a scheduled record past its date', () => {
    const past = new Date(Date.now() - 60 * 60 * 1000)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((service as any).displayStatus(record('scheduled', past))).toBe('overdue')
  })

  it('does not report overdue for a scheduled record in the future', () => {
    const future = new Date(Date.now() + 60 * 60 * 1000)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((service as any).displayStatus(record('scheduled', future))).toBe('scheduled')
  })

  it('passes through non-scheduled statuses unchanged', () => {
    const past = new Date(Date.now() - 60 * 60 * 1000)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((service as any).displayStatus(record('completed', past))).toBe('completed')
  })
})
