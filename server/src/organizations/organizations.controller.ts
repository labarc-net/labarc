import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Tenant } from '../common/decorators/tenant.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { TenantGuard } from '../common/guards/tenant.guard'
import type { TenantContext } from '../common/types/tenant-context.type'
import { CreateOrganizationDto } from './dto/create-organization.dto'
import { UpdateOrganizationDto } from './dto/update-organization.dto'
import { OrganizationsService } from './organizations.service'

/**
 * Organization creation and platform-level listing. Everything "inside"
 * an organization (departments, members, and future domain modules) lives
 * under /organizations/:organizationId/... and goes through
 * TenantGuard + PermissionsGuard instead — see DepartmentsController and
 * MembershipsController.
 */
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: AuthenticatedUser) {
    if (!user.isSuperAdmin) {
      throw new ForbiddenException('Only a platform super admin can create organizations.')
    }
    return this.organizationsService.create(dto, user.id)
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationsService.listForUser(user.id, user.isSuperAdmin)
  }

  @UseGuards(TenantGuard)
  @Get(':organizationId')
  get(@Param('organizationId') organizationId: string) {
    return this.organizationsService.getById(organizationId)
  }

  @UseGuards(TenantGuard)
  @Patch(':organizationId')
  update(
    @Param('organizationId') organizationId: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
    @Tenant() tenant: TenantContext,
  ) {
    if (tenant.roleKey !== 'org_admin' && tenant.roleKey !== 'super_admin') {
      throw new ForbiddenException('Only an Organization Admin can update organization settings.')
    }
    return this.organizationsService.update(organizationId, dto, user.id)
  }
}
