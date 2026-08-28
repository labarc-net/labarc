import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { PermissionsGuard } from '../../common/guards/permissions.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { PERMISSION_KEYS } from '../../common/security/permissions.constants'
import { CreateStaffProfileDto } from './dto/create-staff-profile.dto'
import { UpdateStaffProfileDto } from './dto/update-staff-profile.dto'
import { WorkforceService } from './workforce.service'

@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('organizations/:organizationId/operations/workforce/staff')
export class WorkforceController {
  constructor(private readonly workforceService: WorkforceService) {}

  @RequirePermissions(PERMISSION_KEYS.WORKFORCE_READ)
  @Get()
  list(@Param('organizationId') organizationId: string, @Query('departmentId') departmentId?: string) {
    return this.workforceService.list(organizationId, departmentId)
  }

  @RequirePermissions(PERMISSION_KEYS.WORKFORCE_MANAGE)
  @Post()
  create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateStaffProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workforceService.create(organizationId, dto, user.id)
  }

  @RequirePermissions(PERMISSION_KEYS.WORKFORCE_MANAGE)
  @Patch(':staffProfileId')
  update(
    @Param('organizationId') organizationId: string,
    @Param('staffProfileId') staffProfileId: string,
    @Body() dto: UpdateStaffProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workforceService.update(organizationId, staffProfileId, dto, user.id)
  }
}
