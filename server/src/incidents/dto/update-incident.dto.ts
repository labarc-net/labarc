import { IsArray, IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator'

export class UpdateIncidentDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsIn(['low', 'moderate', 'high', 'critical'])
  severity?: 'low' | 'moderate' | 'high' | 'critical'

  @IsOptional()
  @IsIn(['open', 'investigating', 'capa', 'resolved', 'closed'])
  status?: 'open' | 'investigating' | 'capa' | 'resolved' | 'closed'

  @IsOptional()
  @IsUUID()
  ownerUserId?: string

  @IsOptional()
  @IsString()
  immediateAction?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rootCauses?: string[]

  @IsOptional()
  @IsString()
  correctiveAction?: string

  @IsOptional()
  @IsString()
  preventiveAction?: string

  @IsOptional()
  @IsDateString()
  dueDate?: string
}
