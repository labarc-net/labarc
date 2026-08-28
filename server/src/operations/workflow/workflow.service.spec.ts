import { WorkflowService } from './workflow.service'

describe('WorkflowService (pure logic)', () => {
  const service = new WorkflowService({} as never, {} as never)

  it.each([
    [10, 15, 'normal'],
    [15, 15, 'normal'],
    [20, 15, 'watch'],
    [22, 15, 'watch'],
    [23, 15, 'critical'],
    [10, null, 'normal'],
  ])('waitStatus(%i, %p) -> %s', (avg, target, expected) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((service as any).waitStatus(avg, target)).toBe(expected)
  })
})
