import { IsNumber, IsString, MinLength } from 'class-validator'

export class RecordTelemetryDto {
  @IsString()
  @MinLength(1)
  metricKey!: string

  @IsString()
  @MinLength(1)
  unit!: string

  @IsNumber()
  value!: number
}
