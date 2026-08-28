import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { TenantGuard } from '../common/guards/tenant.guard'
import { PERMISSION_KEYS } from '../common/security/permissions.constants'
import { CreateEquipmentDto } from './dto/create-equipment.dto'
import { RecordErrorEventDto } from './dto/record-error-event.dto'
import { RecordTelemetryDto } from './dto/record-telemetry.dto'
import { UpdateEquipmentDto } from './dto/update-equipment.dto'
import { EquipmentService } from './equipment.service'

@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('organizations/:organizationId/equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @RequirePermissions(PERMISSION_KEYS.EQUIPMENT_READ)
  @Get()
  list(@Param('organizationId') organizationId: string, @Query('departmentId') departmentId?: string) {
    return this.equipmentService.list(organizationId, departmentId)
  }

  @RequirePermissions(PERMISSION_KEYS.EQUIPMENT_READ)
  @Get(':equipmentId')
  get(@Param('organizationId') organizationId: string, @Param('equipmentId') equipmentId: string) {
    return this.equipmentService.getById(organizationId, equipmentId)
  }

  @RequirePermissions(PERMISSION_KEYS.EQUIPMENT_MANAGE)
  @Post()
  create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateEquipmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.equipmentService.create(organizationId, dto, user.id)
  }

  @RequirePermissions(PERMISSION_KEYS.EQUIPMENT_MANAGE)
  @Patch(':equipmentId')
  update(
    @Param('organizationId') organizationId: string,
    @Param('equipmentId') equipmentId: string,
    @Body() dto: UpdateEquipmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.equipmentService.update(organizationId, equipmentId, dto, user.id)
  }

  @RequirePermissions(PERMISSION_KEYS.EQUIPMENT_MANAGE)
  @Post(':equipmentId/telemetry')
  recordTelemetry(
    @Param('organizationId') organizationId: string,
    @Param('equipmentId') equipmentId: string,
    @Body() dto: RecordTelemetryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.equipmentService.recordTelemetry(organizationId, equipmentId, dto, user.id)
  }

  @RequirePermissions(PERMISSION_KEYS.EQUIPMENT_MANAGE)
  @Post(':equipmentId/errors')
  recordErrorEvent(
    @Param('organizationId') organizationId: string,
    @Param('equipmentId') equipmentId: string,
    @Body() dto: RecordErrorEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.equipmentService.recordErrorEvent(organizationId, equipmentId, dto, user.id)
  }

  @RequirePermissions(PERMISSION_KEYS.EQUIPMENT_MANAGE)
  @Post(':equipmentId/downtime/start')
  startDowntime(
    @Param('organizationId') organizationId: string,
    @Param('equipmentId') equipmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.equipmentService.startDowntime(organizationId, equipmentId, user.id)
  }

  @RequirePermissions(PERMISSION_KEYS.EQUIPMENT_MANAGE)
  @Patch(':equipmentId/downtime/end')
  endDowntime(
    @Param('organizationId') organizationId: string,
    @Param('equipmentId') equipmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.equipmentService.endDowntime(organizationId, equipmentId, user.id)
  }
}
