import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'

export class CreateIncidentDto {
  @IsUUID()
  departmentId!: string

  @IsOptional()
  @IsUUID()
  equipmentId?: string

  @IsString()
  @MinLength(1)
  title!: string

  /** Freeform category (e.g. "Equipment Failure", "QC Failure", "Safety"). */
  @IsString()
  @MinLength(1)
  type!: string

  @IsIn(['low', 'moderate', 'high', 'critical'])
  severity!: 'low' | 'moderate' | 'high' | 'critical'

  @IsString()
  @MinLength(1)
  description!: string

  @IsOptional()
  @IsString()
  immediateAction?: string

  @IsOptional()
  @IsDateString()
  dueDate?: string

  @IsOptional()
  @IsUUID()
  ownerUserId?: string
}
