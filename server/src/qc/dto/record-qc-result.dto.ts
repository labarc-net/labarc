import { IsNumber } from 'class-validator'

export class RecordQcResultDto {
  @IsNumber()
  value!: number
}
