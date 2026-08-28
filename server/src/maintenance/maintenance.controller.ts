import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { TenantGuard } from '../common/guards/tenant.guard'
import { PERMISSION_KEYS } from '../common/security/permissions.constants'
import { CreateMaintenanceRecordDto } from './dto/create-maintenance-record.dto'
import { UpdateMaintenanceRecordDto } from './dto/update-maintenance-record.dto'
import { MaintenanceService } from './maintenance.service'

@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('organizations/:organizationId/maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @RequirePermissions(PERMISSION_KEYS.MAINTENANCE_READ)
  @Get()
  list(
    @Param('organizationId') organizationId: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('status') status?: string,
  ) {
    return this.maintenanceService.list(organizationId, { equipmentId, status })
  }

  @RequirePermissions(PERMISSION_KEYS.MAINTENANCE_MANAGE)
  @Post()
  create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateMaintenanceRecordDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.maintenanceService.create(organizationId, dto, user.id)
  }

  @RequirePermissions(PERMISSION_KEYS.MAINTENANCE_MANAGE)
  @Patch(':recordId')
  update(
    @Param('organizationId') organizationId: string,
    @Param('recordId') recordId: string,
    @Body() dto: UpdateMaintenanceRecordDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.maintenanceService.update(organizationId, recordId, dto, user.id)
  }
}
