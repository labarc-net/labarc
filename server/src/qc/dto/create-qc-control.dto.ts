import { IsNumber, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'

export class CreateQcControlDto {
  @IsUUID()
  departmentId!: string

  @IsOptional()
  @IsUUID()
  equipmentId?: string

  @IsString()
  @MinLength(1)
  analyte!: string

  @IsString()
  @MinLength(1)
  level!: string

  @IsString()
  @MinLength(1)
  instrumentLabel!: string

  @IsNumber()
  targetMean!: number

  @IsNumber()
  targetSd!: number

  @IsString()
  @MinLength(1)
  unit!: string
}
