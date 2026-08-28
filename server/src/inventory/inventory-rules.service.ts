import { Injectable } from '@nestjs/common'

export interface InventoryStatusInput {
  currentStock: number
  reorderLevel: number
  dailyConsumption: number
  leadTimeDays: number
  expiry: Date | null
  unit: string
  now?: Date
}

export interface InventoryStatusResult {
  status: 'ok' | 'reorder' | 'low' | 'expiring' | 'stockout-risk'
  projectedStockoutDays: number | null
  recommendation: string
}

const LOW_STOCK_BUFFER_MULTIPLIER = 1.5
const EXPIRY_WARNING_DAYS = 30

/**
 * Transparent, rules-based inventory status — per the spec's "make
 * recommendations explainable" instruction. Precedence (most urgent
 * wins, single status returned): stockout-risk (will run out before a
 * reorder could even arrive) > expiring (a quality concern, independent
 * of quantity) > reorder (at/below the configured reorder level) > low
 * (a soft early warning at 1.5x the reorder level) > ok.
 */
@Injectable()
export class InventoryRulesService {
  compute(input: InventoryStatusInput): InventoryStatusResult {
    const now = input.now ?? new Date()

    const projectedStockoutDays =
      input.dailyConsumption > 0 ? Math.round((input.currentStock / input.dailyConsumption) * 10) / 10 : null

    const isStockoutRisk = projectedStockoutDays !== null && projectedStockoutDays <= input.leadTimeDays
    const isExpiring = input.expiry !== null && this.daysBetween(now, input.expiry) <= EXPIRY_WARNING_DAYS
    const isAtReorderLevel = input.currentStock <= input.reorderLevel
    const isLow = input.currentStock <= input.reorderLevel * LOW_STOCK_BUFFER_MULTIPLIER

    let status: InventoryStatusResult['status']
    if (isStockoutRisk) status = 'stockout-risk'
    else if (isExpiring) status = 'expiring'
    else if (isAtReorderLevel) status = 'reorder'
    else if (isLow) status = 'low'
    else status = 'ok'

    return {
      status,
      projectedStockoutDays,
      recommendation: this.buildRecommendation(status, input, projectedStockoutDays),
    }
  }

  private daysBetween(from: Date, to: Date): number {
    return Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000))
  }

  private buildRecommendation(
    status: InventoryStatusResult['status'],
    input: InventoryStatusInput,
    projectedStockoutDays: number | null,
  ): string {
    switch (status) {
      case 'stockout-risk':
        return `Projected to run out in ${projectedStockoutDays} day(s) — shorter than the ${input.leadTimeDays}-day supplier lead time. Reorder immediately.`
      case 'expiring':
        return `Expires within ${EXPIRY_WARNING_DAYS} days — use existing stock first or arrange a replacement before then.`
      case 'reorder':
        return `Stock at ${input.currentStock} ${input.unit} is at or below the reorder level of ${input.reorderLevel} ${input.unit}. Place a reorder.`
      case 'low':
        return `Stock is running low (${input.currentStock} ${input.unit}) — monitor consumption.`
      default:
        return 'Stock levels are healthy — no action needed.'
    }
  }
}
