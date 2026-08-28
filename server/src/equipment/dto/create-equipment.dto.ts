import { IsDateString, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'

export class CreateEquipmentDto {
  @IsUUID()
  departmentId!: string

  @IsString()
  @MinLength(1)
  name!: string

  @IsString()
  @MinLength(1)
  model!: string

  @IsString()
  @MinLength(1)
  manufacturer!: string

  @IsString()
  @MinLength(1)
  serialNumber!: string

  @IsString()
  @MinLength(1)
  location!: string

  @IsDateString()
  installedOn!: string

  @IsOptional()
  @IsDateString()
  warrantyUntil?: string

  @IsOptional()
  @IsString()
  serviceProvider?: string
}
