import { IsOptional, IsString } from 'class-validator'

export class AdvanceWorkItemDto {
  /** Target stage key. Omit to advance to the next stage in sequence. */
  @IsOptional()
  @IsString()
  toStageKey?: string
}
