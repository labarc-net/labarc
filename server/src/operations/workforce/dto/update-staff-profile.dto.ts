import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class UpdateStaffProfileDto {
  @IsOptional()
  @IsIn(['day', 'evening', 'night'])
  shift?: 'day' | 'evening' | 'night'

  @IsOptional()
  @IsInt()
  @Min(1)
  taskCapacity?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  competencies?: string[]

  @IsOptional()
  @IsBoolean()
  available?: boolean
}
