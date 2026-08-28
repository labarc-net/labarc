import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { TenantGuard } from '../common/guards/tenant.guard'
import { PERMISSION_KEYS } from '../common/security/permissions.constants'
import { CreateQcControlDto } from './dto/create-qc-control.dto'
import { RecordQcResultDto } from './dto/record-qc-result.dto'
import { UpdateQcControlDto } from './dto/update-qc-control.dto'
import { QcService } from './qc.service'

@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('organizations/:organizationId/qc')
export class QcController {
  constructor(private readonly qcService: QcService) {}

  @RequirePermissions(PERMISSION_KEYS.QC_READ)
  @Get()
  list(@Param('organizationId') organizationId: string, @Query('departmentId') departmentId?: string) {
    return this.qcService.list(organizationId, departmentId)
  }

  @RequirePermissions(PERMISSION_KEYS.QC_READ)
  @Get(':qcControlId')
  get(@Param('organizationId') organizationId: string, @Param('qcControlId') qcControlId: string) {
    return this.qcService.getById(organizationId, qcControlId)
  }

  @RequirePermissions(PERMISSION_KEYS.QC_MANAGE)
  @Post()
  create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateQcControlDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.qcService.create(organizationId, dto, user)
  }

  @RequirePermissions(PERMISSION_KEYS.QC_MANAGE)
  @Patch(':qcControlId')
  update(
    @Param('organizationId') organizationId: string,
    @Param('qcControlId') qcControlId: string,
    @Body() dto: UpdateQcControlDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.qcService.update(organizationId, qcControlId, dto, user)
  }

  @RequirePermissions(PERMISSION_KEYS.QC_MANAGE)
  @Post(':qcControlId/results')
  recordResult(
    @Param('organizationId') organizationId: string,
    @Param('qcControlId') qcControlId: string,
    @Body() dto: RecordQcResultDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.qcService.recordResult(organizationId, qcControlId, dto, user)
  }
}
