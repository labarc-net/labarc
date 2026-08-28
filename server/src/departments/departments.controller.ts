import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { TenantGuard } from '../common/guards/tenant.guard'
import { PERMISSION_KEYS } from '../common/security/permissions.constants'
import { DepartmentsService } from './departments.service'
import { CreateDepartmentDto } from './dto/create-department.dto'
import { UpdateDepartmentDto } from './dto/update-department.dto'

@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('organizations/:organizationId/departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @RequirePermissions(PERMISSION_KEYS.DEPARTMENTS_READ)
  @Get()
  list(@Param('organizationId') organizationId: string) {
    return this.departmentsService.list(organizationId)
  }

  @RequirePermissions(PERMISSION_KEYS.DEPARTMENTS_MANAGE)
  @Post()
  create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateDepartmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.departmentsService.create(organizationId, dto, user.id)
  }

  @RequirePermissions(PERMISSION_KEYS.DEPARTMENTS_MANAGE)
  @Patch(':departmentId')
  update(
    @Param('organizationId') organizationId: string,
    @Param('departmentId') departmentId: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.departmentsService.update(organizationId, departmentId, dto, user.id)
  }
}
