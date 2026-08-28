import { IsInt, Min } from 'class-validator'

export class SetTatTargetDto {
  @IsInt()
  @Min(1)
  targetMinutes!: number
}
