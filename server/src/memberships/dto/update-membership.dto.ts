import { IsIn, IsOptional, IsUUID } from 'class-validator'
import { ROLE_KEYS } from '../../common/security/roles.constants'

const roleKeyValues = Object.values(ROLE_KEYS)
const statusValues = ['active', 'invited', 'disabled'] as const

export class UpdateMembershipDto {
  @IsOptional()
  @IsIn(roleKeyValues)
  roleKey?: (typeof roleKeyValues)[number]

  @IsOptional()
  @IsUUID()
  departmentId?: string

  @IsOptional()
  @IsIn(statusValues)
  status?: (typeof statusValues)[number]
}
