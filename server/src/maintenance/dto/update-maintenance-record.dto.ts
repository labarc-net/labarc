import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator'

export class UpdateMaintenanceRecordDto {
  @IsOptional()
  @IsIn(['preventive', 'corrective', 'calibration', 'inspection'])
  type?: 'preventive' | 'corrective' | 'calibration' | 'inspection'

  @IsOptional()
  @IsIn(['scheduled', 'in_progress', 'completed', 'cancelled'])
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

  @IsOptional()
  @IsDateString()
  scheduledFor?: string

  @IsOptional()
  @IsUUID()
  technicianStaffProfileId?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  durationHours?: number

  @IsOptional()
  @IsString()
  notes?: string
}
