import { InventoryRulesService } from './inventory-rules.service'

describe('InventoryRulesService', () => {
  const service = new InventoryRulesService()
  const now = new Date('2026-01-15T00:00:00Z')

  it('reports ok for healthy stock', () => {
    const result = service.compute({
      currentStock: 500,
      reorderLevel: 100,
      dailyConsumption: 5,
      leadTimeDays: 7,
      expiry: null,
      unit: 'mL',
      now,
    })
    expect(result.status).toBe('ok')
    expect(result.projectedStockoutDays).toBe(100)
  })

  it('reports low when stock is within the buffer above the reorder level', () => {
    // reorderLevel=100, buffer=150; stock=140 is <=150 but >100
    const result = service.compute({
      currentStock: 140,
      reorderLevel: 100,
      dailyConsumption: 2,
      leadTimeDays: 7,
      expiry: null,
      unit: 'mL',
      now,
    })
    expect(result.status).toBe('low')
  })

  it('reports reorder when stock is at or below the reorder level', () => {
    const result = service.compute({
      currentStock: 90,
      reorderLevel: 100,
      dailyConsumption: 2,
      leadTimeDays: 7,
      expiry: null,
      unit: 'mL',
      now,
    })
    expect(result.status).toBe('reorder')
  })

  it('reports stockout-risk when projected days is within the lead time', () => {
    // stock 20, consumption 5/day -> 4 days; lead time 7 -> at risk
    const result = service.compute({
      currentStock: 20,
      reorderLevel: 100,
      dailyConsumption: 5,
      leadTimeDays: 7,
      expiry: null,
      unit: 'mL',
      now,
    })
    expect(result.status).toBe('stockout-risk')
    expect(result.projectedStockoutDays).toBe(4)
  })

  it('reports expiring when expiry is within the warning window', () => {
    const expiry = new Date('2026-01-30T00:00:00Z') // 15 days out
    const result = service.compute({
      currentStock: 500,
      reorderLevel: 100,
      dailyConsumption: 1,
      leadTimeDays: 7,
      expiry,
      unit: 'mL',
      now,
    })
    expect(result.status).toBe('expiring')
  })

  it('prioritizes stockout-risk over expiring', () => {
    const expiry = new Date('2026-01-30T00:00:00Z')
    const result = service.compute({
      currentStock: 10,
      reorderLevel: 100,
      dailyConsumption: 5,
      leadTimeDays: 7,
      expiry,
      unit: 'mL',
      now,
    })
    expect(result.status).toBe('stockout-risk')
  })

  it('returns null projectedStockoutDays when there is no consumption', () => {
    const result = service.compute({
      currentStock: 500,
      reorderLevel: 100,
      dailyConsumption: 0,
      leadTimeDays: 7,
      expiry: null,
      unit: 'mL',
      now,
    })
    expect(result.projectedStockoutDays).toBeNull()
    expect(result.status).toBe('ok')
  })
})
