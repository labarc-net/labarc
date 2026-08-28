import { IsString, MinLength } from 'class-validator'

export class RecordErrorEventDto {
  @IsString()
  @MinLength(1)
  code!: string
}
