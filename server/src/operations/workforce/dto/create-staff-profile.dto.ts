import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator'

export class CreateStaffProfileDto {
  @IsUUID()
  membershipId!: string

  @IsIn(['day', 'evening', 'night'])
  shift!: 'day' | 'evening' | 'night'

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
