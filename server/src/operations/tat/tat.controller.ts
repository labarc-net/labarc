import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { PermissionsGuard } from '../../common/guards/permissions.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { PERMISSION_KEYS } from '../../common/security/permissions.constants'
import { SetTatTargetDto } from './dto/set-tat-target.dto'
import { TatService } from './tat.service'

@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('organizations/:organizationId/operations/tat')
export class TatController {
  constructor(private readonly tatService: TatService) {}

  @RequirePermissions(PERMISSION_KEYS.OPERATIONS_READ)
  @Get()
  list(@Param('organizationId') organizationId: string) {
    return this.tatService.getForOrganization(organizationId)
  }

  @RequirePermissions(PERMISSION_KEYS.OPERATIONS_MANAGE)
  @Patch('targets/:departmentId')
  setTarget(
    @Param('organizationId') organizationId: string,
    @Param('departmentId') departmentId: string,
    @Body() dto: SetTatTargetDto,
  ) {
    return this.tatService.setTarget(organizationId, departmentId, dto.targetMinutes)
  }
}
