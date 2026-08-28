import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator'

const CATEGORIES = ['reagent', 'control', 'calibrator', 'consumable', 'spare_part', 'ppe'] as const

export class CreateInventoryItemDto {
  @IsUUID()
  departmentId!: string

  @IsString()
  @MinLength(1)
  name!: string

  @IsIn(CATEGORIES)
  category!: (typeof CATEGORIES)[number]

  @IsString()
  @MinLength(1)
  lot!: string

  @IsString()
  @MinLength(1)
  unit!: string

  @IsNumber()
  @Min(0)
  reorderLevel!: number

  @IsNumber()
  @Min(0)
  leadTimeDays!: number

  @IsOptional()
  @IsDateString()
  expiry?: string

  @IsString()
  @MinLength(1)
  supplier!: string

  /** Optional starting stock — recorded as an initial 'received' movement. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialStock?: number
}
