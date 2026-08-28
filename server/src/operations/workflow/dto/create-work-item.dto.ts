import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'

export class CreateWorkItemDto {
  @IsUUID()
  departmentId!: string

  @IsString()
  @MinLength(1)
  reference!: string

  @IsOptional()
  @IsIn(['routine', 'urgent', 'stat'])
  priority?: 'routine' | 'urgent' | 'stat'
}
