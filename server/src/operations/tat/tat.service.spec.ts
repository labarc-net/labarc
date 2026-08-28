import { TatService } from './tat.service'

describe('TatService (pure logic)', () => {
  const service = new TatService({} as never)

  describe('predictBreach', () => {
    it('flags a breach when current TAT already exceeds target', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).predictBreach({
        queue: 5,
        throughputPerHour: 2,
        targetMinutes: 60,
        currentMinutes: 90,
      })
      expect(result).toBe(30)
    })

    it('returns null when the queue is empty', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).predictBreach({
        queue: 0,
        throughputPerHour: 0,
        targetMinutes: 60,
        currentMinutes: 10,
      })
      expect(result).toBeNull()
    })

    it('returns null when there is no completed-item data yet to project from', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).predictBreach({
        queue: 10,
        throughputPerHour: 0,
        targetMinutes: 60,
        currentMinutes: 0,
      })
      expect(result).toBeNull()
    })

    it('projects a breach from queue size and throughput', () => {
      // 12 items at 2/hour = 6 hours = 360 min to clear, target is 60 min
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).predictBreach({
        queue: 12,
        throughputPerHour: 2,
        targetMinutes: 60,
        currentMinutes: 30,
      })
      expect(result).toBe(300)
    })

    it('returns null when comfortably within target', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).predictBreach({
        queue: 2,
        throughputPerHour: 10,
        targetMinutes: 60,
        currentMinutes: 20,
      })
      expect(result).toBeNull()
    })
  })
})
