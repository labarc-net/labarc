import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { RequirePermissions } from '../common/decorators/permissions.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { TenantGuard } from '../common/guards/tenant.guard'
import { PERMISSION_KEYS } from '../common/security/permissions.constants'
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto'
import { RecordStockMovementDto } from './dto/record-stock-movement.dto'
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto'
import { InventoryService } from './inventory.service'

@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('organizations/:organizationId/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @RequirePermissions(PERMISSION_KEYS.INVENTORY_READ)
  @Get()
  list(@Param('organizationId') organizationId: string, @Query('departmentId') departmentId?: string) {
    return this.inventoryService.list(organizationId, departmentId)
  }

  @RequirePermissions(PERMISSION_KEYS.INVENTORY_READ)
  @Get(':itemId')
  get(@Param('organizationId') organizationId: string, @Param('itemId') itemId: string) {
    return this.inventoryService.getById(organizationId, itemId)
  }

  @RequirePermissions(PERMISSION_KEYS.INVENTORY_MANAGE)
  @Post()
  create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateInventoryItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventoryService.create(organizationId, dto, user)
  }

  @RequirePermissions(PERMISSION_KEYS.INVENTORY_MANAGE)
  @Patch(':itemId')
  update(
    @Param('organizationId') organizationId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateInventoryItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventoryService.update(organizationId, itemId, dto, user)
  }

  @RequirePermissions(PERMISSION_KEYS.INVENTORY_MANAGE)
  @Post(':itemId/movements')
  recordMovement(
    @Param('organizationId') organizationId: string,
    @Param('itemId') itemId: string,
    @Body() dto: RecordStockMovementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventoryService.recordMovement(organizationId, itemId, dto, user)
  }
}
