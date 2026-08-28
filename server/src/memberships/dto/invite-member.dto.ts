import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'
import { ROLE_KEYS } from '../../common/security/roles.constants'

const roleKeyValues = Object.values(ROLE_KEYS)

export class InviteMemberDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(2)
  fullName!: string

  @IsIn(roleKeyValues)
  roleKey!: (typeof roleKeyValues)[number]

  @IsOptional()
  @IsUUID()
  departmentId?: string

  /**
   * Temporary password for the invited user. Phase 2 does not implement
   * email delivery / invite links yet — the org admin shares this
   * directly. A proper invite-token + email flow is a good follow-up.
   */
  @IsString()
  @MinLength(8)
  temporaryPassword!: string
}
