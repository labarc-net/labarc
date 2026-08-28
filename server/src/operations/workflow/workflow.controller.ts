import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { PermissionsGuard } from '../../common/guards/permissions.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { PERMISSION_KEYS } from '../../common/security/permissions.constants'
import { AdvanceWorkItemDto } from './dto/advance-work-item.dto'
import { AssignWorkItemDto } from './dto/assign-work-item.dto'
import { CreateWorkItemDto } from './dto/create-work-item.dto'
import { WorkflowService } from './workflow.service'

@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('organizations/:organizationId/operations/workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @RequirePermissions(PERMISSION_KEYS.OPERATIONS_READ)
  @Get('stages')
  stages(@Param('organizationId') organizationId: string) {
    return this.workflowService.listStages(organizationId)
  }

  @RequirePermissions(PERMISSION_KEYS.OPERATIONS_READ)
  @Get('board')
  board(@Param('organizationId') organizationId: string, @Query('departmentId') departmentId?: string) {
    return this.workflowService.getBoard(organizationId, departmentId)
  }

  @RequirePermissions(PERMISSION_KEYS.OPERATIONS_READ)
  @Get('items')
  items(
    @Param('organizationId') organizationId: string,
    @Query('departmentId') departmentId?: string,
    @Query('stageKey') stageKey?: string,
    @Query('status') status?: 'in_progress' | 'completed' | 'cancelled',
    @Query('assignedStaffId') assignedStaffId?: string,
  ) {
    return this.workflowService.listItems(organizationId, { departmentId, stageKey, status, assignedStaffId })
  }

  @RequirePermissions(PERMISSION_KEYS.OPERATIONS_MANAGE)
  @Post('items')
  create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateWorkItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workflowService.create(organizationId, dto, user.id)
  }

  @RequirePermissions(PERMISSION_KEYS.OPERATIONS_MANAGE)
  @Patch('items/:itemId/advance')
  advance(
    @Param('organizationId') organizationId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AdvanceWorkItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workflowService.advance(organizationId, itemId, dto, user.id)
  }

  @RequirePermissions(PERMISSION_KEYS.OPERATIONS_MANAGE)
  @Patch('items/:itemId/complete')
  complete(
    @Param('organizationId') organizationId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workflowService.complete(organizationId, itemId, user.id)
  }

  @RequirePermissions(PERMISSION_KEYS.OPERATIONS_MANAGE)
  @Patch('items/:itemId/assign')
  assign(
    @Param('organizationId') organizationId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AssignWorkItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workflowService.assign(organizationId, itemId, dto, user.id)
  }
}
