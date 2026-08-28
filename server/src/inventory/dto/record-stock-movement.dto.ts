import { IsIn, IsNumber } from 'class-validator'

const REASONS = ['received', 'consumed', 'adjusted', 'wasted'] as const

export class RecordStockMovementDto {
  /** Positive to add stock (received), negative to remove (consumed/wasted/adjusted down). */
  @IsNumber()
  quantity!: number

  @IsIn(REASONS)
  reason!: (typeof REASONS)[number]
}
