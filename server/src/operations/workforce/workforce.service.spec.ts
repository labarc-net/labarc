import { WorkforceService } from './workforce.service'

describe('WorkforceService (pure logic)', () => {
  const service = new WorkforceService({} as never, {} as never)

  it.each([
    [0, 'normal'],
    [69, 'normal'],
    [70, 'watch'],
    [95, 'watch'],
    [96, 'critical'],
    [150, 'critical'],
  ])('capacityStatus(%i) -> %s', (pct, expected) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((service as any).capacityStatus(pct)).toBe(expected)
  })
})
