import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { TenantGuard } from '../common/guards/tenant.guard'
import { PERMISSION_KEYS } from '../common/security/permissions.constants'
import { InviteMemberDto } from './dto/invite-member.dto'
import { UpdateMembershipDto } from './dto/update-membership.dto'
import { MembershipsService } from './memberships.service'

@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('organizations/:organizationId/members')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @RequirePermissions(PERMISSION_KEYS.MEMBERS_READ)
  @Get()
  list(@Param('organizationId') organizationId: string) {
    return this.membershipsService.list(organizationId)
  }

  @RequirePermissions(PERMISSION_KEYS.MEMBERS_MANAGE)
  @Post()
  invite(
    @Param('organizationId') organizationId: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membershipsService.invite(organizationId, dto, user.id)
  }

  @RequirePermissions(PERMISSION_KEYS.MEMBERS_MANAGE)
  @Patch(':membershipId')
  update(
    @Param('organizationId') organizationId: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateMembershipDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membershipsService.update(organizationId, membershipId, dto, user.id)
  }
}
