import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator'

export class UpdateQcControlDto {
  @IsOptional()
  @IsNumber()
  targetMean?: number

  @IsOptional()
  @IsNumber()
  targetSd?: number

  @IsOptional()
  @IsString()
  @MinLength(1)
  instrumentLabel?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  unit?: string
}
