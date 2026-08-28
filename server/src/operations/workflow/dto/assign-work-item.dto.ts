import { IsOptional, IsUUID } from 'class-validator'

export class AssignWorkItemDto {
  /** Pass null to unassign. */
  @IsOptional()
  @IsUUID()
  staffProfileId?: string | null
}
