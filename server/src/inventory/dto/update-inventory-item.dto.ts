import { IsDateString, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator'

export class UpdateInventoryItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  lot?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  unit?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderLevel?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  leadTimeDays?: number

  @IsOptional()
  @IsDateString()
  expiry?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  supplier?: string
}
