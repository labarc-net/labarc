import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator'

export class CreateMaintenanceRecordDto {
  @IsUUID()
  equipmentId!: string

  @IsIn(['preventive', 'corrective', 'calibration', 'inspection'])
  type!: 'preventive' | 'corrective' | 'calibration' | 'inspection'

  @IsDateString()
  scheduledFor!: string

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
