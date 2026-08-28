import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'

export class UpdateEquipmentDto {
  @IsOptional()
  @IsUUID()
  departmentId?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  model?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  manufacturer?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  location?: string

  @IsOptional()
  @IsDateString()
  warrantyUntil?: string

  @IsOptional()
  @IsString()
  serviceProvider?: string

  @IsOptional()
  @IsIn(['in_service', 'offline'])
  operationalState?: 'in_service' | 'offline'
}
