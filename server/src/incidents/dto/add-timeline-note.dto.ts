import { IsString, MinLength } from 'class-validator'

export class AddTimelineNoteDto {
  @IsString()
  @MinLength(1)
  event!: string
}
